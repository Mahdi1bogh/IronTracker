
import React from 'react';
import { SectionCard } from './SectionCard';
import { PALETTE } from '../../styles/tokens';

interface ChartContainerProps {
    title: string;
    children: React.ReactNode;
    height?: string; // Tailwind class, defaults to h-64
    action?: React.ReactNode; // Optional header button (e.g. RST)
    footer?: React.ReactNode; // Optional legend or footer info
}

export const ChartContainer: React.FC<ChartContainerProps> = ({ 
    title, 
    children, 
    height = "h-64", 
    action, 
    footer 
}) => {
    return (
        <SectionCard className="p-3 flex flex-col" radius="rounded-2xl">
            <div className={`flex items-center ${title ? 'mb-4' : 'mb-0'} ${action ? 'justify-between' : 'justify-center'}`}>
                <h3 className="text-xs font-bold uppercase text-secondary tracking-wider">{title}</h3>
                {action && <div>{action}</div>}
            </div>
            
            <div className={`w-full ${height} overflow-hidden`}>
                {children}
            </div>

            {footer && (
                <div className="mt-2 pt-2 border-t border-border/30">
                    {footer}
                </div>
            )}
        </SectionCard>
    );
};

// Reusable standard chart configs
export const CHART_CONFIG = {
    axisStyle: {
        fontSize: 11, // Increased for mobile readability
        fill: PALETTE.text.secondary,
        fontWeight: 600
    },
    gridStyle: {
        stroke: '#ffffff10',
        strokeDasharray: '3 3'
    },
    tooltipStyle: {
        contentStyle: {
            backgroundColor: PALETTE.surface, 
            border: `1px solid ${PALETTE.border}`, 
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
        },
        itemStyle: {
            fontSize: '12px', 
            color: '#fff',
            fontWeight: 'bold'
        },
        labelStyle: {
            color: PALETTE.text.secondary, 
            marginBottom: '5px',
            fontSize: '11px',
            textTransform: 'uppercase' as const
        },
        cursor: {
            fill: 'transparent'
        }
    }
};
