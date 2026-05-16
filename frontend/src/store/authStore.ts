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
  setPendingGuideTokens: (tokens: Tokens) => void;
  // Add this to force clear persisted state
  _clearPersistedState: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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
        localStorage.removeItem('auth-storage'); 
    
        set({ 
          user: null, 
          tokens: null, 
          isAuthenticated: false 
        });
        
    
        get()._clearPersistedState();
      },

      setUser: (user: User) => set({ user }),

      setTokens: (tokens: Tokens) => {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        set({ tokens, isAuthenticated: true });
      },

      setPendingGuideTokens: (tokens: Tokens) => {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        set({ tokens });
      },

      _clearPersistedState: () => {
  
        const storage = createJSONStorage(() => localStorage);
        storage.removeItem('auth-storage');
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