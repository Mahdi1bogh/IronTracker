
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../../components/icons/Icons';

interface InsightBannerProps {
    insight: { title: string | null; text: string | null; } | null;
}

export const InsightBanner: React.FC<InsightBannerProps> = ({ insight }) => {
    const navigate = useNavigate();

    return (
        <div 
            onClick={() => navigate('/analytics')} 
            className="bg-surface2/30 border border-white/5 rounded-2xl p-3 flex items-center justify-between mx-1 backdrop-blur-md cursor-pointer active:scale-98 transition-transform group animate-zoom-in delay-75"
        >
             <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                     <Icons.TrendUp size={16} />
                 </div>
                 <div className="flex-1 min-w-0 pr-2">
                     <div className="text-[10px] font-bold uppercase text-secondary tracking-wider">
                         {insight?.title || "Analyse"}
                     </div>
                     <div className="text-xs font-bold text-white truncate">
                         {insight?.text || "Données insuffisantes"}
                     </div>
                 </div>
             </div>
             <Icons.ChevronRight size={16} className="text-secondary/30 group-hover:text-white transition-colors" />
        </div>
    );
};
