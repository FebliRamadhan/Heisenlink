// ===========================================
// Heisenlink - Dashboard Widget Compatibility
// ===========================================
//
// Single source of truth for which visualization (WidgetType) and statistic
// (WidgetAggregation) make sense for a given FormQuestionType. Pure data + pure
// predicates — no I/O. Used by:
//   - backend validation (reject nonsensical widget configs)
//   - the builder UI, which fetches this matrix to only offer valid charts
//     (exposed via GET /api/dashboards/meta/widget-types)

/** Question types that hold no answer data and can never back a widget. */
export const DISPLAY_ONLY = new Set(["SECTION", "STATEMENT", "IMAGE"]);

/** Sentinel for widgets not bound to a question (questionId === null). */
export const FORM_LEVEL = "FORM_LEVEL";

// Per-question-type allowances. Each entry: WidgetType -> allowed aggregations.
// The first aggregation in each list is the sensible default for that pairing.
const CHOICE = {
  BAR: ["DISTRIBUTION"],
  PIE: ["DISTRIBUTION"],
  DONUT: ["DISTRIBUTION"],
  KPI: ["COUNT"],
};

const TEXT = {
  WORDCLOUD: ["DISTRIBUTION"],
  TABLE: ["COUNT"],
  KPI: ["COUNT"],
};

const SCALE = {
  SCALE_HISTOGRAM: ["DISTRIBUTION"],
  BAR: ["DISTRIBUTION"],
  KPI: ["AVERAGE", "MIN", "MAX", "COUNT"],
};

const TEMPORAL = {
  LINE: ["OVER_TIME"],
  BAR: ["DISTRIBUTION"],
  TABLE: ["COUNT"],
  KPI: ["COUNT"],
};

const FILE = {
  TABLE: ["COUNT"],
  KPI: ["COUNT"],
};

/**
 * questionType -> { WidgetType: [WidgetAggregation, ...] }
 * Display-only types are intentionally absent (no widgets).
 */
export const COMPATIBILITY = Object.freeze({
  SHORT_TEXT: TEXT,
  LONG_TEXT: TEXT,
  MULTIPLE_CHOICE: CHOICE,
  CHECKBOXES: CHOICE,
  DROPDOWN: CHOICE,
  LINEAR_SCALE: SCALE,
  DATE: TEMPORAL,
  TIME: TEMPORAL,
  FILE_UPLOAD: FILE,
  // Form-level widgets are not bound to any question.
  [FORM_LEVEL]: {
    KPI: ["COUNT"],
    LINE: ["OVER_TIME"],
    BAR: ["OVER_TIME"],
  },
});

/**
 * Whether a widget type + aggregation is valid for the given question type.
 * Pass `FORM_LEVEL` as questionType for form-level widgets.
 */
export const isCompatible = (questionType, widgetType, aggregation) => {
  const entry = COMPATIBILITY[questionType];
  if (!entry) return false;
  const aggregations = entry[widgetType];
  if (!aggregations) return false;
  return aggregations.includes(aggregation);
};

/**
 * The default (recommended) aggregation for a question type + widget type, or
 * null when the pairing is invalid. Useful when the builder picks a widget but
 * the user hasn't chosen a statistic yet.
 */
export const defaultAggregation = (questionType, widgetType) => {
  const entry = COMPATIBILITY[questionType];
  const aggregations = entry?.[widgetType];
  return aggregations?.[0] ?? null;
};

/**
 * Serializable view of the matrix for the builder UI:
 * [{ questionType, widgets: [{ type, aggregations }] }]
 */
export const describeCompatibility = () =>
  Object.entries(COMPATIBILITY).map(([questionType, widgets]) => ({
    questionType,
    widgets: Object.entries(widgets).map(([type, aggregations]) => ({
      type,
      aggregations,
    })),
  }));

export default {
  DISPLAY_ONLY,
  FORM_LEVEL,
  COMPATIBILITY,
  isCompatible,
  defaultAggregation,
  describeCompatibility,
};
