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
  Plus,
  Clock,
  Flame,
  ChevronRight,
  Podcast,
  Settings,
  AlertCircle,
  LogIn,
  LogOut,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { mockProjects, formatDate } from "@/lib/mock-data"
import { searchPodcasts } from "@/lib/podcast-search"
import type { Project, Podcast as PodcastType } from "@/types/simpod"
import { useAuthStore } from "@/stores/authStore"

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchResults, setSearchResults] = useState<PodcastType[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const { user, signOut, initialize } = useAuthStore()

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    initialize().then((fn) => { unsubscribe = fn })
    return () => { unsubscribe?.() }
  }, [initialize])

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchError(null)
    setSearchResults([])

    try {
      console.log("[Home] Searching for:", searchQuery)
      const results = await searchPodcasts(searchQuery)
      console.log("[Home] Search results:", results.length, "podcasts")

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
                Recent Projects
              </h3>
            </div>

            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-simpod-primary bg-simpod-mark/10 hover:bg-simpod-mark/20 transition-colors">
              <Plus size={14} />
              New Project
            </button>
          </div>

          {mockProjects.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
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
 * ProjectCard - 项目卡片
 */
function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/workspace/${project.episode.id}`}
      className={cn(
        "group p-4 rounded-xl",
        "bg-card border border-border",
        "hover:border-simpod-mark/30 hover:bg-card/80",
        "transition-all duration-200"
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
          <Podcast size={20} className="text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-simpod-primary transition-colors">
            {project.episode.title}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {project.podcast.title}
          </p>
        </div>

        <ChevronRight
          size={16}
          className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Flame size={12} className="text-simpod-mark" />
            <span className="text-xs text-muted-foreground">
              {project.hotzoneCount} hotzones
            </span>
          </div>

          {project.pendingCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-amber-500" />
              <span className="text-xs text-amber-500">
                {project.pendingCount} pending
              </span>
            </div>
          )}
        </div>

        <span className="text-[10px] text-muted-foreground">
          {formatDate(project.lastAccessed)}
        </span>
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

      <h4 className="text-lg font-semibold text-foreground mb-2">
        No projects yet
      </h4>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Start by searching for podcasts above or paste a podcast URL.
      </p>

      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-simpod-mark text-simpod-dark font-medium text-sm hover:opacity-90 transition-opacity">
        <Plus size={16} />
        Create First Project
      </button>
    </div>
  )
}
