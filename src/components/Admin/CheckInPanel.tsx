import React, { useState, useEffect, useRef } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, orderBy, addDoc } from 'firebase/firestore';
import { Alumnus } from '../../types';
import { 
  Search, ScanLine, Check, X, Loader2, ArrowRight, 
  Users, UserCheck, Clock, UserPlus, ShieldCheck,
  User, MapPin, Calendar, Smartphone, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CheckInPanel() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Alumnus[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
  const [checkedInAlumni, setCheckedInAlumni] = useState<Alumnus[]>([]);
  const [lastCheckIn, setLastCheckIn] = useState<Alumnus | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  
  // Manual Form State
  const [manualForm, setManualForm] = useState({
    name: '',
    yearIn: new Date().getFullYear(),
    city: '',
    phone: ''
  });

  useEffect(() => {
    // Listen for stats and recent check-ins
    const q = query(collection(db, 'alumni'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Alumnus));
      const checkedIn = data.filter(a => a.status === 'checked-in');
      const confirmed = data.filter(a => a.status === 'confirmed' || a.status === 'checked-in');
      setStats({
        total: confirmed.length,
        checkedIn: checkedIn.length
      });
      // Sort by check-in time and take top 5
      const recent = [...checkedIn]
        .filter(a => a.checkedInAt)
        .sort((a, b) => new Date(b.checkedInAt!).getTime() - new Date(a.checkedInAt!).getTime())
        .slice(0, 5);
      setCheckedInAlumni(recent);
    });
    return unsubscribe;
  }, []);

  const handleSearch = async (val: string) => {
    setSearch(val);
    if (val.length >= 2) {
      setLoading(true);
      const valLower = val.toLowerCase();
      try {
        const q = query(
          collection(db, 'alumni'),
          where('nameLowercase', '>=', valLower),
          where('nameLowercase', '<=', valLower + '\uf8ff')
        );
        const snap = await getDocs(q);
        setResults(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alumnus)));
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setResults([]);
    }
  };

  const performCheckIn = async (alumni: Alumnus) => {
    if (alumni.status === 'checked-in') {
      alert(`${alumni.name} sudah melakukan check-in.`);
      return;
    }

    setLoading(true);
    try {
      const code = alumni.registrationCode || `MILAD104-${Math.floor(1000 + Math.random() * 9000)}`;
      const updateData = {
        status: 'checked-in' as const,
        registrationCode: code,
        checkedInAt: new Date().toISOString()
      };
      await updateDoc(doc(db, 'alumni', alumni.id), updateData);
      
      const updatedAlumni = { ...alumni, ...updateData };
      setLastCheckIn(updatedAlumni);
      setSearch('');
      setResults([]);
      setQrInput('');
      
      // Auto close welcome message after 10s
      setTimeout(() => setLastCheckIn(null), 10000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'alumni');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.name || !manualForm.yearIn) return;

    setLoading(true);
    try {
      const code = `MILAD104-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date().toISOString();
      
      const newAlumnusData = {
        name: manualForm.name,
        nameLowercase: manualForm.name.toLowerCase(),
        yearIn: String(manualForm.yearIn),
        city: manualForm.city,
        phone: manualForm.phone,
        address: '',
        village: '',
        district: '',
        province: '',
        profession: '',
        status: 'checked-in' as const,
        registrationCode: code,
        checkedInAt: now,
        confirmedAt: now
      };

      const docRef = await addDoc(collection(db, 'alumni'), newAlumnusData);
      
      const createdAlumnus: Alumnus = { 
        id: docRef.id, 
        ...newAlumnusData 
      };

      setLastCheckIn(createdAlumnus);
      setShowManualModal(false);
      setManualForm({
        name: '',
        yearIn: new Date().getFullYear(),
        city: '',
        phone: ''
      });
      setSearch('');
      setResults([]);
      
      setTimeout(() => setLastCheckIn(null), 10000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'alumni');
    } finally {
      setLoading(false);
    }
  };

  const handleQrInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput) return;
    
    setLoading(true);
    try {
      const q = query(collection(db, 'alumni'), where('registrationCode', '==', qrInput));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        performCheckIn({ id: docSnap.id, ...docSnap.data() } as Alumnus);
      } else {
        alert("Kode registrasi tidak ditemukan.");
      }
    } catch (error) {
       console.error("QR Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Manual Registration Modal */}
      <AnimatePresence>
        {showManualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowManualModal(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="bg-brand-dark p-8 md:p-10 text-center relative overflow-hidden">
                <div className="absolute inset-0 islamic-pattern opacity-10" />
                <button 
                  onClick={() => setShowManualModal(false)}
                  className="absolute top-6 right-6 text-white/50 hover:text-brand-gold transition-colors"
                >
                  <X size={24} />
                </button>
                <div className="relative z-10 space-y-2">
                  <div className="w-16 h-16 bg-brand-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-gold/30">
                    <UserPlus className="text-brand-gold" size={32} />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-brand-gold">Tambah Manual</h3>
                  <p className="text-brand-cream/60 text-[10px] uppercase font-bold tracking-widest">Registrasi & Check-In Langsung</p>
                </div>
              </div>

              <form onSubmit={handleManualRegister} className="p-8 md:p-10 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        required
                        type="text"
                        placeholder="Contoh: Ahmad Sulaiman"
                        value={manualForm.name}
                        onChange={e => setManualForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 font-medium focus:border-brand-gold outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Angkatan (Tahun Masuk)</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                          required
                          type="number"
                          placeholder="2010"
                          value={manualForm.yearIn}
                          onChange={e => setManualForm(prev => ({ ...prev, yearIn: Number(e.target.value) }))}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 font-medium focus:border-brand-gold outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">HP / WhatsApp</label>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                          type="tel"
                          placeholder="0812XXX"
                          value={manualForm.phone}
                          onChange={e => setManualForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 font-medium focus:border-brand-gold outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kota / Wilayah</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text"
                        placeholder="Contoh: Jakarta Selatan"
                        value={manualForm.city}
                        onChange={e => setManualForm(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 font-medium focus:border-brand-gold outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="flex-1 px-8 py-4 rounded-2xl bg-slate-100 text-slate-500 font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-[2] bg-brand-dark text-brand-gold px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-gold hover:text-brand-dark transition-all disabled:opacity-50 shadow-lg shadow-brand-dark/10 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Simpan & Check-In</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-brand-dark p-2 rounded-2xl shadow-lg border border-brand-gold/20">
            <div className="relative bg-white/10 backdrop-blur-sm p-1.5 border border-brand-gold/30 rounded-xl shadow-2xl">
              <img 
                src="https://lh3.googleusercontent.com/d/10ePHDITHyany16gFdE6axqBjSwr2UROr" 
                alt="Sukahideng Logo" 
                className="h-14 w-auto object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div className="h-10 w-px bg-slate-200 mx-2 hidden md:block" />
          <div>
            <h2 className="text-2xl font-serif font-bold text-brand-dark">Sistem Heregistrasi</h2>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Check-in Kehadiran Milad ke-104</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-white px-6 py-4 rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-3 flex-1 md:flex-none">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-brand-dark leading-none">{stats.checkedIn}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Peserta Hadir</p>
            </div>
          </div>
          
          <div className="bg-white px-6 py-4 rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-3 flex-1 md:flex-none">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-brand-dark leading-none">{stats.total}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Konfirmasi Alumni</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Controls */}
          <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-2xl shadow-slate-200/50 border border-slate-50 border-t-4 border-t-brand-gold">
            <div className="space-y-10">
              {/* QR Gate */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-gold/10 text-brand-gold rounded-lg flex items-center justify-center">
                    <ScanLine size={18} />
                  </div>
                  <h3 className="font-bold text-brand-dark uppercase tracking-widest text-xs">Scan Kode Registrasi</h3>
                </div>
                <form onSubmit={handleQrInput} className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Masukkan Kode Registrasi (Contoh: MILAD104-1234)"
                    value={qrInput}
                    onChange={e => setQrInput(e.target.value.toUpperCase())}
                    className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 font-mono font-bold text-lg focus:border-brand-gold outline-none transition-all placeholder:text-slate-300"
                  />
                  <button 
                    type="submit"
                    disabled={loading || !qrInput}
                    className="bg-brand-dark text-brand-gold px-8 rounded-2xl hover:bg-brand-gold hover:text-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-brand-dark/10"
                  >
                    {loading ? <Loader2 size={24} className="animate-spin" /> : <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />}
                  </button>
                </form>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <span className="relative bg-white px-6 text-[10px] uppercase tracking-widest text-slate-300 font-bold mx-auto flex w-fit">ATAU CARI MANUAL</span>
              </div>

              {/* Manual Search Gate */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <Search size={18} />
                  </div>
                  <h3 className="font-bold text-brand-dark uppercase tracking-widest text-xs">Cari Berdasarkan Nama / Wilayah</h3>
                </div>
                <div className="relative flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                    <input 
                      type="text" 
                      placeholder="Ketik Minimal 2 Huruf..."
                      value={search}
                      onChange={e => handleSearch(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-16 pr-8 py-5 text-lg font-medium focus:border-brand-gold outline-none transition-all"
                    />
                    {loading && search.length >= 2 && (
                      <div className="absolute right-6 top-1/2 -translate-y-1/2">
                        <Loader2 size={24} className="animate-spin text-brand-gold" />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setShowManualModal(true)}
                    className="bg-brand-dark text-brand-gold px-8 rounded-2xl hover:bg-brand-gold hover:text-brand-dark transition-all flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] shadow-lg"
                  >
                    <Plus size={20} /> Tambah Baru
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search Results */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between px-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ditemukan {results.length} Peserta</h3>
                  <button onClick={() => setResults([])} className="text-[10px] font-bold text-red-500 uppercase">Tutup Hasil</button>
                </div>
                
                <div className="grid gap-4">
                  {results.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:border-brand-gold/20 transition-all group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold font-serif transition-colors ${item.status === 'checked-in' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-brand-gold group-hover:bg-brand-gold group-hover:text-white'}`}>
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-brand-dark leading-tight">{item.name}</h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Calendar size={12} /> Angkatan {item.yearIn}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <MapPin size={12} /> {item.city || 'Wilayah -'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {item.status === 'checked-in' ? (
                          <div className="flex flex-col items-end">
                            <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                              <Check size={14} /> Sudah Hadir
                            </span>
                            {item.checkedInAt && (
                              <span className="text-[9px] text-slate-300 font-bold mt-1 uppercase">Pukul {new Date(item.checkedInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                            )}
                          </div>
                        ) : (
                          <button 
                            onClick={() => performCheckIn(item)}
                            className="bg-brand-dark text-white hover:bg-brand-gold hover:text-brand-dark px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-brand-dark/10"
                          >
                            Check-In
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
            
            {search.length >= 2 && results.length === 0 && !loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 rounded-[32px] p-12 text-center border-2 border-dashed border-slate-200"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <UserPlus size={32} />
                </div>
                <h3 className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Nama tidak ditemukan</h3>
                <p className="text-slate-400 text-xs mb-8">Alumni belum terdata di sistem, silakan tambah manual.</p>
                <button 
                  onClick={() => {
                    setManualForm(prev => ({ ...prev, name: search }));
                    setShowManualModal(true);
                  }}
                  className="bg-brand-dark text-brand-gold px-12 py-4 rounded-2xl hover:bg-brand-gold hover:text-brand-dark transition-all font-bold uppercase tracking-widest text-xs shadow-xl shadow-brand-dark/10 flex items-center gap-3 mx-auto"
                >
                  <Plus size={20} /> Tambah Manual
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Status */}
        <div className="space-y-8">
          {/* Welcome Screen / Success Alert */}
          <AnimatePresence mode="wait">
            {lastCheckIn ? (
              <motion.div 
                key="welcome"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-brand-dark rounded-[40px] p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute inset-0 islamic-pattern opacity-10" />
                <button 
                  onClick={() => setLastCheckIn(null)}
                  className="absolute top-4 right-4 text-white/30 hover:text-brand-gold"
                >
                  <X size={20} />
                </button>
                
                <div className="relative z-10 space-y-6">
                  <div className="w-20 h-20 bg-brand-gold rounded-full flex items-center justify-center mx-auto shadow-xl shadow-brand-gold/20">
                    <Check className="text-brand-dark" size={40} />
                  </div>
                  
                  <div>
                    <h3 className="text-brand-gold font-serif text-2xl font-bold">Selamat Datang!</h3>
                    <p className="text-brand-cream/60 text-xs font-bold uppercase tracking-widest mt-1">Heregistrasi Berhasil</p>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10 text-brand-cream">
                    <p className="text-2xl font-serif font-bold mb-1">{lastCheckIn.name}</p>
                    <p className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.2em]">{lastCheckIn.registrationCode}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-[9px] uppercase font-bold text-brand-cream/40 mb-1">Angkatan</p>
                      <p className="text-brand-cream font-bold">{lastCheckIn.yearIn}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] uppercase font-bold text-brand-cream/40 mb-1">Status</p>
                      <p className="text-brand-gold font-bold uppercase text-xs">HADIR</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-brand-gold/50 uppercase tracking-widest pt-4 border-t border-white/5">
                    <ShieldCheck size={14} /> Terverifikasi Sistem
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-brand-dark uppercase tracking-widest text-[10px] flex items-center gap-2">
                    <Clock size={16} className="text-brand-gold" /> Terakhir Hadir
                  </h3>
                </div>
                
                <div className="space-y-6">
                  {checkedInAlumni.length > 0 ? (
                    checkedInAlumni.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-colors">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-brand-dark truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {new Date(item.checkedInAt!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {item.city || 'Wilayah -'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                        <UserPlus size={32} />
                      </div>
                      <p className="text-slate-400 text-sm font-medium italic">Belum ada check-in hari ini</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Info Box */}
          <div className="bg-gradient-to-br from-brand-gold to-brand-lightgold rounded-[40px] p-8 text-brand-dark shadow-xl shadow-brand-gold/10">
            <h4 className="text-lg font-bold font-serif mb-4 flex items-center gap-2">
              <ShieldCheck size={20} /> Panduan Petugas
            </h4>
            <ul className="space-y-3">
              {[
                "Pastikan barcode terlihat jelas",
                "Verifikasi nama dengan identitas fisik",
                "Jika belum terdata, gunakan tombol 'Tambah Baru'",
                "Hubungi Pusat Data jika terjadi error"
              ].map((tip, i) => (
                <li key={i} className="text-[11px] font-bold uppercase tracking-wide leading-relaxed flex items-start gap-2">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-brand-dark/20 rounded-full mt-1.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

