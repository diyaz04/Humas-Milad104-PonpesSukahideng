import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Medal, Filter, ChevronDown, ChevronUp, Info, Users } from 'lucide-react';
import { Match, Registration, Sport, Koorwil } from '../types';

interface MedalLeaderboardProps {
  matches: Match[];
  registrations: Registration[];
  sports: Sport[];
  koorwils: Koorwil[];
}

interface MedalCount {
  gold: number;
  silver: number;
  bronze: number;
  total: number;
  details: {
    goldSports: string[];
    silverSports: string[];
    bronzeSports: string[];
  };
}

const MedalLeaderboard: React.FC<MedalLeaderboardProps> = ({ matches, registrations, sports, koorwils }) => {
  const [activeCategory, setActiveCategory] = useState<'semua' | 'olahraga' | 'seni'>('semua');
  const [activeGender, setActiveGender] = useState<'semua' | 'putra' | 'putri'>('semua');
  const [expandedKoorwil, setExpandedKoorwil] = useState<string | null>(null);

  const leaderboardData = useMemo(() => {
    const leaderboard: Record<string, MedalCount> = {};

    // Initialize leaderboard with all koorwils
    koorwils.forEach(k => {
      leaderboard[k.name] = {
        gold: 0, silver: 0, bronze: 0, total: 0,
        details: { goldSports: [], silverSports: [], bronzeSports: [] }
      };
    });
    
    // Add "Perorangan" category just in case
    leaderboard['Perorangan'] = {
      gold: 0, silver: 0, bronze: 0, total: 0,
      details: { goldSports: [], silverSports: [], bronzeSports: [] }
    };

    // Group completed matches by sport
    const completedMatches = matches.filter(m => m.status === 'completed');
    const sportsWithMatches = Array.from(new Set(completedMatches.map(m => m.sportId)));

    sportsWithMatches.forEach(sportId => {
      const sport = sports.find(s => s.id === sportId);
      if (!sport) return;

      // Filter by category and gender
      if (activeCategory !== 'semua' && sport.category !== activeCategory) return;
      if (activeGender !== 'semua' && sport.gender !== activeGender) return;

      const sportMatches = completedMatches.filter(m => m.sportId === sportId);
      if (sportMatches.length === 0) return;

      const maxRound = Math.max(...sportMatches.map(m => m.round));

      // Final Match (Gold & Silver)
      const finalMatch = sportMatches.find(m => m.round === maxRound);
      if (finalMatch && finalMatch.winnerId) {
        const winner = registrations.find(r => r.id === finalMatch.winnerId);
        const winnerKoorwil = winner?.koorwil || 'Perorangan';
        
        const loserId = finalMatch.winnerId === finalMatch.teamAId ? finalMatch.teamBId : finalMatch.teamAId;
        const loser = registrations.find(r => r.id === loserId);
        const loserKoorwil = loser?.koorwil || 'Perorangan';

        // Add Gold
        if (leaderboard[winnerKoorwil]) {
          leaderboard[winnerKoorwil].gold++;
          leaderboard[winnerKoorwil].total++;
          leaderboard[winnerKoorwil].details.goldSports.push(sport.name);
        }

        // Add Silver
        if (loserKoorwil && leaderboard[loserKoorwil]) {
          leaderboard[loserKoorwil].silver++;
          leaderboard[loserKoorwil].total++;
          leaderboard[loserKoorwil].details.silverSports.push(sport.name);
        }
      }

      // Semifinal Matches (Bronze)
      const semifinalMatches = sportMatches.filter(m => m.round === maxRound - 1 && maxRound > 1);
      semifinalMatches.forEach(m => {
        const loserId = m.winnerId === m.teamAId ? m.teamBId : m.teamAId;
        if (loserId) {
          const loser = registrations.find(r => r.id === loserId);
          const loserKoorwil = loser?.koorwil || 'Perorangan';
          if (leaderboard[loserKoorwil]) {
            leaderboard[loserKoorwil].bronze++;
            leaderboard[loserKoorwil].total++;
            leaderboard[loserKoorwil].details.bronzeSports.push(sport.name);
          }
        }
      });
    });

    // Convert to array and sort
    return Object.entries(leaderboard)
      .map(([name, counts]) => ({ name, ...counts }))
      .filter(item => item.total > 0 || koorwils.some(k => k.name === item.name)) // Keep koorwils even with 0 if needed, but filter out empty Perorangan
      .sort((a, b) => {
        if (b.gold !== a.gold) return b.gold - a.gold;
        if (b.silver !== a.silver) return b.silver - a.silver;
        if (b.bronze !== a.bronze) return b.bronze - a.bronze;
        return a.name.localeCompare(b.name);
      });
  }, [matches, registrations, sports, koorwils, activeCategory, activeGender]);

  const hasData = leaderboardData.some(d => d.total > 0);

  if (!hasData && matches.filter(m => m.status === 'completed').length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-24 h-24 bg-brand-gold/10 rounded-full flex items-center justify-center mb-6 border border-brand-gold/20">
          <Trophy size={40} className="text-brand-gold/40" />
        </div>
        <h3 className="text-2xl font-serif font-bold text-brand-cream mb-2">Klasemen Belum Tersedia</h3>
        <p className="text-brand-gold/60 max-w-md mx-auto">Pertandingan PORSAS belum dimulai atau belum ada hasil yang dikonfirmasi oleh panitia.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
        <div className="text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-cream mb-2">Papan Klasemen</h2>
          <p className="text-brand-gold/60 uppercase tracking-widest text-xs font-bold">Perolehan Medali Koorwil PORSAS 104</p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex bg-brand-dark/40 p-1 rounded-xl border border-brand-gold/10">
            {(['semua', 'olahraga', 'seni'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-brand-gold text-brand-dark shadow-lg' : 'text-brand-gold/40 hover:text-brand-gold'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex bg-brand-dark/40 p-1 rounded-xl border border-brand-gold/10">
            {(['semua', 'putra', 'putri'] as const).map(g => (
              <button
                key={g}
                onClick={() => setActiveGender(g)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeGender === g ? 'bg-brand-gold text-brand-dark shadow-lg' : 'text-brand-gold/40 hover:text-brand-gold'}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-brand-dark/40 rounded-3xl border border-brand-gold/10 overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-gold/10 bg-brand-gold/5">
                <th className="px-6 py-5 text-[10px] uppercase font-black tracking-[0.2em] text-brand-gold/40">Pos</th>
                <th className="px-6 py-5 text-[10px] uppercase font-black tracking-[0.2em] text-brand-gold/40">Koorwil</th>
                <th className="px-6 py-5 text-[10px] uppercase font-black tracking-[0.2em] text-brand-gold/40 text-center">🥇</th>
                <th className="px-6 py-5 text-[10px] uppercase font-black tracking-[0.2em] text-brand-gold/40 text-center">🥈</th>
                <th className="px-6 py-5 text-[10px] uppercase font-black tracking-[0.2em] text-brand-gold/40 text-center">🥉</th>
                <th className="px-6 py-5 text-[10px] uppercase font-black tracking-[0.2em] text-brand-gold/40 text-center">Total</th>
                <th className="px-6 py-5 text-[10px] uppercase font-black tracking-[0.2em] text-brand-gold/40"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-gold/5">
              <AnimatePresence mode="popLayout">
                {leaderboardData.map((item, index) => {
                  const isTop3 = index < 3;
                  const isExpanded = expandedKoorwil === item.name;

                  return (
                    <React.Fragment key={item.name}>
                      <motion.tr
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`group cursor-pointer transition-colors ${isExpanded ? 'bg-brand-gold/10' : 'hover:bg-brand-gold/5'} ${index === 0 ? 'bg-brand-gold/5' : ''}`}
                        onClick={() => setExpandedKoorwil(isExpanded ? null : item.name)}
                      >
                        <td className="px-6 py-6">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                            index === 0 ? 'bg-brand-gold text-brand-dark' : 
                            index === 1 ? 'bg-slate-300 text-slate-700' :
                            index === 2 ? 'bg-amber-600 text-white' :
                            'text-brand-gold/40'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-3">
                            {index === 0 && <Trophy size={16} className="text-brand-gold animate-bounce" />}
                            <span className={`font-bold tracking-wide ${isTop3 ? 'text-brand-cream' : 'text-brand-cream/70'}`}>
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <span className={`text-lg font-black tabular-nums ${item.gold > 0 ? 'text-brand-gold' : 'text-white/10'}`}>
                            {item.gold}
                          </span>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <span className={`text-lg font-black tabular-nums ${item.silver > 0 ? 'text-slate-300' : 'text-white/10'}`}>
                            {item.silver}
                          </span>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <span className={`text-lg font-black tabular-nums ${item.bronze > 0 ? 'text-amber-600' : 'text-white/10'}`}>
                            {item.bronze}
                          </span>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-xl font-black tabular-nums text-brand-cream">
                              {item.total}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-right">
                          <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-brand-gold' : 'text-brand-gold/20'}`}>
                            <ChevronDown size={20} />
                          </div>
                        </td>
                      </motion.tr>

                      {/* Expanded View */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <td colSpan={7} className="px-8 py-8 bg-brand-dark/60 border-t border-brand-gold/5">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Gold Details */}
                                <div>
                                  <div className="flex items-center gap-2 mb-4 text-brand-gold">
                                    <Medal size={16} />
                                    <span className="text-[10px] uppercase font-black tracking-widest">Cabang Emas</span>
                                  </div>
                                  {item.details.goldSports.length > 0 ? (
                                    <div className="space-y-2">
                                      {Array.from(new Set(item.details.goldSports)).map((sport, i) => (
                                        <div key={i} className="flex justify-between items-center bg-brand-gold/5 px-3 py-2 rounded-lg border border-brand-gold/10">
                                          <span className="text-xs text-brand-cream font-bold">{sport}</span>
                                          <span className="text-[10px] text-brand-gold font-mono">
                                            x{item.details.goldSports.filter(s => s === sport).length}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-white/20 italic">Belum ada medali</p>
                                  )}
                                </div>

                                {/* Silver Details */}
                                <div>
                                  <div className="flex items-center gap-2 mb-4 text-slate-300">
                                    <Medal size={16} />
                                    <span className="text-[10px] uppercase font-black tracking-widest">Cabang Perak</span>
                                  </div>
                                  {item.details.silverSports.length > 0 ? (
                                    <div className="space-y-2">
                                      {Array.from(new Set(item.details.silverSports)).map((sport, i) => (
                                        <div key={i} className="flex justify-between items-center bg-slate-400/5 px-3 py-2 rounded-lg border border-slate-400/10">
                                          <span className="text-xs text-brand-cream font-bold">{sport}</span>
                                          <span className="text-[10px] text-slate-400 font-mono">
                                            x{item.details.silverSports.filter(s => s === sport).length}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-white/20 italic">Belum ada medali</p>
                                  )}
                                </div>

                                {/* Bronze Details */}
                                <div>
                                  <div className="flex items-center gap-2 mb-4 text-amber-600">
                                    <Medal size={16} />
                                    <span className="text-[10px] uppercase font-black tracking-widest">Cabang Perunggu</span>
                                  </div>
                                  {item.details.bronzeSports.length > 0 ? (
                                    <div className="space-y-2">
                                      {Array.from(new Set(item.details.bronzeSports)).map((sport, i) => (
                                        <div key={i} className="flex justify-between items-center bg-amber-600/5 px-3 py-2 rounded-lg border border-amber-600/10">
                                          <span className="text-xs text-brand-cream font-bold">{sport}</span>
                                          <span className="text-[10px] text-amber-600 font-mono">
                                            x{item.details.bronzeSports.filter(s => s === sport).length}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-white/20 italic">Belum ada medali</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-6 text-brand-gold/30">
        <div className="flex items-center gap-2">
          <Info size={14} />
          <span className="text-[8px] uppercase font-bold tracking-widest">Data diupdate real-time oleh panitia</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} />
          <span className="text-[8px] uppercase font-bold tracking-widest">Total medali dihitung per cabang</span>
        </div>
      </div>
    </div>
  );
};

export default MedalLeaderboard;
