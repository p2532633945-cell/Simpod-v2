"use client"

/**
 * PodcastPlayerPage - 播放器页面容器
 *
 * 组合所有播放器相关组件的页面级容器
 * 技术契约要求：必须拆分子组件，这里只做组合和状态传递
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { ArrowLeft, Settings, Share2, Loader2, AlertCircle, Music } from "lucide-react"
import Link from "next/link"

// 子组件
import { PlaybackControls } from "@/components/player/PlaybackControls"
import { MarkButtonCompact } from "@/components/player/MarkButton"
import { HotzoneWaveform } from "@/components/waveform/HotzoneWaveform"
import { TranscriptStream } from "@/components/transcript/TranscriptStream"
import { HotzoneSidebar } from "@/components/hotzones/HotzoneSidebar"

// Zustand store
import { usePlayerStore } from "@/stores/playerStore"

// 类型
import type { Word, Anchor } from "@/types/simpod"

// 服务
import { processAnchorsToHotzones } from "@/services/hotzone"
import { saveHotzone, fetchHotzones } from "@/services/supabase"

// Mock 数据
import { mockWords, generateId } from "@/lib/mock-data"

interface PodcastPlayerPageProps {
  audioId: string
  audioUrl?: string
}

export function PodcastPlayerPage({ audioId, audioUrl }: PodcastPlayerPageProps) {
  // ============================================
  // 客户端渲染保护 - 防止 hydration 不匹配
  // ============================================
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // ============================================
  // 加载状态
  // ============================================
  const [isMarking, setIsMarking] = useState(false)
  const [audioLoading, setAudioLoading] = useState(true)
  const [audioError, setAudioError] = useState<string | null>(null)
  // Use passed audioUrl - this is the actual podcast episode URL
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | undefined>(audioUrl)

  // Log initial audio URL for debugging
  console.log('[PodcastPlayerPage] Initializing with audioUrl:', audioUrl)

  // ============================================
  // Zustand Store 状态管理
  // ============================================

  const audioRef = useRef<HTMLAudioElement>(null)

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
  } = usePlayerStore()

  // 本地状态：选中热区（UI 状态不需要放入 store）
  const [selectedHotzoneId, setSelectedHotzoneId] = useState<string | undefined>()

  // 设置 audioRef 到 store
  useEffect(() => {
    if (audioRef.current) {
      setAudioRef(audioRef.current)
    }
  }, [setAudioRef])

  // 音频事件处理 - 更新 Zustand store
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      console.log("[Player] Audio loaded, duration:", audio.duration)
      setDuration(audio.duration)
      setAudioLoading(false)
      setAudioError(null)
    }

    const handlePlay = () => {
      setIsPlaying(true)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleCanPlay = () => {
      console.log("[Player] Audio can play")
      setAudioLoading(false)
      setAudioError(null)
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

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
    }
  }, [setCurrentTime, setDuration, setIsPlaying, currentAudioUrl])

  // 加载当前 audio_id 的热区 - 从数据库
  useEffect(() => {
    const loadHotzones = async () => {
      try {
        console.log("[Player] Loading hotzones for audioId:", audioId)
        const fetchedHotzones = await fetchHotzones(audioId)
        console.log("[Player] Loaded hotzones:", fetchedHotzones.length)
        fetchedHotzones.forEach(hz => addHotzone(hz))
      } catch (err) {
        const error = err as Error
        const errorInfo = {
          message: error.message || 'Unknown error',
          name: error.name || 'Unknown',
          stack: error.stack,
          audioId
        }
        console.error("[Player] Failed to load hotzones:", errorInfo)

        // Fallback to mock data if database fetch fails
        const { mockHotzones } = await import("@/lib/mock-data")
        const filteredHotzones = mockHotzones.filter((hz) => hz.audio_id === audioId)
        filteredHotzones.forEach(hz => addHotzone(hz))
      }
    }

    if (isMounted) {
      loadHotzones()
    }
  }, [audioId, addHotzone, isMounted])

  // 获取当前热区的转录词
  const currentTranscriptWords: Word[] = useMemo(() => {
    const selectedHotzone = hotzones.find((hz) => hz.id === selectedHotzoneId)
    if (selectedHotzone?.transcript_words) {
      return selectedHotzone.transcript_words
    }
    // 默认返回 mock words
    return mockWords
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

  // onPlayPause(): void - 使用 store 的 setIsPlaying 而非直接操作 audio
  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
    }
  }, [setIsPlaying])

  // onRateChange(rate: number): void
  const handleRateChange = useCallback((rate: number) => {
    const audio = audioRef.current
    if (audio) {
      audio.playbackRate = rate
    }
  }, [])

  // onMark(timestamp: number): void - 不暂停播放，调用服务层
  const handleMark = useCallback(async (timestamp: number) => {
    if (!currentAudioUrl) {
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

      const [newHotzone] = await processAnchorsToHotzones(
        [anchor],
        undefined,
        undefined,
        currentAudioUrl,
        undefined,
        hotzones
      )

      if (newHotzone) {
        console.log("[Player] Saving hotzone:", newHotzone.id)
        await saveHotzone(newHotzone)
        addHotzone(newHotzone)
        setSelectedHotzoneId(newHotzone.id)
        console.log("[Player] Hotzone created successfully")
      }
    } catch (error) {
      console.error("[Player] Failed to create hotzone:", error)
      alert("Failed to create hotzone. Please try again.")
    } finally {
      setIsMarking(false)
    }
  }, [audioId, hotzones, addHotzone, currentAudioUrl])

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

  if (!isMounted) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        <div className="text-muted-foreground mt-4">Loading player...</div>
      </div>
    )
  }

  // Check if we have a valid audio URL
  if (!currentAudioUrl) {
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
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={currentAudioUrl}
        preload="auto"
        crossOrigin="anonymous"
        className="hidden"
      />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="返回首页"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </Link>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg bg-simpod-mark/10 flex items-center justify-center"
              aria-hidden="true"
            >
              <div className="w-4 h-4 rounded-full bg-simpod-mark" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground line-clamp-1">
                Episode {audioId}
              </h1>
              <p className="text-xs text-muted-foreground">Simpod Player</p>
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
              {currentAudioUrl && (
                <p className="text-xs text-red-400 mt-1 break-all font-mono">
                  URL: {currentAudioUrl}
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

            {/* Controls */}
            <div className="mt-6 flex items-center justify-between">
              <div className="flex-1">
                <PlaybackControls
                  playerState={playerState}
                  onSeek={handleSeek}
                  onPlayPause={handlePlayPause}
                  onRateChange={handleRateChange}
                />
              </div>

              <div className="ml-6">
                {isMarking ? (
                  <button
                    disabled
                    className="px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-2 bg-muted text-muted-foreground"
                  >
                    <Loader2 size={16} className="animate-spin" />
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
