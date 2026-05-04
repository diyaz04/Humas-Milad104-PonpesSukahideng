export interface Setting {
  heroTitle: string;
  heroTagline: string;
  countdownDate: string;
  aboutTitle: string;
  aboutText: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  date: string;
  imageUrl?: string;
  images?: string[];
  views?: number;
}

export interface ScheduleItem {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  category: string;
}

export interface Koorwil {
  id: string;
  name: string;
}

export interface Sport {
  id: string;
  name: string;
  category: 'olahraga' | 'seni';
  gender: 'putra' | 'putri' | 'umum';
  type: 'individu' | 'tim';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  isActive: boolean;
}

export interface ProductOrder {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  customerContact: string;
  address: string;
  quantity: number;
  totalPrice: number;
  paymentProof: string; // URL or indicator
  status: 'pending' | 'verified' | 'rejected';
  timestamp: string;
  orderCode: string;
}

export interface MerchantConfig {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface Registration {
  id: string;
  name: string;
  type?: 'koorwil' | 'individual';
  koorwil?: string;
  sportId: string;
  sportName: string;
  category: 'olahraga' | 'seni';
  members: string;
  contact: string;
  gender: 'putra' | 'putri';
  timestamp: string;
  participantType?: 'alumni' | 'santri' | 'umum';
}

export interface Match {
  id: string;
  sportId: string;
  round: number;
  matchIndex: number;
  teamAId: string | null;
  teamBId: string | null;
  scoreA: number;
  scoreB: number;
  winnerId: string | null;
  status: 'scheduled' | 'ongoing' | 'completed';
  startTime?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  status: 'pending' | 'verified' | 'rejected';
  timestamp: string;
}

export interface Alumnus {
  id: string;
  name: string;
  nameLowercase: string;
  yearIn: string;
  phone: string;
  address: string;
  village: string;
  district: string;
  city: string;
  province: string;
  profession: string;
  status: 'unconfirmed' | 'confirmed' | 'checked-in';
  registrationCode?: string;
  confirmedAt?: string;
  checkedInAt?: string;
}

export interface DocumentResource {
  id: string;
  title: string;
  url: string;
  category?: string;
  updatedAt?: string;
}

export type AdminType = 'milad' | 'jadwal' | 'porsas' | 'pesanan' | 'donasi' | 'registrasi' | 'super' | null;
