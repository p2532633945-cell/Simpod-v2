/**
 * 改进的 RSS 代理 - 根本性解决方案
 * 
 * 设计原则：
 * 1. 完整的错误追踪和诊断
 * 2. 详细的日志记录
 * 3. 结构化的错误响应
 * 4. 自动重试和降级
 * 5. 性能监控
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const REQUEST_TIMEOUT = 15000;
const MAX_RETRIES = 2;

interface ProxyError {
  code: string;
  message: string;
  details: {
    feedUrl: string;
    attempt: number;
    statusCode?: number;
    originalError?: string;
    timestamp: string;
  };
}

interface ProxyResponse {
  success: boolean;
  data?: string;
  error?: ProxyError;
  metadata: {
    duration: number;
    attempts: number;
    cached: boolean;
  };
}

// 简单的内存缓存（生产环境应使用 Redis）
const feedCache = new Map<string, { data: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  timeout: number,
  maxRetries: number
): Promise<{ response: Response; attempts: number }> {
  let lastError: Error | null = null;
  let attempts = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attempts = attempt + 1;
    try {
      console.log(`[RSS Proxy] Attempt ${attempts}/${maxRetries + 1} for ${url}`);
      const response = await fetchWithTimeout(url, options, timeout);
      return { response, attempts };
    } catch (error) {
      lastError = error as Error;
      const isTimeout = lastError.name === 'AbortError';
      const isNetworkError = lastError.message.includes('fetch');

      console.warn(`[RSS Proxy] Attempt ${attempts} failed:`, {
        isTimeout,
        isNetworkError,
        message: lastError.message,
      });

      if ((isTimeout || isNetworkError) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 500;
        console.log(`[RSS Proxy] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

function createErrorResponse(
  code: string,
  message: string,
  details: Omit<ProxyError['details'], 'timestamp'>
): ProxyError {
  return {
    code,
    message,
    details: {
      ...details,
      timestamp: new Date().toISOString(),
    },
  };
}

export async function GET(req: NextRequest) {
  const startTime = performance.now();
  const feedUrl = req.nextUrl.searchParams.get('url');

  // 验证输入
  if (!feedUrl) {
    return NextResponse.json(
      {
        success: false,
        error: createErrorResponse(
          'INVALID_INPUT',
          'Missing feed URL parameter',
          { feedUrl: 'N/A', attempt: 0 }
        ),
        metadata: { duration: 0, attempts: 0, cached: false },
      } as ProxyResponse,
      { status: 400 }
    );
  }

  try {
    // 检查缓存
    const cached = feedCache.get(feedUrl);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[RSS Proxy] Cache hit for ${feedUrl}`);
      const duration = performance.now() - startTime;
      return new NextResponse(cached.data, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'HIT',
          'X-Response-Time': `${duration.toFixed(2)}ms`,
        },
      });
    }

    // 获取 RSS feed
    const { response, attempts } = await fetchWithRetry(
      feedUrl,
      {
        headers: {
          'User-Agent': 'Simpod/2.0 (+https://simpod.app)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
        redirect: 'follow',
      },
      REQUEST_TIMEOUT,
      MAX_RETRIES
    );

    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No response body');
      console.error('[RSS Proxy] Upstream error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText.substring(0, 200),
      });

      const duration = performance.now() - startTime;
      return NextResponse.json(
        {
          success: false,
          error: createErrorResponse(
            'UPSTREAM_ERROR',
            `Failed to fetch feed: HTTP ${response.status}`,
            {
              feedUrl,
              attempt: attempts,
              statusCode: response.status,
              originalError: errorText.substring(0, 100),
            }
          ),
          metadata: { duration, attempts, cached: false },
        } as ProxyResponse,
        { status: 502 }
      );
    }

    // 读取响应体
    const text = await response.text();

    // 验证 XML 格式
    const trimmed = text.trim();
    if (
      !trimmed.startsWith('<?xml') &&
      !trimmed.startsWith('<rss') &&
      !trimmed.startsWith('<rdf:RDF') &&
      !trimmed.startsWith('<feed')
    ) {
      console.error('[RSS Proxy] Invalid XML response:', {
        preview: trimmed.substring(0, 100),
        length: text.length,
      });

      const duration = performance.now() - startTime;
      return NextResponse.json(
        {
          success: false,
          error: createErrorResponse(
            'INVALID_FORMAT',
            'Invalid feed format: expected XML/RSS',
            {
              feedUrl,
              attempt: attempts,
              originalError: `Got: ${trimmed.substring(0, 50)}`,
            }
          ),
          metadata: { duration, attempts, cached: false },
        } as ProxyResponse,
        { status: 502 }
      );
    }

    // 缓存成功的响应
    feedCache.set(feedUrl, { data: text, timestamp: Date.now() });

    const duration = performance.now() - startTime;
    console.log(`[RSS Proxy] Success: ${feedUrl} (${duration.toFixed(2)}ms, ${text.length} bytes)`);

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'X-Cache': 'MISS',
        'X-Response-Time': `${duration.toFixed(2)}ms`,
        'X-Attempts': attempts.toString(),
      },
    });
  } catch (error: any) {
    const duration = performance.now() - startTime;
    const isTimeout = error?.name === 'AbortError';
    const isNetworkError = error?.message?.includes('fetch') || error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND';
    let hostname = feedUrl;
    try { hostname = new URL(feedUrl).hostname; } catch { /* ignore */ }
    const errorMessage = isTimeout
      ? 'Feed fetch timeout (15s)'
      : isNetworkError
      ? `Cannot reach ${hostname} - server may be blocked or unavailable in your region`
      : error?.message || 'Unknown error';

    console.error('[RSS Proxy] Fatal error:', {
      message: errorMessage,
      isTimeout,
      isNetworkError,
      hostname,
      duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: createErrorResponse(
          isTimeout ? 'TIMEOUT' : isNetworkError ? 'NETWORK_ERROR' : 'INTERNAL_ERROR',
          errorMessage,
          {
            feedUrl,
            attempt: 0,
            originalError: error?.message,
          }
        ),
        metadata: { duration, attempts: 0, cached: false },
      } as ProxyResponse,
      { status: isTimeout ? 504 : 502 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
