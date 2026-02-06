// Global Mitra - Type Definitions

export type UserRole = 'traveler' | 'guide' | 'admin';

export type TravelStyle = 'adventure' | 'relaxation' | 'culture' | 'food' | 'nature' | 'nightlife' | 'budget' | 'luxury';

export type ReportType = 'photo_update' | 'status_alert' | 'tip_share' | 'emergency_warning' | 'new_discovery';

export type ReportStatus = 'pending' | 'approved' | 'denied' | 'needs_info';

export type PlaceCategory = 'beach' | 'mountain' | 'city' | 'historical' | 'nature' | 'food' | 'adventure' | 'hidden_gem';

export type CrowdLevel = 'empty' | 'light' | 'moderate' | 'packed';

export type PriceRange = 'free' | '$' | '$$' | '$$$';

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  location: string;
  role: UserRole;
  travelStyles: TravelStyle[];
  joinedAt: Date;
  stats: UserStats;
  badges: Badge[];
  trustScore: number;
  isVerified: boolean;
  following: string[];
  followers: string[];
}

export interface UserStats {
  placesVisited: number;
  reportsSubmitted: number;
  reportsApproved: number;
  verificationScore: number;
  totalLikes: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  color: string;
}

export interface Place {
  id: string;
  name: string;
  description: string;
  location: {
    country: string;
    city: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  images: string[];
  category: PlaceCategory;
  rating: number;
  reviewCount: number;
  priceRange: PriceRange;
  bestSeason: string;
  avgCostPerDay: number;
  safetyScore: number;
  crowdLevel: CrowdLevel;
  weather: {
    temp: number;
    condition: string;
  };
  tags: string[];
  isVerified: boolean;
  verificationCount: number;
  reports: Report[];
  createdAt: Date;
}

export interface Report {
  id: string;
  placeId: string;
  userId: string;
  user: User;
  type: ReportType;
  title: string;
  description: string;
  images: string[];
  video?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  tags: string[];
  crowdLevel?: CrowdLevel;
  status: ReportStatus;
  submittedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  denialReason?: string;
  likes: number;
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  placeId?: string;
  place?: Place;
  content: string;
  images: string[];
  video?: string;
  tags: string[];
  likes: number;
  comments: Comment[];
  createdAt: Date;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: User;
  content: string;
  likes: number;
  replies: Comment[];
  createdAt: Date;
  isLiked?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'report_approved' | 'report_denied' | 'new_follower' | 'new_comment' | 'post_liked' | 'badge_earned' | 'place_alert' | 'nearby_discovery';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

export interface TripPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  places: Place[];
  startDate?: Date;
  endDate?: Date;
  isPublic: boolean;
  createdAt: Date;
}

export interface ComparisonItem {
  place: Place;
  isSelected: boolean;
}

export interface VerificationQueueItem {
  report: Report;
  distance: number;
  urgency: 'low' | 'medium' | 'high';
}

export interface FilterOptions {
  categories: PlaceCategory[];
  priceRange: PriceRange[];
  rating: number;
  distance: number;
  verifiedOnly: boolean;
}

export interface SearchResult {
  places: Place[];
  posts: Post[];
  users: User[];
}
