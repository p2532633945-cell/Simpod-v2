/**
 * Simpod v2 - Mock Data
 * 
 * 用于本地开发和演示的模拟数据
 */

import type {
  Anchor,
  Hotzone,
  Podcast,
  Episode,
  Project,
  Word,
  TranscriptSegment,
} from "@/types/simpod"

// ============================================
// Mock Podcasts
// ============================================

export const mockPodcasts: Podcast[] = [
  {
    id: "pod-1",
    title: "The Economist Podcasts",
    author: "The Economist",
    feedUrl: "https://example.com/economist-feed",
    artwork: "/placeholder.svg",
    description: "Weekly analysis of world events and economic trends",
    source: "itunes",
  },
  {
    id: "pod-2",
    title: "All-In Podcast",
    author: "Chamath Palihapitiya, Jason Calacanis, David Sacks, David Friedberg",
    feedUrl: "https://example.com/allin-feed",
    artwork: "/placeholder.svg",
    description: "Industry veterans, best friends, and tech titans",
    source: "itunes",
  },
  {
    id: "pod-3",
    title: "Acquired",
    author: "Ben Gilbert and David Rosenthal",
    feedUrl: "https://example.com/acquired-feed",
    artwork: "/placeholder.svg",
    description: "The podcast about great technology companies and the stories behind them",
    source: "podcastindex",
  },
]

// ============================================
// Mock Episodes
// ============================================

export const mockEpisodes: Episode[] = [
  {
    id: "ep-1",
    title: "The fiscal implications of quantitative easing",
    description: "An in-depth analysis of central bank policies and their long-term economic effects",
    pubDate: "2026-03-01T10:00:00Z",
    audioUrl: "https://example.com/audio/economist-ep1.mp3",
    duration: 2400, // 40 minutes
    artwork: "/placeholder.svg",
  },
  {
    id: "ep-2",
    title: "AI disruption in traditional industries",
    description: "How artificial intelligence is reshaping manufacturing, healthcare, and finance",
    pubDate: "2026-02-28T10:00:00Z",
    audioUrl: "https://example.com/audio/economist-ep2.mp3",
    duration: 1800, // 30 minutes
    artwork: "/placeholder.svg",
  },
  {
    id: "ep-3",
    title: "The future of work and remote collaboration",
    description: "Exploring how technology is changing workplace dynamics",
    pubDate: "2026-02-25T10:00:00Z",
    audioUrl: "https://example.com/audio/economist-ep3.mp3",
    duration: 2100, // 35 minutes
    artwork: "/placeholder.svg",
  },
]

// ============================================
// Mock Hotzones
// ============================================

export const mockWords: Word[] = [
  { word: "So", start: 52.0, end: 52.2 },
  { word: "the", start: 52.2, end: 52.35 },
  { word: "fiscal", start: 52.35, end: 52.8 },
  { word: "implications", start: 52.8, end: 53.5 },
  { word: "of", start: 53.5, end: 53.65 },
  { word: "quantitative", start: 53.65, end: 54.3 },
  { word: "easing", start: 54.3, end: 54.8 },
  { word: "are", start: 54.8, end: 54.95 },
  { word: "often", start: 54.95, end: 55.3 },
  { word: "understated", start: 55.3, end: 56.0 },
  { word: "by", start: 56.0, end: 56.15 },
  { word: "mainstream", start: 56.15, end: 56.7 },
  { word: "media", start: 56.7, end: 57.1 },
]

export const mockHotzones: Hotzone[] = [
  {
    id: "hz-1",
    audio_id: "ep-1",
    start_time: 52.0,
    end_time: 72.0,
    transcript_snippet: "So the fiscal implications of quantitative easing are often understated by mainstream media...",
    transcript_words: mockWords,
    source: "manual",
    metadata: {
      transcript_words: mockWords,
      confidence: 0.95,
      difficulty_score: 7,
    },
    status: "pending",
    created_at: "2026-03-08T10:00:00Z",
  },
  {
    id: "hz-2",
    audio_id: "ep-1",
    start_time: 125.0,
    end_time: 145.0,
    transcript_snippet: "...what we call the paradox of thrift essentially means that individual saving can lead to collective economic decline...",
    source: "manual",
    metadata: {
      confidence: 0.92,
      difficulty_score: 8,
    },
    status: "pending",
    created_at: "2026-03-08T10:05:00Z",
  },
  {
    id: "hz-3",
    audio_id: "ep-1",
    start_time: 280.0,
    end_time: 300.0,
    transcript_snippet: "The disproportionately allocated capital expenditure across emerging markets has created new dynamics...",
    source: "auto",
    metadata: {
      confidence: 0.88,
      difficulty_score: 9,
    },
    status: "reviewed",
    created_at: "2026-03-08T10:10:00Z",
  },
  {
    id: "hz-4",
    audio_id: "ep-1",
    start_time: 420.0,
    end_time: 440.0,
    transcript_snippet: "Basically they're kicking the can down the road, which is par for the course in Washington...",
    source: "manual",
    metadata: {
      confidence: 0.97,
      difficulty_score: 5,
    },
    status: "archived",
    created_at: "2026-03-08T10:15:00Z",
  },
  {
    id: "hz-5",
    audio_id: "ep-1",
    start_time: 580.0,
    end_time: 600.0,
    transcript_snippet: "The inflationary pressure from supply chain disruptions is something economists call a cost-push spiral...",
    source: "manual",
    metadata: {
      confidence: 0.91,
      difficulty_score: 8,
    },
    status: "pending",
    created_at: "2026-03-08T10:20:00Z",
  },
]

// ============================================
// Mock Anchors
// ============================================

export const mockAnchors: Anchor[] = [
  {
    id: "anc-1",
    audio_id: "ep-1",
    timestamp: 54.5,
    source: "manual",
    created_at: "2026-03-08T10:00:00Z",
  },
  {
    id: "anc-2",
    audio_id: "ep-1",
    timestamp: 127.3,
    source: "manual",
    created_at: "2026-03-08T10:05:00Z",
  },
  {
    id: "anc-3",
    audio_id: "ep-1",
    timestamp: 285.0,
    source: "auto",
    created_at: "2026-03-08T10:10:00Z",
  },
]

// ============================================
// Mock Projects
// ============================================

export const mockProjects: Project[] = [
  {
    id: "proj-1",
    podcast: mockPodcasts[0],
    episode: mockEpisodes[0],
    hotzoneCount: 5,
    pendingCount: 3,
    lastAccessed: "2026-03-08T15:30:00Z",
  },
  {
    id: "proj-2",
    podcast: mockPodcasts[1],
    episode: mockEpisodes[1],
    hotzoneCount: 8,
    pendingCount: 2,
    lastAccessed: "2026-03-07T10:00:00Z",
  },
  {
    id: "proj-3",
    podcast: mockPodcasts[2],
    episode: mockEpisodes[2],
    hotzoneCount: 3,
    pendingCount: 1,
    lastAccessed: "2026-03-05T14:20:00Z",
  },
]

// ============================================
// Mock Transcript Segments
// ============================================

export const mockTranscriptSegments: TranscriptSegment[] = [
  {
    audio_id: "ep-1",
    start_time: 0,
    end_time: 30,
    text: "Welcome to this week's episode. Today we're discussing the complex interplay between monetary policy and fiscal outcomes in the post-pandemic economy.",
    words: [
      { word: "Welcome", start: 0.0, end: 0.4 },
      { word: "to", start: 0.4, end: 0.5 },
      { word: "this", start: 0.5, end: 0.7 },
      { word: "week's", start: 0.7, end: 1.0 },
      { word: "episode", start: 1.0, end: 1.5 },
    ],
  },
  {
    audio_id: "ep-1",
    start_time: 52,
    end_time: 72,
    text: "So the fiscal implications of quantitative easing are often understated by mainstream media...",
    words: mockWords,
  },
]

// ============================================
// Helper Functions
// ============================================

/** 获取特定音频的热区 */
export function getHotzonesForAudio(audioId: string): Hotzone[] {
  return mockHotzones.filter((hz) => hz.audio_id === audioId)
}

/** 获取特定状态的热区 */
export function getHotzonesByStatus(
  status: "pending" | "reviewed" | "archived"
): Hotzone[] {
  return mockHotzones.filter((hz) => hz.status === status)
}

/** 生成唯一 ID */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/** 格式化时间显示 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

/** 格式化日期显示 - 使用 UTC 时间避免 hydration 不匹配 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  return `${year}年${month}月${day}日`
}
