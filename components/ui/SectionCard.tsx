
import React from 'react';

interface SectionCardProps {
    children?: React.ReactNode;
    className?: string;
    radius?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ children, className = "", radius = "rounded-xl" }) => (
    <div className={`bg-surface border border-border shadow-sm ${radius} ${className}`}>
        {children}
    </div>
);
