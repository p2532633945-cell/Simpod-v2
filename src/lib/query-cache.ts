/**
 * 查询缓存工具 - Phase 5 性能优化
 * 
 * 避免重复的 Supabase 查询，使用内存缓存
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>()
  
  /**
   * 获取缓存的数据
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }
  
  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }
  
  /**
   * 清除特定缓存
   */
  clear(key: string): void {
    this.cache.delete(key)
  }
  
  /**
   * 清除所有缓存
   */
  clearAll(): void {
    this.cache.clear()
  }
  
  /**
   * 获取缓存统计
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    }
  }
}

export const queryCache = new QueryCache()

/**
 * 带缓存的查询包装器
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000
): Promise<T> {
  // 检查缓存
  const cached = queryCache.get<T>(key)
  if (cached) {
    console.log(`[Cache] HIT: ${key}`)
    return cached
  }
  
  // 执行查询
  console.log(`[Cache] MISS: ${key}`)
  const result = await queryFn()
  
  // 保存到缓存
  queryCache.set(key, result, ttlMs)
  
  return result
}
