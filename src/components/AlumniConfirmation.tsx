import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, UserPlus, CheckCircle2, QrCode, Download, Edit3, ArrowLeft, Loader2, MapPin, Phone, GraduationCap, Building2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { Alumnus } from '../types';
import { QRCodeSVG } from 'qrcode.react';

export default function AlumniConfirmation() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Alumnus[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState<Alumnus | null>(null);
  const [mode, setMode] = useState<'search' | 'detail' | 'edit' | 'manual' | 'success'>('search');
  const [formData, setFormData] = useState<Partial<Alumnus>>({});
  const [successData, setSuccessData] = useState<{ name: string; code: string } | null>(null);

  const [allAlumni, setAllAlumni] = useState<Alumnus[]>([]);
  const [hasLoadedAll, setHasLoadedAll] = useState(false);

  const preloadAlumni = async () => {
    if (hasLoadedAll) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'alumni'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alumnus));
      setAllAlumni(data);
      setHasLoadedAll(true);
    } catch (error) {
      console.error("Failed to preload alumni:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const trimmedSync = search.trim().toLowerCase();
    if (trimmedSync.length < 3) {
      setResults([]);
      return;
    }
    
    const matched = allAlumni.filter(a => 
      a.name.toLowerCase().includes(trimmedSync) ||
      (a.nameLowercase && a.nameLowercase.includes(trimmedSync))
    );
    setResults(matched.slice(0, 10)); // Show top 10 matches
  };

  const [provinces, setProvinces] = useState<any[]>([]);
  const [regencies, setRegencies] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  const [selectedIds, setSelectedIds] = useState({
    province: '',
    regency: '',
    district: '',
    village: ''
  });

  const fetchProvinces = async () => {
    try {
      const res = await fetch('https://cdn.statically.io/gh/emsifa/api-wilayah-indonesia/master/api/provinces.json');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setProvinces(data || []);
    } catch (e) {
      console.error('Failed to fetch provinces:', e);
    }
  };

  const fetchRegencies = async (provinceId: string) => {
    try {
      const res = await fetch(`https://cdn.statically.io/gh/emsifa/api-wilayah-indonesia/master/api/regencies/${provinceId}.json`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setRegencies(data || []);
    } catch (e) {
      console.error('Failed to fetch regencies:', e);
    }
  };

  const fetchDistricts = async (regencyId: string) => {
    try {
      const res = await fetch(`https://cdn.statically.io/gh/emsifa/api-wilayah-indonesia/master/api/districts/${regencyId}.json`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setDistricts(data || []);
    } catch (e) {
      console.error('Failed to fetch districts:', e);
    }
  };

  const fetchVillages = async (districtId: string) => {
    try {
      const res = await fetch(`https://cdn.statically.io/gh/emsifa/api-wilayah-indonesia/master/api/villages/${districtId}.json`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setVillages(data || []);
    } catch (e) {
      console.error('Failed to fetch villages:', e);
    }
  };

  useEffect(() => {
    preloadAlumni();
    fetchProvinces();
  }, []);

  const handleProvinceChange = (id: string) => {
    const name = provinces.find(p => p.id === id)?.name || '';
    setSelectedIds({ province: id, regency: '', district: '', village: '' });
    setFormData({ ...formData, province: name, city: '', district: '', village: '' });
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    if (id) fetchRegencies(id);
  };

  const handleRegencyChange = (id: string) => {
    const name = regencies.find(r => r.id === id)?.name || '';
    setSelectedIds(prev => ({ ...prev, regency: id, district: '', village: '' }));
    setFormData({ ...formData, city: name, district: '', village: '' });
    setDistricts([]);
    setVillages([]);
    if (id) fetchDistricts(id);
  };

  const handleDistrictChange = (id: string) => {
    const name = districts.find(d => d.id === id)?.name || '';
    setSelectedIds(prev => ({ ...prev, district: id, village: '' }));
    setFormData({ ...formData, district: name, village: '' });
    setVillages([]);
    if (id) fetchVillages(id);
  };

  const handleVillageChange = (id: string) => {
    const name = villages.find(v => v.id === id)?.name || '';
    setSelectedIds(prev => ({ ...prev, village: id }));
    setFormData({ ...formData, village: name });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, allAlumni]);

  const generateCode = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `MILAD104-${random}`;
  };

  const handleConfirm = async (alumni: Alumnus) => {
    setLoading(true);
    try {
      const code = alumni.registrationCode || generateCode();
      const alumniRef = doc(db, 'alumni', alumni.id);
      await updateDoc(alumniRef, {
        status: 'confirmed',
        registrationCode: code,
        confirmedAt: new Date().toISOString()
      });
      setSuccessData({ name: alumni.name, code });
      setMode('success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'alumni');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = mode === 'edit' && selectedAlumni;
      const code = isEdit ? selectedAlumni.registrationCode || generateCode() : generateCode();
      
      const data = {
        ...formData,
        nameLowercase: (formData.name || '').toLowerCase(),
        status: 'confirmed',
        registrationCode: code,
        confirmedAt: new Date().toISOString()
      };

      if (isEdit) {
        await updateDoc(doc(db, 'alumni', selectedAlumni.id), data);
        setSuccessData({ name: formData.name || selectedAlumni.name, code });
      } else {
        await addDoc(collection(db, 'alumni'), data);
        setSuccessData({ name: formData.name || '', code });
      }
      setMode('success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'alumni');
    } finally {
      setLoading(false);
    }
  };

  const startManual = () => {
    setSelectedIds({ province: '', regency: '', district: '', village: '' });
    setFormData({
      name: '',
      yearIn: '',
      phone: '',
      address: '',
      village: '',
      district: '',
      city: '',
      province: '',
      profession: '',
      status: 'unconfirmed'
    });
    setMode('manual');
  };

  const startEdit = (alumni: Alumnus) => {
    setFormData(alumni);
    setSelectedAlumni(alumni);
    setMode('edit');
  };

  return (
    <div className="min-h-screen bg-brand-cream pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-gold">
            <CheckCircle2 size={40} className="fill-brand-gold/20" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark mb-4">Konfirmasi Alumni</h1>
          <p className="text-brand-dark/60 font-medium max-w-xl mx-auto uppercase tracking-widest text-[10px] leading-relaxed">
            Sistem Registrasi Online Kehadiran Alumni <br /> Milad ke-104 Pondok Pesantren Sukahideng
          </p>
        </motion.div>

        <div className="bg-white rounded-[40px] shadow-2xl shadow-brand-dark/5 p-8 md:p-12 border border-slate-50 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {mode === 'search' && (
              <motion.div 
                key="search"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                  <input 
                    type="text" 
                    placeholder="Cari nama Anda di database..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-6 pl-16 pr-8 text-lg focus:outline-none focus:border-brand-gold transition-all font-medium text-brand-dark"
                  />
                  {loading && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <Loader2 size={24} className="animate-spin text-brand-gold" />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {results.map((alumni) => (
                    <motion.div 
                      key={alumni.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => { setSelectedAlumni(alumni); setMode('detail'); }}
                      className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl cursor-pointer hover:bg-brand-gold/5 hover:border-brand-gold/20 border-2 border-transparent transition-all group"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-brand-gold font-serif text-2xl font-bold group-hover:bg-brand-gold group-hover:text-white transition-colors uppercase">
                          {alumni.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-brand-dark text-lg">{alumni.name}</p>
                          <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                            <GraduationCap size={14} />
                            <span>Angkatan {alumni.yearIn}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-brand-gold font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        Detail <ArrowLeft className="rotate-180" size={14} />
                      </div>
                    </motion.div>
                  ))}

                  {search.length >= 3 && !loading && results.length === 0 && (
                    <div className="text-center py-12 space-y-6">
                      <p className="text-slate-400 font-medium italic">Nama tidak ditemukan di database kami?</p>
                      <button 
                        onClick={startManual}
                        className="inline-flex items-center gap-3 bg-brand-dark text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-brand-gold transition-all shadow-xl shadow-brand-dark/10"
                      >
                        <UserPlus size={18} /> Daftar Manual Sekarang
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {mode === 'detail' && selectedAlumni && (
              <motion.div 
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="flex items-center gap-4">
                  <button onClick={() => setMode('search')} className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all">
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-brand-dark">Detail Data Alumni</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Informasi Terdaftar</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-3xl">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3">Nama Lengkap</p>
                      <p className="text-xl font-bold text-brand-dark">{selectedAlumni.name}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3">Tahun Masuk Pesantren</p>
                      <p className="text-xl font-bold text-brand-dark">{selectedAlumni.yearIn}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3">Nomor Telepon</p>
                      <p className="text-xl font-bold text-brand-dark font-mono">{selectedAlumni.phone || '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-3xl">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3">Alamat</p>
                      <p className="text-sm font-medium text-brand-dark leading-relaxed">
                        {selectedAlumni.address}, Desa {selectedAlumni.village}, Kec. {selectedAlumni.district}, {selectedAlumni.city}, {selectedAlumni.province}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3">Tempat Berkiprah (Profesi)</p>
                      <p className="text-sm font-bold text-brand-dark">{selectedAlumni.profession || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-slate-100">
                  {selectedAlumni.status !== 'unconfirmed' ? (
                    <div className="w-full space-y-6">
                      <div className="bg-green-50 border border-green-100 p-6 rounded-3xl text-center">
                        <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2" />
                        <p className="text-brand-dark font-bold">Anda Sudah Melakukan Registrasi</p>
                        <p className="text-xs text-slate-500 mt-1">Data Anda telah diverifikasi oleh sistem.</p>
                      </div>
                      <button 
                        onClick={() => {
                          setSuccessData({ name: selectedAlumni.name, code: selectedAlumni.registrationCode || '' });
                          setMode('success');
                        }}
                        className="w-full bg-brand-dark text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-brand-gold transition-all shadow-xl"
                      >
                        <QrCode size={18} /> Lihat Bukti Registrasi & QR Code
                      </button>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleConfirm(selectedAlumni)}
                        disabled={loading}
                        className="flex-1 bg-brand-gold text-brand-dark py-5 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand-gold/20"
                      >
                        {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Konfirmasi Kehadiran</>}
                      </button>
                      <button 
                        onClick={() => startEdit(selectedAlumni)}
                        className="flex-1 bg-brand-dark text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        <Edit3 size={18} /> Edit / Lengkapi Data
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {(mode === 'manual' || mode === 'edit') && (
              <motion.div 
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4">
                  <button onClick={() => setMode('search')} className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all">
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-brand-dark">{mode === 'edit' ? 'Perbarui Data' : 'Daftar Manual'}</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                      {mode === 'edit' ? 'Lengkapi data kehadiran Anda' : 'Isi formulir untuk menambahkan data alumni baru'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 ml-1">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark focus:outline-none focus:border-brand-gold transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 ml-1">Tahun Masuk</label>
                    <input 
                      type="text" 
                      value={formData.yearIn}
                      onChange={e => setFormData({ ...formData, yearIn: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark focus:outline-none focus:border-brand-gold transition-all font-mono"
                      placeholder="Contoh: 2010"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 ml-1">Nomor WhatsApp</label>
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark focus:outline-none focus:border-brand-gold transition-all font-mono"
                      placeholder="0812xxxx"
                      required
                    />
                  </div>
                   <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 ml-1">Tempat Berkiprah</label>
                    <input 
                      type="text" 
                      value={formData.profession}
                      onChange={e => setFormData({ ...formData, profession: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark focus:outline-none focus:border-brand-gold transition-all"
                      placeholder="Contoh: Guru / Wirausaha"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 ml-1">Alamat Lengkap</label>
                    <textarea 
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark focus:outline-none focus:border-brand-gold transition-all resize-none"
                      rows={2}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 ml-1">Provinsi</label>
                      <select 
                        value={selectedIds.province}
                        onChange={e => handleProvinceChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark text-sm focus:outline-none focus:border-brand-gold transition-all appearance-none"
                        required
                      >
                        <option value="">Pilih Provinsi</option>
                        {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 ml-1">Kabupaten/Kota</label>
                      <select 
                        value={selectedIds.regency}
                        onChange={e => handleRegencyChange(e.target.value)}
                        disabled={!selectedIds.province}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark text-sm focus:outline-none focus:border-brand-gold transition-all appearance-none disabled:opacity-50"
                        required
                      >
                        <option value="">Pilih Kabupaten/Kota</option>
                        {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 ml-1">Kecamatan</label>
                      <select 
                        value={selectedIds.district}
                        onChange={e => handleDistrictChange(e.target.value)}
                        disabled={!selectedIds.regency}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark text-sm focus:outline-none focus:border-brand-gold transition-all appearance-none disabled:opacity-50"
                        required
                      >
                        <option value="">Pilih Kecamatan</option>
                        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 ml-1">Kelurahan/Desa</label>
                      <select 
                        value={selectedIds.village}
                        onChange={e => handleVillageChange(e.target.value)}
                        disabled={!selectedIds.district}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark text-sm focus:outline-none focus:border-brand-gold transition-all appearance-none disabled:opacity-50"
                        required
                      >
                        <option value="">Pilih Kelurahan/Desa</option>
                        {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-6">
                    <p className="text-[10px] text-slate-400 italic mb-6 text-center">"Data yang Anda isi akan otomatis ditambahkan ke database alumni Pesantren Sukahideng."</p>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-brand-dark text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-brand-gold transition-all shadow-xl shadow-brand-dark/10"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : <>Simpan & Konfirmasi Kehadiran <ArrowLeft className="rotate-180" size={16} /></>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {mode === 'success' && successData && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
              >
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto text-white shadow-xl shadow-green-500/20">
                  <CheckCircle2 size={48} />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-brand-dark">Konfirmasi Berhasil!</h2>
                  <p className="text-slate-500 font-medium">
                    Atas nama <span className="text-brand-dark font-bold">"{successData.name}"</span> telah berhasil melakukan registrasi untuk menghadiri Peringatan Milad ke-104 Pondok Pesantren Sukahideng.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-[40px] p-10 border-2 border-dashed border-slate-200">
                  <div className="mb-6">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2">Kode Registrasi Unik</p>
                    <p className="text-3xl font-mono font-black text-brand-dark tracking-tighter">{successData.code}</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-3xl inline-block shadow-lg mb-6">
                    <QRCodeSVG value={successData.code} size={200} />
                  </div>
                  
                  <div className="text-left space-y-4 max-w-sm mx-auto">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-brand-gold text-brand-dark flex items-center justify-center text-xs font-bold shrink-0">1</div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                        Tolong simpan bukti registrasi ini dengan cara <span className="font-bold text-brand-dark underline decoration-brand-gold/30">screenshot</span>.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-brand-gold text-brand-dark flex items-center justify-center text-xs font-bold shrink-0">2</div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                        Kode ini akan digunakan saat <span className="font-bold text-brand-dark underline decoration-brand-gold/30">heregistrasi (check-in)</span> untuk penukaran ID Card peserta di lokasi acara.
                      </p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => { setMode('search'); setSearch(''); setResults([]); }}
                  className="inline-flex items-center gap-3 text-brand-gold font-bold uppercase tracking-widest text-xs hover:text-brand-dark transition-colors"
                >
                  <ArrowLeft size={16} /> Kembali ke Beranda
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
