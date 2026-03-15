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
import { mockWords } from "@/lib/mock-data"

interface PodcastPlayerPageProps {
  audioId: string
  audioUrl?: string
}

export function PodcastPlayerPage({ audioId, audioUrl }: PodcastPlayerPageProps) {
  // ============================================
  // 加载状态
  // ============================================
  const [isMarking, setIsMarking] = useState(false)
  const [audioLoading, setAudioLoading] = useState(true)
  const [audioError, setAudioError] = useState<string | null>(null)

  console.log('[PodcastPlayerPage] Rendering with audioUrl:', audioUrl)

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
      console.log("[Player] Audio element mounted, setting ref to store")
      setAudioRef(audioRef.current)
    }
  }, [setAudioRef])

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
  }, [setCurrentTime, setDuration, setIsPlaying, audioUrl])

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

    loadHotzones()

    // 清理：当组件卸载或 audioId 变化时，清理状态
    return () => {
      if (audioId) {
        console.log("[Player] Cleaning up for audioId:", audioId)
      }
    }
  }, [audioId, addHotzone])

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

      const [newHotzone] = await processAnchorsToHotzones(
        [anchor],
        undefined,
        undefined,
        audioUrl,
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
  }, [audioId, hotzones, addHotzone, audioUrl])

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
        src={`/api/audio-proxy?url=${encodeURIComponent(audioUrl)}`}
        preload="auto"
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
