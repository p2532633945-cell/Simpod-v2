/**
 * Podcast Search Service
 *
 * 搜索播客 - 使用 iTunes Search API (简化版本，更稳定)
 * 如果 iTunes API 失败，fallback 到 mock 数据
 */

import type { Podcast } from '@/types/simpod'

interface ITunesResult {
  collectionId: number
  collectionName: string
  artistName: string
  feedUrl: string
  artworkUrl100: string
  artworkUrl60: string
  artworkUrl30?: string
  description?: string
}

interface ITunesResponse {
  resultCount: number
  results: ITunesResult[]
}

// Mock podcast data as fallback for development
const MOCK_PODCASTS: Podcast[] = [
  {
    id: 'mock-1',
    title: 'Planet Money',
    author: 'NPR',
    feedUrl: 'https://feeds.npr.org/510289/podcast.xml',
    artwork: 'https://media.npr.org/assets/img/2022/09/23/pm_podcasttile_sq-64a70d92da8c8ce382c2b39e7be0c7060d6e1e0c.jpg',
    description: 'Imagine you could call up a friend and say, "Meet me at the cafe and tell me what\'s going on with the economy."',
    source: 'itunes',
  },
  {
    id: 'mock-2',
    title: 'NPR News Now',
    author: 'NPR',
    feedUrl: 'https://feeds.npr.org/500005/podcast.xml',
    artwork: 'https://media.npr.org/assets/img/2022/09/23/npr-news-now_tile_sq-64a70d92da8c8ce382c2b39e7be0c7060d6e1e0c.jpg',
    description: 'NPR\'s newscast covering the most important stories of the day.',
    source: 'itunes',
  },
  {
    id: 'mock-3',
    title: 'Fresh Air',
    author: 'NPR',
    feedUrl: 'https://feeds.npr.org/381444908/podcast.xml',
    artwork: 'https://media.npr.org/assets/img/2022/09/23/fresh-air_tile_sq-64a70d92da8c8ce382c2b39e7be0c7060d6e1e0c.jpg',
    description: 'Fresh Air from WHYY, the Peabody Award-winning weekday magazine of contemporary arts and issues.',
    source: 'itunes',
  },
  {
    id: 'mock-4',
    title: 'Invisibilia',
    author: 'NPR',
    feedUrl: 'https://feeds.npr.org/510307/podcast.xml',
    artwork: 'https://media.npr.org/assets/img/2022/09/23/invisibilia_tile_sq.jpg',
    description: 'Unseeable forces that control human behavior and shape our ideas, beliefs, and assumptions.',
    source: 'itunes',
  },
  {
    id: 'mock-5',
    title: 'Lex Fridman Podcast',
    author: 'Lex Fridman',
    feedUrl: 'https://lexfridman.com/feed/podcast/',
    artwork: 'https://lexfridman.com/wordpress/wp-content/uploads/powerpress/artwork_3000-230.png',
    description: 'Conversations about the nature of intelligence, consciousness, love, and power.',
    source: 'itunes',
  },
]

/**
 * Search iTunes API via our proxy (avoids CORS issues)
 */
async function searchITunes(query: string): Promise<Podcast[]> {
  if (!query.trim()) return []

  try {
    const response = await fetch(
      `/api/itunes-proxy?term=${encodeURIComponent(query)}&limit=30`
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[iTunes] API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        query
      })
      throw new Error(`iTunes API error: HTTP ${response.status}`)
    }

    const data: ITunesResponse = await response.json()

    if (!data.results || data.results.length === 0) {
      console.log('[iTunes] No results found for:', query)
      return []
    }

    console.log(`[iTunes] Found ${data.results.length} podcasts for:`, query)

    return data.results
      .filter(item => item.feedUrl) // Only include items with feed URLs
      .map((item) => ({
        id: `itunes-${item.collectionId}`,
        title: item.collectionName,
        author: item.artistName,
        feedUrl: item.feedUrl,
        artwork: item.artworkUrl100 || item.artworkUrl60,
        description: item.description || '',
        source: 'itunes' as const,
      }))
  } catch (err) {
    const error = err as Error
    console.error('[iTunes Search] Error:', {
      message: error.message,
      name: error.name,
      query
    })
    throw error // Re-throw to let caller handle
  }
}

/**
 * Filter mock podcasts by query
 */
function filterMockPodcasts(query: string): Podcast[] {
  const lowerQuery = query.toLowerCase()
  return MOCK_PODCASTS.filter(p =>
    p.title.toLowerCase().includes(lowerQuery) ||
    p.author.toLowerCase().includes(lowerQuery) ||
    (p.description && p.description.toLowerCase().includes(lowerQuery))
  )
}

/**
 * 搜索播客 - 使用 iTunes Search API
 * 如果失败，fallback 到 mock 数据
 *
 * @param query - 搜索关键词
 * @returns Podcast 数组
 */
export async function searchPodcasts(query: string): Promise<Podcast[]> {
  if (!query.trim()) return []

  // Try iTunes API first
  try {
    const results = await searchITunes(query)
    if (results.length > 0) {
      return results.slice(0, 30)
    }
  } catch (error) {
    console.warn('[Podcast Search] iTunes API failed, using mock data:', error)
  }

  // Fallback to mock data
  console.log('[Podcast Search] Using mock data for:', query)
  const mockResults = filterMockPodcasts(query)

  // If no mock results match, return all mock podcasts for development
  if (mockResults.length === 0) {
    console.log('[Podcast Search] No mock results matched, returning all mock podcasts')
    return MOCK_PODCASTS.slice(0, 10)
  }

  return mockResults
}
