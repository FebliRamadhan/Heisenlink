// ===========================================
// LinkHub - Icon Constants
// ===========================================

/**
 * Available icons for bio links
 * Using Lucide icon names
 */
export const icons = [
    { id: 'globe', name: 'Website', category: 'general' },
    { id: 'mail', name: 'Email', category: 'general' },
    { id: 'phone', name: 'Phone', category: 'general' },
    { id: 'map-pin', name: 'Location', category: 'general' },
    { id: 'link', name: 'Link', category: 'general' },
    { id: 'file-text', name: 'Document', category: 'general' },
    { id: 'download', name: 'Download', category: 'general' },
    { id: 'calendar', name: 'Calendar', category: 'general' },
    { id: 'clock', name: 'Time', category: 'general' },
    { id: 'heart', name: 'Heart', category: 'general' },
    { id: 'star', name: 'Star', category: 'general' },

    // Social Media
    { id: 'twitter', name: 'Twitter/X', category: 'social' },
    { id: 'instagram', name: 'Instagram', category: 'social' },
    { id: 'facebook', name: 'Facebook', category: 'social' },
    { id: 'linkedin', name: 'LinkedIn', category: 'social' },
    { id: 'youtube', name: 'YouTube', category: 'social' },
    { id: 'github', name: 'GitHub', category: 'social' },
    { id: 'twitch', name: 'Twitch', category: 'social' },
    { id: 'discord', name: 'Discord', category: 'social' },
    { id: 'slack', name: 'Slack', category: 'social' },

    // Business
    { id: 'briefcase', name: 'Work', category: 'business' },
    { id: 'building', name: 'Company', category: 'business' },
    { id: 'users', name: 'Team', category: 'business' },
    { id: 'dollar-sign', name: 'Payment', category: 'business' },
    { id: 'credit-card', name: 'Card', category: 'business' },
    { id: 'shopping-cart', name: 'Shop', category: 'business' },
    { id: 'store', name: 'Store', category: 'business' },

    // Media
    { id: 'music', name: 'Music', category: 'media' },
    { id: 'video', name: 'Video', category: 'media' },
    { id: 'camera', name: 'Photo', category: 'media' },
    { id: 'image', name: 'Image', category: 'media' },
    { id: 'podcast', name: 'Podcast', category: 'media' },
    { id: 'headphones', name: 'Audio', category: 'media' },

    // Development
    { id: 'code', name: 'Code', category: 'dev' },
    { id: 'terminal', name: 'Terminal', category: 'dev' },
    { id: 'git-branch', name: 'Git', category: 'dev' },
    { id: 'package', name: 'Package', category: 'dev' },
];

/**
 * Get icon by ID
 * @param {string} iconId - Icon ID
 * @returns {object|null}
 */
export const getIcon = (iconId) => {
    return icons.find(i => i.id === iconId) || null;
};

/**
 * Get icons by category
 * @param {string} category - Category name
 * @returns {array}
 */
export const getIconsByCategory = (category) => {
    return icons.filter(i => i.category === category);
};

/**
 * Get all categories
 * @returns {array}
 */
export const getCategories = () => {
    return [...new Set(icons.map(i => i.category))];
};

export default icons;
