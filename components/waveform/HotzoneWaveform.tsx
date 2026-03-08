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
import { formatTime } from "@/lib/mock-data"

// 生成模拟波形数据
function generateWaveformData(count: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const noise1 = Math.sin(i * 0.4) * Math.cos(i * 0.15)
    const noise2 = Math.sin(i * 0.2 + 1.5) * 0.5
    return 0.2 + Math.abs(noise1 + noise2) * 0.6
  })
}

const BAR_COUNT = 120

export function HotzoneWaveform({
  hotzones,
  currentTime,
  duration,
  onHotzoneJump,
  onSeek,
}: HotzoneWaveformProps) {
  // TODO: 此处应调用 usePlayerStore 获取当前进度
  // TODO: 此处应调用 useHotzoneStore 获取当前 audio_id 的 hotzones

  const containerRef = useRef<HTMLDivElement>(null)
  const [waveformData] = useState(() => generateWaveformData(BAR_COUNT))
  const [hoveredHotzone, setHoveredHotzone] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // 计算热区在波形上的位置
  const getHotzonePosition = useCallback(
    (hotzone: Hotzone) => {
      if (duration <= 0) return { left: 0, width: 0 }
      const left = (hotzone.start_time / duration) * 100
      const width = ((hotzone.end_time - hotzone.start_time) / duration) * 100
      return { left, width }
    },
    [duration]
  )

  // 处理波形点击
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

  // 处理拖拽
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

  // 检查当前时间是否在某个热区内
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
      {/* Waveform Container */}
      <div
        ref={containerRef}
        className={cn(
          "relative h-20 md:h-24 rounded-xl overflow-hidden cursor-pointer",
          "bg-secondary/30 border border-border"
        )}
        onClick={handleWaveformClick}
        onMouseDown={() => setIsDragging(true)}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => {
          setIsDragging(false)
          setHoveredHotzone(null)
        }}
        role="slider"
        aria-label="音频波形"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
      >
        {/* Waveform Bars */}
        <div className="absolute inset-0 flex items-center gap-[1px] px-2">
          {waveformData.map((height, i) => {
            const barPosition = (i / BAR_COUNT) * 100
            const isBeforePlayhead = barPosition <= progress

            // 检查这个 bar 是否在热区内
            const barTime = (barPosition / 100) * duration
            const inHotzone = isInHotzone(barTime)
            const isHovered = inHotzone && hoveredHotzone === inHotzone.id

            return (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-full transition-all duration-75",
                  isBeforePlayhead
                    ? inHotzone
                      ? "bg-simpod-mark"
                      : "bg-simpod-primary/70"
                    : inHotzone
                      ? "bg-simpod-mark/30"
                      : "bg-muted-foreground/10"
                )}
                style={{
                  height: `${height * 100}%`,
                  boxShadow:
                    isBeforePlayhead && inHotzone
                      ? "0 0 6px hsl(var(--simpod-mark) / 0.5)"
                      : "none",
                  opacity: isHovered ? 1 : undefined,
                }}
              />
            )
          })}
        </div>

        {/* Hotzone Overlays */}
        {hotzones.map((hotzone) => {
          const { left, width } = getHotzonePosition(hotzone)
          const isActive = currentHotzone?.id === hotzone.id
          const isHovered = hoveredHotzone === hotzone.id

          return (
            <button
              key={hotzone.id}
              className={cn(
                "absolute top-0 bottom-0 cursor-pointer",
                "transition-all duration-200"
              )}
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: isActive
                  ? "hsl(var(--simpod-mark) / 0.15)"
                  : isHovered
                    ? "hsl(var(--simpod-mark) / 0.1)"
                    : "transparent",
              }}
              onClick={(e) => {
                e.stopPropagation()
                onHotzoneJump(hotzone.id, hotzone.start_time)
              }}
              onMouseEnter={() => setHoveredHotzone(hotzone.id)}
              onMouseLeave={() => setHoveredHotzone(null)}
              aria-label={`热区: ${hotzone.transcript_snippet?.slice(0, 30)}...`}
            >
              {/* Hotzone indicator line at start */}
              <div
                className={cn(
                  "absolute top-0 bottom-0 left-0 w-0.5",
                  "bg-simpod-mark transition-opacity",
                  isActive || isHovered ? "opacity-100" : "opacity-50"
                )}
              />

              {/* Hover tooltip */}
              {isHovered && (
                <div
                  className={cn(
                    "absolute -top-10 left-1/2 -translate-x-1/2",
                    "px-2 py-1 rounded text-xs whitespace-nowrap",
                    "bg-card border border-border shadow-lg z-20"
                  )}
                >
                  <span className="text-simpod-primary">
                    {formatTime(hotzone.start_time)} -{" "}
                    {formatTime(hotzone.end_time)}
                  </span>
                </div>
              )}
            </button>
          )
        })}

        {/* Playhead */}
        <div
          className={cn(
            "absolute top-0 bottom-0 w-0.5 bg-simpod-primary",
            "shadow-lg transition-shadow",
            currentHotzone ? "simpod-glow-strong" : "simpod-glow"
          )}
          style={{ left: `${progress}%` }}
        />

        {/* Current time indicator */}
        <div
          className={cn(
            "absolute -top-1 w-2 h-2 rounded-full bg-simpod-primary",
            "transform -translate-x-1/2",
            "simpod-glow"
          )}
          style={{ left: `${progress}%` }}
        />
      </div>

      {/* Time labels and legend */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-mono text-simpod-muted">
          {formatTime(currentTime)}
        </span>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
            <span className="text-xs text-simpod-muted">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-simpod-mark" />
            <span className="text-xs text-simpod-muted">Hotzone</span>
          </div>
        </div>

        <span className="text-xs font-mono text-simpod-muted">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  )
}
