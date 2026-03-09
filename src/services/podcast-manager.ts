/**
 * PodcastManager - 统一的播客管理服务
 *
 * 参考 AntennaPod 的订阅管理架构：
 * - parser 模块：RSS 解析
 * - storage 模块：本地缓存
 * - model 模块：数据模型
 */

import { parseFeed } from '@/lib/rss-parser'
import { validateAudioUrl, testAudioUrl } from '@/lib/audio-validator'
import { MOCK_EPISODES } from '@/lib/mock-episodes'

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

interface PodcastWithEpisodes {
  podcast: Podcast
  episodes: Episode[]
}

interface CacheEntry {
  data: PodcastWithEpisodes
  timestamp: number
}

/**
 * PodcastManager 类
 *
 * 管理播客订阅、缓存和搜索
 */
export class PodcastManager {
  private cache = new Map<string, CacheEntry>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 分钟缓存

  /**
   * 获取播客及其剧集（带缓存）
   * RSS 解析失败时使用 mock 数据
   */
  async getPodcast(feedUrl: string, podcastInfo?: { title: string; author: string; artwork: string; description: string }): Promise<PodcastWithEpisodes> {
    // 检查缓存
    const cached = this.cache.get(feedUrl)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('[PodcastManager] Cache hit for:', feedUrl)
      return cached.data
    }

    console.log('[PodcastManager] Fetching podcast:', feedUrl)

    try {
      // 尝试解析 feed
      const result = await parseFeed(feedUrl)

      // 验证音频 URL
      const validEpisodes = result.episodes.map(ep => ({
        ...ep,
        audioUrl: validateAudioUrl(ep.audioUrl).cleanedUrl
      }))

      const data: PodcastWithEpisodes = {
        podcast: {
          id: result.podcast.id,
          title: result.podcast.title,
          author: result.podcast.author,
          feedUrl: result.podcast.feedUrl,
          artwork: result.podcast.artwork,
          description: result.podcast.description,
          source: 'rss' as const
        },
        episodes: validEpisodes
      }

      // 缓存结果
      this.cache.set(feedUrl, {
        data,
        timestamp: Date.now()
      })

      console.log('[PodcastManager] Cached podcast:', data.podcast.title)

      return data
    } catch (error) {
      console.warn('[PodcastManager] RSS parse failed, using mock episodes:', error)

      // Fallback 到 mock 数据
      const data: PodcastWithEpisodes = {
        podcast: {
          id: 'mock-podcast',
          title: podcastInfo?.title || 'Mock Podcast',
          author: podcastInfo?.author || 'Mock Author',
          feedUrl,
          artwork: podcastInfo?.artwork || '',
          description: podcastInfo?.description || '',
          source: 'rss' as const
        },
        episodes: MOCK_EPISODES
      }

      // 不缓存 mock 数据，下次重试真实 feed
      console.log('[PodcastManager] Using mock episodes for testing')

      return data
    }
  }

  /**
   * 搜索剧集
   */
  searchEpisodes(feedUrl: string, query: string): Episode[] {
    const cached = this.cache.get(feedUrl)
    if (!cached) {
      console.warn('[PodcastManager] No cached data for:', feedUrl)
      return []
    }

    const lowerQuery = query.toLowerCase()
    const results = cached.data.episodes.filter(ep =>
      ep.title.toLowerCase().includes(lowerQuery) ||
      ep.description.toLowerCase().includes(lowerQuery)
    )

    console.log('[PodcastManager] Search results:', results.length, 'episodes')

    return results
  }

  /**
   * 获取最近更新的剧集
   */
  getRecentEpisodes(feedUrl: string, limit = 10): Episode[] {
    const cached = this.cache.get(feedUrl)
    if (!cached) return []

    return [...cached.data.episodes]
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, limit)
  }

  /**
   * 清除缓存
   */
  clearCache(feedUrl?: string): void {
    if (feedUrl) {
      this.cache.delete(feedUrl)
      console.log('[PodcastManager] Cleared cache for:', feedUrl)
    } else {
      this.cache.clear()
      console.log('[PodcastManager] Cleared all cache')
    }
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; entries: Array<{ feedUrl: string; age: number }> } {
    const entries = Array.from(this.cache.entries()).map(([feedUrl, entry]) => ({
      feedUrl,
      age: Date.now() - entry.timestamp
    }))

    return {
      size: this.cache.size,
      entries
    }
  }

  /**
   * 预加载播客（可选优化）
   */
  async preloadPodcast(feedUrl: string): Promise<void> {
    console.log('[PodcastManager] Preloading:', feedUrl)
    await this.getPodcast(feedUrl)
  }
}

// 单例导出
export const podcastManager = new PodcastManager()
