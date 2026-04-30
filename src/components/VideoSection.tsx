import React from 'react';
import { motion } from 'motion/react';
import { Play, Film } from 'lucide-react';

export default function VideoSection() {
  const videos = [
    {
      id: 'zq22rZ3BX08',
      title: 'Official Teaser Milad 104',
      description: 'Meneguhkan Khidmah, Menginspirasi Umat'
    },
    {
      id: 'nED10ASvD0Q',
      title: 'Kilasan Sejarah Ponpes Sukahideng',
      description: 'Perjalanan 104 tahun mencetak generasi unggul'
    }
  ];

  return (
    <section id="video-content" className="py-24 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 text-brand-gold mb-6">
            <Film size={16} />
            <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Multimedia</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-800 mb-6 leading-tight">
            Lensa Inspirasi <span className="text-brand-gold">Milad 104</span>
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Saksikan tayangan eksklusif seputar rangkaian Milad ke-104 dan sejarah panjang perjuangan Pondok Pesantren Sukahideng.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="relative aspect-video rounded-[32px] overflow-hidden bg-brand-dark shadow-2xl shadow-brand-dark/10 ring-1 ring-slate-200">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${video.id}`}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="mt-8 px-4">
                <h3 className="font-serif font-bold text-xl text-slate-800 mb-2 flex items-center gap-3">
                  <span className="w-8 h-[2px] bg-brand-gold rounded-full hidden sm:block"></span>
                  {video.title}
                </h3>
                <p className="text-slate-400 text-sm italic font-medium">{video.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none hidden lg:block">
        <span className="text-[200px] font-serif font-bold -rotate-90 block">MULTIMEDIA</span>
      </div>
    </section>
  );
}
