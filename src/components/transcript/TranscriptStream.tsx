"use client"

/**
 * TranscriptStream - 转录文本流组件
 * 
 * 显示转录文本，支持词级点击跳转
 * 当前播放位置的词会高亮显示
 * P6-1.1: 显示转录来源徽章
 */

import { useCallback, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { TranscriptStreamProps, Word } from "@/types/simpod"
import { CheckCircle2, Zap, PencilIcon } from "lucide-react"

interface TranscriptStreamWithSourceProps extends TranscriptStreamProps {
  transcriptSource?: 'official' | 'groq' | 'user'
  transcriptConfidence?: number
}

export function TranscriptStream({
  words,
  currentTime,
  onWordClick,
  transcriptSource = 'groq',
  transcriptConfidence = 100,
}: TranscriptStreamWithSourceProps) {
  // TODO: 此处应调用 useTranscriptStore 获取当前热区转录数据

  const containerRef = useRef<HTMLDivElement>(null)
  const activeWordRef = useRef<HTMLSpanElement>(null)

  // 找到当前播放位置对应的词索引
  const getCurrentWordIndex = useCallback((): number => {
    for (let i = 0; i < words.length; i++) {
      if (currentTime >= words[i].start && currentTime < words[i].end) {
        return i
      }
    }
    // 如果时间在最后一个词之后，返回最后一个
    if (words.length > 0 && currentTime >= words[words.length - 1].end) {
      return words.length - 1
    }
    return -1
  }, [words, currentTime])

  const currentWordIndex = getCurrentWordIndex()

  // 自动滚动到当前词
  useEffect(() => {
    if (activeWordRef.current && containerRef.current) {
      const container = containerRef.current
      const activeWord = activeWordRef.current
      const containerRect = container.getBoundingClientRect()
      const wordRect = activeWord.getBoundingClientRect()

      // 如果当前词不在可视区域内，滚动到中间位置
      if (
        wordRect.top < containerRect.top ||
        wordRect.bottom > containerRect.bottom
      ) {
        activeWord.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }
    }
  }, [currentWordIndex])

  // P6-1.1: 获取来源徽章信息
  const getSourceBadge = () => {
    switch (transcriptSource) {
      case 'official':
        return {
          icon: CheckCircle2,
          label: '官方转录',
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-950',
          borderColor: 'border-green-200 dark:border-green-800'
        }
      case 'user':
        return {
          icon: PencilIcon,
          label: '用户编辑',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-950',
          borderColor: 'border-gray-200 dark:border-gray-800'
        }
      case 'groq':
      default:
        return {
          icon: Zap,
          label: 'Groq 转录',
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-950',
          borderColor: 'border-blue-200 dark:border-blue-800'
        }
    }
  }

  const sourceBadge = getSourceBadge()
  const SourceIcon = sourceBadge.icon

  if (words.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-simpod-muted">
        <p className="text-sm">暂无转录文本</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* P6-1.1: 转录来源徽章 */}
      <div className={cn(
        "px-4 py-2 border-b flex items-center gap-2",
        sourceBadge.bgColor,
        sourceBadge.borderColor
      )}>
        <SourceIcon className={cn("w-4 h-4", sourceBadge.color)} />
        <span className={cn("text-xs font-medium", sourceBadge.color)}>
          {sourceBadge.label}
        </span>
        {transcriptSource === 'groq' && transcriptConfidence !== undefined && (
          <span className="text-xs text-muted-foreground ml-auto">
            置信度: {transcriptConfidence}%
          </span>
        )}
      </div>

      {/* 转录文本 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto scrollbar-simpod p-4"
      >
        <div className="leading-relaxed text-base">
          {words.map((word, index) => {
            const isActive = index === currentWordIndex
            const isPast = currentTime > word.end
            const isFuture = currentTime < word.start

            return (
              <span
                key={`${word.word}-${word.start}-${index}`}
                ref={isActive ? activeWordRef : null}
                onClick={() => onWordClick(word.start)}
                className={cn(
                  "cursor-pointer inline-block px-0.5 py-0.5 rounded transition-all duration-150",
                  // 基础样式
                  "hover:bg-secondary/50",
                  // 状态样式
                  isActive && "bg-simpod-mark/20 text-simpod-primary font-medium",
                  isPast && !isActive && "text-foreground/80",
                  isFuture && "text-muted-foreground"
                )}
                style={{
                  textShadow: isActive
                    ? "0 0 10px hsl(var(--simpod-mark) / 0.5)"
                    : "none",
                }}
                role="button"
                aria-label={`跳转到 ${word.word}`}
              >
                {word.word}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * TranscriptSnippet - 转录片段展示组件
 * 
 * 用于热区卡片中显示转录片段
 * P6-1.2: 显示置信度指示
 */
export function TranscriptSnippet({
  text,
  maxLength = 100,
  className,
  confidence,
  source = 'groq',
}: {
  text?: string
  maxLength?: number
  className?: string
  confidence?: number
  source?: 'official' | 'groq' | 'user'
}) {
  if (!text) {
    return (
      <span className={cn("text-simpod-muted italic", className)}>
        No transcript available
      </span>
    )
  }

  const displayText =
    text.length > maxLength ? `${text.slice(0, maxLength)}...` : text

  // P6-1.2: 置信度指示颜色
  const getConfidenceColor = (conf?: number) => {
    if (conf === undefined || source === 'official') return 'bg-green-100 dark:bg-green-900'
    if (conf > 90) return 'bg-green-100 dark:bg-green-900'
    if (conf >= 70) return 'bg-yellow-100 dark:bg-yellow-900'
    return 'bg-red-100 dark:bg-red-900'
  }

  return (
    <div className="space-y-2">
      <p className={cn("text-sm text-foreground/80 leading-relaxed", className)}>
        {`"${displayText}"`}
      </p>
      {confidence !== undefined && source === 'groq' && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all", getConfidenceColor(confidence))}
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {confidence}%
          </span>
        </div>
      )}
    </div>
  )
}
