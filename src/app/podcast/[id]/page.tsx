/**
 * Podcast Detail Page
 *
 * Displays podcast information and episode list
 */

import { podcastManager } from "@/services/podcast-manager"
import { EpisodeList } from "@/components/podcast/EpisodeList"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface PodcastPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ feedUrl?: string; title?: string; author?: string; artwork?: string; description?: string }>
}

export default async function PodcastPage({ params, searchParams }: PodcastPageProps) {
  const { id } = await params
  const { feedUrl, title, author, artwork, description } = await searchParams

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

  try {
    console.log('[Podcast Page] Fetching podcast via PodcastManager:', feedUrl)
    // Pass podcast info from search params as fallback for when RSS parsing fails
    const { podcast, episodes } = await podcastManager.getPodcast(feedUrl, {
      title: title || 'Unknown Podcast',
      author: author || 'Unknown Author',
      artwork: artwork || '',
      description: description || '',
    })
    console.log('[Podcast Page] Loaded successfully:', {
      podcastTitle: podcast.title,
      episodeCount: episodes.length,
      firstEpisodeAudioUrl: episodes[0]?.audioUrl
    })

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
                {title && podcast.title === 'Mock Podcast' && (
                  <span className="text-xs text-amber-500">Using mock episodes (RSS unavailable)</span>
                )}
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
  } catch (error: any) {
    console.error('[Podcast Page] Error:', {
      message: error.message,
      feedUrl,
      error
    })
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-foreground mb-2">Failed to Load Podcast</h1>
          <p className="text-muted-foreground mb-4">
            {error.message || 'Unable to fetch podcast feed'}
          </p>
          <div className="flex gap-3 justify-center">
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
}

export async function generateMetadata({ params, searchParams }: PodcastPageProps) {
  const { id } = await params
  const { feedUrl } = await searchParams

  return {
    title: `Podcast - ${id} | Simpod`,
    description: "View podcast episodes",
  }
}
