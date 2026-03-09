import { NextRequest, NextResponse } from 'next/server'

/**
 * iTunes Search API Proxy
 *
 * Proxies requests to iTunes Search API to avoid CORS issues
 */

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const term = searchParams.get('term')
  const limit = searchParams.get('limit') || '20'

  if (!term) {
    return NextResponse.json(
      { error: 'Missing search term' },
      { status: 400 }
    )
  }

  try {
    const iTunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=podcast&limit=${limit}`

    console.log('[iTunes Proxy] Searching for:', term)

    const response = await fetch(iTunesUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': 'https://itunes.apple.com',
      },
    })

    if (!response.ok) {
      console.error('[iTunes Proxy] Error:', response.status, response.statusText)
      return NextResponse.json(
        { error: `iTunes API error: HTTP ${response.status}` },
        { status: 502 }
      )
    }

    const data = await response.json()

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      },
    })
  } catch (error: any) {
    console.error('[iTunes Proxy] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
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
  })
}
