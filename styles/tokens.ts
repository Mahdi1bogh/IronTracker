
export const PALETTE = {
    // Base Colors (Dark Theme)
    background: '#0d1117',
    surface: '#161b22',
    surface2: '#21262d',
    border: '#30363d',
    
    // Text Colors
    text: {
        primary: '#c9d1d9',
        secondary: '#8b949e',
        white: '#ffffff',
        black: '#000000',
    },

    // Semantic Colors
    success: '#238636', // Green
    danger: '#da3633',  // Red
    warning: '#fb8c00', // Orange
    info: '#58a6ff',    // Blue
    gold: '#d29922',    // Gold/Yellow

    // Accent Colors (Themeable)
    accents: {
        blue: { primary: '#58a6ff', glow: 'rgba(88,166,255,0.3)' },
        emerald: { primary: '#3fb950', glow: 'rgba(63,185,80,0.3)' },
        gold: { primary: '#d29922', glow: 'rgba(210,153,34,0.3)' },
        purple: { primary: '#a371f7', glow: 'rgba(163,113,247,0.3)' },
        red: { primary: '#f85149', glow: 'rgba(248,81,73,0.3)' },
        cyan: { primary: '#00ffcc', glow: 'rgba(0,255,204,0.3)' },
        gray: { primary: '#8b949e', glow: 'rgba(139,148,158,0.3)' },
    },

    // Functional Colors (Specific domains)
    muscle: {
        pecs: '#58a6ff',
        back: '#3fb950',
        legs: '#d29922',
        shoulders: '#a371f7',
        arms: '#f85149',
        abs: '#00ffcc',
        calves: '#ff7b72',
        forearms: '#79c0ff',
        cardio: '#8b949e',
        neck: '#79c0ff'
    },
    fatigue: {
        1: '#da3633', // Épuisé
        2: '#fb8c00',
        3: '#d29922',
        4: '#7ee787',
        5: '#238636'  // En forme
    }
};

export const SPACING = {
    none: 0,
    xs: 4,   // 0.25rem
    sm: 8,   // 0.5rem
    md: 16,  // 1rem
    lg: 24,  // 1.5rem
    xl: 32,  // 2rem
    xxl: 48, // 3rem
};

export const RADIUS = {
    sm: '0.5rem',  // 8px
    md: '1rem',    // 16px
    lg: '2rem',    // 32px (Cards/Buttons)
    full: '9999px' // Pills/Circles
};
