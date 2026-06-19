// ===========================================
// Heisenlink - Analytics Controller
// ===========================================

import * as analyticsService from '../services/analytics.service.js';
import { formatResponse } from '../utils/helpers.js';

/**
 * Get analytics overview
 * GET /api/analytics/overview
 */
export const getOverview = async (req, res, next) => {
    try {
        const { from, to } = req.query;

        const overview = await analyticsService.getOverview(req.user.sub, { from, to });

        res.json(formatResponse(overview));
    } catch (error) {
        next(error);
    }
};

/**
 * Get link analytics
 * GET /api/analytics/links/:id
 */
export const getLinkAnalytics = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { from, to } = req.query;

        const analytics = await analyticsService.getLinkAnalytics(id, { from, to });

        res.json(formatResponse(analytics));
    } catch (error) {
        next(error);
    }
};

/**
 * Export analytics data
 * GET /api/analytics/export
 */
export const exportAnalytics = async (req, res, next) => {
    try {
        const { from, to, format = 'csv' } = req.query;

        const overview = await analyticsService.getOverview(req.user.sub, { from, to });

        if (format === 'csv') {
            // Generate CSV
            const rows = [
                ['Metric', 'Value'],
                ['Total Links', overview.totalLinks],
                ['Total Clicks', overview.totalClicks],
                ['Shortlink Clicks', overview.shortlinkClicks],
                ['Bio Link Clicks', overview.bioLinkClicks],
            ];

            const csv = rows.map(row => row.join(',')).join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="analytics-${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csv);
        } else {
            res.json(formatResponse(overview));
        }
    } catch (error) {
        next(error);
    }
};

export default {
    getOverview,
    getLinkAnalytics,
    exportAnalytics,
};
