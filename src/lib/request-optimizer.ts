/**
 * 网络请求优化工具
 *
 * 提供：
 * - 请求去重（防止重复请求）
 * - 请求合并（批量处理）
 * - 请求缓存（短期缓存）
 * - 智能预加载
 */

export interface RequestOptions {
  timeout?: number;
  cache?: boolean;
  cacheTTL?: number;
  dedup?: boolean;
}

interface CachedRequest {
  data: unknown;
  timestamp: number;
  ttl: number;
}

/**
 * 请求去重和缓存管理器
 */
export class RequestDeduplicator {
  private cache = new Map<string, CachedRequest>();
  private pending = new Map<string, Promise<unknown>>();
  private defaultCacheTTL: number;

  constructor(defaultCacheTTL: number = 60000) {
    this.defaultCacheTTL = defaultCacheTTL;
  }

  /**
   * 执行请求（带去重和缓存）
   */
  async execute<T>(
    key: string,
    fn: () => Promise<T>,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      cache = true,
      cacheTTL = this.defaultCacheTTL,
      dedup = true,
    } = options;

    // 检查缓存
    if (cache) {
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        console.log(`[RequestDedup] Cache hit: ${key}`);
        return cached.data as T;
      }
    }

    // 检查待处理的请求（去重）
    if (dedup) {
      const pending = this.pending.get(key);
      if (pending) {
        console.log(`[RequestDedup] Dedup: ${key}`);
        return pending as Promise<T>;
      }
    }

    // 创建新请求
    const promise = fn().then(data => {
      // 缓存结果
      if (cache) {
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl: cacheTTL,
        });
      }
      return data;
    }).finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise as Promise<T>;
  }

  /**
   * 清除缓存
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      console.log(`[RequestDedup] Cleared cache: ${key}`);
    } else {
      this.cache.clear();
      console.log('[RequestDedup] Cleared all cache');
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    cacheSize: number;
    pendingSize: number;
  } {
    return {
      cacheSize: this.cache.size,
      pendingSize: this.pending.size,
    };
  }
}

/**
 * 请求批处理器
 */
export class RequestBatcher<T, R> {
  private queue: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private batchSize: number;
  private batchDelay: number;
  private batchFn: (items: T[]) => Promise<R[]>;

  constructor(
    batchFn: (items: T[]) => Promise<R[]>,
    batchSize: number = 10,
    batchDelay: number = 100
  ) {
    this.batchFn = batchFn;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
  }

  /**
   * 添加项目到批处理队列
   */
  async add(item: T): Promise<void> {
    this.queue.push(item);

    if (this.queue.length >= this.batchSize) {
      await this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flush().catch(error => {
          console.error('[RequestBatcher] Batch processing failed:', error);
        });
      }, this.batchDelay);
    }
  }

  /**
   * 立即处理批次
   */
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) {
      return;
    }

    const items = this.queue.splice(0, this.batchSize);
    console.log(`[RequestBatcher] Processing batch of ${items.length} items`);

    try {
      await this.batchFn(items);
    } catch (error) {
      console.error('[RequestBatcher] Batch processing failed:', error);
      throw error;
    }
  }

  /**
   * 获取队列大小
   */
  getQueueSize(): number {
    return this.queue.length;
  }
}

/**
 * 智能预加载器
 */
export class SmartPreloader {
  private preloadQueue: Array<() => Promise<unknown>> = [];
  private isPreloading = false;
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * 添加预加载任务
   */
  preload(fn: () => Promise<unknown>): void {
    this.preloadQueue.push(fn);
    this.processQueue();
  }

  /**
   * 处理预加载队列
   */
  private async processQueue(): Promise<void> {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return;
    }

    this.isPreloading = true;

    try {
      while (this.preloadQueue.length > 0) {
        const batch = this.preloadQueue.splice(0, this.maxConcurrent);
        const promises = batch.map(fn => fn().catch(error => {
          console.warn('[SmartPreloader] Preload failed:', error);
        }));

        await Promise.all(promises);
      }
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * 获取队列大小
   */
  getQueueSize(): number {
    return this.preloadQueue.length;
  }
}

let globalDeduplicator: RequestDeduplicator | null = null;

export function getRequestDeduplicator(): RequestDeduplicator {
  if (!globalDeduplicator) {
    globalDeduplicator = new RequestDeduplicator();
  }
  return globalDeduplicator;
}
