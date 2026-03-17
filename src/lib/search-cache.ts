/**
 * 搜索结果缓存 - P4-5 性能优化
 * 
 * 缓存 iTunes 搜索结果，减少重复搜索的延迟
 * 缓存时间：1 小时
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const CACHE_TTL = 60 * 60 * 1000 // 1 小时

class SearchCache {
  private cache = new Map<string, CacheEntry<any>>()

  /**
   * 生成缓存键
   */
  private generateKey(query: string, type: string): string {
    return `${type}:${query.toLowerCase()}`
  }

  /**
   * 获取缓存
   */
  get<T>(query: string, type: string): T | null {
    const key = this.generateKey(query, type)
    const entry = this.cache.get(key)

    if (!entry) {
      console.log(`[SearchCache] Cache miss: ${key}`)
      return null
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      console.log(`[SearchCache] Cache expired: ${key}`)
      this.cache.delete(key)
      return null
    }

    console.log(`[SearchCache] Cache hit: ${key}`)
    return entry.data as T
  }

  /**
   * 设置缓存
   */
  set<T>(query: string, type: string, data: T): void {
    const key = this.generateKey(query, type)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
    console.log(`[SearchCache] Cached: ${key}`)
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
    console.log('[SearchCache] Cache cleared')
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
      })),
    }
  }
}

// 单例
export const searchCache = new SearchCache()
