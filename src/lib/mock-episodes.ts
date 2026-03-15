/**
 * Mock Episodes for Testing
 *
 * 用于测试播放功能的模拟剧集数据
 * 音频来源：可靠的公开测试音频
 */

import type { Episode } from '@/types/simpod'

// 使用可靠的公开测试音频
const TEST_AUDIO_URLS = [
  // W3C 测试音频（短小可靠）
  'https://www.w3schools.com/html/horse.mp3',
  // Mozilla 测试音频
  'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
  // 公共领域音频
  'https://upload.wikimedia.org/wikipedia/commons/d/d9/Wilhelm_Scream.ogg',
]

export const MOCK_EPISODES: Episode[] = [
  {
    id: 'mock-ep-1',
    title: 'Episode 1: Introduction to Simpod',
    description: 'Welcome to Simpod! In this episode, we introduce the core concepts of extensive listening and how to use hotzones effectively.',
    pubDate: '2026-03-01T10:00:00Z',
    audioUrl: TEST_AUDIO_URLS[0],
    duration: 30,
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/27/31/27/273127e0-d2f4-1b04-8b09-9c2ed8fd1ed2/mza_13993852184597073768.jpg/600x600bb.jpg',
  },
  {
    id: 'mock-ep-2',
    title: 'Episode 2: Advanced Hotzone Techniques',
    description: 'Learn how to create and manage hotzones for more efficient language learning.',
    pubDate: '2026-03-05T10:00:00Z',
    audioUrl: TEST_AUDIO_URLS[1],
    duration: 20,
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/27/31/27/273127e0-d2f4-1b04-8b09-9c2ed8fd1ed2/mza_13993852184597073768.jpg/600x600bb.jpg',
  },
  {
    id: 'mock-ep-3',
    title: 'Episode 3: Batch Review Strategies',
    description: 'Discover the best practices for reviewing your hotzones in batches.',
    pubDate: '2026-03-08T10:00:00Z',
    audioUrl: TEST_AUDIO_URLS[2],
    duration: 15,
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/27/31/27/273127e0-d2f4-1b04-8b09-9c2ed8fd1ed2/mza_13993852184597073768.jpg/600x600bb.jpg',
  },
]
