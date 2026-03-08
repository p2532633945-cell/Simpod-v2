import { create } from 'zustand';

interface PlayerState {
  currentTime: number;
  isPlaying: boolean;
  audioUrl: string | null;
  duration: number;
  volume: number;
  playbackRate: number;

  // Actions
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setAudioUrl: (url: string | null) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;

  // Helpers
  togglePlay: () => void;
  seekTo: (time: number) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTime: 0,
  isPlaying: false,
  audioUrl: null,
  duration: 0,
  volume: 1.0,
  playbackRate: 1.0,

  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setAudioUrl: (url) => set({ audioUrl: url }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  seekTo: (time) => set({ currentTime: time }),

  reset: () =>
    set({
      currentTime: 0,
      isPlaying: false,
      audioUrl: null,
      duration: 0,
      volume: 1.0,
      playbackRate: 1.0,
    }),
}));
