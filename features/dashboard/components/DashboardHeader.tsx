
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../../components/icons/Icons';

export const DashboardHeader: React.FC = () => {
    const navigate = useNavigate();
    
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 5) return "LATE NIGHT.";
        if (hour < 12) return "GOOD MORNING.";
        if (hour < 18) return "GOOD AFTERNOON.";
        return "GOOD EVENING.";
    }, []);

    return (
        <div className="flex justify-between items-end px-2">
             <div>
                 <h1 className="text-3xl font-bold tracking-tight text-neutral-800">{greeting}</h1>
                 <p className="text-xs font-medium uppercase tracking-wider text-primary">
                     {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                 </p>
             </div>
             <button 
                onClick={() => navigate('/settings')} 
                className="w-11 h-11 rounded-lg bg-surface flex items-center justify-center text-secondary hover:text-primary hover:bg-surface2 transition-all border border-border active:scale-95 shadow-sm"
                aria-label="Paramètres"
             >
                 <Icons.Settings size={22} />
             </button>
        </div>
    );
};
