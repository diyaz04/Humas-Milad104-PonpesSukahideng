import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { VenuePoint } from '../../types';
import { 
  MapPin, Plus, Trash2, Edit2, Save, X, 
  Map as MapIcon, Navigation, Info, 
  Car, Coffee, Utensils, Home, Trophy, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = [
  { id: 'utama', label: 'Lokasi Utama', icon: MapPin, color: 'bg-brand-dark text-brand-gold' },
  { id: 'parkir', label: 'Area Parkir', icon: Car, color: 'bg-blue-100 text-blue-600' },
  { id: 'makan', label: 'Konsumsi/Makan', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
  { id: 'istirahat', label: 'Penginapan/Rehat', icon: Home, color: 'bg-green-100 text-green-600' },
  { id: 'porsas', label: 'Area PORSAS', icon: Trophy, color: 'bg-purple-100 text-purple-600' },
  { id: 'lainnya', label: 'Lainnya', icon: MoreHorizontal, color: 'bg-slate-100 text-slate-600' },
] as const;

export default function VenuePanel() {
  const [points, setPoints] = useState<VenuePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPoint, setEditingPoint] = useState<Partial<VenuePoint> | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'layout'>('list');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'venue_points'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VenuePoint));
      setPoints(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'venue_points');
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPoint) return;

    if (!auth.currentUser) {
      alert("Sesi akses berakhir. Silakan login kembali.");
      return;
    }

    try {
      if (editingPoint.id) {
        await updateDoc(doc(db, 'venue_points', editingPoint.id), editingPoint);
      } else {
        await addDoc(collection(db, 'venue_points'), editingPoint);
      }
      setEditingPoint(null);
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'venue_points');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus titik lokasi ini?')) return;
    try {
      await deleteDoc(doc(db, 'venue_points', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'venue_points');
    }
  };

  // Logic for coordinate normalization for the visual grid
  const getMinMax = () => {
    if (points.length === 0) return { minLat: -10, maxLat: 10, minLng: -10, maxLng: 10 };
    const lats = points.map(p => p.latitude);
    const lngs = points.map(p => p.longitude);
    return {
      minLat: Math.min(...lats) - 0.001,
      maxLat: Math.max(...lats) + 0.001,
      minLng: Math.min(...lngs) - 0.001,
      maxLng: Math.max(...lngs) + 0.001,
    };
  };

  const { minLat, maxLat, minLng, maxLng } = getMinMax();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-brand-dark rounded-[22px] flex items-center justify-center text-brand-gold shadow-xl shadow-brand-dark/10 ring-4 ring-white">
            <MapIcon size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-brand-dark">Manajemen Denah & Lokasi</h2>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Titik Koordinat Area Milad ke-104</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-brand-dark text-brand-gold shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Daftar
          </button>
          <button 
            onClick={() => setViewMode('layout')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'layout' ? 'bg-brand-dark text-brand-gold shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Visual Denah
          </button>
          <div className="w-px h-6 bg-slate-100 mx-1" />
          <button 
            onClick={() => {
              setEditingPoint({ category: 'utama' });
              setIsAdding(true);
            }}
            className="bg-brand-gold text-brand-dark px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-brand-gold/20"
          >
            <Plus size={14} /> Tambah Lokasi
          </button>
        </div>
      </div>

      <AnimatePresence>
        {(isAdding || editingPoint?.id) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[40px] shadow-2xl border-2 border-brand-gold/20 overflow-hidden"
          >
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                <h3 className="text-xl font-serif font-bold text-brand-dark">
                  {editingPoint?.id ? 'Edit Titik Lokasi' : 'Tambah Titik Lokasi Baru'}
                </h3>
                <button type="button" onClick={() => { setEditingPoint(null); setIsAdding(false); }} className="text-slate-300 hover:text-red-500 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 ml-1">Nama Lokasi</label>
                    <input 
                      type="text" 
                      required
                      value={editingPoint?.name || ''}
                      onChange={e => setEditingPoint({ ...editingPoint, name: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-gold transition-all font-medium"
                      placeholder="Contoh: Panggung Utama"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 ml-1">Kategori</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setEditingPoint({ ...editingPoint, category: cat.id as any })}
                          className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${editingPoint?.category === cat.id ? 'border-brand-gold bg-brand-gold/5 text-brand-dark' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                        >
                          <cat.icon size={18} />
                          <span className="text-[8px] font-bold uppercase tracking-tighter">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 ml-1">Deskripsi Singkat</label>
                    <textarea 
                      value={editingPoint?.description || ''}
                      onChange={e => setEditingPoint({ ...editingPoint, description: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-gold transition-all font-medium h-32 resize-none"
                      placeholder="Informasi mengenai lokasi ini..."
                    />
                  </div>
                </div>

                <div className="space-y-6 bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                  <div className="flex items-center gap-3 mb-4 text-brand-dark">
                    <Navigation size={20} className="text-brand-gold" />
                    <h4 className="font-bold text-sm">Titik Koordinat (GPS)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-2">Latitude</label>
                      <input 
                        type="number" 
                        step="any"
                        required
                        value={editingPoint?.latitude || ''}
                        onChange={e => setEditingPoint({ ...editingPoint, latitude: parseFloat(e.target.value) })}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-gold transition-all font-mono text-sm"
                        placeholder="-7.123456"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-2">Longitude</label>
                      <input 
                        type="number" 
                        step="any"
                        required
                        value={editingPoint?.longitude || ''}
                        onChange={e => setEditingPoint({ ...editingPoint, longitude: parseFloat(e.target.value) })}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-gold transition-all font-mono text-sm"
                        placeholder="108.123456"
                      />
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                    <Info size={16} className="text-amber-500 mt-1 flex-shrink-0" />
                    <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                      Gunakan Google Maps untuk mendapatkan titik koordinat yang presisi. Klik kanan pada peta di Google Maps untuk melihat angka Latitude & Longitude.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-slate-50 gap-4">
                <button 
                  type="button" 
                  onClick={() => { setEditingPoint(null); setIsAdding(false); }}
                  className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="bg-brand-dark text-brand-gold px-12 py-4 rounded-2xl font-bold uppercase tracking-[0.2em] shadow-xl shadow-brand-dark/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Save size={18} /> Simpan Lokasi
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lokasi & Kategori</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Koordinat</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deskripsi</th>
                  <th className="px-8 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {points.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">Belum ada titik lokasi yang ditambahkan.</td>
                  </tr>
                )}
                {points.map((point) => {
                  const cat = CATEGORIES.find(c => c.id === point.category) || CATEGORIES[5];
                  return (
                    <tr key={point.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.color}`}>
                            <cat.icon size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-brand-dark">{point.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{cat.label}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-mono text-[10px] text-slate-500 space-y-0.5">
                          <p>LAT: {point.latitude}</p>
                          <p>LNG: {point.longitude}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs text-slate-500 line-clamp-2 max-w-xs">{point.description || '-'}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingPoint(point)}
                            className="p-2 text-slate-400 hover:text-brand-dark hover:bg-slate-100 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(point.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 p-8">
          <div className="bg-slate-900 rounded-[32px] aspect-video relative overflow-hidden border-8 border-slate-800 shadow-inner">
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-20" style={{ 
              backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)',
              backgroundSize: '40px 40px' 
            }} />
            
            {/* Compass / Legend Overlay */}
            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 z-10">
              <div className="flex items-center gap-2 mb-3">
                <Navigation size={14} className="text-brand-gold animate-bounce" />
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">Visual Direction</p>
              </div>
              <div className="space-y-1.5">
                {CATEGORIES.map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${c.color.split(' ')[0]}`} />
                    <span className="text-[8px] text-white/60 font-bold uppercase tracking-tighter">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scale Info */}
            <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white/40 text-[9px] font-bold uppercase tracking-widest">
              Normalized Relative Coordinate Scale
            </div>

            {/* Actual Points */}
            <div className="absolute inset-20">
              {points.map(point => {
                const cat = CATEGORIES.find(c => c.id === point.category) || CATEGORIES[5];
                // Calculate position percentage: (val - min) / (max - min) * 100
                const left = ((point.longitude - minLng) / (maxLng - minLng)) * 100;
                const top = 100 - (((point.latitude - minLat) / (maxLat - minLat)) * 100);

                return (
                  <motion.div 
                    key={point.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute group transition-all"
                    style={{ 
                      left: `${left}%`, 
                      top: `${top}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl relative cursor-help ring-4 ring-white/10 ${cat.color} group-hover:scale-125 transition-transform duration-300`}>
                      <cat.icon size={20} />
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20">
                        <div className="bg-white px-4 py-2 rounded-xl shadow-2xl border border-slate-100 whitespace-nowrap">
                          <p className="text-[10px] font-bold text-brand-dark">{point.name}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{cat.label}</p>
                        </div>
                        <div className="w-2 h-2 bg-white rotate-45 mx-auto -mt-1 border-r border-b border-slate-100" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {points.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-serif italic">
                Belum ada data lokasi untuk divisualisasikan
              </div>
            )}
          </div>

          <div className="mt-8 flex items-start gap-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
            <Info className="text-brand-gold mt-1" size={20} />
            <div>
              <p className="text-sm font-bold text-brand-dark">Tentang Visual Denah</p>
              <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                Tampilan di atas adalah representasi visual dari titik-titik koordinat yang telah diinput. Jarak antar ikon bersifat relatif berdasarkan perbedaan angka Latitude dan Longitude. Ikon akan otomatis memposisikan diri sehingga seluruh titik dapat terlihat dalam bingkai denah.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
