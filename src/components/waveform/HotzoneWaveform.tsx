"use client"

/**
 * HotzoneWaveform - 波形 + 热区高亮组件
 * 
 * 显示音频波形并高亮标记热区位置
 * 支持点击热区跳转和进度条拖拽
 */

import { useCallback, useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { HotzoneWaveformProps, Hotzone } from "@/types/simpod"
import { formatTime } from "@/lib/time"
import { Flag } from "lucide-react"

const BAR_COUNT = 120

// 预生成的波形数据
const WAVEFORM_DATA: number[] = Array.from({ length: BAR_COUNT }, (_, i) => {
  const seed = (i * 7919 + 1) % 1000
  return 0.2 + (seed / 1000) * 0.6
})

interface ExtendedHotzoneWaveformProps extends HotzoneWaveformProps {
  isPlaying?: boolean
}

export function HotzoneWaveform({
  hotzones,
  currentTime,
  duration,
  onHotzoneJump,
  onSeek,
  isPlaying = false,
}: ExtendedHotzoneWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showMarkerTooltip, setShowMarkerTooltip] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const getHotzonePosition = useCallback(
    (hotzone: Hotzone) => {
      if (duration <= 0) return { left: 0, width: 0 }
      const left = (hotzone.start_time / duration) * 100
      const width = ((hotzone.end_time - hotzone.start_time) / duration) * 100
      return { left, width }
    },
    [duration]
  )

  const handleWaveformClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || duration <= 0) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const newTime = percentage * duration

      onSeek(newTime)
    },
    [duration, onSeek]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !containerRef.current || duration <= 0) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const newTime = percentage * duration

      onSeek(newTime)
    },
    [isDragging, duration, onSeek]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!containerRef.current || duration <= 0) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = e.touches[0].clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const newTime = percentage * duration

      onSeek(newTime)
    },
    [duration, onSeek]
  )

  const isInHotzone = useCallback(
    (time: number): Hotzone | null => {
      return (
        hotzones.find(
          (hz) => time >= hz.start_time && time <= hz.end_time
        ) || null
      )
    },
    [hotzones]
  )

  const currentHotzone = isInHotzone(currentTime)

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Markers Row - 热区标记 */}
      <div className="relative h-5 w-full">
        {/* 热区标记 - 小旗子 */}
        {hotzones.map((hotzone) => {
          const { left } = getHotzonePosition(hotzone)
          const isActive = currentHotzone?.id === hotzone.id

          return (
            <button
              key={`marker-${hotzone.id}`}
              className={cn(
                "absolute -translate-x-1/2 transition-all duration-200",
                "hover:scale-110 z-10"
              )}
              style={{ left: `${left}%`, top: 0 }}
              onClick={() => onHotzoneJump(hotzone.id, hotzone.start_time)}
              onMouseEnter={() => setShowMarkerTooltip(hotzone.id)}
              onMouseLeave={() => setShowMarkerTooltip(null)}
              aria-label={`跳转到热区 ${formatTime(hotzone.start_time)}`}
            >
              <Flag
                size={14}
                className={cn(
                  "transition-colors",
                  isActive
                    ? "text-simpod-mark fill-simpod-mark/30"
                    : "text-simpod-mark/70 hover:text-simpod-mark"
                )}
              />
              
              {/* Tooltip */}
              {showMarkerTooltip === hotzone.id && (
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] whitespace-nowrap bg-card border border-border shadow-lg z-30">
                  <span className="text-simpod-primary font-medium">
                    {formatTime(hotzone.start_time)}
                  </span>
                  <span className="text-muted-foreground ml-1">Hotzone</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Waveform Container */}
      <div
        ref={containerRef}
        className={cn(
          "relative h-14 md:h-16 rounded-lg overflow-hidden cursor-pointer",
          "bg-secondary/20",
          "touch-none select-none"
        )}
        onClick={handleWaveformClick}
        onMouseDown={() => setIsDragging(true)}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchStart={() => setIsDragging(true)}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setIsDragging(false)}
        role="slider"
        aria-label="音频波形"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
      >
        {/* Hotzone Background Highlights */}
        {hotzones.map((hotzone) => {
          const { left, width } = getHotzonePosition(hotzone)
          const isActive = currentHotzone?.id === hotzone.id

          return (
            <div
              key={`bg-${hotzone.id}`}
              className={cn(
                "absolute top-0 bottom-0 transition-all duration-300",
                isActive ? "bg-simpod-mark/20" : "bg-simpod-mark/8"
              )}
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              {/* Start line */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-px",
                isActive ? "bg-simpod-mark/60" : "bg-simpod-mark/30"
              )} />
              {/* End line */}
              <div className={cn(
                "absolute right-0 top-0 bottom-0 w-px",
                isActive ? "bg-simpod-mark/40" : "bg-simpod-mark/20"
              )} />
            </div>
          )
        })}

        {/* Waveform Lines */}
        <div className="absolute inset-0 flex items-center justify-between px-0.5">
          {WAVEFORM_DATA.map((height, i) => {
            const barPosition = (i / BAR_COUNT) * 100
            const isBeforePlayhead = barPosition <= progress

            const barTime = (barPosition / 100) * duration
            const inHotzone = isInHotzone(barTime)

            return (
              <div
                key={i}
                className={cn(
                  "w-[1px] md:w-[1.5px] rounded-full transition-colors duration-100",
                  isBeforePlayhead
                    ? inHotzone
                      ? "bg-simpod-mark"
                      : "bg-simpod-primary"
                    : inHotzone
                      ? "bg-simpod-mark/30"
                      : "bg-muted-foreground/20"
                )}
                style={{
                  height: `${Math.round(height * 80)}%`,
                }}
              />
            )
          })}
        </div>

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-simpod-primary pointer-events-none z-20 transition-[left] duration-75"
          style={{ left: `${progress}%` }}
        >
          {/* Playhead glow */}
          {isMounted && isPlaying && (
            <div
              className="absolute inset-0 bg-simpod-primary animate-pulse"
              style={{ boxShadow: "0 0 8px hsl(var(--simpod-primary) / 0.6)" }}
            />
          )}
          {/* Top indicator */}
          <div
            className={cn(
              "absolute -top-1 left-1/2 -translate-x-1/2",
              "w-2 h-2 rounded-full bg-simpod-primary"
            )}
          />
        </div>
      </div>

      {/* Time labels and legend */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-mono text-simpod-muted tabular-nums">
          {formatTime(currentTime)}
        </span>

        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-1 h-3 rounded-full bg-muted-foreground/20" />
            <span className="text-simpod-muted">Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <Flag size={10} className="text-simpod-mark" />
            <span className="text-simpod-muted">Hotzone</span>
          </div>
        </div>

        <span className="text-xs font-mono text-simpod-muted tabular-nums">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  )
}
