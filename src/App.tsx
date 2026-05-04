import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  query, 
  orderBy
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';
import { 
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Setting, News, ScheduleItem, Koorwil, Sport, Registration, Match, FAQ, AdminType, Product, DocumentResource } from './types';

// Components
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import VideoSection from './components/VideoSection';
import Schedule from './components/Schedule';
import Porsas from './components/Porsas';
import RegistrationForm from './components/RegistrationForm';
import IndividualRegistration from './components/IndividualRegistration';
import Bracket from './components/Bracket';
import NewsSection from './components/NewsSection';
import Merchandise from './components/Merchandise';
import Footer from './components/Footer';
import AdminDashboard from './components/Admin/AdminDashboard';
import PopupBanner from './components/PopupBanner';
import NewsDetail from './components/NewsDetail';
import ChatBot from './components/ChatBot';
import Donation from './components/Donation';
import AlumniConfirmation from './components/AlumniConfirmation';
import InfoCenter from './components/InfoCenter';

export default function App() {
  const [activeAdmin, setActiveAdmin] = useState<AdminType>(null);
  const [showDonation, setShowDonation] = useState(false);
  const [showAlumni, setShowAlumni] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Setting | null>(null);
  const [news, setNews] = useState<News[]>([]);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [koorwils, setKoorwils] = useState<Koorwil[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [documents, setDocuments] = useState<DocumentResource[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Check for newsId in URL
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('news');
    if (newsId && news.length > 0) {
      const found = news.find(n => n.id === newsId);
      if (found) setSelectedNews(found);
    }
  }, [news]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    
    // Listen for settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as Setting);
      } else {
        // Only seed if user is the known admin email
        if (auth.currentUser?.email === 'miladponpessukahideng@gmail.com') {
          const defaultSettings: Setting = {
            heroTitle: "Milad ke-104 Pesantren Sukahideng",
            heroTagline: "Meneguhkan Khidmah, Menginspirasi Umat",
            countdownDate: "2026-07-15T00:00:00",
            aboutTitle: "Makna Milad ke-104",
            aboutText: "Pesantren Sukahideng telah berdiri selama lebih dari satu abad, membimbing generasi dengan ilmu dan akhlak. Milad ke-104 ini merupakan momentum untuk bersyukur dan mengaktualisasikan nilai-nilai pesantren dalam menjawab tantangan zaman."
          };
          setDoc(doc(db, 'settings', 'general'), defaultSettings).catch(err => {
             console.warn("Seeding failed (expected if not admin):", err.message);
          });
        }
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/general'));

    // Listen for news
    const unsubNews = onSnapshot(query(collection(db, 'news'), orderBy('date', 'desc')), (snap) => {
      setNews(snap.docs.map(d => ({ id: d.id, ...d.data() } as News)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'news'));

    // Listen for schedule
    const unsubSchedule = onSnapshot(query(collection(db, 'schedule'), orderBy('date'), orderBy('startTime')), (snap) => {
      setSchedule(snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleItem)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'schedule'));

    // Listen for koorwils
    const unsubKoorwils = onSnapshot(query(collection(db, 'koorwils'), orderBy('name')), (snap) => {
      setKoorwils(snap.docs.map(d => ({ id: d.id, ...d.data() } as Koorwil)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'koorwils'));

    // Listen for sports
    const unsubSports = onSnapshot(query(collection(db, 'sports'), orderBy('name')), (snap) => {
      setSports(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sport)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'sports'));

    // Listen for products
    const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('name')), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    // Listen for registrations
    const unsubRegs = onSnapshot(collection(db, 'registrations'), (snap) => {
      setRegistrations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Registration)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'registrations'));

    // Listen for matches
    const unsubMatches = onSnapshot(collection(db, 'matches'), (snap) => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Match)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'matches'));

    // Listen for faqs
    const unsubFaqs = onSnapshot(collection(db, 'faqs'), (snap) => {
      setFaqs(snap.docs.map(d => ({ id: d.id, ...d.data() } as FAQ)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'faqs'));

    // Listen for documents
    const unsubDocs = onSnapshot(query(collection(db, 'documents'), orderBy('updatedAt', 'desc')), (snap) => {
      setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() } as DocumentResource)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'documents'));

    return () => {
      unsubAuth();
      unsubSettings();
      unsubNews();
      unsubSchedule();
      unsubKoorwils();
      unsubSports();
      unsubProducts();
      unsubRegs();
      unsubMatches();
      unsubFaqs();
      unsubDocs();
    };
  }, []);

  const handleAdminAccess = (keyword: string) => {
    if (keyword === 'milad') setActiveAdmin('milad');
    else if (keyword === 'jadwal') setActiveAdmin('jadwal');
    else if (keyword === 'porsas') setActiveAdmin('porsas');
    else if (keyword === 'pesanan') setActiveAdmin('pesanan');
    else if (keyword === 'donasi') setActiveAdmin('donasi');
    else if (keyword === 'registrasi') setActiveAdmin('registrasi');
    else if (keyword === 'superadmin') setActiveAdmin('super');
    else setActiveAdmin(null);
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveAdmin(null);
  };

  const isAdmin = !!activeAdmin; // If they entered the code, they are admin in UI

  return (
    <div className="min-h-screen font-sans islamic-pattern selection:bg-brand-gold selection:text-brand-dark">
      <Navbar 
        onMenuOpen={() => setIsMenuOpen(true)} 
        onOpenDonation={() => setShowDonation(true)}
        onOpenAlumni={() => setShowAlumni(true)}
      />
      
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-50 bg-brand-dark flex flex-col p-8 md:hidden"
          >
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="self-end p-2 text-brand-gold"
            >
              <X size={32} />
            </button>
            <nav className="flex flex-col gap-8 mt-12 text-2xl font-serif text-brand-cream text-center">
              <a href="#video-content" className="hover:text-brand-gold transition-colors" onClick={() => setIsMenuOpen(false)}>Multimedia</a>
              <a href="#agenda" className="hover:text-brand-gold transition-colors" onClick={() => setIsMenuOpen(false)}>Agenda</a>
              <a href="#merchandise" className="hover:text-brand-gold transition-colors" onClick={() => setIsMenuOpen(false)}>Merchandise</a>
              <a href="#porsas" className="hover:text-brand-gold transition-colors" onClick={() => setIsMenuOpen(false)}>PORSAS</a>
              <a href="#pusat-informasi" className="hover:text-brand-gold transition-colors" onClick={() => setIsMenuOpen(false)}>Dokumen</a>
              <button 
                onClick={() => { setShowAlumni(true); setIsMenuOpen(false); }}
                className="text-brand-cream hover:text-brand-gold transition-colors"
              >
                Konfirmasi Alumni
              </button>
              <button 
                onClick={() => { setShowDonation(true); setIsMenuOpen(false); }}
                className="text-brand-gold font-bold hover:text-white transition-colors"
              >
                Infaq & Donasi
              </button>
              <a href="#berita" className="hover:text-brand-gold transition-colors" onClick={() => setIsMenuOpen(false)}>Berita</a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        <section id="hero">
          <Hero settings={settings} />
        </section>
        
        <section id="about" className="py-24 bg-white/30">
          <About settings={settings} />
        </section>

        <VideoSection />

        <IndividualRegistration />

        <section id="agenda" className="py-24">
          <Schedule schedule={schedule} />
        </section>

        <section id="merchandise" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto">
            <Merchandise products={products} />
          </div>
        </section>

        <section id="porsas" className="bg-brand-dark py-24 text-brand-cream overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <Porsas sports={sports} />
            <div id="daftar-porsas" className="mt-32">
              <RegistrationForm koorwils={koorwils} sports={sports} />
            </div>
            <div id="bagan-porsas" className="mt-32">
              <Bracket sports={sports} matches={matches} registrations={registrations} />
            </div>
          </div>
        </section>

        <InfoCenter documents={documents} />

        <section id="berita" className="py-24">
          <NewsSection 
            news={news} 
            onReadMore={(n) => {
              setSelectedNews(n);
              const url = new URL(window.location.href);
              url.searchParams.set('news', n.id);
              window.history.pushState({}, '', url);
            }}
          />
        </section>
      </main>

      <Footer onAdminTrigger={handleAdminAccess} />

      <PopupBanner 
        schedule={schedule} 
        matches={matches} 
        registrations={registrations} 
        onOpenDonation={() => setShowDonation(true)}
        onOpenAlumni={() => setShowAlumni(true)}
      />
      
      <ChatBot faqs={faqs} />

      <AnimatePresence>
        {showDonation && (
          <div className="fixed inset-0 z-[80] overflow-y-auto">
            <div className="fixed inset-0 bg-brand-dark/20 backdrop-blur-sm" onClick={() => setShowDonation(false)} />
            <div className="relative min-h-screen flex items-center justify-center p-4">
               <button 
                onClick={() => setShowDonation(false)}
                className="absolute top-8 right-8 z-[90] p-3 bg-white text-brand-dark rounded-full shadow-2xl hover:bg-brand-gold hover:text-white transition-all transform hover:rotate-90"
              >
                <X size={24} />
              </button>
              <Donation />
            </div>
          </div>
        )}
        {showAlumni && (
          <div className="fixed inset-0 z-[80] overflow-y-auto">
            <div className="fixed inset-0 bg-brand-dark/20 backdrop-blur-sm" onClick={() => setShowAlumni(false)} />
            <div className="relative min-h-screen flex items-center justify-center p-4">
               <button 
                onClick={() => setShowAlumni(false)}
                className="absolute top-8 right-8 z-[90] p-3 bg-white text-brand-dark rounded-full shadow-2xl hover:bg-brand-gold hover:text-white transition-all transform hover:rotate-90"
              >
                <X size={24} />
              </button>
              <AlumniConfirmation />
            </div>
          </div>
        )}
        {selectedNews && (
          <NewsDetail 
            news={selectedNews} 
            onClose={() => {
              setSelectedNews(null);
              const url = new URL(window.location.href);
              url.searchParams.delete('news');
              window.history.pushState({}, '', url);
            }} 
          />
        )}
        {activeAdmin && (
          <AdminDashboard 
            type={activeAdmin} 
            onClose={() => setActiveAdmin(null)} 
            isAdmin={isAdmin}
            onLogin={handleLogin}
            onLogout={handleLogout}
            user={user}
            settings={settings}
            news={news}
            faqs={faqs}
            schedule={schedule}
            koorwils={koorwils}
            sports={sports}
            registrations={registrations}
            matches={matches}
            documents={documents}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

