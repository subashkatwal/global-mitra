// User types
export type UserRole = 'TOURIST' | 'GUIDE' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  username: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  photo?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuideProfile {
  id: string;
  userId: string;
  licenseNumber: string;
  licenseIssuedBy: string;
  bio: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface Tokens {
  access: string;
  refresh: string;
}



// Destination types
export interface Destination {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  averageCost: number;
  difficulty: 'EASY' | 'MODERATE' | 'HARD' | 'EXTREME';
  bestSeason: string;
  duration: string;
  altitude?: number;
  climate: string;
  safetyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  permitsRequired: boolean;
  crowdLevel: 'EMPTY' | 'LIGHT' | 'MODERATE' | 'PACKED';
  internetAvailability: 'NONE' | 'LIMITED' | 'GOOD';
  activities: string[];
  famousLocalItems: string[];
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

// Post types
export interface Post {
  id: string;
  author: User;
  textContent: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  bookmarkCount: number;
  commentCount: number;
  shareCount: number;
  isBookmarkedByMe: boolean;
}

export interface Comment {
  id: string;
  author: User;
  textContent: string;
  image?: string;
  parent?: string;
  createdAt: string;
  updatedAt: string;
}

export type SharePlatform = 'FACEBOOK' | 'TWITTER' | 'INSTAGRAM' | 'LINKEDIN' | 'WHATSAPP' | 'TELEGRAM' | 'EMAIL' | 'COPY_LINK';

// Report types
export type ReportType = 'photo_update' | 'status_alert' | 'tip_share' | 'emergency_warning' | 'new_discovery';

export interface Report {
  id: string;
  destinationId: string;
  destination?: Destination;
  reporter: User;
  type: ReportType;
  title: string;
  description: string;
  crowdLevel?: 'EMPTY' | 'LIGHT' | 'MODERATE' | 'PACKED';
  tags: string[];
  images: string[];
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

// View types
export type View = 'home' | 'explore' | 'place' | 'community' | 'profile' | 'guide' | 'notifications' | 'report' | 'admin';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}


