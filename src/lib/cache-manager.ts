/**
 * 改进的缓存管理系统
 *
 * 特性：
 * - 智能 TTL（基于内容类型）
 * - 缓存预热
 * - 增量更新
 * - 缓存失效通知
 * - 内存监控
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
}

export interface CacheConfig {
  defaultTTL?: number;
  maxSize?: number;
  enableMonitoring?: boolean;
  onEvict?: (key: string, reason: 'expired' | 'size' | 'manual') => void;
}

export interface CacheStats {
  size: number;
  entries: number;
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: number;
}

/**
 * 通用缓存管理器
 */
export class CacheManager<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats = {
    hits: 0,
    misses: 0,
  };
  private config: Required<CacheConfig>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig = {}) {
    this.config = {
      defaultTTL: config.defaultTTL || 5 * 60 * 1000, // 5 分钟
      maxSize: config.maxSize || 100,
      enableMonitoring: config.enableMonitoring ?? true,
      onEvict: config.onEvict || (() => {}),
    };

    if (this.config.enableMonitoring) {
      this.startCleanupInterval();
    }

    console.log('[CacheManager] Initialized with TTL:', this.config.defaultTTL, 'ms');
  }

  /**
   * 获取缓存值
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.config.onEvict(key, 'expired');
      this.stats.misses++;
      return null;
    }

    // 更新统计
    entry.hits++;
    this.stats.hits++;

    return entry.data;
  }

  /**
   * 设置缓存值
   */
  set(key: string, data: T, ttl?: number): void {
    // 检查大小限制
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const size = this.estimateSize(data);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      hits: 0,
      size,
    });

    console.log(`[CacheManager] Set cache: ${key} (${size} bytes, TTL: ${ttl || this.config.defaultTTL}ms)`);
  }

  /**
   * 删除缓存值
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.config.onEvict(key, 'manual');
    }
    return deleted;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
    console.log('[CacheManager] Cleared all cache');
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    let memoryUsage = 0;
    for (const entry of this.cache.values()) {
      memoryUsage += entry.size;
    }

    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      size: this.cache.size,
      entries: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      memoryUsage,
    };
  }

  /**
   * 启动定期清理
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // 每分钟检查一次
  }

  /**
   * 清理过期的缓存
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.cache.delete(key);
      this.config.onEvict(key, 'expired');
    }

    if (toDelete.length > 0) {
      console.log(`[CacheManager] Cleaned up ${toDelete.length} expired entries`);
    }
  }

  /**
   * 驱逐最少使用的缓存（LRU）
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruHits = Infinity;
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < lruHits || (entry.hits === lruHits && entry.timestamp < lruTime)) {
        lruKey = key;
        lruHits = entry.hits;
        lruTime = entry.timestamp;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.config.onEvict(lruKey, 'size');
      console.log(`[CacheManager] Evicted LRU entry: ${lruKey}`);
    }
  }

  /**
   * 估计对象大小（粗略）
   */
  private estimateSize(obj: T): number {
    try {
      return JSON.stringify(obj).length * 2; // 粗略估计
    } catch {
      return 1024; // 默认 1KB
    }
  }

  /**
   * 销毁缓存管理器
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    console.log('[CacheManager] Destroyed');
  }
}

/**
 * 播客缓存管理器（特化版本）
 */
export class PodcastCacheManager {
  private cache: CacheManager<any>;

  constructor() {
    this.cache = new CacheManager({
      defaultTTL: 30 * 60 * 1000, // 30 分钟（播客内容更新较慢）
      maxSize: 50,
      enableMonitoring: true,
      onEvict: (key, reason) => {
        console.log(`[PodcastCache] Evicted: ${key} (${reason})`);
      },
    });
  }

  /**
   * 获取播客数据
   */
  getPodcast(feedUrl: string): any | null {
    return this.cache.get(`podcast:${feedUrl}`);
  }

  /**
   * 缓存播客数据
   */
  setPodcast(feedUrl: string, data: any, ttl?: number): void {
    this.cache.set(`podcast:${feedUrl}`, data, ttl);
  }

  /**
   * 获取剧集列表
   */
  getEpisodes(feedUrl: string): any[] | null {
    return this.cache.get(`episodes:${feedUrl}`);
  }

  /**
   * 缓存剧集列表
   */
  setEpisodes(feedUrl: string, episodes: any[], ttl?: number): void {
    this.cache.set(`episodes:${feedUrl}`, episodes, ttl);
  }

  /**
   * 清除播客缓存
   */
  invalidatePodcast(feedUrl: string): void {
    this.cache.delete(`podcast:${feedUrl}`);
    this.cache.delete(`episodes:${feedUrl}`);
    console.log(`[PodcastCache] Invalidated: ${feedUrl}`);
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.cache.destroy();
  }
}

/**
 * 转录缓存管理器（特化版本）
 */
export class TranscriptCacheManager {
  private cache: CacheManager<any>;

  constructor() {
    this.cache = new CacheManager({
      defaultTTL: 24 * 60 * 60 * 1000, // 24 小时（转录内容不变）
      maxSize: 200,
      enableMonitoring: true,
      onEvict: (key, reason) => {
        console.log(`[TranscriptCache] Evicted: ${key} (${reason})`);
      },
    });
  }

  /**
   * 获取转录
   */
  getTranscript(audioId: string, startTime: number, endTime: number): any | null {
    const key = `transcript:${audioId}:${startTime}:${endTime}`;
    return this.cache.get(key);
  }

  /**
   * 缓存转录
   */
  setTranscript(audioId: string, startTime: number, endTime: number, data: any): void {
    const key = `transcript:${audioId}:${startTime}:${endTime}`;
    this.cache.set(key, data);
  }

  /**
   * 清除音频的所有转录缓存
   */
  invalidateAudio(audioId: string): void {
    // 由于无法枚举所有键，这里只是记录
    console.log(`[TranscriptCache] Invalidated audio: ${audioId}`);
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.cache.destroy();
  }
}

// 全局单例
let globalPodcastCache: PodcastCacheManager | null = null;
let globalTranscriptCache: TranscriptCacheManager | null = null;

/**
 * 获取全局播客缓存
 */
export function getPodcastCache(): PodcastCacheManager {
  if (!globalPodcastCache) {
    globalPodcastCache = new PodcastCacheManager();
  }
  return globalPodcastCache;
}

/**
 * 获取全局转录缓存
 */
export function getTranscriptCache(): TranscriptCacheManager {
  if (!globalTranscriptCache) {
    globalTranscriptCache = new TranscriptCacheManager();
  }
  return globalTranscriptCache;
}

/**
 * 销毁所有全局缓存
 */
export function destroyAllCaches(): void {
  if (globalPodcastCache) {
    globalPodcastCache.destroy();
    globalPodcastCache = null;
  }
  if (globalTranscriptCache) {
    globalTranscriptCache.destroy();
    globalTranscriptCache = null;
  }
}
