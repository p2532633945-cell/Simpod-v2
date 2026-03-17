"use client"

/**
 * PlaybackControls - 播放控制组件
 *
 * 布局（从上到下）：
 *   进度条 + 时间
 *   [Prev]  [◁15]  [▶▶]  [15▷]  [Next]
 *   倍速按钮（左对齐）
 */

import { useCallback, useRef, useState, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward } from "lucide-react"
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

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); onSeek(Math.max(0, currentTime - 15)); break
        case 'ArrowRight': e.preventDefault(); onSeek(Math.min(duration, currentTime + 15)); break
        case ' ': e.preventDefault(); onPlayPause(); break
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
      onSeek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration)
    },
    [duration, onSeek]
  )

  const handleProgressDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !progressBarRef.current || duration <= 0) return
      const rect = progressBarRef.current.getBoundingClientRect()
      onSeek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration)
    },
    [isDragging, duration, onSeek]
  )

  // Touch support for progress bar
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || duration <= 0) return
      const rect = progressBarRef.current.getBoundingClientRect()
      onSeek(Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width)) * duration)
    },
    [duration, onSeek]
  )

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* ── Progress Bar ── */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground w-10 text-right shrink-0">
          {formatTime(currentTime)}
        </span>

        <div
          ref={progressBarRef}
          className="flex-1 h-1.5 bg-secondary rounded-full cursor-pointer relative group touch-none"
          onClick={handleProgressClick}
          onMouseDown={() => setIsDragging(true)}
          onMouseMove={handleProgressDrag}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchMove={handleTouchMove}
          role="slider"
          aria-label="播放进度"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
        >
          <div
            className="absolute left-0 top-0 h-full bg-simpod-primary rounded-full"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-simpod-primary rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 7px)` }}
          />
        </div>

        <span className="text-xs font-mono text-muted-foreground w-10 shrink-0">
          {formatTime(duration)}
        </span>
      </div>

      {/* ── Main Controls Row ── */}
      <div className="flex items-center justify-between px-2">
        {/* 上一集 */}
        <button
          onClick={onPrevEpisode}
          disabled={!hasPrev}
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-full transition-colors",
            hasPrev ? "text-foreground/70 hover:text-foreground hover:bg-secondary" : "text-foreground/20 cursor-not-allowed"
          )}
          aria-label="上一集"
        >
          <SkipBack size={22} />
        </button>

        {/* 后退 15s */}
        <button
          onClick={() => onSeek(Math.max(0, currentTime - 15))}
          className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/70 hover:text-foreground hover:bg-secondary transition-colors relative"
          aria-label="后退 15 秒"
        >
          <SkipBack size={20} />
          <span className="absolute text-[9px] font-bold" style={{bottom:'6px', right:'4px'}}>15</span>
        </button>

        {/* Play/Pause — 大按钮 */}
        <button
          onClick={onPlayPause}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center shrink-0",
            "bg-simpod-primary text-simpod-dark",
            "hover:scale-105 active:scale-95 transition-transform simpod-glow"
          )}
          aria-label={isPlaying ? "暂停" : "播放"}
        >
          {isPlaying
            ? <Pause size={28} fill="currentColor" />
            : <Play size={28} fill="currentColor" className="ml-1" />
          }
        </button>

        {/* 快进 15s */}
        <button
          onClick={() => onSeek(Math.min(duration, currentTime + 15))}
          className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/70 hover:text-foreground hover:bg-secondary transition-colors relative"
          aria-label="快进 15 秒"
        >
          <SkipForward size={20} />
          <span className="absolute text-[9px] font-bold" style={{bottom:'6px', left:'4px'}}>15</span>
        </button>

        {/* 下一集 */}
        <button
          onClick={onNextEpisode}
          disabled={!hasNext}
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-full transition-colors",
            hasNext ? "text-foreground/70 hover:text-foreground hover:bg-secondary" : "text-foreground/20 cursor-not-allowed"
          )}
          aria-label="下一集"
        >
          <SkipForward size={22} />
        </button>
      </div>

      {/* ── Bottom row: Speed ── */}
      <div className="flex items-center justify-center">
        <div className="relative">
          <button
            onClick={() => setShowRateMenu(!showRateMenu)}
            className="px-3 py-1.5 text-xs font-mono rounded-full bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="播放速度"
          >
            {playbackRate}x
          </button>
          {showRateMenu && (
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 py-1 rounded-xl bg-card border border-border shadow-xl z-20"
              onMouseLeave={() => setShowRateMenu(false)}
            >
              {PLAYBACK_RATES.map((rate) => (
                <button
                  key={rate}
                  onClick={() => { onRateChange(rate); setShowRateMenu(false) }}
                  className={cn(
                    "block w-full px-5 py-2 text-xs font-mono text-left hover:bg-secondary transition-colors",
                    rate === playbackRate && "text-simpod-primary font-bold"
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
