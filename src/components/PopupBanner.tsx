import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Clock, MapPin, ChevronRight } from 'lucide-react';
import { format, parseISO, isAfter, isBefore, addMinutes, isSameDay } from 'date-fns';
import { ScheduleItem, Match, Registration } from '../types';

interface PopupBannerProps {
  schedule: ScheduleItem[];
  matches: Match[];
  registrations: Registration[];
}

export default function PopupBanner({ schedule, matches, registrations }: PopupBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentContent, setCurrentContent] = useState<any>(null);
  const [hasShown, setHasShown] = useState(false);

  const getTeamName = (id: string | null) => {
    if (!id) return "TBD";
    const reg = registrations.find(r => r.id === id);
    return reg ? reg.teamName : id;
  };

  const determineContent = () => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    
    // 1. Check current matches
    const ongoingMatch = matches.find(m => m.status === 'ongoing');
    if (ongoingMatch) {
      return {
        type: 'match',
        title: 'Pertandingan Sedang Berlangsung!',
        subtitle: `${ongoingMatch.sportId}`,
        details: `${getTeamName(ongoingMatch.teamAId)} vs ${getTeamName(ongoingMatch.teamBId)}`,
        time: 'Sedang Berlangsung',
        location: 'Arena PORSAS'
      };
    }

    // 2. Check current schedule item
    const currentEvent = schedule.find(s => {
      const start = parseISO(`${s.date}T${s.startTime}`);
      const end = parseISO(`${s.date}T${s.endTime}`);
      return s.date === todayStr && isAfter(now, start) && isBefore(now, end);
    });

    if (currentEvent) {
      return {
        type: 'event',
        title: 'Kegiatan Berlangsung',
        subtitle: currentEvent.category,
        details: currentEvent.name,
        time: `${currentEvent.startTime} - ${currentEvent.endTime}`,
        location: currentEvent.location
      };
    }

    // 3. Next upcoming today
    const upcomingToday = schedule
      .filter(s => {
        const start = parseISO(`${s.date}T${s.startTime}`);
        return s.date === todayStr && isAfter(start, now);
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

    if (upcomingToday) {
      return {
        type: 'upcoming',
        title: 'Kegiatan Berikutnya Hari Ini',
        subtitle: upcomingToday.category,
        details: upcomingToday.name,
        time: upcomingToday.startTime,
        location: upcomingToday.location
      };
    }

    // 4. Closest in future
    const closestFuture = schedule
      .filter(s => isAfter(parseISO(s.date), now))
      .sort((a, b) => a.date.localeCompare(b.date))[0];

    if (closestFuture) {
      return {
        type: 'future',
        title: 'Kegiatan Mendatang',
        subtitle: closestFuture.category,
        details: closestFuture.name,
        time: format(parseISO(closestFuture.date), 'dd MMM yyyy'),
        location: closestFuture.location
      };
    }

    // 5. Default fallback for today if nothing else is scheduled
    return {
      type: 'default',
      title: 'Agenda Milad Hari Ini',
      subtitle: 'Informasi',
      details: 'Persiapan oleh Panitia',
      time: 'Sepanjang Hari',
      location: 'Pesantren Sukahideng'
    };
  };

  useEffect(() => {
    const content = determineContent();
    if (content) {
      setCurrentContent(content);
      if (!hasShown) {
        setTimeout(() => setIsOpen(true), 2000); // Wait 2s for initial landing feel
        setHasShown(true);
      }
    }
  }, [schedule, matches, registrations]);

  // Polling every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const newContent = determineContent();
      if (newContent && JSON.stringify(newContent) !== JSON.stringify(currentContent)) {
        setCurrentContent(newContent);
        setIsOpen(true);
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentContent]);

  if (!currentContent) return null;

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
            <div className="relative w-full max-w-lg bg-brand-cream rounded-[40px] shadow-2xl overflow-hidden border-4 border-brand-gold">
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 p-2 text-brand-dark/20 hover:text-brand-dark hover:bg-brand-dark/5 rounded-full transition-all"
              >
                <X size={24} />
              </button>
              
              <div className="p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-brand-gold rounded-2xl flex items-center justify-center text-brand-dark animate-pulse">
                    <Bell size={28} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-brand-gold uppercase tracking-[0.2em]">{currentContent.title}</h3>
                    <p className="font-serif italic text-brand-dark/60">{currentContent.subtitle}</p>
                  </div>
                </div>

                <div className="mb-10">
                  <h4 className="text-3xl md:text-4xl font-serif font-bold text-brand-dark mb-6 leading-tight">
                    {currentContent.details}
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-brand-dark/70 font-medium">
                      <Clock size={20} className="text-brand-gold" />
                      <span>{currentContent.time}</span>
                    </div>
                    <div className="flex items-center gap-3 text-brand-dark/70 font-medium">
                      <MapPin size={20} className="text-brand-gold" />
                      <span>{currentContent.location}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-brand-dark text-brand-gold py-5 rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-brand-forest transition-all flex items-center justify-center gap-3"
                >
                  Lihat Detail <ChevronRight size={18} />
                </button>
              </div>

              {/* Decorative Corner */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-gold/10 rounded-full blur-3xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Small notification in corner if updated and closed */}
      {!isOpen && hasShown && currentContent && (
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
