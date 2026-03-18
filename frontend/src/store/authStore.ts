import { create } from 'zustand';

interface AuthState {
  token: string | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  login: (token: string, tenantId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  tenantId: localStorage.getItem('tenantId'),
  isAuthenticated: !!localStorage.getItem('token'),
  login: (token, tenantId) => {
    localStorage.setItem('token', token);
    localStorage.setItem('tenantId', tenantId);
    set({ token, tenantId, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    set({ token: null, tenantId: null, isAuthenticated: false });
  },
}));
