/**
 * 性能监控和优化工具
 *
 * 提供：
 * - 性能指标收集
 * - 内存监控
 * - 网络请求监控
 * - 性能基准测试
 */

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface MemoryMetric {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  percentageUsed: number;
}

export interface NetworkMetric {
  url: string;
  method: string;
  duration: number;
  status: number;
  size: number;
  timestamp: number;
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private memoryMetrics: MemoryMetric[] = [];
  private networkMetrics: NetworkMetric[] = [];
  private maxMetrics: number;

  constructor(maxMetrics: number = 1000) {
    this.maxMetrics = maxMetrics;
  }

  /**
   * 测量函数执行时间
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, metadata);
    }
  }

  /**
   * 同步测量
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, metadata);
    }
  }

  /**
   * 记录性能指标
   */
  private recordMetric(
    name: string,
    duration: number,
    metadata?: Record<string, unknown>
  ): void {
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    if (duration > 1000) {
      console.warn(`[Performance] Slow operation: ${name} took ${duration.toFixed(2)}ms`, metadata);
    }
  }

  /**
   * 记录内存使用
   */
  recordMemory(): void {
    const perfMemory = (performance as any).memory;
    if (!perfMemory) {
      console.warn('[Performance] Memory API not available');
      return;
    }

    const percentageUsed = (perfMemory.usedJSHeapSize / perfMemory.jsHeapSizeLimit) * 100;

    this.memoryMetrics.push({
      timestamp: Date.now(),
      usedJSHeapSize: perfMemory.usedJSHeapSize,
      totalJSHeapSize: perfMemory.totalJSHeapSize,
      jsHeapSizeLimit: perfMemory.jsHeapSizeLimit,
      percentageUsed,
    });

    if (this.memoryMetrics.length > this.maxMetrics) {
      this.memoryMetrics.shift();
    }

    if (percentageUsed > 80) {
      console.warn(`[Performance] High memory usage: ${percentageUsed.toFixed(2)}%`);
    }
  }

  /**
   * 记录网络请求
   */
  recordNetwork(
    url: string,
    method: string,
    duration: number,
    status: number,
    size: number
  ): void {
    this.networkMetrics.push({
      url,
      method,
      duration,
      status,
      size,
      timestamp: Date.now(),
    });

    if (this.networkMetrics.length > this.maxMetrics) {
      this.networkMetrics.shift();
    }

    if (duration > 5000) {
      console.warn(`[Performance] Slow network request: ${method} ${url} took ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * 获取性能统计
   */
  getStats(): {
    metrics: {
      total: number;
      average: number;
      min: number;
      max: number;
      p95: number;
      p99: number;
    };
    memory: {
      current: MemoryMetric | null;
      average: number;
      max: number;
    };
    network: {
      total: number;
      averageDuration: number;
      averageSize: number;
      errorRate: number;
    };
  } {
    const durations = this.metrics.map(m => m.duration);
    const metricStats = {
      total: durations.length,
      average: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      min: durations.length > 0 ? Math.min(...durations) : 0,
      max: durations.length > 0 ? Math.max(...durations) : 0,
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99),
    };

    const memoryUsages = this.memoryMetrics.map(m => m.percentageUsed);
    const memoryStats = {
      current: this.memoryMetrics.length > 0 ? this.memoryMetrics[this.memoryMetrics.length - 1] : null,
      average: memoryUsages.length > 0 ? memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length : 0,
      max: memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0,
    };

    const networkDurations = this.networkMetrics.map(m => m.duration);
    const networkSizes = this.networkMetrics.map(m => m.size);
    const errorCount = this.networkMetrics.filter(m => m.status >= 400).length;
    const networkStats = {
      total: this.networkMetrics.length,
      averageDuration: networkDurations.length > 0 ? networkDurations.reduce((a, b) => a + b, 0) / networkDurations.length : 0,
      averageSize: networkSizes.length > 0 ? networkSizes.reduce((a, b) => a + b, 0) / networkSizes.length : 0,
      errorRate: this.networkMetrics.length > 0 ? (errorCount / this.networkMetrics.length) * 100 : 0,
    };

    return {
      metrics: metricStats,
      memory: memoryStats,
      network: networkStats,
    };
  }

  /**
   * 计算百分位数
   */
  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * 获取所有指标
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * 获取内存指标
   */
  getMemoryMetrics(): MemoryMetric[] {
    return [...this.memoryMetrics];
  }

  /**
   * 获取网络指标
   */
  getNetworkMetrics(): NetworkMetric[] {
    return [...this.networkMetrics];
  }

  /**
   * 清空所有指标
   */
  clear(): void {
    this.metrics = [];
    this.memoryMetrics = [];
    this.networkMetrics = [];
  }

  /**
   * 导出报告
   */
  exportReport(): string {
    const stats = this.getStats();
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      stats,
      metrics: this.metrics,
      memory: this.memoryMetrics,
      network: this.networkMetrics,
    }, null, 2);
  }
}

let globalMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor();
  }
  return globalMonitor;
}
