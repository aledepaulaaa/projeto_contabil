import { create } from 'zustand';

interface GlobalErrorState {
  hasError: boolean;
  message: string | null;
  code: string | number | null;
  protocolo: string | null;
  setError: (message: string, code?: string | number | null, protocolo?: string | null) => void;
  clearError: () => void;
}

export const useGlobalErrorStore = create<GlobalErrorState>((set) => ({
  hasError: false,
  message: null,
  code: null,
  protocolo: null,
  setError: (message, code = null, protocolo = null) => set({ hasError: true, message, code, protocolo }),
  clearError: () => set({ hasError: false, message: null, code: null, protocolo: null }),
}));
