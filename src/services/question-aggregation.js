// ===========================================
// Heisenlink - Question Aggregation Primitives
// ===========================================
//
// Reusable read-only aggregations over FormAnswer / FormResponse, keyed by a
// single question (or whole form). Shared by the owner response summary
// (form-aggregation.service.js) and the dashboard compute engine
// (dashboard-data.service.js) so the grouping logic lives in exactly one place.

import prisma from "../config/database.js";

const GRANULARITY_TRUNC = { day: "day", week: "week", month: "month" };

/** Render a single answer row into a display string. */
export const answerToText = (answer) => {
  if (answer.fileUrl) return answer.fileName || answer.fileUrl;
  if (answer.numberValue !== null && answer.numberValue !== undefined) {
    return String(answer.numberValue);
  }
  if (answer.dateValue)
    return new Date(answer.dateValue).toISOString().slice(0, 10);
  if (answer.textValue !== null && answer.textValue !== undefined)
    return answer.textValue;
  if (answer.optionId) return answer.optionId;
  return "";
};

/**
 * Distribution of selected options for a choice question.
 * @param {string} questionId
 * @param {Array<{id:string,label:string}>} options
 */
export const choiceDistribution = async (questionId, options = []) => {
  const grouped = await prisma.formAnswer.groupBy({
    by: ["optionId"],
    where: { questionId, optionId: { not: null } },
    _count: { _all: true },
  });
  const labels = new Map(
    (Array.isArray(options) ? options : []).map((o) => [o.id, o.label]),
  );
  return {
    totalAnswered: grouped.reduce((s, g) => s + g._count._all, 0),
    distribution: grouped.map((g) => ({
      optionId: g.optionId,
      label: labels.get(g.optionId) || g.optionId,
      count: g._count._all,
    })),
  };
};

/** Per-value distribution + average for a linear-scale question. */
export const scaleDistribution = async (questionId) => {
  const [grouped, agg] = await Promise.all([
    prisma.formAnswer.groupBy({
      by: ["numberValue"],
      where: { questionId, numberValue: { not: null } },
      _count: { _all: true },
    }),
    prisma.formAnswer.aggregate({
      where: { questionId, numberValue: { not: null } },
      _avg: { numberValue: true },
      _count: { _all: true },
    }),
  ]);
  return {
    totalAnswered: agg._count._all,
    average: agg._avg.numberValue,
    distribution: grouped
      .map((g) => ({ value: g.numberValue, count: g._count._all }))
      .sort((a, b) => a.value - b.value),
  };
};

/** count / avg / sum / min / max over a numeric question (for KPI widgets). */
export const numericStats = async (questionId) => {
  const agg = await prisma.formAnswer.aggregate({
    where: { questionId, numberValue: { not: null } },
    _count: { _all: true },
    _avg: { numberValue: true },
    _sum: { numberValue: true },
    _min: { numberValue: true },
    _max: { numberValue: true },
  });
  return {
    count: agg._count._all,
    average: agg._avg.numberValue,
    sum: agg._sum.numberValue,
    min: agg._min.numberValue,
    max: agg._max.numberValue,
  };
};

/** Number of file answers for a FILE_UPLOAD question. */
export const fileCount = (questionId) =>
  prisma.formAnswer.count({ where: { questionId, fileUrl: { not: null } } });

/** Recent free-text samples + total answered (owner summary view). */
export const textSamples = async (questionId, take = 5) => {
  const [answers, total] = await Promise.all([
    prisma.formAnswer.findMany({
      where: { questionId },
      orderBy: { createdAt: "desc" },
      take,
    }),
    prisma.formAnswer.count({ where: { questionId } }),
  ]);
  return {
    totalAnswered: total,
    samples: answers.map(answerToText).filter(Boolean),
  };
};

// Minimal stopword set — enough to keep word clouds meaningful without a dep.
const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "are",
  "was",
  "with",
  "that",
  "this",
  "you",
  "your",
  "dan",
  "yang",
  "untuk",
  "dari",
  "pada",
  "ini",
  "itu",
  "atau",
  "tidak",
  "ada",
]);

/** Top-N word frequency over a free-text question (for WORDCLOUD widgets). */
export const textTopN = async (questionId, topN = 50) => {
  const answers = await prisma.formAnswer.findMany({
    where: { questionId, textValue: { not: null } },
    select: { textValue: true },
  });
  const counts = new Map();
  for (const { textValue } of answers) {
    const words = String(textValue)
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
    for (const w of words) counts.set(w, (counts.get(w) || 0) + 1);
  }
  const words = [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
  return { totalAnswered: answers.length, words };
};

/** Distribution of answered date values (for DATE/TIME bar widgets). */
export const temporalDistribution = async (questionId) => {
  const answers = await prisma.formAnswer.findMany({
    where: { questionId, dateValue: { not: null } },
    select: { dateValue: true },
  });
  const counts = new Map();
  for (const { dateValue } of answers) {
    const key = new Date(dateValue).toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return {
    totalAnswered: answers.length,
    distribution: [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value)),
  };
};

/** Total responses for a form (form-level KPI). */
export const responseCount = (formId) =>
  prisma.formResponse.count({ where: { formId } });

/**
 * Responses grouped by submitted-at bucket (form-level OVER_TIME).
 * Uses Postgres date_trunc; granularity is whitelisted to avoid injection.
 */
export const responsesOverTime = async (formId, granularity = "day") => {
  const trunc = GRANULARITY_TRUNC[granularity] || "day";
  const rows = await prisma.$queryRawUnsafe(
    `SELECT date_trunc($1, submitted_at) AS bucket, COUNT(*)::int AS count
         FROM form_responses
         WHERE form_id = $2
         GROUP BY bucket
         ORDER BY bucket ASC`,
    trunc,
    formId,
  );
  return rows.map((r) => ({
    bucket: new Date(r.bucket).toISOString().slice(0, 10),
    count: Number(r.count),
  }));
};

export default {
  answerToText,
  choiceDistribution,
  scaleDistribution,
  numericStats,
  fileCount,
  textSamples,
  textTopN,
  temporalDistribution,
  responseCount,
  responsesOverTime,
};
