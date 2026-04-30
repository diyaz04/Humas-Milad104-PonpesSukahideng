import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType, auth } from '../../lib/firebase';
import imageCompression from 'browser-image-compression';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { ShoppingBag, Plus, Trash2, Check, X, Camera, Calendar, Package, CreditCard, Save, AlertTriangle, Upload, Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { Product, ProductOrder, MerchantConfig } from '../../types';
import ConfirmModal from './ConfirmModal';

interface MerchandisePanelProps {
  user: User | null;
}

export default function MerchandisePanel({ user }: MerchandisePanelProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'product' | 'order' } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [bankConfig, setBankConfig] = useState<MerchantConfig>({
    bankName: '',
    accountNumber: '',
    accountName: ''
  });
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    image: '',
    description: '',
    isActive: true
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const options = {
        maxSizeMB: 0.2, // Compress more for better performance
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const base64 = await imageCompression.getDataUrlFromFile(compressedFile);
      setNewProduct({ ...newProduct, image: base64 });
    } catch (error) {
      console.error('Compression error:', error);
      alert('Gagal mengompres gambar. Pastikan file adalah gambar yang valid.');
    } finally {
      setIsCompressing(false);
    }
  };

  useEffect(() => {
    const qP = query(collection(db, 'products'), orderBy('name'));
    const unsubscribeP = onSnapshot(qP, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    return () => unsubscribeP();
  }, []);

  useEffect(() => {
    let unsubscribeO = () => {};
    
    // Only subscribe to orders if we have a confirmed authenticated user
    if (user && auth.currentUser) {
      const qO = query(collection(db, 'productOrders'), orderBy('timestamp', 'desc'));
      unsubscribeO = onSnapshot(qO, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductOrder)));
      }, (err) => {
        // Only report if still authenticated to avoid reporting false-positive errors during logout
        if (auth.currentUser) {
          handleFirestoreError(err, OperationType.LIST, 'productOrders');
        }
      });
    } else {
      setOrders([]);
    }

    return () => unsubscribeO();
  }, [user]);

  useEffect(() => {
    const fetchConfig = async () => {
      const docRef = doc(db, 'settings', 'merchant_config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBankConfig(docSnap.data() as MerchantConfig);
      }
    };
    fetchConfig();
  }, []);

  const saveBankConfig = async () => {
    setIsSavingBank(true);
    try {
      await setDoc(doc(db, 'settings', 'merchant_config'), bankConfig);
      alert('Konfigurasi pembayaran berhasil disimpan!');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingBank(false);
    }
  };

  const addProduct = async () => {
    if (!newProduct.name || newProduct.price <= 0) return;
    try {
      await addDoc(collection(db, 'products'), { ...newProduct });
      setNewProduct({ name: '', price: 0, image: '', description: '', isActive: true });
    } catch (error) {
      console.error(error);
    }
  };

  const deleteProduct = async (id: string) => {
    await deleteDoc(doc(db, 'products', id));
  };

  const deleteOrder = async (id: string) => {
    await deleteDoc(doc(db, 'productOrders', id));
  };

  const updateOrderStatus = async (orderId: string, status: 'verified' | 'rejected') => {
    await updateDoc(doc(db, 'productOrders', orderId), { status });
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Management */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-serif font-bold text-2xl mb-6 flex items-center gap-3">
            <ShoppingBag className="text-brand-gold" />
            Kelola Produk
          </h3>
          
          <div className="space-y-4 mb-8 bg-slate-50 p-6 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-4">
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Nama Produk..."
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full border-2 border-white rounded-xl p-3 outline-none focus:border-brand-gold/20 transition-all"
                />
                <input 
                  type="number" 
                  placeholder="Harga (Rp)..."
                  value={newProduct.price || ''}
                  onChange={e => setNewProduct({ ...newProduct, price: parseInt(e.target.value) || 0 })}
                  className="w-full border-2 border-white rounded-xl p-3 outline-none focus:border-brand-gold/20 transition-all"
                />
              </div>
              <div className="relative group">
                <label className="block w-full h-[104px] bg-white border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-gold hover:bg-brand-gold/5 transition-all overflow-hidden">
                  {isCompressing ? (
                    <Loader2 className="animate-spin text-brand-gold" size={24} />
                  ) : newProduct.image ? (
                    <img src={newProduct.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload className="text-slate-300 mb-1" size={20} />
                      <span className="text-[8px] uppercase font-bold text-slate-400">Upload</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload} 
                    disabled={isCompressing}
                  />
                </label>
                {newProduct.image && (
                    <button 
                        onClick={() => setNewProduct({...newProduct, image: ''})}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                    >
                        <X size={10} />
                    </button>
                )}
              </div>
            </div>
            <textarea 
              placeholder="Deskripsi Singkat..."
              value={newProduct.description}
              onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
              className="w-full border-2 border-white rounded-xl p-3 outline-none h-24"
            />
            <button 
              onClick={addProduct}
              className="w-full bg-brand-dark text-brand-gold p-4 rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest"
            >
              <Plus size={20} /> Tambah Produk
            </button>
          </div>

          <div className="space-y-3">
            {products.map(p => (
              <div key={p.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50/50 transition-all">
                <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Camera size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold text-slate-800">{p.name}</h4>
                  <p className="text-brand-gold font-mono font-bold text-sm">Rp {p.price.toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => setDeleteConfirm({ id: p.id, type: 'product' })}
                  className="text-red-300 hover:text-red-500 p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Order Stats / Info */}
        <div className="space-y-8">
            <div className="bg-brand-dark text-brand-gold p-8 rounded-3xl shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-brand-gold/20 rounded-2xl flex items-center justify-center">
                        <Package size={24} />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-xl uppercase tracking-wider">Ringkasan Pesanan</h3>
                        <p className="text-brand-gold/60 text-xs">Total pesanan masuk periode ini</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl">
                        <span className="block text-[10px] uppercase tracking-widest text-brand-gold/40 mb-1">Total Masuk</span>
                        <span className="text-3xl font-bold">{orders.length}</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl">
                        <span className="block text-[10px] uppercase tracking-widest text-brand-gold/40 mb-1">Menunggu</span>
                        <span className="text-3xl font-bold">{orders.filter(o => o.status === 'pending').length}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-serif font-bold text-xl mb-6 flex items-center gap-3">
                    <CreditCard className="text-brand-gold" />
                    Konfigurasi Rekening
                </h3>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Nama Bank (e.g. BSI)"
                    value={bankConfig.bankName}
                    onChange={e => setBankConfig({ ...bankConfig, bankName: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-xl p-3 outline-none focus:border-brand-gold transition-all"
                  />
                  <input 
                    type="text" 
                    placeholder="Nomor Rekening"
                    value={bankConfig.accountNumber}
                    onChange={e => setBankConfig({ ...bankConfig, accountNumber: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-xl p-3 outline-none focus:border-brand-gold transition-all"
                  />
                  <input 
                    type="text" 
                    placeholder="Nama Pemilik"
                    value={bankConfig.accountName}
                    onChange={e => setBankConfig({ ...bankConfig, accountName: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-xl p-3 outline-none focus:border-brand-gold transition-all"
                  />
                  <button 
                    onClick={saveBankConfig}
                    className="w-full bg-brand-gold text-brand-dark p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest"
                  >
                    {isSavingBank ? 'Menyimpan...' : <><Save size={16} /> Simpan Data Rekening</>}
                  </button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-serif font-bold text-xl mb-6 flex items-center gap-3">
                    <Calendar className="text-brand-gold" />
                    Atur Periode PO
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                    Pesanan hanya dapat dilakukan oleh user jika status produk diaktifkan atau periode pendaftaran masih terbuka sesuai kebijakan panitia.
                </p>
            </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-serif font-bold text-2xl uppercase tracking-wider">Daftar Pesanan Merchandise</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              <tr>
                <th className="px-8 py-4">Kode PO</th>
                <th className="px-8 py-4">Pemesan</th>
                <th className="px-8 py-4">Produk</th>
                <th className="px-8 py-4 text-right">Total</th>
                <th className="px-8 py-4">Bukti</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/50">
                  <td className="px-8 py-4 font-mono font-bold text-brand-gold bg-brand-gold/5">
                    {order.orderCode}
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-brand-dark">{order.customerName}</span>
                      <span className="text-xs text-slate-400">{order.customerContact}</span>
                      <span className="text-[10px] text-slate-300 truncate max-w-[150px]">{order.address}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-700">{order.productName}</span>
                      <span className="text-[10px] text-slate-400">Qty: {order.quantity}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right font-mono font-bold text-brand-dark">
                    Rp {order.totalPrice.toLocaleString()}
                  </td>
                  <td className="px-8 py-4">
                    {order.paymentProof ? (
                        <button 
                            onClick={() => setSelectedImage(order.paymentProof)}
                            className="bg-blue-50 text-blue-500 px-3 py-1 rounded-full text-[10px] font-bold hover:bg-blue-100 transition-colors"
                        >
                            LIHAT BUKTI
                        </button>
                    ) : (
                        <span className="text-red-400 text-[10px] italic">No Image</span>
                    )}
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'verified' ? 'bg-green-50 text-green-500' : 
                      order.status === 'rejected' ? 'bg-red-50 text-red-500' : 
                      'bg-orange-50 text-orange-500'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center justify-center gap-2">
                        {order.status === 'pending' && (
                            <>
                                <button 
                                    onClick={() => updateOrderStatus(order.id, 'verified')}
                                    className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100"
                                >
                                    <Check size={18} />
                                </button>
                                <button 
                                    onClick={() => updateOrderStatus(order.id, 'rejected')}
                                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                                >
                                    <X size={18} />
                                </button>
                            </>
                        )}
                        <button 
                            onClick={() => setDeleteConfirm({ id: order.id, type: 'order' })}
                            className="p-2 text-slate-300 hover:text-red-400"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                  <tr>
                      <td colSpan={6} className="px-8 py-12 text-center text-slate-400 italic">
                          Belum ada pesanan masuk.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative max-w-lg w-full bg-white rounded-[40px] overflow-hidden shadow-2xl z-10 flex flex-col border border-slate-100"
            >
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-gold/10 rounded-xl flex items-center justify-center text-brand-gold">
                        <Camera size={20} />
                    </div>
                    <h3 className="font-serif font-bold text-lg uppercase tracking-widest text-slate-400">Bukti Pembayaran</h3>
                </div>
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="p-2 hover:bg-white rounded-full transition-colors text-slate-300 hover:text-slate-500"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 flex items-center justify-center bg-white min-h-[300px]">
                <div className="relative group">
                    <img 
                        src={selectedImage} 
                        alt="Bukti Transfer" 
                        className="max-w-full max-h-[60vh] object-contain rounded-2xl shadow-lg border border-slate-100 ring-8 ring-slate-50" 
                    />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5 pointer-events-none" />
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Pastikan nominal dan tanggal sesuai</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
            if (deleteConfirm?.type === 'product') deleteProduct(deleteConfirm.id);
            if (deleteConfirm?.type === 'order') deleteOrder(deleteConfirm.id);
        }}
        title="Hapus Data?"
        message={`Apakah Anda yakin ingin menghapus ${deleteConfirm?.type === 'product' ? 'produk' : 'pesanan'} ini? Data yang sudah dihapus tidak dapat dikembalikan.`}
      />
    </div>
  );
}
