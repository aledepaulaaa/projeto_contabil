import { create } from 'zustand';

interface AuthState {
  token: string | null;
  empresaLocatariaId: string | null;
  isAuthenticated: boolean;
  login: (token: string, empresaLocatariaId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  empresaLocatariaId: localStorage.getItem('empresaLocatariaId'),
  isAuthenticated: !!localStorage.getItem('token'),
  login: (token, empresaLocatariaId) => {
    localStorage.setItem('token', token);
    localStorage.setItem('empresaLocatariaId', empresaLocatariaId);
    set({ token, empresaLocatariaId, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('empresaLocatariaId');
    set({ token: null, empresaLocatariaId: null, isAuthenticated: false });
  },
}));
