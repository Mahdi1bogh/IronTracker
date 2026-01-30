
import React from 'react';
import { SectionCard } from '../../../components/ui/SectionCard';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { PALETTE } from '../../../styles/tokens';
import { formatDuration } from '../../../core/utils';
import { LibraryExercise } from '../../../core/types';
import { useStore } from '../../../store/useStore';

interface ExerciseDetailChartProps {
    data: any[];
    library: LibraryExercise[];
    selectedExo: number;
    setSelectedExo: (id: number) => void;
    metric: '1rm' | 'max' | 'volume' | 'tonnage';
    setMetric: (m: '1rm' | 'max' | 'volume' | 'tonnage') => void;
    isTimeBased: boolean;
    isCardio: boolean;
}

export const ExerciseDetailChart: React.FC<ExerciseDetailChartProps> = ({ 
    data, library, selectedExo, setSelectedExo, metric, setMetric, isTimeBased, isCardio 
}) => {
    const accentColor = useStore(s => s.accentColor);
    const primaryColor = PALETTE.accents[accentColor]?.primary || PALETTE.accents.blue.primary;

    const niceDomain = ([dataMin, dataMax]: [number, number]): [number, number] => {
        if (!dataMax || dataMax === 0 || !isFinite(dataMax)) return [0, 10];
        return [0, Math.ceil(dataMax * 1.1)];
    };

    return (
        <SectionCard className="p-5 h-80 relative flex flex-col">
            <div className="flex flex-col gap-3 mb-4 z-10 relative">
                <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full"></div>
                        <h3 className="text-xs font-black uppercase text-white">Détails Exercice</h3>
                    </div>
                    <select 
                        className="bg-surface2/50 text-[10px] text-white p-1 rounded font-bold outline-none max-w-[120px] border border-white/10"
                        value={metric}
                        onChange={(e) => setMetric(e.target.value as any)}
                    >
                        <option value="1rm">{isTimeBased ? "Lest Max" : isCardio ? "Vitesse/Lvl Max" : "1RM Est."}</option>
                        <option value="max">{isTimeBased ? "Temps Max" : isCardio ? "Dist. Max" : "Poids Max"}</option>
                        <option value="volume">Volume (Sets)</option>
                        <option value="tonnage">{isTimeBased ? "Temps s/Tension" : isCardio ? "Dist. Totale" : "Tonnage"}</option>
                    </select>
                </div>
                <select 
                    className="bg-surface2/50 text-[10px] text-white p-2 rounded-lg font-bold outline-none w-full border border-white/10"
                    value={selectedExo}
                    onChange={(e) => setSelectedExo(parseInt(e.target.value))}
                >
                    {library.filter(l => !l.isArchived).sort((a,b) => a.name.localeCompare(b.name)).map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                </select>
            </div>
            
            <div className="flex-1 w-full min-h-0 relative">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
                            <CartesianGrid stroke={PALETTE.border} strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: PALETTE.text.secondary, fontSize: 10, fontWeight: 600}} 
                                dy={10}
                                minTickGap={30}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: PALETTE.text.secondary, fontSize: 10, fontWeight: 600}} 
                                domain={niceDomain}
                                tickFormatter={(val) => (isTimeBased && metric !== '1rm' && metric !== 'volume') || (isCardio && metric === 'tonnage') ? formatDuration(val) : val}
                            />
                            <Tooltip 
                                contentStyle={{backgroundColor: PALETTE.surface, border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'}}
                                itemStyle={{color: '#fff', fontSize: '12px', fontWeight: 'bold'}}
                                formatter={(val: number) => (isTimeBased && metric !== '1rm' && metric !== 'volume') || (isCardio && metric === 'tonnage') ? formatDuration(val) : val}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="val" 
                                stroke={primaryColor} 
                                strokeWidth={3} 
                                dot={{fill: primaryColor, r: 4}}
                                activeDot={{r: 6, strokeWidth: 0}}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-secondary/40 text-xs italic">
                        Pas assez de données
                    </div>
                )}
            </div>
        </SectionCard>
    );
};
