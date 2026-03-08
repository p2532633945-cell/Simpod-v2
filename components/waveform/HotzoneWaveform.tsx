"use client"

/**
 * HotzoneWaveform - 波形 + 热区高亮组件
 * 
 * 显示音频波形并高亮标记热区位置
 * 支持点击热区跳转和进度条拖拽
 * 
 * 增强功能：
 * - 动态波形动画（播放时有呼吸效果）
 * - 热区标记（小旗子/光点）
 * - 锚点标记
 */

import { useCallback, useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { HotzoneWaveformProps, Hotzone, Anchor } from "@/types/simpod"
import { formatTime, mockAnchors } from "@/lib/mock-data"
import { Flag, Bookmark, Circle } from "lucide-react"

const BAR_COUNT = 80 // 减少数量以便在移动端显示更好

// 预生成的波形数据 - 避免 hydration 不匹配
const WAVEFORM_DATA: number[] = [
  0.65, 0.72, 0.58, 0.81, 0.45, 0.69, 0.77, 0.52, 0.88, 0.41,
  0.73, 0.66, 0.84, 0.49, 0.71, 0.59, 0.82, 0.47, 0.75, 0.63,
  0.79, 0.54, 0.86, 0.43, 0.68, 0.76, 0.51, 0.83, 0.46, 0.74,
  0.61, 0.87, 0.48, 0.72, 0.57, 0.80, 0.44, 0.70, 0.78, 0.53,
  0.85, 0.42, 0.67, 0.75, 0.50, 0.81, 0.45, 0.73, 0.62, 0.88,
  0.47, 0.71, 0.56, 0.79, 0.43, 0.69, 0.77, 0.52, 0.84, 0.41,
  0.66, 0.74, 0.49, 0.80, 0.44, 0.72, 0.61, 0.87, 0.46, 0.70,
  0.55, 0.78, 0.42, 0.68, 0.76, 0.51, 0.83, 0.40, 0.65, 0.73,
]

interface ExtendedHotzoneWaveformProps extends HotzoneWaveformProps {
  isPlaying?: boolean
  anchors?: Anchor[]
}

export function HotzoneWaveform({
  hotzones,
  currentTime,
  duration,
  onHotzoneJump,
  onSeek,
  isPlaying = false,
  anchors = mockAnchors,
}: ExtendedHotzoneWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredHotzone, setHoveredHotzone] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showMarkerTooltip, setShowMarkerTooltip] = useState<string | null>(null)

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

  // 计算锚点位置
  const getAnchorPosition = useCallback(
    (anchor: Anchor) => {
      if (duration <= 0) return 0
      return (anchor.timestamp / duration) * 100
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

  // 触摸事件处理（移动端）
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
      {/* Markers Row - 热区和锚点标记 */}
      <div className="relative h-6 w-full">
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
                size={16}
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

        {/* 锚点标记 - 小圆点 */}
        {anchors.map((anchor) => {
          const left = getAnchorPosition(anchor)
          const isNearPlayhead = Math.abs(currentTime - anchor.timestamp) < 2

          return (
            <button
              key={`anchor-${anchor.id}`}
              className={cn(
                "absolute bottom-0 -translate-x-1/2 transition-all duration-200",
                "hover:scale-125 z-10"
              )}
              style={{ left: `${left}%` }}
              onClick={() => onSeek(anchor.timestamp)}
              aria-label={`跳转到锚点 ${formatTime(anchor.timestamp)}`}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  isNearPlayhead
                    ? "bg-simpod-primary shadow-lg"
                    : "bg-simpod-primary/50 hover:bg-simpod-primary"
                )}
                style={{
                  boxShadow: isNearPlayhead
                    ? "0 0 8px hsl(var(--simpod-primary) / 0.6)"
                    : undefined,
                }}
              />
            </button>
          )
        })}
      </div>

      {/* Waveform Container */}
      <div
        ref={containerRef}
        className={cn(
          "relative h-16 md:h-20 rounded-xl overflow-hidden cursor-pointer",
          "bg-secondary/30 border border-border",
          "touch-none select-none"
        )}
        onClick={handleWaveformClick}
        onMouseDown={() => setIsDragging(true)}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => {
          setIsDragging(false)
          setHoveredHotzone(null)
        }}
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
                isActive ? "bg-simpod-mark/15" : "bg-simpod-mark/5"
              )}
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          )
        })}

        {/* Waveform Bars */}
        <div className="absolute inset-0 flex items-center gap-px px-1">
          {WAVEFORM_DATA.map((height, i) => {
            const barPosition = (i / BAR_COUNT) * 100
            const isBeforePlayhead = barPosition <= progress

            // 检查这个 bar 是否在热区内
            const barTime = (barPosition / 100) * duration
            const inHotzone = isInHotzone(barTime)

            // 动态动画效果 - 播放时有微小的脉动
            const animationDelay = (i % 8) * 50

            return (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-full transition-all",
                  isPlaying ? "duration-150" : "duration-75",
                  isBeforePlayhead
                    ? inHotzone
                      ? "bg-simpod-mark"
                      : "bg-simpod-primary/70"
                    : inHotzone
                      ? "bg-simpod-mark/40"
                      : "bg-muted-foreground/15"
                )}
                style={{
                  height: `${Math.round(height * 100)}%`,
                  transform: isPlaying && isBeforePlayhead
                    ? `scaleY(${1 + Math.sin(Date.now() / 200 + i) * 0.05})`
                    : undefined,
                  transition: isPlaying
                    ? `all 150ms ease ${animationDelay}ms`
                    : undefined,
                }}
              />
            )
          })}
        </div>

        {/* Hotzone Click Areas */}
        {hotzones.map((hotzone) => {
          const { left, width } = getHotzonePosition(hotzone)
          const isActive = currentHotzone?.id === hotzone.id
          const isHovered = hoveredHotzone === hotzone.id

          return (
            <button
              key={hotzone.id}
              className="absolute top-0 bottom-0 cursor-pointer"
              style={{ left: `${left}%`, width: `${width}%` }}
              onClick={(e) => {
                e.stopPropagation()
                onHotzoneJump(hotzone.id, hotzone.start_time)
              }}
              onMouseEnter={() => setHoveredHotzone(hotzone.id)}
              onMouseLeave={() => setHoveredHotzone(null)}
              aria-label={`热区: ${hotzone.transcript_snippet?.slice(0, 30)}...`}
            >
              {/* Hotzone start/end indicators */}
              <div
                className={cn(
                  "absolute top-0 bottom-0 left-0 w-0.5",
                  "bg-simpod-mark transition-opacity",
                  isActive || isHovered ? "opacity-100" : "opacity-40"
                )}
              />
              <div
                className={cn(
                  "absolute top-0 bottom-0 right-0 w-0.5",
                  "bg-simpod-mark transition-opacity",
                  isActive || isHovered ? "opacity-60" : "opacity-20"
                )}
              />
            </button>
          )
        })}

        {/* Progress Overlay (played section) */}
        <div
          className="absolute top-0 bottom-0 left-0 pointer-events-none"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, transparent 0%, hsl(var(--simpod-primary) / 0.05) 100%)",
          }}
        />

        {/* Playhead */}
        <div
          className={cn(
            "absolute top-0 bottom-0 w-0.5 pointer-events-none",
            "bg-simpod-primary transition-all duration-75"
          )}
          style={{
            left: `${progress}%`,
            boxShadow: currentHotzone
              ? "0 0 12px hsl(var(--simpod-mark) / 0.8)"
              : "0 0 8px hsl(var(--simpod-primary) / 0.5)",
          }}
        >
          {/* Playhead top dot */}
          <div
            className={cn(
              "absolute -top-1 left-1/2 -translate-x-1/2",
              "w-3 h-3 rounded-full",
              currentHotzone ? "bg-simpod-mark" : "bg-simpod-primary"
            )}
            style={{
              boxShadow: currentHotzone
                ? "0 0 10px hsl(var(--simpod-mark) / 0.6)"
                : "0 0 8px hsl(var(--simpod-primary) / 0.5)",
            }}
          />
        </div>
      </div>

      {/* Time labels and legend */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-mono text-simpod-muted tabular-nums">
          {formatTime(currentTime)}
        </span>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
            <span className="text-[10px] text-simpod-muted">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flag size={10} className="text-simpod-mark" />
            <span className="text-[10px] text-simpod-muted">Hotzone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-simpod-primary" />
            <span className="text-[10px] text-simpod-muted">Anchor</span>
          </div>
        </div>

        <span className="text-xs font-mono text-simpod-muted tabular-nums">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  )
}
