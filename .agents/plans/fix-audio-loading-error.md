# 修复计划：音频加载、搜索扩展和剧集选择

## 测试日期
2026-03-08

## 问题描述

### 问题 1: 音频加载失败 🔥 阻塞
```
[Player] Audio element error: {}
```
**影响**: 无法播放音频，无法测试 MARK 和转录功能

### 问题 2: 搜索结果有限
- 目前只使用 Podcast Index API
- 没有使用 iTunes/Search API
- 搜索结果数量少

### 问题 3: 无法选择剧集
- 搜索结果只有播客信息
- 没有显示 episodes 列表
- 点击后直接进入 demo 播放器

### 问题 4: MARK 和转录未测试
- 因为音频无法播放
- 不知道 Groq API 是否正常工作
- 不知道数据库保存是否成功

---

## 修复计划

### 阶段 0：增强错误诊断（5分钟）

**任务 0.1：获取详细错误信息**
```typescript
// 在 PodcastPlayerPage.tsx 中
const handleError = (e: Event) => {
  const audio = e.target as HTMLAudioElement
  console.error("[Player] Audio error:", {
    error: audio.error,
    code: audio.error?.code,
    message: audio.error?.message,
    src: audio.src,
    networkState: audio.networkState,
    readyState: audio.readyState
  })
  setAudioLoading(false)
  setAudioError(getAudioErrorMessage(audio.error?.code))
}

const getAudioErrorMessage = (code?: number): string => {
  const errorMessages: Record<number, string> = {
    1: "User aborted the audio loading.",
    2: "A network error occurred while loading the audio.",
    3: "The audio decoding failed.",
    4: "The audio format is not supported."
  }
  return errorMessages[code || 0] || "Failed to load audio. Please try again."
}
```

---

### 阶段 1：修复音频加载（15分钟）

**任务 1.1：创建本地演示音频**
```bash
# 创建 public 目录
mkdir -p public/audio

# 下载一个可靠的公开音频文件
# 使用 archive.org 的免费音频
curl -o public/audio/demo.mp3 "https://archive.org/download/testmp3/testfile.mp3"
```

**任务 1.2：更新音频源优先级**
```typescript
// src/constants/audio.ts (新建)
export const DEMO_AUDIO_URLS = [
  "/audio/demo.mp3",              // 本地文件（优先）
  "data:audio/wav;base64,...",    // Base64 备用
  "/api/audio-proxy?url=...",     // 代理备用
]
```

**任务 1.3：使用本地音频**
```typescript
// 在 PodcastPlayerPage.tsx 中
const DEMO_AUDIO_URL = "/audio/demo.mp3"
```

**任务 1.4：验证本地音频可访问**
```bash
# 启动开发服务器
npm run dev

# 在浏览器访问
# http://localhost:3000/audio/demo.mp3
# 应该能直接播放
```

---

### 阶段 2：实现 RSS Feed 解析（30分钟）

**任务 2.1：创建 RSS 解析服务**
```typescript
// src/lib/rss-parser.ts

export interface Episode {
  title: string
  description: string
  pubDate: string
  audioUrl: string
  duration?: number
  artwork?: string
}

export async function parseFeed(feedUrl: string): Promise<{ episodes: Episode[], podcast: Podcast }> {
  try {
    // 使用我们的代理获取 RSS
    const response = await fetch(`/api/rss-proxy?url=${encodeURIComponent(feedUrl)}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.statusText}`)
    }

    const xmlText = await response.text()

    // 使用浏览器原生的 DOMParser
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlText, "application/xml")

    // 解析 podcast 信息
    const channel = doc.querySelector('channel')
    const podcast: Podcast = {
      id: generateId(),
      title: channel?.querySelector('title')?.textContent || '',
      author: channel?.querySelector('itunes:author')?.textContent ||
              channel?.querySelector('author')?.textContent || '',
      feedUrl,
      artwork: channel?.querySelector('itunes:image')?.getAttribute('href') ||
               channel?.querySelector('image > url')?.textContent || '',
      description: channel?.querySelector('description')?.textContent || '',
      source: 'rss' as const,
    }

    // 解析 episodes
    const items = doc.querySelectorAll('item')
    const episodes: Episode[] = Array.from(items).map((item) => {
      const enclosure = item.querySelector('enclosure')
      const duration = item.querySelector('itunes:duration')?.textContent

      return {
        id: generateId(),
        title: item.querySelector('title')?.textContent || '',
        description: item.querySelector('description')?.textContent || '',
        pubDate: item.querySelector('pubDate')?.textContent || '',
        audioUrl: enclosure?.getAttribute('url') || '',
        duration: duration ? parseDuration(duration) : undefined,
        artwork: item.querySelector('itunes:image')?.getAttribute('href') || podcast.artwork,
      }
    })

    return { episodes, podcast }
  } catch (error) {
    console.error('[RSS Parser] Error:', error)
    throw error
  }
}

function parseDuration(duration: string): number {
  // "1:23:45" -> 5025 seconds
  const parts = duration.split(':').map(Number)
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  return 0
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}
```

**任务 2.2：创建 RSS 代理 API**
```typescript
// src/app/api/rss-proxy/route.ts (新建)
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const feedUrl = req.nextUrl.searchParams.get('url')

  if (!feedUrl) {
    return NextResponse.json({ error: 'Missing feed URL' }, { status: 400 })
  }

  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Simpod/2.0',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const text = await response.text()

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300', // 5分钟缓存
      },
    })
  } catch (error: any) {
    console.error('[RSS Proxy] Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

**任务 2.3：创建播客详情页面**
```typescript
// src/app/podcast/[id]/page.tsx (新建)
import { parseFeed } from '@/lib/rss-parser'
import { EpisodeList } from '@/components/podcast/EpisodeList'

interface PodcastPageProps {
  params: Promise<{ id: string }>
}

export default async function PodcastPage({ params }: PodcastPageProps) {
  const { id } = await params

  // 从 URL 或数据库获取 feedUrl
  // 暂时使用 mock 数据
  const mockFeedUrl = "https://feeds.npr.org/510289/podcast.xml"

  try {
    const { episodes, podcast } = await parseFeed(mockFeedUrl)

    return (
      <div className="min-h-screen bg-background">
        {/* Podcast Header */}
        <header className="border-b border-border bg-card/50 p-6">
          <h1 className="text-2xl font-bold">{podcast.title}</h1>
          <p className="text-muted-foreground">{podcast.description}</p>
        </header>

        {/* Episodes List */}
        <EpisodeList
          episodes={episodes}
          podcast={podcast}
        />
      </div>
    )
  } catch (error) {
    return (
      <div className="p-6">
        <p>Failed to load podcast: {error.message}</p>
      </div>
    )
  }
}
```

---

### 阶段 3：扩展搜索功能（20分钟）

**任务 3.1：添加 iTunes 搜索 API**
```typescript
// src/lib/podcast-search.ts - 扩展现有函数

// 添加 iTunes 搜索
async function searchITunes(query: string): Promise<Podcast[]> {
  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=podcast&limit=10`
  )

  if (!response.ok) {
    throw new Error('iTunes API error')
  }

  const data = await response.json()

  return data.results.map((item: any) => ({
    id: `itunes-${item.collectionId}`,
    title: item.collectionName,
    author: item.artistName,
    feedUrl: item.feedUrl,
    artwork: item.artworkUrl100 || item.artworkUrl60,
    description: '',
    source: 'itunes' as const,
  }))
}

// 合并搜索结果
export async function searchPodcasts(query: string): Promise<Podcast[]> {
  const [indexResults, itunesResults] = await Promise.allSettled([
    searchPodcastIndex(query),
    searchITunes(query),
  ])

  const results: Podcast[] = []

  if (indexResults.status === 'fulfilled') {
    results.push(...indexResults.value)
  }

  if (itunesResults.status === 'fulfilled') {
    results.push(...itunesResults.value)
  }

  // 去重（基于 feedUrl）
  const unique = Array.from(
    new Map(results.map(p => [p.feedUrl, p])).values()
  )

  return unique.slice(0, 20) // 最多返回20个
}
```

**任务 3.2：更新搜索结果显示**
```typescript
// src/app/page.tsx - 修改 SearchResultCard

function SearchResultCard({ podcast }: { podcast: Podcast }) {
  // 链接到播客详情页面（显示 episodes）
  const podcastPageId = `podcast-${podcast.id}`

  return (
    <Link
      href={`/podcast/${podcastPageId}`}
      className={cn(...)}
    >
      {/* 显示播客信息 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">
          {podcast.episodes?.length || 0} episodes
        </span>
      </div>
    </Link>
  )
}
```

---

### 阶段 4：创建 Episode 选择组件（20分钟）

**任务 4.1：创建 EpisodeList 组件**
```typescript
// src/components/podcast/EpisodeList.tsx (新建)
"use client"

import { useState } from 'react'
import { Play, Clock, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Episode } from '@/types/simpod'
import { formatTime } from '@/lib/time'
import Link from 'next/link'

interface EpisodeListProps {
  episodes: Episode[]
  podcast: {
    title: string
    artwork: string
  }
}

export function EpisodeList({ episodes, podcast }: EpisodeListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="divide-y divide-border">
      {episodes.map((episode, index) => (
        <EpisodeItem
          key={episode.id}
          episode={episode}
          index={index + 1}
          isExpanded={expandedId === episode.id}
          onToggle={() => setExpandedId(expandedId === episode.id ? null : episode.id)}
          podcastTitle={podcast.title}
          podcastArtwork={podcast.artwork}
        />
      ))}
    </div>
  )
}

function EpisodeItem({
  episode,
  index,
  isExpanded,
  onToggle,
  podcastTitle,
  podcastArtwork
}: any) {
  return (
    <div className="p-4 hover:bg-secondary/50 transition-colors">
      <div
        className="flex items-start gap-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-muted-foreground">
          {index}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground line-clamp-2">
            {episode.title}
          </h3>

          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            {episode.duration && (
              <div className="flex items-center gap-1">
                <Clock size={14} />
                {formatTime(episode.duration)}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(episode.pubDate).toLocaleDateString()}
            </div>
          </div>

          {isExpanded && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
              {episode.description}
            </p>
          )}
        </div>

        <Link
          href={`/workspace/${episode.id}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full",
            "bg-simpod-mark text-simpod-dark",
            "flex items-center justify-center",
            "hover:scale-105 transition-transform"
          )}
          aria-label="播放此集"
        >
          <Play size={16} className="ml-0.5" fill="currentColor" />
        </Link>
      </div>
    </div>
  )
}
```

---

### 阶段 5：修复播放器音频 URL（15分钟）

**任务 5.1：传递 episode 信息到播放器**
```typescript
// src/app/workspace/[id]/page.tsx

interface WorkspacePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ audioUrl?: string }>
}

export default async function WorkspacePage({ params, searchParams }: WorkspacePageProps) {
  const { id } = await params
  const { audioUrl } = await searchParams

  return <PodcastPlayerPage audioId={id} audioUrl={audioUrl} />
}
```

**任务 5.2：更新 PodcastPlayerPage 接收 audioUrl**
```typescript
interface PodcastPlayerPageProps {
  audioId: string
  audioUrl?: string
}

export function PodcastPlayerPage({ audioId, audioUrl }: PodcastPlayerPageProps) {
  // 使用传入的 audioUrl 或 fallback 到本地
  const currentAudioUrl = audioUrl || "/audio/demo.mp3"

  return (
    <audio
      ref={audioRef}
      src={currentAudioUrl}
      preload="auto"
      crossOrigin="anonymous"
      className="hidden"
    />
  )
}
```

---

### 阶段 6：测试 MARK 和转录功能（10分钟）

**任务 6.1：验证音频播放**
- [ ] 点击播放按钮，音频开始播放
- [ ] 进度条正确显示
- [ ] 时间显示正确

**任务 6.2：测试 MARK 功能**
- [ ] 点击 MARK 按钮
- [ ] 查看控制台日志：`[Player] Creating hotzone from anchor at: XX.XX`
- [ ] 查看控制台日志：`[API] Transcribing Hotzone...`
- [ ] 热区出现在侧边栏

**任务 6.3：验证转录结果**
- [ ] 热区显示转录文本
- [ ] 文本不为空或 "[Processing Failed]"
- [ ] 点击热区能跳转播放

**任务 6.4：验证数据库保存**
- [ ] 刷新页面
- [ ] 之前创建的热区仍然存在
- [ ] 检查 Supabase 数据库 hotzones 表

---

## 文件修改清单

### 新建文件：
1. `src/lib/rss-parser.ts` - RSS 解析服务
2. `src/app/api/rss-proxy/route.ts` - RSS 代理 API
3. `src/app/podcast/[id]/page.tsx` - 播客详情页
4. `src/components/podcast/EpisodeList.tsx` - 剧集列表组件
5. `src/constants/audio.ts` - 音频常量
6. `public/audio/demo.mp3` - 演示音频文件

### 修改文件：
1. `src/lib/podcast-search.ts` - 扩展搜索功能
2. `src/app/page.tsx` - 更新搜索结果链接
3. `src/components/player/PodcastPlayerPage.tsx` - 接收 audioUrl prop
4. `src/app/workspace/[id]/page.tsx` - 传递 audioUrl

---

## 验证命令

```bash
# 类型检查
npx tsc --noEmit

# Lint
npm run lint

# 构建
npm run build
```

---

## 验收标准

### 阶段 1：音频加载
- [ ] 本地音频文件可以播放
- [ ] 错误信息清晰明确
- [ ] 无 "Audio element error" 错误

### 阶段 2：RSS 解析
- [ ] 可以解析 RSS feed
- [ ] 显示 episode 列表
- [ ] 点击 episode 进入播放器

### 阶段 3：搜索扩展
- [ ] 搜索结果包含更多播客
- [ ] 去重正确
- [ ] 显示 episode 数量

### 阶段 4：Episode 选择
- [ ] 显示 episode 列表
- [ ] 展开/折叠描述
- [ ] 播放按钮跳转正确

### 阶段 5：播放器集成
- [ ] 播放器使用正确的 audioUrl
- [ ] 音频正常播放

### 阶段 6：MARK 和转录
- [ ] MARK 创建热区
- [ ] 转录显示文本
- [ ] 数据持久化工作

---

## 执行顺序建议

1. **先执行阶段 0-1**：修复音频加载，让基础播放工作
2. **测试播放**：确认音频能播放后，再测试 MARK
3. **执行阶段 2-4**：实现 RSS 解析和 episode 选择
4. **执行阶段 5-6**：集成和完整测试

---

## 已知风险

1. **RSS CORS**：某些 RSS feed 可能不允许跨域访问
2. **音频格式**：不同 podcast 使用不同音频格式
3. **Groq API 限制**：可能有速率限制
4. **网络延迟**：RSS 解析和音频加载都需要时间

---

## 备选方案

### 如果 RSS 解析太复杂
使用 [podcast-index-api](https://podcastindex-org.github.io/docs/) 的 `/byfeedurl` 端点获取 episodes

### 如果本地音频文件不可行
使用 Base64 编码的短音频作为 fallback

### 如果 iTunes API 有 CORS 问题
添加 `/api/itunes-proxy` 路由

---

**优先级**: 🔥 高（核心功能）
**预计完成时间**: 2-3小时（分阶段执行）
**信心评分**: 8/10
