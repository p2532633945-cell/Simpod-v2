"use client"

/**
 * AnalyticsDashboard - 热区统计分析仪表板（P5-6）
 *
 * 显示热区数量统计、学习进度追踪、时间分布分析
 */

import { useMemo } from "react"
import { Flame, Clock, Check, Archive, TrendingUp, Calendar, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Hotzone } from "@/types/simpod"
import { formatTime } from "@/lib/time"

interface AnalyticsDashboardProps {
  hotzones: Hotzone[]
  className?: string
}

export function AnalyticsDashboard({ hotzones, className }: AnalyticsDashboardProps) {
  const stats = useMemo(() => {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const total = hotzones.length
    const pending = hotzones.filter(hz => hz.status === 'pending').length
    const reviewed = hotzones.filter(hz => hz.status === 'reviewed').length
    const archived = hotzones.filter(hz => hz.status === 'archived').length

    // 本周创建
    const createdThisWeek = hotzones.filter(hz =>
      new Date(hz.created_at) >= oneWeekAgo
    ).length

    // 本周复习
    const reviewedThisWeek = hotzones.filter(hz =>
      hz.status === 'reviewed' && new Date(hz.created_at) >= oneWeekAgo
    ).length

    // 总学习时长（所有热区时长之和）
    const totalDurationSeconds = hotzones.reduce((acc, hz) =>
      acc + (hz.end_time - hz.start_time), 0
    )

    // 平均热区时长
    const avgDuration = total > 0 ? totalDurationSeconds / total : 0

    // 复习进度
    const reviewProgress = total > 0 ? Math.round((reviewed / total) * 100) : 0

    // 按天统计最近7天的热区数量
    const dailyCounts = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))
      const count = hotzones.filter(hz => {
        const d = new Date(hz.created_at)
        return d >= dayStart && d <= dayEnd
      }).length
      return {
        label: dayStart.toLocaleDateString('en', { weekday: 'short' }),
        count
      }
    })

    const maxDailyCount = Math.max(...dailyCounts.map(d => d.count), 1)

    return {
      total, pending, reviewed, archived,
      createdThisWeek, reviewedThisWeek,
      totalDurationSeconds, avgDuration,
      reviewProgress, dailyCounts, maxDailyCount
    }
  }, [hotzones])

  return (
    <div className={cn("space-y-4", className)}>
      {/* 总览卡片 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Flame size={16} className="text-simpod-mark" />}
          label="Total"
          value={stats.total}
          bg="bg-simpod-mark/10"
        />
        <StatCard
          icon={<Clock size={16} className="text-amber-500" />}
          label="Pending"
          value={stats.pending}
          bg="bg-amber-500/10"
        />
        <StatCard
          icon={<Check size={16} className="text-green-500" />}
          label="Reviewed"
          value={stats.reviewed}
          bg="bg-green-500/10"
        />
        <StatCard
          icon={<Archive size={16} className="text-muted-foreground" />}
          label="Archived"
          value={stats.archived}
          bg="bg-secondary"
        />
      </div>

      {/* 学习进度 + 本周统计 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* 复习进度 */}
        <div className="p-4 bg-card border border-border rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-simpod-primary" />
            <span className="text-sm font-semibold text-foreground">Review Progress</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{stats.reviewed} / {stats.total} reviewed</span>
              <span>{stats.reviewProgress}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-simpod-primary rounded-full transition-all duration-500"
                style={{ width: `${stats.reviewProgress}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="text-center p-2 bg-secondary/50 rounded-lg">
              <div className="text-sm font-semibold text-foreground">{stats.createdThisWeek}</div>
              <div className="text-[10px] text-muted-foreground">Created this week</div>
            </div>
            <div className="text-center p-2 bg-secondary/50 rounded-lg">
              <div className="text-sm font-semibold text-foreground">{stats.reviewedThisWeek}</div>
              <div className="text-[10px] text-muted-foreground">Reviewed this week</div>
            </div>
          </div>
        </div>

        {/* 时长统计 */}
        <div className="p-4 bg-card border border-border rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-simpod-primary" />
            <span className="text-sm font-semibold text-foreground">Learning Stats</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Total audio marked</span>
              <span className="text-sm font-mono text-foreground">{formatTime(stats.totalDurationSeconds)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Avg hotzone duration</span>
              <span className="text-sm font-mono text-foreground">{formatTime(stats.avgDuration)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Pending review</span>
              <span className={cn(
                "text-sm font-semibold",
                stats.pending > 10 ? "text-amber-500" : "text-green-500"
              )}>
                {stats.pending}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 7天柱状图 */}
      <div className="p-4 bg-card border border-border rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-simpod-primary" />
          <span className="text-sm font-semibold text-foreground">Last 7 Days Activity</span>
        </div>
        <div className="flex items-end justify-between gap-1 h-20">
          {stats.dailyCounts.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div className="w-full flex items-end justify-center" style={{ height: 60 }}>
                <div
                  className={cn(
                    "w-full rounded-t transition-all duration-500",
                    day.count > 0 ? "bg-simpod-primary/70" : "bg-secondary"
                  )}
                  style={{
                    height: day.count > 0
                      ? `${Math.max(4, Math.round((day.count / stats.maxDailyCount) * 60))}px`
                      : '4px'
                  }}
                  title={`${day.count} hotzones`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{day.label}</span>
              {day.count > 0 && (
                <span className="text-[10px] font-semibold text-simpod-primary">{day.count}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon, label, value, bg
}: {
  icon: React.ReactNode
  label: string
  value: number
  bg: string
}) {
  return (
    <div className={cn("p-3 rounded-xl border border-border", bg)}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </div>
  )
}
