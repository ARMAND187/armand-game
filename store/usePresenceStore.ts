import { create } from 'zustand';

export interface PresenceUser {
  userId: string;
  status: 'online' | 'in-game';
}

interface PresenceState {
  onlineCount: number;
  activeUsers: PresenceUser[];
  setOnlineCount: (count: number) => void;
  setActiveUsers: (users: PresenceUser[]) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineCount: 0,
  activeUsers: [],
  setOnlineCount: (count) => set({ onlineCount: count }),
  setActiveUsers: (users) => set({ activeUsers: users }),
}));
