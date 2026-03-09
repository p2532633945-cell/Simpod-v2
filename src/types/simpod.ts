/**
 * Simpod v2 - Core Type Definitions
 *
 * 严格遵守技术契约定义的类型，禁止使用 any
 */

// ============================================
// 基础类型
// ============================================

/** 单词级别的时间戳数据 */
export type Word = {
  word: string
  start: number
  end: number
}

/** 播放器状态 */
export type PlayerState = {
  currentTime: number
  duration: number
  isPlaying: boolean
  playbackRate: number
  volume: number
}

// ============================================
// 核心业务类型
// ============================================

/** 锚点 - 用户标记的时间戳 */
export interface Anchor {
  id: string
  audio_id: string
  timestamp: number
  source: 'manual' | 'auto'
  created_at: string
}

/** 热区 - 基于锚点生成的音频片段 */
export interface Hotzone {
  id: string
  audio_id: string
  start_time: number
  end_time: number
  transcript_snippet?: string
  transcript_words?: Word[]
  source: 'manual' | 'auto'
  metadata: HotzoneMetadata
  status: 'pending' | 'reviewed' | 'archived'
  created_at: string
}

/** 热区元数据 */
export interface HotzoneMetadata {
  transcript_words?: Word[]
  confidence?: number
  difficulty_score?: number
  user_adjustment_history?: Array<{
    action: string
    timestamp: string
  }>
}

/** 转录片段 - 用于缓存和共享 */
export interface TranscriptSegment {
  audio_id: string
  start_time: number
  end_time: number
  text: string
  words?: Word[]
}

// ============================================
// Podcast 相关类型
// ============================================

/** Podcast 搜索结果 */
export interface Podcast {
  id: string
  title: string
  author: string
  feedUrl: string
  artwork: string
  description?: string
  source?: 'podcastindex' | 'itunes' | 'rss'
}

/** Podcast 单集 */
export interface Episode {
  id: string
  title: string
  description: string
  pubDate: string
  audioUrl: string
  duration?: number
  artwork?: string
}

/** 项目（用于首页展示） */
export interface Project {
  id: string
  podcast: Podcast
  episode: Episode
  hotzoneCount: number
  pendingCount: number
  lastAccessed: string
}

// ============================================
// 组件 Props 接口契约
// ============================================

/** 播放控制组件 Props */
export interface PlaybackControlsProps {
  playerState: PlayerState
  onSeek: (time: number) => void
  onPlayPause: () => void
  onRateChange: (rate: number) => void
}

/** MARK 按钮组件 Props */
export interface MarkButtonProps {
  currentTime: number
  onMark: (timestamp: number) => void
  disabled?: boolean
}

/** 转录流组件 Props */
export interface TranscriptStreamProps {
  words: Word[]
  currentTime: number
  onWordClick: (time: number) => void
}

/** 热区波形组件 Props */
export interface HotzoneWaveformProps {
  hotzones: Hotzone[]
  currentTime: number
  duration: number
  onHotzoneJump: (hotzoneId: string, startTime: number) => void
  onSeek: (time: number) => void
}

/** 热区侧边栏组件 Props */
export interface HotzoneSidebarProps {
  hotzones: Hotzone[]
  selectedHotzoneId?: string
  onHotzoneJump: (hotzoneId: string, startTime: number) => void
  onHotzoneToggleReviewed: (hotzoneId: string, reviewed: boolean) => void
  onHotzoneSelect?: (hotzoneId: string) => void
}

/** 复习队列面板组件 Props */
export interface ReviewQueuePanelProps {
  hotzones: Hotzone[]
  onHotzoneJump: (hotzoneId: string, startTime: number) => void
  onHotzoneToggleReviewed: (hotzoneId: string, reviewed: boolean) => void
}

// ============================================
// UI 状态类型
// ============================================

/** 加载状态 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

/** 筛选状态 */
export type HotzoneFilter = 'all' | 'pending' | 'reviewed' | 'archived'

/** 通用错误类型 */
export interface AppError {
  code: string
  message: string
  details?: unknown
}
