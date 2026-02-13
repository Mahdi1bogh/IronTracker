
export const PALETTE = {
    // Base Colors (Dark Theme - Sports Profile Style)
    background: '#0f0f0f', // Nearly black background
    surface: '#1a1a1a',    // Dark gray cards
    surface2: '#242424',   // Lighter dark gray
    border: '#333333',     // Dark border
    
    // Text Colors
    text: {
        primary: '#ffffff',    // White text
        secondary: '#999999',  // Light gray
        white: '#ffffff',
        black: '#000000',
    },

    // Strict Requested Colors
    success: '#00d084', // Green accent (like reference)
    warning: '#f59e0b', // Amber
    danger: '#ef4444',  // Red
    
    // UI Accents (Green focused)
    info: '#00d084',    // Green (Main accent)
    gold: '#f59e0b',    // Amber for gold/records

    // Functional Colors (Dark theme)
    muscle: {
        pecs: '#00d084',      // Green
        back: '#00d084',      // Green
        legs: '#f59e0b',      // Amber
        quads: '#eab308',     // Yellow
        hamstrings: '#f97316',// Orange
        glutes: '#ec4899',    // Pink
        shoulders: '#8b5cf6', // Purple
        arms: '#ef4444',      // Red
        abs: '#06b6d4',       // Cyan
        calves: '#ff5f1f',    // Orange
        forearms: '#6366f1',  // Indigo
        cardio: '#666666',    // Gray
        neck: '#666666'
    },
    
    // Fatigue Scale (RPE Adjusted: 1=Low/Good, 5=High/Bad)
    fatigue: {
        1: '#00d084', // Success (Facile)
        2: '#4ade80', // Light Green
        3: '#f59e0b', // Warning (Moyen)
        4: '#fb923c', // Orange
        5: '#ef4444'  // Danger (Epuisant)
    },

    // Accents for charts/themes (Green/Dark)
    accents: {
        blue: { primary: '#00d084', glow: 'rgba(0, 208, 132, 0.2)' },
        orange: { primary: '#f97316', glow: 'rgba(249, 115, 22, 0.2)' },
        emerald: { primary: '#00d084', glow: 'rgba(0, 208, 132, 0.2)' },
        gold: { primary: '#f59e0b', glow: 'rgba(245, 158, 11, 0.2)' },
        red: { primary: '#ef4444', glow: 'rgba(239, 68, 68, 0.2)' },
        purple: { primary: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.2)' },
        cyan: { primary: '#06b6d4', glow: 'rgba(6, 182, 212, 0.2)' },
        gray: { primary: '#666666', glow: 'rgba(102, 102, 102, 0.2)' }
    }
};

export const SPACING = {
    none: 0,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const RADIUS = {
    sm: '0.5rem',
    md: '1rem',
    lg: '2rem',
    full: '9999px'
};
