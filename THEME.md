# IronTracker Dark Theme & PWA Guide

## Theme Overview

The app has been transformed to feature a modern dark sports aesthetic with vibrant green accents, inspired by professional fitness tracking applications.

### Color Palette

**Primary Colors:**
- **Background**: `#0f0f0f` (Nearly black)
- **Surface**: `#1a1a1a` (Dark gray cards)
- **Surface2**: `#242424` (Lighter dark gray)
- **Border**: `#333333` (Dark borders)

**Accent Colors:**
- **Primary/Success**: `#00d084` (Vibrant green - main accent)
- **Text Primary**: `#ffffff` (White)
- **Text Secondary**: `#999999` (Light gray)

**Functional Colors:**
- **Danger**: `#ef4444` (Red)
- **Warning**: `#f59e0b` (Amber)
- **Gold**: `#f59e0b` (Amber)

### Design Tokens

All color values are defined in `styles/tokens.ts` and are referenced throughout the app via the `PALETTE` constant. This ensures consistent theming across all components.

## PWA Configuration

### What's Included

1. **Web App Manifest** (`public/manifest.json`)
   - Defines app name, icons, theme colors, and shortcuts
   - Enables standalone display mode
   - Includes app shortcuts for quick actions (Workout, Programs, Analytics)

2. **Service Worker** (`public/sw.js`)
   - Offline support with cache-first strategy for assets
   - Network-first strategy for HTML pages
   - Automatic cache cleanup on updates
   - Handles offline navigation gracefully

3. **Icons & Assets**
   - App icon with green and dark theme colors
   - Optimized for various screen sizes
   - Supports both regular and maskable icon formats

4. **Meta Tags** (in `index.html`)
   - `theme-color`: Dark gray (#1a1a1a)
   - `apple-mobile-web-app-capable`: Enables fullscreen on iOS
   - `apple-mobile-web-app-status-bar-style`: Black status bar
   - PWA-ready configuration

### Installation

Users can install IronTracker as a PWA by:

**On Mobile (iOS/Android):**
1. Open the app in a web browser
2. Tap share/menu button
3. Select "Add to Home Screen" or "Install app"
4. The app will appear as a native app on their home screen

**On Desktop (Chrome/Edge):**
1. Click the "Install" button in the address bar (when available)
2. The app will install as a desktop application

### Features

- **Offline Support**: The app caches essential assets and pages, allowing basic functionality offline
- **Quick Actions**: App shortcuts provide fast access to common features
- **Native Feel**: Runs in standalone mode without browser UI
- **Full Screen**: Utilizes available screen space without address bar
- **Status Bar Integration**: Matches the dark theme on mobile devices

## Component Styling

### Updated Components

The following components have been updated with dark theme styling:

- **AppHeader**: Dark background with green accents
- **Modal/ConfirmationModal**: Dark cards with proper contrast
- **SectionCard**: Dark surface with subtle borders
- **ExerciseCard**: Dark stats display with green highlights
- **DashboardView**: Dark layout with green success indicators
- **AnalyticsView**: Dark charts and analytics cards
- **SettingsView**: Dark form controls
- **ProgramsView**: Dark program cards with green interactive elements
- **LibraryView**: Dark exercise library with green filters

All components automatically adapt to the dark theme through Tailwind CSS classes and PALETTE tokens.

## Building & Deployment

### Development

```bash
npm run dev
```

The dev server includes full PWA support with service worker registration.

### Production Build

```bash
npm run build
```

The build process:
1. Creates optimized chunks with code splitting
2. Minifies all assets
3. Generates manifest.json and icons
4. Includes service worker

The app is fully PWA-compliant and ready for deployment to any static host (Vercel, Netlify, etc.)

## Browser Support

- **Android**: Chrome 39+, Firefox 25+, Samsung Internet 4+
- **iOS**: Safari 11.3+ (with limitations on caching)
- **Desktop**: Chrome 40+, Edge 79+, Firefox 55+

## Performance Notes

- Service worker caches assets for instant subsequent loads
- Tailwind CSS is loaded via CDN for optimal caching
- Code splitting reduces initial bundle size
- Dark theme requires less power on OLED screens

## Troubleshooting

### PWA not installing?
- Ensure HTTPS is enabled (required for PWA)
- Check that manifest.json is valid
- Clear browser cache and try again

### Service worker not updating?
- Force refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Clear site data in browser settings
- Service workers update automatically on next visit

### Dark theme not applying?
- Verify `html class="dark"` is set in index.html
- Check that dark mode is enabled in Tailwind config
- Clear browser cache
