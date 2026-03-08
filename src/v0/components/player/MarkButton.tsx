"use client"

/**
 * MarkButton - MARK 主按钮组件
 * 
 * 点击时调用 onMark(currentTime)，且不暂停播放
 * 技术契约要求：MARK 按钮点击时必须调用 onMark(currentTime)
 */

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import type { MarkButtonProps } from "@/types/simpod"

export function MarkButton({
  currentTime,
  onMark,
  disabled = false,
}: MarkButtonProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  const handleMark = useCallback(() => {
    if (disabled) return

    // 调用 onMark(currentTime) - 严格遵守技术契约
    onMark(currentTime)

    // 视觉反馈
    setIsPressed(true)
    setShowFeedback(true)

    // 重置状态
    setTimeout(() => setIsPressed(false), 150)
    setTimeout(() => setShowFeedback(false), 2000)
  }, [currentTime, onMark, disabled])

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Main MARK Button */}
      <button
        onClick={handleMark}
        disabled={disabled}
        className={cn(
          "relative w-24 h-24 md:w-28 md:h-28 rounded-full",
          "flex items-center justify-center",
          "font-bold text-xl md:text-2xl tracking-wider",
          "transition-all duration-200 cursor-pointer select-none",
          "focus:outline-none focus:ring-2 focus:ring-simpod-mark focus:ring-offset-2 focus:ring-offset-background",
          disabled && "opacity-50 cursor-not-allowed",
          isPressed && "scale-95"
        )}
        style={{
          background:
            "radial-gradient(circle at 40% 35%, hsl(var(--simpod-surface)) 0%, hsl(var(--simpod-dark)) 100%)",
          boxShadow: isPressed
            ? "0 0 60px hsl(var(--simpod-mark) / 0.6), inset 0 0 20px hsl(var(--simpod-mark) / 0.15)"
            : "0 0 30px hsl(var(--simpod-mark) / 0.25), inset 0 0 15px hsl(var(--simpod-mark) / 0.05)",
          border: "1px solid hsl(var(--simpod-mark) / 0.3)",
        }}
        aria-label="标记当前位置"
      >
        {/* Outer glow ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-xl",
            "bg-simpod-mark/20 scale-110",
            isPressed ? "animate-pulse" : "animate-pulse-glow"
          )}
        />

        {/* Ripple effect on press */}
        {isPressed && (
          <div
            className="absolute inset-0 rounded-full border-2 border-simpod-mark animate-ping"
            style={{ animationDuration: "0.6s" }}
          />
        )}

        {/* MARK text */}
        <span
          className="relative z-10 text-simpod-primary"
          style={{
            textShadow: "0 0 20px hsl(var(--simpod-mark) / 0.8)",
          }}
        >
          MARK
        </span>
      </button>

      {/* Feedback text */}
      <div
        className={cn(
          "text-sm text-simpod-primary tracking-wide transition-all duration-300",
          showFeedback ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        )}
      >
        Marked. Keep listening.
      </div>
    </div>
  )
}

/**
 * MarkButtonCompact - 紧凑版 MARK 按钮
 * 
 * 用于工作区界面，尺寸更小
 */
export function MarkButtonCompact({
  currentTime,
  onMark,
  disabled = false,
}: MarkButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  const handleMark = useCallback(() => {
    if (disabled) return

    onMark(currentTime)
    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 150)
  }, [currentTime, onMark, disabled])

  return (
    <button
      onClick={handleMark}
      disabled={disabled}
      className={cn(
        "px-6 py-3 rounded-full",
        "font-semibold text-sm tracking-wider",
        "bg-simpod-mark/10 text-simpod-primary",
        "border border-simpod-mark/30",
        "hover:bg-simpod-mark/20 active:scale-95",
        "transition-all duration-200",
        "simpod-glow",
        disabled && "opacity-50 cursor-not-allowed",
        isPressed && "scale-95"
      )}
      aria-label="标记当前位置"
    >
      MARK
    </button>
  )
}
