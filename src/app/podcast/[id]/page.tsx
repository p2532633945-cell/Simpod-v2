"use client"

/**
 * Podcast Detail Page
 *
 * Displays podcast information and episode list
 * Client component to support DOMParser for RSS parsing
 */

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { podcastManager } from "@/services/podcast-manager"
import { EpisodeList } from "@/components/podcast/EpisodeList"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import type { Podcast, Episode } from "@/types/simpod"

export default function PodcastPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [podcast, setPodcast] = useState<Podcast | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])

  const feedUrl = searchParams.get('feedUrl')
  const title = searchParams.get('title')
  const author = searchParams.get('author')
  const artwork = searchParams.get('artwork')
  const description = searchParams.get('description')

  useEffect(() => {
    async function loadPodcast() {
      if (!feedUrl) {
        setError('Feed URL is required')
        setLoading(false)
        return
      }

      try {
        console.log('[Podcast Page] Fetching podcast:', feedUrl)
        const result = await podcastManager.getPodcast(feedUrl, {
          title: title || 'Unknown Podcast',
          author: author || 'Unknown Author',
          artwork: artwork || '',
          description: description || '',
        })

        setPodcast(result.podcast)
        setEpisodes(result.episodes)
        console.log('[Podcast Page] Loaded successfully:', {
          podcastTitle: result.podcast.title,
          episodeCount: result.episodes.length,
        })

      } catch (err: any) {
        console.error('[Podcast Page] Error:', err)
        setError(err.message || 'Failed to load podcast')
      } finally {
        setLoading(false)
      }
    }

    loadPodcast()
  }, [feedUrl, title, author, artwork, description])

  if (!feedUrl) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">Feed URL Required</h1>
          <p className="text-muted-foreground mb-4">Please provide a feed URL to view episodes</p>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg bg-simpod-mark text-simpod-dark font-medium"
          >
            Go to Search
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading podcast...</p>
        </div>
      </div>
    )
  }

  if (error || !podcast) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-foreground mb-2">Failed to Load Podcast</h1>
          <p className="text-muted-foreground mb-4">
            {error || 'Unable to fetch podcast feed'}
          </p>
          <div className="flex gap-3 justify-center mb-4">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-simpod-mark text-simpod-dark font-medium"
            >
              Go to Search
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="返回首页"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground line-clamp-1">
            {podcast.title}
          </h1>
        </div>
      </header>

      {/* Podcast Header */}
      <div className="border-b border-border bg-card/50 p-6">
        <div className="flex gap-6">
          {podcast.artwork && (
            <img
              src={podcast.artwork}
              alt={podcast.title}
              className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground line-clamp-2">
              {podcast.title}
            </h2>
            {podcast.author && (
              <p className="text-sm text-muted-foreground mt-1">
                {podcast.author}
              </p>
            )}
            {podcast.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                {podcast.description}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="bg-secondary px-2 py-1 rounded">
                {episodes.length} episodes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes List */}
      <EpisodeList
        episodes={episodes}
        podcast={podcast}
      />
    </div>
  )
}
