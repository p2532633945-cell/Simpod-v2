"use client"

/**
 * Hotzones Page - 热区管理页面
 * 
 * 显示所有热区，支持筛选和批量操作
 */

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Filter,
  Clock,
  Check,
  Archive,
  Play,
  Flame,
  Search,
  CheckCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  mockHotzones,
  mockEpisodes,
  mockPodcasts,
  formatTime,
  formatDate,
} from "@/lib/mock-data"
import type { Hotzone, HotzoneFilter } from "@/types/simpod"
import { TranscriptSnippet } from "@/components/transcript/TranscriptStream"
import { ReviewQueuePanel } from "@/components/review/ReviewQueuePanel"

const FILTER_OPTIONS: { value: HotzoneFilter; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "All", icon: <Filter size={14} /> },
  { value: "pending", label: "Pending", icon: <Clock size={14} /> },
  { value: "reviewed", label: "Reviewed", icon: <Check size={14} /> },
  { value: "archived", label: "Archived", icon: <Archive size={14} /> },
]

export default function HotzonesPage() {
  const [filter, setFilter] = useState<HotzoneFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [hotzones, setHotzones] = useState<Hotzone[]>(mockHotzones)

  // 过滤热区
  const filteredHotzones = useMemo(() => {
    let result = hotzones

    if (filter !== "all") {
      result = result.filter((hz) => hz.status === filter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (hz) =>
          hz.transcript_snippet?.toLowerCase().includes(query) ||
          hz.audio_id.toLowerCase().includes(query)
      )
    }

    return result
  }, [hotzones, filter, searchQuery])

  // 统计数量
  const counts = useMemo(() => {
    return {
      all: hotzones.length,
      pending: hotzones.filter((hz) => hz.status === "pending").length,
      reviewed: hotzones.filter((hz) => hz.status === "reviewed").length,
      archived: hotzones.filter((hz) => hz.status === "archived").length,
    }
  }, [hotzones])

  // 处理跳转
  const handleHotzoneJump = useCallback((hotzoneId: string, startTime: number) => {
    const hotzone = hotzones.find((hz) => hz.id === hotzoneId)
    if (hotzone) {
      // 跳转到工作区
      window.location.href = `/workspace/${hotzone.audio_id}?t=${startTime}`
    }
  }, [hotzones])

  // 处理状态切换
  const handleToggleReviewed = useCallback((hotzoneId: string, reviewed: boolean) => {
    setHotzones((prev) =>
      prev.map((hz) =>
        hz.id === hotzoneId
          ? { ...hz, status: reviewed ? "reviewed" : "pending" }
          : hz
      )
    )
  }, [])

  // 批量选择
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredHotzones.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredHotzones.map((hz) => hz.id)))
    }
  }, [selectedIds.size, filteredHotzones])

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // 批量操作
  const handleBatchReview = useCallback(() => {
    setHotzones((prev) =>
      prev.map((hz) =>
        selectedIds.has(hz.id) ? { ...hz, status: "reviewed" } : hz
      )
    )
    setSelectedIds(new Set())
  }, [selectedIds])

  const handleBatchArchive = useCallback(() => {
    setHotzones((prev) =>
      prev.map((hz) =>
        selectedIds.has(hz.id) ? { ...hz, status: "archived" } : hz
      )
    )
    setSelectedIds(new Set())
  }, [selectedIds])

  const isAllSelected =
    filteredHotzones.length > 0 && selectedIds.size === filteredHotzones.length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="返回首页"
            >
              <ArrowLeft size={20} className="text-muted-foreground" />
            </Link>

            <div className="flex items-center gap-2">
              <Flame size={20} className="text-simpod-mark" />
              <h1 className="text-lg font-bold text-foreground">All Hotzones</h1>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xs w-full">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hotzones..."
              className={cn(
                "w-full pl-9 pr-3 py-2 rounded-lg",
                "bg-secondary/50 border border-border",
                "text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:border-simpod-mark/50"
              )}
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Review Queue Panel */}
        <div className="mb-6">
          <ReviewQueuePanel
            hotzones={hotzones}
            onHotzoneJump={handleHotzoneJump}
            onHotzoneToggleReviewed={handleToggleReviewed}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2 flex-wrap">
            {FILTER_OPTIONS.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium",
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
                    "ml-1 px-1.5 py-0.5 rounded text-xs",
                    filter === value ? "bg-simpod-mark/20" : "bg-secondary"
                  )}
                >
                  {counts[value]}
                </span>
              </button>
            ))}
          </div>

          {/* Batch Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className={cn(
                "flex items-center gap-2 text-sm px-3 py-2 rounded-lg",
                isAllSelected
                  ? "text-simpod-primary bg-simpod-mark/10"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center",
                  isAllSelected
                    ? "bg-simpod-primary border-simpod-primary"
                    : "border-border"
                )}
              >
                {isAllSelected && <Check size={12} className="text-simpod-dark" />}
              </div>
              Select All
            </button>

            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={handleBatchReview}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-green-500/10 text-green-500 hover:bg-green-500/20"
                >
                  <CheckCheck size={14} />
                  Review ({selectedIds.size})
                </button>

                <button
                  onClick={handleBatchArchive}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-secondary text-foreground hover:bg-secondary/80"
                >
                  <Archive size={14} />
                  Archive
                </button>
              </>
            )}
          </div>
        </div>

        {/* Hotzones Grid */}
        {filteredHotzones.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredHotzones.map((hotzone) => (
              <HotzoneCard
                key={hotzone.id}
                hotzone={hotzone}
                isSelected={selectedIds.has(hotzone.id)}
                onSelect={() => handleSelect(hotzone.id)}
                onJump={() => handleHotzoneJump(hotzone.id, hotzone.start_time)}
                onToggleReviewed={(reviewed) =>
                  handleToggleReviewed(hotzone.id, reviewed)
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

/**
 * HotzoneCard - 热区卡片
 */
function HotzoneCard({
  hotzone,
  isSelected,
  onSelect,
  onJump,
  onToggleReviewed,
}: {
  hotzone: Hotzone
  isSelected: boolean
  onSelect: () => void
  onJump: () => void
  onToggleReviewed: (reviewed: boolean) => void
}) {
  const episode = mockEpisodes.find((ep) => ep.id === hotzone.audio_id)
  const podcast = mockPodcasts[0]

  const statusConfig = {
    pending: {
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      icon: <Clock size={14} />,
    },
    reviewed: {
      color: "text-green-500",
      bg: "bg-green-500/10",
      icon: <Check size={14} />,
    },
    archived: {
      color: "text-muted-foreground",
      bg: "bg-muted/50",
      icon: <Archive size={14} />,
    },
  }

  const config = statusConfig[hotzone.status]

  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-all",
        isSelected
          ? "bg-simpod-mark/5 border-simpod-mark/30"
          : "bg-card border-border hover:border-simpod-mark/20"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onSelect}
          className={cn(
            "mt-1 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center",
            isSelected
              ? "bg-simpod-primary border-simpod-primary"
              : "border-border hover:border-simpod-primary/50"
          )}
        >
          {isSelected && <Check size={14} className="text-simpod-dark" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Episode info */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground truncate">
              {episode?.title || hotzone.audio_id}
            </span>
            <span className="text-xs text-muted-foreground">-</span>
            <span className="text-xs text-muted-foreground">
              {podcast?.title}
            </span>
          </div>

          {/* Time range and status */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-mono text-simpod-primary">
              {formatTime(hotzone.start_time)} - {formatTime(hotzone.end_time)}
            </span>

            <button
              onClick={() => onToggleReviewed(hotzone.status !== "reviewed")}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded text-xs",
                config.bg,
                config.color,
                "hover:opacity-80 transition-opacity"
              )}
            >
              {config.icon}
              <span className="capitalize">{hotzone.status}</span>
            </button>
          </div>

          {/* Transcript */}
          <TranscriptSnippet
            text={hotzone.transcript_snippet}
            maxLength={120}
            className="mb-3"
          />

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded",
                  hotzone.source === "manual"
                    ? "bg-simpod-mark/10 text-simpod-primary"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {hotzone.source === "manual" ? "Manual" : "Auto"}
              </span>

              <span className="text-[10px] text-muted-foreground">
                {formatDate(hotzone.created_at)}
              </span>
            </div>

            <button
              onClick={onJump}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-simpod-mark/10 text-simpod-primary hover:bg-simpod-mark/20 transition-colors"
            >
              <Play size={12} />
              Play
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * EmptyState - 空状态
 */
function EmptyState({ filter }: { filter: HotzoneFilter }) {
  const messages = {
    all: "No hotzones yet. Start listening and mark moments you want to review.",
    pending: "No pending hotzones. You're all caught up!",
    reviewed: "No reviewed hotzones yet.",
    archived: "No archived hotzones.",
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <Flame size={24} className="text-muted-foreground" />
      </div>

      <p className="text-sm text-muted-foreground max-w-sm">{messages[filter]}</p>
    </div>
  )
}
