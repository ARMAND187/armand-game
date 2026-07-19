import { create } from 'zustand';

interface AuthState {
  isVerified: boolean | null; // null means loading/unknown
  setIsVerified: (verified: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isVerified: null,
  setIsVerified: (verified) => set({ isVerified: verified }),
}));
