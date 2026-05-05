import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { VenuePoint, VenueRoute } from '../../types';
import { 
  MapPin, Plus, Trash2, Edit2, Save, X, 
  Map as MapIcon, Navigation, Info, 
  Car, Coffee, Utensils, Home, Trophy, MoreHorizontal,
  Route, Bike, Footprints, Flag,
  Store, Mic2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = [
  { id: 'utama', label: 'Lokasi Utama', icon: MapPin, color: 'bg-brand-dark text-brand-gold' },
  { id: 'stage', label: 'Panggung Utama', icon: Mic2, color: 'bg-rose-100 text-rose-600' },
  { id: 'bazar', label: 'Area Bazar', icon: Store, color: 'bg-amber-100 text-amber-600' },
  { id: 'parkir', label: 'Area Parkir', icon: Car, color: 'bg-blue-100 text-blue-600' },
  { id: 'makan', label: 'Konsumsi/Makan', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
  { id: 'istirahat', label: 'Penginapan/Rehat', icon: Home, color: 'bg-green-100 text-green-600' },
  { id: 'porsas', label: 'Area PORSAS', icon: Trophy, color: 'bg-purple-100 text-purple-600' },
  { id: 'lainnya', label: 'Lainnya', icon: MoreHorizontal, color: 'bg-slate-100 text-slate-600' },
] as const;

export default function VenuePanel() {
  const [points, setPoints] = useState<VenuePoint[]>([]);
  const [routes, setRoutes] = useState<VenueRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'points' | 'routes'>('points');
  
  // Point States
  const [editingPoint, setEditingPoint] = useState<Partial<VenuePoint> | null>(null);
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  
  // Route States
  const [editingRoute, setEditingRoute] = useState<Partial<VenueRoute> | null>(null);
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [newRoutePoint, setNewRoutePoint] = useState({ lat: '', lng: '' });

  const [viewMode, setViewMode] = useState<'list' | 'layout'>('list');

  useEffect(() => {
    const unsubPoints = onSnapshot(collection(db, 'venue_points'), (snapshot) => {
      setPoints(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VenuePoint)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'venue_points');
    });
    
    const unsubRoutes = onSnapshot(collection(db, 'venue_routes'), (snapshot) => {
      setRoutes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VenueRoute)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'venue_routes');
    });

    return () => {
      unsubPoints();
      unsubRoutes();
    };
  }, []);

  const handleSavePoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPoint || !auth.currentUser) return;

    try {
      if (editingPoint.id) {
        await updateDoc(doc(db, 'venue_points', editingPoint.id), editingPoint);
      } else {
        await addDoc(collection(db, 'venue_points'), editingPoint);
      }
      setEditingPoint(null);
      setIsAddingPoint(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'venue_points');
    }
  };

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute || !auth.currentUser) return;
    if (!editingRoute.points || editingRoute.points.length < 2) {
      alert("Rute harus memiliki minimal 2 titik koordinat.");
      return;
    }

    try {
      if (editingRoute.id) {
        await updateDoc(doc(db, 'venue_routes', editingRoute.id), editingRoute);
      } else {
        await addDoc(collection(db, 'venue_routes'), editingRoute);
      }
      setEditingRoute(null);
      setIsAddingRoute(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'venue_routes');
    }
  };

  const handleDelete = async (id: string, collectionName: 'venue_points' | 'venue_routes' = 'venue_points') => {
    if (!window.confirm('Hapus data ini?')) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, collectionName);
    }
  };

  // Logic for coordinate normalization for the visual grid
  const getMinMax = () => {
    const allLats = [
      ...points.map(p => p.latitude),
      ...routes.flatMap(r => r.points.map(p => p.lat))
    ];
    const allLngs = [
      ...points.map(p => p.longitude),
      ...routes.flatMap(r => r.points.map(p => p.lng))
    ];

    if (allLats.length === 0) return { minLat: -10, maxLat: 10, minLng: -10, maxLng: 10 };

    return {
      minLat: Math.min(...allLats) - 0.001,
      maxLat: Math.max(...allLats) + 0.001,
      minLng: Math.min(...allLngs) - 0.001,
      maxLng: Math.max(...allLngs) + 0.001,
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
            onClick={() => setActiveTab('points')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'points' ? 'bg-brand-dark text-brand-gold shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Titik Lokasi
          </button>
          <button 
            onClick={() => setActiveTab('routes')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'routes' ? 'bg-brand-dark text-brand-gold shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Rute Kegiatan
          </button>
          <div className="w-px h-6 bg-slate-100 mx-1" />
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'layout' : 'list')}
            className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-brand-dark hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            {viewMode === 'list' ? <MapIcon size={14} /> : <Edit2 size={14} />} 
            {viewMode === 'list' ? 'Visual Map' : 'Daftar'}
          </button>
          <button 
            onClick={() => {
              if (activeTab === 'points') {
                setEditingPoint({ category: 'utama', type: 'point' });
                setIsAddingPoint(true);
              } else {
                setEditingRoute({ type: 'gowes', points: [], color: '#D4AF37' });
                setIsAddingRoute(true);
              }
            }}
            className="bg-brand-gold text-brand-dark px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-brand-gold/20"
          >
            <Plus size={14} /> Tambah {activeTab === 'points' ? 'Lokasi' : 'Rute'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {(isAddingPoint || editingPoint?.id) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[40px] shadow-2xl border-2 border-brand-gold/20 overflow-hidden"
          >
            <form onSubmit={handleSavePoint} className="p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                <h3 className="text-xl font-serif font-bold text-brand-dark">
                  {editingPoint?.id ? 'Edit Titik Lokasi' : 'Tambah Titik Lokasi Baru'}
                </h3>
                <button type="button" onClick={() => { setEditingPoint(null); setIsAddingPoint(false); }} className="text-slate-300 hover:text-red-500 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
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
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 ml-1">Jenis Tampilan</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingPoint({ ...editingPoint, type: 'point' })}
                          className={`flex-1 py-4 px-2 rounded-2xl border-2 font-bold text-[10px] uppercase tracking-widest transition-all ${editingPoint?.type !== 'area' ? 'border-brand-gold bg-brand-gold/5 text-brand-dark' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                        >
                          Marker (Pin)
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPoint({ ...editingPoint, type: 'area', width: 10, height: 10 })}
                          className={`flex-1 py-4 px-2 rounded-2xl border-2 font-bold text-[10px] uppercase tracking-widest transition-all ${editingPoint?.type === 'area' ? 'border-brand-gold bg-brand-gold/5 text-brand-dark' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                        >
                          Area (Kotak)
                        </button>
                      </div>
                    </div>
                  </div>

                  {editingPoint?.type === 'area' && (
                    <div className="bg-brand-gold/5 p-6 rounded-[32px] border border-brand-gold/20 space-y-4">
                      <p className="text-[10px] font-bold text-brand-dark uppercase tracking-widest flex items-center gap-2">
                        <Save size={14} /> Pengaturan Dimensi Area
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-2">Lebar (%)</label>
                          <input 
                            type="number" 
                            min="1" max="100"
                            value={editingPoint?.width || 10}
                            onChange={e => setEditingPoint({ ...editingPoint, width: parseInt(e.target.value) })}
                            className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 outline-none focus:border-brand-gold transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-2">Tinggi (%)</label>
                          <input 
                            type="number" 
                            min="1" max="100"
                            value={editingPoint?.height || 10}
                            onChange={e => setEditingPoint({ ...editingPoint, height: parseInt(e.target.value) })}
                            className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 outline-none focus:border-brand-gold transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-2">Arah Memanjang (Horizontal)</label>
                        <div className="flex gap-2">
                          {[
                            { id: 'left', label: 'Ke Kanan', desc: 'Titik di Kiri' },
                            { id: 'center', label: 'Tengah', desc: 'Simetris' },
                            { id: 'right', label: 'Ke Kiri', desc: 'Titik di Kanan' },
                          ].map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setEditingPoint({ ...editingPoint, horizontalAlign: opt.id as any })}
                              className={`flex-1 py-3 px-2 rounded-xl border-2 transition-all flex flex-col items-center ${editingPoint?.horizontalAlign === opt.id || (!editingPoint?.horizontalAlign && opt.id === 'left') ? 'border-brand-gold bg-brand-gold/10' : 'border-white bg-white text-slate-400'}`}
                            >
                              <span className="text-[9px] font-bold uppercase tracking-wider">{opt.label}</span>
                              <span className="text-[7px] opacity-60">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

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
                  onClick={() => { setEditingPoint(null); setIsAddingPoint(false); }}
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

        {(isAddingRoute || editingRoute?.id) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[40px] shadow-2xl border-2 border-brand-gold/20 overflow-hidden"
          >
            <form onSubmit={handleSaveRoute} className="p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-gold/10 rounded-xl flex items-center justify-center text-brand-gold">
                    <Route size={20} />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-brand-dark">
                    {editingRoute?.id ? 'Edit Rute Kegiatan' : 'Tambah Rute Baru'}
                  </h3>
                </div>
                <button type="button" onClick={() => { setEditingRoute(null); setIsAddingRoute(false); }} className="text-slate-300 hover:text-red-500 transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Route Form Content */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 ml-1">Nama Rute</label>
                      <input 
                        type="text" required
                        value={editingRoute?.name || ''}
                        onChange={e => setEditingRoute({ ...editingRoute, name: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-gold font-medium"
                        placeholder="Contoh: Rute Gowes Milad"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 ml-1">Tipe Kegiatan</label>
                      <select 
                        value={editingRoute?.type || 'gowes'}
                        onChange={e => setEditingRoute({ ...editingRoute, type: e.target.value as any })}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-gold font-bold text-xs uppercase tracking-wider"
                      >
                        <option value="gowes">Gowes (Sepeda)</option>
                        <option value="jalan-santai">Jalan Santai</option>
                        <option value="pawai">Pawai / Konvoi</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 ml-1">Warna Rute</label>
                    <input 
                      type="color"
                      value={editingRoute?.color || '#D4AF37'}
                      onChange={e => setEditingRoute({ ...editingRoute, color: e.target.value })}
                      className="w-full h-14 p-1 bg-slate-50 border-2 border-slate-100 rounded-2xl cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 ml-1">Deskripsi & Jarak</label>
                    <input 
                      type="text"
                      value={editingRoute?.distance || ''}
                      onChange={e => setEditingRoute({ ...editingRoute, distance: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-gold font-medium mb-4"
                      placeholder="Contoh: 15.5 KM"
                    />
                    <textarea 
                      value={editingRoute?.description || ''}
                      onChange={e => setEditingRoute({ ...editingRoute, description: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-brand-gold font-medium h-32 resize-none"
                      placeholder="Detail rute kegiatan..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">Koordinat Rute ({editingRoute?.points?.length || 0})</label>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 space-y-4 max-h-[300px] overflow-y-auto">
                    {editingRoute?.points?.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 group">
                        <span className="text-[10px] font-mono text-slate-400">{idx + 1}.</span>
                        <div className="flex-grow grid grid-cols-2 gap-2 text-[9px] font-mono">
                          <span>LAT: {p.lat}</span>
                          <span>LNG: {p.lng}</span>
                        </div>
                        <button type="button" onClick={() => {
                          const pts = [...(editingRoute.points || [])];
                          pts.splice(idx, 1);
                          setEditingRoute({...editingRoute, points: pts});
                        }} className="text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-200">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input type="number" step="any" placeholder="Lat" value={newRoutePoint.lat} onChange={e => setNewRoutePoint({...newRoutePoint, lat: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-mono"/>
                        <input type="number" step="any" placeholder="Lng" value={newRoutePoint.lng} onChange={e => setNewRoutePoint({...newRoutePoint, lng: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-mono"/>
                      </div>
                      <button type="button" onClick={() => {
                        if (!newRoutePoint.lat || !newRoutePoint.lng) return;
                        setEditingRoute({...editingRoute, points: [...(editingRoute?.points || []), {lat: parseFloat(newRoutePoint.lat), lng: parseFloat(newRoutePoint.lng)} ]});
                        setNewRoutePoint({lat: '', lng: ''});
                      }} className="w-full py-2 bg-brand-dark text-white rounded-lg text-[10px] font-bold uppercase tracking-widest">Tambah Titik</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-slate-50 gap-4">
                <button type="button" onClick={() => { setEditingRoute(null); setIsAddingRoute(false); }} className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Batal</button>
                <button type="submit" className="bg-brand-dark text-brand-gold px-12 py-4 rounded-2xl font-bold uppercase tracking-[0.2em] shadow-xl">Simpan Rute</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'points' ? (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 md:px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lokasi & Kategori</th>
                    <th className="px-6 md:px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Koordinat</th>
                    <th className="px-6 md:px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deskripsi</th>
                    <th className="px-6 md:px-8 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {points.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic font-serif">Belum ada titik lokasi yang ditambahkan.</td>
                    </tr>
                  )}
                  {points.map((point) => {
                    const cat = CATEGORIES.find(c => c.id === point.category) || CATEGORIES[5];
                    return (
                      <tr key={point.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 md:px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                              <cat.icon size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-brand-dark text-sm md:text-base">{point.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{cat.label} {point.type === 'area' ? '• AREA' : ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 md:px-8 py-6">
                          <div className="font-mono text-[10px] text-slate-500 space-y-0.5">
                            <p>LAT: {point.latitude.toFixed(6)}</p>
                            <p>LNG: {point.longitude.toFixed(6)}</p>
                          </div>
                        </td>
                        <td className="px-6 md:px-8 py-6">
                          <p className="text-xs text-slate-500 line-clamp-2 max-w-[200px]">{point.description || '-'}</p>
                        </td>
                        <td className="px-6 md:px-8 py-6">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => { setEditingPoint(point); setIsAddingPoint(true); }}
                              className="p-2 text-slate-400 hover:text-brand-dark hover:bg-slate-100 rounded-lg transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(point.id, 'venue_points')}
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
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 md:px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rute & Tipe</th>
                    <th className="px-6 md:px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jarak / Titik</th>
                    <th className="px-6 md:px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visual</th>
                    <th className="px-6 md:px-8 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {routes.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic font-serif">Belum ada rute kegiatan yang ditambahkan.</td>
                    </tr>
                  )}
                  {routes.map((route) => {
                    const RouteIcon = route.type === 'gowes' ? Bike : route.type === 'jalan-santai' ? Footprints : Flag;
                    return (
                      <tr key={route.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 md:px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-brand-dark text-brand-gold shadow-sm`}>
                              <RouteIcon size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-brand-dark text-sm md:text-base">{route.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{route.type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 md:px-8 py-6">
                          <div className="space-y-1">
                            <p className="font-bold text-brand-dark text-xs">{route.distance || 'N/A'}</p>
                            <p className="text-[10px] text-slate-400">{route.points.length} Koordinat</p>
                          </div>
                        </td>
                        <td className="px-6 md:px-8 py-6">
                          <div className="w-16 h-2 rounded-full" style={{ backgroundColor: route.color || '#D4AF37' }} />
                        </td>
                        <td className="px-6 md:px-8 py-6">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => { setEditingRoute(route); setIsAddingRoute(true); }}
                              className="p-2 text-slate-400 hover:text-brand-dark hover:bg-slate-100 rounded-lg transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(route.id, 'venue_routes')}
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
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-xl border border-slate-100 p-4 md:p-8">
          <div className="bg-slate-900 rounded-[24px] md:rounded-[32px] aspect-video md:aspect-[21/9] relative overflow-hidden border-4 md:border-8 border-slate-800 shadow-inner">
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-20" style={{ 
              backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)',
              backgroundSize: '30px 30px' 
            }} />
            
            {/* Compass / Legend Overlay */}
            <div className="absolute top-3 md:top-4 right-3 md:right-4 bg-black/60 backdrop-blur-md p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/10 z-10 scale-75 md:scale-100 origin-top-right">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <Navigation size={12} className="text-brand-gold animate-bounce" />
                <p className="text-[8px] md:text-[10px] font-bold text-white uppercase tracking-widest">Visual Scale</p>
              </div>
              <div className="space-y-1 md:space-y-1.5">
                {CATEGORIES.slice(0, 4).map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${c.color.split(' ')[0]}`} />
                    <span className="text-[7px] md:text-[8px] text-white/50 font-bold uppercase tracking-tighter truncate max-w-[80px]">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scale Info */}
            <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl border border-white/10 text-white/40 text-[7px] md:text-[9px] font-bold uppercase tracking-widest">
              Relative Map Coordinates
            </div>

            {/* Actual Points & Routes */}
            <div className="absolute inset-10 md:inset-20">
              {/* Routes Rendering */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                {routes.map(route => {
                  const pathData = route.points.map((p, idx) => {
                    const x = ((p.lng - minLng) / (maxLng - minLng)) * 100;
                    const y = 100 - (((p.lat - minLat) / (maxLat - minLat)) * 100);
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ');

                  return (
                    <motion.path
                      key={route.id}
                      d={pathData}
                      stroke={route.color || '#D4AF37'}
                      strokeWidth="2"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.6 }}
                      className="transition-all hover:opacity-100"
                    />
                  );
                })}
              </svg>

              {points.map(point => {
                const cat = CATEGORIES.find(c => c.id === point.category) || CATEGORIES[5];
                const left = ((point.longitude - minLng) / (maxLng - minLng)) * 100;
                const top = 100 - (((point.latitude - minLat) / (maxLat - minLat)) * 100);
                const isArea = point.type === 'area';
                const align = point.horizontalAlign || 'left';

                let transform = isArea ? 'none' : 'translate(-50%, -50%)';
                if (isArea) {
                  if (align === 'center') transform = 'translateX(-50%)';
                  else if (align === 'right') transform = 'translateX(-100%)';
                }

                return (
                  <motion.div 
                    key={point.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute group transition-all"
                    style={{ 
                      left: `${left}%`, 
                      top: `${top}%`,
                      transform,
                      width: isArea ? `${point.width}%` : 'auto',
                      height: isArea ? `${point.height}%` : 'auto',
                    }}
                  >
                    {isArea ? (
                      <div className={`w-full h-full rounded-lg md:rounded-xl border-2 flex items-center justify-center p-1 relative shadow-lg
                        ${cat.id === 'utama' ? 'border-brand-gold bg-brand-dark/60' : 
                          cat.id === 'stage' ? 'border-rose-500 bg-rose-500/40' :
                          cat.id === 'bazar' ? 'border-amber-500 bg-amber-500/40' :
                          cat.id === 'parkir' ? 'border-blue-500 bg-blue-500/40' :
                          cat.id === 'makan' ? 'border-orange-500 bg-orange-500/40' :
                          cat.id === 'istirahat' ? 'border-green-500 bg-green-500/40' :
                          cat.id === 'porsas' ? 'border-purple-500 bg-purple-500/40' :
                          'border-slate-500 bg-slate-500/40'}`}>
                         <cat.icon size={12} className="text-white/20" />
                         <div className="absolute inset-x-0 -bottom-4 text-center">
                            <span className="text-[6px] text-white/40 font-bold uppercase whitespace-nowrap">{point.name}</span>
                         </div>
                      </div>
                    ) : (
                      <div className={`w-6 h-6 md:w-10 md:h-10 rounded-lg md:rounded-2xl flex items-center justify-center shadow-2xl relative cursor-help ring-2 md:ring-4 ring-white/10 ${cat.color} group-hover:scale-125 transition-transform duration-300`}>
                        <cat.icon size={14} className="md:w-5 md:h-5" />
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 md:mb-3 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20">
                          <div className="bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl shadow-2xl border border-slate-100 whitespace-nowrap">
                            <p className="text-[8px] md:text-[10px] font-bold text-brand-dark">{point.name}</p>
                            <p className="text-[6px] md:text-[8px] text-slate-400 font-bold uppercase tracking-widest">{cat.label}</p>
                          </div>
                          <div className="w-1.5 h-1.5 bg-white rotate-45 mx-auto -mt-1 border-r border-b border-slate-100" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {points.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-600 font-serif italic text-xs md:text-base">
                Belum ada data lokasi untuk divisualisasikan
              </div>
            )}
          </div>

          <div className="mt-6 md:mt-8 flex items-start gap-3 md:gap-4 p-4 md:p-6 bg-slate-50 rounded-[24px] md:rounded-[32px] border border-slate-100">
            <Info className="text-brand-gold mt-1 shrink-0" size={18} md:size={20} />
            <div>
              <p className="text-xs md:text-sm font-bold text-brand-dark">Tentang Visual Denah</p>
              <p className="text-[10px] md:text-xs text-slate-500 leading-relaxed max-w-2xl">
                Representasi ini berbasis koordinat relatif GPS. Pada tampilan mobile, diagram peta menyesuaikan diri agar tetap terlihat informatif. Pastikan koordinat Latitude & Longitude diisi dengan benar untuk akurasi posisi.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
