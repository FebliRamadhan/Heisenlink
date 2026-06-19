// ===========================================
// Heisenlink - Bio Page Themes
// ===========================================

export const themes = {
    light: {
        id: 'light',
        name: 'Light',
        background: '#ffffff',
        cardBackground: '#f3f4f6',
        text: '#1f2937',
        textSecondary: '#6b7280',
        buttonBg: '#3b82f6',
        buttonText: '#ffffff',
        buttonHover: '#2563eb',
    },
    dark: {
        id: 'dark',
        name: 'Dark',
        background: '#1f2937',
        cardBackground: '#374151',
        text: '#f9fafb',
        textSecondary: '#9ca3af',
        buttonBg: '#60a5fa',
        buttonText: '#1f2937',
        buttonHover: '#93c5fd',
    },
    gradient: {
        id: 'gradient',
        name: 'Gradient',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        cardBackground: 'rgba(255, 255, 255, 0.2)',
        text: '#ffffff',
        textSecondary: 'rgba(255, 255, 255, 0.8)',
        buttonBg: 'rgba(255, 255, 255, 0.9)',
        buttonText: '#667eea',
        buttonHover: '#ffffff',
    },
    ocean: {
        id: 'ocean',
        name: 'Ocean',
        background: 'linear-gradient(135deg, #0077b6 0%, #00b4d8 100%)',
        cardBackground: 'rgba(255, 255, 255, 0.15)',
        text: '#ffffff',
        textSecondary: 'rgba(255, 255, 255, 0.8)',
        buttonBg: '#ffffff',
        buttonText: '#0077b6',
        buttonHover: '#f0f9ff',
    },
    sunset: {
        id: 'sunset',
        name: 'Sunset',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        cardBackground: 'rgba(255, 255, 255, 0.2)',
        text: '#ffffff',
        textSecondary: 'rgba(255, 255, 255, 0.8)',
        buttonBg: '#ffffff',
        buttonText: '#f5576c',
        buttonHover: '#fef2f2',
    },
    forest: {
        id: 'forest',
        name: 'Forest',
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        cardBackground: 'rgba(255, 255, 255, 0.15)',
        text: '#ffffff',
        textSecondary: 'rgba(255, 255, 255, 0.8)',
        buttonBg: '#ffffff',
        buttonText: '#11998e',
        buttonHover: '#ecfdf5',
    },
    midnight: {
        id: 'midnight',
        name: 'Midnight',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        cardBackground: 'rgba(255, 255, 255, 0.1)',
        text: '#ffffff',
        textSecondary: 'rgba(255, 255, 255, 0.7)',
        buttonBg: '#818cf8',
        buttonText: '#ffffff',
        buttonHover: '#a5b4fc',
    },
    rose: {
        id: 'rose',
        name: 'Rose',
        background: 'linear-gradient(135deg, #fecdd3 0%, #fda4af 100%)',
        cardBackground: 'rgba(255, 255, 255, 0.6)',
        text: '#881337',
        textSecondary: '#be123c',
        buttonBg: '#e11d48',
        buttonText: '#ffffff',
        buttonHover: '#f43f5e',
    },
    // New themes
    neon: {
        id: 'neon',
        name: 'Neon',
        background: '#0a0a0a',
        cardBackground: 'rgba(0, 255, 136, 0.05)',
        text: '#00ff88',
        textSecondary: '#00cc6a',
        buttonBg: 'transparent',
        buttonText: '#00ff88',
        buttonHover: 'rgba(0, 255, 136, 0.2)',
        buttonBorder: '#00ff88',
    },
    minimal: {
        id: 'minimal',
        name: 'Minimal',
        background: '#fafafa',
        cardBackground: '#ffffff',
        text: '#171717',
        textSecondary: '#737373',
        buttonBg: '#171717',
        buttonText: '#fafafa',
        buttonHover: '#262626',
    },
    aurora: {
        id: 'aurora',
        name: 'Aurora',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d1b4e 50%, #1a3c4d 100%)',
        cardBackground: 'rgba(255, 255, 255, 0.08)',
        text: '#e0f2f1',
        textSecondary: '#80cbc4',
        buttonBg: 'rgba(129, 199, 132, 0.8)',
        buttonText: '#1b5e20',
        buttonHover: 'rgba(129, 199, 132, 1)',
    },
    candy: {
        id: 'candy',
        name: 'Candy',
        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ffecd2 100%)',
        cardBackground: 'rgba(255, 255, 255, 0.7)',
        text: '#6d4c41',
        textSecondary: '#8d6e63',
        buttonBg: '#ff8a65',
        buttonText: '#ffffff',
        buttonHover: '#ff7043',
    },
    corporate: {
        id: 'corporate',
        name: 'Corporate',
        background: '#f5f5f5',
        cardBackground: '#ffffff',
        text: '#1e3a5f',
        textSecondary: '#546e7a',
        buttonBg: '#1e3a5f',
        buttonText: '#ffffff',
        buttonHover: '#2d4a6f',
    },
};

/**
 * Get theme by ID
 * @param {string} themeId - Theme ID
 * @returns {object|null}
 */
export const getTheme = (themeId) => {
    return themes[themeId] || themes.gradient;
};

/**
 * Get all themes as array
 * @returns {array}
 */
export const getAllThemes = () => {
    return Object.values(themes);
};

/**
 * Get theme IDs
 * @returns {array}
 */
export const getThemeIds = () => {
    return Object.keys(themes);
};

export default themes;
