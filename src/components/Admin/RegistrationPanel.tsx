import React, { useState, useEffect, useRef } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc, addDoc, where, getDocs, writeBatch } from 'firebase/firestore';
import { Alumnus } from '../../types';
import { 
  Users, CheckCircle2, UserCheck, Search, Upload, Download, Trash2, Edit2, 
  Plus, QrCode, ScanLine, X, Loader2, ArrowLeft, Filter, FileSpreadsheet,
  MapPin, Phone, GraduationCap, Building2, Check, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ConfirmModal from './ConfirmModal';
import { motion, AnimatePresence } from 'motion/react';

export default function RegistrationPanel() {
  const [alumni, setAlumni] = useState<Alumnus[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'management' | 'confirmed' | 'checkin'>('dashboard');
  const [search, setSearch] = useState('');
  const [selectedAlumni, setSelectedAlumni] = useState<Alumnus | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Alumnus>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Check-in specific
  const [checkInSearch, setCheckInSearch] = useState('');
  const [checkInResults, setCheckInResults] = useState<Alumnus[]>([]);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [qrInput, setQrInput] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'alumni'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Alumnus));
      setAlumni(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'alumni');
    });
    return unsubscribe;
  }, []);

  const [isRepairing, setIsRepairing] = useState(false);
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
      const res = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setProvinces(data || []);
    } catch (e) {
      console.error('Failed to fetch provinces:', e);
    }
  };

  const fetchRegencies = async (provinceId: string) => {
    try {
      const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setRegencies(data || []);
      return data || [];
    } catch (e) {
      console.error('Failed to fetch regencies:', e);
      return [];
    }
  };

  const fetchDistricts = async (regencyId: string) => {
    try {
      const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${regencyId}.json`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setDistricts(data || []);
      return data || [];
    } catch (e) {
      console.error('Failed to fetch districts:', e);
      return [];
    }
  };

  const fetchVillages = async (districtId: string) => {
    try {
      const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${districtId}.json`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setVillages(data || []);
      return data || [];
    } catch (e) {
      console.error('Failed to fetch villages:', e);
      return [];
    }
  };

  useEffect(() => {
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

  const repairData = async () => {
    if (!confirm("Sistem akan memperbarui seluruh data alumni untuk sinkronisasi pencarian. Lanjutkan?")) return;
    setIsRepairing(true);
    try {
      const batch = writeBatch(db);
      let count = 0;
      alumni.forEach(a => {
        if (!a.nameLowercase) {
          const docRef = doc(db, 'alumni', a.id);
          batch.update(docRef, { nameLowercase: a.name.toLowerCase() });
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
        alert(`Berhasil mensinkronisasi ${count} data.`);
      } else {
        alert("Semua data sudah tersinkronisasi.");
      }
    } catch (error) {
      alert("Gagal melakukan sinkronisasi data.");
    } finally {
      setIsRepairing(false);
    }
  };

  const stats = {
    total: alumni.length,
    confirmed: alumni.filter(a => a.status === 'confirmed').length,
    checkedIn: alumni.filter(a => a.status === 'checked-in').length,
    unconfirmed: alumni.filter(a => a.status === 'unconfirmed').length,
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const batch = writeBatch(db);
        data.forEach(item => {
          const docRef = doc(collection(db, 'alumni'));
          const name = item.Nama || item.name || '';
          batch.set(docRef, {
            name: name,
            nameLowercase: name.toLowerCase(),
            yearIn: String(item['Tahun Masuk'] || item.yearIn || ''),
            phone: String(item.Telepon || item.phone || ''),
            address: item.Alamat || item.address || '',
            village: item.Desa || item.village || '',
            district: item.Kecamatan || item.district || '',
            city: item.Kota || item.city || '',
            province: item.Provinsi || item.province || '',
            profession: item.Profesi || item.profession || '',
            status: 'unconfirmed',
          });
        });
        await batch.commit();
        alert(`Berhasil mengimpor ${data.length} data alumni.`);
      } catch (error) {
        console.error("Import error:", error);
        alert("Gagal mengimpor data. Pastikan format file sesuai.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(alumni);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alumni");
    XLSX.writeFile(wb, "Data_Alumni_Milad104.xlsx");
  };

  const handleCheckIn = async (alumniItem: Alumnus) => {
    if (alumniItem.status === 'checked-in') {
      alert(`${alumniItem.name} sudah melakukan check-in.`);
      return;
    }
    
    try {
      const code = alumniItem.registrationCode || `MILAD104-${Math.floor(1000 + Math.random() * 9000)}`;
      await updateDoc(doc(db, 'alumni', alumniItem.id), {
        status: 'checked-in',
        registrationCode: code,
        checkedInAt: new Date().toISOString()
      });
      alert(`Check-in berhasil atas nama ${alumniItem.name}`);
      setCheckInSearch('');
      setCheckInResults([]);
      setQrInput('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'alumni');
    }
  };

  const handleQrCheckIn = async () => {
    const q = query(collection(db, 'alumni'), where('registrationCode', '==', qrInput));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const doc = snap.docs[0];
      handleCheckIn({ id: doc.id, ...doc.data() } as Alumnus);
    } else {
      alert("Kode registrasi tidak ditemukan.");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, 'alumni', deleteId));
      setDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'alumni');
    }
  };

  const filteredAlumni = alumni.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.city.toLowerCase().includes(search.toLowerCase()) ||
    a.yearIn.includes(search)
  );

  const confirmedAlumni = alumni.filter(a => a.status === 'confirmed' || a.status === 'checked-in');

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-4 bg-slate-100 p-2 rounded-[28px] w-fit">
        {[
          { id: 'dashboard', icon: Users, label: 'Dashboard' },
          { id: 'management', icon: FileSpreadsheet, label: 'Database Alumni' },
          { id: 'confirmed', icon: CheckCircle2, label: 'Data Konfirmasi' },
          { id: 'checkin', icon: ScanLine, label: 'Check-In Peserta' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-500 hover:text-brand-dark'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Users size={24} /></div>
                <Users className="text-slate-100" size={40} />
              </div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Total Alumni</p>
              <p className="text-3xl font-black text-brand-dark">{stats.total}</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center"><CheckCircle2 size={24} /></div>
                <CheckCircle2 className="text-slate-100" size={40} />
              </div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Sudah Konfirmasi</p>
              <p className="text-3xl font-black text-brand-dark">{stats.confirmed}</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center"><UserCheck size={24} /></div>
                <UserCheck className="text-slate-100" size={40} />
              </div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Hadir (Checked-In)</p>
              <p className="text-3xl font-black text-brand-dark">{stats.checkedIn}</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center"><Filter size={24} /></div>
                <Filter className="text-slate-100" size={40} />
              </div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Belum Respon</p>
              <p className="text-3xl font-black text-brand-dark">{stats.unconfirmed}</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100">
            <h3 className="text-xl font-bold text-brand-dark mb-6">Persentase Kehadiran</h3>
            <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
               <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(stats.checkedIn / stats.total) * 100}%` }}
                className="absolute inset-y-0 bg-green-500"
              />
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(stats.confirmed / stats.total) * 100}%` }}
                className="absolute inset-y-0 bg-orange-500 opacity-30"
              />
            </div>
            <div className="flex justify-between items-center mt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Real-time Presence: {Math.round((stats.checkedIn / stats.total) * 100) || 0}%
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[10px] text-slate-500 font-bold">HADIR</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500 opacity-30" /><span className="text-[10px] text-slate-500 font-bold">TERKONFIRMASI</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'management' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama, wilayah, atau angkatan..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm focus:ring-2 focus:ring-brand-gold/20 outline-none w-full shadow-sm"
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <label className="flex-1 bg-white border border-slate-100 text-brand-dark px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-all flex shadow-sm">
                <Upload size={16} /> Import Excel
                <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleImport} />
              </label>
              <button 
                onClick={handleExport}
                className="flex-1 bg-white border border-slate-100 text-brand-dark px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
              >
                <Download size={16} /> Export
              </button>
              <button 
                onClick={repairData}
                disabled={isRepairing}
                className="flex-1 bg-blue-50 text-blue-600 px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-100 transition-all shadow-sm disabled:opacity-50"
              >
                {isRepairing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} 
                {isRepairing ? 'Memproses...' : 'Sinkron Pencarian'}
              </button>
              <button 
                onClick={() => { 
                  setFormData({ status: 'unconfirmed' }); 
                  setSelectedIds({ province: '', regency: '', district: '', village: '' });
                  setIsFormOpen(true); 
                }}
                className="flex-1 bg-brand-dark text-white px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-gold transition-all shadow-lg"
              >
                <Plus size={16} /> Tambah
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alumni</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kontak & Wilayah</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kodereg</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAlumni.slice(0, 100).map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-8 py-6">
                        <p className="font-bold text-brand-dark">{a.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Angkatan {a.yearIn}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs text-brand-dark font-medium">{a.phone || '-'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{a.city || '-'}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-widest ${
                          a.status === 'checked-in' ? 'bg-green-100 text-green-700' : 
                          a.status === 'confirmed' ? 'bg-orange-100 text-orange-700' : 
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {a.status === 'checked-in' ? 'Hadir' : a.status === 'confirmed' ? 'Konfirmasi' : 'Belum'}
                        </span>
                      </td>
                      <td className="px-8 py-6 font-mono text-xs font-bold text-brand-dark">
                        {a.registrationCode || '-'}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                            onClick={() => { 
                              setFormData(a); 
                              setSelectedAlumni(a); 
                              setSelectedIds({ province: '', regency: '', district: '', village: '' });
                              setIsFormOpen(true); 
                            }}
                            className="p-2 text-slate-400 hover:text-brand-dark"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => setDeleteId(a.id)}
                            className="p-2 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'confirmed' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <h3 className="text-xl font-bold text-brand-dark">Daftar Alumni Terkonfirmasi</h3>
            <button 
              onClick={handleExport}
              className="bg-white border border-slate-100 text-brand-dark px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download size={16} /> Export ke Excel
            </button>
          </div>

          <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alumni</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kontak & Wilayah</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kode Reg</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {confirmedAlumni.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-bold text-brand-dark">{a.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Angkatan {a.yearIn}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs text-brand-dark font-medium">{a.phone || '-'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{a.city || '-'}</p>
                      </td>
                      <td className="px-8 py-6 font-mono text-xs font-bold text-brand-dark">
                        {a.registrationCode}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-widest ${
                          a.status === 'checked-in' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {a.status === 'checked-in' ? 'Hadir' : 'Terkonfirmasi'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-[10px] text-slate-400 font-bold">
                        {a.checkedInAt ? `Hadir: ${new Date(a.checkedInAt).toLocaleString('id-ID')}` : (a.confirmedAt ? `Regis: ${new Date(a.confirmedAt).toLocaleString('id-ID')}` : '-')}
                      </td>
                    </tr>
                  ))}
                  {confirmedAlumni.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic">Belum ada alumni yang melakukan konfirmasi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'checkin' && (
        <div className="max-w-4xl mx-auto space-y-12 py-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* QR Scan Mode */}
            <div className="bg-white p-10 rounded-[50px] shadow-2xl border border-slate-50 text-center space-y-6">
              <div className="w-20 h-20 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto text-brand-gold">
                <ScanLine size={40} />
              </div>
              <h3 className="text-2xl font-bold text-brand-dark">Scan QR Code</h3>
              <p className="text-sm text-slate-500">Scan QR Code dari peserta atau ketik kode manual di bawah ini.</p>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="MILAD104-XXXX"
                  value={qrInput}
                  onChange={e => setQrInput(e.target.value)}
                  className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-mono font-bold text-center focus:border-brand-gold transition-all"
                />
                <button 
                  onClick={handleQrCheckIn}
                  className="bg-brand-dark text-white px-6 rounded-2xl hover:bg-brand-gold transition-all"
                >
                  <Check size={24} />
                </button>
              </div>
            </div>

            {/* Manual Search Mode */}
            <div className="bg-white p-10 rounded-[50px] shadow-2xl border border-slate-50 text-center space-y-6">
               <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <UserCheck size={40} />
              </div>
              <h3 className="text-2xl font-bold text-brand-dark">Input Manual</h3>
              <p className="text-sm text-slate-500">Gunakan kolom ini jika peserta lupa kode atau belum registrasi.</p>
              
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Cari Nama Alumni..."
                  value={checkInSearch}
                  onChange={async (e) => {
                    const val = e.target.value;
                    setCheckInSearch(val);
                    if (val.length >= 3) {
                      setCheckInLoading(true);
                      const valLower = val.toLowerCase();
                      const q = query(
                        collection(db, 'alumni'),
                        where('nameLowercase', '>=', valLower),
                        where('nameLowercase', '<=', valLower + '\uf8ff')
                      );
                      const snap = await getDocs(q);
                      setCheckInResults(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alumnus)));
                      setCheckInLoading(false);
                    } else {
                      setCheckInResults([]);
                    }
                  }}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 focus:border-brand-gold transition-all"
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {checkInResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Hasil Pencarian Check-In</h4>
                  <button onClick={() => setCheckInResults([])} className="text-[10px] font-bold text-red-500 uppercase">Bersihkan</button>
                </div>
                {checkInResults.map(item => (
                  <div key={item.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-lg transition-all group">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-serif text-brand-gold font-bold transition-colors group-hover:bg-brand-gold group-hover:text-white">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-brand-dark">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{item.yearIn} • {item.city || 'Wilayah -'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {item.status === 'checked-in' ? (
                        <span className="flex items-center gap-2 text-green-500 font-bold text-[10px] uppercase tracking-widest">
                          <Check size={14} /> Sudah Hadir
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleCheckIn(item)}
                          className="bg-brand-gold text-brand-dark px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-brand-gold/20"
                        >
                          Check-In
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {checkInSearch.length >= 3 && !checkInLoading && checkInResults.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100"
              >
                 <p className="text-slate-400 font-medium mb-4 italic">Peserta belum terdaftar di database alumni?</p>
                 <button 
                  onClick={() => { 
                     setFormData({ status: 'checked-in' }); 
                     setSelectedIds({ province: '', regency: '', district: '', village: '' });
                     setIsFormOpen(true); 
                   }}
                  className="bg-brand-dark text-white px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-gold transition-all"
                >
                  Registrasi & Check-In Langsung
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Manual Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm" 
              onClick={() => setIsFormOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl p-8 md:p-12 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-bold text-brand-dark">Data Registrasi Alumni</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Lengkapi data manajemen alumni</p>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24} /></button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const data = {
                    ...formData,
                    nameLowercase: formData.name?.toLowerCase() || '',
                    registrationCode: formData.registrationCode || `MILAD104-${Math.floor(1000 + Math.random() * 9000)}`,
                    status: formData.status || 'unconfirmed'
                  };
                  if (data.status === 'checked-in' && !data.checkedInAt) {
                    data.checkedInAt = new Date().toISOString();
                  }
                  if (data.status === 'confirmed' && !data.confirmedAt) {
                    data.confirmedAt = new Date().toISOString();
                  }

                  if (selectedAlumni) {
                    await updateDoc(doc(db, 'alumni', selectedAlumni.id), data);
                  } else {
                    await addDoc(collection(db, 'alumni'), data);
                  }
                  setIsFormOpen(false);
                  setFormData({});
                  setSelectedAlumni(null);
                  alert("Data alumni tersimpan!");
                } catch (error) {
                  handleFirestoreError(error, OperationType.WRITE, 'alumni');
                }
              }} className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 ml-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark focus:outline-none focus:border-brand-gold transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 ml-1">Tahun Masuk</label>
                  <input 
                    type="text" 
                    value={formData.yearIn || ''}
                    onChange={e => setFormData({ ...formData, yearIn: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark focus:outline-none focus:border-brand-gold transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 ml-1">Nomor Telepon/WA</label>
                  <input 
                    type="text" 
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark focus:outline-none focus:border-brand-gold transition-all"
                    required
                  />
                </div>
                 <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 ml-1">Profesi / Berkiprah</label>
                  <input 
                    type="text" 
                    value={formData.profession || ''}
                    onChange={e => setFormData({ ...formData, profession: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark focus:outline-none focus:border-brand-gold transition-all"
                    required
                  />
                </div>
                 <div className="md:col-span-2 space-y-4">
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1 ml-1">Alamat Lengkap</label>
                  <textarea 
                    value={formData.address || ''}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark focus:outline-none focus:border-brand-gold transition-all resize-none"
                    rows={2}
                    placeholder="Nama Jalan, Blok, No Rumah..."
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">Provinsi</label>
                      <select 
                        value={selectedIds.province}
                        onChange={e => handleProvinceChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark text-sm focus:outline-none"
                        required
                      >
                        <option value="">Pilih Provinsi</option>
                        {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">Kabupaten/Kota</label>
                      <select 
                        value={selectedIds.regency}
                        onChange={e => handleRegencyChange(e.target.value)}
                        disabled={!selectedIds.province}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark text-sm focus:outline-none disabled:opacity-50"
                        required
                      >
                        <option value="">Pilih Kabupaten/Kota</option>
                        {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">Kecamatan</label>
                      <select 
                        value={selectedIds.district}
                        onChange={e => handleDistrictChange(e.target.value)}
                        disabled={!selectedIds.regency}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark text-sm focus:outline-none disabled:opacity-50"
                        required
                      >
                        <option value="">Pilih Kecamatan</option>
                        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">Kelurahan/Desa</label>
                      <select 
                        value={selectedIds.village}
                        onChange={e => handleVillageChange(e.target.value)}
                        disabled={!selectedIds.district}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark text-sm focus:outline-none disabled:opacity-50"
                        required
                      >
                        <option value="">Pilih Kelurahan/Desa</option>
                        {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 ml-1">Status</label>
                  <select 
                    value={formData.status || 'unconfirmed'}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-brand-dark focus:outline-none focus:border-brand-gold transition-all appearance-none"
                  >
                    <option value="unconfirmed">Belum Konfirmasi</option>
                    <option value="confirmed">Sudah Konfirmasi</option>
                    <option value="checked-in">Sudah Hadir (Check-In)</option>
                  </select>
                </div>
                <div className="md:col-span-2 pt-6">
                  <button type="submit" className="w-full bg-brand-dark text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-brand-gold transition-all shadow-xl shadow-brand-dark/10">
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Data Alumni"
        message="Apakah Anda yakin ingin menghapus data alumni ini permanently? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
}
