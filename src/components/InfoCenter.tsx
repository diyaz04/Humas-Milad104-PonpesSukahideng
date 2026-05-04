import React from 'react';
import { motion } from 'motion/react';
import { FileText, Download, Info } from 'lucide-react';
import { DocumentResource } from '../types';

interface InfoCenterProps {
  documents: DocumentResource[];
}

export default function InfoCenter({ documents }: InfoCenterProps) {
  if (documents.length === 0) return null;

  return (
    <div id="pusat-informasi" className="py-24 relative overflow-hidden bg-slate-50/50">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 border-8 border-brand-gold rounded-full" />
        <div className="absolute bottom-20 right-10 w-96 h-96 border-8 border-brand-forest rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-gold/10 text-brand-gold rounded-full text-[10px] font-bold uppercase tracking-[0.3em] mb-6">
            <Info size={14} /> Pusat Informasi & Dokumen
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark mb-6">Unduh <span className="text-brand-gold">Dokumen Penting</span></h2>
          <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Dapatkan informasi lengkap mengenai petunjuk teknis perlombaan, proposal kegiatan, dan materi publikasi resmi Milad ke-104 Pesantren Sukahideng.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {documents.map((doc, index) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-brand-gold/20 hover:-translate-y-2 transition-all duration-500 flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-2xl flex items-center justify-center group-hover:bg-brand-gold group-hover:text-brand-dark transition-colors duration-500">
                  <FileText size={32} />
                </div>
                <span className="px-4 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest rounded-full border border-slate-100 shadow-sm">
                  {doc.category || 'Dokumen'}
                </span>
              </div>

              <h3 className="text-2xl font-serif font-bold text-brand-dark mb-8 group-hover:text-brand-gold transition-colors leading-tight">
                {doc.title}
              </h3>
              
              <div className="mt-auto">
                <a 
                  href={doc.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-brand-dark text-brand-gold rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-brand-gold hover:text-brand-dark transition-all shadow-lg shadow-brand-dark/10 group/btn"
                >
                  <Download size={18} className="group-hover/btn:translate-y-0.5 transition-transform" /> 
                  Unduh Dokumen
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
