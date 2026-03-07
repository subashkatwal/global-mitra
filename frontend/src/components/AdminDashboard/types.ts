// ─── Auth / User ─────────────────────────────────────────────────────────────
export interface User {
  id:          string;
  email:       string;
  fullName:    string;
  phoneNumber?: string;
  photo?:      string | null;
  role:        'TOURIST' | 'GUIDE' | 'ADMIN';
  verified:    boolean;   
  isActive:    boolean;
  createdAt:   string;
  updatedAt:   string;
}


export interface Guide {
  id:                 string;
  licenseNumber:      string;
  licenseIssuedBy:    string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  bio:                string;
  createdAt:          string;
  user?: {
    id:           string;
    fullName:     string;
    email:        string;
    photo:        string | null;
    phoneNumber:  string;
  };
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

export interface Report {
  id:        string;
  userId:    string;
  content:   string;
  createdAt: string;
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