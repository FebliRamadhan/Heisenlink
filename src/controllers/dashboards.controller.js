// ===========================================
// Heisenlink - Dashboard Controller
// ===========================================

import * as dashboardService from "../services/form-dashboard.service.js";
import * as widgetService from "../services/dashboard-widget.service.js";
import * as dataService from "../services/dashboard-data.service.js";
import { describeCompatibility } from "../services/widget-compatibility.js";
import { formatResponse } from "../utils/helpers.js";

const notFound = (res, message) =>
  res
    .status(404)
    .json({ success: false, error: { code: "NOT_FOUND", message } });

// ===========================================
// Public
// ===========================================

/** GET /api/dashboards/public/:slug */
export const getPublicDashboard = async (req, res, next) => {
  try {
    const dashboard = await dataService.getPublicDashboard(req.params.slug);
    if (!dashboard) return notFound(res, "Dashboard not found");
    res.json(formatResponse(dashboard));
  } catch (error) {
    next(error);
  }
};

/** POST /api/dashboards/public/:slug/verify-password */
export const verifyDashboardPassword = async (req, res, next) => {
  try {
    const dashboard = await dataService.verifyPasswordAndGetData(
      req.params.slug,
      req.body.password,
    );
    if (!dashboard) return notFound(res, "Dashboard not found");
    res.json(formatResponse(dashboard));
  } catch (error) {
    next(error);
  }
};

// ===========================================
// Meta
// ===========================================

/** GET /api/dashboards/meta/widget-types — compatibility matrix for the builder */
export const getWidgetTypes = async (req, res, next) => {
  try {
    res.json(formatResponse({ compatibility: describeCompatibility() }));
  } catch (error) {
    next(error);
  }
};

/** GET /api/dashboards/slug-check?slug=... */
export const checkSlug = async (req, res, next) => {
  try {
    const result = await dashboardService.isSlugAvailable(
      String(req.query.slug || ""),
    );
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

// ===========================================
// Dashboard CRUD (auth)
// ===========================================

/** GET /api/dashboards?formId=... */
export const listDashboards = async (req, res, next) => {
  try {
    const dashboards = await dashboardService.listDashboards(
      req.query.formId,
      req.user.sub,
      req.user.role,
    );
    res.json(formatResponse(dashboards));
  } catch (error) {
    next(error);
  }
};

/** POST /api/dashboards */
export const createDashboard = async (req, res, next) => {
  try {
    const dashboard = await dashboardService.createDashboard(
      req.user.sub,
      req.user.role,
      req.body,
    );
    res.status(201).json(formatResponse(dashboard));
  } catch (error) {
    next(error);
  }
};

/** GET /api/dashboards/:id */
export const getDashboard = async (req, res, next) => {
  try {
    const dashboard = await dashboardService.getDashboardById(
      req.params.id,
      req.user.sub,
      req.user.role,
    );
    res.json(formatResponse(dashboard));
  } catch (error) {
    next(error);
  }
};

/** GET /api/dashboards/:id/data */
export const getDashboardData = async (req, res, next) => {
  try {
    const data = await dataService.getDashboardData(
      req.params.id,
      req.user.sub,
      req.user.role,
    );
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/dashboards/:id */
export const updateDashboard = async (req, res, next) => {
  try {
    const dashboard = await dashboardService.updateDashboard(
      req.params.id,
      req.user.sub,
      req.user.role,
      req.body,
    );
    res.json(formatResponse(dashboard));
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/dashboards/:id */
export const deleteDashboard = async (req, res, next) => {
  try {
    await dashboardService.deleteDashboard(
      req.params.id,
      req.user.sub,
      req.user.role,
    );
    res.json(formatResponse({ deleted: true }));
  } catch (error) {
    next(error);
  }
};

/** POST /api/dashboards/:id/password */
export const setDashboardPassword = async (req, res, next) => {
  try {
    const result = await dashboardService.setPassword(
      req.params.id,
      req.user.sub,
      req.user.role,
      req.body.password ?? null,
    );
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

// ===========================================
// Widgets (auth)
// ===========================================

/** POST /api/dashboards/:id/widgets */
export const addWidget = async (req, res, next) => {
  try {
    const widget = await widgetService.addWidget(
      req.params.id,
      req.user.sub,
      req.user.role,
      req.body,
    );
    res.status(201).json(formatResponse(widget));
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/dashboards/:id/widgets/reorder */
export const reorderWidgets = async (req, res, next) => {
  try {
    await widgetService.reorderWidgets(
      req.params.id,
      req.user.sub,
      req.user.role,
      req.body.widgetIds,
    );
    res.json(formatResponse({ reordered: true }));
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/dashboards/:id/widgets/:wid */
export const updateWidget = async (req, res, next) => {
  try {
    const widget = await widgetService.updateWidget(
      req.params.id,
      req.params.wid,
      req.user.sub,
      req.user.role,
      req.body,
    );
    res.json(formatResponse(widget));
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/dashboards/:id/widgets/:wid */
export const deleteWidget = async (req, res, next) => {
  try {
    await widgetService.deleteWidget(
      req.params.id,
      req.params.wid,
      req.user.sub,
      req.user.role,
    );
    res.json(formatResponse({ deleted: true }));
  } catch (error) {
    next(error);
  }
};
