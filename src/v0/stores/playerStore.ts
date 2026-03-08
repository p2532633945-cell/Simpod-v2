"use client"

import { create } from "zustand"
import type { PlayerState, Hotzone } from "@/types/simpod"

interface PlayerStore extends PlayerState {
  // Actions
  setCurrentTime: (time: number) => void
  setIsPlaying: (playing: boolean) => void
  togglePlay: () => void
  setPlaybackRate: (rate: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  seek: (time: number) => void
  skipForward: (seconds?: number) => void
  skipBackward: (seconds?: number) => void
  
  // Hotzone actions
  hotzones: Hotzone[]
  setHotzones: (hotzones: Hotzone[]) => void
  addHotzone: (hotzone: Hotzone) => void
  removeHotzone: (id: string) => void
  updateHotzone: (id: string, updates: Partial<Hotzone>) => void
  
  // Audio element ref
  audioRef: HTMLAudioElement | null
  setAudioRef: (ref: HTMLAudioElement | null) => void
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // Initial state
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  playbackRate: 1,
  volume: 1,
  hotzones: [],
  audioRef: null,

  // Time actions
  setCurrentTime: (time) => set({ currentTime: time }),
  
  setIsPlaying: (playing) => {
    const { audioRef } = get()
    if (audioRef) {
      if (playing) {
        audioRef.play().catch(console.error)
      } else {
        audioRef.pause()
      }
    }
    set({ isPlaying: playing })
  },
  
  togglePlay: () => {
    const { isPlaying, setIsPlaying } = get()
    setIsPlaying(!isPlaying)
  },
  
  setPlaybackRate: (rate) => {
    const { audioRef } = get()
    if (audioRef) {
      audioRef.playbackRate = rate
    }
    set({ playbackRate: rate })
  },
  
  setDuration: (duration) => set({ duration }),
  
  setVolume: (volume) => {
    const { audioRef } = get()
    if (audioRef) {
      audioRef.volume = volume
    }
    set({ volume })
  },
  
  seek: (time) => {
    const { audioRef, duration } = get()
    const clampedTime = Math.max(0, Math.min(time, duration))
    if (audioRef) {
      audioRef.currentTime = clampedTime
    }
    set({ currentTime: clampedTime })
  },
  
  skipForward: (seconds = 15) => {
    const { currentTime, seek } = get()
    seek(currentTime + seconds)
  },
  
  skipBackward: (seconds = 15) => {
    const { currentTime, seek } = get()
    seek(currentTime - seconds)
  },

  // Hotzone actions
  setHotzones: (hotzones) => set({ hotzones }),
  
  addHotzone: (hotzone) => set((state) => ({ 
    hotzones: [...state.hotzones, hotzone] 
  })),
  
  removeHotzone: (id) => set((state) => ({
    hotzones: state.hotzones.filter((h) => h.id !== id)
  })),
  
  updateHotzone: (id, updates) => set((state) => ({
    hotzones: state.hotzones.map((h) => 
      h.id === id ? { ...h, ...updates } : h
    )
  })),

  // Audio ref
  setAudioRef: (ref) => set({ audioRef: ref }),
}))
