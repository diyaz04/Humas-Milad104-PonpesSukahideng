import React, { useState } from 'react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { collection, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Koorwil, Sport, Registration, Match } from '../../types';
import { Plus, Trash2, Trophy, Users, Layout, ChevronRight, Save, AlertCircle, BarChart3, PieChart, Activity } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface PorsasPanelProps {
  koorwils: Koorwil[];
  sports: Sport[];
  registrations: Registration[];
  matches: Match[];
}

export default function PorsasPanel({ koorwils, sports, registrations, matches }: PorsasPanelProps) {
  const [activeTab, setActiveTab] = useState<'master' | 'registrasi' | 'bracket' | 'statistik'>('statistik');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: string, name: string, coll: string } | null>(null);
  
  // Master Data Inputs
  const [newKoorwil, setNewKoorwil] = useState('');
  const [newSport, setNewSport] = useState({
    name: '',
    category: 'olahraga' as 'olahraga' | 'seni',
    gender: 'umum' as 'putra' | 'putri' | 'umum',
    type: 'tim' as 'individu' | 'tim'
  });

  // Bracket Management
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  const addKoorwil = async () => {
    if (!newKoorwil) return;
    await addDoc(collection(db, 'koorwils'), { name: newKoorwil });
    setNewKoorwil('');
  };

  const addSport = async () => {
    if (!newSport.name) return;
    await addDoc(collection(db, 'sports'), { ...newSport });
    setNewSport({
      name: '',
      category: 'olahraga',
      gender: 'umum',
      type: 'tim'
    });
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await deleteDoc(doc(db, deleteConfirm.coll, deleteConfirm.id));
      setDeleteConfirm(null);
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

  const [regFilter, setRegFilter] = useState<'all' | 'koorwil' | 'individual'>('all');

  const filteredRegistrations = registrations.filter(r => {
    if (regFilter === 'all') return true;
    return r.type === regFilter;
  });

  const [exportFilter, setExportFilter] = useState<string>('all');

  const exportCategories = [
    { id: 'all', name: 'Semua Kategori' },
    // List individual sports and koorwil sports, excluding koorwil arts
    ...Array.from(new Set(
      registrations
        .filter(r => r.type === 'individual' || r.category === 'olahraga')
        .map(r => r.sportName)
    )).filter(Boolean).sort().map(name => ({ id: name, name })),
    // Add "Penampilan Seni" only for koorwil arts
    ...(registrations.some(r => r.category === 'seni' && r.type === 'koorwil') ? [{ id: 'seni-koorwil', name: 'Penampilan Seni (Koorwil)' }] : [])
  ];

  const handleExportExcel = () => {
    const dataToExport = registrations.filter(r => {
      const matchesMainType = regFilter === 'all' || r.type === regFilter;
      if (exportFilter === 'all') return matchesMainType;
      // Grouping Koorwil Arts
      if (exportFilter === 'seni-koorwil') return matchesMainType && r.category === 'seni' && r.type === 'koorwil';
      // Specific branch matching (Individual or Olahraga)
      return matchesMainType && r.sportName === exportFilter;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(r => ({
      'Peserta / Tim': r.name,
      'Koorwil': r.koorwil || '-',
      'Cabang / Penampilan': r.sportName,
      'Kategori': r.category === 'seni' && r.type === 'koorwil' ? 'Penampilan Seni' : r.sportName,
      'Gender': r.gender,
      'Kontak': r.contact,
      'Anggota / Detail': r.members
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrasi");
    const fileName = exportFilter === 'all' ? 'Semua_Pendaftar' : (exportFilter === 'seni-koorwil' ? 'Penampilan_Seni_Koorwil' : exportFilter.replace(/\s+/g, '_'));
    XLSX.writeFile(workbook, `PORSAS_Registrasi_${fileName}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const dataToExport = registrations.filter(r => {
      const matchesMainType = regFilter === 'all' || r.type === regFilter;
      if (exportFilter === 'all') return matchesMainType;
      if (exportFilter === 'seni-koorwil') return matchesMainType && r.category === 'seni' && r.type === 'koorwil';
      return matchesMainType && r.sportName === exportFilter;
    });
    
    // Header Styling
    const brandGold: [number, number, number] = [184, 134, 11]; // #B8860B
    const brandDark: [number, number, number] = [15, 23, 42];  // Slate 900
    
    // Decorative Header Bar
    doc.setFillColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setDrawColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.setLineWidth(1);
    doc.line(0, 40, 210, 40);
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.text('MILAD KE-104 & PORSAS', 105, 18, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(brandGold[0], brandGold[1], brandGold[2]);
    doc.text('PONPES SUKAHIDENG - TASIKMALAYA', 105, 26, { align: 'center' });
    
    // Subtitle / Category
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    const categoryTitle = exportFilter === 'all' ? 'SEMUA CABANG PERLOMBAAN' : (exportFilter === 'seni-koorwil' ? 'PENAMPILAN SENI (KOORWIL)' : exportFilter.toUpperCase());
    doc.text(`DATA PENDAFTARAN: ${categoryTitle}`, 105, 34, { align: 'center' });
    
    // Summary Info Box
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.roundedRect(15, 45, 180, 20, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMASI LAPORAN', 20, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Pendaftar: ${dataToExport.length} Peserta/Tim`, 20, 58);
    doc.text(`Dicetak Pada: ${new Date().toLocaleString('id-ID')}`, 130, 58);
    
    const tableData = dataToExport.map(r => [
      r.name,
      r.koorwil || '-',
      r.category === 'seni' && r.type === 'koorwil' ? `${r.sportName} (Seni)` : r.sportName,
      r.contact,
      r.members
    ]);

    autoTable(doc, {
      head: [['PESERTA / TIM', 'KOORWIL', 'CABANG / SENI', 'KONTAK', 'DETAIL ANGGOTA']],
      body: tableData,
      startY: 70,
      theme: 'striped',
      styles: { 
        fontSize: 8, 
        cellPadding: 4,
        font: 'helvetica',
      },
      headStyles: { 
        fillColor: brandGold,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        3: { fontStyle: 'italic', font: 'courier' },
        4: { cellWidth: 'auto' }
      },
      didDrawPage: (data) => {
        // Footer
        const str = `Halaman ${data.pageNumber}`;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(str, 195, 285, { align: 'right' });
        doc.text('© 2026 Milad Ponpes Sukahideng ke-104', 15, 285);
      }
    });

    const fileName = exportFilter === 'all' ? 'Semua_Pendaftar' : (exportFilter === 'seni-koorwil' ? 'Penampilan_Seni_Koorwil' : exportFilter.replace(/\s+/g, '_'));
    doc.save(`PORSAS_Registrasi_${fileName}.pdf`);
  };

  // Statistik Calculations
  const stats = {
    total: registrations.length,
    koorwilCount: registrations.filter(r => r.type === 'koorwil').length,
    indivCount: registrations.filter(r => r.type === 'individual').length,
    bySport: registrations.reduce((acc, reg) => {
      const sportName = reg.sportName || 'Tidak Diketahui';
      acc[sportName] = (acc[sportName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byGender: {
        putra: registrations.filter(r => r.gender === 'putra').length,
        putri: registrations.filter(r => r.gender === 'putri').length
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-4 border-b border-slate-200">
          {[
            { id: 'statistik', label: 'Statistik', icon: BarChart3 },
            { id: 'master', label: 'Data Master', icon: Layout },
            { id: 'registrasi', label: 'Registrasi', icon: Users },
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

        {activeTab === 'registrasi' && (
          <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setRegFilter('all')}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${regFilter === 'all' ? 'bg-white shadow-sm text-brand-dark' : 'text-slate-400'}`}
              >
                Semua
              </button>
              <button 
                onClick={() => setRegFilter('koorwil')}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${regFilter === 'koorwil' ? 'bg-white shadow-sm text-brand-dark' : 'text-slate-400'}`}
              >
                Koorwil
              </button>
              <button 
                onClick={() => setRegFilter('individual')}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${regFilter === 'individual' ? 'bg-white shadow-sm text-brand-dark' : 'text-slate-400'}`}
              >
                Individu
              </button>
          </div>
        )}
      </div>

      {activeTab === 'statistik' && (
        <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Total Pendaftar</p>
                            <h4 className="text-2xl font-bold text-brand-dark">{stats.total}</h4>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-400 rounded-xl">
                            <Layout size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Via Koorwil</p>
                            <h4 className="text-2xl font-bold text-brand-dark">{stats.koorwilCount}</h4>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-50 text-purple-400 rounded-xl">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Via Individu</p>
                            <h4 className="text-2xl font-bold text-brand-dark">{stats.indivCount}</h4>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-50 text-green-400 rounded-xl">
                            <PieChart size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Cabor/Kegiatan</p>
                            <h4 className="text-2xl font-bold text-brand-dark">{Object.keys(stats.bySport).length}</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Stats by Sport */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="font-serif font-bold text-xl mb-6">Pendaftar Per Cabang</h3>
                    <div className="space-y-4">
                        {Object.entries(stats.bySport)
                            .sort((a, b) => b[1] - a[1])
                            .map(([name, count]) => {
                                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                return (
                                    <div key={name} className="space-y-2">
                                        <div className="flex justify-between items-center text-sm font-bold uppercase tracking-wider">
                                            <span className="text-brand-dark">{name}</span>
                                            <span className="text-brand-gold">{count} Orang</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                className="bg-brand-gold h-full rounded-full"
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Stats by Gender */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-serif font-bold text-xl mb-6">Peserta Berdasarkan Gender</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-1">Putra</p>
                                <h4 className="text-2xl font-bold text-blue-600">{stats.byGender.putra}</h4>
                                <div className="mt-4 text-[10px] text-blue-400 font-bold uppercase">
                                    {stats.total > 0 ? Math.round((stats.byGender.putra / (stats.byGender.putra + stats.byGender.putri || 1)) * 100) : 0}% Distribusi
                                </div>
                            </div>
                            <div className="p-6 bg-pink-50/50 rounded-2xl border border-pink-100">
                                <p className="text-[10px] uppercase tracking-widest text-pink-400 font-bold mb-1">Putri</p>
                                <h4 className="text-2xl font-bold text-pink-600">{stats.byGender.putri}</h4>
                                <div className="mt-4 text-[10px] text-pink-400 font-bold uppercase">
                                    {stats.total > 0 ? Math.round((stats.byGender.putri / (stats.byGender.putra + stats.byGender.putri || 1)) * 100) : 0}% Distribusi
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Insights */}
                    <div className="bg-brand-dark p-8 rounded-3xl shadow-xl shadow-brand-dark/20 text-brand-cream border border-white/5">
                        <h3 className="font-serif font-bold text-xl mb-4 text-brand-gold leading-tight">Insight PORSAS</h3>
                        <p className="text-sm opacity-60 leading-relaxed italic">
                            "Menampilkan ringkasan data partisipasi alumni dalam rangkaian Pekan Olahraga & Seni Alumni Sukahideng."
                        </p>
                        <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-3">
                           <div className="w-10 h-10 bg-brand-gold rounded-full flex items-center justify-center text-brand-dark">
                               <Trophy size={20} />
                           </div>
                           <div>
                               <p className="text-[10px] uppercase tracking-widest font-bold">Cabang Terpopuler</p>
                               <p className="text-sm font-bold text-brand-gold">
                                   {Object.entries(stats.bySport).sort((a,b) => b[1]-a[1])[0]?.[0] || 'Belum ada data'}
                               </p>
                           </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

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
                  <button 
                    onClick={() => setDeleteConfirm({ id: k.id, coll: 'koorwils', name: k.name, type: 'Koorwil' })} 
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                    title="Hapus Koorwil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-serif font-bold text-xl mb-6">Cabang Olahraga & Seni</h3>
            <div className="space-y-4 mb-8">
              <input 
                type="text" 
                placeholder="Nama Cabang (contoh: Futsal, Kaligrafi)..."
                value={newSport.name}
                onChange={e => setNewSport({ ...newSport, name: e.target.value })}
                className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1 block">Kategori</label>
                  <select 
                    value={newSport.category}
                    onChange={e => setNewSport({ ...newSport, category: e.target.value as any })}
                    className="w-full border-2 border-slate-100 rounded-xl p-2 text-sm"
                  >
                    <option value="olahraga">Olahraga</option>
                    <option value="seni">Seni</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1 block">Gender</label>
                  <select 
                    value={newSport.gender}
                    onChange={e => setNewSport({ ...newSport, gender: e.target.value as any })}
                    className="w-full border-2 border-slate-100 rounded-xl p-2 text-sm"
                  >
                    <option value="putra">Putra</option>
                    <option value="putri">Putri</option>
                    <option value="umum">Umum (Putra/i)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1 block">Tipe Peserta</label>
                  <select 
                    value={newSport.type}
                    onChange={e => setNewSport({ ...newSport, type: e.target.value as any })}
                    className="w-full border-2 border-slate-100 rounded-xl p-2 text-sm"
                  >
                    <option value="tim">Tim</option>
                    <option value="individu">Individu</option>
                  </select>
                </div>
                <button 
                  onClick={addSport} 
                  className="mt-auto bg-brand-dark text-brand-gold p-3 rounded-xl flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest"
                >
                  <Plus size={16} /> Tambah Cabang
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {sports.map(s => (
                <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-700">{s.name}</span>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[8px] uppercase tracking-tighter bg-brand-gold/10 text-brand-gold px-1 rounded">{s.category}</span>
                      <span className="text-[8px] uppercase tracking-tighter bg-blue-50 text-blue-400 px-1 rounded">{s.gender}</span>
                      <span className="text-[8px] uppercase tracking-tighter bg-purple-50 text-purple-400 px-1 rounded">{s.type}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setDeleteConfirm({ id: s.id, coll: 'sports', name: s.name, type: 'Cabang' })} 
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                    title="Hapus Cabang"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'registrasi' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col gap-1 w-full md:w-auto">
              <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold ml-1">Eksport Berdasarkan Cabang</label>
              <select 
                value={exportFilter}
                onChange={e => setExportFilter(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-brand-dark outline-none focus:border-brand-gold w-full md:w-64"
              >
                {exportCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
              <button 
                onClick={handleExportExcel}
                className="flex-grow md:flex-grow-0 flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-green-600 transition-all shadow-lg shadow-green-200"
              >
                <Save size={14} /> Excel
              </button>
              <button 
                onClick={handleExportPDF}
                className="flex-grow md:flex-grow-0 flex items-center justify-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all shadow-lg shadow-red-200"
              >
                <Activity size={14} /> PDF
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                <tr>
                  <th className="px-8 py-4">Peserta / Tim</th>
                  <th className="px-8 py-4">Koorwil</th>
                  <th className="px-8 py-4">Cabang / Penampilan</th>
                  <th className="px-8 py-4">PIC / Kontak</th>
                  <th className="px-8 py-4">Anggota / Detail</th>
                  <th className="px-8 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredRegistrations.map(reg => (
                  <tr key={reg.id} className="hover:bg-slate-50/50 group">
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-brand-dark uppercase tracking-wide">{reg.name}</span>
                            <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest ${reg.type === 'koorwil' ? 'bg-brand-gold text-brand-dark' : 'bg-slate-200 text-slate-500'}`}>
                                {reg.type === 'koorwil' ? 'WIL' : 'IND'}
                            </span>
                        </div>
                        <span className={`text-[8px] uppercase tracking-widest font-bold ${reg.gender === 'putra' ? 'text-blue-400' : 'text-pink-400'}`}>{reg.gender}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-slate-500 font-medium">{reg.koorwil || '-'}</td>
                    <td className="px-8 py-4">
                        <div className="flex flex-col gap-1">
                          {reg.category === 'seni' ? (
                            <>
                              <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded text-[10px] font-bold uppercase w-fit border border-purple-200">
                                {reg.sportName}
                              </span>
                              <span className="text-[8px] uppercase text-purple-400 font-bold ml-1">Penampilan Seni</span>
                            </>
                          ) : (
                            <>
                              <span className="bg-brand-gold/10 text-brand-gold px-2 py-1 rounded text-[10px] font-bold uppercase w-fit border border-brand-gold/20">
                                {reg.sportName}
                              </span>
                              <span className="text-[8px] uppercase text-slate-400 font-bold ml-1">{reg.category}</span>
                            </>
                          )}
                        </div>
                    </td>
                    <td className="px-8 py-4 text-slate-500 font-mono">{reg.contact}</td>
                    <td className="px-8 py-4 truncate max-w-[200px] text-slate-400 italic font-light">{reg.members}</td>
                    <td className="px-8 py-4 text-center">
                        <button 
                          onClick={() => setDeleteConfirm({ id: reg.id, coll: 'registrations', name: reg.name, type: 'Registrasi' })}
                          className="text-red-300 hover:text-red-600 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                  {registrations.filter(r => r.type === 'koorwil' && (!selectedSport || r.sportId === selectedSport)).map(reg => (
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
                      <span className="text-sm font-medium text-slate-600">{reg.name} ({reg.koorwil || 'Individu'})</span>
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
                                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Pihak A</p>
                                  <p className="font-bold text-brand-dark truncate">{registrations.find(r => r.id === match.teamAId)?.name || "TBD"}</p>
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
                                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Pihak B</p>
                                  <p className="font-bold text-brand-dark truncate">{registrations.find(r => r.id === match.teamBId)?.name || "TBD"}</p>
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
                                onClick={() => setDeleteConfirm({ id: match.id, coll: 'matches', name: 'Pertandingan', type: 'Match' })}
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

      <ConfirmModal 
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title={`Hapus ${deleteConfirm?.type}?`}
        message={`Apakah Anda yakin ingin menghapus "${deleteConfirm?.name}"? Data yang sudah dihapus tidak dapat dikembalikan dan mungkin berdampak pada data terkait lainnya.`}
      />
    </div>
  );
}
