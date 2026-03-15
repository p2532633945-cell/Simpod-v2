/**
 * AudioContext 对象池
 *
 * 解决问题：
 * - 每次音频处理都创建新的 AudioContext，导致内存泄漏
 * - 浏览器限制 AudioContext 数量（通常 6-32 个）
 *
 * 方案：
 * - 复用 AudioContext 实例
 * - 自动清理未使用的实例
 * - 监控内存使用
 */

export interface AudioContextPoolConfig {
  maxContexts?: number;
  idleTimeout?: number; // 毫秒
  enableMonitoring?: boolean;
}

interface PooledContext {
  context: AudioContext;
  lastUsed: number;
  inUse: boolean;
  createdAt: number;
}

/**
 * AudioContext 对象池
 */
export class AudioContextPool {
  private pool: Map<string, PooledContext> = new Map();
  private maxContexts: number;
  private idleTimeout: number;
  private enableMonitoring: boolean;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: AudioContextPoolConfig = {}) {
    this.maxContexts = config.maxContexts || 4;
    this.idleTimeout = config.idleTimeout || 5 * 60 * 1000; // 5 分钟
    this.enableMonitoring = config.enableMonitoring ?? true;

    if (this.enableMonitoring) {
      this.startCleanupInterval();
    }

    console.log('[AudioContextPool] Initialized with maxContexts:', this.maxContexts);
  }

  /**
   * 获取或创建 AudioContext
   */
  getContext(): AudioContext {
    // 尝试复用空闲的 context
    for (const [id, pooled] of this.pool.entries()) {
      if (!pooled.inUse) {
        pooled.inUse = true;
        pooled.lastUsed = Date.now();
        console.log('[AudioContextPool] Reusing context:', id);
        return pooled.context;
      }
    }

    // 如果达到最大数量，清理最旧的空闲 context
    if (this.pool.size >= this.maxContexts) {
      this.evictOldest();
    }

    // 创建新的 context
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const id = `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    this.pool.set(id, {
      context,
      lastUsed: Date.now(),
      inUse: true,
      createdAt: Date.now(),
    });

    console.log('[AudioContextPool] Created new context:', id, 'Total:', this.pool.size);
    return context;
  }

  /**
   * 释放 AudioContext
   */
  releaseContext(context: AudioContext): void {
    for (const [id, pooled] of this.pool.entries()) {
      if (pooled.context === context) {
        pooled.inUse = false;
        pooled.lastUsed = Date.now();
        console.log('[AudioContextPool] Released context:', id);
        return;
      }
    }
  }

  /**
   * 清理最旧的空闲 context
   */
  private evictOldest(): void {
    let oldestId: string | null = null;
    let oldestTime = Date.now();

    for (const [id, pooled] of this.pool.entries()) {
      if (!pooled.inUse && pooled.lastUsed < oldestTime) {
        oldestId = id;
        oldestTime = pooled.lastUsed;
      }
    }

    if (oldestId) {
      const pooled = this.pool.get(oldestId)!;
      this.closeContext(pooled.context);
      this.pool.delete(oldestId);
      console.log('[AudioContextPool] Evicted oldest context:', oldestId);
    }
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
   * 清理超时的空闲 context
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [id, pooled] of this.pool.entries()) {
      if (!pooled.inUse && now - pooled.lastUsed > this.idleTimeout) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      const pooled = this.pool.get(id)!;
      this.closeContext(pooled.context);
      this.pool.delete(id);
      console.log('[AudioContextPool] Cleaned up idle context:', id);
    }

    if (toDelete.length > 0) {
      console.log('[AudioContextPool] Cleanup complete. Remaining:', this.pool.size);
    }
  }

  /**
   * 关闭 AudioContext
   */
  private closeContext(context: AudioContext): void {
    try {
      if (context.state !== 'closed') {
        context.close();
      }
    } catch (error) {
      console.error('[AudioContextPool] Error closing context:', error);
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    total: number;
    inUse: number;
    idle: number;
    maxContexts: number;
  } {
    let inUse = 0;
    let idle = 0;

    for (const pooled of this.pool.values()) {
      if (pooled.inUse) {
        inUse++;
      } else {
        idle++;
      }
    }

    return {
      total: this.pool.size,
      inUse,
      idle,
      maxContexts: this.maxContexts,
    };
  }

  /**
   * 清空所有 context
   */
  clear(): void {
    for (const pooled of this.pool.values()) {
      this.closeContext(pooled.context);
    }
    this.pool.clear();
    console.log('[AudioContextPool] Cleared all contexts');
  }

  /**
   * 销毁对象池
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    console.log('[AudioContextPool] Destroyed');
  }
}

// 全局单例
let globalPool: AudioContextPool | null = null;

/**
 * 获取全局 AudioContext 对象池
 */
export function getAudioContextPool(): AudioContextPool {
  if (!globalPool) {
    globalPool = new AudioContextPool({
      maxContexts: 4,
      idleTimeout: 5 * 60 * 1000,
      enableMonitoring: true,
    });
  }
  return globalPool;
}

/**
 * 销毁全局对象池
 */
export function destroyAudioContextPool(): void {
  if (globalPool) {
    globalPool.destroy();
    globalPool = null;
  }
}
