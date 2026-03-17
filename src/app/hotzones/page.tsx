"use client"

/**
 * Hotzones Page - 热区复盘界面
 *
 * 从 Supabase 加载真实热区数据，支持筛选、标记已复盘、跳转播放
 */

import { useState, useMemo, useCallback, useEffect } from "react"
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
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/mock-data"; import { formatTime } from "@/lib/time"
import type { Hotzone, HotzoneFilter } from "@/types/simpod"
import { fetchAllHotzones, updateHotzoneStatus } from "@/services/supabase"

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
  const [hotzones, setHotzones] = useState<Hotzone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20 // P4-5 性能优化：分页加载

  // 加载真实热区数据
  const loadHotzones = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('[HotzonesPage] Loading all hotzones...')
      const data = await fetchAllHotzones()
      console.log('[HotzonesPage] Loaded hotzones:', data.length)
      setHotzones(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load hotzones'
      console.error('[HotzonesPage] Error:', message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHotzones()
  }, [loadHotzones])

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

  // P4-5 性能优化：分页显示
  const paginatedHotzones = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
    const endIdx = startIdx + ITEMS_PER_PAGE
    return filteredHotzones.slice(startIdx, endIdx)
  }, [filteredHotzones, currentPage, ITEMS_PER_PAGE])

  const totalPages = Math.ceil(filteredHotzones.length / ITEMS_PER_PAGE)

  // 统计数量
  const counts = useMemo(() => ({
    all: hotzones.length,
    pending: hotzones.filter((hz) => hz.status === "pending").length,
    reviewed: hotzones.filter((hz) => hz.status === "reviewed").length,
    archived: hotzones.filter((hz) => hz.status === "archived").length,
  }), [hotzones])

  // 跳转播放
  const handleHotzoneJump = useCallback((hotzoneId: string, startTime: number) => {
    const hotzone = hotzones.find((hz) => hz.id === hotzoneId)
    if (hotzone) {
      // P4-5 性能优化：从 metadata 中获取 audioUrl
      const audioUrl = (hotzone.metadata as any)?.audioUrl
      const urlParams = new URLSearchParams()
      urlParams.set('t', startTime.toString())
      if (audioUrl) {
        urlParams.set('audioUrl', audioUrl)
      }
      window.location.href = `/workspace/${hotzone.audio_id}?${urlParams.toString()}`
      console.log('[HotzonesPage] Jumping to hotzone:', { hotzoneId, audioUrl, startTime })
    }
  }, [hotzones])

  // 切换单个热区状态（持久化到 Supabase）
  const handleToggleStatus = useCallback(async (hotzoneId: string, newStatus: 'pending' | 'reviewed' | 'archived') => {
    setUpdatingIds((prev) => new Set(prev).add(hotzoneId))
    try {
      await updateHotzoneStatus(hotzoneId, newStatus)
      setHotzones((prev) => prev.map((hz) => hz.id === hotzoneId ? { ...hz, status: newStatus } : hz))
    } catch (err) {
      console.error("[HotzonesPage] Update error:", err)
    } finally {
      setUpdatingIds((prev) => { const next = new Set(prev); next.delete(hotzoneId); return next })
    }
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredHotzones.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filteredHotzones.map((hz) => hz.id)))
  }, [selectedIds.size, filteredHotzones])

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }, [])

  const handleBatchReview = useCallback(async () => {
    await Promise.all(Array.from(selectedIds).map((id) => updateHotzoneStatus(id, "reviewed").catch(() => null)))
    setHotzones((prev) => prev.map((hz) => selectedIds.has(hz.id) ? { ...hz, status: "reviewed" } : hz))
    setSelectedIds(new Set())
  }, [selectedIds])

  const handleBatchArchive = useCallback(async () => {
    await Promise.all(Array.from(selectedIds).map((id) => updateHotzoneStatus(id, "archived").catch(() => null)))
    setHotzones((prev) => prev.map((hz) => selectedIds.has(hz.id) ? { ...hz, status: "archived" } : hz))
    setSelectedIds(new Set())
  }, [selectedIds])

  const isAllSelected = filteredHotzones.length > 0 && selectedIds.size === filteredHotzones.length

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-lg hover:bg-secondary transition-colors" aria-label="返回首页">
              <ArrowLeft size={20} className="text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-2">
              <Flame size={20} className="text-simpod-mark" />
              <h1 className="text-lg font-bold text-foreground">All Hotzones</h1>
              {!loading && (
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{hotzones.length}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadHotzones} disabled={loading} className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50">
              <RefreshCw size={16} className={cn("text-muted-foreground", loading && "animate-spin")} />
            </button>
            <div className="relative max-w-xs w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search hotzones..."
                className={cn("w-full pl-9 pr-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-simpod-mark/50")}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-500">{error}</p>
              <button onClick={loadHotzones} className="mt-2 text-xs text-red-400 underline">Try again</button>
            </div>
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading hotzones...</span>
          </div>
        )}
        {!loading && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2 flex-wrap">
                {FILTER_OPTIONS.map(({ value, label, icon }) => (
                  <button key={value} onClick={() => setFilter(value)}
                    className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
                      filter === value ? "bg-simpod-mark/10 text-simpod-primary border border-simpod-mark/20" : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary")}
                  >
                    {icon}<span>{label}</span>
                    <span className={cn("ml-1 px-1.5 py-0.5 rounded text-xs", filter === value ? "bg-simpod-mark/20" : "bg-secondary")}>{counts[value]}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleSelectAll} className={cn("flex items-center gap-2 text-sm px-3 py-2 rounded-lg", isAllSelected ? "text-simpod-primary bg-simpod-mark/10" : "text-muted-foreground hover:bg-secondary")}>
                  <div className={cn("w-4 h-4 rounded border flex items-center justify-center", isAllSelected ? "bg-simpod-primary border-simpod-primary" : "border-border")}>
                    {isAllSelected && <Check size={12} className="text-simpod-dark" />}
                  </div>
                  Select All
                </button>
                {selectedIds.size > 0 && (
                  <>
                    <button onClick={handleBatchReview} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-green-500/10 text-green-500 hover:bg-green-500/20"><CheckCheck size={14} />Review ({selectedIds.size})</button>
                    <button onClick={handleBatchArchive} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-secondary text-foreground hover:bg-secondary/80"><Archive size={14} />Archive</button>
                  </>
                )}
              </div>
            </div>
            {filteredHotzones.length === 0 ? (
              <EmptyState filter={filter} />
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {paginatedHotzones.map((hotzone) => (
                    <HotzoneCard key={hotzone.id} hotzone={hotzone}
                      isSelected={selectedIds.has(hotzone.id)}
                      isUpdating={updatingIds.has(hotzone.id)}
                      onSelect={() => handleSelect(hotzone.id)}
                      onJump={() => handleHotzoneJump(hotzone.id, hotzone.start_time)}
                      onStatusChange={(status: 'pending' | 'reviewed' | 'archived') => handleToggleStatus(hotzone.id, status)}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg text-sm bg-secondary text-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed">
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setCurrentPage(page)}
                          className={cn("w-8 h-8 rounded text-sm", currentPage === page ? "bg-simpod-mark/10 text-simpod-primary font-medium" : "bg-secondary text-muted-foreground hover:bg-secondary/80")}>
                          {page}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-lg text-sm bg-secondary text-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed">
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function HotzoneCard({ hotzone, isSelected, isUpdating, onSelect, onJump, onStatusChange }: {
  hotzone: Hotzone
  isSelected: boolean
  isUpdating: boolean
  onSelect: () => void
  onJump: () => void
  onStatusChange: (status: 'pending' | 'reviewed' | 'archived') => void
}) {
  const statusConfig: Record<'pending' | 'reviewed' | 'archived', { color: string; bg: string; label: string; next: 'pending' | 'reviewed' | 'archived' }> = {
    pending:  { color: "text-amber-500",        bg: "bg-amber-500/10",  label: "Pending",  next: "reviewed" },
    reviewed: { color: "text-green-500",        bg: "bg-green-500/10",  label: "Reviewed", next: "archived" },
    archived: { color: "text-muted-foreground", bg: "bg-muted/50",       label: "Archived", next: "pending"  },
  }
  const cfg = statusConfig[hotzone.status as 'pending' | 'reviewed' | 'archived'] || statusConfig.pending

  return (
    <div className={cn("p-4 rounded-xl border transition-all", isSelected ? "bg-simpod-mark/5 border-simpod-mark/30" : "bg-card border-border hover:border-simpod-mark/20")}>
      <div className="flex items-start gap-3">
        <button onClick={onSelect}
          className={cn("mt-1 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center",
            isSelected ? "bg-simpod-primary border-simpod-primary" : "border-border hover:border-simpod-primary/50")}
        >
          {isSelected && <Check size={14} className="text-simpod-dark" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{hotzone.audio_id}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-mono text-simpod-primary">
              {formatTime(hotzone.start_time)} – {formatTime(hotzone.end_time)}
            </span>
            <button onClick={() => onStatusChange(cfg.next)} disabled={isUpdating}
              className={cn("flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-opacity", cfg.bg, cfg.color,
                isUpdating ? "opacity-50 cursor-not-allowed" : "hover:opacity-80")}
            >
              {isUpdating ? <Loader2 size={12} className="animate-spin" /> : null}
              <span>{cfg.label}</span>
            </button>
          </div>
          {hotzone.transcript_snippet && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
              {hotzone.transcript_snippet}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn("text-xs px-1.5 py-0.5 rounded",
                hotzone.source === "manual" ? "bg-simpod-mark/10 text-simpod-primary" : "bg-secondary text-muted-foreground")}>
                {hotzone.source === "manual" ? "Manual" : "Auto"}
              </span>
              <span className="text-[10px] text-muted-foreground">{formatDate(hotzone.created_at)}</span>
            </div>
            <button onClick={onJump}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-simpod-mark/10 text-simpod-primary hover:bg-simpod-mark/20 transition-colors"
            >
              <Play size={12} />Play
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ filter }: { filter: HotzoneFilter }) {
  const messages: Record<HotzoneFilter, string> = {
    all:      "No hotzones yet. Start listening and mark moments you want to review.",
    pending:  "No pending hotzones. You are all caught up!",
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
