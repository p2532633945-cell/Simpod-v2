/**
 * RSS Feed Parser v2
 *
 * Enhanced RSS parser using fast-xml-parser for more robust XML handling
 * Supports standard RSS 2.0 and iTunes namespace extensions
 */

import { XMLParser } from 'fast-xml-parser'
import { validateAudioUrl } from '@/lib/audio-validator'

export interface Episode {
  id: string
  title: string
  description: string
  pubDate: string
  audioUrl: string
  duration?: number
  artwork?: string
}

export interface PodcastFromFeed {
  id: string
  title: string
  author: string
  feedUrl: string
  artwork: string
  description: string
  source: 'rss'
}

interface RssChannel extends Record<string, unknown> {
  title?: string
  description?: string
  author?: string
  'itunes:author'?: string
  'itunes:image'?: { '@_href'?: string }
  image?: { url?: string }
  item?: RssItem | RssItem[]
}

interface RssItem extends Record<string, unknown> {
  title?: string
  description?: string
  pubDate?: string
  enclosure?: { '@_url'?: string }
  'itunes:duration'?: string
  'itunes:image'?: { '@_href'?: string }
  'itunes:summary'?: string
  'content:encoded'?: string
}

/**
 * Parse RSS feed and return episodes and podcast info
 */
export async function parseFeed(feedUrl: string): Promise<{ episodes: Episode[]; podcast: PodcastFromFeed }> {
  console.log('[RSS Parser v2] Parsing feed:', feedUrl)

  // Step 1: Fetch via proxy
  const proxyUrl = `/api/rss-proxy?url=${encodeURIComponent(feedUrl)}`
  let xmlText: string

  try {
    const response = await fetch(proxyUrl)
    const rawText = await response.text()

    if (!response.ok) {
      // 代理返回错误 - 尝试解析结构化错误信息
      let errorMessage = `HTTP ${response.status}`
      try {
        const errJson = JSON.parse(rawText)
        errorMessage = errJson?.error?.message || errJson?.error || errorMessage
      } catch {
        if (rawText) errorMessage = rawText.substring(0, 200)
      }
      console.error(`[RSS Parser v2] Proxy returned ${response.status}: ${errorMessage}`)
      throw new Error(`Failed to fetch feed: ${errorMessage}`)
    }

    // 成功但检查是否误收到 JSON（代理 bug 情况）
    const trimmed = rawText.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      let errorMessage = 'Proxy returned JSON instead of XML'
      try {
        const errJson = JSON.parse(trimmed)
        errorMessage = errJson?.error?.message || errJson?.error || errorMessage
      } catch { /* not valid JSON either */ }
      console.error(`[RSS Parser v2] ${errorMessage}`)
      throw new Error(errorMessage)
    }

    if (trimmed.length === 0) {
      throw new Error('Proxy returned empty response')
    }

    xmlText = rawText
    console.log('[RSS Parser v2] Response length:', xmlText.length)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[RSS Parser v2] Fetch failed:', msg)
    throw error
  }

  // Step 2: Parse XML
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: true,
    parseAttributeValue: true,
  })

  let doc: Record<string, unknown>
  try {
    doc = parser.parse(xmlText) as Record<string, unknown>
  } catch (parseError) {
    const msg = parseError instanceof Error ? parseError.message : String(parseError)
    console.error('[RSS Parser v2] XML parse error:', msg)
    throw new Error(`Failed to parse RSS feed: ${msg}`)
  }

  // Step 3: Navigate to channel
  const rssData = doc?.rss as Record<string, unknown> | undefined
  const channel = rssData?.channel as RssChannel | undefined
  if (!channel) {
    // 尝试 Atom feed 格式
    const feed = doc?.feed as Record<string, unknown> | undefined
    if (feed) {
      throw new Error('Atom feed format not yet supported, expected RSS 2.0')
    }
    console.error('[RSS Parser v2] Doc keys:', Object.keys(doc || {}))
    throw new Error('Invalid RSS feed: missing channel element')
  }

  // Step 4: Parse podcast info
  const podcast: PodcastFromFeed = {
    id: generateId(),
    title: getString(channel.title) || '',
    author: getString(channel['itunes:author']) || getString(channel.author) || '',
    feedUrl,
    artwork: getNestedString(channel, ['itunes:image', '@_href']) || getString((channel.image as Record<string, unknown>)?.url) || '',
    description: getString(channel.description) || '',
    source: 'rss' as const,
  }

  // Step 5: Parse episodes
  let items = channel.item
  if (!items) {
    console.warn('[RSS Parser v2] No items found in feed')
    items = []
  } else if (!Array.isArray(items)) {
    items = [items as RssItem]
  }

  const episodes: Episode[] = (items as RssItem[]).map((item) => {
    const enclosure = item.enclosure as Record<string, unknown> | undefined
    const rawAudioUrl = getString(enclosure?.['@_url']) || ''
    const duration = getString(item['itunes:duration'])
    const itemImage = item['itunes:image'] as Record<string, unknown> | undefined
    const itemImageUrl = getString(itemImage?.['@_href']) || ''

    const { cleanedUrl } = validateAudioUrl(rawAudioUrl)

    const description = stripHtmlTags(
      getString(item.description) ||
        getString(item['itunes:summary']) ||
        getString(item['content:encoded']) ||
        ''
    )

    return {
      id: generateId(),
      title: getString(item.title) || '',
      description,
      pubDate: getString(item.pubDate) || '',
      audioUrl: cleanedUrl,
      duration: duration ? parseDuration(duration) : undefined,
      artwork: itemImageUrl || podcast.artwork,
    }
  })

  console.log('[RSS Parser v2] Parsed successfully:', {
    podcastTitle: podcast.title,
    episodeCount: episodes.length,
    firstEpisodeAudioUrl: episodes[0]?.audioUrl,
  })

  return { episodes, podcast }
}

function getString(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (value === null || value === undefined) return null
  return null
}

function getNestedString(obj: Record<string, unknown>, path: string[]): string | null {
  let current: unknown = obj
  for (const key of path) {
    if (current === null || current === undefined || typeof current !== 'object') return null
    current = (current as Record<string, unknown>)[key]
  }
  return getString(current)
}

function parseDuration(duration: string): number {
  if (!duration) return 0
  const asNumber = Number(duration)
  if (!isNaN(asNumber)) return asNumber
  const parts = duration.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 1) return parts[0]
  return 0
}

function stripHtmlTags(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, '')
  }
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}
