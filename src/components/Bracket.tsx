import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Info, RefreshCw, Radio } from 'lucide-react';
import { Sport, Match, Registration } from '../types';

interface BracketProps {
  sports: Sport[];
  matches: Match[];
  registrations: Registration[];
}

export default function Bracket({ sports, matches, registrations }: BracketProps) {
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  React.useEffect(() => {
    if (sports.length > 0 && !selectedSport) {
      setSelectedSport(sports[0].id);
    }
  }, [sports, selectedSport]);

  const ongoingMatches = useMemo(() => {
    return matches.filter(m => m.status === 'ongoing');
  }, [matches]);

  const currentSportMatches = useMemo(() => {
    return matches.filter(m => m.sportId === selectedSport);
  }, [matches, selectedSport]);

  const rounds = useMemo(() => {
    const r: Record<number, Match[]> = {};
    currentSportMatches.forEach(m => {
      if (!r[m.round]) r[m.round] = [];
      r[m.round].push(m);
    });
    // Sort matches in each round by matchIndex
    Object.keys(r).forEach(key => {
      r[Number(key)].sort((a, b) => a.matchIndex - b.matchIndex);
    });
    return Object.entries(r).sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [currentSportMatches]);

  const getTeamName = (id: string | null) => {
    if (!id) return "TBD";
    const reg = registrations.find(r => r.id === id);
    return reg ? reg.name : id;
  };

  const getSportName = (id: string) => {
    const s = sports.find(sp => sp.id === id);
    return s ? s.name : 'Olahraga';
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Auto-refresh Indicator */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-forest/20 rounded-full border border-brand-gold/10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw size={12} className="text-brand-gold" />
          </motion.div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-brand-gold/60">Data diperbarui otomatis</span>
        </div>
      </div>

      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-cream mb-4">Bagan Pertandingan</h2>
        <p className="text-brand-gold/60 uppercase tracking-widest text-sm">Hasil Real-time PORSAS 104 Sukahideng</p>
      </div>

      {/* Live Match Ticker */}
      <AnimatePresence>
        {ongoingMatches.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-12 overflow-hidden bg-brand-dark/40 border-y border-brand-gold/10 py-3 relative"
          >
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-brand-dark to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-brand-dark to-transparent z-10" />
            
            <div className="animate-marquee whitespace-nowrap inline-flex gap-12">
              {[...ongoingMatches, ...ongoingMatches].map((match, i) => (
                <div key={`${match.id}-${i}`} className="flex items-center gap-4 px-6 py-1 border-x border-brand-gold/5">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    LIVE
                  </span>
                  <span className="text-xs font-bold text-brand-gold">{getSportName(match.sportId)}</span>
                  <div className="flex items-center gap-3 text-sm font-bold text-brand-cream">
                    <span>{getTeamName(match.teamAId)}</span>
                    <span className="bg-brand-gold text-brand-dark px-2 py-0.5 rounded text-xs tabular-nums">
                      {match.scoreA} - {match.scoreB}
                    </span>
                    <span>{getTeamName(match.teamBId)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sport Selector */}
      <div className="flex flex-wrap justify-center gap-3 mb-16">
        {sports.map(sport => (
          <button
            key={sport.id}
            onClick={() => setSelectedSport(sport.id)}
            className={`px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${selectedSport === sport.id ? 'bg-brand-gold text-brand-dark shadow-lg shadow-brand-gold/20' : 'bg-brand-forest/50 text-brand-gold/50 hover:text-brand-gold border border-brand-gold/10'}`}
          >
            {sport.name}
          </button>
        ))}
      </div>

      {/* Bracket View */}
      <div className="relative overflow-x-auto pb-12 scrollbar-thin scrollbar-thumb-brand-gold/20 scrollbar-track-transparent">
        <div className="inline-flex gap-12 min-w-max px-6">
          {rounds.map(([round, roundMatches]) => (
            <div key={round} className="flex flex-col gap-12 justify-around min-w-[300px]">
              <div className="text-center">
                <span className="text-[10px] uppercase tracking-[0.4em] text-brand-gold/40 font-bold block mb-1">PORSAS 104</span>
                <span className="bg-brand-gold/10 text-brand-gold border border-brand-gold/20 px-6 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                  {Number(round) === rounds.length ? 'Final Utama' : `Babak ${round}`}
                </span>
              </div>
              
              {roundMatches.map((match) => {
                const isOngoing = match.status === 'ongoing';
                const isCompleted = match.status === 'completed';
                const isScheduled = match.status === 'scheduled';
                
                return (
                  <div key={match.id} className="relative">
                    <motion.div 
                      layout
                      className={`p-6 rounded-2xl border ${isOngoing ? 'bg-brand-gold/10 border-brand-gold ring-1 ring-brand-gold/20' : 'bg-brand-dark/40 border-brand-gold/10'} backdrop-blur-md transition-all hover:border-brand-gold/30 relative overflow-hidden group shadow-xl`}
                    >
                      {/* Status Badge */}
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                          {isOngoing && (
                            <div className="flex items-center gap-2 bg-rose-500/20 text-rose-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-rose-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              LIVE
                            </div>
                          )}
                          {isCompleted && (
                            <div className="bg-green-500/20 text-green-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-green-500/20">
                              Selesai
                            </div>
                          )}
                          {isScheduled && (
                            <div className="bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-slate-500/20">
                              Segera
                            </div>
                          )}
                        </div>
                        {match.startTime && (
                          <span className="text-[10px] text-brand-gold/40 font-mono">{match.startTime}</span>
                        )}
                      </div>

                      {/* Team A */}
                      <div className={`flex justify-between items-center gap-4 mb-4 transition-all ${match.winnerId === match.teamAId ? 'text-brand-gold scale-105' : 'text-brand-cream/60'}`}>
                        <div className="flex items-center gap-3">
                          {match.winnerId === match.teamAId && <Trophy size={14} className="text-brand-gold animate-bounce" />}
                          <span className={`text-sm font-bold uppercase tracking-wide truncate max-w-[150px] ${match.winnerId === match.teamAId ? 'text-brand-gold underline decoration-brand-gold/30 underline-offset-4' : ''}`}>
                            {getTeamName(match.teamAId)}
                          </span>
                        </div>
                        <AnimatePresence mode="popLayout">
                          <motion.span 
                            key={match.scoreA}
                            initial={{ scale: 1.2, color: '#D4AF37' }}
                            animate={{ scale: 1, color: match.scoreA > match.scoreB ? '#D4AF37' : '#F5F5F5' }}
                            className={`text-xl font-black tabular-nums w-10 text-center ${match.scoreA > match.scoreB ? 'text-brand-gold' : 'text-brand-cream/80'}`}
                          >
                            {match.scoreA}
                          </motion.span>
                        </AnimatePresence>
                      </div>

                      <div className="flex items-center gap-4 my-2">
                        <div className="h-px flex-1 bg-brand-gold/10" />
                        <span className="text-[8px] font-black text-brand-gold/20 uppercase tracking-tighter">VERSUS</span>
                        <div className="h-px flex-1 bg-brand-gold/10" />
                      </div>

                      {/* Team B */}
                      <div className={`flex justify-between items-center gap-4 transition-all ${match.winnerId === match.teamBId ? 'text-brand-gold scale-105' : 'text-brand-cream/60'}`}>
                        <div className="flex items-center gap-3">
                          {match.winnerId === match.teamBId && <Trophy size={14} className="text-brand-gold animate-bounce" />}
                          <span className={`text-sm font-bold uppercase tracking-wide truncate max-w-[150px] ${match.winnerId === match.teamBId ? 'text-brand-gold underline decoration-brand-gold/30 underline-offset-4' : ''}`}>
                            {getTeamName(match.teamBId)}
                          </span>
                        </div>
                        <AnimatePresence mode="popLayout">
                          <motion.span 
                            key={match.scoreB}
                            initial={{ scale: 1.2, color: '#D4AF37' }}
                            animate={{ scale: 1, color: match.scoreB > match.scoreA ? '#D4AF37' : '#F5F5F5' }}
                            className={`text-xl font-black tabular-nums w-10 text-center ${match.scoreB > match.scoreA ? 'text-brand-gold' : 'text-brand-cream/80'}`}
                          >
                            {match.scoreB}
                          </motion.span>
                        </AnimatePresence>
                      </div>

                      {/* Decoration for Live */}
                      {isOngoing && (
                        <div className="absolute bottom-0 right-0 p-1">
                           <Radio size={48} className="text-rose-500/5 rotate-12" />
                        </div>
                      )}
                    </motion.div>
                    
                    {/* Connectors */}
                    {Number(round) < rounds.length && (
                      <div className="absolute left-full top-1/2 w-12 h-px bg-brand-gold/10 -translate-y-1/2" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          
          {rounds.length === 0 && (
            <div className="w-full flex flex-col items-center justify-center text-brand-gold/30 min-h-[400px]">
              <Info size={48} className="mb-4 opacity-20" />
              <p className="font-serif italic text-xl">Bagan belum digenerate oleh panitia.</p>
              <p className="text-[10px] uppercase tracking-widest mt-2">{selectedSport ? 'Cek kategori lain' : 'Pilih cabang olahraga'}</p>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />
    </div>
  );
}
