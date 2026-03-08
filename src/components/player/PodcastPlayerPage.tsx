"use client"

/**
 * PodcastPlayerPage - 播放器页面容器
 * 
 * 组合所有播放器相关组件的页面级容器
 * 技术契约要求：必须拆分子组件，这里只做组合和状态传递
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { ArrowLeft, Settings, Share2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// 子组件
import { PlaybackControls } from "@/components/player/PlaybackControls"
import { MarkButtonCompact } from "@/components/player/MarkButton"
import { HotzoneWaveform } from "@/components/waveform/HotzoneWaveform"
import { TranscriptStream } from "@/components/transcript/TranscriptStream"
import { HotzoneSidebar } from "@/components/hotzones/HotzoneSidebar"

// 类型
import type { PlayerState, Hotzone, Word, Episode, Podcast } from "@/types/simpod"

// Mock 数据
import {
  mockHotzones,
  mockWords,
  mockEpisodes,
  mockPodcasts,
  generateId,
} from "@/lib/mock-data"

interface PodcastPlayerPageProps {
  audioId: string
}

// 示例音频 URL - 使用可靠的公开音频
const DEMO_AUDIO_URL = "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3"

export function PodcastPlayerPage({ audioId }: PodcastPlayerPageProps) {
  // ============================================
  // 状态管理 - 后续接入 Zustand
  // ============================================

  const audioRef = useRef<HTMLAudioElement>(null)

  // TODO: 此处应调用 usePlayerStore 获取播放状态与当前音频
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentTime: 0,
    duration: 180, // 默认 3 分钟作为 fallback
    isPlaying: false,
    playbackRate: 1,
    volume: 1,
  })

  // 音频事件处理
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setPlayerState((prev) => ({
        ...prev,
        currentTime: audio.currentTime,
      }))
    }

    const handleLoadedMetadata = () => {
      setPlayerState((prev) => ({
        ...prev,
        duration: audio.duration,
      }))
    }

    const handlePlay = () => {
      setPlayerState((prev) => ({ ...prev, isPlaying: true }))
    }

    const handlePause = () => {
      setPlayerState((prev) => ({ ...prev, isPlaying: false }))
    }

    const handleEnded = () => {
      setPlayerState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }))
    }

    const handleCanPlay = () => {
      console.log("[v0] Audio can play, duration:", audio.duration)
      setPlayerState((prev) => ({
        ...prev,
        duration: audio.duration,
      }))
    }

    const handleError = (e: Event) => {
      console.error("[v0] Audio error:", e)
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
  }, [])

  // TODO: 此处应调用 useHotzoneStore 获取当前 audio_id 的 hotzones
  const [hotzones, setHotzones] = useState<Hotzone[]>(
    mockHotzones.filter((hz) => hz.audio_id === audioId)
  )

  // 当前选中的热区
  const [selectedHotzoneId, setSelectedHotzoneId] = useState<string | undefined>()

  // 获取当前热区的转录词
  const currentTranscriptWords: Word[] = useMemo(() => {
    const selectedHotzone = hotzones.find((hz) => hz.id === selectedHotzoneId)
    if (selectedHotzone?.transcript_words) {
      return selectedHotzone.transcript_words
    }
    // 默认返回 mock words
    return mockWords
  }, [hotzones, selectedHotzoneId])

  // Mock episode 和 podcast 数据
  const episode: Episode = mockEpisodes[0]
  const podcast: Podcast = mockPodcasts[0]

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

  // onPlayPause(): void
  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      audio.play().catch(console.error)
    } else {
      audio.pause()
    }
  }, [])

  // onRateChange(rate: number): void
  const handleRateChange = useCallback((rate: number) => {
    const audio = audioRef.current
    if (audio) {
      audio.playbackRate = rate
    }
    setPlayerState((prev) => ({
      ...prev,
      playbackRate: rate,
    }))
  }, [])

  // onMark(timestamp: number): void - 不暂停播放
  const handleMark = useCallback((timestamp: number) => {
    // 创建新的 pending hotzone
    const newHotzone: Hotzone = {
      id: generateId("hz"),
      audio_id: audioId,
      start_time: Math.max(0, timestamp - 10),
      end_time: timestamp + 10,
      transcript_snippet: "New marked segment - transcription pending...",
      source: "manual",
      metadata: {},
      status: "pending",
      created_at: new Date().toISOString(),
    }

    setHotzones((prev) => [...prev, newHotzone])
    setSelectedHotzoneId(newHotzone.id)
  }, [audioId])

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
      setHotzones((prev) =>
        prev.map((hz) =>
          hz.id === hotzoneId
            ? { ...hz, status: reviewed ? "reviewed" : "pending" }
            : hz
        )
      )
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

  // ============================================
  // 渲染
  // ============================================

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={DEMO_AUDIO_URL}
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
                {episode.title}
              </h1>
              <p className="text-xs text-muted-foreground">{podcast.title}</p>
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

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Player + Transcript */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Player Section */}
          <div className="p-4 md:p-6 border-b border-border bg-card/50">
            {/* Waveform */}
            <HotzoneWaveform
              hotzones={hotzones}
              currentTime={playerState.currentTime}
              duration={playerState.duration}
              onHotzoneJump={handleHotzoneJump}
              onSeek={handleSeek}
              isPlaying={playerState.isPlaying}
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
                <MarkButtonCompact
                  currentTime={playerState.currentTime}
                  onMark={handleMark}
                />
              </div>
            </div>
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
                  currentTime={playerState.currentTime}
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
