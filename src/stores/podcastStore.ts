/**
 * Podcast Store - 播客相关状态管理
 *
 * 参考 AntennaPod 的 playback 模块架构
 * 管理当前播放的播客、剧集和播放列表
 */

import { create } from 'zustand'

// 本地类型定义（避免循环依赖）
interface Podcast {
  id: string
  title: string
  author: string
  feedUrl: string
  artwork: string
  description: string
  source: 'itunes' | 'podcastindex' | 'rss'
}

interface Episode {
  id: string
  title: string
  description: string
  pubDate: string
  audioUrl: string
  duration?: number
  artwork?: string
}

interface PodcastState {
  // 当前播放的播客和剧集
  currentPodcast: Podcast | null
  currentEpisode: Episode | null

  // 播放列表
  queue: Episode[]

  // Actions
  setCurrentPodcast: (podcast: Podcast) => void
  setCurrentEpisode: (episode: Episode) => void
  setQueue: (episodes: Episode[]) => void
  addToQueue: (episode: Episode) => void
  removeFromQueue: (episodeId: string) => void
  clearQueue: () => void

  // 播放控制
  playNext: () => Episode | null
  playPrevious: () => Episode | null
}

export const usePodcastStore = create<PodcastState>((set, get) => ({
  currentPodcast: null,
  currentEpisode: null,
  queue: [],

  setCurrentPodcast: (podcast) => set({ currentPodcast: podcast }),

  setCurrentEpisode: (episode) => set({ currentEpisode: episode }),

  setQueue: (episodes) => set({ queue: episodes }),

  addToQueue: (episode) => set((state) => ({
    queue: [...state.queue, episode]
  })),

  removeFromQueue: (episodeId) => set((state) => ({
    queue: state.queue.filter(ep => ep.id !== episodeId)
  })),

  clearQueue: () => set({ queue: [] }),

  playNext: () => {
    const state = get()
    const currentIndex = state.queue.findIndex(ep => ep.id === state.currentEpisode?.id)
    const nextEpisode = state.queue[currentIndex + 1]
    if (nextEpisode) {
      set({ currentEpisode: nextEpisode })
    }
    return nextEpisode || null
  },

  playPrevious: () => {
    const state = get()
    const currentIndex = state.queue.findIndex(ep => ep.id === state.currentEpisode?.id)
    const prevEpisode = state.queue[currentIndex - 1]
    if (prevEpisode) {
      set({ currentEpisode: prevEpisode })
    }
    return prevEpisode || null
  },
}))
