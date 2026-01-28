
import React from 'react';

interface IconProps {
  className?: string;
  fill?: string;
  strokeWidth?: number;
  size?: number;
}

// Wrapper pour garantir l'uniformité du Design System
const IconWrapper: React.FC<{ children: React.ReactNode } & IconProps> = ({ 
  children, 
  className = "", 
  fill = "none", 
  strokeWidth = 2,
  size = 24
}) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size}
    height={size}
    viewBox="0 0 24 24" 
    fill={fill} 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {children}
  </svg>
);

export const Icons = {
  // Navigation
  Dashboard: (props: IconProps) => (
    <IconWrapper {...props}>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </IconWrapper>
  ),
  Programs: (props: IconProps) => (
    <IconWrapper {...props}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </IconWrapper>
  ),
  Library: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </IconWrapper>
  ),
  Settings: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </IconWrapper>
  ),

  // Feature Icons
  Workout: (props: IconProps) => (
    <IconWrapper {...props} fill={props.fill === 'currentColor' ? 'currentColor' : 'none'}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </IconWrapper>
  ),
  Dumbbell: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="m6.5 6.5 11 11" />
      <path d="m21 21-1-1" />
      <path d="m3 3 1 1" />
      <path d="m18 22 4-4" />
      <path d="m2 6 4-4" />
      <path d="m3 10 7-7" />
      <path d="m14 21 7-7" />
    </IconWrapper>
  ),
  Analytics: (props: IconProps) => (
    <IconWrapper {...props}>
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
    </IconWrapper>
  ),
  TrendUp: (props: IconProps) => (
    <IconWrapper {...props}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </IconWrapper>
  ),
  Exchange: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="M8 3 4 7l4 4" />
      <path d="M4 7h16" />
      <path d="m16 21 4-4-4-4" />
      <path d="M20 17H4" />
    </IconWrapper>
  ),
  Records: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </IconWrapper>
  ),
  Fitness: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </IconWrapper>
  ),

  // Updated & New Icons
  Disc: (props: IconProps) => (
    <IconWrapper {...props}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <circle cx="12" cy="12" r="6" strokeOpacity="0.4" />
    </IconWrapper>
  ),
  
  // PROPOSALS (New)
  User: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </IconWrapper>
  ),
  History: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </IconWrapper>
  ),
  Trophy: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M12 17V7" />
      <path d="M2 7h20v4a8 8 0 0 1-16 0V7Z" />
    </IconWrapper>
  ),
  Flame: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </IconWrapper>
  ),
  Stopwatch: (props: IconProps) => (
    <IconWrapper {...props}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2" />
      <path d="M5 3 2 6" />
      <path d="m22 6-3-3" />
      <path d="M12 2v4" />
    </IconWrapper>
  ),

  // UI Elements
  Calendar: (props: IconProps) => (
    <IconWrapper {...props}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </IconWrapper>
  ),
  Note: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </IconWrapper>
  ),
  Menu: (props: IconProps) => (
    <IconWrapper {...props}>
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </IconWrapper>
  ),
  Close: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </IconWrapper>
  ),
  Check: (props: IconProps) => (
    <IconWrapper {...props}>
      <polyline points="20 6 9 17 4 12" />
    </IconWrapper>
  ),
  Star: (props: IconProps) => (
    <IconWrapper {...props} fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </IconWrapper>
  ),
  StarOutline: (props: IconProps) => (
    <IconWrapper {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </IconWrapper>
  ),
  Download: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </IconWrapper>
  ),
  Upload: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </IconWrapper>
  ),
  Table: (props: IconProps) => (
    <IconWrapper {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <line x1="3" x2="21" y1="9" y2="9" />
      <line x1="3" x2="21" y1="15" y2="15" />
      <line x1="12" x2="12" y1="3" y2="21" />
    </IconWrapper>
  ),
  Search: (props: IconProps) => (
    <IconWrapper {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </IconWrapper>
  ),
  Trash: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </IconWrapper>
  ),
  Plus: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </IconWrapper>
  ),
  ChevronUp: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="m18 15-6-6-6 6" />
    </IconWrapper>
  ),
  ChevronDown: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="m6 9 6 6 6-6" />
    </IconWrapper>
  ),
  ChevronLeft: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="m15 18-6-6 6-6" />
    </IconWrapper>
  ),
  ChevronRight: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="m9 18 6-6-6-6" />
    </IconWrapper>
  ),
  Tools: (props: IconProps) => (
    <IconWrapper {...props}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </IconWrapper>
  ),
  Calculator: (props: IconProps) => (
    <IconWrapper {...props}>
       <rect width="16" height="20" x="4" y="2" rx="2" />
       <line x1="8" x2="16" y1="6" y2="6" />
       <line x1="16" x2="16" y1="14" y2="18" />
       <path d="M16 10h.01" />
       <path d="M12 10h.01" />
       <path d="M8 10h.01" />
       <path d="M12 14h.01" />
       <path d="M8 14h.01" />
       <path d="M12 18h.01" />
       <path d="M8 18h.01" />
    </IconWrapper>
  )
};
