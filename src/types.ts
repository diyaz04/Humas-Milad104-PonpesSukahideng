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
}

export interface Registration {
  id: string;
  teamName: string;
  koorwil: string;
  sport: string;
  members: string;
  contact: string;
  timestamp: string;
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

export type AdminType = 'milad' | 'jadwal' | 'porsas' | null;
