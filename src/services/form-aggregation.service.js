// ===========================================
// Heisenlink - Form Aggregation Service
// ===========================================
//
// Owner-only reads over responses: paginated individual list, per-question
// summaries, and CSV export. No caching (responses change on every submit).

import prisma from '../config/database.js';
import { assertFormOwner, formatQuestion } from './forms.service.js';
import { escapeCsvField } from '../utils/helpers.js';

const DISPLAY_ONLY = new Set(['SECTION', 'STATEMENT', 'IMAGE']);
const CHOICE_TYPES = new Set(['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN']);

/**
 * Render a single answer row into a display string.
 */
const answerToText = (answer) => {
    if (answer.fileUrl) return answer.fileName || answer.fileUrl;
    if (answer.numberValue !== null && answer.numberValue !== undefined) {
        return String(answer.numberValue);
    }
    if (answer.dateValue) return new Date(answer.dateValue).toISOString().slice(0, 10);
    if (answer.textValue !== null && answer.textValue !== undefined) return answer.textValue;
    if (answer.optionId) return answer.optionId;
    return '';
};

/**
 * Paginated individual responses for a form (owner-only).
 */
export const listResponses = async (formId, userId, role, { page = 1, limit = 20 } = {}) => {
    await assertFormOwner(formId, userId, role);
    const skip = (page - 1) * limit;

    const [responses, total] = await Promise.all([
        prisma.formResponse.findMany({
            where: { formId },
            orderBy: { submittedAt: 'desc' },
            skip,
            take: limit,
            include: { answers: true },
        }),
        prisma.formResponse.count({ where: { formId } }),
    ]);

    const formatted = responses.map((r) => ({
        id: r.id,
        submittedAt: r.submittedAt,
        respondentEmail: r.respondentEmail,
        answers: r.answers.map((a) => ({
            questionId: a.questionId,
            optionId: a.optionId,
            text: answerToText(a),
            fileUrl: a.fileUrl,
            fileName: a.fileName,
        })),
    }));

    return { responses: formatted, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Per-question summary for a form (owner-only).
 */
export const getSummary = async (formId, userId, role) => {
    const form = await assertFormOwner(formId, userId, role, {
        include: { questions: { orderBy: { position: 'asc' } } },
    });

    const summaries = [];

    for (const question of form.questions) {
        if (DISPLAY_ONLY.has(question.type)) continue;

        const base = { question: formatQuestion(question) };

        if (CHOICE_TYPES.has(question.type)) {
            // Count by optionId (checkbox answers already 1 row per selection).
            const grouped = await prisma.formAnswer.groupBy({
                by: ['optionId'],
                where: { questionId: question.id, optionId: { not: null } },
                _count: { _all: true },
            });
            const labels = new Map(
                (Array.isArray(question.options) ? question.options : []).map((o) => [o.id, o.label])
            );
            summaries.push({
                ...base,
                kind: 'choice',
                totalAnswered: grouped.reduce((s, g) => s + g._count._all, 0),
                distribution: grouped.map((g) => ({
                    optionId: g.optionId,
                    label: labels.get(g.optionId) || g.optionId,
                    count: g._count._all,
                })),
            });
        } else if (question.type === 'LINEAR_SCALE') {
            const grouped = await prisma.formAnswer.groupBy({
                by: ['numberValue'],
                where: { questionId: question.id, numberValue: { not: null } },
                _count: { _all: true },
            });
            const agg = await prisma.formAnswer.aggregate({
                where: { questionId: question.id, numberValue: { not: null } },
                _avg: { numberValue: true },
                _count: { _all: true },
            });
            summaries.push({
                ...base,
                kind: 'scale',
                totalAnswered: agg._count._all,
                average: agg._avg.numberValue,
                distribution: grouped
                    .map((g) => ({ value: g.numberValue, count: g._count._all }))
                    .sort((a, b) => a.value - b.value),
            });
        } else if (question.type === 'FILE_UPLOAD') {
            const count = await prisma.formAnswer.count({
                where: { questionId: question.id, fileUrl: { not: null } },
            });
            summaries.push({ ...base, kind: 'file', totalAnswered: count });
        } else {
            // text / date / time: count + recent samples
            const answers = await prisma.formAnswer.findMany({
                where: { questionId: question.id },
                orderBy: { createdAt: 'desc' },
                take: 5,
            });
            const total = await prisma.formAnswer.count({ where: { questionId: question.id } });
            summaries.push({
                ...base,
                kind: 'text',
                totalAnswered: total,
                samples: answers.map(answerToText).filter(Boolean),
            });
        }
    }

    return {
        formId: form.id,
        title: form.title,
        responseCount: form.responseCount,
        summaries,
    };
};

/**
 * Build a tabular view of all responses (owner-only): one header row + one row
 * per response, answerable questions as columns in position order. Shared by
 * the CSV and XLSX exporters.
 * @returns {Promise<{form: object, header: string[], rows: string[][]}>}
 */
const buildTable = async (formId, userId, role) => {
    const form = await assertFormOwner(formId, userId, role, {
        include: { questions: { orderBy: { position: 'asc' } } },
    });

    // Only answerable questions become columns, in position order.
    const columns = form.questions.filter((q) => !DISPLAY_ONLY.has(q.type));

    const responses = await prisma.formResponse.findMany({
        where: { formId },
        orderBy: { submittedAt: 'asc' },
        include: { answers: true },
    });

    const header = ['Submitted At'];
    if (form.collectEmail) header.push('Email');
    columns.forEach((q) => header.push(q.title || 'Untitled question'));

    const rows = responses.map((response) => {
        // Group this response's answers by question (checkbox/file => multiple).
        const byQuestion = new Map();
        for (const a of response.answers) {
            if (!byQuestion.has(a.questionId)) byQuestion.set(a.questionId, []);
            byQuestion.get(a.questionId).push(answerToText(a));
        }

        const row = [new Date(response.submittedAt).toISOString()];
        if (form.collectEmail) row.push(response.respondentEmail || '');
        columns.forEach((q) => row.push((byQuestion.get(q.id) || []).join(', ')));
        return row;
    });

    return { form, header, rows };
};

/**
 * Build a CSV string of all responses (owner-only). RFC4180-ish escaping via
 * the shared escapeCsvField helper (also neutralizes CSV injection).
 */
export const buildCsv = async (formId, userId, role) => {
    const { form, header, rows } = await buildTable(formId, userId, role);
    const lines = [header.map(escapeCsvField).join(',')];
    for (const row of rows) lines.push(row.map(escapeCsvField).join(','));
    return { filename: `${form.slug}-responses.csv`, csv: lines.join('\r\n') };
};

/**
 * Build an .xlsx workbook of all responses (owner-only) via exceljs.
 * @returns {Promise<{filename: string, buffer: Buffer}>}
 */
export const buildXlsx = async (formId, userId, role) => {
    const { default: ExcelJS } = await import('exceljs');
    const { form, header, rows } = await buildTable(formId, userId, role);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Heisenlink';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('Responses');

    const headerRow = sheet.addRow(header);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle' };

    rows.forEach((row) => sheet.addRow(row));

    // Reasonable column widths based on header/content length (capped).
    sheet.columns.forEach((col, i) => {
        const maxLen = [header[i], ...rows.map((r) => r[i] || '')].reduce(
            (m, v) => Math.max(m, String(v).length),
            10
        );
        col.width = Math.min(maxLen + 2, 50);
    });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return { filename: `${form.slug}-responses.xlsx`, buffer: Buffer.from(arrayBuffer) };
};

export default { listResponses, getSummary, buildCsv, buildXlsx };
