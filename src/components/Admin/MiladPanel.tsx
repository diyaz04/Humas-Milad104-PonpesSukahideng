import React, { useState, useRef } from 'react';
import { doc, setDoc, addDoc, collection, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { db, storage } from '../../lib/firebase';
import { Setting, News, FAQ, DocumentResource, Basecamp } from '../../types';
import { Plus, Trash2, Edit2, Check, Save, AlertCircle, Eye, X as CloseIcon, Loader2, FileText, Download, Upload, MapPin, Home } from 'lucide-react';
import FAQPanel from './FAQPanel';
import ConfirmModal from './ConfirmModal';

interface MiladPanelProps {
  settings: Setting | null;
  news: News[];
  faqs: FAQ[];
  documents: DocumentResource[];
  basecamps: Basecamp[];
}

export default function MiladPanel({ settings, news, faqs, documents, basecamps }: MiladPanelProps) {
  const [deleteNewsId, setDeleteNewsId] = useState<string | null>(null);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [deleteBasecampId, setDeleteBasecampId] = useState<string | null>(null);

  // Document state
  const [docForm, setDocForm] = useState({
    title: '',
    url: '',
    category: 'PORSAS'
  });
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  // Basecamp state
  const [basecampForm, setBasecampForm] = useState({
    name: '',
    location: '',
    capacity: '',
    price: 0
  });
  const [isAddingBasecamp, setIsAddingBasecamp] = useState(false);
  const [editingBasecampId, setEditingBasecampId] = useState<string | null>(null);

  const [localSettings, setLocalSettings] = useState<Setting>(settings || {
    heroTitle: '',
    heroTagline: '',
    countdownDate: '',
    aboutTitle: '',
    aboutText: ''
  });

  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    imageUrl: ''
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditNews = (item: News) => {
    setEditingNewsId(item.id);
    setNewsForm({
      title: item.title,
      content: item.content,
      date: item.date.split('T')[0],
      imageUrl: item.imageUrl || ''
    });
    setExistingImages(item.images || []);
    setPreviews([]);
    setSelectedFiles([]);
    
    // Scroll to form
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingNewsId(null);
    setNewsForm({ title: '', content: '', date: new Date().toISOString().split('T')[0], imageUrl: '' });
    setExistingImages([]);
    setPreviews([]);
    setSelectedFiles([]);
  };

  const removeExistingImage = (index: number) => {
    const newImages = [...existingImages];
    newImages.splice(index, 1);
    setExistingImages(newImages);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length + selectedFiles.length > 3) {
      alert("Maksimal 3 foto per berita.");
      return;
    }

    const newFiles = [...selectedFiles];
    const newPreviews = [...previews];

    for (const file of files) {
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...previews];
    
    URL.revokeObjectURL(newPreviews[index]);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const saveSettings = async () => {
    await setDoc(doc(db, 'settings', 'general'), localSettings);
    alert("Pengaturan tersimpan!");
  };

  const addNews = async () => {
    if (!newsForm.title || !newsForm.content) return;
    setIsUploading(true);
    
    try {
      const imageUrls: string[] = [...existingImages];
      
      // Process files sequentially to avoid overwhelming the connection and hitting retry limits
      for (const file of selectedFiles) {
        const options = {
          maxSizeMB: 0.4,
          maxWidthOrHeight: 1200,
          useWebWorker: true
        };
        
        const compressedFile = await imageCompression(file, options);
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const storageRef = ref(storage, `news/${fileName}`);
        
        await uploadBytes(storageRef, compressedFile);
        const downloadUrl = await getDownloadURL(storageRef);
        imageUrls.push(downloadUrl);
      }

      const newsData = {
        ...newsForm,
        date: new Date(newsForm.date).toISOString(),
        images: imageUrls,
        imageUrl: imageUrls[0] || newsForm.imageUrl
      };

      if (editingNewsId) {
        await updateDoc(doc(db, 'news', editingNewsId), newsData);
        alert("Berita berhasil diperbarui!");
      } else {
        await addDoc(collection(db, 'news'), {
          ...newsData,
          views: 0
        });
        alert("Berita berhasil ditambahkan!");
      }
      
      cancelEdit();
    } catch (err: any) {
      console.error("Error saving news:", err);
      const action = editingNewsId ? "memperbarui" : "menambahkan";
      if (err.code === 'storage/retry-limit-exceeded') {
        alert(`Gagal mengunggah foto: Waktu tunggu habis. Pastikan Firebase Storage sudah diaktifkan di Console.`);
      } else {
        alert(`Gagal ${action} berita: ` + (err.message || "Terjadi kesalahan internal"));
      }
    } finally {
      setIsUploading(false);
    }
  };

  const confirmDeleteNews = async () => {
    if (deleteNewsId) {
      await deleteDoc(doc(db, 'news', deleteNewsId));
      setDeleteNewsId(null);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.title || !docForm.url) return;
    
    setIsAddingDoc(true);
    try {
      const docData = {
        title: docForm.title.trim(),
        url: docForm.url.trim(),
        category: docForm.category,
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'documents'), docData);

      setDocForm({ title: '', url: '', category: 'PORSAS' });
      alert("Dokumen berhasil ditambahkan!");
    } catch (err: any) {
      console.error("Error adding document:", err);
      alert("Gagal menambahkan dokumen: " + (err.message || "Terjadi kesalahan internal"));
    } finally {
      setIsAddingDoc(false);
    }
  };

  const confirmDeleteDoc = async () => {
    if (deleteDocId) {
      await deleteDoc(doc(db, 'documents', deleteDocId));
      setDeleteDocId(null);
    }
  };

  const handleBasecampAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!basecampForm.name || !basecampForm.location) return;

    setIsAddingBasecamp(true);
    try {
      if (editingBasecampId) {
        await updateDoc(doc(db, 'basecamps', editingBasecampId), {
          ...basecampForm
        });
        setEditingBasecampId(null);
        alert("Basecamp berhasil diperbarui!");
      } else {
        await addDoc(collection(db, 'basecamps'), {
          ...basecampForm,
          isBooked: false
        });
        alert("Basecamp berhasil ditambahkan!");
      }
      setBasecampForm({ name: '', location: '', capacity: '', price: 0 });
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsAddingBasecamp(false);
    }
  };

  const startEditBasecamp = (b: Basecamp) => {
    setEditingBasecampId(b.id);
    setBasecampForm({
      name: b.name,
      location: b.location,
      capacity: b.capacity || '',
      price: b.price || 0
    });
  };

  const confirmDeleteBasecamp = async () => {
    if (deleteBasecampId) {
      await deleteDoc(doc(db, 'basecamps', deleteBasecampId));
      setDeleteBasecampId(null);
    }
  };

  const resetBooking = async (id: string) => {
    if (confirm("Reset status booking basecamp ini?")) {
      await updateDoc(doc(db, 'basecamps', id), {
        isBooked: false,
        bookedBy: null,
        bookedAt: null,
        bookedByContact: null,
        coordinatorName: null
      });
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-12">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-2xl font-serif font-bold text-brand-dark mb-8 border-b pb-4">Pengaturan Landing Page</h3>
        <div className="space-y-6">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Judul Hero</label>
            <input 
              type="text" 
              value={localSettings.heroTitle} 
              onChange={e => setLocalSettings({...localSettings, heroTitle: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-brand-gold outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Tagline</label>
            <textarea 
              value={localSettings.heroTagline} 
              onChange={e => setLocalSettings({...localSettings, heroTagline: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-brand-gold outline-none h-24"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Tanggal Countdown (ISO Format)</label>
            <input 
              type="datetime-local" 
              value={localSettings.countdownDate.substring(0,16)} 
              onChange={e => setLocalSettings({...localSettings, countdownDate: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-brand-gold outline-none"
            />
          </div>
          <div className="pt-4">
            <h4 className="font-serif font-bold text-lg mb-4">Bagian Tentang Milad</h4>
            <div className="space-y-4">
              <input 
                type="text" 
                value={localSettings.aboutTitle} 
                onChange={e => setLocalSettings({...localSettings, aboutTitle: e.target.value})}
                placeholder="Judul Tentang"
                className="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-brand-gold outline-none"
              />
              <textarea 
                value={localSettings.aboutText} 
                onChange={e => setLocalSettings({...localSettings, aboutText: e.target.value})}
                placeholder="Isi Teks Tentang"
                className="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-brand-gold outline-none h-40"
              />
            </div>
          </div>
          <button 
            onClick={saveSettings}
            className="w-full bg-brand-dark text-brand-gold py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Save size={18} /> Simpan Perubahan
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <h3 className="text-2xl font-serif font-bold text-brand-dark">
              {editingNewsId ? 'Edit Berita' : 'Tambah Berita'}
            </h3>
            {editingNewsId && (
              <button 
                onClick={cancelEdit}
                className="text-xs font-bold text-red-500 uppercase tracking-widest hover:bg-red-50 px-3 py-1 rounded-full transition-colors"
              >
                Batal Edit
              </button>
            )}
          </div>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Judul Berita" 
              value={newsForm.title}
              onChange={e => setNewsForm({...newsForm, title: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-brand-gold"
            />
            <textarea 
              placeholder="Isi Berita" 
              value={newsForm.content}
              onChange={e => setNewsForm({...newsForm, content: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none h-32 focus:border-brand-gold"
            />
            <input 
              type="date" 
              value={newsForm.date}
              onChange={e => setNewsForm({...newsForm, date: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-brand-gold"
            />
            
            {(existingImages.length > 0 || previews.length > 0) && (
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Foto Saat Ini & Baru</label>
                <div className="grid grid-cols-3 gap-4">
                  {/* Existing Images */}
                  {existingImages.map((url, index) => (
                    <div key={`existing-${index}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-brand-gold/20 group">
                      <img src={url} alt="Existing" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <CloseIcon size={12} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-brand-gold/80 text-[8px] text-center font-bold text-brand-dark uppercase py-0.5">Lama</div>
                    </div>
                  ))}
                  
                  {/* New Previews */}
                  {previews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-100 group">
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <CloseIcon size={12} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-green-500/80 text-[8px] text-center font-bold text-white uppercase py-0.5">Baru</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">
                Tambah Foto {editingNewsId ? `(Sisa Kuota: ${3 - (existingImages.length + selectedFiles.length)})` : '(Maks 3)'}
              </label>
              {(existingImages.length + selectedFiles.length) < 3 && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-brand-gold hover:text-brand-gold transition-all"
                >
                  <Plus size={24} />
                  <span className="text-[10px] uppercase font-bold mt-2 font-sans">Pilih Foto</span>
                </button>
              )}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />
            </div>

            <input 
              type="text" 
              placeholder="URL Gambar (Jika tidak upload)" 
              value={newsForm.imageUrl}
              onChange={e => setNewsForm({...newsForm, imageUrl: e.target.value})}
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none"
            />
            <button 
              onClick={addNews}
              disabled={isUploading}
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg ${editingNewsId ? 'bg-brand-dark text-brand-gold' : 'bg-brand-gold text-brand-dark'} disabled:opacity-50`}
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {editingNewsId ? 'Memperbarui...' : 'Mengunggah...'}
                </>
              ) : (
                editingNewsId ? 'Simpan Perubahan Berita' : 'Publikasikan Berita'
              )}
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-2xl font-serif font-bold text-brand-dark mb-6">Daftar Berita</h3>
          <div className="space-y-4">
            {news.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                <div className="truncate pr-4 flex-1">
                  <p className="font-bold text-brand-dark truncate">{item.title}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{new Date(item.date).toDateString()}</p>
                    <div className="flex items-center gap-1 text-[10px] text-brand-gold font-bold">
                      <Eye size={10} />
                      {item.views || 0}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEditNews(item)}
                    className="p-2 text-brand-dark/40 hover:text-brand-gold hover:bg-brand-gold/10 rounded-lg transition-colors"
                    title="Edit Berita"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => setDeleteNewsId(item.id)}
                    className="p-2 text-red-500/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Basecamp Management */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-2xl font-serif font-bold text-brand-dark mb-6 flex items-center gap-2">
              <Home className="text-brand-gold" /> Kelola Penginapan Kontingen
            </h3>

            <form onSubmit={handleBasecampAction} className="space-y-4 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Nama Unit/Rumah</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Villa Hijau"
                    value={basecampForm.name}
                    onChange={e => setBasecampForm({...basecampForm, name: e.target.value})}
                    className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-brand-gold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Lokasi / Alamat</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Dekat Gerbang"
                    value={basecampForm.location}
                    onChange={e => setBasecampForm({...basecampForm, location: e.target.value})}
                    className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-brand-gold"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Kapasitas</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 15 Orang"
                    value={basecampForm.capacity}
                    onChange={e => setBasecampForm({...basecampForm, capacity: e.target.value})}
                    className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-brand-gold"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Harga (Jika Ada)</label>
                  <input 
                    type="number" 
                    value={basecampForm.price}
                    onChange={e => setBasecampForm({...basecampForm, price: parseInt(e.target.value)})}
                    className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-brand-gold"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  type="submit"
                  disabled={isAddingBasecamp}
                  className="flex-grow bg-brand-dark text-brand-gold py-3 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAddingBasecamp ? <Loader2 size={18} className="animate-spin" /> : (editingBasecampId ? <Check size={18} /> : <Plus size={18} />)}
                  {editingBasecampId ? 'Update Basecamp' : 'Tambah Basecamp'}
                </button>
                {editingBasecampId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingBasecampId(null);
                      setBasecampForm({ name: '', location: '', capacity: '', price: 0 });
                    }}
                    className="bg-slate-200 text-slate-600 px-4 rounded-xl font-bold"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>

            <div className="space-y-4">
              {basecamps.map(bc => (
                <div key={bc.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand-dark">{bc.name}</span>
                        {bc.isBooked ? (
                          <span className="text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase">Sudah Dibooking</span>
                        ) : (
                          <span className="text-[8px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase">Tersedia</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> {bc.location} {bc.capacity && `• Cap: ${bc.capacity}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEditBasecamp(bc)} className="p-2 text-slate-400 hover:text-brand-gold"><Edit2 size={16} /></button>
                      <button onClick={() => setDeleteBasecampId(bc.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  {bc.isBooked && (
                    <div className="mt-3 pt-3 border-t border-slate-200/50">
                      <div className="flex justify-between items-end">
                        <div className="text-[10px] text-slate-500 space-y-0.5">
                          <p><span className="font-bold uppercase tracking-tighter">Korwil:</span> {bc.bookedBy}</p>
                          <p><span className="font-bold uppercase tracking-tighter">PIC:</span> {bc.coordinatorName} ({bc.bookedByContact})</p>
                        </div>
                        <button 
                          onClick={() => resetBooking(bc.id)}
                          className="text-[9px] font-bold text-brand-dark underline uppercase"
                        >
                          Reset Booking
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {basecamps.length === 0 && <p className="text-center py-8 text-slate-300 text-sm italic">Belum ada unit basecamp.</p>}
            </div>
          </div>

          {/* Document Management Section */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-2xl font-serif font-bold text-brand-dark mb-6 flex items-center gap-2">
              <FileText className="text-brand-gold" /> Kelola Juknis & Proposal
            </h3>
            
            <form onSubmit={handleAddDocument} className="space-y-6 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Judul Dokumen</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Juknis PORSAS 2026"
                  value={docForm.title}
                  onChange={e => setDocForm({...docForm, title: e.target.value})}
                  className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-brand-gold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Kategori</label>
                  <select 
                    value={docForm.category}
                    onChange={e => setDocForm({...docForm, category: e.target.value})}
                    className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-brand-gold bg-white"
                  >
                    <option value="PORSAS">PORSAS</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Link / URL Dokumen</label>
                  <input 
                    type="text" 
                    placeholder="Wajib diisi (Google Drive, dll)"
                    value={docForm.url}
                    onChange={e => setDocForm({...docForm, url: e.target.value})}
                    className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-brand-gold"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isAddingDoc}
                className="w-full bg-brand-dark text-brand-gold py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAddingDoc ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                {isAddingDoc ? 'Sedang Menambah...' : 'Tambah Dokumen'}
              </button>
            </form>

            <div className="space-y-3">
              {documents.map(doc => (
                <div key={doc.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-gold/10 text-brand-gold rounded-xl flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-brand-dark text-sm">{doc.title}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{doc.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-brand-gold transition-colors"
                      title="Lihat"
                    >
                      <Eye size={18} />
                    </a>
                    <button 
                      onClick={() => setDeleteDocId(doc.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-center py-8 text-slate-300 text-sm italic">Belum ada dokumen yang diunggah.</p>
              )}
            </div>
          </div>

          <FAQPanel faqs={faqs} />
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteDocId !== null}
        onClose={() => setDeleteDocId(null)}
        onConfirm={confirmDeleteDoc}
        title="Hapus Dokumen?"
        message="Apakah Anda yakin ingin menghapus dokumen ini?"
      />

      <ConfirmModal 
        isOpen={deleteBasecampId !== null}
        onClose={() => setDeleteBasecampId(null)}
        onConfirm={confirmDeleteBasecamp}
        title="Hapus Basecamp?"
        message="Apakah Anda yakin ingin menghapus unit basecamp ini?"
      />

      <ConfirmModal 
        isOpen={deleteNewsId !== null}
        onClose={() => setDeleteNewsId(null)}
        onConfirm={confirmDeleteNews}
        title="Hapus Berita?"
        message="Apakah Anda yakin ingin menghapus berita ini? Berita ini akan hilang dari halaman utama."
      />
    </div>
  );
}
