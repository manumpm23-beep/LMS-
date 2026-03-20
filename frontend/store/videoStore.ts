import { create } from 'zustand';

interface VideoState {
  currentVideo: string | null;
  setCurrentVideo: (id: string) => void;
}

export const useVideoStore = create<VideoState>((set) => ({
  currentVideo: null,
  setCurrentVideo: (id) => set({ currentVideo: id }),
}));