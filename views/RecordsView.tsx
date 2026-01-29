
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { SectionCard } from '../components/ui/SectionCard';
import { getExerciseStats, formatDuration } from '../utils';
import { Icons } from '../components/Icons';

export const RecordsView: React.FC = () => {
    const navigate = useNavigate();
    const library = useStore(s => s.library);
    const history = useStore(s => s.history);
    const [showAllRecords, setShowAllRecords] = useState(true);

    const recordsList = library
        .filter(l => !l.isArchived && (showAllRecords || l.isFavorite))
        .sort((a,b) => (a.isFavorite === b.isFavorite) ? a.name.localeCompare(b.name) : (a.isFavorite ? -1 : 1))
        .map(l => {
            const stats = getExerciseStats(l.id, history, l.type);
            // Ignore if no data
            if (stats.lastDetailed === "-") return null;
            return { l, stats };
        })
        .filter(Boolean);

    return (
      <div className="space-y-6 animate-fade-in pb-24">
          <div className="flex items-center justify-between px-1">
             <div className="flex items-center gap-4">
                 <button onClick={() => navigate('/')} className="p-2 bg-surface2 rounded-full text-secondary hover:text-white transition-colors">
                     <Icons.ChevronLeft />
                 </button>
                 <h2 className="text-2xl font-black italic uppercase">Records</h2>
             </div>
             <button onClick={() => setShowAllRecords(!showAllRecords)} className="text-[10px] font-bold uppercase bg-surface2 px-3 py-1 rounded-full text-secondary">{showAllRecords ? "Tous" : "Favoris"}</button>
          </div>
          
          {recordsList.length > 0 ? (
              <div className="space-y-4">
                  {recordsList.map(item => {
                      const { l, stats } = item!;
                      const isCardio = l.type === 'Cardio';
                      const isStatic = l.type === 'Statique' || l.type === 'Étirement';
                      const isStandard = !isCardio && !isStatic;

                      return (
                          <SectionCard key={l.id} className="p-4 flex flex-col gap-2">
                              <div className="flex justify-between items-start">
                                  <div className="font-bold text-sm flex items-center gap-2">
                                      {l.isFavorite && <span className="text-gold text-xs"><Icons.Star /></span>}
                                      {l.name}
                                  </div>
                                  <div className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-surface2 text-secondary">{l.muscle}</div>
                              </div>
                              
                              <div className={`grid ${isCardio ? 'grid-cols-3' : 'grid-cols-2'} gap-4 mt-2`}>
                                  {isStandard && (
                                      <>
                                          <div className="bg-surface2/30 p-2 rounded-xl text-center">
                                              <div className="text-[9px] text-secondary uppercase">Meilleur 1RM</div>
                                              <div className="font-black text-lg text-primary">{stats.pr} <span className="text-xs text-secondary font-normal">kg</span></div>
                                          </div>
                                          <div className="bg-surface2/30 p-2 rounded-xl text-center">
                                              <div className="text-[9px] text-secondary uppercase">Poids Max</div>
                                              <div className="font-black text-lg text-white">{stats.prMax} <span className="text-xs text-secondary font-normal">kg</span></div>
                                          </div>
                                      </>
                                  )}

                                  {isStatic && (
                                      <div className="bg-surface2/30 p-2 rounded-xl text-center col-span-2">
                                          <div className="text-[9px] text-secondary uppercase">Temps Max</div>
                                          <div className="font-black text-lg text-primary">{formatDuration(stats.maxDuration)}</div>
                                      </div>
                                  )}

                                  {isCardio && (
                                      <>
                                          <div className="bg-surface2/30 p-2 rounded-xl text-center">
                                              <div className="text-[9px] text-secondary uppercase">Max Dist</div>
                                              <div className="font-black text-sm text-white">{stats.maxDistance} <span className="text-[9px]">m</span></div>
                                          </div>
                                           <div className="bg-surface2/30 p-2 rounded-xl text-center">
                                              <div className="text-[9px] text-secondary uppercase">Max Durée</div>
                                              <div className="font-black text-sm text-white">{formatDuration(stats.maxDuration)}</div>
                                          </div>
                                          <div className="bg-surface2/30 p-2 rounded-xl text-center">
                                              <div className="text-[9px] text-secondary uppercase">Max Lvl</div>
                                              <div className="font-black text-sm text-primary">{stats.prMax}</div>
                                          </div>
                                      </>
                                  )}
                              </div>
                              
                              <div className="mt-2 pt-2 border-t border-border/30 flex justify-between items-center text-xs">
                                  <span className="text-secondary">Dernière perf:</span>
                                  <span className="font-mono font-bold text-[10px]">{stats.lastDetailed}</span>
                              </div>
                          </SectionCard>
                      );
                  })}
              </div>
          ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
                  <Icons.Records size={48} className="text-secondary" />
                  <p className="text-sm text-secondary font-medium px-8">
                      Aucun record enregistré. Terminez des séances pour voir vos statistiques apparaître ici.
                  </p>
              </div>
          )}
      </div>
    );
};
