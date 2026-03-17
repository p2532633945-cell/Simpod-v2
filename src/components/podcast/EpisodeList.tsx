/**
 * EpisodeList Component
 *
 * Displays a list of podcast episodes with play buttons
 */

"use client"

import { useState } from "react"
import { Play, Clock, Calendar, AlertCircle } from "lucide-react"
import Link from "next/link"
import type { Episode } from "@/types/simpod"

interface EpisodeListProps {
  episodes: Episode[]
  podcast: {
    title: string
    artwork: string
    feedUrl?: string
  }
}

export function EpisodeList({ episodes, podcast }: EpisodeListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="divide-y divide-border">
      {episodes.map((episode, index) => (
        <EpisodeItem
          key={episode.id}
          episode={episode}
          index={index + 1}
          isExpanded={expandedId === episode.id}
          onToggle={() => setExpandedId(expandedId === episode.id ? null : episode.id)}
          podcastTitle={podcast.title}
          podcastArtwork={podcast.artwork}
          feedUrl={podcast.feedUrl}
        />
      ))}
    </div>
  )
}

interface EpisodeItemProps {
  episode: Episode
  index: number
  isExpanded: boolean
  onToggle: () => void
  podcastTitle: string
  podcastArtwork: string
  feedUrl?: string
}

function EpisodeItem({
  episode,
  index,
  isExpanded,
  onToggle,
  podcastTitle,
  podcastArtwork,
  feedUrl,
}: EpisodeItemProps) {
  const [playError, setPlayError] = useState<string | null>(null)

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!episode.audioUrl || !episode.audioUrl.startsWith('http')) {
      setPlayError('Invalid audio URL')
      console.error('[EpisodeItem] Invalid audio URL:', episode.audioUrl)
      return
    }
    setPlayError(null)
    console.log('[EpisodeItem] Playing episode:', episode.title, { audioUrl: episode.audioUrl })
  }

  // 构建播放 URL，传递所有元数据给播放器页面
  const params = new URLSearchParams()
  if (episode.audioUrl) params.set('audioUrl', episode.audioUrl)
  if (feedUrl) params.set('feedUrl', feedUrl)
  if (episode.title) params.set('episodeTitle', episode.title)
  if (podcastTitle) params.set('podcastTitle', podcastTitle)
  const artworkSrc = episode.artwork || podcastArtwork
  if (artworkSrc) params.set('artwork', artworkSrc)
  const playUrl = `/workspace/${encodeURIComponent(episode.id)}?${params.toString()}`

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-4 hover:bg-secondary/50 transition-colors">
      <div className="flex items-start gap-4 cursor-pointer" onClick={onToggle}>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-muted-foreground">
          {index}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground line-clamp-2">{episode.title}</h3>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            {episode.duration && (
              <div className="flex items-center gap-1">
                <Clock size={14} />
                {formatDuration(episode.duration)}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(episode.pubDate)}
            </div>
          </div>
          {isExpanded && episode.description && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
              {episode.description}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          {playError && (
            <div className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle size={12} />
              <span>{playError}</span>
            </div>
          )}
          <Link
            href={playUrl}
            onClick={handlePlayClick}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-simpod-mark text-simpod-dark flex items-center justify-center hover:scale-105 transition-transform"
            aria-label="Play this episode"
          >
            <Play size={16} className="ml-0.5" fill="currentColor" />
          </Link>
        </div>
      </div>
    </div>
  )
}
