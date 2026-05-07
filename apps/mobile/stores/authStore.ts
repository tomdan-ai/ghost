import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '@ghost/shared-types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: true }),

  setToken: async (token) => {
    await SecureStore.setItemAsync('auth_token', token);
    set({ token, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadSession: async () => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      set({ token, isAuthenticated: true });
    }
  },
}));
