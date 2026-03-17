"use client"

/**
 * MiniPlayer - 全局迷你播放条
 *
 * 在非播放器页面底部显示，保持播放状态
 * 点击可跳回播放器页面（带完整参数，避免重新 mount audio）
 */

import { usePathname, useRouter } from "next/navigation"
import { Play, Pause, X } from "lucide-react"
import { usePlayerStore } from "@/stores/playerStore"
import { formatTime } from "@/lib/time"
import { cn } from "@/lib/utils"

export function MiniPlayer() {
  const pathname = usePathname()
  const router = useRouter()

  const {
    isPlaying,
    currentTime,
    duration,
    currentEpisodeInfo,
    setIsPlaying,
    setCurrentEpisodeInfo,
  } = usePlayerStore()

  // 只在非 workspace 页面显示
  const isWorkspace = pathname?.startsWith('/workspace')
  if (isWorkspace || !currentEpisodeInfo) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleClick = () => {
    const { audioId, audioUrl, feedUrl, episodeTitle, podcastTitle, artwork } = currentEpisodeInfo
    // 带完整参数跳回，避免重新 mount audio 元素产生双声道
    const params = new URLSearchParams()
    params.set('audioUrl', audioUrl)
    if (feedUrl) params.set('feedUrl', feedUrl)
    if (episodeTitle) params.set('episodeTitle', episodeTitle)
    if (podcastTitle) params.set('podcastTitle', podcastTitle)
    if (artwork) params.set('artwork', artwork)
    router.push(`/workspace/${encodeURIComponent(audioId)}?${params.toString()}`)
  }

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPlaying(!isPlaying)
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    // 真正停止音频
    setIsPlaying(false)
    // 延迟清除 info，确保 setIsPlaying 先执行
    setTimeout(() => setCurrentEpisodeInfo(null), 100)
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-card/95 backdrop-blur border-t border-border",
        "cursor-pointer",
        "animate-fade-in"
      )}
      onClick={handleClick}
    >
      {/* Progress bar at very top */}
      <div className="h-0.5 bg-secondary w-full">
        <div
          className="h-full bg-simpod-primary transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        {/* Artwork */}
        {currentEpisodeInfo.artwork ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentEpisodeInfo.artwork}
            alt=""
            className="w-10 h-10 rounded-md object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-md bg-simpod-mark/10 flex items-center justify-center flex-shrink-0">
            <div className="w-4 h-4 rounded-full bg-simpod-mark" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {currentEpisodeInfo.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {currentEpisodeInfo.podcastTitle} · {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>

        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
            "bg-simpod-primary text-simpod-dark",
            "hover:scale-105 active:scale-95 transition-transform"
          )}
          aria-label={isPlaying ? "暂停" : "播放"}
        >
          {isPlaying ? (
            <Pause size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="关闭"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
