import { create } from 'zustand';
import type { Post, Comment, Notification } from '@/types';

interface SocialState {
  posts: Post[];
  notifications: Notification[];
  isLoading: boolean;
  
  // Actions
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
  savePost: (postId: string) => void;
  unsavePost: (postId: string) => void;
  addComment: (postId: string, comment: Comment) => void;
  likeComment: (postId: string, commentId: string) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  getUnreadCount: () => number;
}

// Mock posts data
const mockPosts: Post[] = [
  {
    id: '1',
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
    placeId: '1',
    content: 'Sunset at Tanah Lot was absolutely magical! 🌅 Arrived at 5:30PM and got the perfect spot. The colors were unreal! #bali #sunset #travel',
    images: [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop'
    ],
    tags: ['bali', 'sunset', 'travel', 'indonesia'],
    likes: 234,
    comments: [
      {
        id: 'c1',
        postId: '1',
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
        content: 'Going next week! Is it crowded?',
        likes: 5,
        replies: [],
        createdAt: new Date('2024-02-05T14:30:00')
      }
    ],
    createdAt: new Date('2024-02-05T10:00:00'),
    isLiked: false,
    isSaved: false
  },
  {
    id: '2',
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
    placeId: '5',
    content: 'Just submitted a report about the new trail conditions at Everest Base Camp. The weather is perfect this season! 🏔️ #nepal #trekking #everest',
    images: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop'
    ],
    tags: ['nepal', 'trekking', 'everest', 'himalaya'],
    likes: 456,
    comments: [],
    createdAt: new Date('2024-02-04T16:00:00'),
    isLiked: false,
    isSaved: false
  },
  {
    id: '3',
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
    content: 'Hidden gem alert! 🚨 Found this amazing local café in Lisbon that serves the best pastel de nata. No tourists, just locals! #lisbon #foodie #hiddengem',
    images: [
      'https://images.unsplash.com/photo-1559563362-c667ba5f5480?w=800&h=600&fit=crop'
    ],
    tags: ['lisbon', 'foodie', 'hiddengem', 'portugal'],
    likes: 189,
    comments: [],
    createdAt: new Date('2024-02-03T12:00:00'),
    isLiked: false,
    isSaved: false
  }
];

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    type: 'report_approved',
    title: 'Report Approved!',
    message: 'Your report about Tanah Lot has been verified and approved.',
    isRead: false,
    createdAt: new Date('2024-02-05T12:00:00')
  },
  {
    id: '2',
    userId: '1',
    type: 'new_comment',
    title: 'New Comment',
    message: 'Marcus commented on your post about Bali.',
    isRead: false,
    createdAt: new Date('2024-02-05T14:30:00')
  },
  {
    id: '3',
    userId: '1',
    type: 'badge_earned',
    title: 'New Badge!',
    message: 'You earned the "Explorer" badge!',
    isRead: true,
    createdAt: new Date('2024-02-01T10:00:00')
  }
];

export const useSocialStore = create<SocialState>((set, get) => ({
  posts: mockPosts,
  notifications: mockNotifications,
  isLoading: false,

  setPosts: (posts) => set({ posts }),

  addPost: (post) => {
    set(state => ({ posts: [post, ...state.posts] }));
  },

  likePost: (postId) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === postId
          ? { ...post, likes: post.likes + 1, isLiked: true }
          : post
      )
    }));
  },

  unlikePost: (postId) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === postId
          ? { ...post, likes: post.likes - 1, isLiked: false }
          : post
      )
    }));
  },

  savePost: (postId) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === postId
          ? { ...post, isSaved: true }
          : post
      )
    }));
  },

  unsavePost: (postId) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === postId
          ? { ...post, isSaved: false }
          : post
      )
    }));
  },

  addComment: (postId, comment) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === postId
          ? { ...post, comments: [...post.comments, comment] }
          : post
      )
    }));
  },

  likeComment: (postId, commentId) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.map(comment =>
                comment.id === commentId
                  ? { ...comment, likes: comment.likes + 1, isLiked: true }
                  : comment
              )
            }
          : post
      )
    }));
  },

  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications]
    }));
  },

  markNotificationRead: (notificationId) => {
    set(state => ({
      notifications: state.notifications.map(notif =>
        notif.id === notificationId
          ? { ...notif, isRead: true }
          : notif
      )
    }));
  },

  markAllNotificationsRead: () => {
    set(state => ({
      notifications: state.notifications.map(notif => ({ ...notif, isRead: true }))
    }));
  },

  getUnreadCount: () => {
    return get().notifications.filter(n => !n.isRead).length;
  }
}));
