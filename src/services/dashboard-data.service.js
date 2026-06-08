// ===========================================
// Heisenlink - Dashboard Data Service (compute + public read)
// ===========================================
//
// Turns each widget definition into a normalized, chart-ready payload by
// dispatching to question-aggregation primitives. Owner previews may show raw
// free-text; public payloads redact it unless the widget opts in (showRawText),
// and respondent email/IP are never queried here.

import prisma from "../config/database.js";
import { assertDashboardOwner } from "./form-dashboard.service.js";
import { cacheDashboard, getCachedDashboard } from "./cache.service.js";
import { comparePassword } from "../utils/password.js";
import { errors } from "../middleware/error.middleware.js";
import {
  choiceDistribution,
  scaleDistribution,
  numericStats,
  fileCount,
  textSamples,
  textTopN,
  temporalDistribution,
  responseCount,
  responsesOverTime,
} from "./question-aggregation.js";

const CHOICE_TYPES = new Set(["MULTIPLE_CHOICE", "CHECKBOXES", "DROPDOWN"]);
const RAW_TEXT_LIMIT = 100;

const toItems = (distribution, labelKey = "label") =>
  distribution.map((d) => ({
    label: String(d[labelKey] ?? d.value),
    value: d.count,
  }));

/** Pick the scalar a KPI widget should display. */
const kpiValue = (aggregation, stats) => {
  if (aggregation === "AVERAGE") return stats.average;
  if (aggregation === "SUM") return stats.sum;
  if (aggregation === "MIN") return stats.min;
  if (aggregation === "MAX") return stats.max;
  return stats.count;
};

/**
 * Compute one widget's normalized data payload.
 * @param {object} widget
 * @param {object|null} question - { id, type, options } or null (form-level)
 * @param {{ formId: string, allowRawText: boolean }} ctx
 */
const computeWidgetData = async (widget, question, ctx) => {
  const cfg = widget.config || {};
  const { type, aggregation } = widget;

  // Form-level widgets (no question).
  if (!question) {
    if (type === "KPI") return { value: await responseCount(ctx.formId) };
    const series = await responsesOverTime(
      ctx.formId,
      cfg.granularity || "day",
    );
    return { series: series.map((s) => ({ x: s.bucket, y: s.count })) };
  }

  const qType = question.type;

  if (CHOICE_TYPES.has(qType)) {
    const { totalAnswered, distribution } = await choiceDistribution(
      question.id,
      question.options,
    );
    if (type === "KPI") return { value: totalAnswered };
    return { items: toItems(distribution), totalAnswered };
  }

  if (qType === "LINEAR_SCALE") {
    if (type === "KPI")
      return { value: kpiValue(aggregation, await numericStats(question.id)) };
    const { totalAnswered, average, distribution } = await scaleDistribution(
      question.id,
    );
    return { items: toItems(distribution, "value"), average, totalAnswered };
  }

  if (qType === "DATE" || qType === "TIME") {
    const { totalAnswered, distribution } = await temporalDistribution(
      question.id,
    );
    if (type === "KPI") return { value: totalAnswered };
    if (type === "LINE")
      return { series: distribution.map((d) => ({ x: d.value, y: d.count })) };
    return { items: toItems(distribution, "value"), totalAnswered };
  }

  if (qType === "FILE_UPLOAD") {
    const count = await fileCount(question.id);
    if (type === "KPI") return { value: count };
    return { rows: [], totalAnswered: count, redacted: !ctx.allowRawText };
  }

  // SHORT_TEXT / LONG_TEXT
  if (type === "WORDCLOUD") {
    const { words } = await textTopN(question.id, cfg.topN || 50);
    return { words };
  }
  const allowRaw = ctx.allowRawText || cfg.showRawText === true;
  const { totalAnswered, samples } = await textSamples(
    question.id,
    allowRaw ? RAW_TEXT_LIMIT : 0,
  );
  if (type === "KPI") return { value: totalAnswered };
  return { rows: allowRaw ? samples : [], totalAnswered, redacted: !allowRaw };
};

/**
 * Compute data for every widget on a dashboard.
 * @param {object} dashboard - includes widgets + form.questions
 * @param {boolean} allowRawText - owner preview (true) vs public (false)
 */
const computeAllWidgets = async (dashboard, allowRawText) => {
  const questions = new Map(dashboard.form.questions.map((q) => [q.id, q]));
  const ctx = { formId: dashboard.formId, allowRawText };

  return Promise.all(
    dashboard.widgets.map(async (widget) => ({
      id: widget.id,
      questionId: widget.questionId,
      type: widget.type,
      aggregation: widget.aggregation,
      title: widget.title,
      position: widget.position,
      config: widget.config ?? null,
      data: await computeWidgetData(
        widget,
        questions.get(widget.questionId) || null,
        ctx,
      ),
    })),
  );
};

const withWidgetsAndForm = {
  widgets: { orderBy: { position: "asc" } },
  form: { include: { questions: { orderBy: { position: "asc" } } } },
};

// ===========================================
// Owner preview
// ===========================================

export const getDashboardData = async (dashboardId, userId, role) => {
  const dashboard = await assertDashboardOwner(dashboardId, userId, role, {
    include: withWidgetsAndForm,
  });
  return { dashboardId, widgets: await computeAllWidgets(dashboard, true) };
};

// ===========================================
// Public read
// ===========================================

const publicMeta = (dashboard) => ({
  id: dashboard.id,
  slug: dashboard.slug,
  title: dashboard.title,
  description: dashboard.description,
  theme: dashboard.theme,
  layout: dashboard.layout ?? null,
  hasPassword: Boolean(dashboard.passwordHash),
});

const fetchPublishedDashboard = async (slug) => {
  const dashboard = await prisma.formDashboard.findUnique({
    where: { slug },
    include: withWidgetsAndForm,
  });
  if (
    !dashboard ||
    !dashboard.isPublished ||
    dashboard.visibility === "PRIVATE"
  )
    return null;
  return dashboard;
};

/**
 * Public dashboard payload (cache-first). When password-protected, returns meta
 * + requiresPassword only (no data); the data is delivered by verifyPassword.
 * Returns null when the dashboard is missing / unpublished / private.
 */
export const getPublicDashboard = async (slug) => {
  const cached = await getCachedDashboard(slug);
  if (cached) return cached;

  const dashboard = await fetchPublishedDashboard(slug);
  if (!dashboard) return null;

  const meta = publicMeta(dashboard);
  const payload = meta.hasPassword
    ? { ...meta, requiresPassword: true }
    : {
        ...meta,
        requiresPassword: false,
        widgets: await computeAllWidgets(dashboard, false),
      };

  // Safe to cache: when protected the payload carries no data.
  await cacheDashboard(slug, payload);
  return payload;
};

/**
 * Verify a dashboard password and, on success, return the computed widgets.
 * Throws 401 on mismatch. Computed fresh (not cached under the public key).
 */
export const verifyPasswordAndGetData = async (slug, password) => {
  const dashboard = await fetchPublishedDashboard(slug);
  if (!dashboard) return null;

  if (dashboard.passwordHash) {
    const ok = await comparePassword(password || "", dashboard.passwordHash);
    if (!ok) throw errors.unauthorized("Incorrect password");
  }

  return {
    ...publicMeta(dashboard),
    requiresPassword: false,
    widgets: await computeAllWidgets(dashboard, false),
  };
};

export default {
  getDashboardData,
  getPublicDashboard,
  verifyPasswordAndGetData,
};
