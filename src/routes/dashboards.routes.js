// ===========================================
// Heisenlink - Dashboard Routes
// ===========================================

import { Router } from "express";
import * as dashboardsController from "../controllers/dashboards.controller.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { rateLimiters } from "../middleware/rateLimiter.middleware.js";
import {
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
} from "../validators/dashboards.validator.js";

const router = Router();

// ===========================================
// Public Routes (no auth)
// ===========================================

router.get(
  "/public/:slug",
  rateLimiters.api,
  validateParams(slugParamSchema),
  dashboardsController.getPublicDashboard,
);

router.post(
  "/public/:slug/verify-password",
  rateLimiters.formSubmit,
  validateParams(slugParamSchema),
  validateBody(verifyPasswordSchema),
  dashboardsController.verifyDashboardPassword,
);

// Compatibility matrix for the builder UI (static, safe to expose).
router.get("/meta/widget-types", dashboardsController.getWidgetTypes);

// ===========================================
// Authenticated Routes
// ===========================================
router.use(authenticate);

// Static paths BEFORE dynamic :id
router.get("/slug-check", dashboardsController.checkSlug);

router.get(
  "/",
  validateQuery(listDashboardsQuerySchema),
  dashboardsController.listDashboards,
);
router.post(
  "/",
  validateBody(createDashboardSchema),
  dashboardsController.createDashboard,
);

router.get(
  "/:id",
  validateParams(dashboardIdParamSchema),
  dashboardsController.getDashboard,
);
router.get(
  "/:id/data",
  validateParams(dashboardIdParamSchema),
  dashboardsController.getDashboardData,
);
router.patch(
  "/:id",
  validateParams(dashboardIdParamSchema),
  validateBody(updateDashboardSchema),
  dashboardsController.updateDashboard,
);
router.delete(
  "/:id",
  validateParams(dashboardIdParamSchema),
  dashboardsController.deleteDashboard,
);
router.post(
  "/:id/password",
  validateParams(dashboardIdParamSchema),
  validateBody(setPasswordSchema),
  dashboardsController.setDashboardPassword,
);

// ===========================================
// Widgets
// ===========================================

router.post(
  "/:id/widgets",
  validateParams(dashboardIdParamSchema),
  validateBody(createWidgetSchema),
  dashboardsController.addWidget,
);

// Static-ish path BEFORE dynamic :wid
router.patch(
  "/:id/widgets/reorder",
  validateParams(dashboardIdParamSchema),
  validateBody(reorderWidgetsSchema),
  dashboardsController.reorderWidgets,
);

router.patch(
  "/:id/widgets/:wid",
  validateParams(widgetIdParamSchema),
  validateBody(updateWidgetSchema),
  dashboardsController.updateWidget,
);

router.delete(
  "/:id/widgets/:wid",
  validateParams(widgetIdParamSchema),
  dashboardsController.deleteWidget,
);

export default router;
