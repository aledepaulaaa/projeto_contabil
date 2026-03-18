import { create } from 'zustand';

interface GlobalErrorState {
  hasError: boolean;
  message: string | null;
  code: string | number | null;
  setError: (message: string, code?: string | number | null) => void;
  clearError: () => void;
}

export const useGlobalErrorStore = create<GlobalErrorState>((set) => ({
  hasError: false,
  message: null,
  code: null,
  setError: (message, code = null) => set({ hasError: true, message, code }),
  clearError: () => set({ hasError: false, message: null, code: null }),
}));
