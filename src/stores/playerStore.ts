"use client"

import { create } from "zustand"
import type { PlayerState, Hotzone } from "@/types/simpod"

// P6-3: 热区时间范围档位
export type HotzoneRange = 'tight' | 'normal' | 'wide'

// Mini Player 当前播放信息
export interface CurrentEpisodeInfo {
  audioId: string
  audioUrl: string
  title: string
  artwork?: string
  podcastTitle?: string
  feedUrl?: string
  episodeTitle?: string
  podcastPageUrl?: string  // 用于返回按钮的完整播客页面 URL
}

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

  // P6-3: 热区时间范围档位
  hotzoneRange: HotzoneRange
  setHotzoneRange: (range: HotzoneRange) => void

  // P6-2: 即时回溯模式
  instantReplayMode: boolean
  setInstantReplayMode: (enabled: boolean) => void
  toggleInstantReplayMode: () => void

  // Mini Player: 当前播放集信息
  currentEpisodeInfo: CurrentEpisodeInfo | null
  setCurrentEpisodeInfo: (info: CurrentEpisodeInfo | null) => void
  
  // 清理方法
  cleanup: () => void
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // Initial state
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  // P6-W2 Task 2.1: 倍速记忆 — SSR 时用默认值 1，客户端 mount 后在 PodcastPlayerPage 同步
  playbackRate: 1,
  volume: 1,
  hotzones: [],
  audioRef: null,

  // Mini Player
  currentEpisodeInfo: null,

  // P6-3: 热区时间范围档位
  // 注意：SSR 时始终用默认值，客户端 mount 后通过 setHotzoneRange 从 localStorage 同步
  // 避免 SSR/Client className 不一致导致 hydration mismatch
  hotzoneRange: 'normal' as HotzoneRange,

  // P6-2: 即时回溯模式
  instantReplayMode: false,

  // Time actions
  setCurrentTime: (time) => set({ currentTime: time }),
  
  setIsPlaying: (playing) => {
    const { audioRef } = get()
    if (audioRef) {
      if (playing) {
        audioRef.play().catch((err) => {
          console.error('[PlayerStore] Failed to play audio:', err)
          set({ isPlaying: false })
        })
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
    // P6-W2 Task 2.1: 倍速记忆 — 持久化到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('simpod_playback_rate', String(rate))
    }
    console.log('[PlayerStore] Playback rate set to:', rate)
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
  setHotzones: (hotzones) => set(() => {
    // 去重：防止 StrictMode 双重执行或竞态导致重复 id
    const seen = new Set<string>()
    return {
      hotzones: hotzones.filter(hz => {
        if (seen.has(hz.id)) return false
        seen.add(hz.id)
        return true
      })
    }
  }),
  
  addHotzone: (hotzone) => set((state) => ({
    // 防止重复添加相同 id 的热区（扩展逻辑可能返回已有 id）
    hotzones: state.hotzones.some(h => h.id === hotzone.id)
      ? state.hotzones.map(h => h.id === hotzone.id ? hotzone : h)
      : [...state.hotzones, hotzone]
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
  setAudioRef: (ref) => {
    const { audioRef: oldRef } = get()
    // 替换前先暂停旧的 audio 元素，防止双声道
    if (oldRef && oldRef !== ref) {
      console.log('[PlayerStore] Replacing audioRef — pausing old audio element')
      oldRef.pause()
    }
    set({ audioRef: ref })
  },

  // P6-3: 热区时间范围档位
  setHotzoneRange: (range) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('simpod_hotzone_range', range)
    }
    set({ hotzoneRange: range })
  },

  // P6-2: 即时回溯模式
  setInstantReplayMode: (enabled) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('simpod_instant_replay', String(enabled))
    }
    set({ instantReplayMode: enabled })
  },

  toggleInstantReplayMode: () => {
    const { instantReplayMode, setInstantReplayMode } = get()
    setInstantReplayMode(!instantReplayMode)
  },

  // Mini Player
  setCurrentEpisodeInfo: (info) => set({ currentEpisodeInfo: info }),

  // 清理方法：重置状态并清理资源
  cleanup: () => {
    const { audioRef } = get()
    if (audioRef) {
      audioRef.pause()
      audioRef.currentTime = 0
    }
    set({
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      playbackRate: 1,
      volume: 1,
      hotzones: [],
      audioRef: null,
    })
  },
}))
