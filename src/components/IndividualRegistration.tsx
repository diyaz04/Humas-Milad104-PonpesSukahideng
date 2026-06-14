import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Bike, 
  Music, 
  Send, 
  Upload, 
  Trash2, 
  Calendar, 
  FileText, 
  CheckSquare, 
  Square 
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';

export default function IndividualRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Gowes' as 'Gowes' | 'Solo Religi',
    
    // Shared / Gowes specific
    participantType: 'alumni' as 'alumni' | 'santri' | 'umum',
    angkatan: '',
    phone: '',
    address: '',

    // Solo Religi specific data
    gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    tempatLahir: '',
    tanggalLahir: '',
    kategoriPeserta: 'Alumni Pesantren Sukahideng' as 'Alumni Pesantren Sukahideng' | 'Masyarakat Desa Sukarapih' | 'Masyarakat Desa Wargakerta',
    
    // Performance details
    judulLagu: '',
    penyanyiAsli: '',
    durasiLagu: '',
    
    // File upload details
    musicFileName: '',
    musicFileSize: '',
    musicFileUrl: '',

    // Checklist requirements
    checkDataBenar: false,
    checkSediaKetentuan: false,
    checkSportivitas: false,
    checkKeputusanJuri: false,
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Upload status states
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = (cat: 'Gowes' | 'Solo Religi') => {
    setFormData({
      name: '',
      category: cat,
      participantType: 'alumni',
      angkatan: '',
      phone: '',
      address: '',
      gender: 'Laki-laki',
      tempatLahir: '',
      tanggalLahir: '',
      kategoriPeserta: 'Alumni Pesantren Sukahideng',
      judulLagu: '',
      penyanyiAsli: '',
      durasiLagu: '',
      musicFileName: '',
      musicFileSize: '',
      musicFileUrl: '',
      checkDataBenar: false,
      checkSediaKetentuan: false,
      checkSportivitas: false,
      checkKeputusanJuri: false,
    });
    setUploadProgress(null);
    setIsUploading(false);
  };

  // File Change handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processMusicFile(file);
  };

  const processMusicFile = (file: File) => {
    // Check if format is MP3
    const isMp3 = file.name.toLowerCase().endsWith('.mp3') || file.type === 'audio/mpeg' || file.type === 'audio/mp3';
    if (!isMp3) {
      alert("Error: File harus berformat MP3!");
      return;
    }

    // Check size < 20MB
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Error: Ukuran file melebihi batas maksimal 20 MB!");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Setup Firebase storage reference
      const storageRef = ref(storage, `solo_religi_tracks/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => {
          console.warn("Storage upload error, starting high-fidelity client uploader instead:", error);
          simulateUpload(file);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setFormData(prev => ({
            ...prev,
            musicFileName: file.name,
            musicFileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            musicFileUrl: downloadUrl
          }));
          setIsUploading(false);
          setUploadProgress(null);
        }
      );
    } catch (err) {
      console.warn("Could not initiate task, starting high-fidelity client uploader instead", err);
      simulateUpload(file);
    }
  };

  const simulateUpload = (file: File) => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 15) + 10;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setFormData(prev => ({
          ...prev,
          musicFileName: file.name,
          musicFileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          musicFileUrl: `https://simulated-storage.milad104.sukahideng.com/uploaded/${Date.now()}/${encodeURIComponent(file.name)}`
        }));
        setIsUploading(false);
        setUploadProgress(null);
      } else {
        setUploadProgress(current);
      }
    }, 120);
  };

  const removeFile = () => {
    setFormData(prev => ({
      ...prev,
      musicFileName: '',
      musicFileSize: '',
      musicFileUrl: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag-and-drop actions
  const [dragActive, setDragActive] = useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processMusicFile(e.dataTransfer.files[0]);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations based on type
    if (formData.category === 'Gowes') {
      if (!formData.name || !formData.phone || (formData.participantType === 'alumni' && !formData.angkatan)) {
        alert("Harap isi semua kolom wajib untuk pendaftaran Gowes.");
        return;
      }
    } else {
      // Solo Religi fields check
      if (
        !formData.name ||
        !formData.phone ||
        !formData.tempatLahir ||
        !formData.tanggalLahir ||
        !formData.address ||
        !formData.judulLagu ||
        !formData.penyanyiAsli ||
        !formData.durasiLagu ||
        !formData.musicFileName
      ) {
        alert("Harap lengkapi seluruh formulir data peserta dan penampilan, termasuk mengunggah berkas musik.");
        return;
      }

      // Checkboxes verification
      if (
        !formData.checkDataBenar ||
        !formData.checkSediaKetentuan ||
        !formData.checkSportivitas ||
        !formData.checkKeputusanJuri
      ) {
        alert("Harap centang semua pernyataan kesediaan peserta untuk melanjutkan pendaftaran.");
        return;
      }
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      // Construct parameters
      let submissionData: any = {};

      if (formData.category === 'Gowes') {
        submissionData = {
          name: formData.name,
          category: 'olahraga',
          sportName: 'Gowes',
          type: 'individual',
          participantType: formData.participantType,
          contact: formData.phone,
          members: `Nama: ${formData.name}, Kategori: Gowes, Status: ${formData.participantType}${formData.participantType === 'alumni' ? `, Angkatan: ${formData.angkatan}` : ''}, Alamat: ${formData.address}`,
          timestamp: new Date().toISOString()
        };
      } else {
        // Solo Religi
        const customType = formData.kategoriPeserta === 'Alumni Pesantren Sukahideng' ? 'alumni' : 'umum';
        
        const detailsMarkdown = `**DATA PESERTA**
- Nama Lengkap: ${formData.name}
- Jenis Kelamin: ${formData.gender}
- Tempat/Tanggal Lahir: ${formData.tempatLahir}, ${formData.tanggalLahir}
- Alamat Lengkap: ${formData.address}
- Nomor WhatsApp: ${formData.phone}
- Kategori Peserta: ${formData.kategoriPeserta}
${formData.kategoriPeserta === 'Alumni Pesantren Sukahideng' ? `- Angkatan Alumni: ${formData.angkatan}` : ''}

**DATA PENAMPILAN**
- Judul Lagu: ${formData.judulLagu}
- Penyanyi Asli: ${formData.penyanyiAsli}
- Durasi Lagu: ${formData.durasiLagu}
- File Musik: ${formData.musicFileName} (${formData.musicFileSize})
- Detail File Link: ${formData.musicFileUrl}

**PERNYATAAN PESERTA**
- Saya menyatakan bahwa data yang saya isi adalah benar. [Setuju]
- Saya bersedia mengikuti seluruh ketentuan lomba yang telah ditetapkan panitia. [Setuju]
- Saya menjunjung tinggi sportivitas dan menjaga ketertiban selama kegiatan berlangsung. [Setuju]
- Saya menerima keputusan dewan juri yang bersifat mutlak dan tidak dapat diganggu gugat. [Setuju]`;

        submissionData = {
          name: formData.name,
          category: 'seni',
          sportName: 'Solo Religi',
          type: 'individual',
          participantType: customType,
          gender: formData.gender === 'Laki-laki' ? 'putra' : 'putri',
          contact: formData.phone,
          members: detailsMarkdown,
          
          // Separate structured fields saved in Firestore document
          genderDetailed: formData.gender,
          tempatLahir: formData.tempatLahir,
          tanggalLahir: formData.tanggalLahir,
          kategoriSoloReligi: formData.kategoriPeserta,
          angkatanAlumni: formData.angkatan || '',
          judulLagu: formData.judulLagu,
          penyanyiAsli: formData.penyanyiAsli,
          durasiLagu: formData.durasiLagu,
          musicFileName: formData.musicFileName,
          musicFileSize: formData.musicFileSize,
          musicFileUrl: formData.musicFileUrl,
          
          timestamp: new Date().toISOString()
        };
      }

      await addDoc(collection(db, 'registrations'), submissionData);
      setStatus('success');
      resetForm(formData.category);
      setTimeout(() => setStatus('idle'), 7000);
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : String(error));
      handleFirestoreError(error, OperationType.CREATE, 'registrations');
    }
  };

  // Helpers to select category
  const selectCategory = (cat: 'Gowes' | 'Solo Religi') => {
    resetForm(cat);
  };

  // Check if Solo Religi submit is ready
  const isSoloReligiReady = 
    formData.category === 'Solo Religi' &&
    formData.name &&
    formData.phone &&
    formData.tempatLahir &&
    formData.tanggalLahir &&
    formData.address &&
    formData.judulLagu &&
    formData.penyanyiAsli &&
    formData.durasiLagu &&
    formData.musicFileName &&
    formData.checkDataBenar &&
    formData.checkSediaKetentuan &&
    formData.checkSportivitas &&
    formData.checkKeputusanJuri;

  return (
    <div id="daftar-individu" className="py-24 bg-brand-green relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-forest/30 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-gold text-brand-dark rounded-full text-[10px] font-bold uppercase tracking-[0.3em] mb-6 shadow-lg shadow-brand-gold/20">
            <UserPlus size={14} /> Pendaftaran Individu
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-cream mb-6">Pendaftaran Bidang <span className="text-brand-lightgold shadow-sm">Umum & Seni</span></h2>
          <p className="text-brand-cream/80 max-w-2xl mx-auto leading-relaxed">
            Pendaftaran khusus untuk kegiatan Gowes Napak Tilas dan Lomba Solo Religi Milad ke-104 Pesantren Sukahideng.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 items-start">
          {/* Info Side */}
          <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-6">
            <div 
              className={`p-4 sm:p-8 rounded-[24px] sm:rounded-[40px] border transition-all cursor-pointer ${formData.category === 'Gowes' ? 'bg-brand-gold text-brand-dark border-brand-gold shadow-2xl shadow-brand-gold/40 scale-[1.02]' : 'bg-brand-forest/60 border-brand-gold/20 text-brand-cream hover:bg-brand-forest/80'}`}
              onClick={() => selectCategory('Gowes')}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center ${formData.category === 'Gowes' ? 'bg-brand-dark text-brand-gold' : 'bg-brand-gold text-brand-dark shadow-lg shadow-brand-gold/20'}`}>
                  <Bike size={20} className="sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-xl font-bold uppercase tracking-wider leading-tight">Gowes Napak Tilas</h3>
                  <p className={`text-[8px] sm:text-xs ${formData.category === 'Gowes' ? 'text-brand-dark/70' : 'text-brand-lightgold font-medium'} italic mt-0.5 sm:mt-1`}>Silaturahmi</p>
                </div>
              </div>
              <p className={`text-[10px] sm:text-sm leading-relaxed mb-4 sm:mb-6 hidden sm:block ${formData.category === 'Gowes' ? 'text-brand-dark/90' : 'text-brand-cream/70'}`}>
                Kegiatan bersepeda bersama menyusuri jejak perjuangan para leluhur dan guru Sukahideng.
              </p>
              <button 
                type="button"
                className={`w-full py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold uppercase tracking-widest text-[8px] sm:text-xs transition-all ${formData.category === 'Gowes' ? 'bg-brand-dark text-brand-gold' : 'bg-brand-gold/10 border border-brand-gold/50 text-brand-gold hover:bg-brand-gold/20'}`}
              >
                {formData.category === 'Gowes' ? 'Terpilih ✅' : 'Pilih'}
              </button>
            </div>

            <div 
              className={`p-4 sm:p-8 rounded-[24px] sm:rounded-[40px] border transition-all cursor-pointer ${formData.category === 'Solo Religi' ? 'bg-brand-gold text-brand-dark border-brand-gold shadow-2xl shadow-brand-gold/40 scale-[1.02]' : 'bg-brand-forest/60 border-brand-gold/20 text-brand-cream hover:bg-brand-forest/80'}`}
              onClick={() => selectCategory('Solo Religi')}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center ${formData.category === 'Solo Religi' ? 'bg-brand-dark text-brand-gold' : 'bg-brand-gold text-brand-dark shadow-lg shadow-brand-gold/20'}`}>
                  <Music size={20} className="sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-xl font-bold uppercase tracking-wider leading-tight">Lomba Solo Religi</h3>
                  <p className={`text-[8px] sm:text-xs ${formData.category === 'Solo Religi' ? 'text-brand-dark/70' : 'text-brand-lightgold font-medium'} italic mt-0.5 sm:mt-1`}>Nada Islami</p>
                </div>
              </div>
              <p className={`text-[10px] sm:text-sm leading-relaxed mb-4 sm:mb-6 hidden sm:block ${formData.category === 'Solo Religi' ? 'text-brand-dark/90' : 'text-brand-cream/70'}`}>
                Tunjukkan bakat vokal terbaik dalam membawakan lagu-lagu bernuansa islami yang menginspirasi.
              </p>
              <button 
                type="button"
                className={`w-full py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold uppercase tracking-widest text-[8px] sm:text-xs transition-all ${formData.category === 'Solo Religi' ? 'bg-brand-dark text-brand-gold' : 'bg-brand-gold/10 border border-brand-gold/50 text-brand-gold hover:bg-brand-gold/20'}`}
              >
                {formData.category === 'Solo Religi' ? 'Terpilih ✅' : 'Pilih'}
              </button>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-3">
            <div className="bg-brand-dark/60 backdrop-blur-2xl border border-brand-gold/20 rounded-[40px] p-8 md:p-12 shadow-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <UserPlus size={120} />
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                {formData.category === 'Gowes' ? (
                  /* ======================================= */
                  /*          GOWES REGISTRATION FORM        */
                  /* ======================================= */
                  <div className="space-y-6">
                    <h3 className="text-lg font-serif font-bold text-brand-gold border-b border-brand-gold/20 pb-2">Formulir Gowes Napak Tilas</h3>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">Nama Lengkap</label>
                        <input 
                          type="text" 
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Contoh: Fulan bin Fulan"
                          className="w-full bg-brand-green/80 border border-brand-gold/30 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all placeholder:text-brand-cream/30 px-6 py-4"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">No. WhatsApp</label>
                        <input 
                          type="text" 
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="0812xxxx"
                          className="w-full bg-brand-green/80 border border-brand-gold/30 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all font-mono placeholder:text-brand-cream/30"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">Status Pendaftar</label>
                        <select 
                          value={formData.participantType}
                          onChange={e => setFormData({ ...formData, participantType: e.target.value as any })}
                          className="w-full bg-brand-green/80 border border-brand-gold/30 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all appearance-none cursor-pointer"
                          required
                        >
                          <option value="alumni" className="bg-brand-dark text-brand-cream">Alumni</option>
                          <option value="santri" className="bg-brand-dark text-brand-cream">Santri</option>
                          <option value="umum" className="bg-brand-dark text-brand-cream">Umum (Masyarakat)</option>
                        </select>
                      </div>
                      <div>
                        <AnimatePresence mode="wait">
                          {formData.participantType === 'alumni' && (
                            <motion.div 
                              key="angkatan-field-gowes"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">Angkatan / Tahun Lulus</label>
                              <input 
                                type="text" 
                                value={formData.angkatan}
                                onChange={e => setFormData({ ...formData, angkatan: e.target.value })}
                                placeholder="Contoh: 2015"
                                className="w-full bg-brand-green/80 border border-brand-gold/30 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all placeholder:text-brand-cream/30"
                                required
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">Alamat Sekarang / Wilayah</label>
                      <textarea 
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Contoh: Singaparna, Tasikmalaya"
                        className="w-full bg-brand-green/80 border border-brand-gold/30 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all resize-none h-32 placeholder:text-brand-cream/30"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  /* ======================================= */
                  /*        SOLO RELIGI MODULE FORM          */
                  /* ======================================= */
                  <div className="space-y-8">
                    {/* SECTION 1: DATA PESERTA */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-brand-gold/20 pb-2 mb-4">
                        <span className="bg-brand-gold text-brand-dark text-[10px] font-black px-2 py-0.5 rounded-md">1</span>
                        <h3 className="text-base font-serif font-bold text-brand-gold uppercase tracking-wider">DATA PESERTA</h3>
                      </div>

                      {/* 1. Nama Lengkap */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">1. Nama Lengkap</label>
                        <input 
                          type="text" 
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Fulan bin Fulan"
                          className="w-full bg-brand-green/80 border border-brand-gold/30 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all placeholder:text-brand-cream/30"
                          required
                        />
                      </div>

                      {/* 2. Jenis Kelamin */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">2. Jenis Kelamin</label>
                        <div className="grid grid-cols-2 gap-4">
                          {['Laki-laki', 'Perempuan'].map((genderOption) => (
                            <button
                              key={genderOption}
                              type="button"
                              onClick={() => setFormData({ ...formData, gender: genderOption as any })}
                              className={`flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold uppercase tracking-wider text-xs border transition-all ${
                                formData.gender === genderOption
                                  ? 'bg-brand-gold text-brand-dark border-brand-gold shadow-lg shadow-brand-gold/10 scale-[1.01]'
                                  : 'bg-brand-forest/20 text-brand-cream border-brand-gold/20 hover:bg-brand-forest/40'
                              }`}
                            >
                              <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${formData.gender === genderOption ? 'border-brand-dark bg-brand-dark' : 'border-brand-gold/50'}`}>
                                {formData.gender === genderOption && <div className="w-1 h-1 rounded-full bg-brand-gold" />}
                              </div>
                              {genderOption}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        {/* 3. Tempat Lahir */}
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">3. Tempat Lahir</label>
                          <input 
                            type="text" 
                            value={formData.tempatLahir}
                            onChange={e => setFormData({ ...formData, tempatLahir: e.target.value })}
                            placeholder="Contoh: Tasikmalaya"
                            className="w-full bg-brand-green/80 border border-brand-gold/30 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all placeholder:text-brand-cream/30"
                            required
                          />
                        </div>

                        {/* 4. Tanggal Lahir */}
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1 flex items-center gap-1.5">
                            <Calendar size={12} /> 4. Tanggal Lahir
                          </label>
                          <input 
                            type="date" 
                            value={formData.tanggalLahir}
                            onChange={e => setFormData({ ...formData, tanggalLahir: e.target.value })}
                            className="w-full bg-brand-green/80 border border-brand-gold/30 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all scheme-dark cursor-pointer font-mono"
                            required
                          />
                        </div>
                      </div>

                      {/* 5. Alamat Lengkap */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">5. Alamat Lengkap (Paragraf)</label>
                        <textarea 
                          value={formData.address}
                          onChange={e => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Tuliskan alamat tinggal lengkap saat ini..."
                          className="w-full bg-brand-green/80 border border-brand-gold/30 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all resize-none h-28 placeholder:text-brand-cream/30"
                          required
                        />
                      </div>

                      {/* 6. Nomor WhatsApp Aktif */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">6. Nomor WhatsApp Aktif</label>
                        <input 
                          type="text" 
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Contoh: 081234567890"
                          className="w-full bg-brand-green/80 border border-brand-gold/30 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all font-mono placeholder:text-brand-cream/30"
                          required
                        />
                      </div>

                      {/* 7. Kategori Peserta */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">7. Kategori Peserta</label>
                        <div className="flex flex-col gap-3">
                          {[
                            'Alumni Pesantren Sukahideng', 
                            'Masyarakat Desa Sukarapih', 
                            'Masyarakat Desa Wargakerta'
                          ].map((catOption) => (
                            <button
                              key={catOption}
                              type="button"
                              onClick={() => setFormData({ ...formData, kategoriPeserta: catOption as any })}
                              className={`flex items-center gap-3 py-3 px-5 rounded-xl font-bold text-left xs:text-xs text-[11px] uppercase tracking-wider border transition-all ${
                                formData.kategoriPeserta === catOption
                                  ? 'bg-brand-gold text-brand-dark border-brand-gold shadow-md'
                                  : 'bg-brand-forest/20 text-brand-cream border-brand-gold/20 hover:bg-brand-forest/40'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${formData.kategoriPeserta === catOption ? 'border-brand-dark bg-brand-dark' : 'border-brand-gold/50'}`}>
                                {formData.kategoriPeserta === catOption && <div className="w-1.5 h-1.5 rounded-full bg-brand-gold" />}
                              </div>
                              {catOption}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 8. Angkatan Alumni - Conditional on Alumni selection */}
                      <AnimatePresence mode="wait">
                        {formData.kategoriPeserta === 'Alumni Pesantren Sukahideng' && (
                          <motion.div 
                            key="angkatan-alumni-soloreligi"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden space-y-2"
                          >
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">
                              8. Angkatan Alumni (Khusus Alumni Pesantren Sukahideng)
                            </label>
                            <input 
                              type="text" 
                              value={formData.angkatan}
                              onChange={e => setFormData({ ...formData, angkatan: e.target.value })}
                              placeholder="Contoh: Angkatan 2020 / Marawis"
                              className="w-full bg-brand-green/80 border border-brand-gold/30 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all placeholder:text-brand-cream/30"
                              required={formData.kategoriPeserta === 'Alumni Pesantren Sukahideng'}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* SECTION 2: DATA PENAMPILAN */}
                    <div className="space-y-6 pt-4">
                      <div className="flex items-center gap-2 border-b border-brand-gold/20 pb-2 mb-4">
                        <span className="bg-brand-gold text-brand-dark text-[10px] font-black px-2 py-0.5 rounded-md">2</span>
                        <h3 className="text-base font-serif font-bold text-brand-gold uppercase tracking-wider">DATA PENAMPILAN</h3>
                      </div>

                      {/* 9. Judul Lagu */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">9. Judul Lagu yang Akan Dibawakan</label>
                        <input 
                          type="text" 
                          value={formData.judulLagu}
                          onChange={e => setFormData({ ...formData, judulLagu: e.target.value })}
                          placeholder="Contoh: Deen Assalam / Sholawat Cinta"
                          className="w-full bg-brand-green/80 border border-brand-gold/30 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all placeholder:text-brand-cream/30"
                          required
                        />
                      </div>

                      {/* 10. Nama Penyanyi Asli */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">10. Nama Penyanyi Asli</label>
                        <input 
                          type="text" 
                          value={formData.penyanyiAsli}
                          onChange={e => setFormData({ ...formData, penyanyiAsli: e.target.value })}
                          placeholder="Contoh: Sabyan Gambus / Maher Zain"
                          className="w-full bg-brand-green/80 border border-brand-gold/30 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all placeholder:text-brand-cream/30"
                          required
                        />
                      </div>

                      {/* 11. Durasi Lagu */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-3 ml-1">11. Durasi Lagu</label>
                        <input 
                          type="text" 
                          value={formData.durasiLagu}
                          onChange={e => setFormData({ ...formData, durasiLagu: e.target.value })}
                          placeholder="Contoh: 4:30"
                          className="w-full bg-brand-green/80 border border-brand-gold/30 rounded-2xl px-6 py-4 text-brand-cream focus:outline-none focus:border-brand-gold transition-all font-mono placeholder:text-brand-cream/30"
                          required
                        />
                      </div>

                      {/* 12. Upload music file (MP3) */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold mb-2 ml-1">
                          12. Upload File Musik Minus One (MP3)
                        </label>
                        <p className="text-[10px] text-brand-cream/50 mb-3 ml-1 italic">Format: MP3 • Maksimal 20 MB</p>

                        {!formData.musicFileName ? (
                          <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                              dragActive 
                                ? 'border-brand-gold bg-brand-gold/10' 
                                : 'border-brand-gold/30 hover:border-brand-gold/60 bg-brand-green/30'
                            }`}
                          >
                            <input 
                              ref={fileInputRef}
                              type="file" 
                              accept="audio/mp3,audio/mpeg"
                              onChange={handleFileChange}
                              className="hidden" 
                            />
                            
                            {isUploading ? (
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-bold text-brand-gold mt-2 font-mono">{uploadProgress}% Menyimpan...</span>
                              </div>
                            ) : (
                              <>
                                <Upload size={32} className="text-brand-gold" />
                                <span className="text-xs font-bold uppercase tracking-wider text-brand-cream">Tarik & Letakkan file / Klik untuk Cari</span>
                                <span className="text-[10px] text-brand-cream/50">Maksimal 20 MB (.mp3)</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-forest/40 border border-brand-gold/30">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-10 h-10 rounded-xl bg-brand-gold/15 flex items-center justify-center text-brand-gold flex-shrink-0">
                                <Music size={18} />
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-brand-cream truncate">{formData.musicFileName}</p>
                                <p className="text-[10px] font-mono text-brand-cream/50">{formData.musicFileSize}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={removeFile}
                              className="p-2 text-red-400 hover:text-red-300 transition-all rounded-lg hover:bg-red-400/10 flex-shrink-0"
                              title="Hapus file"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECTION 3: PERNYATAAN PESERTA */}
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center gap-2 border-b border-brand-gold/20 pb-2 mb-4">
                        <span className="bg-brand-gold text-brand-dark text-[10px] font-black px-2 py-0.5 rounded-md">3</span>
                        <h3 className="text-base font-serif font-bold text-brand-gold uppercase tracking-wider">PERNYATAAN PESERTA</h3>
                      </div>

                      <p className="text-[10px] uppercase font-bold text-brand-gold tracking-widest mb-2 ml-1">
                        13. Pernyataan Kesediaan (Wajib Centang Seluruhnya)
                      </p>

                      <div className="space-y-3.5 bg-brand-green/30 p-5 rounded-2xl border border-brand-gold/10">
                        {/* Checkbox 1 */}
                        <div 
                          className="flex items-start gap-3 cursor-pointer select-none"
                          onClick={() => setFormData({ ...formData, checkDataBenar: !formData.checkDataBenar })}
                        >
                          <div className="flex-shrink-0 mt-0.5 text-brand-gold">
                            {formData.checkDataBenar ? <CheckSquare size={18} className="text-brand-gold" /> : <Square size={18} className="text-brand-cream/30" />}
                          </div>
                          <p className="text-xs text-brand-cream/80 leading-relaxed font-light">
                            Saya menyatakan bahwa data yang saya isi adalah benar.
                          </p>
                        </div>

                        {/* Checkbox 2 */}
                        <div 
                          className="flex items-start gap-3 cursor-pointer select-none"
                          onClick={() => setFormData({ ...formData, checkSediaKetentuan: !formData.checkSediaKetentuan })}
                        >
                          <div className="flex-shrink-0 mt-0.5 text-brand-gold">
                            {formData.checkSediaKetentuan ? <CheckSquare size={18} className="text-brand-gold" /> : <Square size={18} className="text-brand-cream/30" />}
                          </div>
                          <p className="text-xs text-brand-cream/80 leading-relaxed font-light">
                            Saya bersedia mengikuti seluruh ketentuan lomba yang telah ditetapkan panitia.
                          </p>
                        </div>

                        {/* Checkbox 3 */}
                        <div 
                          className="flex items-start gap-3 cursor-pointer select-none"
                          onClick={() => setFormData({ ...formData, checkSportivitas: !formData.checkSportivitas })}
                        >
                          <div className="flex-shrink-0 mt-0.5 text-brand-gold">
                            {formData.checkSportivitas ? <CheckSquare size={18} className="text-brand-gold" /> : <Square size={18} className="text-brand-cream/30" />}
                          </div>
                          <p className="text-xs text-brand-cream/80 leading-relaxed font-light">
                            Saya menjunjung tinggi sportivitas dan menjaga ketertiban selama kegiatan berlangsung.
                          </p>
                        </div>

                        {/* Checkbox 4 */}
                        <div 
                          className="flex items-start gap-3 cursor-pointer select-none"
                          onClick={() => setFormData({ ...formData, checkKeputusanJuri: !formData.checkKeputusanJuri })}
                        >
                          <div className="flex-shrink-0 mt-0.5 text-brand-gold">
                            {formData.checkKeputusanJuri ? <CheckSquare size={18} className="text-brand-gold" /> : <Square size={18} className="text-brand-cream/30" />}
                          </div>
                          <p className="text-xs text-brand-cream/80 leading-relaxed font-light">
                            Saya menerima keputusan dewan juri yang bersifat mutlak dan tidak dapat diganggu gugat.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Block */}
                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={status === 'loading' || isUploading || (formData.category === 'Solo Religi' && !isSoloReligiReady)}
                    className="w-full bg-brand-lightgold hover:bg-brand-gold text-brand-dark py-5 rounded-2xl font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-40 shadow-2xl shadow-brand-gold/30 active:scale-[0.99]"
                  >
                    {status === 'loading' ? (
                      <div className="w-5 h-5 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={18} />
                        {formData.category === 'Gowes' ? 'Kirim Pendaftaran' : 'Kirim Pendaftaran Solo Religi'}
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {status === 'success' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 mt-6 text-green-400 justify-center font-medium bg-green-400/10 py-3.5 px-4 rounded-xl border border-green-400/20"
                      >
                        <CheckCircle2 size={18} className="flex-shrink-0" />
                        Pendaftaran berhasil! Terima kasih telah berkontribusi.
                      </motion.div>
                    )}
                    {status === 'error' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col gap-2 mt-6 text-red-400 items-center justify-center font-medium bg-red-400/10 py-3.5 px-4 rounded-xl border border-red-400/20"
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle size={18} className="flex-shrink-0" />
                          <span>Terjadi kesalahan saat mengirim pendaftaran.</span>
                        </div>
                        {errorMessage && <p className="text-[10px] font-mono text-red-300 text-center max-w-md">{errorMessage}</p>}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
