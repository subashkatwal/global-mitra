export type AdminPage = 'dashboard' | 'users' | 'guides' | 'posts' | 'reports' | 'destinations';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isVerified: boolean;
  phoneNumber?: string;
  createdAt: string;
  photo?: string;
}

export interface Guide {
  id: string;
  licenseNumber: string;
  licenseIssuedBy: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  bio?: string;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
    photo?: string;
  };
}

export interface Post {
  id: string;
  content: string;
  createdAt: string;
  author?: { fullName: string };
}

export interface Report {
  id: string;
  type: string;
  title: string;
  place?: string;
  status?: string;
  createdAt: string;
  reporter?: { fullName: string };
}

export interface Destination {
  id: string;
  name: string;
  district: string;
  difficulty: string;
  averageCost: number;
  altitude?: number;
  description?: string;
  bestSeason?: string;
  duration?: string;
  country?: string;
}

export interface Stats {
  totalUsers: number;
  activeGuides: number;
  pendingVerifications: number;
  totalPosts: number;
  safetyReports: number;
  destinations: number;
}

export type ToastFn = (msg: string, type: 'success' | 'error') => void;
