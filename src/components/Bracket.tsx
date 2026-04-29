import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Info } from 'lucide-react';
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
    return reg ? reg.teamName : id; // Fallback to ID if not found (maybe manual input)
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-cream mb-4">Bagan Pertandingan</h2>
        <p className="text-brand-gold/60 uppercase tracking-widest text-sm">Update otomatis sesuai hasil pertandingan</p>
      </div>

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
      <div className="relative overflow-x-auto pb-12">
        <div className="inline-flex gap-16 min-w-max px-6">
          {rounds.map(([round, roundMatches]) => (
            <div key={round} className="flex flex-col gap-8 justify-around min-w-[280px]">
              <div className="text-center mb-4">
                <span className="text-[10px] uppercase tracking-[0.3em] text-brand-gold/40 font-bold block mb-1">Babak</span>
                <span className="bg-brand-gold/10 text-brand-gold px-4 py-1 rounded-full text-xs font-bold uppercase">
                  {Number(round) === rounds.length ? 'Final' : `Putaran ${round}`}
                </span>
              </div>
              
              {roundMatches.map((match, idx) => (
                <div key={match.id} className="relative">
                  <div className={`p-5 rounded-3xl border ${match.status === 'ongoing' ? 'bg-brand-gold/10 border-brand-gold' : 'bg-brand-forest/30 border-brand-gold/10'} backdrop-blur-sm transition-all hover:scale-105 group`}>
                    {/* Team A */}
                    <div className={`flex justify-between items-center gap-4 mb-3 ${match.winnerId === match.teamAId && match.teamAId ? 'text-brand-gold' : 'text-brand-cream/70'}`}>
                      <span className={`text-sm font-bold uppercase tracking-wider truncate ${match.winnerId === match.teamAId ? 'font-black' : ''}`}>
                        {getTeamName(match.teamAId)}
                      </span>
                      <span className="w-8 h-8 rounded-lg bg-brand-dark/50 flex items-center justify-center font-bold text-brand-gold border border-brand-gold/20">
                        {match.scoreA}
                      </span>
                    </div>
                    {/* Divider */}
                    <div className="h-px bg-brand-gold/10 mb-3" />
                    {/* Team B */}
                    <div className={`flex justify-between items-center gap-4 ${match.winnerId === match.teamBId && match.teamBId ? 'text-brand-gold' : 'text-brand-cream/70'}`}>
                      <span className={`text-sm font-bold uppercase tracking-wider truncate ${match.winnerId === match.teamBId ? 'font-black' : ''}`}>
                        {getTeamName(match.teamBId)}
                      </span>
                      <span className="w-8 h-8 rounded-lg bg-brand-dark/50 flex items-center justify-center font-bold text-brand-gold border border-brand-gold/20">
                        {match.scoreB}
                      </span>
                    </div>

                    {match.status === 'ongoing' && (
                      <div className="absolute -top-3 -right-3">
                        <span className="flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-gold"></span>
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Connectors (CSS logic) */}
                  {Number(round) < rounds.length && (
                    <div className={`absolute left-full top-1/2 w-8 h-px bg-brand-gold/20 -translate-y-1/2 hidden md:block`} />
                  )}
                </div>
              ))}
            </div>
          ))}
          
          {rounds.length === 0 && (
            <div className="w-full flex flex-col items-center justify-center text-brand-gold/30 min-h-[400px]">
              <Info size={48} className="mb-4 opacity-20" />
              <p className="font-serif italic text-xl">Bagan belum digenerate oleh admin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
