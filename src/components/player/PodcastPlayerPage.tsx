"use client"

/**
 * PodcastPlayerPage - 播放器页面容器
 *
 * 组合所有播放器相关组件的页面级容器
 * 技术契约要求：必须拆分子组件，这里只做组合和状态传递
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { ArrowLeft, Settings, Share2, Loader2, AlertCircle, Music, Gauge, RotateCcw } from "lucide-react"
import Link from "next/link"

// 子组件
import { PlaybackControls } from "@/components/player/PlaybackControls"
import { MarkButtonCompact } from "@/components/player/MarkButton"
import { HotzoneWaveform } from "@/components/waveform/HotzoneWaveform"
import { TranscriptStream } from "@/components/transcript/TranscriptStream"
import { HotzoneSidebar } from "@/components/hotzones/HotzoneSidebar"

// Zustand store
import { usePlayerStore } from "@/stores/playerStore"
import type { HotzoneRange } from "@/stores/playerStore"

// 类型
import type { Word, Anchor } from "@/types/simpod"

// 服务
import { processAnchorsToHotzones } from "@/services/hotzone"
import { saveHotzone, fetchHotzones } from "@/services/supabase"

interface PodcastPlayerPageProps {
  audioId: string
  audioUrl?: string
  startTime?: number
  autoPlay?: boolean
  episodeTitle?: string
  podcastTitle?: string
  artwork?: string
  feedUrl?: string
}

export function PodcastPlayerPage({ audioId, audioUrl, startTime, autoPlay, episodeTitle, podcastTitle, artwork, feedUrl }: PodcastPlayerPageProps) {
  // ============================================
  // 加载状态
  // ============================================
  const [isMarking, setIsMarking] = useState(false)
  const [audioLoading, setAudioLoading] = useState(true)
  const [audioError, setAudioError] = useState<string | null>(null)

  // ============================================
  // Zustand Store 状态管理
  // ============================================

  const audioRef = useRef<HTMLAudioElement>(null)
  // 记录上次设置的 proxied URL，防止重复赋值导致音频重载
  const lastSrcRef = useRef<string>('')

  // 只在 audioUrl 真正变化时才更新 audio.src（避免组件重渲染触发 loadstart）
  const proxiedUrl = audioUrl ? `/api/audio-proxy?url=${encodeURIComponent(audioUrl)}` : ''
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !proxiedUrl) return
    if (lastSrcRef.current === proxiedUrl) return  // 没变化，跳过
    console.log('[Player] Setting audio src:', proxiedUrl)
    lastSrcRef.current = proxiedUrl
    audio.src = proxiedUrl
    audio.load()
  }, [proxiedUrl])

  // 从 store 获取状态和 actions
  const {
    currentTime,
    duration,
    isPlaying,
    playbackRate,
    volume,
    hotzones,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setAudioRef,
    addHotzone,
    hotzoneRange,
    setHotzoneRange,
    instantReplayMode,
    toggleInstantReplayMode,
    seek,
    setCurrentEpisodeInfo,
  } = usePlayerStore()

  // 本地状态：选中热区（UI 状态不需要放入 store）
  const [selectedHotzoneId, setSelectedHotzoneId] = useState<string | undefined>()
  
  // P4-5 性能优化：使用 useRef 防止自动跳转重复执行（避免闭包问题）
  const autoPlayExecutedRef = useRef(false)

  // 客户端 mount 后从 localStorage 同步持久化状态
  // 必须在 useEffect 里做，避免 SSR/Client hydration mismatch
  useEffect(() => {
    const savedRange = localStorage.getItem('simpod_hotzone_range') as HotzoneRange | null
    if (savedRange && ['tight', 'normal', 'wide'].includes(savedRange)) {
      setHotzoneRange(savedRange)
    }
    const savedReplay = localStorage.getItem('simpod_instant_replay')
    if (savedReplay === 'true') {
      const { setInstantReplayMode } = usePlayerStore.getState()
      setInstantReplayMode(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 设置 audioRef 到 store
  useEffect(() => {
    if (audioRef.current) {
      console.log("[Player] Audio element mounted, setting ref to store")
      setAudioRef(audioRef.current)
    }
  }, [setAudioRef])

  // 设置当前播放集信息（供 MiniPlayer 使用）
  useEffect(() => {
    if (audioUrl) {
      // 构建完整的返回 URL（播客列表页）
      const podcastPageUrl = feedUrl
        ? `/podcast/${encodeURIComponent(audioId)}?feedUrl=${encodeURIComponent(feedUrl)}`
        : '/'

      // 构建 MiniPlayer 点击跳回播放器的完整 URL
      const workspaceParams = new URLSearchParams()
      workspaceParams.set('audioUrl', audioUrl)
      if (feedUrl) workspaceParams.set('feedUrl', feedUrl)
      if (episodeTitle) workspaceParams.set('episodeTitle', episodeTitle)
      if (podcastTitle) workspaceParams.set('podcastTitle', podcastTitle)
      if (artwork) workspaceParams.set('artwork', artwork)

      setCurrentEpisodeInfo({
        audioId,
        audioUrl,
        title: episodeTitle || `Episode ${audioId}`,
        artwork: artwork || undefined,
        podcastTitle: podcastTitle || 'Simpod',
        feedUrl: feedUrl || undefined,
        episodeTitle,
        podcastPageUrl,
      })
    }
    return () => {
      // 离开页面时不清除，保持 MiniPlayer 显示
    }
  }, [audioId, audioUrl, episodeTitle, artwork, podcastTitle, feedUrl, setCurrentEpisodeInfo])

  // 音频事件处理 - 更新 Zustand store
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      console.log("[Player] Audio element not ready yet")
      return
    }

    console.log("[Player] Setting up audio event listeners", {
      src: audio.src,
      audioUrl,
      readyState: audio.readyState,
      networkState: audio.networkState,
    })

    // 音频加载超时处理（30秒 - 某些播客服务器响应慢）
    const loadingTimeout = setTimeout(() => {
      if (audio.readyState < 2) {
        console.error("[Player] Audio loading timeout", {
          readyState: audio.readyState,
          networkState: audio.networkState,
          src: audio.src,
        })
        setAudioLoading(false)
        setAudioError("Audio loading timed out (30s). The server may be slow or the URL may be inaccessible.")
      }
    }, 30000)

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      console.log("[Player] Audio loadedmetadata, duration:", audio.duration)
      clearTimeout(loadingTimeout)
      setDuration(audio.duration)
      setAudioLoading(false)
      setAudioError(null)
    }

    const handlePlay = () => {
      console.log("[Player] Audio play event")
      setIsPlaying(true)
    }

    const handlePause = () => {
      console.log("[Player] Audio pause event")
      setIsPlaying(false)
    }

    const handleEnded = () => {
      console.log("[Player] Audio ended")
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleCanPlay = () => {
      console.log("[Player] Audio canplay - ready to play", {
        duration: audio.duration,
        readyState: audio.readyState,
      })
      clearTimeout(loadingTimeout)
      setAudioLoading(false)
      setAudioError(null)
      
      // P4-5 性能优化：自动跳转和播放（只执行一次）
      // 使用 ref 而不是 state 避免闭包问题
      if (!autoPlayExecutedRef.current && startTime !== undefined && startTime >= 0 && startTime <= audio.duration) {
        audio.currentTime = startTime
        console.log('[Player] Auto-seeking to:', startTime)
        
        if (autoPlay) {
          audio.play().catch((err) => {
            console.error('[Player] Auto-play failed:', err)
          })
          console.log('[Player] Auto-playing from hotzone')
        }
        
        // 标记已执行，防止重复
        autoPlayExecutedRef.current = true
      }
    }

    const handleCanPlayThrough = () => {
      console.log("[Player] Audio canplaythrough - fully buffered")
      clearTimeout(loadingTimeout)
      setAudioLoading(false)
      setAudioError(null)
    }

    const handlePlaying = () => {
      console.log("[Player] Audio playing - playback started")
      clearTimeout(loadingTimeout)
      setAudioLoading(false)
      setAudioError(null)
      setIsPlaying(true)
    }

    const handleWaiting = () => {
      console.log("[Player] Audio waiting - buffering", {
        networkState: audio.networkState,
        readyState: audio.readyState,
      })
    }

    const handleStalled = () => {
      console.warn("[Player] Audio stalled - network stalled", {
        networkState: audio.networkState,
        readyState: audio.readyState,
        src: audio.src,
      })
    }

    const getAudioErrorMessage = (code?: number): string => {
      const errorMessages: Record<number, string> = {
        1: "Playback was aborted.",
        2: "A network error occurred while loading the audio. Check your connection or try again.",
        3: "The audio could not be decoded. The file may be corrupted.",
        4: "The audio format is not supported by your browser."
      }
      return errorMessages[code || 0] || "Failed to load audio. Please try again."
    }

    const handleError = (e: Event) => {
      clearTimeout(loadingTimeout)
      const target = e.target as HTMLAudioElement
      const errorCode = target.error?.code
      const errorMessage = getAudioErrorMessage(errorCode)
      
      console.error("[Player] Audio error:", {
        audioUrl,
        errorCode,
        errorMessage,
        networkState: target.networkState,
        readyState: target.readyState,
        src: target.src,
      })
      
      setAudioLoading(false)
      setAudioError(errorMessage)
    }

    const handleLoadStart = () => {
      console.log("[Player] Audio loadstart", {
        src: audio.src,
        networkState: audio.networkState,
      })
      // 重置加载状态，确保每次新的 src 加载时状态正确
      setAudioLoading(true)
      setAudioError(null)
    }

    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1)
        console.log("[Player] Audio progress:", {
          buffered: bufferedEnd.toFixed(1) + 's',
          duration: audio.duration?.toFixed(1) + 's',
          percent: audio.duration ? ((bufferedEnd / audio.duration) * 100).toFixed(0) + '%' : 'unknown',
        })
      }
    }

    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("progress", handleProgress)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("canplaythrough", handleCanPlayThrough)
    audio.addEventListener("playing", handlePlaying)
    audio.addEventListener("waiting", handleWaiting)
    audio.addEventListener("stalled", handleStalled)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    return () => {
      clearTimeout(loadingTimeout)
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("progress", handleProgress)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("canplaythrough", handleCanPlayThrough)
      audio.removeEventListener("playing", handlePlaying)
      audio.removeEventListener("waiting", handleWaiting)
      audio.removeEventListener("stalled", handleStalled)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
    }
  // audioUrl removed from deps: src is set imperatively, not needed here
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCurrentTime, setDuration, setIsPlaying])

  // 加载当前 audio_id 的热区 - 从数据库
  useEffect(() => {
    let cancelled = false  // 防止竞态：audioId 变化时取消旧请求

    const loadHotzones = async () => {
      try {
        console.log("[Player] DIAG: audioId changed to:", audioId)
        
        // 重置自动播放标志位
        autoPlayExecutedRef.current = false
        
        // 重置热区列表（不重置播放状态，MiniPlayer 需要继续播放）
        const { setHotzones: setHotzonesDirect } = usePlayerStore.getState()
        setHotzonesDirect([])
        console.log("[Player] DIAG: Reset hotzones for new audioId")
        
        const fetchedHotzones = await fetchHotzones(audioId)
        if (cancelled) return  // audioId 已变化，丢弃结果

        console.log("[Player] DIAG: Fetched hotzones:", fetchedHotzones.length)

        // 去重：防止重复 ID 导致 React key 冲突
        const seen = new Set<string>()
        const uniqueHotzones = fetchedHotzones.filter(hz => {
          if (seen.has(hz.id)) {
            console.warn('[Player] Duplicate hotzone ID filtered out:', hz.id)
            return false
          }
          seen.add(hz.id)
          return true
        })

        // 一次性设置，避免多次 addHotzone 在 StrictMode 下重复
        setHotzonesDirect(uniqueHotzones)
        console.log("[Player] DIAG: Set hotzones in store, unique count:", uniqueHotzones.length)
      } catch (err) {
        if (cancelled) return
        const error = err as Error
        console.error("[Player] Failed to load hotzones:", error.message)

        // Fallback to mock data if database fetch fails
        const { mockHotzones } = await import("@/lib/mock-data")
        const filteredHotzones = mockHotzones.filter((hz) => hz.audio_id === audioId)
        const { setHotzones: setHotzonesDirect } = usePlayerStore.getState()
        setHotzonesDirect(filteredHotzones)
      }
    }

    loadHotzones()

    // 清理：取消竞态 + 清除热区列表
    return () => {
      cancelled = true
      if (audioId) {
        console.log("[Player] DIAG: Cleanup hotzones for audioId:", audioId)
        const { setHotzones: setHotzonesDirect } = usePlayerStore.getState()
        setHotzonesDirect([])
      }
    }
  }, [audioId])

  // 获取当前热区的转录词
  const currentTranscriptWords: Word[] = useMemo(() => {
    const selectedHotzone = hotzones.find((hz) => hz.id === selectedHotzoneId)
    if (selectedHotzone?.transcript_words) {
      return selectedHotzone.transcript_words
    }
    // 不再返回 mockWords，改为空数组
    // TranscriptStream 会显示提示信息
    return []
  }, [hotzones, selectedHotzoneId])

  // ============================================
  // 事件处理 - 遵循技术契约接口
  // ============================================

  // onSeek(time: number): void
  const handleSeek = useCallback((time: number) => {
    const audio = audioRef.current
    if (audio) {
      const clampedTime = Math.max(0, Math.min(time, audio.duration || Infinity))
      audio.currentTime = clampedTime
    }
  }, [])

  // onPlayPause(): void - 通过 store 的 setIsPlaying 统一控制
  const handlePlayPause = useCallback(() => {
    const { isPlaying: currentPlaying, setIsPlaying: storeSetIsPlaying } = usePlayerStore.getState()
    storeSetIsPlaying(!currentPlaying)
  }, [])

  // onRateChange(rate: number): void
  const handleRateChange = useCallback((rate: number) => {
    const audio = audioRef.current
    if (audio) {
      audio.playbackRate = rate
    }
    // 关键修复：同时更新 store，这样 PlaybackControls 的显示会更新
    const { setPlaybackRate } = usePlayerStore.getState()
    setPlaybackRate(rate)
    console.log('[Player] Playback rate changed to:', rate)
  }, [])

  // onMark(timestamp: number): void - 不暂停播放，调用服务层
  const handleMark = useCallback(async (timestamp: number) => {
    if (!audioUrl) {
      console.error("[Player] Cannot mark: no audio URL")
      alert("Cannot create hotzone: audio URL not available")
      return
    }

    setIsMarking(true)
    try {
      const generateAnchorId = (prefix: string) => `${prefix}_${Math.random().toString(36).substring(2, 11)}`

      const anchor: Anchor = {
        id: generateAnchorId("anc"),
        audio_id: audioId,
        timestamp,
        source: "manual",
        created_at: new Date().toISOString(),
      }

      console.log("[Player] Creating hotzone from anchor at:", timestamp)

      // P6-3: 读取当前档位 from store
      const { hotzoneRange: currentRange } = usePlayerStore.getState()

      const [newHotzone] = await processAnchorsToHotzones(
        [anchor],
        undefined,
        undefined,
        audioUrl,
        undefined,
        hotzones,
        currentRange
      )

      if (newHotzone) {
        console.log("[Player] Saving hotzone:", newHotzone.id)
        // 将当前集的元数据存入 hotzone.metadata，供首页「最近播放」使用
        const enrichedHotzone = {
          ...newHotzone,
          metadata: {
            ...newHotzone.metadata,
            audioUrl: audioUrl || '',
            episodeTitle: episodeTitle || '',
            podcastTitle: podcastTitle || '',
            artwork: artwork || '',
          }
        }
        await saveHotzone(enrichedHotzone, audioUrl)
        addHotzone(enrichedHotzone)
        setSelectedHotzoneId(enrichedHotzone.id)
        console.log("[Player] Hotzone created successfully")

        // P6-2: 即时回溯模式 — 热区生成后自动跳回起点
        const { instantReplayMode: replayMode } = usePlayerStore.getState()
        if (replayMode) {
          console.log('[Player] Instant replay: seeking to hotzone start', enrichedHotzone.start_time)
          seek(enrichedHotzone.start_time)
        }
      }
    } catch (error) {
      console.error("[Player] Failed to create hotzone:", error)
      alert("Failed to create hotzone. Please try again.")
    } finally {
      setIsMarking(false)
    }
  }, [audioId, hotzones, addHotzone, audioUrl, seek, hotzoneRange])

  // onHotzoneJump(hotzoneId: string, startTime: number): void
  const handleHotzoneJump = useCallback((hotzoneId: string, startTime: number) => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = startTime
    }
    setSelectedHotzoneId(hotzoneId)
  }, [])

  // onHotzoneToggleReviewed(hotzoneId: string, reviewed: boolean): void
  const handleHotzoneToggleReviewed = useCallback(
    (hotzoneId: string, reviewed: boolean) => {
      console.log("[Player] Toggle hotzone reviewed:", hotzoneId, reviewed)
    },
    []
  )

  // onWordClick(time: number): void
  const handleWordClick = useCallback((time: number) => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = time
    }
  }, [])

  // 构建 playerState 对象传递给子组件
  const playerState = {
    currentTime,
    duration,
    isPlaying,
    playbackRate,
    volume,
  }

  // ============================================
  // 渲染
  // ============================================

  // Check if we have a valid audio URL
  if (!audioUrl) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <Music className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">No Audio URL</h2>
        <p className="text-muted-foreground mb-6">Please provide an audio URL to play this episode.</p>
        <Link
          href="/"
          className="px-4 py-2 rounded-lg bg-simpod-mark text-simpod-dark font-medium"
        >
          Go to Search
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Hidden Audio Element - always render, never destroy */}
      {/* 通过 audio-proxy 加载以解决 CORS 问题 */}
      <audio
        ref={audioRef}
        preload="auto"
        crossOrigin="anonymous"
        className="hidden"
      />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Link
            href={feedUrl ? `/podcast/${encodeURIComponent(audioId)}?feedUrl=${encodeURIComponent(feedUrl)}` : '/'}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="返回播客列表"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </Link>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg bg-simpod-mark/10 flex items-center justify-center"
              aria-hidden="true"
            >
              {artwork ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={artwork} alt="" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-simpod-mark" />
              )}
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground line-clamp-1">
                {episodeTitle || `Episode ${audioId}`}
              </h1>
              <p className="text-xs text-muted-foreground">{podcastTitle || 'Simpod Player'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="分享"
          >
            <Share2 size={18} className="text-muted-foreground" />
          </button>
          <Link
            href="/settings"
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="设置"
          >
            <Settings size={18} className="text-muted-foreground" />
          </Link>
        </div>
      </header>

      {/* Audio Error Message */}
      {audioError && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-500">{audioError}</p>
              {audioUrl && (
                <p className="text-xs text-red-400 mt-1 break-all font-mono">
                  URL: {audioUrl}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Player + Transcript */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Player Section */}
          <div className="p-4 md:p-6 border-b border-border bg-card/50">
            {/* Waveform */}
            <HotzoneWaveform
              hotzones={hotzones}
              currentTime={currentTime}
              duration={duration}
              onHotzoneJump={handleHotzoneJump}
              onSeek={handleSeek}
              isPlaying={isPlaying}
            />

            {/* Controls + MARK — clean bottom-oriented layout */}
            <div className="mt-4">
              <PlaybackControls
                playerState={playerState}
                onSeek={handleSeek}
                onPlayPause={handlePlayPause}
                onRateChange={handleRateChange}
              />

              {/* MARK + Range + Replay in one row */}
              <div className="mt-4 flex items-center justify-between gap-2">
                {/* Range selector */}
                <div className="flex items-center gap-1.5">
                  <Gauge size={13} className="text-muted-foreground shrink-0" />
                  <div className="flex rounded-lg overflow-hidden border border-border">
                    {([
                      { key: 'tight', label: '3s', title: '±3s' },
                      { key: 'normal', label: '10s', title: '±10s' },
                      { key: 'wide', label: '20s', title: '±20s' },
                    ] as const).map(({ key, label, title }) => (
                      <button
                        key={key}
                        onClick={() => setHotzoneRange(key)}
                        title={title}
                        className={`px-2.5 py-1.5 text-xs font-mono transition-colors ${
                          hotzoneRange === key
                            ? 'bg-simpod-mark text-simpod-dark font-semibold'
                            : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* MARK — centred, prominent */}
                <div className="flex-1 flex justify-center">
                  {isMarking ? (
                    <button disabled className="px-5 py-2.5 rounded-full text-sm flex items-center gap-2 bg-muted text-muted-foreground">
                      <Loader2 size={15} className="animate-spin" />
                      Marking...
                    </button>
                  ) : (
                    <MarkButtonCompact
                      currentTime={currentTime}
                      onMark={handleMark}
                      disabled={audioLoading || isMarking || !!audioError}
                    />
                  )}
                </div>

                {/* Replay toggle */}
                <button
                  onClick={toggleInstantReplayMode}
                  title={instantReplayMode ? 'Instant Replay ON' : 'Instant Replay OFF'}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    instantReplayMode
                      ? 'bg-simpod-mark/15 border-simpod-mark/50 text-simpod-mark'
                      : 'bg-transparent border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <RotateCcw size={12} className={instantReplayMode ? 'animate-spin-slow' : ''} />
                  <span className="hidden sm:inline">Replay</span>
                  {instantReplayMode && <span className="w-1.5 h-1.5 rounded-full bg-simpod-mark" />}
                </button>
              </div>
            </div>

            {/* Audio Loading Indicator */}
            {audioLoading && !audioError && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                Loading audio...
              </div>
            )}
          </div>

          {/* Transcript Section */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="px-4 py-3 border-b border-border bg-card/30">
                <h2 className="text-sm font-semibold text-foreground">
                  Transcript
                </h2>
                {selectedHotzoneId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Showing hotzone transcript
                  </p>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <TranscriptStream
                  words={currentTranscriptWords}
                  currentTime={currentTime}
                  onWordClick={handleWordClick}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Right: Hotzone Sidebar */}
        <aside className="w-80 lg:w-96 hidden md:block overflow-hidden">
          <HotzoneSidebar
            hotzones={hotzones}
            selectedHotzoneId={selectedHotzoneId}
            onHotzoneJump={handleHotzoneJump}
            onHotzoneToggleReviewed={handleHotzoneToggleReviewed}
            onHotzoneSelect={setSelectedHotzoneId}
          />
        </aside>
      </div>
    </div>
  )
}



