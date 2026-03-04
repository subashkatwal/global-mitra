import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Tokens } from '@/types';

interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
  login: (user: User, tokens: Tokens) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setTokens: (tokens: Tokens) => void;
  // Stores tokens for a guide after OTP verification so they can
  // hit /guides/profile/complete (which requires IsAuthenticated)
  // without being considered "fully logged in" yet.
  setPendingGuideTokens: (tokens: Tokens) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,

      login: (user: User, tokens: Tokens) => {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        set({ user, tokens, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, tokens: null, isAuthenticated: false });
      },

      setUser: (user: User) => set({ user }),

      setTokens: (tokens: Tokens) => {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        set({ tokens, isAuthenticated: true });
      },

      // Stores tokens + basic user for guide profile completion step.
      // Does NOT set isAuthenticated: true — guide is not fully active yet.
      setPendingGuideTokens: (tokens: Tokens) => {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        set({ tokens });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);