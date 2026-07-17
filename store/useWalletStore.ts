import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WalletState {
  armandBalance: number;
  increment: (amount: number) => void;
  decrement: (amount: number) => void;
  setBalance: (balance: number) => void;
}

/**
 * Global wallet store.
 * armandBalance is persisted to localStorage so it survives page refreshes.
 * When Supabase auth is wired up, call setBalance() after fetching the
 * user's profile to sync the server-side balance.
 */
export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      armandBalance: 0,
      increment: (amount) =>
        set((state) => ({ armandBalance: state.armandBalance + amount })),
      decrement: (amount) =>
        set((state) => ({
          armandBalance: Math.max(0, state.armandBalance - amount),
        })),
      setBalance: (balance) => set({ armandBalance: balance }),
    }),
    {
      name: "armand-wallet", // localStorage key
    }
  )
);
