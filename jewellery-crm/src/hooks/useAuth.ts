/**
 * useAuth Hook
 * 
 * Authentication hook with role-based access and localStorage persistence.
 * 
 * Key Features:
 * - User state management
 * - Role-based access
 * - Local storage persistence
 * - Multiple user roles support
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '@/lib/api-service';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  name: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  tenant?: number | null;
  store?: number;
  tenant_name?: string;
  store_name?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshTokenString: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  setUser: (user: User) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuth = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshTokenString: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isHydrated: false,

      login: async (username: string, password: string) => {
        try {
          // Clear any existing tokens before login attempt
          set({ 
            isLoading: true, 
            error: null, 
            token: null, 
            refreshTokenString: null,
            isAuthenticated: false 
          });
          
          // Clear localStorage to remove any stale tokens
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-storage');
          }
          
          const response = await apiService.login(username, password);
          
          if (response.success) {
            // The response from login API has the data directly, not wrapped in a data property
            const loginData = response as any;
            set({
              user: loginData.user,
              token: loginData.token,
              refreshTokenString: loginData.refresh,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.message || 'Login failed',
            });
            return false;
          }
        } catch (error: any) {
          console.error('Login error:', error);
          set({
            isLoading: false,
            error: error.message || 'Login failed',
          });
          return false;
        }
      },

      logout: async () => {
        try {
          await apiService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            refreshTokenString: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      refreshToken: async () => {
        try {
          const { refreshTokenString } = get();
          
          if (!refreshTokenString) {
            return false;
          }
          
          // For now, we'll just return false and let the user login again
          // In a real app, you'd implement token refresh logic here
          return false;
        } catch (error) {
          console.error('Token refresh error:', error);
          set({
            user: null,
            token: null,
            refreshTokenString: null,
            isAuthenticated: false,
          });
          return false;
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshTokenString: state.refreshTokenString,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
        }
      },
    }
  )
);