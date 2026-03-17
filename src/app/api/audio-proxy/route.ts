/**
 * Audio Proxy API Route
 *
 * 代理音频请求，解决浏览器 CORS 问题
 * 支持 Range 请求（音频 seek 需要）
 * 支持重试机制（指数退避）
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const REQUEST_TIMEOUT = 60000 // 60 秒（P4-5 性能优化：增加超时时间应对慢速服务器）
const MAX_RETRIES = 2

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number
): Promise<{ response: Response; attempts: number }> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    try {
      console.log(`[Audio Proxy] Attempt ${attempt + 1}/${maxRetries + 1} for ${url}`)
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        redirect: 'follow',
      })
      clearTimeout(timeoutId)
      return { response, attempts: attempt + 1 }
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error as Error
      const isTimeout = lastError.name === 'AbortError'
      const isNetwork =
        lastError.message.includes('fetch') ||
        lastError.message.includes('ECONNREFUSED') ||
        lastError.message.includes('ENOTFOUND')

      console.warn(`[Audio Proxy] Attempt ${attempt + 1} failed:`, {
        isTimeout,
        isNetwork,
        message: lastError.message,
      })

      // 只有网络错误和超时才重试
      if ((isTimeout || isNetwork) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 300
        console.log(`[Audio Proxy] Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      throw error
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

export async function GET(req: NextRequest) {
  const startTime = performance.now()
  const audioUrl = req.nextUrl.searchParams.get('url')

  if (!audioUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // 验证 URL 格式
  let parsedUrl: URL
  try {
    parsedUrl = new URL(audioUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return NextResponse.json({ error: 'Only HTTP/HTTPS URLs supported' }, { status: 400 })
  }

  // 防止 SSRF：不允许代理本地地址
  const hostname = parsedUrl.hostname
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.')
  ) {
    return NextResponse.json({ error: 'Private/local URLs not allowed' }, { status: 403 })
  }

  try {
    // 转发 Range 请求头（音频 seek 必须）
    const upstreamHeaders: Record<string, string> = {
      'User-Agent': 'Simpod/2.0 (+https://simpod.app)',
      Accept: 'audio/*, */*',
    }

    const rangeHeader = req.headers.get('range')
    if (rangeHeader) {
      upstreamHeaders['Range'] = rangeHeader
      console.log(`[Audio Proxy] Range request: ${rangeHeader}`)
    }

    const { response, attempts } = await fetchWithRetry(
      audioUrl,
      { headers: upstreamHeaders },
      MAX_RETRIES
    )

    // 上游返回错误
    if (!response.ok && response.status !== 206) {
      const body = await response.text().catch(() => '')
      console.error('[Audio Proxy] Upstream error:', {
        status: response.status,
        statusText: response.statusText,
        url: audioUrl,
        body: body.substring(0, 100),
      })
      return NextResponse.json(
        {
          error: `Upstream returned ${response.status}: ${response.statusText}`,
          details: { url: audioUrl, statusCode: response.status },
        },
        { status: 502 }
      )
    }

    // 构建响应头
    const responseHeaders = new Headers()
    responseHeaders.set('Access-Control-Allow-Origin', '*')
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
    responseHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Type')
    responseHeaders.set(
      'Access-Control-Expose-Headers',
      'Content-Range, Content-Length, Accept-Ranges'
    )

    // P4-5 性能优化：添加缓存策略
    // 音频文件通常不变，可以缓存 7 天
    responseHeaders.set('Cache-Control', 'public, max-age=604800, immutable')
    responseHeaders.set('X-Content-Type-Options', 'nosniff')

    // 转发关键响应头
    const forwardHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
      'last-modified',
      'etag',
    ]
    for (const header of forwardHeaders) {
      const value = response.headers.get(header)
      if (value) {
        responseHeaders.set(header, value)
      }
    }

    // 确保有 content-type（某些服务器不返回）
    if (!responseHeaders.get('content-type')) {
      const lowerUrl = audioUrl.toLowerCase()
      if (lowerUrl.includes('.mp3')) {
        responseHeaders.set('content-type', 'audio/mpeg')
      } else if (lowerUrl.includes('.m4a') || lowerUrl.includes('.aac')) {
        responseHeaders.set('content-type', 'audio/mp4')
      } else if (lowerUrl.includes('.ogg')) {
        responseHeaders.set('content-type', 'audio/ogg')
      } else if (lowerUrl.includes('.wav')) {
        responseHeaders.set('content-type', 'audio/wav')
      } else {
        responseHeaders.set('content-type', 'audio/mpeg')
      }
    }

    // 确保接受 Range 请求
    if (!responseHeaders.get('accept-ranges')) {
      responseHeaders.set('accept-ranges', 'bytes')
    }

    const duration = performance.now() - startTime
    console.log(
      `[Audio Proxy] Success: ${audioUrl} (${duration.toFixed(0)}ms, attempts: ${attempts}, status: ${response.status})`
    )

    // 流式传输响应体
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string }
    const isTimeout = err?.name === 'AbortError'
    const duration = performance.now() - startTime

    console.error('[Audio Proxy] Fatal error:', {
      message: err?.message,
      isTimeout,
      url: audioUrl,
      duration: duration.toFixed(0) + 'ms',
    })

    return NextResponse.json(
      {
        error: isTimeout
          ? `Audio fetch timeout after ${REQUEST_TIMEOUT / 1000}s`
          : err?.message || 'Failed to fetch audio',
        details: { url: audioUrl, isTimeout },
      },
      { status: isTimeout ? 504 : 502 }
    )
  }
}

export async function HEAD(req: NextRequest) {
  // HEAD 请求用于检查音频 URL 是否可访问
  const audioUrl = req.nextUrl.searchParams.get('url')

  if (!audioUrl) {
    return new NextResponse(null, { status: 400 })
  }

  try {
    const parsedUrl = new URL(audioUrl)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return new NextResponse(null, { status: 400 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(audioUrl, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Simpod/2.0 (+https://simpod.app)' },
        signal: controller.signal,
        redirect: 'follow',
      })
      clearTimeout(timeoutId)

      const headers = new Headers()
      headers.set('Access-Control-Allow-Origin', '*')

      const ct = response.headers.get('content-type')
      if (ct) headers.set('content-type', ct)
      const cl = response.headers.get('content-length')
      if (cl) headers.set('content-length', cl)

      return new NextResponse(null, {
        status: response.status,
        headers,
      })
    } finally {
      clearTimeout(timeoutId)
    }
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
    },
  })
}
