/**
 * RSS Proxy API Route
 *
 * Proxies RSS feed requests to handle CORS issues
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const feedUrl = req.nextUrl.searchParams.get('url')

  if (!feedUrl) {
    return NextResponse.json(
      { error: 'Missing feed URL parameter' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Simpod/2.0 (+https://simpod.app)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      // Don't follow redirects more than 3 times
      redirect: 'follow',
    })

    if (!response.ok) {
      console.error('[RSS Proxy] Upstream error:', response.status, response.statusText)
      return NextResponse.json(
        { error: `Failed to fetch feed: HTTP ${response.status}` },
        { status: 502 }
      )
    }

    const text = await response.text()

    // Validate that we got XML or RSS content
    const trimmed = text.trim()
    if (!trimmed.startsWith('<?xml') && !trimmed.startsWith('<rss') && !trimmed.startsWith('<rdf:RDF')) {
      console.error('[RSS Proxy] Invalid XML response')
      return NextResponse.json(
        { error: 'Invalid feed format: expected XML/RSS' },
        { status: 502 }
      )
    }

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, max-age=300, s-maxage=600', // 5min client, 10min CDN
      },
    })
  } catch (error: any) {
    console.error('[RSS Proxy] Error:', error)
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
