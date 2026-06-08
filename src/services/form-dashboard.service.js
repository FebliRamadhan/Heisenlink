// ===========================================
// Heisenlink - Form Dashboard Service (CRUD + ownership + sharing)
// ===========================================
//
// Owner-side CRUD for dynamic dashboards built over a form's responses, plus
// slug/publish/password handling. Public read + widget data computation live in
// dashboard-data.service.js; per-widget CRUD lives in dashboard-widget.service.js.

import prisma from "../config/database.js";
import config from "../config/index.js";
import { assertFormOwner } from "./forms.service.js";
import { invalidateDashboard } from "./cache.service.js";
import { revalidateDashboardTag } from "./revalidate.service.js";
import { errors } from "../middleware/error.middleware.js";
import { isReservedAlias, generateCode } from "../utils/shortcode.js";
import { hashPassword } from "../utils/password.js";
import logger from "../utils/logger.js";

const SLUG_REGEX = /^[a-z0-9_-]{3,50}$/;
const VISIBILITIES = new Set(["PRIVATE", "LINK", "PUBLIC"]);

// ===========================================
// Slug helpers (unique across dashboards)
// ===========================================

export const isSlugAvailable = async (slug, excludeId = null) => {
  if (typeof slug !== "string" || !SLUG_REGEX.test(slug)) {
    return { available: false, reason: "invalid" };
  }
  if (isReservedAlias(slug)) {
    return { available: false, reason: "reserved" };
  }
  const existing = await prisma.formDashboard.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existing && existing.id !== excludeId) {
    return { available: false, reason: "taken" };
  }
  return { available: true };
};

const generateUniqueSlug = async () => {
  for (let i = 0; i < 5; i += 1) {
    const candidate = generateCode(8).toLowerCase();
    const existing = await prisma.formDashboard.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  return `${generateCode(8)}${Date.now().toString(36)}`.toLowerCase();
};

const resolveSlug = async (requestedSlug, excludeId = null) => {
  const normalized = requestedSlug.toLowerCase();
  const availability = await isSlugAvailable(normalized, excludeId);
  if (availability.available) return normalized;
  if (availability.reason === "reserved")
    throw errors.badRequest("This URL is reserved");
  if (availability.reason === "invalid")
    throw errors.badRequest("Invalid URL format");
  throw errors.conflict("This URL is already taken");
};

// ===========================================
// Ownership
// ===========================================

/**
 * Fetch a dashboard and assert the requesting user owns it (ADMIN bypasses).
 */
export const assertDashboardOwner = async (
  dashboardId,
  userId,
  role = "USER",
  options = {},
) => {
  const dashboard = await prisma.formDashboard.findUnique({
    where: { id: dashboardId },
    ...options,
  });
  if (!dashboard) throw errors.notFound("Dashboard not found");
  if (dashboard.userId !== userId && role !== "ADMIN") {
    throw errors.forbidden("You do not have access to this dashboard");
  }
  return dashboard;
};

const widgetsInclude = { widgets: { orderBy: { position: "asc" } } };

// ===========================================
// CRUD
// ===========================================

export const createDashboard = async (userId, role, data = {}) => {
  // Ownership of the parent form is required to attach a dashboard to it.
  await assertFormOwner(data.formId, userId, role);

  const slug = data.slug
    ? await resolveSlug(data.slug)
    : await generateUniqueSlug();
  const dashboard = await prisma.formDashboard.create({
    data: {
      formId: data.formId,
      userId,
      slug,
      title: data.title || "Untitled dashboard",
      description: data.description ?? null,
    },
    include: widgetsInclude,
  });

  logger.info(`Created dashboard ${dashboard.id} for form ${data.formId}`);
  return formatDashboard(dashboard);
};

export const listDashboards = async (formId, userId, role) => {
  await assertFormOwner(formId, userId, role);
  const dashboards = await prisma.formDashboard.findMany({
    where: { formId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { widgets: true } } },
  });
  return dashboards.map(formatDashboardListItem);
};

export const getDashboardById = async (dashboardId, userId, role) => {
  const dashboard = await assertDashboardOwner(dashboardId, userId, role, {
    include: widgetsInclude,
  });
  return formatDashboard(dashboard);
};

export const updateDashboard = async (dashboardId, userId, role, data = {}) => {
  const dashboard = await assertDashboardOwner(dashboardId, userId, role);

  const updateData = {};
  for (const key of ["title", "description", "theme", "layout"]) {
    if (data[key] !== undefined) updateData[key] = data[key];
  }
  if (data.visibility !== undefined) {
    if (!VISIBILITIES.has(data.visibility))
      throw errors.badRequest("Invalid visibility");
    updateData.visibility = data.visibility;
  }
  if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
  if (data.slug !== undefined && data.slug.toLowerCase() !== dashboard.slug) {
    updateData.slug = await resolveSlug(data.slug, dashboardId);
  }

  const updated = await prisma.formDashboard.update({
    where: { id: dashboardId },
    data: updateData,
    include: widgetsInclude,
  });

  await invalidateAndRevalidate(dashboard.slug);
  if (updateData.slug) await invalidateAndRevalidate(updateData.slug);
  return formatDashboard(updated);
};

export const deleteDashboard = async (dashboardId, userId, role) => {
  const dashboard = await assertDashboardOwner(dashboardId, userId, role);
  await prisma.formDashboard.delete({ where: { id: dashboardId } });
  await invalidateAndRevalidate(dashboard.slug);
  logger.info(`Deleted dashboard ${dashboardId}`);
};

/**
 * Set or clear the dashboard password. Passing null/empty clears it.
 */
export const setPassword = async (dashboardId, userId, role, password) => {
  const dashboard = await assertDashboardOwner(dashboardId, userId, role);
  const passwordHash = password ? await hashPassword(password) : null;
  await prisma.formDashboard.update({
    where: { id: dashboardId },
    data: { passwordHash },
  });
  await invalidateAndRevalidate(dashboard.slug);
  return { hasPassword: Boolean(passwordHash) };
};

// ===========================================
// Cache invalidation
// ===========================================

export const invalidateAndRevalidate = async (slug) => {
  await invalidateDashboard(slug);
  revalidateDashboardTag(slug);
};

/**
 * Invalidate every published dashboard belonging to a form. Called when a new
 * response is submitted so aggregated public data refreshes promptly.
 */
export const invalidateDashboardsForForm = async (formId) => {
  const dashboards = await prisma.formDashboard.findMany({
    where: { formId, isPublished: true },
    select: { slug: true },
  });
  await Promise.all(dashboards.map((d) => invalidateAndRevalidate(d.slug)));
};

// ===========================================
// Formatters
// ===========================================

const buildPublicUrl = (slug) => `${config.domains.shortlink}/d/${slug}`;

export const formatWidget = (w) => ({
  id: w.id,
  questionId: w.questionId,
  type: w.type,
  aggregation: w.aggregation,
  title: w.title,
  position: w.position,
  config: w.config ?? null,
});

export const formatDashboard = (d) => ({
  id: d.id,
  formId: d.formId,
  slug: d.slug,
  url: buildPublicUrl(d.slug),
  title: d.title,
  description: d.description,
  theme: d.theme,
  isPublished: d.isPublished,
  visibility: d.visibility,
  hasPassword: Boolean(d.passwordHash),
  layout: d.layout ?? null,
  widgets: d.widgets ? d.widgets.map(formatWidget) : [],
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});

const formatDashboardListItem = (d) => ({
  id: d.id,
  slug: d.slug,
  url: buildPublicUrl(d.slug),
  title: d.title,
  isPublished: d.isPublished,
  visibility: d.visibility,
  hasPassword: Boolean(d.passwordHash),
  widgetCount: d._count?.widgets ?? 0,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});

export default {
  isSlugAvailable,
  assertDashboardOwner,
  createDashboard,
  listDashboards,
  getDashboardById,
  updateDashboard,
  deleteDashboard,
  setPassword,
  invalidateAndRevalidate,
  invalidateDashboardsForForm,
  formatDashboard,
  formatWidget,
};
