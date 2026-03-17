/**
 * 统一的日志系统
 *
 * 特性：
 * - 日志级别控制（DEBUG, INFO, WARN, ERROR）
 * - 日志采样（减少生产环境日志量）
 * - 日志聚合接口
 * - 性能监控
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface LoggerConfig {
  level?: LogLevel;
  sampleRate?: number; // 0-1，采样率
  maxLogs?: number; // 最多保留的日志数
  enableConsole?: boolean;
  onLog?: (entry: LogEntry) => void;
}

/**
 * 统一的日志系统
 */
export class Logger {
  private level: LogLevel;
  private sampleRate: number;
  private maxLogs: number;
  private enableConsole: boolean;
  private onLog?: (entry: LogEntry) => void;
  private logs: LogEntry[] = [];
  private module: string;

  constructor(module: string, config: LoggerConfig = {}) {
    this.module = module;
    this.level = config.level ?? LogLevel.INFO;
    this.sampleRate = config.sampleRate ?? 1.0;
    this.maxLogs = config.maxLogs ?? 1000;
    this.enableConsole = config.enableConsole ?? true;
    this.onLog = config.onLog;
  }

  /**
   * 调试日志
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * 信息日志
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * 警告日志
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * 错误日志
   */
  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errorInfo = this.extractError(error);
    this.log(LogLevel.ERROR, message, data, errorInfo);
  }

  /**
   * 内部日志方法
   */
  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: { name: string; message: string; stack?: string }
  ): void {
    // 检查日志级别
    if (level < this.level) {
      return;
    }

    // 采样
    if (Math.random() > this.sampleRate) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      data,
      error,
    };

    // 保存日志
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 输出到控制台
    if (this.enableConsole) {
      this.logToConsole(entry);
    }

    // 调用回调
    if (this.onLog) {
      this.onLog(entry);
    }
  }

  /**
   * 输出到控制台
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.module}]`;
    const timestamp = entry.timestamp.split('T')[1].split('.')[0]; // HH:MM:SS

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${timestamp} ${entry.message}`, entry.data);
        break;
      case LogLevel.INFO:
        console.info(`${prefix} ${timestamp} ${entry.message}`, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${timestamp} ${entry.message}`, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(`${prefix} ${timestamp} ${entry.message}`, entry.data, entry.error);
        break;
    }
  }

  /**
   * 提取错误信息
   */
  private extractError(error: Error | unknown): { name: string; message: string; stack?: string } | undefined {
    if (!error) return undefined;

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return {
      name: 'Unknown',
      message: String(error),
    };
  }

  /**
   * 获取所有日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 获取特定级别的日志
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * 导出日志为 JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * 获取日志统计
   */
  getStats(): {
    total: number;
    debug: number;
    info: number;
    warn: number;
    error: number;
  } {
    return {
      total: this.logs.length,
      debug: this.logs.filter(l => l.level === LogLevel.DEBUG).length,
      info: this.logs.filter(l => l.level === LogLevel.INFO).length,
      warn: this.logs.filter(l => l.level === LogLevel.WARN).length,
      error: this.logs.filter(l => l.level === LogLevel.ERROR).length,
    };
  }
}

/**
 * 全局日志管理器
 */
class GlobalLogManager {
  private loggers = new Map<string, Logger>();
  private config: LoggerConfig;

  constructor(config: LoggerConfig = {}) {
    this.config = config;
  }

  /**
   * 获取或创建日志记录器
   */
  getLogger(module: string): Logger {
    if (!this.loggers.has(module)) {
      this.loggers.set(module, new Logger(module, this.config));
    }
    return this.loggers.get(module)!;
  }

  /**
   * 设置全局日志级别
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * 获取所有日志
   */
  getAllLogs(): LogEntry[] {
    const allLogs: LogEntry[] = [];
    for (const logger of this.loggers.values()) {
      allLogs.push(...logger.getLogs());
    }
    return allLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * 清空所有日志
   */
  clearAllLogs(): void {
    for (const logger of this.loggers.values()) {
      logger.clearLogs();
    }
  }

  /**
   * 导出所有日志
   */
  exportAllLogs(): string {
    return JSON.stringify(this.getAllLogs(), null, 2);
  }

  /**
   * 获取统计信息
   */
  getStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [module, logger] of this.loggers.entries()) {
      stats[module] = logger.getStats();
    }
    return stats;
  }
}

// 全局单例
let globalLogManager: GlobalLogManager | null = null;

/**
 * 初始化全局日志系统
 */
export function initializeLogger(config: LoggerConfig = {}): void {
  globalLogManager = new GlobalLogManager(config);
  console.log('[Logger] Initialized with level:', config.level ?? LogLevel.INFO);
}

/**
 * 获取日志记录器
 */
export function getLogger(module: string): Logger {
  if (!globalLogManager) {
    globalLogManager = new GlobalLogManager();
  }
  return globalLogManager.getLogger(module);
}

/**
 * 设置全局日志级别
 */
export function setLogLevel(level: LogLevel): void {
  if (globalLogManager) {
    globalLogManager.setLevel(level);
  }
}

/**
 * 获取所有日志
 */
export function getAllLogs(): LogEntry[] {
  if (!globalLogManager) {
    return [];
  }
  return globalLogManager.getAllLogs();
}

/**
 * 清空所有日志
 */
export function clearAllLogs(): void {
  if (globalLogManager) {
    globalLogManager.clearAllLogs();
  }
}

/**
 * 导出所有日志
 */
export function exportAllLogs(): string {
  if (!globalLogManager) {
    return '[]';
  }
  return globalLogManager.exportAllLogs();
}

/**
 * 获取日志统计
 */
export function getLogStats(): Record<string, any> {
  if (!globalLogManager) {
    return {};
  }
  return globalLogManager.getStats();
}
