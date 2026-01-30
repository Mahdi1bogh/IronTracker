
import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { SectionCard } from '../../components/ui/SectionCard';
import { getExerciseStats, formatDuration } from '../../core/utils';
import { Icons } from '../../components/icons/Icons';
import { VirtualList } from '../../components/ui/VirtualList';
import { EmptyState } from '../../components/ui/EmptyState';

export const RecordsView: React.FC = () => {
    const library = useStore(s => s.library);
    const history = useStore(s => s.history);
    const [showAllRecords, setShowAllRecords] = useState(true);

    // Pré-calcul de la liste complète
    const recordsList = useMemo(() => {
        return library
            .filter(l => !l.isArchived && (showAllRecords || l.isFavorite))
            .sort((a,b) => (a.isFavorite === b.isFavorite) ? a.name.localeCompare(b.name) : (a.isFavorite ? -1 : 1))
            .map(l => {
                const stats = getExerciseStats(l.id, history, l.type);
                // Ignore if no data
                if (stats.lastDetailed === "-") return null;
                return { l, stats };
            })
            .filter(Boolean) as { l: typeof library[0], stats: ReturnType<typeof getExerciseStats> }[];
    }, [library, history, showAllRecords]);

    return (
      <div className="space-y-4 animate-fade-in h-full flex flex-col pb-24">
          <div className="flex items-center justify-end px-1 flex-shrink-0">
             <button onClick={() => setShowAllRecords(!showAllRecords)} className="text-[10px] font-bold uppercase bg-surface2 px-3 py-1 rounded-full text-secondary transition-colors hover:text-white border border-transparent hover:border-white/10">
                 {showAllRecords ? "Tous" : "Favoris"}
             </button>
          </div>
          
          <div className="flex-1 min-h-0 border-t border-transparent">
              <VirtualList
                  items={recordsList}
                  itemHeight={150}
                  gap={12}
                  emptyMessage={
                      <EmptyState 
                          icon={<Icons.Records />} 
                          title="Aucun Record" 
                          subtitle="Terminez des séances pour voir vos statistiques apparaître ici." 
                      />
                  }
                  renderItem={({ l, stats }) => {
                      const isCardio = l.type === 'Cardio';
                      const isStatic = l.type === 'Statique' || l.type === 'Étirement';
                      const isStandard = !isCardio && !isStatic;

                      return (
                          <SectionCard className="p-4 flex flex-col gap-2 h-full justify-between">
                              <div className="flex justify-between items-start">
                                  <div className="font-bold text-sm flex items-center gap-2 truncate pr-2">
                                      {l.isFavorite && <span className="text-gold text-xs flex-shrink-0"><Icons.Star size={12} fill="currentColor" /></span>}
                                      <span className="truncate">{l.name}</span>
                                  </div>
                                  <div className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-surface2 text-secondary flex-shrink-0">{l.muscle}</div>
                              </div>
                              
                              <div className={`grid ${isCardio ? 'grid-cols-3' : 'grid-cols-2'} gap-3 mt-1`}>
                                  {isStandard && (
                                      <>
                                          <div className="bg-surface2/30 p-2 rounded-xl text-center border border-white/5">
                                              <div className="text-[8px] text-secondary uppercase font-bold tracking-wider">Meilleur 1RM</div>
                                              <div className="font-black text-lg text-primary">{stats.pr} <span className="text-[10px] text-secondary font-normal">kg</span></div>
                                          </div>
                                          <div className="bg-surface2/30 p-2 rounded-xl text-center border border-white/5">
                                              <div className="text-[8px] text-secondary uppercase font-bold tracking-wider">Poids Max</div>
                                              <div className="font-black text-lg text-white">{stats.prMax} <span className="text-[10px] text-secondary font-normal">kg</span></div>
                                          </div>
                                      </>
                                  )}

                                  {isStatic && (
                                      <div className="bg-surface2/30 p-2 rounded-xl text-center col-span-2 border border-white/5">
                                          <div className="text-[8px] text-secondary uppercase font-bold tracking-wider">Temps Max</div>
                                          <div className="font-black text-lg text-primary">{formatDuration(stats.maxDuration)}</div>
                                      </div>
                                  )}

                                  {isCardio && (
                                      <>
                                          <div className="bg-surface2/30 p-1.5 rounded-xl text-center border border-white/5">
                                              <div className="text-[8px] text-secondary uppercase">Max Dist</div>
                                              <div className="font-black text-xs text-white">{stats.maxDistance} <span className="text-[8px]">m</span></div>
                                          </div>
                                           <div className="bg-surface2/30 p-1.5 rounded-xl text-center border border-white/5">
                                              <div className="text-[8px] text-secondary uppercase">Max Tps</div>
                                              <div className="font-black text-xs text-white">{formatDuration(stats.maxDuration)}</div>
                                          </div>
                                          <div className="bg-surface2/30 p-1.5 rounded-xl text-center border border-white/5">
                                              <div className="text-[8px] text-secondary uppercase">Max Lvl</div>
                                              <div className="font-black text-xs text-primary">{stats.prMax}</div>
                                          </div>
                                      </>
                                  )}
                              </div>
                              
                              <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs">
                                  <span className="text-secondary/70 text-[10px]">Dernière perf:</span>
                                  <span className="font-mono font-bold text-[10px] text-white/90 bg-surface2/50 px-2 py-0.5 rounded">{stats.lastDetailed}</span>
                              </div>
                          </SectionCard>
                      );
                  }}
              />
          </div>
      </div>
    );
};
