// ===========================================
// Heisenlink - Analytics Service
// ===========================================

import prisma from '../config/database.js';
import { Prisma } from '@prisma/client';
import UAParser from 'ua-parser-js';
import logger from '../utils/logger.js';

/**
 * Track a click event
 * @param {object} data - Click event data
 */
export const trackClick = async (data) => {
    const { linkId, linkType, req } = data;

    try {
        // Parse user agent
        const parser = new UAParser(req.headers['user-agent']);
        const device = parser.getDevice();
        const browser = parser.getBrowser();
        const os = parser.getOS();

        // Get IP address
        const ipAddress = req.ip ||
            req.headers['x-forwarded-for']?.split(',')[0] ||
            req.connection?.remoteAddress;

        // Create click event
        await prisma.clickEvent.create({
            data: {
                shortLinkId: linkType === 'SHORTLINK' ? linkId : null,
                bioLinkId: linkType === 'BIOLINK' ? linkId : null,
                linkType,
                ipAddress,
                userAgent: req.headers['user-agent'],
                referrer: req.headers.referer || req.headers.referrer || null,
                deviceType: device.type || 'desktop',
                browser: browser.name || 'Unknown',
                os: os.name || 'Unknown',
                // Note: For production, you'd want to use a GeoIP service
                country: null,
                city: null,
            },
        });
    } catch (error) {
        // Don't throw - analytics should not break the redirect
        logger.error('Failed to track click:', error.message);
    }
};

/**
 * Get analytics overview for a user
 * @param {string} userId - User ID
 * @param {object} dateRange - Date range filter
 * @returns {Promise<object>}
 */
export const getOverview = async (userId, dateRange = {}) => {
    const { from, to } = dateRange;

    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    // Get user's links
    const userLinks = await prisma.shortLink.findMany({
        where: { userId },
        select: { id: true },
    });

    const linkIds = userLinks.map(l => l.id);

    // Get user's bio page
    const bioPage = await prisma.bioPage.findUnique({
        where: { userId },
        include: { bioLinks: { select: { id: true } } },
    });

    const bioLinkIds = bioPage?.bioLinks.map(l => l.id) || [];

    // Total links
    const totalLinks = linkIds.length;

    // Total clicks on shortlinks
    const shortlinkClicks = await prisma.clickEvent.count({
        where: {
            shortLinkId: { in: linkIds },
            ...(Object.keys(dateFilter).length > 0 && { clickedAt: dateFilter }),
        },
    });

    // Total clicks on bio links
    const bioLinkClicks = await prisma.clickEvent.count({
        where: {
            bioLinkId: { in: bioLinkIds },
            ...(Object.keys(dateFilter).length > 0 && { clickedAt: dateFilter }),
        },
    });

    // Clicks by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let clicksByDay = [];

    if (linkIds.length > 0 || bioLinkIds.length > 0) {
        // Explicitly cast to uuid[] for Postgres
        // Note: Prisma raw query handling of arrays can be tricky. 
        // We'll use a safer approach if possible, or ensure arrays are valid.

        try {
            clicksByDay = await prisma.$queryRaw`
                SELECT 
                  DATE(clicked_at) as date,
                  COUNT(*) as clicks
                FROM click_events
                WHERE (
                    short_link_id IN (${Object.keys(linkIds).length > 0 ? Prisma.join(linkIds) : null})
                    OR 
                    bio_link_id IN (${Object.keys(bioLinkIds).length > 0 ? Prisma.join(bioLinkIds) : null})
                )
                AND clicked_at >= ${thirtyDaysAgo}
                GROUP BY DATE(clicked_at)
                ORDER BY date DESC
            `;
        } catch (e) {
            // Fallback or ignore if query fails
            logger.warn('Failed to fetch clicksByDay', e);
        }
    }

    // Top performing links
    const topLinks = await prisma.shortLink.findMany({
        where: { userId },
        orderBy: { clickCount: 'desc' },
        take: 5,
        select: {
            id: true,
            code: true,
            title: true,
            clickCount: true,
        },
    });

    // --- Global Breakdowns ---

    // Filter for all user's links
    const whereClause = {
        OR: [
            { shortLinkId: { in: linkIds } },
            { bioLinkId: { in: bioLinkIds } }
        ],
        ...(Object.keys(dateFilter).length > 0 && { clickedAt: dateFilter }),
    };

    // Device breakdown
    const deviceBreakdown = await prisma.clickEvent.groupBy({
        by: ['deviceType'],
        where: whereClause,
        _count: true,
    });

    // Browser breakdown
    const browserBreakdown = await prisma.clickEvent.groupBy({
        by: ['browser'],
        where: whereClause,
        _count: true,
    });

    // OS breakdown
    const osBreakdown = await prisma.clickEvent.groupBy({
        by: ['os'],
        where: whereClause,
        _count: true,
    });

    // Top referrers
    const referrerBreakdown = await prisma.clickEvent.groupBy({
        by: ['referrer'],
        where: {
            ...whereClause,
            referrer: { not: null },
        },
        _count: true,
        orderBy: { _count: { referrer: 'desc' } },
        take: 10,
    });

    return {
        totalLinks,
        totalClicks: shortlinkClicks + bioLinkClicks,
        shortlinkClicks,
        bioLinkClicks,
        clicksByDay,
        topLinks,
        deviceBreakdown: deviceBreakdown.map(d => ({
            device: d.deviceType || 'unknown',
            count: d._count,
        })),
        browserBreakdown: browserBreakdown.map(b => ({
            browser: b.browser || 'unknown',
            count: b._count,
        })),
        osBreakdown: osBreakdown.map(o => ({
            os: o.os || 'unknown',
            count: o._count,
        })),
        referrerBreakdown: referrerBreakdown.map(r => ({
            referrer: r.referrer,
            count: r._count,
        })),
    };
};

/**
 * Get global analytics overview (all users, all links) for admin
 * @param {object} dateRange - Date range filter
 * @returns {Promise<object>}
 */
export const getGlobalOverview = async (dateRange = {}) => {
    const { from, to } = dateRange;

    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const clickDateWhere = Object.keys(dateFilter).length > 0 ? { clickedAt: dateFilter } : {};

    // Get global counts
    const [totalUsers, activeUsers, totalLinks, totalBioPages, shortlinkClicks, bioLinkClicks, recentUsers] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.shortLink.count(),
        prisma.bioPage.count(),
        prisma.clickEvent.count({
            where: {
                linkType: 'SHORTLINK',
                ...clickDateWhere,
            },
        }),
        prisma.clickEvent.count({
            where: {
                linkType: 'BIOLINK',
                ...clickDateWhere,
            },
        }),
        prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                username: true,
                displayName: true,
                createdAt: true,
            },
        }),
    ]);

    // Clicks by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let clicksByDay = [];
    try {
        clicksByDay = await prisma.$queryRaw`
            SELECT 
              DATE(clicked_at) as date,
              COUNT(*) as clicks
            FROM click_events
            WHERE clicked_at >= ${thirtyDaysAgo}
            GROUP BY DATE(clicked_at)
            ORDER BY date DESC
        `;
    } catch (e) {
        logger.warn('Failed to fetch global clicksByDay', e);
    }

    // Top performing links (globally)
    const topLinks = await prisma.shortLink.findMany({
        orderBy: { clickCount: 'desc' },
        take: 10,
        select: {
            id: true,
            code: true,
            title: true,
            clickCount: true,
            user: {
                select: { username: true, displayName: true },
            },
        },
    });

    // Top users by links
    const topUsersByLinks = await prisma.user.findMany({
        select: {
            username: true,
            displayName: true,
            _count: { select: { shortLinks: true } },
        },
        orderBy: { shortLinks: { _count: 'desc' } },
        take: 5,
    });

    // Global breakdowns
    const whereClause = { ...clickDateWhere };

    // Device breakdown
    const deviceBreakdown = await prisma.clickEvent.groupBy({
        by: ['deviceType'],
        where: whereClause,
        _count: true,
    });

    // Browser breakdown
    const browserBreakdown = await prisma.clickEvent.groupBy({
        by: ['browser'],
        where: whereClause,
        _count: true,
    });

    // OS breakdown
    const osBreakdown = await prisma.clickEvent.groupBy({
        by: ['os'],
        where: whereClause,
        _count: true,
    });

    // Top referrers
    const referrerBreakdown = await prisma.clickEvent.groupBy({
        by: ['referrer'],
        where: {
            ...whereClause,
            referrer: { not: null },
        },
        _count: true,
        orderBy: { _count: { referrer: 'desc' } },
        take: 10,
    });

    return {
        totalUsers,
        activeUsers,
        totalLinks,
        totalBioPages,
        totalClicks: shortlinkClicks + bioLinkClicks,
        shortlinkClicks,
        bioLinkClicks,
        clicksByDay,
        topLinks: topLinks.map(l => ({
            id: l.id,
            code: l.code,
            title: l.title,
            clickCount: l.clickCount,
            owner: l.user?.displayName || l.user?.username,
        })),
        topUsersByLinks: topUsersByLinks.map(u => ({
            username: u.username,
            displayName: u.displayName,
            linksCount: u._count.shortLinks,
        })),
        recentUsers,
        deviceBreakdown: deviceBreakdown.map(d => ({
            device: d.deviceType || 'unknown',
            count: d._count,
        })),
        browserBreakdown: browserBreakdown.map(b => ({
            browser: b.browser || 'unknown',
            count: b._count,
        })),
        osBreakdown: osBreakdown.map(o => ({
            os: o.os || 'unknown',
            count: o._count,
        })),
        referrerBreakdown: referrerBreakdown.map(r => ({
            referrer: r.referrer,
            count: r._count,
        })),
    };
};

/**
 * Get analytics for a specific link
 * @param {string} linkId - Link ID
 * @param {object} dateRange - Date range filter
 * @returns {Promise<object>}
 */
export const getLinkAnalytics = async (linkId, dateRange = {}) => {
    const { from, to } = dateRange;

    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const whereClause = {
        shortLinkId: linkId,
        ...(Object.keys(dateFilter).length > 0 && { clickedAt: dateFilter }),
    };

    // Total clicks
    const totalClicks = await prisma.clickEvent.count({ where: whereClause });

    // Unique visitors (by IP)
    const uniqueVisitors = await prisma.clickEvent.groupBy({
        by: ['ipAddress'],
        where: whereClause,
    });

    // Device breakdown
    const deviceBreakdown = await prisma.clickEvent.groupBy({
        by: ['deviceType'],
        where: whereClause,
        _count: true,
    });

    // Browser breakdown
    const browserBreakdown = await prisma.clickEvent.groupBy({
        by: ['browser'],
        where: whereClause,
        _count: true,
    });

    // OS breakdown
    const osBreakdown = await prisma.clickEvent.groupBy({
        by: ['os'],
        where: whereClause,
        _count: true,
    });

    // Top referrers
    const referrerBreakdown = await prisma.clickEvent.groupBy({
        by: ['referrer'],
        where: {
            ...whereClause,
            referrer: { not: null },
        },
        _count: true,
        orderBy: { _count: { referrer: 'desc' } },
        take: 10,
    });

    // Clicks by day
    const clicksByDay = await prisma.$queryRaw`
    SELECT 
      DATE(clicked_at) as date,
      COUNT(*) as clicks
    FROM click_events
    WHERE short_link_id = ${linkId}::uuid
      ${from ? prisma.sql`AND clicked_at >= ${new Date(from)}` : prisma.sql``}
      ${to ? prisma.sql`AND clicked_at <= ${new Date(to)}` : prisma.sql``}
    GROUP BY DATE(clicked_at)
    ORDER BY date DESC
    LIMIT 30
  `;

    return {
        totalClicks,
        uniqueVisitors: uniqueVisitors.length,
        deviceBreakdown: deviceBreakdown.map(d => ({
            device: d.deviceType || 'unknown',
            count: d._count,
        })),
        browserBreakdown: browserBreakdown.map(b => ({
            browser: b.browser || 'unknown',
            count: b._count,
        })),
        osBreakdown: osBreakdown.map(o => ({
            os: o.os || 'unknown',
            count: o._count,
        })),
        referrerBreakdown: referrerBreakdown.map(r => ({
            referrer: r.referrer,
            count: r._count,
        })),
        clicksByDay,
    };
};

export default {
    trackClick,
    getOverview,
    getGlobalOverview,
    getLinkAnalytics,
};
