import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Podcast Search API
 *
 * 代理到 Podcast Index API，实现播客搜索功能
 * 使用 HMAC SHA1 签名认证
 */

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json(
      { error: 'Missing query parameter' },
      { status: 400 }
    )
  }

  const apiKey = process.env.PODCAST_INDEX_KEY
  const apiSecret = process.env.PODCAST_INDEX_SECRET

  // Add more detailed logging for configuration check
  console.log('[Podcast Search API] Request received:', {
    query,
    hasKey: !!apiKey,
    hasSecret: !!apiSecret,
    keyPrefix: apiKey ? `${apiKey.substring(0, 4)}...` : 'none'
  })

  if (!apiKey || !apiSecret) {
    console.error('[Podcast Search API] Missing credentials')
    return NextResponse.json(
      { error: 'Server configuration error: API credentials not found' },
      { status: 500 }
    )
  }

  // HMAC SHA1 认证
  const apiHeaderTime = Math.floor(Date.now() / 1000)
  const data4Hash = apiKey + apiSecret + apiHeaderTime
  const hash = crypto.createHash('sha1').update(data4Hash).digest('hex')

  try {
    console.log('[Podcast Search API] Searching for:', query)

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    const response = await fetch(
      `https://api.podcastindex.org/api/1.0/search/byterm?q=${encodeURIComponent(query)}&clean=y&max=10`,
      {
        headers: {
          'User-Agent': 'Simpod/2.0',
          'X-Auth-Key': apiKey,
          'X-Auth-Date': apiHeaderTime.toString(),
          'Authorization': hash,
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)
    console.log('[Podcast Search API] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response')
      console.error('[Podcast Search API] Error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        query
      })
      throw new Error(`Podcast Index API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    console.log('[Podcast Search API] Found feeds:', data.feeds?.length || 0)

    return NextResponse.json(data)
  } catch (err) {
    const error = err as Error
    const errorMessage = error.message || 'Unknown error'
    const errorName = error.name || 'Unknown'

    console.error('[Podcast Search API] Exception:', {
      message: errorMessage,
      name: errorName,
      stack: error.stack,
      query,
      isTimeout: errorMessage.includes('abort') || errorMessage.includes('timeout'),
      isNetworkError: errorMessage.includes('fetch') || errorMessage.includes('network')
    })

    // Return more specific error information
    return NextResponse.json(
      {
        error: errorMessage,
        type: errorName,
        isTimeout: errorMessage.includes('abort') || errorMessage.includes('timeout'),
        isNetworkError: errorMessage.includes('fetch') || errorMessage.includes('network'),
        query
      },
      { status: 500 }
    )
  }
}
