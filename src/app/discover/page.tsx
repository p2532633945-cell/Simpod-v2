"use client"

/**
 * Discover Page - 播客发现/浏览页面
 * 
 * 类似播客软件的陈列展示页面
 * 移动端优先设计
 */

import { useState, useCallback } from "react"
import Link from "next/link"
import {
  Search,
  TrendingUp,
  Star,
  Clock,
  PlayCircle,
  ChevronRight,
  Headphones,
  Sparkles,
  Filter,
  ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { mockPodcasts, mockEpisodes, formatTime } from "@/lib/mock-data"
import type { Podcast, Episode } from "@/types/simpod"

// 扩展的 mock 数据用于展示
const featuredPodcasts: Podcast[] = [
  ...mockPodcasts,
  {
    id: "pod-4",
    title: "Lex Fridman Podcast",
    author: "Lex Fridman",
    feedUrl: "https://example.com/lex-feed",
    artwork: "/placeholder.svg",
    description: "Conversations about science, technology, history, philosophy and the nature of intelligence",
    source: "itunes",
  },
  {
    id: "pod-5",
    title: "Huberman Lab",
    author: "Andrew Huberman",
    feedUrl: "https://example.com/huberman-feed",
    artwork: "/placeholder.svg",
    description: "Science-based tools for everyday life",
    source: "itunes",
  },
]

const categories = [
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "education", label: "Education", icon: Sparkles },
  { id: "technology", label: "Technology", icon: Headphones },
  { id: "business", label: "Business", icon: Star },
]

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // TODO: 实现搜索功能
      console.log("Search:", searchQuery)
    }
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-background">
      {/* Header - 移动端友好的固定头部 */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/"
              className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="返回首页"
            >
              <ArrowLeft size={20} className="text-foreground" />
            </Link>
            <h1 className="text-lg font-bold text-foreground">Discover</h1>
          </div>

          {/* 搜索栏 */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search podcasts..."
                className={cn(
                  "w-full pl-10 pr-4 py-2.5 rounded-xl",
                  "bg-secondary border border-transparent",
                  "text-sm text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:border-simpod-mark/50 focus:bg-card",
                  "transition-colors"
                )}
              />
            </div>
          </form>
        </div>

        {/* 分类标签 - 横向滚动 */}
        <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon
              const isSelected = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() =>
                    setSelectedCategory(isSelected ? null : cat.id)
                  }
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                    "text-xs font-medium whitespace-nowrap",
                    "transition-all duration-200",
                    isSelected
                      ? "bg-simpod-mark text-simpod-dark"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon size={14} />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <main className="px-4 py-6 pb-20">
        {/* Featured Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">
              Featured
            </h2>
            <button className="text-xs text-simpod-primary hover:underline">
              See all
            </button>
          </div>

          {/* 横向滚动卡片 - 移动端友好 */}
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-3" style={{ width: "max-content" }}>
              {featuredPodcasts.slice(0, 4).map((podcast) => (
                <FeaturedPodcastCard key={podcast.id} podcast={podcast} />
              ))}
            </div>
          </div>
        </section>

        {/* Popular Episodes */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">
              Popular Episodes
            </h2>
            <button className="text-xs text-simpod-primary hover:underline">
              See all
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {mockEpisodes.map((episode, index) => (
              <EpisodeListItem
                key={episode.id}
                episode={episode}
                podcast={mockPodcasts[index % mockPodcasts.length]}
              />
            ))}
          </div>
        </section>

        {/* All Podcasts */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">
              Browse All
            </h2>
            <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <Filter size={16} className="text-muted-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {featuredPodcasts.map((podcast) => (
              <PodcastGridCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        </section>
      </main>

      {/* 底部导航栏 - 移动端 */}
      <MobileNavBar />
    </div>
  )
}

/**
 * FeaturedPodcastCard - 精选播客大卡片
 */
function FeaturedPodcastCard({ podcast }: { podcast: Podcast }) {
  return (
    <Link
      href={`/podcast/${podcast.id}`}
      className={cn(
        "flex-shrink-0 w-64 rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-simpod-mark/20 to-simpod-primary/10",
        "border border-border hover:border-simpod-mark/30",
        "transition-all duration-200 active:scale-[0.98]"
      )}
    >
      <div className="p-4">
        <div className="w-24 h-24 rounded-xl bg-secondary mb-3 flex items-center justify-center">
          <Headphones size={32} className="text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground line-clamp-1 mb-1">
          {podcast.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
          {podcast.author}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {podcast.description}
        </p>
      </div>
    </Link>
  )
}

/**
 * EpisodeListItem - 单集列表项
 */
function EpisodeListItem({
  episode,
  podcast,
}: {
  episode: Episode
  podcast: Podcast
}) {
  return (
    <Link
      href={`/workspace/${episode.id}`}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        "bg-card border border-border",
        "hover:border-simpod-mark/30 hover:bg-card/80",
        "transition-all duration-200 active:scale-[0.99]"
      )}
    >
      <div className="relative w-14 h-14 rounded-lg bg-secondary flex-shrink-0 flex items-center justify-center">
        <Headphones size={20} className="text-muted-foreground" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
          <PlayCircle size={24} className="text-white" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground line-clamp-1">
          {episode.title}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {podcast.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Clock size={10} className="text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            {formatTime(episode.duration || 0)}
          </span>
        </div>
      </div>

      <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
    </Link>
  )
}

/**
 * PodcastGridCard - 播客网格卡片
 */
function PodcastGridCard({ podcast }: { podcast: Podcast }) {
  return (
    <Link
      href={`/podcast/${podcast.id}`}
      className={cn(
        "flex flex-col p-3 rounded-xl",
        "bg-card border border-border",
        "hover:border-simpod-mark/30 hover:bg-card/80",
        "transition-all duration-200 active:scale-[0.98]"
      )}
    >
      <div className="aspect-square w-full rounded-lg bg-secondary mb-2 flex items-center justify-center">
        <Headphones size={24} className="text-muted-foreground" />
      </div>
      <h4 className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
        {podcast.title}
      </h4>
      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
        {podcast.author}
      </p>
    </Link>
  )
}

/**
 * MobileNavBar - 移动端底部导航栏
 */
function MobileNavBar() {
  const navItems = [
    { href: "/", label: "Home", icon: Headphones },
    { href: "/discover", label: "Discover", icon: Search, active: true },
    { href: "/hotzones", label: "Hotzones", icon: Star },
    { href: "/settings", label: "Settings", icon: Filter },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg",
                "transition-colors",
                item.active
                  ? "text-simpod-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
