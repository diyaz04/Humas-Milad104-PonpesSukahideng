import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map as MapIcon, Navigation, ExternalLink, 
  Car, Coffee, Utensils, Home, Trophy, MoreHorizontal,
  MapPin, Info, ArrowRight
} from 'lucide-react';
import { VenuePoint } from '../types';

const CATEGORIES = [
  { id: 'utama', label: 'Lokasi Utama', icon: MapPin, color: 'bg-brand-dark text-brand-gold', markerColor: '#002B1F' },
  { id: 'parkir', label: 'Area Parkir', icon: Car, color: 'bg-blue-100 text-blue-600', markerColor: '#2563eb' },
  { id: 'makan', label: 'Konsumsi/Makan', icon: Utensils, color: 'bg-orange-100 text-orange-600', markerColor: '#ea580c' },
  { id: 'istirahat', label: 'Penginapan/Rehat', icon: Home, color: 'bg-green-100 text-green-600', markerColor: '#16a34a' },
  { id: 'porsas', label: 'Area PORSAS', icon: Trophy, color: 'bg-purple-100 text-purple-600', markerColor: '#9333ea' },
  { id: 'lainnya', label: 'Lainnya', icon: MoreHorizontal, color: 'bg-slate-100 text-slate-600', markerColor: '#475569' },
] as const;

interface VenueSectionProps {
  points: VenuePoint[];
}

export default function VenueSection({ points }: VenueSectionProps) {
  const [selectedPoint, setSelectedPoint] = useState<VenuePoint | null>(null);

  const getMinMax = () => {
    if (points.length === 0) return { minLat: -10, maxLat: 10, minLng: -10, maxLng: 10 };
    const lats = points.map(p => p.latitude);
    const lngs = points.map(p => p.longitude);
    return {
      minLat: Math.min(...lats) - 0.0005,
      maxLat: Math.max(...lats) + 0.0005,
      minLng: Math.min(...lngs) - 0.0005,
      maxLng: Math.max(...lngs) + 0.0005,
    };
  };

  const { minLat, maxLat, minLng, maxLng } = getMinMax();

  const handleOpenMap = (point: VenuePoint) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center gap-3 bg-brand-gold/10 px-4 py-2 rounded-full text-brand-dark mb-6">
          <MapIcon size={18} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Site Plan & Lokasi</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark mb-6">Denah Kegiatan</h2>
        <p className="text-slate-500 max-w-2xl leading-relaxed">
          Temukan lokasi panggung utama, area perlombaan PORSAS, tempat penginapan, dan fasilitas pendukung lainnya di sekitar area Pesantren Sukahideng.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Visual Layout Map */}
        <div className="lg:col-span-8 group">
          <div className="bg-white rounded-[48px] p-4 shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden relative">
            <div className="bg-slate-900 rounded-[36px] aspect-[16/10] relative overflow-hidden ring-8 ring-slate-100 cursor-crosshair">
              {/* Decorative Map Pattern */}
              <div className="absolute inset-0 opacity-10" style={{ 
                backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)',
                backgroundSize: '30px 30px' 
              }} />
              
              {/* Perspective Lines for depth feel */}
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute inset-0 translate-y-1/4 scale-x-150 rotate-45 border-t border-slate-500" />
                <div className="absolute inset-0 -translate-y-1/4 scale-x-150 -rotate-45 border-t border-slate-500" />
              </div>

              {/* Legend Overlay */}
              <div className="absolute top-6 left-6 bg-slate-800/80 backdrop-blur-md px-5 py-4 rounded-[24px] border border-white/10 z-10 hidden sm:block">
                <div className="flex items-center gap-2 mb-3">
                  <Navigation size={14} className="text-brand-gold animate-pulse" />
                  <p className="text-[9px] font-bold text-white uppercase tracking-widest">Keterangan Denah</p>
                </div>
                <div className="space-y-2">
                  {CATEGORIES.map(c => (
                    <div key={c.id} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${c.color.split(' ')[0]}`} />
                      <span className="text-[8px] text-white/50 font-bold uppercase tracking-widest">{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Points */}
              <div className="absolute inset-16 sm:inset-24">
                {points.map(point => {
                  const cat = CATEGORIES.find(c => c.id === point.category) || CATEGORIES[5];
                  const left = ((point.longitude - minLng) / (maxLng - minLng)) * 100;
                  const top = 100 - (((point.latitude - minLat) / (maxLat - minLat)) * 100);
                  const isSelected = selectedPoint?.id === point.id;

                  return (
                    <motion.div 
                      key={point.id}
                      className="absolute"
                      style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
                    >
                      <button 
                        onClick={() => setSelectedPoint(point)}
                        className={`relative group/pin flex flex-col items-center transition-all duration-500 ${isSelected ? 'scale-125 z-40' : 'hover:scale-110 z-20'}`}
                      >
                        {/* Marker Pin */}
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl relative ring-4 ring-white/10 ${cat.color} ${isSelected ? 'ring-brand-gold' : ''}`}>
                          <cat.icon size={20} />
                          
                          {/* Label (Desktop Only on Hover) */}
                          <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover/pin:opacity-100 transition-all pointer-events-none whitespace-nowrap hidden sm:block`}>
                            <div className="bg-white px-4 py-2 rounded-xl shadow-2xl border border-slate-100">
                              <p className="text-[10px] font-bold text-brand-dark">{point.name}</p>
                            </div>
                            <div className="w-2 h-2 bg-white rotate-45 mx-auto -mt-1 border-r border-b border-slate-100" />
                          </div>
                        </div>

                        {/* Pulse effect for selected */}
                        {isSelected && (
                          <motion.div 
                            layoutId="marker-pulse"
                            className="absolute -inset-2 rounded-3xl border-2 border-brand-gold opacity-50"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}

                        {/* Drop Shadow on "Ground" */}
                        <div className="w-2 h-1 bg-black/40 rounded-full blur-sm mt-1" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="mt-4 flex items-center justify-between px-6 py-4 bg-slate-50/50 rounded-[28px] border border-slate-50">
              <div className="flex items-center gap-3">
                <Info size={16} className="text-brand-gold" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Klik pada ikon untuk melihat detail lokasi & koordinat GPS
                </p>
              </div>
              <div className="text-[10px] font-bold text-brand-dark uppercase tracking-widest hidden sm:block">
                Area Pesantren Sukahideng
              </div>
            </div>
          </div>
        </div>

        {/* Location List & Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[48px] p-8 shadow-xl shadow-slate-200 border border-slate-100 h-full min-h-[600px] flex flex-col">
            <h3 className="text-xl font-serif font-bold text-brand-dark mb-6 flex items-center gap-2">
              Daftar Titik Penting
              <span className="text-xs bg-brand-gold/10 text-brand-dark px-2.5 py-1 rounded-full font-sans">{points.length}</span>
            </h3>

            <div className="flex-grow space-y-3 overflow-y-auto pr-2 no-scrollbar">
              {points.map((point) => {
                const cat = CATEGORIES.find(c => c.id === point.category) || CATEGORIES[5];
                const isSelected = selectedPoint?.id === point.id;

                return (
                  <button
                    key={point.id}
                    onClick={() => setSelectedPoint(point)}
                    className={`w-full text-left p-4 rounded-3xl transition-all border-2 ${isSelected ? 'border-brand-gold bg-brand-gold/5 shadow-lg' : 'border-slate-50 hover:border-slate-200 bg-slate-50/30'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                        <cat.icon size={18} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-bold text-brand-dark truncate">{point.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{cat.label}</p>
                      </div>
                      <ArrowRight size={14} className={`shrink-0 transition-transform ${isSelected ? 'translate-x-1 text-brand-gold' : 'text-slate-300'}`} />
                    </div>
                  </button>
                );
              })}

              {points.length === 0 && (
                <div className="text-center py-20 text-slate-400 space-y-3">
                  <MapPin size={32} className="mx-auto opacity-20" />
                  <p className="text-sm italic">Belum ada titik lokasi yang tersedia.</p>
                </div>
              )}
            </div>

            {/* Selected Detail Area */}
            <AnimatePresence mode="wait">
              {selectedPoint ? (
                <motion.div 
                  key={selectedPoint.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-8 pt-8 border-t border-slate-100"
                >
                  <div className="bg-brand-dark rounded-[32px] p-6 text-brand-cream relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <MapPin size={64} />
                    </div>
                    
                    <h4 className="text-lg font-bold mb-2">{selectedPoint.name}</h4>
                    <p className="text-xs text-brand-cream/60 leading-relaxed mb-6">
                      {selectedPoint.description || 'Lokasi strategis dalam rangkaian acara Milad ke-104 Sukahideng.'}
                    </p>
                    
                    <div className="space-y-3 mb-8">
                       <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                          <Navigation size={16} className="text-brand-gold" />
                          <div className="font-mono text-[10px]">
                            <p className="opacity-50">LAT: {selectedPoint.latitude}</p>
                            <p className="opacity-50">LNG: {selectedPoint.longitude}</p>
                          </div>
                       </div>
                    </div>

                    <button 
                      onClick={() => handleOpenMap(selectedPoint)}
                      className="w-full bg-brand-gold text-brand-dark py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                    >
                      Buka di Google Maps <ExternalLink size={14} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    Pilih salah satu lokasi untuk melihat info lengkap dan rute navigasi
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
