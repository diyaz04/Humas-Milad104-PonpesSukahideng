import React, { useState, useEffect, useMemo } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Heart, Check, X, Search, Trash2, Calendar, User, Wallet, Loader2, Landmark, Edit2, Save } from 'lucide-react';
import { Donation } from '../../types';
import ConfirmModal from './ConfirmModal';
import { motion, AnimatePresence } from 'motion/react';

const bankAccounts = ['BSI', 'BRI', 'Mandiri', 'BCA'];

export default function DonationPanel() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    amount: 0,
    message: '',
    bank: '',
    status: '' as 'pending' | 'verified' | 'rejected'
  });

  useEffect(() => {
    const q = query(collection(db, 'donations'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Donation));
      setDonations(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'donations');
    });
    return unsubscribe;
  }, []);

  const handleUpdateStatus = async (id: string, status: 'verified' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'donations', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'donations');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, 'donations', deleteId));
      setDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'donations');
    }
  };

  const handleEdit = (d: Donation) => {
    setEditingDonation(d);
    setEditForm({
      name: d.name,
      amount: d.amount,
      message: d.message || '',
      bank: d.bank || '',
      status: d.status
    });
  };

  const handleSaveEdit = async () => {
    if (!editingDonation) return;
    try {
      await updateDoc(doc(db, 'donations', editingDonation.id), {
        ...editForm
      });
      setEditingDonation(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'donations');
    }
  };

  const filteredDonations = donations.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.message?.toLowerCase().includes(search.toLowerCase())) ||
    (d.bank?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalDonations = donations
    .filter(d => d.status === 'verified')
    .reduce((sum, current) => sum + current.amount, 0);

  const bankTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    donations
      .filter(d => d.status === 'verified')
      .forEach(d => {
        const bankName = d.bank || 'Lainnya/Manual';
        totals[bankName] = (totals[bankName] || 0) + d.amount;
      });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [donations]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="font-bold uppercase tracking-widest text-[10px]">Memuat Data Donasi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Total Terkumpul</p>
            <p className="text-2xl font-bold text-brand-dark">Rp {totalDonations.toLocaleString('id-ID')}</p>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <Wallet size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Total Donatur</p>
            <p className="text-2xl font-bold text-brand-dark">{donations.filter(d => d.status === 'verified').length}</p>
          </div>
          <div className="w-12 h-12 bg-brand-gold/10 text-brand-gold rounded-2xl flex items-center justify-center">
            <Heart size={24} className="fill-brand-gold" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Menunggu Verifikasi</p>
            <p className="text-2xl font-bold text-orange-500">{donations.filter(d => d.status === 'pending').length}</p>
          </div>
          <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
            <Loader2 size={24} />
          </div>
        </div>
      </div>

      {/* Totals per Bank */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-brand-dark mb-6 flex items-center gap-2">
          <Landmark className="text-brand-gold" size={20} /> Saldo per Rekening Tujuan
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {bankTotals.length > 0 ? (
            bankTotals.map(([bank, total]) => (
              <div key={bank} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">{bank}</p>
                <p className="text-lg font-bold text-brand-dark font-mono">Rp {total.toLocaleString('id-ID')}</p>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-slate-400 italic text-sm py-4">Belum ada donasi terverifikasi.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-brand-dark flex items-center gap-3">
              <Heart className="text-brand-gold" /> Daftar Donasi
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Pantau dan verifikasi setiap donasi yang masuk</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari donatur atau bank..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-3 text-sm focus:ring-2 focus:ring-brand-gold/20 outline-none w-full md:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Donatur</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tujuan</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nominal</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDonations.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-gold/5 flex items-center justify-center text-brand-gold font-bold">
                        {d.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-brand-dark">{d.name}</p>
                        {d.message && <p className="text-[10px] text-slate-400 italic mt-0.5">"{d.message}"</p>}
                        <div className="md:hidden mt-1 flex items-center gap-1 text-[9px] text-slate-400 uppercase font-bold">
                          <Calendar size={10} /> {new Date(d.timestamp).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 uppercase font-black text-brand-dark/40 italic tracking-tighter">
                    {d.bank || '-'}
                  </td>
                  <td className="px-8 py-6 font-mono font-bold text-brand-dark">
                    Rp {d.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-widest ${
                      d.status === 'verified' ? 'bg-green-100 text-green-700' : 
                      d.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {d.status === 'verified' ? 'Terverifikasi' : 
                       d.status === 'rejected' ? 'Dibatalkan' : 
                       'Menunggu'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="hidden md:flex items-center gap-2 text-slate-400">
                      <Calendar size={14} />
                      <span className="text-[10px] font-bold uppercase">{new Date(d.timestamp).toLocaleDateString('id-ID')}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(d)}
                        className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-brand-gold/10 hover:text-brand-gold transition-all"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      {d.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(d.id, 'verified')}
                            className="p-2 bg-green-500 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/20 transition-all"
                            title="Setujui"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(d.id, 'rejected')}
                            className="p-2 bg-red-500 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/20 transition-all"
                            title="Tolak"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => setDeleteId(d.id)}
                        className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-all"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDonations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-10 text-center text-slate-400 italic text-sm">
                    Tidak ada data donasi ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Data Donasi"
        message="Apakah Anda yakin ingin menghapus data donasi ini? Tindakan ini tidak dapat dibatalkan."
      />

      <AnimatePresence>
        {editingDonation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-dark/40 backdrop-blur-md"
              onClick={() => setEditingDonation(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-brand-dark">Edit Data Donasi</h3>
                <button onClick={() => setEditingDonation(null)} className="text-slate-400 hover:text-brand-dark">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 ml-1">Nama Donatur</label>
                    <input 
                      type="text" 
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-brand-gold transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 ml-1">Nominal (Rp)</label>
                    <input 
                      type="number" 
                      value={editForm.amount}
                      onChange={e => setEditForm({ ...editForm, amount: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-brand-gold transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 ml-1">Rekening Tujuan</label>
                    <select 
                      value={editForm.bank}
                      onChange={e => setEditForm({ ...editForm, bank: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-brand-gold transition-all"
                    >
                      <option value="">-- Pilih Bank --</option>
                      {bankAccounts.map(b => <option key={b} value={b}>{b}</option>)}
                      {!bankAccounts.includes(editForm.bank) && editForm.bank && (
                        <option value={editForm.bank}>{editForm.bank}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 ml-1">Status</label>
                    <select 
                      value={editForm.status}
                      onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-brand-gold transition-all"
                    >
                      <option value="pending">Menunggu</option>
                      <option value="verified">Terverifikasi</option>
                      <option value="rejected">Dibatalkan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 ml-1">Pesan / Doa</label>
                  <textarea 
                    value={editForm.message}
                    onChange={e => setEditForm({ ...editForm, message: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-brand-gold transition-all resize-none"
                  />
                </div>

                <button 
                  onClick={handleSaveEdit}
                  className="w-full bg-brand-dark text-brand-gold py-4 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-brand-gold hover:text-brand-dark transition-all shadow-lg active:scale-95"
                >
                  <Save size={18} /> Simpan Perubahan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
