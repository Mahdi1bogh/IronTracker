
import React from 'react';
import { triggerHaptic } from '../../../core/utils';

interface AnalyticsHeaderProps {
    period: '7d'|'30d'|'90d';
    setPeriod: (p: '7d'|'30d'|'90d') => void;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({ period, setPeriod }) => (
    <div className="flex items-center justify-between px-2">
         <h2 className="text-2xl font-bold uppercase text-white">Activité</h2>
         <div className="bg-surface p-1 rounded-lg flex gap-1 border border-border">
             {['7d', '30d', '90d'].map((p) => (
                 <button 
                    key={p} 
                    onClick={() => { triggerHaptic('click'); setPeriod(p as any); }}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-medium uppercase transition-all ${period === p ? 'bg-primary text-white' : 'text-secondary hover:text-secondary'}`}
                 >
                     {p}
                 </button>
             ))}
         </div>
    </div>
);
