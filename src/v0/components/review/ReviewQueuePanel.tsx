"use client"

/**
 * ReviewQueuePanel - 批量复习入口/队列组件
 * 
 * 显示待复习的热区队列，支持批量操作
 */

import { useState, useMemo, useCallback } from "react"
import {
  Check,
  CheckCheck,
  Archive,
  Play,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ReviewQueuePanelProps, Hotzone } from "@/types/simpod"
import { formatTime, formatDate } from "@/lib/mock-data"
import { TranscriptSnippet } from "@/components/transcript/TranscriptStream"

export function ReviewQueuePanel({
  hotzones,
  onHotzoneJump,
  onHotzoneToggleReviewed,
}: ReviewQueuePanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isExpanded, setIsExpanded] = useState(true)

  // 只显示待复习的热区
  const pendingHotzones = useMemo(
    () => hotzones.filter((hz) => hz.status === "pending"),
    [hotzones]
  )

  // 全选/取消全选
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === pendingHotzones.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pendingHotzones.map((hz) => hz.id)))
    }
  }, [selectedIds.size, pendingHotzones])

  // 单选
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

  // 批量标记为已复习
  const handleBatchReview = useCallback(() => {
    selectedIds.forEach((id) => {
      onHotzoneToggleReviewed(id, true)
    })
    setSelectedIds(new Set())
  }, [selectedIds, onHotzoneToggleReviewed])

  // 批量归档
  const handleBatchArchive = useCallback(() => {
    // 在实际实现中，这里会调用归档 API
    console.log("Archive hotzones:", Array.from(selectedIds))
    setSelectedIds(new Set())
  }, [selectedIds])

  const isAllSelected =
    pendingHotzones.length > 0 && selectedIds.size === pendingHotzones.length

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-secondary/30 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-foreground">
              Review Queue
            </h3>
            <p className="text-xs text-muted-foreground">
              {pendingHotzones.length} hotzones waiting for review
            </p>
          </div>
        </div>

        {isExpanded ? (
          <ChevronUp size={20} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={20} className="text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          {pendingHotzones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <CheckCheck size={24} className="text-green-500" />
              </div>
              <p className="text-sm text-foreground font-medium mb-1">
                All caught up!
              </p>
              <p className="text-xs text-muted-foreground">
                No hotzones pending review
              </p>
            </div>
          ) : (
            <>
              {/* Batch actions */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <button
                  onClick={handleSelectAll}
                  className={cn(
                    "flex items-center gap-2 text-xs",
                    isAllSelected
                      ? "text-simpod-primary"
                      : "text-muted-foreground hover:text-foreground"
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBatchReview}
                    disabled={selectedIds.size === 0}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                      "transition-colors",
                      selectedIds.size > 0
                        ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                        : "bg-secondary text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    <Check size={14} />
                    Mark Reviewed ({selectedIds.size})
                  </button>

                  <button
                    onClick={handleBatchArchive}
                    disabled={selectedIds.size === 0}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                      "transition-colors",
                      selectedIds.size > 0
                        ? "bg-secondary text-foreground hover:bg-secondary/80"
                        : "bg-secondary text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    <Archive size={14} />
                    Archive
                  </button>
                </div>
              </div>

              {/* Queue items */}
              <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-simpod">
                {pendingHotzones.map((hotzone) => (
                  <ReviewQueueItem
                    key={hotzone.id}
                    hotzone={hotzone}
                    isSelected={selectedIds.has(hotzone.id)}
                    onSelect={() => handleSelect(hotzone.id)}
                    onJump={() => onHotzoneJump(hotzone.id, hotzone.start_time)}
                    onToggleReviewed={() =>
                      onHotzoneToggleReviewed(hotzone.id, true)
                    }
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * ReviewQueueItem - 复习队列项
 */
function ReviewQueueItem({
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
  onToggleReviewed: () => void
}) {
  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all",
        isSelected
          ? "bg-simpod-mark/5 border-simpod-mark/30"
          : "bg-secondary/20 border-transparent hover:bg-secondary/40"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onSelect}
          className={cn(
            "mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center",
            isSelected
              ? "bg-simpod-primary border-simpod-primary"
              : "border-border hover:border-simpod-primary/50"
          )}
        >
          {isSelected && <Check size={12} className="text-simpod-dark" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-simpod-primary">
              {formatTime(hotzone.start_time)} - {formatTime(hotzone.end_time)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatDate(hotzone.created_at)}
            </span>
          </div>

          <TranscriptSnippet
            text={hotzone.transcript_snippet}
            maxLength={60}
            className="text-xs mb-2"
          />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onJump}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-simpod-mark/10 text-simpod-primary hover:bg-simpod-mark/20 transition-colors"
            >
              <Play size={12} />
              Play
            </button>

            <button
              onClick={onToggleReviewed}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
            >
              <Check size={12} />
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
