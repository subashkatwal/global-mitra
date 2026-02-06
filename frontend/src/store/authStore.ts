import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, TravelStyle } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  setTravelStyles: (styles: TravelStyle[]) => void;
  addBadge: (badge: any) => void;
  updateStats: (stats: Partial<any>) => void;
}

// Mock users for demo
const mockUsers: User[] = [
  {
    id: '1',
    email: 'demo@globalmitra.com',
    name: 'Sarah Chen',
    username: 'sarah_travels',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    bio: 'Solo traveler exploring the world one city at a time. Photography enthusiast.',
    location: 'San Francisco, CA',
    role: 'traveler',
    travelStyles: ['adventure', 'culture', 'food'],
    joinedAt: new Date('2024-01-15'),
    stats: {
      placesVisited: 24,
      reportsSubmitted: 18,
      reportsApproved: 16,
      verificationScore: 890,
      totalLikes: 342
    },
    badges: [
      { id: '1', name: 'Early Adopter', description: 'Joined during beta', icon: 'star', earnedAt: new Date('2024-01-15'), color: '#FF6B35' },
      { id: '2', name: 'Top Contributor', description: '50+ helpful reports', icon: 'award', earnedAt: new Date('2024-03-20'), color: '#F7B801' }
    ],
    trustScore: 87,
    isVerified: true,
    following: ['2', '3', '4'],
    followers: ['5', '6', '7', '8']
  },
  {
    id: '2',
    email: 'guide@globalmitra.com',
    name: 'Marcus Johnson',
    username: 'marcus_guide',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    bio: 'Professional guide in Nepal and Tibet. 10+ years experience.',
    location: 'Kathmandu, Nepal',
    role: 'guide',
    travelStyles: ['adventure', 'nature'],
    joinedAt: new Date('2023-12-01'),
    stats: {
      placesVisited: 156,
      reportsSubmitted: 89,
      reportsApproved: 87,
      verificationScore: 2450,
      totalLikes: 1203
    },
    badges: [
      { id: '3', name: 'Verified Guide', description: 'Official guide status', icon: 'shield', earnedAt: new Date('2023-12-05'), color: '#2ECC71' },
      { id: '4', name: 'Expert Verifier', description: '100+ verifications', icon: 'check-circle', earnedAt: new Date('2024-02-10'), color: '#004E89' }
    ],
    trustScore: 98,
    isVerified: true,
    following: ['1', '3'],
    followers: ['1', '4', '5', '6', '7', '8', '9', '10']
  }
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const user = mockUsers.find(u => u.email === email);
        
        if (user && password === 'password') {
          set({ user, isAuthenticated: true, isLoading: false });
          return true;
        }
        
        set({ isLoading: false });
        return false;
      },

      register: async (email: string, _password: string, name: string) => {
        set({ isLoading: true });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newUser: User = {
          id: Date.now().toString(),
          email,
          name,
          username: name.toLowerCase().replace(/\s+/g, '_'),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          bio: '',
          location: '',
          role: 'traveler',
          travelStyles: [],
          joinedAt: new Date(),
          stats: {
            placesVisited: 0,
            reportsSubmitted: 0,
            reportsApproved: 0,
            verificationScore: 0,
            totalLikes: 0
          },
          badges: [],
          trustScore: 50,
          isVerified: false,
          following: [],
          followers: []
        };
        
        set({ user: newUser, isAuthenticated: true, isLoading: false });
        return true;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },

      setTravelStyles: (styles) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, travelStyles: styles } });
        }
      },

      addBadge: (badge) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, badges: [...user.badges, badge] } });
        }
      },

      updateStats: (stats) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, stats: { ...user.stats, ...stats } } });
        }
      }
    }),
    {
      name: 'auth-storage'
    }
  )
);
