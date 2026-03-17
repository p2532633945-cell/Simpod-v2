"use client"

/**
 * PlaybackControls - 播放控制组件
 *
 * 负责播放/暂停、进度条、倍速控制、时间显示
 * 外侧按钮：上一集 / 下一集
 * 内侧按钮：后退15s / 前进15s
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
  onPrevEpisode,
  onNextEpisode,
  hasPrev = false,
  hasNext = false,
}: PlaybackControlsProps) {
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showRateMenu, setShowRateMenu] = useState(false)

  const { currentTime, duration, isPlaying, playbackRate } = playerState
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // 键盘快捷键（← → Space）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          onSeek(Math.max(0, currentTime - 15))
          break
        case 'ArrowRight':
          e.preventDefault()
          onSeek(Math.min(duration, currentTime + 15))
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

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || duration <= 0) return
      const rect = progressBarRef.current.getBoundingClientRect()
      const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      onSeek(percentage * duration)
    },
    [duration, onSeek]
  )

  const handleProgressDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !progressBarRef.current || duration <= 0) return
      const rect = progressBarRef.current.getBoundingClientRect()
      const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      onSeek(percentage * duration)
    },
    [isDragging, duration, onSeek]
  )

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
          <div
            className="absolute left-0 top-0 h-full bg-simpod-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-simpod-primary rounded-full",
              "opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-simpod-mark/30"
            )}
            style={{ left: `calc(${progress}% - 6px)` }}
          />
          <div
            className="absolute left-0 top-0 h-full rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ width: `${progress}%`, boxShadow: "0 0 10px hsl(var(--simpod-mark) / 0.3)" }}
          />
        </div>
        <span className="text-xs font-mono text-simpod-muted w-12">
          {formatTime(duration)}
        </span>
      </div>

      {/* Main Controls: [Prev] [◁15s] [Play] [15s▷] [Next] [Speed] */}
      <div className="flex items-center justify-center gap-3">
        {/* 上一集 */}
        <button
          onClick={onPrevEpisode}
          disabled={!hasPrev}
          className={cn(
            "p-2 rounded-lg transition-colors",
            hasPrev
              ? "text-muted-foreground hover:text-foreground hover:bg-secondary"
              : "text-muted-foreground/30 cursor-not-allowed"
          )}
          aria-label="上一集"
          title="上一集"
        >
          <SkipBack size={20} />
        </button>

        {/* 后退 15s */}
        <button
          onClick={() => onSeek(Math.max(0, currentTime - 15))}
          className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="后退 15 秒"
          title="← 后退 15 秒"
        >
          <ChevronLeft size={14} className="inline mr-0.5" />15s
        </button>

        {/* Play/Pause */}
        <button
          onClick={onPlayPause}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center",
            "bg-simpod-primary text-simpod-dark",
            "hover:scale-105 active:scale-95 transition-transform simpod-glow"
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

        {/* 快进 15s */}
        <button
          onClick={() => onSeek(Math.min(duration, currentTime + 15))}
          className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="快进 15 秒"
          title="→ 快进 15 秒"
        >
          15s<ChevronRight size={14} className="inline ml-0.5" />
        </button>

        {/* 下一集 */}
        <button
          onClick={onNextEpisode}
          disabled={!hasNext}
          className={cn(
            "p-2 rounded-lg transition-colors",
            hasNext
              ? "text-muted-foreground hover:text-foreground hover:bg-secondary"
              : "text-muted-foreground/30 cursor-not-allowed"
          )}
          aria-label="下一集"
          title="下一集"
        >
          <SkipForward size={20} />
        </button>

        {/* 倍速 */}
        <div className="relative ml-2">
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
                  onClick={() => { onRateChange(rate); setShowRateMenu(false) }}
                  className={cn(
                    "block w-full px-4 py-1.5 text-xs font-mono text-left hover:bg-secondary transition-colors",
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
