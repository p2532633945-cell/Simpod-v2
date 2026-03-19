"use client"

/**
 * Podcast Detail Page
 *
 * Displays podcast information and episode list
 * Client component to support DOMParser for RSS parsing
 */

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { podcastManager } from "@/services/podcast-manager"
import { EpisodeList } from "@/components/podcast/EpisodeList"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import type { Podcast, Episode } from "@/types/simpod"
import { saveTranscript } from "@/services/supabase"
import { parseTranscript } from "@/lib/transcript-parser"

/**
 * Task 3.2: 后台预存官方转录
 * 下载 VTT/SRT 文件，解析后按时间段存入 transcripts 表
 * 静默执行，不影响 UI
 */
async function prefetchOfficialTranscript(episode: Episode): Promise<void> {
  const transcriptUrl = episode.officialTranscript?.url
  if (!transcriptUrl) return

  const audioId = episode.id
  console.log(`[Transcript] Prefetching official transcript for ${audioId}: ${transcriptUrl}`)

  try {
    // 通过 rss-proxy 下载转录文件（避免 CORS）
    const proxyUrl = `/api/rss-proxy?url=${encodeURIComponent(transcriptUrl)}`
    const res = await fetch(proxyUrl)
    if (!res.ok) {
      console.warn(`[Transcript] Failed to fetch transcript: ${res.status}`)
      return
    }
    const content = await res.text()
    const mimeType = episode.officialTranscript?.type || ''

    const cues = parseTranscript(content, mimeType)
    if (cues.length === 0) {
      console.warn(`[Transcript] No cues parsed from transcript for ${audioId}`)
      return
    }

    console.log(`[Transcript] Parsed ${cues.length} cues for ${audioId}, saving to DB...`)

    // 把所有 cues 合并为一条整集转录记录（start=0, end=最后一个 cue 的 end）
    // 同时保存词级别数据供精确定位
    const fullText = cues.map(c => c.text).join(' ')
    const words = cues.map(c => ({ word: c.text, start: c.start, end: c.end }))
    const totalEnd = cues[cues.length - 1].end

    const result = await saveTranscript(audioId, 0, totalEnd, fullText, words)
    if (result.success) {
      console.log(`[Transcript] Official transcript saved for ${audioId}: ${cues.length} cues, ${totalEnd.toFixed(0)}s`)
    } else {
      console.warn(`[Transcript] Failed to save transcript for ${audioId}:`, result.error)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[Transcript] Prefetch error for ${audioId}:`, message)
  }
}

export default function PodcastPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [podcast, setPodcast] = useState<Podcast | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])

  const feedUrl = searchParams.get('feedUrl')
  const title = searchParams.get('title')
  const author = searchParams.get('author')
  const artwork = searchParams.get('artwork')
  const description = searchParams.get('description')

  useEffect(() => {
    async function loadPodcast() {
      if (!feedUrl) {
        setError('Feed URL is required')
        setLoading(false)
        return
      }

      try {
        console.log('[Podcast Page] Fetching podcast:', feedUrl)
        const result = await podcastManager.getPodcast(feedUrl, {
          title: title || 'Unknown Podcast',
          author: author || 'Unknown Author',
          artwork: artwork || '',
          description: description || '',
        })

        setPodcast(result.podcast)
        setEpisodes(result.episodes)
        console.log('[Podcast Page] Loaded successfully:', {
          podcastTitle: result.podcast.title,
          episodeCount: result.episodes.length,
        })

        // Task 3.2: 后台静默预存官方转录
        // 遍历有 officialTranscript 的剧集，下载并存入 DB，不阻塞 UI
        const episodesWithTranscript = result.episodes.filter(ep => ep.officialTranscript?.url)
        if (episodesWithTranscript.length > 0) {
          console.log(`[Transcript] Found ${episodesWithTranscript.length} episodes with official transcripts, prefetching in background...`)
          // 只预存最新的 5 集，避免一次性请求过多
          const toPrestore = episodesWithTranscript.slice(0, 5)
          for (const ep of toPrestore) {
            prefetchOfficialTranscript(ep).catch(err =>
              console.warn(`[Transcript] Prefetch failed for ${ep.id}:`, err)
            )
          }
        }

        // 阶段 1 预转录：对最新 3 集，后台静默转录前 5 分钟
        // 用户进剧集列表时触发，播放时大概率命中缓存（冷启动窗口从 60s → 0s）
        const toWarmup = result.episodes
          .filter(ep => ep.audioUrl && !ep.officialTranscript?.url) // 没有官方转录的才需要预转录
          .slice(0, 3)
        if (toWarmup.length > 0) {
          console.log(`[Warmup] Pre-transcribing first 5min of ${toWarmup.length} episodes...`)
          // 串行执行，避免并发请求打爆 Groq API
          ;(async () => {
            for (const ep of toWarmup) {
              try {
                const res = await fetch('/api/transcribe-segment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    audioUrl: ep.audioUrl,
                    audioId: ep.id,
                    startTime: 0,
                    endTime: 300, // 前 5 分钟
                  }),
                })
                const data = await res.json()
                if (data.cached) {
                  console.log(`[Warmup] Already cached: ${ep.id}`)
                } else if (data.success) {
                  console.log(`[Warmup] Pre-transcribed: ${ep.id} (${data.wordCount} words)`)
                } else {
                  console.warn(`[Warmup] Failed: ${ep.id}`, data.error)
                }
                // 每集间隔 2s，避免并发
                await new Promise(r => setTimeout(r, 2000))
              } catch (err) {
                console.warn(`[Warmup] Error for ${ep.id}:`, err)
              }
            }
          })()
        }

      } catch (err: any) {
        console.error('[Podcast Page] Error:', err)
        setError(err.message || 'Failed to load podcast')
      } finally {
        setLoading(false)
      }
    }

    loadPodcast()
    // P4-5 性能优化：只依赖 feedUrl，避免重复请求
  }, [feedUrl])

  if (!feedUrl) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">Feed URL Required</h1>
          <p className="text-muted-foreground mb-4">Please provide a feed URL to view episodes</p>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg bg-simpod-mark text-simpod-dark font-medium"
          >
            Go to Search
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading podcast...</p>
        </div>
      </div>
    )
  }

  if (error || !podcast) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-foreground mb-2">Failed to Load Podcast</h1>
          <p className="text-muted-foreground mb-4">
            {error || 'Unable to fetch podcast feed'}
          </p>
          <div className="flex gap-3 justify-center mb-4">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-simpod-mark text-simpod-dark font-medium"
            >
              Go to Search
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="返回首页"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground line-clamp-1">
            {podcast.title}
          </h1>
        </div>
      </header>

      {/* Podcast Header */}
      <div className="border-b border-border bg-card/50 p-6">
        <div className="flex gap-6">
          {podcast.artwork && (
            <img
              src={podcast.artwork}
              alt={podcast.title}
              className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground line-clamp-2">
              {podcast.title}
            </h2>
            {podcast.author && (
              <p className="text-sm text-muted-foreground mt-1">
                {podcast.author}
              </p>
            )}
            {podcast.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                {podcast.description}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="bg-secondary px-2 py-1 rounded">
                {episodes.length} episodes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes List */}
      <EpisodeList
        episodes={episodes}
        podcast={{
          title: podcast.title,
          artwork: podcast.artwork,
          feedUrl: feedUrl || undefined,
        }}
      />
    </div>
  )
}
