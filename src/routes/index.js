// ===========================================
// Heisenlink - Routes Index
// ===========================================

import { Router } from 'express';

// Import route modules
import authRoutes from './auth.routes.js';
import linksRoutes from './links.routes.js';
import bioRoutes from './bio.routes.js';
import formsRoutes from './forms.routes.js';
import analyticsRoutes from './analytics.routes.js';
import adminRoutes from './admin.routes.js';
import publicRoutes from './public.routes.js';
import systemRoutes from './system.routes.js';

const router = Router();

// ===========================================
// API Routes
// ===========================================

// Authentication routes
router.use('/api/auth', authRoutes);

// Links management routes
router.use('/api/links', linksRoutes);

// Bio page routes
router.use('/api/bio', bioRoutes);

// Form routes
router.use('/api/forms', formsRoutes);

// Analytics routes
router.use('/api/analytics', analyticsRoutes);

// Admin routes
router.use('/api/admin', adminRoutes);

// System info (config flags for the dashboard)
router.use('/api/system', systemRoutes);

// ===========================================
// Public Routes (Redirects & Bio Pages)
// ===========================================
router.use('/', publicRoutes);

export default router;
