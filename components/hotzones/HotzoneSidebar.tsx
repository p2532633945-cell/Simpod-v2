"use client"

/**
 * HotzoneSidebar - 热区列表侧边栏组件
 * 
 * 显示热区列表，支持过滤和状态切换
 */

import { useState, useMemo, useCallback } from "react"
import { Check, Clock, Archive, Filter, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HotzoneSidebarProps, Hotzone, HotzoneFilter } from "@/types/simpod"
import { formatTime } from "@/lib/mock-data"
import { TranscriptSnippet } from "@/components/transcript/TranscriptStream"

const FILTER_OPTIONS: { value: HotzoneFilter; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "All", icon: <Filter size={14} /> },
  { value: "pending", label: "Pending", icon: <Clock size={14} /> },
  { value: "reviewed", label: "Reviewed", icon: <Check size={14} /> },
  { value: "archived", label: "Archived", icon: <Archive size={14} /> },
]

export function HotzoneSidebar({
  hotzones,
  selectedHotzoneId,
  onHotzoneJump,
  onHotzoneToggleReviewed,
  onHotzoneSelect,
}: HotzoneSidebarProps) {
  // TODO: 此处应调用 useHotzoneStore 获取当前 audio_id 的 hotzones

  const [filter, setFilter] = useState<HotzoneFilter>("all")

  // 过滤热区
  const filteredHotzones = useMemo(() => {
    if (filter === "all") return hotzones
    return hotzones.filter((hz) => hz.status === filter)
  }, [hotzones, filter])

  // 统计数量
  const counts = useMemo(() => {
    return {
      all: hotzones.length,
      pending: hotzones.filter((hz) => hz.status === "pending").length,
      reviewed: hotzones.filter((hz) => hz.status === "reviewed").length,
      archived: hotzones.filter((hz) => hz.status === "archived").length,
    }
  }, [hotzones])

  const handleHotzoneClick = useCallback(
    (hotzone: Hotzone) => {
      onHotzoneJump(hotzone.id, hotzone.start_time)
      onHotzoneSelect?.(hotzone.id)
    },
    [onHotzoneJump, onHotzoneSelect]
  )

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-3">Hotzones</h2>

        {/* Filter tabs */}
        <div className="flex gap-1 flex-wrap">
          {FILTER_OPTIONS.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium",
                "transition-colors duration-200",
                filter === value
                  ? "bg-simpod-mark/10 text-simpod-primary border border-simpod-mark/20"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {icon}
              <span>{label}</span>
              <span
                className={cn(
                  "ml-1 px-1.5 py-0.5 rounded text-[10px]",
                  filter === value
                    ? "bg-simpod-mark/20"
                    : "bg-secondary"
                )}
              >
                {counts[value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Hotzone List */}
      <div className="flex-1 overflow-y-auto scrollbar-simpod p-2">
        {filteredHotzones.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
              <Filter size={20} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No hotzones in this category
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredHotzones.map((hotzone) => (
              <HotzoneCard
                key={hotzone.id}
                hotzone={hotzone}
                isSelected={selectedHotzoneId === hotzone.id}
                onClick={() => handleHotzoneClick(hotzone)}
                onToggleReviewed={(reviewed) =>
                  onHotzoneToggleReviewed(hotzone.id, reviewed)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * HotzoneCard - 单个热区卡片
 */
function HotzoneCard({
  hotzone,
  isSelected,
  onClick,
  onToggleReviewed,
}: {
  hotzone: Hotzone
  isSelected: boolean
  onClick: () => void
  onToggleReviewed: (reviewed: boolean) => void
}) {
  const statusConfig = {
    pending: {
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      icon: <Clock size={12} />,
    },
    reviewed: {
      color: "text-green-500",
      bg: "bg-green-500/10",
      icon: <Check size={12} />,
    },
    archived: {
      color: "text-muted-foreground",
      bg: "bg-muted/50",
      icon: <Archive size={12} />,
    },
  }

  const config = statusConfig[hotzone.status]

  return (
    <div
      className={cn(
        "p-3 rounded-lg cursor-pointer",
        "border transition-all duration-200",
        isSelected
          ? "bg-simpod-mark/5 border-simpod-mark/30"
          : "bg-secondary/30 border-transparent hover:bg-secondary/50 hover:border-border"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`热区: ${formatTime(hotzone.start_time)} - ${formatTime(hotzone.end_time)}`}
    >
      {/* Time range and status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-simpod-primary">
            {formatTime(hotzone.start_time)} - {formatTime(hotzone.end_time)}
          </span>
          {isSelected && (
            <ChevronRight size={14} className="text-simpod-primary" />
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleReviewed(hotzone.status !== "reviewed")
          }}
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded text-xs",
            config.bg,
            config.color,
            "hover:opacity-80 transition-opacity"
          )}
          aria-label={`Status: ${hotzone.status}`}
        >
          {config.icon}
          <span className="capitalize">{hotzone.status}</span>
        </button>
      </div>

      {/* Transcript snippet */}
      <TranscriptSnippet
        text={hotzone.transcript_snippet}
        maxLength={80}
        className="text-xs"
      />

      {/* Source indicator */}
      <div className="mt-2 flex items-center gap-2">
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded",
            hotzone.source === "manual"
              ? "bg-simpod-mark/10 text-simpod-primary"
              : "bg-secondary text-muted-foreground"
          )}
        >
          {hotzone.source === "manual" ? "Manual" : "Auto"}
        </span>

        {hotzone.metadata.difficulty_score && (
          <span className="text-[10px] text-muted-foreground">
            Difficulty: {hotzone.metadata.difficulty_score}/10
          </span>
        )}
      </div>
    </div>
  )
}
