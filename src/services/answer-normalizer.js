// ===========================================
// Heisenlink - Form Answer Normalizer (pure)
// ===========================================
//
// Pure, dependency-free validation + normalization of submitted answers
// against question definitions. Kept separate from form-submission.service so
// it can be unit-tested without pulling in Prisma.

import { errors } from '../middleware/error.middleware.js';

const TEXT_DEFAULT_MAX = { SHORT_TEXT: 255, LONG_TEXT: 1000 };
const DISPLAY_ONLY = new Set(['SECTION', 'STATEMENT', 'IMAGE']);

export const isEmptyValue = (value) =>
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0);

const optionIndex = (question) => {
    const opts = Array.isArray(question.options) ? question.options : [];
    return new Map(opts.map((o) => [o.id, o.label]));
};

/**
 * Validate a single answer against its question and produce FormAnswer rows
 * (without responseId). Throws errors.badRequest on invalid input.
 */
export const buildAnswerRows = (question, value) => {
    const label = question.title || 'Question';
    const base = { questionId: question.id };

    switch (question.type) {
        case 'SHORT_TEXT':
        case 'LONG_TEXT': {
            if (typeof value !== 'string') {
                throw errors.badRequest(`"${label}" must be text`);
            }
            const max = question.config?.maxLength || TEXT_DEFAULT_MAX[question.type];
            if (value.length > max) {
                throw errors.badRequest(`"${label}" must be at most ${max} characters`);
            }
            return [{ ...base, textValue: value }];
        }

        case 'MULTIPLE_CHOICE':
        case 'DROPDOWN': {
            const labels = optionIndex(question);
            if (typeof value !== 'string' || !labels.has(value)) {
                throw errors.badRequest(`"${label}" has an invalid selection`);
            }
            return [{ ...base, optionId: value, textValue: labels.get(value) }];
        }

        case 'CHECKBOXES': {
            const labels = optionIndex(question);
            const arr = Array.isArray(value) ? value : [value];
            if (!arr.every((id) => labels.has(id))) {
                throw errors.badRequest(`"${label}" has an invalid selection`);
            }
            return arr.map((id) => ({ ...base, optionId: id, textValue: labels.get(id) }));
        }

        case 'LINEAR_SCALE': {
            const num = typeof value === 'number' ? value : Number(value);
            if (!Number.isFinite(num)) {
                throw errors.badRequest(`"${label}" must be a number`);
            }
            const min = question.config?.min ?? 1;
            const max = question.config?.max ?? 5;
            if (num < min || num > max) {
                throw errors.badRequest(`"${label}" must be between ${min} and ${max}`);
            }
            return [{ ...base, numberValue: num }];
        }

        case 'DATE': {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                throw errors.badRequest(`"${label}" must be a valid date`);
            }
            return [{ ...base, dateValue: date }];
        }

        case 'TIME': {
            if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
                throw errors.badRequest(`"${label}" must be a valid time (HH:mm)`);
            }
            return [{ ...base, textValue: value }];
        }

        case 'FILE_UPLOAD': {
            const files = Array.isArray(value) ? value : [value];
            const maxFiles = question.config?.maxFiles ?? 1;
            if (files.length > maxFiles) {
                throw errors.badRequest(`"${label}" allows at most ${maxFiles} file(s)`);
            }
            return files.map((f) => {
                if (!f || typeof f.url !== 'string') {
                    throw errors.badRequest(`"${label}" has an invalid file reference`);
                }
                return {
                    ...base,
                    fileUrl: f.url,
                    fileName: f.name ?? f.fileName ?? null,
                    fileSize: typeof f.size === 'number' ? f.size : f.fileSize ?? null,
                };
            });
        }

        default:
            throw errors.badRequest(`Unsupported question type: ${question.type}`);
    }
};

/**
 * Validate all answers against the form's questions, enforcing required fields.
 * Skips display-only questions (SECTION/STATEMENT).
 * @returns {Array} normalized FormAnswer rows (without responseId)
 */
export const validateAndNormalize = (form, answers) => {
    const answerMap = new Map((answers || []).map((a) => [a.questionId, a.value]));
    const rows = [];

    for (const question of form.questions) {
        if (DISPLAY_ONLY.has(question.type)) continue;

        const value = answerMap.get(question.id);
        if (isEmptyValue(value)) {
            if (question.isRequired) {
                throw errors.badRequest(`"${question.title || 'Question'}" is required`);
            }
            continue;
        }
        rows.push(...buildAnswerRows(question, value));
    }

    return rows;
};

export default { isEmptyValue, buildAnswerRows, validateAndNormalize };
