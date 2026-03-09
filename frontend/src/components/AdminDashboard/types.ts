export type AdminPage = 'dashboard' | 'users' | 'guides' | 'posts' | 'reports' | 'destinations';

export interface User {
  id:           string;
  email:        string;
  fullName:     string;
  phoneNumber?: string;
  photo?:       string | null;
  role:         'TOURIST' | 'GUIDE' | 'ADMIN';
  verified:     boolean;
  isActive:     boolean;
  createdAt:    string;
  updatedAt:    string;
}

export interface Guide {
  id:                 string;
  licenseNumber:      string;
  licenseIssuedBy:    string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  bio:                string;
  createdAt:          string;
  user?: {
    id:          string;
    fullName:    string;
    email:       string;
    photo:       string | null;
    phoneNumber: string;
  };
}

export interface Post {
  id:             string;
  textContent:    string;
  image?:         string | null;
  createdAt:      string;
  commentCount?:  number;
  shareCount?:    number;
  bookmarkCount?: number;
  author?: {
    fullName?:  string;
    full_name?: string;
    email?:     string;
    photo?:     string | null;
  };
}

export interface Report {
  id:        string;
  type:      string;
  title:     string;
  place?:    string;
  status?:   string;
  createdAt: string;
  reporter?: { fullName: string };
}

export interface Destination {
  id:           string;
  name:         string;
  district:     string;
  difficulty:   string;
  averageCost:  number;
  altitude?:    number;
  description?: string;
  bestSeason?:  string;
  duration?:    string;
  country?:     string;
}

export interface Stats {
  totalUsers:           number;
  activeGuides:         number;
  pendingVerifications: number;
  totalPosts:           number;
  safetyReports:        number;
  destinations:         number;
}

export type ToastFn = (msg: string, type?: 'success' | 'error' | 'info') => void;

export type PlaceCategory =
  | 'mountain'
  | 'beach'
  | 'city'
  | 'forest'
  | 'desert'
  | 'cultural'
  | 'adventure'
  | 'wellness';

export type PriceRange = 'budget' | 'moderate' | 'luxury';

export interface PlaceLocation {
  city:      string;
  country:   string;
  latitude:  number;
  longitude: number;
}

export interface Place {
  id:          string;
  name:        string;
  description: string;
  category:    PlaceCategory;
  location:    PlaceLocation;
  rating:      number;
  reviewCount: number;
  priceRange:  PriceRange;
  tags:        string[];
  isVerified:  boolean;
  reports:     Report[];
  imageUrl?:   string;
}

export interface FilterOptions {
  categories:   PlaceCategory[];
  priceRange:   PriceRange[];
  rating:       number;
  distance:     number;
  verifiedOnly: boolean;
}