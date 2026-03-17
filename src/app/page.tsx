"use client"

/**
 * Home Page - 首页
 *
 * 显示 Podcast URL/搜索输入和最近项目
 */

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import {
  Search,
  Clock,
  Flame,
  ChevronRight,
  Podcast,
  Settings,
  AlertCircle,
  LogIn,
  LogOut,
  User,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/mock-data"
import { searchPodcasts } from "@/lib/podcast-search"
import { searchCache } from "@/lib/search-cache"
import type { Podcast as PodcastType } from "@/types/simpod"
import { useAuthStore } from "@/stores/authStore"
import { createClient } from "@/lib/supabase/client"

// 从 hotzones 推断的最近播放记录
interface RecentEpisode {
  audioId: string
  audioUrl: string
  episodeTitle: string
  podcastTitle: string
  artwork?: string
  hotzoneCount: number
  pendingCount: number
  lastAccessed: string
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchResults, setSearchResults] = useState<PodcastType[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const { user, signOut, initialize } = useAuthStore()
  const [recentEpisodes, setRecentEpisodes] = useState<RecentEpisode[]>([])
  const [recentLoading, setRecentLoading] = useState(false)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    initialize().then((fn) => { unsubscribe = fn })
    return () => { unsubscribe?.() }
  }, [initialize])

  // 从 Supabase hotzones 推断最近播放记录
  useEffect(() => {
    const loadRecent = async () => {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return

      setRecentLoading(true)
      try {
        const { data } = await supabase
          .from('hotzones')
          .select('audio_id, metadata, status, created_at')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(100)

        if (!data || data.length === 0) return

        // 按 audio_id 分组，取最近的
        const grouped = new Map<string, { hotzones: typeof data; latest: string }>()
        for (const hz of data) {
          const existing = grouped.get(hz.audio_id)
          if (!existing) {
            grouped.set(hz.audio_id, { hotzones: [hz], latest: hz.created_at })
          } else {
            existing.hotzones.push(hz)
            if (hz.created_at > existing.latest) existing.latest = hz.created_at
          }
        }

        // 转为 RecentEpisode 列表，按最近时间排序，最多显示 6 个
        const recent: RecentEpisode[] = Array.from(grouped.entries())
          .sort((a, b) => b[1].latest.localeCompare(a[1].latest))
          .slice(0, 6)
          .map(([audioId, { hotzones: hzList, latest }]) => {
            const meta = hzList[0]?.metadata || {}
            const pendingCount = hzList.filter((h) => h.status === 'pending').length
            return {
              audioId,
              audioUrl: (meta as Record<string, string>).audioUrl || '',
              episodeTitle: (meta as Record<string, string>).episodeTitle || audioId,
              podcastTitle: (meta as Record<string, string>).podcastTitle || 'Unknown Podcast',
              artwork: (meta as Record<string, string>).artwork || undefined,
              hotzoneCount: hzList.length,
              pendingCount,
              lastAccessed: latest,
            }
          })

        setRecentEpisodes(recent)
      } catch (err) {
        console.error('[Home] Failed to load recent episodes:', err)
      } finally {
        setRecentLoading(false)
      }
    }
    loadRecent()
  }, [user])

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchError(null)
    setSearchResults([])

    try {
      console.log("[Home] Searching for:", searchQuery)
      
      // P4-5 性能优化：检查缓存
      const cachedResults = searchCache.get<PodcastType[]>(searchQuery, 'podcast')
      if (cachedResults) {
        console.log("[Home] Using cached search results:", cachedResults.length, "podcasts")
        setSearchResults(cachedResults)
        setIsSearching(false)
        return
      }
      
      const results = await searchPodcasts(searchQuery)
      console.log("[Home] Search results:", results.length, "podcasts")

      // 缓存结果
      searchCache.set(searchQuery, 'podcast', results)

      if (results.length === 0) {
        setSearchError("No podcasts found. Try different keywords (e.g., 'bbc', 'technology', 'news').")
      } else {
        setSearchResults(results)
      }
    } catch (error: any) {
      console.error("[Home] Search error:", error)

      // Provide user-friendly error messages
      let errorMessage = "Search failed. Please try again."
      if (error.message.includes("iTunes API error")) {
        errorMessage = "Unable to connect to podcast directory. Please check your internet connection."
      } else if (error.message.includes("fetch")) {
        errorMessage = "Network error. Please check your internet connection."
      } else if (error.message) {
        errorMessage = error.message
      }

      setSearchError(errorMessage)
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-simpod-mark/10 flex items-center justify-center">
              <div
                className="w-4 h-4 rounded-full bg-simpod-mark"
                style={{
                  boxShadow: "0 0 15px hsl(var(--simpod-mark) / 0.5)",
                }}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Simpod</h1>
              <p className="text-xs text-muted-foreground">Protect Your Flow</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 md:gap-2">
            <Link
              href="/discover"
              className="px-2 md:px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Discover
            </Link>
            <Link
              href="/hotzones"
              className="px-2 md:px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Hotzones
            </Link>
            <Link
              href="/settings"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="设置"
            >
              <Settings size={18} />
            </Link>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden md:block max-w-[120px] truncate" title={user.email}>
                  <User size={12} className="inline mr-1" />{user.email}
                </span>
                <Link
                  href="/profile"
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  aria-label="个人资料"
                  title="Profile"
                >
                  <User size={18} />
                </Link>
                <button
                  onClick={signOut}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  aria-label="登出"
                  title="Sign out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-simpod-mark/10 text-simpod-primary hover:bg-simpod-mark/20 transition-colors"
              >
                <LogIn size={16} />
                <span className="hidden md:inline">Sign In</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Start Your Listening Session
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto text-pretty">
            Paste a podcast URL or search for your favorite shows. Mark the
            moments you want to review later.
          </p>
        </section>

        {/* Search Input */}
        <section className="mb-12">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div
              className={cn(
                "relative rounded-2xl transition-all duration-300",
                isSearchFocused ? "simpod-glow-strong" : "simpod-glow"
              )}
            >
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Search
                  size={20}
                  className={cn(
                    "transition-colors",
                    isSearchFocused
                      ? "text-simpod-primary"
                      : "text-muted-foreground"
                  )}
                />
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search podcasts (e.g., 'bbc', 'technology', 'news')..."
                className={cn(
                  "w-full pl-12 pr-4 py-4 rounded-2xl",
                  "bg-card border border-border",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:border-simpod-mark/50",
                  "transition-colors"
                )}
                disabled={isSearching}
              />

              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2",
                  "px-4 py-2 rounded-xl",
                  "bg-simpod-mark text-simpod-dark font-medium text-sm",
                  "hover:opacity-90 active:scale-95 transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </div>
          </form>

          {/* Search Tips */}
          {!searchError && searchResults.length === 0 && (
            <div className="max-w-2xl mx-auto mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Try searching for: <strong>BBC</strong>, <strong>TED</strong>, <strong>technology</strong>, <strong>news</strong>, or <strong>comedy</strong>
              </p>
            </div>
          )}

          {/* Search Error Message */}
          {searchError && (
            <div className="max-w-2xl mx-auto mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-500">{searchError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="max-w-2xl mx-auto mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Found {searchResults.length} podcast{searchResults.length !== 1 ? 's' : ''}
                </h3>
                <button
                  onClick={() => {
                    setSearchResults([])
                    setSearchError(null)
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {searchResults.map((podcast) => (
                  <SearchResultCard key={podcast.id} podcast={podcast} />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Recent Projects */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">
                Recently Played
              </h3>
            </div>
            <Link
              href="/hotzones"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-simpod-primary bg-simpod-mark/10 hover:bg-simpod-mark/20 transition-colors"
            >
              <Flame size={14} />
              All Hotzones
            </Link>
          </div>

          {recentLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : !user ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground text-sm mb-3">Sign in to see your recent episodes</p>
              <Link href="/auth" className="px-4 py-2 rounded-lg bg-simpod-mark text-simpod-dark text-sm font-medium">Sign In</Link>
            </div>
          ) : recentEpisodes.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentEpisodes.map((ep) => (
                <RecentEpisodeCard key={ep.audioId} episode={ep} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

/**
 * SearchResultCard - 搜索结果卡片
 * 点击后进入播客详情页显示剧集列表
 */
function SearchResultCard({ podcast }: { podcast: PodcastType }) {
  // Build URL params with all podcast info for fallback
  const params = new URLSearchParams()
  params.set('feedUrl', podcast.feedUrl)
  params.set('title', podcast.title)
  params.set('author', podcast.author)
  if (podcast.artwork) params.set('artwork', podcast.artwork)
  if (podcast.description) params.set('description', podcast.description)

  const podcastDetailUrl = `/podcast/${encodeURIComponent(podcast.id)}?${params.toString()}`

  return (
    <Link
      href={podcastDetailUrl}
      onClick={() => {
        console.log("[Home] Opening podcast detail page:", podcast.title)
      }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        "bg-card border border-border",
        "hover:border-simpod-mark/30 hover:bg-card/80",
        "transition-all duration-200"
      )}
    >
      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
        {podcast.artwork ? (
          <img
            src={podcast.artwork}
            alt={podcast.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Podcast size={20} className="text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-foreground line-clamp-1">
          {podcast.title}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {podcast.author}
        </p>
      </div>
      <ChevronRight
        size={16}
        className="text-muted-foreground transition-opacity flex-shrink-0"
      />
    </Link>
  )
}

/**
 * RecentEpisodeCard - 最近播放的节目卡片
 */
function RecentEpisodeCard({ episode }: { episode: RecentEpisode }) {
  const params = new URLSearchParams()
  if (episode.audioUrl) params.set('audioUrl', episode.audioUrl)
  if (episode.episodeTitle) params.set('episodeTitle', episode.episodeTitle)
  if (episode.podcastTitle) params.set('podcastTitle', episode.podcastTitle)
  if (episode.artwork) params.set('artwork', episode.artwork)
  const workspaceUrl = `/workspace/${encodeURIComponent(episode.audioId)}?${params.toString()}`

  return (
    <Link
      href={workspaceUrl}
      className={cn(
        "group p-4 rounded-xl",
        "bg-card border border-border",
        "hover:border-simpod-mark/30 hover:bg-card/80",
        "transition-all duration-200"
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
          {episode.artwork ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={episode.artwork} alt="" className="w-full h-full object-cover" />
          ) : (
            <Podcast size={20} className="text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-simpod-primary transition-colors">
            {episode.episodeTitle}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {episode.podcastTitle}
          </p>
        </div>
        <ChevronRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Flame size={12} className="text-simpod-mark" />
            <span className="text-xs text-muted-foreground">{episode.hotzoneCount} hotzones</span>
          </div>
          {episode.pendingCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-amber-500" />
              <span className="text-xs text-amber-500">{episode.pendingCount} pending</span>
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">{formatDate(episode.lastAccessed)}</span>
      </div>
    </Link>
  )
}
/**
 * EmptyState - 空状态
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-6">
        <Podcast size={32} className="text-muted-foreground" />
      </div>
      <h4 className="text-lg font-semibold text-foreground mb-2">No episodes yet</h4>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Search for a podcast above and start listening. Your played episodes will appear here.
      </p>
    </div>
  )
}
