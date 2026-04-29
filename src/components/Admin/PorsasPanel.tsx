import React, { useState } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Koorwil, Sport, Registration, Match } from '../../types';
import { Plus, Trash2, Trophy, Users, Layout, ChevronRight, Save } from 'lucide-react';

interface PorsasPanelProps {
  koorwils: Koorwil[];
  sports: Sport[];
  registrations: Registration[];
  matches: Match[];
}

export default function PorsasPanel({ koorwils, sports, registrations, matches }: PorsasPanelProps) {
  const [activeTab, setActiveTab] = useState<'master' | 'registrasi' | 'bracket'>('master');
  
  // Master Data Inputs
  const [newKoorwil, setNewKoorwil] = useState('');
  const [newSport, setNewSport] = useState('');

  // Bracket Management
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  const addKoorwil = async () => {
    if (!newKoorwil) return;
    await addDoc(collection(db, 'koorwils'), { name: newKoorwil });
    setNewKoorwil('');
  };

  const addSport = async () => {
    if (!newSport) return;
    await addDoc(collection(db, 'sports'), { name: newSport });
    setNewSport('');
  };

  const deleteMaster = async (collectionName: string, id: string) => {
    if (confirm(`Hapus item ini dari ${collectionName}?`)) {
      await deleteDoc(doc(db, collectionName, id));
    }
  };

  const generateBracket = async () => {
    if (!selectedSport || selectedTeams.length < 2) return;
    
    const batch = writeBatch(db);
    // Simplified: Only Round 1 for now
    const numMatches = Math.floor(selectedTeams.length / 2);
    
    for (let i = 0; i < numMatches; i++) {
        const matchRef = doc(collection(db, 'matches'));
        batch.set(matchRef, {
            sportId: selectedSport,
            round: 1,
            matchIndex: i,
            teamAId: selectedTeams[i * 2],
            teamBId: selectedTeams[i * 2 + 1],
            scoreA: 0,
            scoreB: 0,
            winnerId: null,
            status: 'scheduled'
        });
    }
    
    await batch.commit();
    alert(`Berhasil generate ${numMatches} pertandingan untuk Putaran 1!`);
    setSelectedTeams([]);
  };

  const updateMatchScore = async (matchId: string, scoreA: number, scoreB: number, status: string) => {
    const winnerId = status === 'completed' 
        ? (scoreA > scoreB ? matches.find(m => m.id === matchId)?.teamAId : matches.find(m => m.id === matchId)?.teamBId)
        : null;
        
    await updateDoc(doc(db, 'matches', matchId), {
        scoreA,
        scoreB,
        status,
        winnerId: winnerId || null
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex gap-4 border-b border-slate-200">
        {[
          { id: 'master', label: 'Data Master', icon: Layout },
          { id: 'registrasi', label: 'Registrasi Tim', icon: Users },
          { id: 'bracket', label: 'Bagan & Skor', icon: Trophy }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-8 py-4 flex items-center gap-3 font-bold uppercase tracking-widest text-xs transition-all ${activeTab === tab.id ? 'border-b-4 border-brand-gold text-brand-dark bg-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'master' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-serif font-bold text-xl mb-6">Daftar Koorwil</h3>
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="Tambah Koorwil..."
                value={newKoorwil}
                onChange={e => setNewKoorwil(e.target.value)}
                className="flex-grow border-2 border-slate-100 rounded-xl p-3 outline-none"
              />
              <button onClick={addKoorwil} className="bg-brand-dark text-brand-gold p-3 rounded-xl"><Plus /></button>
            </div>
            <div className="space-y-2">
              {koorwils.map(k => (
                <div key={k.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="font-medium text-slate-700">{k.name}</span>
                  <button onClick={() => deleteMaster('koorwils', k.id)} className="text-red-400 p-1"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-serif font-bold text-xl mb-6">Cabang Olahraga</h3>
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="Tambah Cabor..."
                value={newSport}
                onChange={e => setNewSport(e.target.value)}
                className="flex-grow border-2 border-slate-100 rounded-xl p-3 outline-none"
              />
              <button onClick={addSport} className="bg-brand-dark text-brand-gold p-3 rounded-xl"><Plus /></button>
            </div>
            <div className="space-y-2">
              {sports.map(s => (
                <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="font-medium text-slate-700">{s.name}</span>
                  <button onClick={() => deleteMaster('sports', s.id)} className="text-red-400 p-1"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'registrasi' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                <tr>
                  <th className="px-8 py-4">Tim</th>
                  <th className="px-8 py-4">Koorwil</th>
                  <th className="px-8 py-4">Cabor</th>
                  <th className="px-8 py-4">PIC / Kontak</th>
                  <th className="px-8 py-4">Anggota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {registrations.map(reg => (
                  <tr key={reg.id} className="hover:bg-slate-50/50">
                    <td className="px-8 py-4 font-bold text-brand-dark uppercase tracking-wide">{reg.teamName}</td>
                    <td className="px-8 py-4 text-slate-500">{reg.koorwil}</td>
                    <td className="px-8 py-4">
                        <span className="bg-brand-gold/10 text-brand-gold px-2 py-1 rounded text-[10px] font-bold uppercase">{reg.sport}</span>
                    </td>
                    <td className="px-8 py-4 text-slate-500 font-mono">{reg.contact}</td>
                    <td className="px-8 py-4 truncate max-w-[200px] text-slate-400 italic">{reg.members}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'bracket' && (
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-serif font-bold text-xl mb-6">Generate Bagan Baru (Putaran 1)</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Pilih Cabang Olahraga</label>
                <select 
                  value={selectedSport}
                  onChange={e => setSelectedSport(e.target.value)}
                  className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none mb-6"
                >
                  <option value="">Pilih Cabor</option>
                  {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button 
                  onClick={generateBracket}
                  disabled={!selectedSport || selectedTeams.length < 2}
                  className="w-full bg-brand-dark text-brand-gold py-4 rounded-xl font-bold uppercase tracking-widest disabled:opacity-30"
                >
                  Generate Putaran 1
                </button>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Pilih Peserta ({selectedTeams.length})</label>
                <div className="max-h-48 overflow-y-auto border-2 border-slate-100 rounded-xl p-4 space-y-2">
                  {registrations.filter(r => !selectedSport || r.sport === sports.find(s => s.id === selectedSport)?.name).map(reg => (
                    <label key={reg.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-all">
                      <input 
                        type="checkbox" 
                        checked={selectedTeams.includes(reg.id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedTeams([...selectedTeams, reg.id]);
                          else setSelectedTeams(selectedTeams.filter(id => id !== reg.id));
                        }}
                        className="w-4 h-4 rounded text-brand-gold accent-brand-gold"
                      />
                      <span className="text-sm font-medium text-slate-600">{reg.teamName} ({reg.koorwil})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-serif font-bold text-xl mb-6">Atur Skor & Hasil Pertandingan</h3>
              <div className="space-y-4">
                  {matches.map(match => (
                      <div key={match.id} className="flex flex-col md:flex-row items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex-grow grid grid-cols-3 items-center text-center gap-4">
                              <div className="text-right">
                                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Tim A</p>
                                  <p className="font-bold text-brand-dark truncate">{registrations.find(r => r.id === match.teamAId)?.teamName || "TBD"}</p>
                              </div>
                              <div className="flex items-center justify-center gap-2">
                                  <input 
                                    type="number" 
                                    defaultValue={match.scoreA}
                                    onBlur={(e) => updateMatchScore(match.id, parseInt(e.target.value), match.scoreB, match.status)}
                                    className="w-12 h-12 bg-white border border-slate-200 rounded-lg text-center font-bold text-brand-dark outline-none focus:border-brand-gold"
                                  />
                                  <span className="text-slate-300 font-bold">-</span>
                                  <input 
                                    type="number" 
                                    defaultValue={match.scoreB}
                                    onBlur={(e) => updateMatchScore(match.id, match.scoreA, parseInt(e.target.value), match.status)}
                                    className="w-12 h-12 bg-white border border-slate-200 rounded-lg text-center font-bold text-brand-dark outline-none focus:border-brand-gold"
                                  />
                              </div>
                              <div className="text-left">
                                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Tim B</p>
                                  <p className="font-bold text-brand-dark truncate">{registrations.find(r => r.id === match.teamBId)?.teamName || "TBD"}</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                              <select 
                                value={match.status}
                                onChange={(e) => updateMatchScore(match.id, match.scoreA, match.scoreB, e.target.value)}
                                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 outline-none focus:border-brand-gold"
                              >
                                  <option value="scheduled">Terjadwal</option>
                                  <option value="ongoing">Berlangsung</option>
                                  <option value="completed">Selesai</option>
                              </select>
                              <button 
                                onClick={async () => {
                                    if(confirm("Hapus pertandingan ini?")) await deleteDoc(doc(db, 'matches', match.id));
                                }}
                                className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                              >
                                  <Trash2 size={18} />
                              </button>
                          </div>
                      </div>
                  ))}
                  {matches.length === 0 && <p className="text-center text-slate-400 italic py-10">Belum ada pertandingan.</p>}
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
