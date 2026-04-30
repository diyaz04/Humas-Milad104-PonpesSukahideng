import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Clock, MapPin, ChevronRight, ShoppingBag } from 'lucide-react';
import { format, parseISO, isAfter, isBefore, addMinutes, isSameDay } from 'date-fns';
import { ScheduleItem, Match, Registration } from '../types';

interface PopupBannerProps {
  schedule: ScheduleItem[];
  matches: Match[];
  registrations: Registration[];
}

export default function PopupBanner({ schedule, matches, registrations }: PopupBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentContent, setCurrentContent] = useState<any[]>([]);
  const [hasShown, setHasShown] = useState(false);

  const getTeamName = (id: string | null) => {
    if (!id) return "TBD";
    const reg = registrations.find(r => r.id === id);
    return reg ? reg.name : id;
  };

  const determineContent = (): any[] => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const items: any[] = [];
    
    // Check if before H-1 (Event July 15, H-1 is July 14)
    const hDay = parseISO('2026-07-15T00:00:00');
    const hMinus1 = parseISO('2026-07-14T00:00:00');
    
    if (isBefore(now, hMinus1)) {
      items.push({
        type: 'registration_promo',
        title: 'Info Pendaftaran',
        subtitle: 'Terbuka Untuk Umum & Alumni',
        details: 'Ayo bergabung dalam kemeriahan Milad ke-104! Segera daftarkan diri dan kabilah Anda.',
        isPromo: true
      });
      
      items.push({
        type: 'merchandise_promo',
        title: 'Official Merchandise',
        subtitle: 'Edisi Terbatas Milad 104',
        details: 'Miliki kaos dan atribut eksklusif Milad Sukahideng ke-104 sebelum kehabisan!',
        isMerch: true
      });
      
      return items;
    }

    // 1. Check all current matches
    const ongoingMatches = matches.filter(m => m.status === 'ongoing');
    ongoingMatches.forEach(m => {
      items.push({
        type: 'match',
        title: 'Pertandingan Sedang Berlangsung!',
        subtitle: m.sportId || 'Sport',
        details: `${getTeamName(m.teamAId)} vs ${getTeamName(m.teamBId)}`,
        time: m.startTime ? `Sejak ${m.startTime} WIB` : 'Sedang Berlangsung',
        location: 'Arena PORSAS'
      });
    });

    // 2. Check all current schedule items
    const currentEvents = schedule.filter(s => {
      const start = parseISO(`${s.date}T${s.startTime}`);
      const end = parseISO(`${s.date}T${s.endTime}`);
      return s.date === todayStr && isAfter(now, start) && isBefore(now, end);
    });

    currentEvents.forEach(e => {
      items.push({
        type: 'event',
        title: 'Kegiatan Berlangsung',
        subtitle: e.category,
        details: e.name,
        time: `${e.startTime} - ${e.endTime} WIB`,
        location: e.location
      });
    });

    if (items.length > 0) return items;

    // 3. Next upcoming (Any day)
    const allFuture = schedule
      .filter(s => {
        const start = parseISO(`${s.date}T${s.startTime}`);
        return isAfter(start, now);
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });

    if (allFuture.length > 0) {
      const nextDate = allFuture[0].date;
      const nextTime = allFuture[0].startTime;
      const simultaneous = allFuture.filter(s => s.date === nextDate && s.startTime === nextTime);
      
      const isToday = nextDate === todayStr;
      
      return simultaneous.map(s => ({
        type: isToday ? 'upcoming' : 'future',
        title: isToday ? 'Kegiatan Berikutnya Hari Ini' : 'Kegiatan Mendatang',
        subtitle: s.category,
        details: s.name,
        time: isToday ? `${s.startTime} WIB` : `${format(parseISO(s.date), 'dd MMM yyyy')}, ${s.startTime} WIB`,
        location: s.location
      }));
    }

    // 4. Default fallback
    return [{
      type: 'default',
      title: 'Agenda Milad Hari Ini',
      subtitle: 'Informasi',
      details: 'Persiapan oleh Panitia',
      time: 'Sepanjang Hari',
      location: 'Pesantren Sukahideng'
    }];
  };

  useEffect(() => {
    const items = determineContent();
    if (items.length > 0) {
      setCurrentContent(items);
      if (!hasShown) {
        setTimeout(() => setIsOpen(true), 2000);
        setHasShown(true);
      }
    }
  }, [schedule, matches, registrations]);

  // Polling every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const newItems = determineContent();
      if (newItems.length > 0 && JSON.stringify(newItems) !== JSON.stringify(currentContent)) {
        setCurrentContent(newItems);
        setIsOpen(true);
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentContent]);

  if (currentContent.length === 0) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-brand-dark/40 backdrop-blur-sm"
          >
            <div className="relative w-full max-w-lg bg-brand-cream rounded-[40px] shadow-2xl overflow-hidden border-4 border-brand-gold max-h-[90vh] flex flex-col">
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 p-2 text-brand-dark/20 hover:text-brand-dark hover:bg-brand-dark/5 rounded-full transition-all z-20"
              >
                <X size={24} />
              </button>
              
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-brand-gold rounded-2xl flex items-center justify-center text-brand-dark animate-pulse shrink-0">
                    <Bell size={28} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-brand-gold uppercase tracking-[0.2em]">Agenda Terbaru</h3>
                    <p className="font-serif italic text-brand-dark/60">{currentContent.length} Agenda Ditemukan</p>
                  </div>
                </div>

                <div className="space-y-12">
                  {currentContent.map((item, idx) => (
                    <div key={idx} className={idx !== currentContent.length - 1 ? 'border-b border-brand-dark/5 pb-8' : ''}>
                      <div className="mb-4">
                        <span className="text-[10px] font-bold bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-full uppercase tracking-widest">{item.title}</span>
                        <p className="font-serif italic text-brand-dark/40 text-sm mt-1">{item.subtitle}</p>
                      </div>
                      
                      <h4 className="text-2xl md:text-3xl font-serif font-bold text-brand-dark mb-6 leading-tight">
                        {item.details}
                      </h4>
                      
                      {item.isPromo ? (
                        <div className="space-y-4 mt-8">
                          <a 
                            href="#daftar-individu" 
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between w-full bg-brand-gold text-brand-dark px-6 py-4 rounded-2xl font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform text-xs shadow-lg shadow-brand-gold/20"
                          >
                            <span>Gowes & Napak Tilas</span>
                            <ChevronRight size={16} />
                          </a>
                          <a 
                            href="#daftar-individu" 
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between w-full bg-brand-gold text-brand-dark px-6 py-4 rounded-2xl font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform text-xs shadow-lg shadow-brand-gold/20"
                          >
                            <span>Karaoke Religi</span>
                            <ChevronRight size={16} />
                          </a>
                          <a 
                            href="#porsas" 
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between w-full border-2 border-brand-gold text-brand-gold px-6 py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-brand-gold/10 transition-all text-xs"
                          >
                            <span>Daftar Tim PORSAS</span>
                            <ChevronRight size={16} />
                          </a>
                        </div>
                      ) : item.isMerch ? (
                        <div className="mt-8">
                          <a 
                            href="#merchandise" 
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-center gap-3 w-full bg-brand-dark text-brand-gold py-5 rounded-2xl font-bold uppercase tracking-[0.2em] hover:scale-[1.02] transition-all text-xs shadow-xl shadow-brand-dark/20"
                          >
                            <ShoppingBag size={18} />
                            <span>Beli Merchandise</span>
                          </a>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-brand-dark/70 font-medium">
                            <Clock size={18} className="text-brand-gold shrink-0" />
                            <span className="text-sm">{item.time}</span>
                          </div>
                          <div className="flex items-center gap-3 text-brand-dark/70 font-medium">
                            <MapPin size={18} className="text-brand-gold shrink-0" />
                            <span className="text-sm">{item.location}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-10 pt-0">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-brand-dark text-brand-gold py-5 rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-brand-forest transition-all flex items-center justify-center gap-3"
                >
                  Tutup Notifikasi <ChevronRight size={18} />
                </button>
              </div>

              {/* Decorative Corner */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-gold/10 rounded-full blur-3xl -z-10" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Small notification in corner if updated and closed */}
      {!isOpen && hasShown && currentContent.length > 0 && (
        <motion.button 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-10 right-10 z-[55] w-14 h-14 bg-brand-gold text-brand-dark rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform hidden md:flex"
        >
          <Bell size={24} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-brand-cream animate-bounce" />
        </motion.button>
      )}
    </>
  );
}
