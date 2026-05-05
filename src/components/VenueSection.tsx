import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map as MapIcon, Navigation, ExternalLink, 
  Car, Coffee, Utensils, Home, Trophy, MoreHorizontal,
  MapPin, Info, ArrowRight, Route, Bike, Footprints, Flag,
  Store, Mic2, X
} from 'lucide-react';
import { VenuePoint, VenueRoute } from '../types';

const CATEGORIES = [
  { id: 'utama', label: 'Lokasi Utama', icon: MapPin, color: 'bg-brand-dark text-brand-gold', markerColor: '#002B1F' },
  { id: 'stage', label: 'Panggung Utama', icon: Mic2, color: 'bg-rose-100 text-rose-600', markerColor: '#e11d48' },
  { id: 'bazar', label: 'Area Bazar', icon: Store, color: 'bg-amber-100 text-amber-600', markerColor: '#d97706' },
  { id: 'parkir', label: 'Area Parkir', icon: Car, color: 'bg-blue-100 text-blue-600', markerColor: '#2563eb' },
  { id: 'makan', label: 'Konsumsi/Makan', icon: Utensils, color: 'bg-orange-100 text-orange-600', markerColor: '#ea580c' },
  { id: 'istirahat', label: 'Penginapan/Rehat', icon: Home, color: 'bg-green-100 text-green-600', markerColor: '#16a34a' },
  { id: 'porsas', label: 'Area PORSAS', icon: Trophy, color: 'bg-purple-100 text-purple-600', markerColor: '#9333ea' },
  { id: 'lainnya', label: 'Lainnya', icon: MoreHorizontal, color: 'bg-slate-100 text-slate-600', markerColor: '#475569' },
] as const;

interface VenueSectionProps {
  points: VenuePoint[];
  routes: VenueRoute[];
}

export default function VenueSection({ points, routes }: VenueSectionProps) {
  const [selectedPoint, setSelectedPoint] = useState<VenuePoint | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<VenueRoute | null>(null);

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

      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Visual Layout Map */}
        <div className="lg:col-span-7 xl:col-span-8 order-2 lg:order-1">
          <div className="bg-white rounded-[32px] md:rounded-[48px] p-2 md:p-4 shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden relative">
            <div className="bg-slate-900 rounded-[24px] md:rounded-[36px] min-h-[400px] md:aspect-[16/10] relative overflow-hidden ring-4 md:ring-8 ring-slate-100 cursor-crosshair">
              {/* Decorative Map Pattern */}
              <div className="absolute inset-0 opacity-10" style={{ 
                backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)',
                backgroundSize: '20px 20px' 
              }} />
              
              {/* Perspective Lines */}
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute inset-0 translate-y-1/4 scale-x-150 rotate-45 border-t border-slate-500" />
                <div className="absolute inset-0 -translate-y-1/4 scale-x-150 -rotate-45 border-t border-slate-500" />
              </div>

              {/* Legend Overlay - Adjust for mobile */}
              <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-md px-3 py-3 md:px-5 md:py-4 rounded-[20px] md:rounded-[24px] border border-white/10 z-10 scale-90 md:scale-100 origin-top-left max-w-[140px] md:max-w-none shadow-2xl">
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                  <Navigation size={12} className="text-brand-gold animate-pulse" />
                  <p className="text-[8px] md:text-[9px] font-bold text-white uppercase tracking-widest">Keterangan</p>
                </div>
                <div className="grid grid-cols-1 gap-1.5 md:gap-2">
                  {CATEGORIES.map(c => (
                    <div key={c.id} className="flex items-center gap-2 md:gap-3">
                      <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${c.color.split(' ')[0]}`} />
                      <span className="text-[7px] md:text-[8px] text-white/50 font-bold uppercase tracking-widest truncate">{c.label}</span>
                    </div>
                  ))}
                  <div className="h-px bg-white/10 my-1" />
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-brand-gold`} />
                    <span className="text-[7px] md:text-[8px] text-white/50 font-bold uppercase tracking-widest truncate">Rute Kegiatan</span>
                  </div>
                </div>
              </div>

              {/* Points & Routes Container */}
              <div className="absolute inset-8 sm:inset-20 lg:inset-24">
                {/* Visual Routes Rendering */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                  {routes.map(route => {
                    const pathData = route.points.map((p, idx) => {
                      const x = ((p.lng - minLng) / (maxLng - minLng)) * 100;
                      const y = 100 - (((p.lat - minLat) / (maxLat - minLat)) * 100);
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ');

                    const isSelected = selectedRoute?.id === route.id;

                    return (
                      <g key={route.id} className="pointer-events-auto cursor-pointer" onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRoute(route);
                        setSelectedPoint(null);
                        if (window.innerWidth < 1024) document.getElementById('venue-detail')?.scrollIntoView({ behavior: 'smooth' });
                      }}>
                        <motion.path
                          d={pathData}
                          stroke={route.color || '#D4AF37'}
                          strokeWidth={isSelected ? "6" : "3"}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: isSelected ? 1 : 0.4 }}
                          transition={{ duration: 1.5 }}
                          className="transition-all hover:opacity-100"
                        />
                        {/* Interactive invisible thicker path for easier clicking */}
                        <path
                          d={pathData}
                          stroke="transparent"
                          strokeWidth="20"
                          fill="none"
                        />
                      </g>
                    );
                  })}
                </svg>

                {points.map(point => {
                  const cat = CATEGORIES.find(c => c.id === point.category) || CATEGORIES[5];
                  const left = ((point.longitude - minLng) / (maxLng - minLng)) * 100;
                  const top = 100 - (((point.latitude - minLat) / (maxLat - minLat)) * 100);
                  const isSelected = selectedPoint?.id === point.id;
                  const isArea = point.type === 'area';

                  return (
                    <motion.div 
                      key={point.id}
                      className="absolute"
                      style={{ 
                        left: `${left}%`, 
                        top: `${top}%`, 
                        transform: isArea ? 'none' : 'translate(-50%, -50%)',
                        width: isArea ? `${point.width}%` : 'auto',
                        height: isArea ? `${point.height}%` : 'auto',
                      }}
                    >
                      {isArea ? (
                        <button
                          onClick={() => {
                            setSelectedPoint(point);
                            if (window.innerWidth < 1024) document.getElementById('venue-detail')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`w-full h-full rounded-xl md:rounded-2xl border-2 shadow-2xl relative group/area transition-all duration-300 flex flex-col items-center justify-center p-1 md:p-2 text-center gap-1 ${cat.color.replace('text-', 'border-').split(' ')[0]} ${isSelected ? 'scale-105 z-40 bg-brand-gold/20 border-brand-gold ring-2 md:ring-4 ring-brand-gold/20' : 'bg-white/10 hover:bg-white/20'}`}
                        >
                          <cat.icon size={14} className={isSelected ? 'text-brand-gold' : 'text-white/40'} />
                          <span className={`text-[6px] md:text-[8px] font-bold uppercase tracking-widest hidden sm:block ${isSelected ? 'text-white' : 'text-white/60'}`}>{point.name}</span>
                          
                          {isSelected && (
                            <motion.div 
                              className="absolute -inset-1 md:-inset-2 rounded-2xl md:rounded-3xl border-2 border-brand-gold/50"
                              animate={{ opacity: [0.5, 0.2, 0.5], scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setSelectedPoint(point);
                            if (window.innerWidth < 1024) document.getElementById('venue-detail')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`relative group/pin flex flex-col items-center transition-all duration-500 ${isSelected ? 'scale-125 z-40' : 'hover:scale-110 z-20'}`}
                        >
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl relative ring-2 md:ring-4 ring-white/10 ${cat.color} ${isSelected ? 'ring-brand-gold font-bold shadow-brand-gold/40' : ''}`}>
                            <cat.icon size={16} className="md:w-5 md:h-5" />
                            
                            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover/pin:opacity-100 transition-all pointer-events-none whitespace-nowrap hidden sm:block`}>
                              <div className="bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl shadow-2xl border border-slate-100">
                                <p className="text-[9px] md:text-[10px] font-bold text-brand-dark">{point.name}</p>
                              </div>
                              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rotate-45 mx-auto -mt-1 border-r border-b border-slate-100" />
                            </div>
                          </div>

                          {isSelected && (
                            <motion.div 
                              layoutId="marker-pulse"
                              className="absolute -inset-1.5 md:-inset-2 rounded-2xl md:rounded-3xl border-2 border-brand-gold opacity-50"
                              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                          <div className="w-1.5 h-0.5 md:w-2 md:h-1 bg-black/40 rounded-full blur-sm mt-1" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="mt-2 md:mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 md:px-6 py-3 md:py-4 bg-slate-50/50 rounded-[20px] md:rounded-[28px] border border-slate-50">
              <div className="flex items-center gap-2 md:gap-3">
                <Info size={14} className="text-brand-gold shrink-0" />
                <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center sm:text-left">
                  {window.innerWidth < 768 ? 'Klik ikon untuk detail' : 'Klik pada ikon untuk melihat detail & navigasi'}
                </p>
              </div>
              <div className="text-[8px] md:text-[10px] font-bold text-brand-dark uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full">
                Area Pesantren Sukahideng
              </div>
            </div>
          </div>
        </div>

        {/* Location List & Info */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 order-1 lg:order-2">
          <div className="bg-white rounded-[32px] md:rounded-[48px] p-6 md:p-8 shadow-xl shadow-slate-200 border border-slate-100 flex flex-col max-h-[600px] lg:h-[700px]">
            <h3 className="text-lg md:text-xl font-serif font-bold text-brand-dark mb-4 md:mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                Daftar Lokasi & Rute
                <span className="text-[10px] bg-brand-gold/10 text-brand-dark px-2 py-0.5 rounded-full font-sans font-bold">{points.length + routes.length}</span>
              </span>
              <MapPin size={18} className="text-brand-gold/40" />
            </h3>

            <div className="flex-grow space-y-2.5 overflow-y-auto pr-2 custom-scrollbar">
              {/* Render Routes in List */}
              {routes.length > 0 && (
                <div className="mb-4">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">Rute Kegiatan</p>
                  <div className="space-y-2">
                    {routes.map((route) => {
                      const isSelected = selectedRoute?.id === route.id;
                      const RouteIcon = route.type === 'gowes' ? Bike : route.type === 'jalan-santai' ? Footprints : Flag;

                      return (
                        <button
                          key={route.id}
                          onClick={() => {
                            setSelectedRoute(route);
                            setSelectedPoint(null);
                            if (window.innerWidth < 1024) document.getElementById('venue-detail')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`w-full text-left p-3.5 md:p-4 rounded-2xl md:rounded-3xl transition-all border-2 ${isSelected ? 'border-brand-gold bg-brand-gold/5 shadow-md scale-[1.02]' : 'border-slate-50 hover:border-slate-200 bg-slate-50/30'}`}
                        >
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 bg-brand-dark text-brand-gold`}>
                              <RouteIcon size={16} className="md:w-5 md:h-5" />
                            </div>
                            <div className="flex-grow min-w-0">
                              <p className="font-bold text-xs md:text-sm text-brand-dark truncate">{route.name}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">{route.type}</p>
                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                <p className="text-[8px] md:text-[9px] font-bold text-brand-gold uppercase tracking-widest">{route.distance || 'Lihat Rute'}</p>
                              </div>
                            </div>
                            <ArrowRight size={14} className={`shrink-0 transition-transform ${isSelected ? 'translate-x-1 text-brand-gold' : 'text-slate-300'}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Render Points in List */}
              {points.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">Titik Lokasi</p>
                  <div className="space-y-2">
                    {points.map((point) => {
                      const cat = CATEGORIES.find(c => c.id === point.category) || CATEGORIES[5];
                      const isSelected = selectedPoint?.id === point.id;

                      return (
                        <button
                          key={point.id}
                          onClick={() => {
                            setSelectedPoint(point);
                            setSelectedRoute(null);
                            if (window.innerWidth < 1024) document.getElementById('venue-detail')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`w-full text-left p-3.5 md:p-4 rounded-2xl md:rounded-3xl transition-all border-2 ${isSelected ? 'border-brand-gold bg-brand-gold/5 shadow-md scale-[1.02]' : 'border-slate-50 hover:border-slate-200 bg-slate-50/30'}`}
                        >
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                              <cat.icon size={16} className="md:w-5 md:h-5" />
                            </div>
                            <div className="flex-grow min-w-0">
                              <p className="font-bold text-xs md:text-sm text-brand-dark truncate">{point.name}</p>
                              <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">{cat.label}</p>
                            </div>
                            <ArrowRight size={14} className={`shrink-0 transition-transform ${isSelected ? 'translate-x-1 text-brand-gold' : 'text-slate-300'}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {points.length === 0 && routes.length === 0 && (
                <div className="text-center py-12 md:py-20 text-slate-400 space-y-3">
                  <MapIcon size={32} className="mx-auto opacity-10" />
                  <p className="text-xs italic">Data lokasi segera hadir.</p>
                </div>
              )}
            </div>

            {/* Selected Detail Area */}
            <div id="venue-detail" className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-slate-100 min-h-[160px]">
              <AnimatePresence mode="wait">
                {selectedPoint ? (
                  <motion.div 
                    key={selectedPoint.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-brand-dark rounded-[24px] md:rounded-[32px] p-5 md:p-6 text-brand-cream relative overflow-hidden shadow-2xl shadow-brand-dark/20"
                  >
                    <div className="absolute -top-4 -right-4 p-4 opacity-5 pointer-events-none text-white">
                      <MapPin size={100} />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                         <h4 className="text-base md:text-lg font-bold pr-8">{selectedPoint.name}</h4>
                         <button onClick={() => setSelectedPoint(null)} className="text-white/20 hover:text-white transition-colors"><X size={18} /></button>
                      </div>
                      <p className="text-[10px] md:text-xs text-brand-cream/60 leading-relaxed mb-4 line-clamp-3">
                        {selectedPoint.description || 'Lokasi strategis dalam rangkaian acara Milad ke-104 Sukahideng.'}
                      </p>
                      
                      <div className="flex items-center gap-2 md:gap-3 bg-white/5 p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-white/5 mb-5 overflow-x-auto no-scrollbar">
                        <Navigation size={14} className="text-brand-gold shrink-0" />
                        <div className="font-mono text-[8px] md:text-[9px] flex gap-4 whitespace-nowrap">
                          <span className="opacity-50">LAT: {selectedPoint.latitude.toFixed(6)}</span>
                          <span className="opacity-50">LNG: {selectedPoint.longitude.toFixed(6)}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleOpenMap(selectedPoint)}
                        className="w-full bg-brand-gold text-brand-dark py-3 md:py-4 rounded-xl md:rounded-2xl font-bold uppercase tracking-widest text-[9px] md:text-[10px] flex items-center justify-center gap-2 hover:bg-white transition-all active:scale-[0.98]"
                      >
                        Navigasi Google Maps <ExternalLink size={14} />
                      </button>
                    </div>
                  </motion.div>
                ) : selectedRoute ? (
                  <motion.div 
                    key={selectedRoute.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-brand-dark rounded-[24px] md:rounded-[32px] p-5 md:p-6 text-brand-cream relative overflow-hidden shadow-2xl shadow-brand-dark/20 border-t-4"
                    style={{ borderColor: selectedRoute.color || '#D4AF37' }}
                  >
                    <div className="absolute -top-4 -right-4 p-4 opacity-5 pointer-events-none text-white">
                      <Route size={100} />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                         <h4 className="text-base md:text-lg font-bold pr-8">{selectedRoute.name}</h4>
                         <button onClick={() => setSelectedRoute(null)} className="text-white/20 hover:text-white transition-colors"><X size={18} /></button>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <div className="px-2 py-0.5 rounded-full bg-brand-gold text-brand-dark text-[8px] font-bold uppercase tracking-wider">
                          {selectedRoute.type}
                        </div>
                        <div className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[8px] font-bold uppercase tracking-wider">
                          {selectedRoute.distance || 'N/A'}
                        </div>
                      </div>

                      <p className="text-[10px] md:text-xs text-brand-cream/60 leading-relaxed mb-6">
                        {selectedRoute.description || 'Rute kegiatan ini melewati beberapa area penting di sekitar Sukahideng.'}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                           <p className="text-[8px] text-white/40 uppercase font-bold mb-1">Total Titik</p>
                           <p className="font-bold text-xs">{selectedRoute.points.length} Koordinat</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                           <p className="text-[8px] text-white/40 uppercase font-bold mb-1">Status Rute</p>
                           <p className="font-bold text-xs text-brand-gold">Aktif</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center px-4">
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                      Pilih lokasi untuk melihat rute <br className="hidden md:block" /> dan detail selengkapnya
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
