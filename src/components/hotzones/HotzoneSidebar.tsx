"use client"

/**
 * HotzoneSidebar - 热区列表侧边栏组件
 * 
 * 显示热区列表，支持过滤、状态切换和编辑
 */

import { useState, useMemo, useCallback } from "react"
import { Check, Clock, Archive, Filter, Edit2, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HotzoneSidebarProps, Hotzone, HotzoneFilter } from "@/types/simpod"
import { formatTime } from "@/lib/mock-data"
import { TranscriptSnippet } from "@/components/transcript/TranscriptStream"
import { HotzoneEditModal } from "./HotzoneEditModal"
import { updateHotzoneStatus } from "@/services/supabase"
import { usePlayerStore } from "@/stores/playerStore"

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
  const [filter, setFilter] = useState<HotzoneFilter>("all")
  const [editingHotzone, setEditingHotzone] = useState<Hotzone | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { updateHotzone: updateHotzoneInStore } = usePlayerStore()

  // 切换热区状态（pending → reviewed → archived → pending）
  const handleToggleStatus = useCallback(async (hotzone: Hotzone, e: React.MouseEvent) => {
    e.stopPropagation()
    const nextStatus: Record<string, 'pending' | 'reviewed' | 'archived'> = {
      pending: 'reviewed',
      reviewed: 'archived',
      archived: 'pending',
    }
    const newStatus = nextStatus[hotzone.status] || 'pending'
    try {
      await updateHotzoneStatus(hotzone.id, newStatus)
      updateHotzoneInStore(hotzone.id, { status: newStatus })
      onHotzoneToggleReviewed(hotzone.id, newStatus === 'reviewed')
      console.log('[HotzoneSidebar] Status updated:', hotzone.id, '->', newStatus)
    } catch (err) {
      console.error('[HotzoneSidebar] Failed to update status:', err)
    }
  }, [updateHotzoneInStore, onHotzoneToggleReviewed])

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

  const handleEditClick = useCallback((hotzone: Hotzone) => {
    setEditingHotzone(hotzone)
    setIsEditModalOpen(true)
  }, [])

  const handleSaveHotzone = async (updatedHotzone: Hotzone) => {
    try {
      console.log('[HotzoneSidebar] Saving hotzone:', updatedHotzone.id)
      const response = await fetch('/api/hotzones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedHotzone, id: updatedHotzone.id })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save hotzone')
      }

      console.log('[HotzoneSidebar] Hotzone saved successfully')
      // Trigger a refresh of hotzones (this would be handled by parent component)
      window.location.reload()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[HotzoneSidebar] Error saving hotzone:', message)
      throw err
    }
  }

  const handleDeleteHotzone = async (hotzoneId: string) => {
    try {
      console.log('[HotzoneSidebar] Deleting hotzone:', hotzoneId)
      const response = await fetch(`/api/hotzones?id=${hotzoneId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete hotzone')
      }

      console.log('[HotzoneSidebar] Hotzone deleted successfully')
      // Trigger a refresh of hotzones
      window.location.reload()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[HotzoneSidebar] Error deleting hotzone:', message)
      throw err
    }
  }

  return (
    <>
      <div className="flex flex-col h-full bg-card border-l border-border">
        {/* Header */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Hotzones</h2>

            {/* Compact filter icon-buttons */}
            <div className="flex items-center gap-0.5 bg-secondary/50 rounded-lg p-0.5">
              {([
                { value: 'all' as HotzoneFilter, icon: <Filter size={13} />, title: `All (${counts.all})` },
                { value: 'pending' as HotzoneFilter, icon: <Clock size={13} />, title: `Pending (${counts.pending})` },
                { value: 'reviewed' as HotzoneFilter, icon: <Check size={13} />, title: `Reviewed (${counts.reviewed})` },
                { value: 'archived' as HotzoneFilter, icon: <Archive size={13} />, title: `Archived (${counts.archived})` },
              ]).map(({ value, icon, title }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  title={title}
                  className={cn(
                    "relative w-7 h-7 rounded-md flex items-center justify-center transition-colors",
                    filter === value
                      ? "bg-card text-simpod-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {icon}
                  {/* Badge */}
                  {(value !== 'all' ? counts[value] : 0) > 0 && (
                    <span className={cn(
                      "absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full text-[9px] font-bold flex items-center justify-center px-0.5",
                      value === 'pending' ? "bg-amber-500 text-white" :
                      value === 'reviewed' ? "bg-green-500 text-white" :
                      "bg-muted-foreground/50 text-white"
                    )}>
                      {counts[value]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Active filter label */}
          {filter !== 'all' && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground capitalize">Showing: {filter}</span>
              <button onClick={() => setFilter('all')} className="text-[11px] text-simpod-primary hover:underline">Clear</button>
            </div>
          )}
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
                  onToggleStatus={(e) => handleToggleStatus(hotzone, e)}
                  onEdit={() => handleEditClick(hotzone)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingHotzone && (
        <HotzoneEditModal
          hotzone={editingHotzone}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingHotzone(null)
          }}
          onSave={handleSaveHotzone}
          onDelete={handleDeleteHotzone}
          maxDuration={editingHotzone.metadata?.duration || 3600}
        />
      )}
    </>
  )
}

/**
 * HotzoneCard - 单个热区卡片（直觉式操作按钮）
 */
function HotzoneCard({
  hotzone,
  isSelected,
  onClick,
  onToggleStatus,
  onEdit,
}: {
  hotzone: Hotzone
  isSelected: boolean
  onClick: () => void
  onToggleStatus: (e: React.MouseEvent) => void
  onEdit: () => void
}) {
  const statusConfig = {
    pending: {
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      icon: <Clock size={11} />,
      next: "→ reviewed",
    },
    reviewed: {
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      icon: <Check size={11} />,
      next: "→ archived",
    },
    archived: {
      color: "text-muted-foreground",
      bg: "bg-muted/30",
      border: "border-border",
      icon: <Archive size={11} />,
      next: "→ pending",
    },
  }

  const config = statusConfig[hotzone.status]

  return (
    <div
      className={cn(
        "rounded-lg border transition-all duration-200 group overflow-hidden",
        isSelected
          ? "bg-simpod-mark/5 border-simpod-mark/40 shadow-sm shadow-simpod-mark/10"
          : "bg-secondary/20 border-border/50 hover:border-border hover:bg-secondary/40"
      )}
    >
      {/* Top row: time + status badge + edit */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <span
          className={cn(
            "text-xs font-mono font-semibold",
            isSelected ? "text-simpod-primary" : "text-foreground/80"
          )}
        >
          {formatTime(hotzone.start_time)}
          <span className="text-muted-foreground font-normal mx-1">→</span>
          {formatTime(hotzone.end_time)}
        </span>

        <div className="flex items-center gap-1">
          {/* Status cycle button — always visible */}
          <button
            onClick={onToggleStatus}
            title={`${hotzone.status} · click: ${config.next}`}
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors",
              config.bg, config.color, config.border,
              "hover:opacity-70"
            )}
          >
            {config.icon}
            <span className="capitalize">{hotzone.status}</span>
          </button>

          {/* Edit button */}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="p-1 rounded text-muted-foreground/50 hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Edit hotzone"
            title="Edit"
          >
            <Edit2 size={12} />
          </button>
        </div>
      </div>

      {/* Transcript snippet */}
      <div className="px-3 pb-2">
        <TranscriptSnippet
          text={hotzone.transcript_snippet}
          maxLength={90}
          className="text-xs text-muted-foreground leading-relaxed"
          confidence={hotzone.transcript_confidence}
          source={hotzone.transcript_source}
        />
      </div>

      {/* Bottom action bar: Jump button + source badge */}
      <div
        className={cn(
          "flex items-center justify-between px-3 py-1.5 border-t",
          isSelected ? "border-simpod-mark/20 bg-simpod-mark/5" : "border-border/30 bg-secondary/30"
        )}
      >
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded font-medium",
            hotzone.source === "manual"
              ? "bg-simpod-mark/10 text-simpod-primary"
              : "bg-secondary text-muted-foreground"
          )}
        >
          {hotzone.source === "manual" ? "Manual" : "Auto"}
        </span>

        {/* Jump to hotzone — primary action */}
        <button
          onClick={(e) => { e.stopPropagation(); onClick() }}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
            isSelected
              ? "bg-simpod-mark text-simpod-dark"
              : "bg-simpod-mark/15 text-simpod-primary hover:bg-simpod-mark hover:text-simpod-dark"
          )}
          aria-label="Jump to hotzone"
        >
          <Play size={10} fill="currentColor" />
          Jump
        </button>
      </div>
    </div>
  )
}


