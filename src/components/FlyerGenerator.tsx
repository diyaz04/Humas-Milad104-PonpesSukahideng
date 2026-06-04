import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { News } from '../types';
import { X, Download, RefreshCw, Palette, Type, HelpCircle, FileImage, Sparkles, Check, Image as ImageIcon } from 'lucide-react';

interface FlyerGeneratorProps {
  newsItem: News | null;
  onClose: () => void;
}

type FlyerTheme = 'cosmic-dark' | 'emerald-gold' | 'royal-navy' | 'editorial-light';

export default function FlyerGenerator({ newsItem, onClose }: FlyerGeneratorProps) {
  const [activeTheme, setActiveTheme] = useState<FlyerTheme>('cosmic-dark');
  const [customSubtitle, setCustomSubtitle] = useState('KABAR PESANTREN');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showWatermark, setShowWatermark] = useState(true);
  const [bgBlurEffect, setBgBlurEffect] = useState(true);
  const flyerRef = useRef<HTMLDivElement>(null);
  const printFlyerRef = useRef<HTMLDivElement>(null);
  const [logoBase64, setLogoBase64] = useState<string>('');

  useEffect(() => {
    let active = true;
    const convertLogoToBase64 = async () => {
      try {
        // Use Cloudflare-backed weserv image proxy to bypass CORS
        const targetUrl = 'https://images.weserv.nl/?url=lh3.googleusercontent.com/d/10ePHDITHyany16gFdE6axqBjSwr2UROr';
        const res = await fetch(targetUrl);
        if (!res.ok) throw new Error('CORS proxy responded with non-200 status');
        const blob = await res.blob();
        
        const reader = new FileReader();
        reader.onloadend = () => {
          if (active && typeof reader.result === 'string') {
            setLogoBase64(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.warn('Could not preemptively proxy logo, using direct source fallback', err);
        if (active) {
          // fallback
          setLogoBase64('https://lh3.googleusercontent.com/d/10ePHDITHyany16gFdE6axqBjSwr2UROr');
        }
      }
    };
    convertLogoToBase64();
    return () => {
      active = false;
    };
  }, []);

  if (!newsItem) return null;

  // Construct absolute URL back to app news section
  const newsLink = `${window.location.origin}/?news=${newsItem.id}`;

  // Helper to extract a clean text summary
  const getCleanExcerpt = (htmlOrMd: string) => {
    const cleanText = htmlOrMd
      .replace(/<[^>]*>/g, '') // strip HTML
      .replace(/[*#`_\\\-]/g, '') // strip md markers
      .substring(0, 160)
      .trim();
    return cleanText.length > 155 ? `${cleanText}...` : cleanText;
  };

  const cleanExcerpt = getCleanExcerpt(newsItem.content);

  // Download flyer as high-resolution PNG
  const downloadFlyer = async () => {
    if (!printFlyerRef.current) return;
    setIsGenerating(true);

    try {
      // Small delays in React to ensure SVG and images are paint-ready
      await new Promise((resolve) => setTimeout(resolve, 800));

      const canvas = await html2canvas(printFlyerRef.current, {
        useCORS: true,
        allowTaint: false,
        scale: 2.5, // Enhances quality beautifully for printed flyers/Instagram (2000x2500 px)
        backgroundColor: style.bgColor,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `Flyer_${newsItem.title.replace(/\s+/g, '_').substring(0, 20)}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      console.error("Flyer creation failed:", err);
      alert("Gagal mengonversi flyer ke gambar. Silakan coba lagi. Pastikan semua gambar dimuat dengan benar.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Preset themes styling mappings
  const themeStyles = {
    'cosmic-dark': {
      bgColor: '#030712', // Slate 950
      textColor: '#ffffff',
      themeGold: '#bca061', // Brand gold hex
      borderColor: 'rgba(255, 255, 255, 0.1)',
      
      // glowing spheres gradient colors
      gradientStart: 'rgba(188, 160, 97, 0.1)',
      gradientMiddle: 'rgba(217, 119, 6, 0.05)',
      
      // header info
      subTextColor: '#94a3b8', // Slate 400
      tagBgColor: 'rgba(188, 160, 97, 0.1)',
      tagBorderColor: 'rgba(188, 160, 97, 0.3)',
      tagTextColor: '#bca061',
      
      // news body
      imageBorderColor: 'rgba(188, 160, 97, 0.3)',
      titleColor: '#bca061',
      bodyColor: '#cbd5e1', // Slate 300
      dividerStyle: { background: 'linear-gradient(to right, rgba(188, 160, 97, 0.5), rgba(188, 160, 97, 0.1), transparent)', border: 'none' },
      
      // qr
      qrBorderColor: 'rgba(188, 160, 97, 0.5)',
      footerLabelColor: '#bca061',
    },
    'emerald-gold': {
      bgColor: '#061d15', // deep rich forest green
      textColor: '#f0fdf4', // emerald-50
      themeGold: '#eab308', // amber-500
      borderColor: 'rgba(255, 255, 255, 0.1)',
      
      gradientStart: 'rgba(234, 179, 8, 0.1)',
      gradientMiddle: 'rgba(6, 78, 59, 0.05)',
      
      subTextColor: '#a7f3d0', // emerald-200
      tagBgColor: 'rgba(234, 179, 8, 0.15)',
      tagBorderColor: 'rgba(234, 179, 8, 0.3)',
      tagTextColor: '#facc15', // amber-400
      
      imageBorderColor: 'rgba(234, 179, 8, 0.3)',
      titleColor: '#facc15',
      bodyColor: '#ecfdf5', // emerald-100
      dividerStyle: { background: 'linear-gradient(to right, rgba(234, 179, 8, 0.5), rgba(234, 179, 8, 0.1), transparent)', border: 'none' },
      
      qrBorderColor: 'rgba(234, 179, 8, 0.5)',
      footerLabelColor: '#facc15',
    },
    'royal-navy': {
      bgColor: '#0b1329', // deep space navy blue
      textColor: '#f1f5f9', // slate-100
      themeGold: '#22d3ee', // cyan-400
      borderColor: 'rgba(255, 255, 255, 0.1)',
      
      gradientStart: 'rgba(34, 211, 238, 0.1)',
      gradientMiddle: 'rgba(30, 58, 138, 0.05)',
      
      subTextColor: '#94a3b8', // slate-400
      tagBgColor: 'rgba(34, 211, 238, 0.1)',
      tagBorderColor: 'rgba(34, 211, 238, 0.3)',
      tagTextColor: '#22d3ee',
      
      imageBorderColor: 'rgba(34, 211, 238, 0.3)',
      titleColor: '#ffffff',
      bodyColor: '#e2e8f0', // slate-200
      dividerStyle: { background: 'linear-gradient(to right, rgba(34, 211, 238, 0.5), rgba(34, 211, 238, 0.1), transparent)', border: 'none' },
      
      qrBorderColor: 'rgba(34, 211, 238, 0.5)',
      footerLabelColor: '#22d3ee',
    },
    'editorial-light': {
      bgColor: '#faf8f5', // off-white editorial paper
      textColor: '#0f172a', // slate-900
      themeGold: '#1e293b', // slate-800
      borderColor: 'rgba(15, 23, 42, 0.1)',
      
      gradientStart: 'rgba(231, 229, 228, 0.5)', // stone-200
      gradientMiddle: 'rgba(241, 245, 249, 0.5)', // slate-100
      
      subTextColor: '#64748b', // slate-500
      tagBgColor: '#f1f5f9', // slate-100
      tagBorderColor: '#cbd5e1', // slate-200
      tagTextColor: '#1e293b',
      
      imageBorderColor: '#cbd5e1',
      titleColor: '#0f172a',
      bodyColor: '#334155', // slate-700
      dividerStyle: { background: '#cbd5e1', border: 'none' },
      
      qrBorderColor: '#94a3b8',
      footerLabelColor: '#0f172a',
    }
  };

  const style = themeStyles[activeTheme];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Dimmed Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-brand-dark/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Main Designer Box */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-6xl h-[90vh] bg-white rounded-[32px] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-100"
      >
        
        {/* LEFT: Designer Control Suite */}
        <div className="w-full md:w-[400px] border-r border-slate-100 bg-slate-50 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 justify-between select-none">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] bg-brand-gold/10 border border-brand-gold/20 text-brand-gold px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  Flyer Engine v1.0
                </span>
                <h3 className="text-2xl font-serif font-bold text-brand-dark mt-2">Flyer Studio 4:5</h3>
              </div>
              <button 
                onClick={onClose}
                className="md:hidden p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Buat selebaran visual modern dalam aspek rasio 4:5 secara otomatis. Siap publish/share ke Instagram feed, WhatsApp Story, atau Telegram.
            </p>

            {/* Custom Subtitle Input */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 ml-1 flex items-center gap-1.5">
                <Type size={12} /> Label Kategori Flyer
              </label>
              <input 
                type="text" 
                maxLength={25}
                placeholder="Contoh: KABAR PESANTREN"
                value={customSubtitle}
                onChange={e => setCustomSubtitle(e.target.value)}
                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-brand-gold transition-all font-medium text-slate-800"
              />
            </div>

            {/* Theme Selector Grid */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-3 ml-1 flex items-center gap-1.5">
                <Palette size={12} /> Pilih Skema Warna
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setActiveTheme('cosmic-dark')}
                  className={`border-2 p-3.5 rounded-2xl flex items-center gap-2 transition-all ${
                    activeTheme === 'cosmic-dark' 
                      ? 'border-brand-gold bg-brand-dark text-brand-gold shadow-md shadow-brand-dark/10' 
                      : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="w-4 h-4 bg-slate-950 border border-brand-gold/40 rounded-full flex-shrink-0" />
                  <span className="text-xs font-bold truncate">Cosmic Dark</span>
                </button>
                <button 
                  onClick={() => setActiveTheme('emerald-gold')}
                  className={`border-2 p-3.5 rounded-2xl flex items-center gap-2 transition-all ${
                    activeTheme === 'emerald-gold' 
                      ? 'border-amber-400 bg-[#112a20] text-amber-400 shadow-md shadow-[#112a20]/10' 
                      : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="w-4 h-4 bg-[#112a20] border border-amber-400 rounded-full flex-shrink-0" />
                  <span className="text-xs font-bold truncate">Emerald Gold</span>
                </button>
                <button 
                  onClick={() => setActiveTheme('royal-navy')}
                  className={`border-2 p-3.5 rounded-2xl flex items-center gap-2 transition-all ${
                    activeTheme === 'royal-navy' 
                      ? 'border-cyan-400 bg-[#0f1d36] text-cyan-400 shadow-md shadow-[#0f1d36]/10' 
                      : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="w-4 h-4 bg-[#0f1d36] border border-cyan-400 rounded-full flex-shrink-0" />
                  <span className="text-xs font-bold truncate">Royal Navy</span>
                </button>
                <button 
                  onClick={() => setActiveTheme('editorial-light')}
                  className={`border-2 p-3.5 rounded-2xl flex items-center gap-2 transition-all ${
                    activeTheme === 'editorial-light' 
                      ? 'border-slate-600 bg-[#faf8f5] text-slate-900 shadow-md shadow-slate-100' 
                      : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="w-4 h-4 bg-[#faf8f5] border border-slate-300 rounded-full flex-shrink-0" />
                  <span className="text-xs font-bold truncate">Classic Light</span>
                </button>
              </div>
            </div>

            {/* Additional Visual Toggles */}
            <div className="space-y-3.5 bg-white p-4 rounded-2xl border border-slate-100">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Efek Latar & Grafis</h4>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={bgBlurEffect}
                  onChange={(e) => setBgBlurEffect(e.target.checked)}
                  className="rounded border-slate-300 text-brand-gold focus:ring-brand-gold w-4 h-4"
                />
                <span className="text-xs text-slate-600 font-medium">Aktifkan efek image blur background</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="rounded border-slate-300 text-brand-gold focus:ring-brand-gold w-4 h-4"
                />
                <span className="text-xs text-slate-600 font-medium">Tampilkan watermark logo website</span>
              </label>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="space-y-3 pt-6 border-t border-slate-200/60">
            <button 
              onClick={downloadFlyer}
              disabled={isGenerating}
              className="w-full bg-brand-dark text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-all py-4 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-dark/15 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  <span>Sedang Generate...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download Flyer PNG</span>
                </>
              )}
            </button>
            <button 
              onClick={onClose}
              disabled={isGenerating}
              className="w-full py-3 text-slate-500 hover:text-slate-800 text-xs font-bold uppercase tracking-widest transition-all"
            >
              Batal & Kembali
            </button>
          </div>
        </div>

        {/* RIGHT: Live 4:5 Flyer Render/Canvas */}
        <div className="flex-1 bg-slate-900/10 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
          
          {/* Web View Scaling container */}
          <div className="relative shadow-2xl rounded-3xl overflow-hidden scale-[0.45] md:scale-[0.55] lg:scale-[0.65] origin-center shadow-black/50 select-none flex-shrink-0" style={{ width: '800px', height: '1000px' }}>
            
            {/* The Actual 4:5 flyer template (Render Target for html2canvas) */}
            <div 
              ref={flyerRef}
              id="flyer-canvas-container"
              className="relative w-[800px] h-[1000px] overflow-hidden flex flex-col justify-between p-12 select-none"
              style={{ 
                fontFamily: 'Georgia, cambria, serif',
                backgroundColor: style.bgColor,
                color: style.textColor
              }}
            >
              {/* Complex Glowing Spheres Background inside template */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div 
                  className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full blur-[140px]" 
                  style={{ background: `radial-gradient(circle, ${style.gradientStart} 0%, rgba(0,0,0,0) 70%)` }} 
                />
                <div 
                  className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[120px]" 
                  style={{ background: `radial-gradient(circle, ${style.gradientMiddle} 0%, rgba(0,0,0,0) 70%)` }} 
                />
                
                {/* Modern Image Blur Backdrop */}
                {bgBlurEffect && newsItem.imageUrl && (
                  <div className="absolute inset-0 opacity-[0.14] blur-[30px] overflow-hidden scale-110 pointer-events-none">
                    <img 
                      src={newsItem.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              {/* FLYER HEADER */}
              <div 
                className="relative z-10 flex justify-between items-center pb-6 pointer-events-none"
                style={{ borderBottom: `1px solid ${style.borderColor}` }}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="p-1.5 rounded-2xl"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                      borderColor: 'rgba(255, 255, 255, 0.2)', 
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.25)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)'
                    }}
                  >
                    <img 
                      src={logoBase64 || "https://lh3.googleusercontent.com/d/10ePHDITHyany16gFdE6axqBjSwr2UROr"} 
                      alt="Sukahideng Logo" 
                      className="h-12 w-auto object-contain select-none"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h4 className="text-lg font-sans font-bold tracking-widest uppercase select-none" style={{ color: '#d8b049' }}>
                      SUKAHIDENG
                    </h4>
                    <p 
                      className="text-[10px] uppercase font-sans font-semibold tracking-widest select-none"
                      style={{ color: style.subTextColor }}
                    >
                      104th Anniversary • PORSAS
                    </p>
                  </div>
                </div>

                <div 
                  className="px-4 py-1.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-[0.2em] select-none"
                  style={{ 
                    backgroundColor: style.tagBgColor, 
                    border: `1px solid ${style.tagBorderColor}`, 
                    color: style.tagTextColor 
                  }}
                >
                  {customSubtitle}
                </div>
              </div>

              {/* FLYER CENTER IMAGE & NEWS HEADLINE */}
              <div className="relative z-10 flex-grow flex flex-col justify-center my-6 gap-6">
                
                {/* 3D-effect framed container for the direct news image */}
                <div 
                  className="relative h-[380px] w-full rounded-[40px] overflow-hidden"
                  style={{ 
                    border: `2px solid ${style.imageBorderColor}`,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  {newsItem.imageUrl ? (
                    <img 
                      src={newsItem.imageUrl} 
                      alt={newsItem.title} 
                      className="w-full h-full object-cover select-none"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ backgroundColor: '#1e293b', color: '#64748b' }}>
                      <ImageIcon size={48} />
                      <span className="text-xs font-sans">Belum ada foto utama</span>
                    </div>
                  )}
                  {/* Subtle lower gradient overlay on the image */}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 100%)' }} />
                </div>

                {/* News Title and Excerpt */}
                <div className="space-y-4">
                  <h1 className="text-4xl leading-[1.2] tracking-tight font-serif" style={{ color: style.titleColor }}>
                    {newsItem.title}
                  </h1>
                  
                  <hr style={style.dividerStyle} className="h-0.5 w-full divider-line border-none" />

                  <p className="text-base font-sans leading-relaxed tracking-wide" style={{ color: style.bodyColor }}>
                    {cleanExcerpt}
                  </p>
                </div>
              </div>

              {/* FLYER FOOTER: QR + Metadata Details */}
              <div 
                className="relative z-10 grid grid-cols-12 gap-6 items-end pt-6"
                style={{ borderTop: `1px solid ${style.borderColor}` }}
              >
                
                {/* Left metadata column */}
                <div className="col-span-8 flex flex-col gap-3 font-sans">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: style.subTextColor }}>
                      Tanggal Rilis Liputan
                    </p>
                    <p className="text-sm font-bold" style={{ color: style.textColor }}>
                      {new Date(newsItem.date).toLocaleDateString('id-ID', {
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: style.subTextColor }}>
                      Kunjungi Hub Kami
                    </p>
                    <p className="text-base font-black tracking-wider uppercase" style={{ color: style.footerLabelColor }}>
                      milad104.sukahideng.com
                    </p>
                  </div>

                  <p className="text-xs leading-relaxed font-light mt-1" style={{ color: style.subTextColor }}>
                    Hubungkan ponsel Anda ke QR kode di samping untuk membuka berita secara lengkap dan akurat di platform online kami.
                  </p>
                </div>

                {/* Right QR column */}
                <div className="col-span-4 flex flex-col items-center gap-2">
                  <div 
                    style={{ 
                      borderColor: style.qrBorderColor, 
                      borderStyle: 'solid', 
                      borderWidth: '1px', 
                      backgroundColor: '#ffffff', 
                      padding: '12px', 
                      borderRadius: '16px' 
                    }}
                  >
                    <QRCodeSVG 
                      value={newsLink} 
                      size={105}
                      level="H"
                      imageSettings={showWatermark ? {
                        src: logoBase64 || "https://lh3.googleusercontent.com/d/10ePHDITHyany16gFdE6axqBjSwr2UROr",
                        x: undefined,
                        y: undefined,
                        height: 24,
                        width: 24,
                        excavate: true,
                      } : undefined}
                    />
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-sans font-bold pointer-events-none mt-1" style={{ color: style.subTextColor }}>
                    SCAN UNTUK BACA
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Absolute floating helper overlay */}
          <div className="absolute top-4 right-4 bg-black/75 px-3 py-1.5 rounded-full text-white text-[10px]/none font-sans font-medium pointer-events-none">
            Resolusi Rilis: 2000 x 2500 px (4:5)
          </div>
        </div>

      </motion.div>

      {/* PERFECT RAW REPLICA FOR CAPTURING (Completely isolated from parent viewport translation/scaling) */}
      <div 
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: '-9999px', 
          width: '800px', 
          height: '1000px', 
          overflow: 'hidden' 
        }}
      >
        <div 
          ref={printFlyerRef}
          className="relative w-[800px] h-[1000px] flex flex-col justify-between p-12 select-none"
          style={{ 
            fontFamily: 'Georgia, cambria, serif',
            backgroundColor: style.bgColor,
            color: style.textColor
          }}
        >
          {/* Complex Glowing Spheres Background inside template */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full blur-[140px]" 
              style={{ background: `radial-gradient(circle, ${style.gradientStart} 0%, rgba(0,0,0,0) 70%)` }} 
            />
            <div 
              className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[120px]" 
              style={{ background: `radial-gradient(circle, ${style.gradientMiddle} 0%, rgba(0,0,0,0) 70%)` }} 
            />
            
            {/* Modern Image Blur Backdrop */}
            {bgBlurEffect && newsItem.imageUrl && (
              <div className="absolute inset-0 opacity-[0.14] blur-[30px] overflow-hidden scale-110 pointer-events-none">
                <img 
                  src={newsItem.imageUrl} 
                  alt="" 
                  className="w-full h-full object-cover" 
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>

          {/* FLYER HEADER */}
          <div 
            className="relative z-10 flex justify-between items-center pb-6 pointer-events-none"
            style={{ borderBottom: `1px solid ${style.borderColor}` }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="p-1.5 rounded-2xl"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                  borderColor: 'rgba(255, 255, 255, 0.2)', 
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.25)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)'
                }}
              >
                <img 
                  src={logoBase64 || "https://lh3.googleusercontent.com/d/10ePHDITHyany16gFdE6axqBjSwr2UROr"} 
                  alt="Sukahideng Logo" 
                  className="h-12 w-auto object-contain select-none"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h4 className="text-lg font-sans font-bold tracking-widest uppercase select-none" style={{ color: '#d8b049' }}>
                  SUKAHIDENG
                </h4>
                <p 
                  className="text-[10px] uppercase font-sans font-semibold tracking-widest select-none"
                  style={{ color: style.subTextColor }}
                >
                  104th Anniversary • PORSAS
                </p>
              </div>
            </div>

            <div 
              className="px-4 py-1.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-[0.2em] select-none"
              style={{ 
                backgroundColor: style.tagBgColor, 
                border: `1px solid ${style.tagBorderColor}`, 
                color: style.tagTextColor 
              }}
            >
              {customSubtitle}
            </div>
          </div>

          {/* FLYER CENTER IMAGE & NEWS HEADLINE */}
          <div className="relative z-10 flex-grow flex flex-col justify-center my-6 gap-6">
            
            {/* 3D-effect framed container for the direct news image */}
            <div 
              className="relative h-[380px] w-full rounded-[40px] overflow-hidden"
              style={{ 
                border: `2px solid ${style.imageBorderColor}`,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
              }}
            >
              {newsItem.imageUrl ? (
                <img 
                  src={newsItem.imageUrl} 
                  alt={newsItem.title} 
                  className="w-full h-full object-cover select-none"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ backgroundColor: '#1e293b', color: '#64748b' }}>
                  <ImageIcon size={48} />
                  <span className="text-xs font-sans">Belum ada foto utama</span>
                </div>
              )}
              {/* Subtle lower gradient overlay on the image */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 100%)' }} />
            </div>

            {/* News Title and Excerpt */}
            <div className="space-y-4">
              <h1 className="text-4xl leading-[1.2] tracking-tight font-serif" style={{ color: style.titleColor }}>
                {newsItem.title}
              </h1>
              
              <hr style={style.dividerStyle} className="h-0.5 w-full divider-line border-none" />

              <p className="text-base font-sans leading-relaxed tracking-wide" style={{ color: style.bodyColor }}>
                {cleanExcerpt}
              </p>
            </div>
          </div>

          {/* FLYER FOOTER: QR + Metadata Details */}
          <div 
            className="relative z-10 grid grid-cols-12 gap-6 items-end pt-6"
            style={{ borderTop: `1px solid ${style.borderColor}` }}
          >
            
            {/* Left metadata column */}
            <div className="col-span-8 flex flex-col gap-3 font-sans">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: style.subTextColor }}>
                  Tanggal Rilis Liputan
                </p>
                <p className="text-sm font-bold" style={{ color: style.textColor }}>
                  {new Date(newsItem.date).toLocaleDateString('id-ID', {
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                  })}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: style.subTextColor }}>
                  Kunjungi Hub Kami
                </p>
                <p className="text-base font-black tracking-wider uppercase" style={{ color: style.footerLabelColor }}>
                  milad104.sukahideng.com
                </p>
              </div>

              <p className="text-xs leading-relaxed font-light mt-1" style={{ color: style.subTextColor }}>
                Hubungkan ponsel Anda ke QR kode di samping untuk membuka berita secara lengkap dan akurat di platform online kami.
              </p>
            </div>

            {/* Right QR column */}
            <div className="col-span-4 flex flex-col items-center gap-2">
              <div 
                style={{ 
                  borderColor: style.qrBorderColor, 
                  borderStyle: 'solid', 
                  borderWidth: '1px', 
                  backgroundColor: '#ffffff', 
                  padding: '12px', 
                  borderRadius: '16px' 
                }}
              >
                <QRCodeSVG 
                  value={newsLink} 
                  size={105}
                  level="H"
                  imageSettings={showWatermark ? {
                    src: logoBase64 || "https://lh3.googleusercontent.com/d/10ePHDITHyany16gFdE6axqBjSwr2UROr",
                    x: undefined,
                    y: undefined,
                    height: 24,
                    width: 24,
                    excavate: true,
                  } : undefined}
                />
              </div>
              <span className="text-[9px] uppercase tracking-widest font-sans font-bold pointer-events-none mt-1" style={{ color: style.subTextColor }}>
                SCAN UNTUK BACA
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
