import { create } from 'zustand';
import type { Post } from '@/types';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token') ?? localStorage.getItem('token') ?? '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchNotificationsFromAPI(): Promise<any[]> {
  try {
    const res = await fetch('/api/v1/reports/notifications', {
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const raw: any[] = Array.isArray(data) ? data : (data.results ?? data.data ?? []);
    return raw.map(normalizeNotification);
  } catch {
    return [];
  }
}

async function markNotificationReadOnAPI(id: string): Promise<void> {
  try {
    await fetch(`/api/v1/reports/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    });
  } catch { /* optimistic update already applied */ }
}

async function markAllNotificationsReadOnAPI(): Promise<void> {
  try {
    await fetch('/api/v1/reports/notifications/read-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    });
  } catch { /* optimistic update already applied */ }
}

function normalizeNotification(n: any): any {
  return {
    id:               String(n.id),
    type:             n.notificationType ?? n.notification_type ?? n.type ?? 'NEW_INCIDENT',
    notificationType: n.notificationType ?? n.notification_type ?? n.type ?? 'NEW_INCIDENT',
    title:            n.title   ?? '',
    message:          n.message ?? '',
    isRead:           n.isRead  ?? n.is_read ?? false,
    severity:         n.severity ?? n.meta?.severity ?? '',
    createdAt:        n.createdAt ?? n.created_at ?? new Date().toISOString(),
    meta:             n.meta ?? null,
    latitude:         n.latitude  ?? null,
    longitude:        n.longitude ?? null,
  };
}

interface SocialState {
  posts: Post[];
  notifications: any[];
  isLoading: boolean;
  notificationsLoading: boolean;

  setPosts:       (posts: Post[]) => void;
  addPost:        (post: Post) => void;
  updatePost:     (postId: string, patch: Partial<Post>) => void;
  removePost:     (postId: string) => void;
  bookmarkPost:   (postId: string) => void;
  unbookmarkPost: (postId: string) => void;

  fetchNotifications:       () => Promise<void>;
  addNotification:          (notification: any) => void;
  markNotificationRead:     (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  clearAllNotifications: () => Promise<void>;
  getUnreadCount:           () => number;
}


export const useSocialStore = create<SocialState>((set, get) => ({
  posts:                [],
  notifications:        [],
  isLoading:            false,
  notificationsLoading: false,


  setPosts: (posts) => set({ posts }),

  addPost: (post) => set(state => ({ posts: [post, ...state.posts] })),

  updatePost: (postId, patch) => set(state => ({
    posts: state.posts.map(p => p.id === postId ? { ...p, ...patch } : p),
  })),

  removePost: (postId) => set(state => ({
    posts: state.posts.filter(p => p.id !== postId),
  })),

  // Optimistic bookmark toggle — uses your exact Post type fields
  bookmarkPost: (postId) => set(state => ({
    posts: state.posts.map(p =>
      p.id === postId
        ? { ...p, isBookmarkedByMe: true, bookmarkCount: p.bookmarkCount + 1 }
        : p
    ),
  })),

  unbookmarkPost: (postId) => set(state => ({
    posts: state.posts.map(p =>
      p.id === postId
        ? { ...p, isBookmarkedByMe: false, bookmarkCount: Math.max(0, p.bookmarkCount - 1) }
        : p
    ),
  })),

  fetchNotifications: async () => {
    set({ notificationsLoading: true });
    const fetched = await fetchNotificationsFromAPI();
    set({ notifications: fetched, notificationsLoading: false });
  },

  addNotification: (notification) => set(state => ({
    notifications: [notification, ...state.notifications],
  })),

  markNotificationRead: (notificationId) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
    }));
    markNotificationReadOnAPI(notificationId);
  },

  markAllNotificationsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
    }));
    markAllNotificationsReadOnAPI();
  },

  clearAllNotifications: async () => {
  const { notifications } = get();
  // optimistic clear
  set({ notifications: [] });
  // delete each from backend
  await Promise.allSettled(
    notifications.map(n =>
      fetch(`/api/v1/reports/notifications/${n.id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      })
    )
  );
},

  getUnreadCount: () => get().notifications.filter(n => !n.isRead).length,
}));

let _pollInterval: ReturnType<typeof setInterval> | null = null;

export function startNotificationPolling() {
  if (_pollInterval) return; // already running
  _pollInterval = setInterval(() => {
    const token = localStorage.getItem('access_token') ?? localStorage.getItem('token');
    if (!token) return;
    useSocialStore.getState().fetchNotifications();
  }, 30_000); // every 30 seconds
}

export function stopNotificationPolling() {
  if (_pollInterval) {
    clearInterval(_pollInterval);
    _pollInterval = null;
  }
}