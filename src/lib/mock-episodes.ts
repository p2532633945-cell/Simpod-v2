/**
 * Mock Episodes for Testing
 *
 * 用于测试播放功能的模拟剧集数据
 */

import type { Episode } from '@/types/simpod'

export const MOCK_EPISODES: Episode[] = [
  {
    id: 'mock-ep-1',
    title: 'Episode 1: Introduction to Simpod',
    description: 'Welcome to Simpod! In this episode, we introduce the core concepts of extensive listening and how to use hotzones effectively.',
    pubDate: '2026-03-01T10:00:00Z',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 360,
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/27/31/27/273127e0-d2f4-1b04-8b09-9c2ed8fd1ed2/mza_13993852184597073768.jpg/600x600bb.jpg',
  },
  {
    id: 'mock-ep-2',
    title: 'Episode 2: Advanced Hotzone Techniques',
    description: 'Learn how to create and manage hotzones for more efficient language learning.',
    pubDate: '2026-03-05T10:00:00Z',
    audioUrl: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
    duration: 240,
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/27/31/27/273127e0-d2f4-1b04-8b09-9c2ed8fd1ed2/mza_13993852184597073768.jpg/600x600bb.jpg',
  },
  {
    id: 'mock-ep-3',
    title: 'Episode 3: Batch Review Strategies',
    description: 'Discover the best practices for reviewing your hotzones in batches.',
    pubDate: '2026-03-08T10:00:00Z',
    audioUrl: 'https://archive.org/download/testmp3/testfile.mp3',
    duration: 300,
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/27/31/27/273127e0-d2f4-1b04-8b09-9c2ed8fd1ed2/mza_13993852184597073768.jpg/600x600bb.jpg',
  },
]
