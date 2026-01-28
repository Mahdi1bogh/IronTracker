
import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Icons } from '../Icons';
import { triggerHaptic, calculate1RM } from '../../utils';
import { PALETTE } from '../../styles/tokens';

interface WorkoutToolsModalProps {
    onClose: () => void;
}

const PLATES_AVAILABLE = [20, 10, 5, 2.5, 1.25];

// Map plates to PALETTE colors
const PLATE_COLORS: Record<number, string> = {
    20: PALETTE.accents.blue.primary,
    10: PALETTE.accents.emerald.primary,
    5: PALETTE.accents.red.primary,
    2.5: PALETTE.accents.purple.primary,
    1.25: PALETTE.accents.gray.primary
};

export const WorkoutToolsModal: React.FC<WorkoutToolsModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'1rm' | 'conv' | 'plate'>('1rm');

    // 1RM State
    const [rmWeight, setRmWeight] = useState("100");
    const [rmReps, setRmReps] = useState("5");
    const est1RM = useMemo(() => calculate1RM(rmWeight, rmReps), [rmWeight, rmReps]);

    // Converter State
    const [convBB, setConvBB] = useState("");
    const [convDB, setConvDB] = useState("");

    // Plate Calc State
    const [targetWeight, setTargetWeight] = useState("");
    const [barWeight, setBarWeight] = useState("20");
    
    const plateResult = useMemo(() => {
        const target = parseFloat(targetWeight);
        const bar = parseFloat(barWeight);
        if (isNaN(target) || isNaN(bar) || target < bar) return null;

        let remainder = (target - bar) / 2;
        const result: number[] = [];
        
        PLATES_AVAILABLE.forEach(p => {
            while (remainder >= p) {
                result.push(p);
                remainder -= p;
            }
        });
        
        return result;
    }, [targetWeight, barWeight]);


    return (
        <Modal title="Boîte à Outils" onClose={onClose}>
            <div className="space-y-4">
                {/* TABS */}
                <div className="flex bg-surface2 rounded-xl p-1 gap-1">
                    <button onClick={() => setActiveTab('1rm')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 ${activeTab === '1rm' ? 'bg-primary text-background shadow-lg' : 'text-secondary hover:text-white'}`}>
                        <span className="text-lg">1RM</span>
                    </button>
                    <button onClick={() => setActiveTab('conv')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 ${activeTab === 'conv' ? 'bg-primary text-background shadow-lg' : 'text-secondary hover:text-white'}`}>
                        <Icons.Exchange size={16} />
                    </button>
                    <button onClick={() => setActiveTab('plate')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 ${activeTab === 'plate' ? 'bg-primary text-background shadow-lg' : 'text-secondary hover:text-white'}`}>
                        <Icons.Disc size={16} />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="min-h-[200px]">
                    {activeTab === '1rm' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="text-center bg-surface2/30 p-4 rounded-2xl relative">
                                <div className="text-4xl font-black text-primary mb-1">{est1RM} <span className="text-lg text-secondary">kg</span></div>
                                <div className="text-[10px] uppercase text-secondary">Max Estimé</div>
                                <div className="absolute top-2 right-2 text-[8px] text-secondary/50 font-mono">Formule: Wathen</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase text-secondary">Charge</label>
                                    <input type="number" value={rmWeight} onChange={e => setRmWeight(e.target.value)} className="w-full bg-surface2 p-3 rounded-xl text-center font-bold outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase text-secondary">Reps</label>
                                    <input type="number" value={rmReps} onChange={e => setRmReps(e.target.value)} className="w-full bg-surface2 p-3 rounded-xl text-center font-bold outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center pt-2">
                                {[90, 80, 70, 60].map(pct => (
                                    <div key={pct} className="bg-surface2/50 p-1.5 rounded-lg">
                                        <div className="text-[9px] text-secondary">{pct}%</div>
                                        <div className="font-mono font-bold text-xs">{Math.round(est1RM * (pct/100))}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'conv' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase text-secondary">Barre (2 mains)</label>
                                <input 
                                type="number" 
                                value={convBB} 
                                onChange={e => {
                                    const v = e.target.value;
                                    setConvBB(v);
                                    if (v) setConvDB(Math.round((parseFloat(v) * 0.80) / 2).toString());
                                    else setConvDB("");
                                }}
                                placeholder="0"
                                className="w-full bg-surface2 p-3 rounded-xl text-center text-xl font-black outline-none"
                                />
                            </div>
                            <div className="flex justify-center text-secondary/30"><Icons.Exchange size={24} className="rotate-90" /></div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase text-secondary">Haltère (Par main)</label>
                                <input 
                                type="number" 
                                value={convDB} 
                                onChange={e => {
                                    const v = e.target.value;
                                    setConvDB(v);
                                    if (v) setConvBB(Math.round((parseFloat(v) * 2) / 0.80).toString());
                                    else setConvBB("");
                                }}
                                placeholder="0"
                                className="w-full bg-surface2 p-3 rounded-xl text-center text-xl font-black outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'plate' && (
                        <div className="space-y-4 animate-fade-in">
                             <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase text-secondary">Objectif</label>
                                    <input type="number" value={targetWeight} onChange={e => setTargetWeight(e.target.value)} className="w-full bg-surface2 p-3 rounded-xl text-center font-bold outline-none" placeholder="Ex: 100" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase text-secondary">Barre</label>
                                    <input type="number" value={barWeight} onChange={e => setBarWeight(e.target.value)} className="w-full bg-surface2 p-3 rounded-xl text-center font-bold outline-none" placeholder="Ex: 20" />
                                </div>
                            </div>
                            
                            <div className="bg-surface2/30 p-4 rounded-2xl min-h-[100px] flex flex-col items-center justify-center">
                                {plateResult ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="text-[10px] uppercase text-secondary">Par Côté</div>
                                        <div className="flex flex-wrap justify-center gap-1">
                                            {plateResult.length > 0 ? plateResult.map((p, i) => (
                                                <div 
                                                    key={i} 
                                                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white/10"
                                                    style={{ backgroundColor: PLATE_COLORS[p] || PALETTE.surface2, color: p === 1.25 ? PALETTE.text.primary : '#fff' }}
                                                >
                                                    {p}
                                                </div>
                                            )) : <span className="text-secondary italic text-xs">Barre vide</span>}
                                        </div>
                                        {plateResult.length > 0 && <div className="text-[9px] text-secondary mt-2">Total chargé: {targetWeight} kg</div>}
                                    </div>
                                ) : (
                                    <div className="text-secondary text-xs italic">Entrez un poids cible valide.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
