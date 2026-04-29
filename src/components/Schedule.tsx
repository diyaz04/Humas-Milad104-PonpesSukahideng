import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import { ScheduleItem } from '../types';

interface ScheduleProps {
  schedule: ScheduleItem[];
}

export default function Schedule({ schedule }: ScheduleProps) {
  const [filter, setFilter] = useState<string | null>(null);

  const dates = useMemo(() => {
    const d = Array.from(new Set(schedule.map(s => s.date))).sort();
    return d;
  }, [schedule]);

  const filteredSchedule = useMemo(() => {
    if (!filter) return schedule;
    return schedule.filter(s => s.date === filter);
  }, [schedule, filter]);

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark mb-4">Agenda & Jadwal Kegiatan</h2>
        <p className="text-brand-dark/60 uppercase tracking-widest text-sm">Milad ke-104 Pesantren Sukahideng</p>
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <button 
          onClick={() => setFilter(null)}
          className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${!filter ? 'bg-brand-dark text-brand-gold' : 'bg-transparent text-brand-dark/50 hover:text-brand-dark border border-brand-dark/10'}`}
        >
          Semua Hari
        </button>
        {dates.map(date => (
          <button 
            key={date}
            onClick={() => setFilter(date)}
            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${filter === date ? 'bg-brand-dark text-brand-gold' : 'bg-transparent text-brand-dark/50 hover:text-brand-dark border border-brand-dark/10'}`}
          >
            {format(parseISO(date), 'dd MMM yyyy')}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="max-w-4xl mx-auto relative pl-8 md:pl-0">
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-brand-gold/20 -translate-x-1/2 hidden md:block" />
        
        <AnimatePresence mode="popLayout">
          {filteredSchedule.map((item, idx) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative mb-12 md:w-1/2 ${idx % 2 === 0 ? 'md:pr-16 md:ml-0 md:text-right' : 'md:pl-16 md:ml-auto md:text-left'}`}
            >
              {/* Dot */}
              <div className="absolute left-[-1.5px] md:left-1/2 top-1 w-4 h-4 bg-brand-gold rounded-full -translate-x-1/2 z-10 border-4 border-brand-cream" />
              
              <div className="bg-white p-6 md:p-8 rounded-[30px] shadow-sm hover:shadow-xl transition-all group border border-brand-gold/5">
                <span className="inline-block px-3 py-1 bg-brand-gold/10 text-brand-gold text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
                  {item.category}
                </span>
                <h3 className="text-xl md:text-2xl font-serif font-bold text-brand-dark mb-4 group-hover:text-brand-gold transition-colors">{item.name}</h3>
                
                <div className={`flex flex-col gap-2 text-sm text-brand-dark/60 font-medium ${idx % 2 === 0 ? 'md:items-end' : 'md:items-start'}`}>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-brand-gold" />
                    <span>{item.startTime} - {item.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-brand-gold" />
                    <span>{item.location}</span>
                  </div>
                </div>

                {item.description && (
                  <p className="mt-4 text-brand-dark/50 text-sm leading-relaxed italic">
                    {item.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredSchedule.length === 0 && (
          <div className="text-center py-20 text-brand-dark/30 italic">
            Belum ada agenda yang terdaftar.
          </div>
        )}
      </div>
    </div>
  );
}
