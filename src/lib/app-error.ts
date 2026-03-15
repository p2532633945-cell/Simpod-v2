/**
 * 统一的应用错误处理系统
 *
 * 提供：
 * - 错误分类（网络、业务、系统）
 * - 错误恢复策略
 * - 统一的错误日志格式
 */

export enum ErrorCode {
  // 网络错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  CORS_ERROR = 'CORS_ERROR',

  // 业务错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',

  // 系统错误
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',

  // 资源错误
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  MEMORY_ERROR = 'MEMORY_ERROR',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ErrorContext {
  [key: string]: unknown;
}

/**
 * 统一的应用错误类
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly timestamp: Date;
  public readonly retryable: boolean;
  public readonly maxRetries: number;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: ErrorContext = {},
    retryable: boolean = false,
    maxRetries: number = 0
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date();
    this.retryable = retryable;
    this.maxRetries = maxRetries;

    // 维持正确的原型链
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * 转换为日志格式
   */
  toLog(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      retryable: this.retryable,
      maxRetries: this.maxRetries,
      context: this.context,
      stack: this.stack,
    };
  }

  /**
   * 转换为用户友好的消息
   */
  toUserMessage(): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
      [ErrorCode.TIMEOUT]: '请求超时，请稍后重试',
      [ErrorCode.CORS_ERROR]: '跨域请求被拒绝',
      [ErrorCode.VALIDATION_ERROR]: '输入数据无效',
      [ErrorCode.NOT_FOUND]: '请求的资源不存在',
      [ErrorCode.CONFLICT]: '数据冲突，请刷新后重试',
      [ErrorCode.RATE_LIMIT]: '请求过于频繁，请稍后再试',
      [ErrorCode.INTERNAL_ERROR]: '服务器内部错误',
      [ErrorCode.NOT_IMPLEMENTED]: '功能尚未实现',
      [ErrorCode.RESOURCE_EXHAUSTED]: '资源不足，请稍后重试',
      [ErrorCode.MEMORY_ERROR]: '内存不足，请关闭其他应用',
    };

    return messages[this.code] || this.message;
  }

  /**
   * 判断是否应该重试
   */
  shouldRetry(attemptCount: number): boolean {
    return this.retryable && attemptCount < this.maxRetries;
  }

  /**
   * 获取重试延迟（毫秒）
   */
  getRetryDelay(attemptCount: number): number {
    // 指数退避：1s, 2s, 4s, 8s...
    return Math.pow(2, attemptCount) * 1000;
  }
}

/**
 * 从原生错误创建 AppError
 */
export function createAppError(
  error: unknown,
  defaultCode: ErrorCode = ErrorCode.INTERNAL_ERROR,
  context: ErrorContext = {}
): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message;

    // 检测错误类型
    if (message.includes('fetch') || message.includes('network')) {
      return new AppError(
        message,
        ErrorCode.NETWORK_ERROR,
        ErrorSeverity.HIGH,
        { ...context, originalError: message },
        true,
        2
      );
    }

    if (message.includes('timeout') || message.includes('AbortError')) {
      return new AppError(
        'Request timeout',
        ErrorCode.TIMEOUT,
        ErrorSeverity.MEDIUM,
        { ...context, originalError: message },
        true,
        2
      );
    }

    if (message.includes('CORS')) {
      return new AppError(
        message,
        ErrorCode.CORS_ERROR,
        ErrorSeverity.HIGH,
        { ...context, originalError: message },
        false
      );
    }

    return new AppError(
      message,
      defaultCode,
      ErrorSeverity.MEDIUM,
      { ...context, originalError: message }
    );
  }

  return new AppError(
    String(error),
    defaultCode,
    ErrorSeverity.MEDIUM,
    { ...context, originalError: error }
  );
}

/**
 * 错误处理装饰器
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw createAppError(error, errorCode);
    }
  }) as T;
}

/**
 * 带重试的执行函数
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  onRetry?: (attempt: number, error: AppError) => void
): Promise<T> {
  let lastError: AppError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = createAppError(error);

      if (!lastError.shouldRetry(attempt)) {
        throw lastError;
      }

      const delay = lastError.getRetryDelay(attempt);
      console.warn(
        `[Retry] Attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${delay}ms...`,
        lastError.toLog()
      );

      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new AppError('Max retries exceeded', ErrorCode.INTERNAL_ERROR);
}
