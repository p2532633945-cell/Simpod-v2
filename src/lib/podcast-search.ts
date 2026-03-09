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
    title: 'BBC Global News Podcast',
    author: 'BBC World Service',
    feedUrl: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/27/31/27/273127e0-d2f4-1b04-8b09-9c2ed8fd1ed2/mza_13993852184597073768.jpg/600x600bb.jpg',
    description: 'The best stories, interviews and on the spot reporting from around the world.',
    source: 'itunes',
  },
  {
    id: 'mock-2',
    title: 'TED Talks Daily',
    author: 'TED',
    feedUrl: 'https://feeds.acast.com/public/shows/tedtalks',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/6a/0c/a6/6a0ca669-1e58-d0df-c799-8c1f0de1c0ad/mza_14056477892931697430.jpg/600x600bb.jpg',
    description: 'TED Talks Daily brings you the latest TED Talks in audio format.',
    source: 'itunes',
  },
  {
    id: 'mock-3',
    title: 'The Daily',
    author: 'The New York Times',
    feedUrl: 'https://feeds.simplecast.com/54nAGcIl',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/fp/ga/7f/fpga7ffe-7d9f-c390-5136-31709aff4019/mza_14056477892931697430.jpg/600x600bb.jpg',
    description: 'This is what the news should sound like. The biggest stories of our time.',
    source: 'itunes',
  },
  {
    id: 'mock-4',
    title: 'Stuff You Should Know',
    author: 'iHeartRadio',
    feedUrl: 'https://feeds.megaphone.fm/stuffyoushouldknow',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/be/ae/1c/beae1c7f-1e58-d0df-c799-8c1f0de1c0ad/mza_14056477892931697430.jpg/600x600bb.jpg',
    description: 'If you have ever wondered how something works, you are not alone.',
    source: 'itunes',
  },
  {
    id: 'mock-5',
    title: 'Planet Money',
    author: 'NPR',
    feedUrl: 'https://feeds.npr.org/510289/podcast.xml',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/9a/8b/7c/9a8b7c12-1e58-d0df-c799-8c1f0de1c0ad/mza_14056477892931697430.jpg/600x600bb.jpg',
    description: 'Imagine you could call up a friend and say, "Meet me at the cafe and tell me what\'s going on with the economy."',
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
