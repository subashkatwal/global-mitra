import { create } from 'zustand';
import type { Report } from '@/types';

interface ReportState {
  reports: Report[];
  pendingReports: Report[];
  myReports: Report[];
  isSubmitting: boolean;
  
  // Actions
  submitReport: (report: Omit<Report, 'id' | 'submittedAt' | 'status' | 'likes'>) => Promise<boolean>;
  approveReport: (reportId: string, guideId: string) => void;
  denyReport: (reportId: string, reason: string) => void;
  requestMoreInfo: (reportId: string, questions: string) => void;
  getReportsByPlace: (placeId: string) => Report[];
  getPendingReports: () => Report[];
  getReportsByUser: (userId: string) => Report[];
}

// Mock reports data
const mockReports: Report[] = [
  {
    id: '1',
    placeId: '1',
    userId: '1',
    user: {
      id: '1',
      email: 'demo@globalmitra.com',
      name: 'Sarah Chen',
      username: 'sarah_travels',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      bio: '',
      location: 'San Francisco, CA',
      role: 'traveler',
      travelStyles: [],
      joinedAt: new Date(),
      stats: { placesVisited: 0, reportsSubmitted: 0, reportsApproved: 0, verificationScore: 0, totalLikes: 0 },
      badges: [],
      trustScore: 87,
      isVerified: true,
      following: [],
      followers: []
    },
    type: 'photo_update',
    title: 'New sunset viewpoint',
    description: 'Found a better spot for sunset photos on the north side of the temple. Less crowded!',
    images: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=300&fit=crop'],
    coordinates: { lat: -8.6215, lng: 115.0865 },
    tags: ['sunset', 'photography', 'less-crowded'],
    crowdLevel: 'moderate',
    status: 'approved',
    submittedAt: new Date('2024-02-05T08:00:00'),
    verifiedAt: new Date('2024-02-05T10:00:00'),
    verifiedBy: '2',
    likes: 24
  },
  {
    id: '2',
    placeId: '5',
    userId: '2',
    user: {
      id: '2',
      email: 'guide@globalmitra.com',
      name: 'Marcus Johnson',
      username: 'marcus_guide',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
      bio: '',
      location: 'Kathmandu, Nepal',
      role: 'guide',
      travelStyles: [],
      joinedAt: new Date(),
      stats: { placesVisited: 0, reportsSubmitted: 0, reportsApproved: 0, verificationScore: 0, totalLikes: 0 },
      badges: [],
      trustScore: 98,
      isVerified: true,
      following: [],
      followers: []
    },
    type: 'status_alert',
    title: 'Trail conditions update',
    description: 'Main trail to EBC is clear but icy in sections. Crampons recommended.',
    images: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=300&fit=crop'],
    coordinates: { lat: 28.0024, lng: 86.8525 },
    tags: ['trekking', 'safety', 'conditions'],
    crowdLevel: 'light',
    status: 'pending',
    submittedAt: new Date('2024-02-05T14:00:00'),
    likes: 0
  },
  {
    id: '3',
    placeId: '2',
    userId: '3',
    user: {
      id: '3',
      email: 'elena@example.com',
      name: 'Elena Rodriguez',
      username: 'elena_travels',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
      bio: '',
      location: 'Barcelona, Spain',
      role: 'traveler',
      travelStyles: [],
      joinedAt: new Date(),
      stats: { placesVisited: 0, reportsSubmitted: 0, reportsApproved: 0, verificationScore: 0, totalLikes: 0 },
      badges: [],
      trustScore: 72,
      isVerified: true,
      following: [],
      followers: []
    },
    type: 'tip_share',
    title: 'Best time to visit Fushimi Inari',
    description: 'Go early at 6AM to avoid crowds. The sunrise through the torii gates is magical!',
    images: ['https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=400&h=300&fit=crop'],
    coordinates: { lat: 34.9671, lng: 135.7727 },
    tags: ['early-morning', 'crowd-free', 'photography'],
    crowdLevel: 'empty',
    status: 'approved',
    submittedAt: new Date('2024-02-04T09:00:00'),
    verifiedAt: new Date('2024-02-04T11:00:00'),
    verifiedBy: '2',
    likes: 56
  }
];

export const useReportStore = create<ReportState>((set, get) => ({
  reports: mockReports,
  pendingReports: mockReports.filter(r => r.status === 'pending'),
  myReports: [],
  isSubmitting: false,

  submitReport: async (reportData) => {
    set({ isSubmitting: true });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newReport: Report = {
      ...reportData,
      id: Date.now().toString(),
      submittedAt: new Date(),
      status: 'pending',
      likes: 0
    };
    
    set(state => ({
      reports: [newReport, ...state.reports],
      pendingReports: [newReport, ...state.pendingReports],
      isSubmitting: false
    }));
    
    return true;
  },

  approveReport: (reportId, guideId) => {
    set(state => ({
      reports: state.reports.map(report =>
        report.id === reportId
          ? { ...report, status: 'approved', verifiedAt: new Date(), verifiedBy: guideId }
          : report
      ),
      pendingReports: state.pendingReports.filter(r => r.id !== reportId)
    }));
  },

  denyReport: (reportId, reason) => {
    set(state => ({
      reports: state.reports.map(report =>
        report.id === reportId
          ? { ...report, status: 'denied', denialReason: reason }
          : report
      ),
      pendingReports: state.pendingReports.filter(r => r.id !== reportId)
    }));
  },

  requestMoreInfo: (reportId) => {
    set(state => ({
      reports: state.reports.map(report =>
        report.id === reportId
          ? { ...report, status: 'needs_info' }
          : report
      )
    }));
  },

  getReportsByPlace: (placeId) => {
    return get().reports.filter(report => report.placeId === placeId);
  },

  getPendingReports: () => {
    return get().pendingReports;
  },

  getReportsByUser: (userId) => {
    return get().reports.filter(report => report.userId === userId);
  }
}));
