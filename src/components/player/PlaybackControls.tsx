"use client"

/**
 * PlaybackControls - 播放控制组件
 * 
 * 负责播放/暂停、进度条、倍速控制、时间显示
 * 严格遵守技术契约的接口定义
 */

import { useCallback, useRef, useState, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PlaybackControlsProps } from "@/types/simpod"
import { formatTime } from "@/lib/time"

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2]

export function PlaybackControls({
  playerState,
  onSeek,
  onPlayPause,
  onRateChange,
}: PlaybackControlsProps) {
  // TODO: 此处应调用 usePlayerStore 获取当前进度
  // TODO: 此处应调用 usePlayerStore 获取播放状态与当前音频

  const progressBarRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showRateMenu, setShowRateMenu] = useState(false)

  const { currentTime, duration, isPlaying, playbackRate } = playerState

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // 键盘快捷键处理（P5-5）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 只在没有输入框获得焦点时处理
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          handleSkipBack()
          break
        case 'ArrowRight':
          e.preventDefault()
          handleSkipForward()
          break
        case ' ':
          e.preventDefault()
          onPlayPause()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, duration, onPlayPause, onSeek])

  // TODO: 此处应调用 usePlayerStore 获取当前进度
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || duration <= 0) return

      const rect = progressBarRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const newTime = percentage * duration

      onSeek(newTime)
    },
    [duration, onSeek]
  )

  const handleProgressDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !progressBarRef.current || duration <= 0) return

      const rect = progressBarRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const newTime = percentage * duration

      onSeek(newTime)
    },
    [isDragging, duration, onSeek]
  )

  const handleSkipBack = useCallback(() => {
    const newTime = Math.max(0, currentTime - 15)
    onSeek(newTime)
  }, [currentTime, onSeek])

  const handleSkipForward = useCallback(() => {
    const newTime = Math.min(duration, currentTime + 15)
    onSeek(newTime)
  }, [currentTime, duration, onSeek])

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-simpod-muted w-12 text-right">
          {formatTime(currentTime)}
        </span>

        <div
          ref={progressBarRef}
          className="flex-1 h-2 bg-secondary rounded-full cursor-pointer relative group"
          onClick={handleProgressClick}
          onMouseDown={() => setIsDragging(true)}
          onMouseMove={handleProgressDrag}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          role="slider"
          aria-label="播放进度"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
        >
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 h-full bg-simpod-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />

          {/* Playhead */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-simpod-primary rounded-full",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "shadow-lg shadow-simpod-mark/30"
            )}
            style={{ left: `calc(${progress}% - 6px)` }}
          />

          {/* Hover glow */}
          <div
            className="absolute left-0 top-0 h-full rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              width: `${progress}%`,
              boxShadow: "0 0 10px hsl(var(--simpod-mark) / 0.3)",
            }}
          />
        </div>

        <span className="text-xs font-mono text-simpod-muted w-12">
          {formatTime(duration)}
        </span>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Skip Back */}
        <button
          onClick={handleSkipBack}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
          aria-label="后退 15 秒"
          title="← 后退 15 秒"
        >
          <SkipBack size={20} />
        </button>

        {/* 15s Skip Back (P5-5 简化版) */}
        <button
          onClick={() => onSeek(Math.max(0, currentTime - 15))}
          className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="后退 15 秒"
          title="后退 15 秒"
        >
          <ChevronLeft size={14} className="inline mr-0.5" />15s
        </button>

        {/* Play/Pause */}
        <button
          onClick={onPlayPause}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center",
            "bg-simpod-primary text-simpod-dark",
            "hover:scale-105 active:scale-95 transition-transform",
            "simpod-glow"
          )}
          aria-label={isPlaying ? "暂停" : "播放"}
          title={isPlaying ? "暂停 (Space)" : "播放 (Space)"}
        >
          {isPlaying ? (
            <Pause size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" className="ml-1" />
          )}
        </button>

        {/* 15s Skip Forward (P5-5 简化版) */}
        <button
          onClick={() => onSeek(Math.min(duration, currentTime + 15))}
          className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="快进 15 秒"
          title="快进 15 秒"
        >
          15s<ChevronRight size={14} className="inline ml-0.5" />
        </button>

        {/* Skip Forward */}
        <button
          onClick={handleSkipForward}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
          aria-label="快进 15 秒"
          title="→ 快进 15 秒"
        >
          <SkipForward size={20} />
        </button>

        {/* Playback Rate */}
        <div className="relative ml-4">
          <button
            onClick={() => setShowRateMenu(!showRateMenu)}
            className={cn(
              "px-3 py-1.5 text-xs font-mono rounded-lg",
              "bg-secondary text-muted-foreground",
              "hover:text-foreground hover:bg-secondary/80 transition-colors"
            )}
            aria-label="播放速度"
          >
            {playbackRate}x
          </button>

          {showRateMenu && (
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 py-1 rounded-lg bg-card border border-border shadow-lg z-10"
              onMouseLeave={() => setShowRateMenu(false)}
            >
              {PLAYBACK_RATES.map((rate) => (
                <button
                  key={rate}
                  onClick={() => {
                    onRateChange(rate)
                    setShowRateMenu(false)
                  }}
                  className={cn(
                    "block w-full px-4 py-1.5 text-xs font-mono text-left",
                    "hover:bg-secondary transition-colors",
                    rate === playbackRate && "text-simpod-primary"
                  )}
                >
                  {rate}x
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
