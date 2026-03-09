/**
 * RSS Feed Parser
 *
 * Parses podcast RSS feeds using browser's native DOMParser
 * This avoids the need for external RSS parser libraries
 */

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

/**
 * Parse RSS feed and return episodes and podcast info
 */
export async function parseFeed(feedUrl: string): Promise<{ episodes: Episode[], podcast: PodcastFromFeed }> {
  try {
    console.log('[RSS Parser] Parsing feed:', feedUrl)

    // Use our proxy to fetch RSS (handles CORS)
    const response = await fetch(`/api/rss-proxy?url=${encodeURIComponent(feedUrl)}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.statusText}`)
    }

    const xmlText = await response.text()

    // Use browser's native DOMParser
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlText, "application/xml")

    // Check for parsing errors
    const parseError = doc.querySelector('parsererror')
    if (parseError) {
      throw new Error(`Failed to parse RSS feed: ${parseError.textContent}`)
    }

    // Parse podcast info
    const channel = doc.querySelector('channel')
    if (!channel) {
      throw new Error('Invalid RSS feed: missing channel element')
    }

    const podcast: PodcastFromFeed = {
      id: generateId(),
      title: channel.querySelector('title')?.textContent || '',
      author: channel.querySelector('itunes:author')?.textContent ||
              channel.querySelector('author')?.textContent || '',
      feedUrl,
      artwork: channel.querySelector('itunes:image')?.getAttribute('href') ||
               channel.querySelector('image > url')?.textContent || '',
      description: channel.querySelector('description')?.textContent || '',
      source: 'rss' as const,
    }

    // Parse episodes
    const items = doc.querySelectorAll('item')
    const episodes: Episode[] = Array.from(items).map((item) => {
      const enclosure = item.querySelector('enclosure')
      const rawAudioUrl = enclosure?.getAttribute('url') || ''
      const duration = item.querySelector('itunes:duration')?.textContent
      const image = item.querySelector('itunes:image')

      // 验证和清理音频 URL
      const { valid, cleanedUrl } = validateAudioUrl(rawAudioUrl)
      if (!valid) {
        console.warn('[RSS Parser] Invalid audio URL:', rawAudioUrl)
      }

      return {
        id: generateId(),
        title: item.querySelector('title')?.textContent || '',
        description: stripHtmlTags(
          item.querySelector('description')?.textContent ||
          item.querySelector('itunes:summary')?.textContent ||
          item.querySelector('content\\:encoded')?.textContent || ''
        ),
        pubDate: item.querySelector('pubDate')?.textContent || '',
        audioUrl: cleanedUrl,
        duration: duration ? parseDuration(duration) : undefined,
        artwork: image?.getAttribute('href') || podcast.artwork,
      }
    })

    console.log('[RSS Parser] Parsed successfully:', {
      podcastTitle: podcast.title,
      episodeCount: episodes.length,
      firstEpisodeAudioUrl: episodes[0]?.audioUrl
    })

    return { episodes, podcast }
  } catch (error) {
    console.error('[RSS Parser] Error:', error)
    throw error
  }
}

/**
 * Parse duration string (HH:MM:SS or MM:SS) to seconds
 */
function parseDuration(duration: string): number {
  const parts = duration.split(':').map(Number)
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  return 0
}

/**
 * Strip HTML tags from string
 */
function stripHtmlTags(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

/**
 * Simple ID generator
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}
