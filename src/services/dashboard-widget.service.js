// ===========================================
// Heisenlink - Dashboard Widget Service (per-widget CRUD)
// ===========================================
//
// Widgets are validated against widget-compatibility.js so a dashboard can only
// hold visualizations that make sense for the underlying question type.

import prisma from "../config/database.js";
import {
  assertDashboardOwner,
  invalidateAndRevalidate,
  formatWidget,
} from "./form-dashboard.service.js";
import { isCompatible, FORM_LEVEL } from "./widget-compatibility.js";
import { errors } from "../middleware/error.middleware.js";

/**
 * Resolve the question type a widget targets and assert the type/aggregation
 * pairing is allowed. Returns the resolved questionType (or FORM_LEVEL).
 */
const validateWidget = async (formId, { questionId, type, aggregation }) => {
  let questionType = FORM_LEVEL;

  if (questionId) {
    const question = await prisma.formQuestion.findUnique({
      where: { id: questionId },
      select: { formId: true, type: true },
    });
    if (!question || question.formId !== formId) {
      throw errors.badRequest(
        "Question does not belong to this dashboard's form",
      );
    }
    questionType = question.type;
  }

  if (!isCompatible(questionType, type, aggregation)) {
    throw errors.badRequest(
      `Widget ${type}/${aggregation} is not valid for ${questionType}`,
    );
  }
  return questionType;
};

export const addWidget = async (dashboardId, userId, role, data) => {
  const dashboard = await assertDashboardOwner(dashboardId, userId, role);
  await validateWidget(dashboard.formId, data);

  const maxPosition = await prisma.dashboardWidget.aggregate({
    where: { dashboardId },
    _max: { position: true },
  });

  const widget = await prisma.dashboardWidget.create({
    data: {
      dashboardId,
      questionId: data.questionId ?? null,
      type: data.type,
      aggregation: data.aggregation,
      title: data.title ?? null,
      position: data.position ?? (maxPosition._max.position ?? -1) + 1,
      config: data.config ?? undefined,
    },
  });

  await invalidateAndRevalidate(dashboard.slug);
  return formatWidget(widget);
};

export const updateWidget = async (
  dashboardId,
  widgetId,
  userId,
  role,
  data,
) => {
  const dashboard = await assertDashboardOwner(dashboardId, userId, role);

  const existing = await prisma.dashboardWidget.findUnique({
    where: { id: widgetId },
  });
  if (!existing || existing.dashboardId !== dashboardId) {
    throw errors.notFound("Widget not found");
  }

  // Re-validate whenever any of question/type/aggregation changes.
  const next = {
    questionId:
      data.questionId !== undefined ? data.questionId : existing.questionId,
    type: data.type ?? existing.type,
    aggregation: data.aggregation ?? existing.aggregation,
  };
  if (
    data.questionId !== undefined ||
    data.type !== undefined ||
    data.aggregation !== undefined
  ) {
    await validateWidget(dashboard.formId, next);
  }

  const updateData = {};
  if (data.questionId !== undefined)
    updateData.questionId = data.questionId ?? null;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.aggregation !== undefined) updateData.aggregation = data.aggregation;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.position !== undefined) updateData.position = data.position;
  if (data.config !== undefined) updateData.config = data.config ?? undefined;

  const widget = await prisma.dashboardWidget.update({
    where: { id: widgetId },
    data: updateData,
  });
  await invalidateAndRevalidate(dashboard.slug);
  return formatWidget(widget);
};

export const deleteWidget = async (dashboardId, widgetId, userId, role) => {
  const dashboard = await assertDashboardOwner(dashboardId, userId, role);
  const existing = await prisma.dashboardWidget.findUnique({
    where: { id: widgetId },
  });
  if (!existing || existing.dashboardId !== dashboardId) {
    throw errors.notFound("Widget not found");
  }
  await prisma.dashboardWidget.delete({ where: { id: widgetId } });
  await invalidateAndRevalidate(dashboard.slug);
};

export const reorderWidgets = async (dashboardId, userId, role, widgetIds) => {
  const dashboard = await assertDashboardOwner(dashboardId, userId, role);
  await prisma.$transaction(
    widgetIds.map((id, index) =>
      prisma.dashboardWidget.update({
        where: { id },
        data: { position: index },
      }),
    ),
  );
  await invalidateAndRevalidate(dashboard.slug);
};

export default { addWidget, updateWidget, deleteWidget, reorderWidgets };
