"use client"

/**
 * TranscriptStream - 转录文本流组件
 * 
 * 显示转录文本，支持词级点击跳转
 * 当前播放位置的词会高亮显示
 */

import { useCallback, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { TranscriptStreamProps, Word } from "@/types/simpod"

export function TranscriptStream({
  words,
  currentTime,
  onWordClick,
}: TranscriptStreamProps) {
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

  if (words.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-simpod-muted">
        <p className="text-sm">暂无转录文本</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto scrollbar-simpod p-4"
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
  )
}

/**
 * TranscriptSnippet - 转录片段展示组件
 * 
 * 用于热区卡片中显示转录片段
 */
export function TranscriptSnippet({
  text,
  maxLength = 100,
  className,
}: {
  text?: string
  maxLength?: number
  className?: string
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

  return (
    <p className={cn("text-sm text-foreground/80 leading-relaxed", className)}>
      {`"${displayText}"`}
    </p>
  )
}
