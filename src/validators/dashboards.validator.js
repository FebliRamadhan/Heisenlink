// ===========================================
// Heisenlink - Dashboard Validators
// ===========================================

import { z } from "zod";

const SLUG_REGEX = /^[a-z0-9_-]+$/;

export const widgetTypeEnum = z.enum([
  "KPI",
  "BAR",
  "PIE",
  "DONUT",
  "LINE",
  "SCALE_HISTOGRAM",
  "TABLE",
  "WORDCLOUD",
]);

export const widgetAggregationEnum = z.enum([
  "COUNT",
  "DISTRIBUTION",
  "AVERAGE",
  "SUM",
  "MIN",
  "MAX",
  "OVER_TIME",
]);

export const visibilityEnum = z.enum(["PRIVATE", "LINK", "PUBLIC"]);

const slugField = z
  .string()
  .min(3, "URL must be at least 3 characters")
  .max(50, "URL must be at most 50 characters")
  .regex(
    SLUG_REGEX,
    "URL can only contain lowercase letters, numbers, hyphens, and underscores",
  );

const layoutItemSchema = z.object({
  i: z.string().min(1),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1),
  h: z.number().int().min(1),
});

const widgetConfigSchema = z
  .object({
    colors: z.array(z.string().max(32)).max(40).optional(),
    topN: z.number().int().min(1).max(200).optional(),
    granularity: z.enum(["day", "week", "month"]).optional(),
    showRawText: z.boolean().optional(),
    bins: z.number().int().min(1).max(50).optional(),
  })
  .partial()
  .nullable()
  .optional();

// ===========================================
// Dashboard schemas
// ===========================================

export const createDashboardSchema = z.object({
  formId: z.string().uuid("Invalid form ID"),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  slug: slugField.optional(),
});

export const updateDashboardSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  slug: slugField.optional(),
  theme: z.string().max(50).optional(),
  isPublished: z.boolean().optional(),
  visibility: visibilityEnum.optional(),
  layout: z.array(layoutItemSchema).max(100).optional().nullable(),
});

export const setPasswordSchema = z.object({
  password: z
    .string()
    .min(4, "Password must be at least 4 characters")
    .max(100)
    .nullable(),
});

export const verifyPasswordSchema = z.object({
  password: z.string().min(1, "Password is required").max(100),
});

// ===========================================
// Widget schemas
// ===========================================

const widgetBase = {
  questionId: z.string().uuid("Invalid question ID").nullable().optional(),
  type: widgetTypeEnum,
  aggregation: widgetAggregationEnum,
  title: z.string().max(255).optional().nullable(),
  position: z.number().int().min(0).optional(),
  config: widgetConfigSchema,
};

export const createWidgetSchema = z.object(widgetBase);

export const updateWidgetSchema = z.object({
  ...widgetBase,
  type: widgetTypeEnum.optional(),
  aggregation: widgetAggregationEnum.optional(),
});

export const reorderWidgetsSchema = z.object({
  widgetIds: z
    .array(z.string().uuid())
    .min(1, "At least one widget ID is required"),
});

// ===========================================
// Param & query schemas
// ===========================================

export const dashboardIdParamSchema = z.object({
  id: z.string().uuid("Invalid dashboard ID"),
});

export const widgetIdParamSchema = z.object({
  id: z.string().uuid("Invalid dashboard ID"),
  wid: z.string().uuid("Invalid widget ID"),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1),
});

export const listDashboardsQuerySchema = z.object({
  formId: z.string().uuid("Invalid form ID"),
});

export default {
  createDashboardSchema,
  updateDashboardSchema,
  setPasswordSchema,
  verifyPasswordSchema,
  createWidgetSchema,
  updateWidgetSchema,
  reorderWidgetsSchema,
  dashboardIdParamSchema,
  widgetIdParamSchema,
  slugParamSchema,
  listDashboardsQuerySchema,
};
