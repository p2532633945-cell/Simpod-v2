"use client"

/**
 * TranscriptSearch - 转录搜索组件（P5-8）
 *
 * 支持全文搜索转录、关键词高亮、搜索历史
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { Search, X, Clock, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Hotzone } from "@/types/simpod"
import { formatTime } from "@/lib/time"

const MAX_HISTORY = 10
const STORAGE_KEY = "simpod_search_history"

interface SearchResult {
  hotzone: Hotzone
  matchContext: string
  matchIndex: number
}

interface TranscriptSearchProps {
  hotzones: Hotzone[]
  onHotzoneJump: (hotzoneId: string, startTime: number) => void
  className?: string
}

export function TranscriptSearch({ hotzones, onHotzoneJump, className }: TranscriptSearchProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 搜索结果
  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    return hotzones
      .filter(hz => {
        const text = (hz.transcript_snippet || '').toLowerCase()
        const audioId = hz.audio_id.toLowerCase()
        return text.includes(q) || audioId.includes(q)
      })
      .map(hz => {
        const text = hz.transcript_snippet || ''
        const idx = text.toLowerCase().indexOf(q)
        let matchContext = text
        if (idx >= 0) {
          const start = Math.max(0, idx - 40)
          const end = Math.min(text.length, idx + q.length + 40)
          matchContext = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '')
        }
        return { hotzone: hz, matchContext, matchIndex: idx }
      })
      .slice(0, 20)
  }, [query, hotzones])

  const saveHistory = useCallback((q: string) => {
    if (!q.trim()) return
    const next = [q, ...history.filter(h => h !== q)].slice(0, MAX_HISTORY)
    setHistory(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch { /* ignore */ }
  }, [history])

  const handleSearch = useCallback((q: string) => {
    setQuery(q)
    setIsOpen(true)
  }, [])

  const handleSelect = useCallback((result: SearchResult) => {
    saveHistory(query)
    onHotzoneJump(result.hotzone.id, result.hotzone.start_time)
    setIsOpen(false)
  }, [query, saveHistory, onHotzoneJump])

  const handleHistorySelect = useCallback((h: string) => {
    setQuery(h)
    setIsOpen(true)
    inputRef.current?.focus()
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }, [])

  const showHistory = isOpen && !query.trim() && history.length > 0
  const showResults = isOpen && query.trim().length > 0

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search transcripts..."
          className="w-full pl-9 pr-8 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-simpod-mark/50 focus:bg-secondary transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus() }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {(showHistory || showResults) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* History */}
          {showHistory && (
            <div>
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs text-muted-foreground font-medium">Recent Searches</span>
                <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
              </div>
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => handleHistorySelect(h)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary/50 transition-colors text-left"
                >
                  <Clock size={13} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground truncate">{h}</span>
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          {showResults && (
            <div>
              <div className="px-3 py-2 border-b border-border">
                <span className="text-xs text-muted-foreground font-medium">
                  {results.length > 0 ? `${results.length} result${results.length > 1 ? 's' : ''}` : 'No results'}
                </span>
              </div>
              {results.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No matches found for <span className="text-foreground font-medium">&ldquo;{query}&rdquo;</span>
                </div>
              ) : (
                results.map((result, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-secondary/50 transition-colors text-left border-b border-border/50 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-simpod-primary">
                          {formatTime(result.hotzone.start_time)} – {formatTime(result.hotzone.end_time)}
                        </span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded capitalize",
                          result.hotzone.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                          result.hotzone.status === 'reviewed' ? "bg-green-500/10 text-green-500" :
                          "bg-secondary text-muted-foreground"
                        )}>
                          {result.hotzone.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        <HighlightedText text={result.matchContext} query={query} />
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground flex-shrink-0 mt-1" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * HighlightedText - 高亮匹配关键词
 */
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>

  const q = query.trim()
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return <>{text}</>

  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-simpod-mark/30 text-simpod-primary rounded-sm px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  )
}
