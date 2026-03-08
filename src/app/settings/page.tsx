"use client"

/**
 * Settings Page - 设置页面占位符
 * 
 * 按技术契约要求的占位符页面
 */

import Link from "next/link"
import {
  ArrowLeft,
  Settings,
  User,
  Bell,
  Palette,
  Database,
  Shield,
  HelpCircle,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingSection {
  title: string
  description: string
  icon: React.ReactNode
  href?: string
  disabled?: boolean
}

const settingSections: SettingSection[] = [
  {
    title: "Profile",
    description: "Manage your account and preferences",
    icon: <User size={20} />,
    disabled: true,
  },
  {
    title: "Notifications",
    description: "Configure notification settings",
    icon: <Bell size={20} />,
    disabled: true,
  },
  {
    title: "Appearance",
    description: "Customize the look and feel",
    icon: <Palette size={20} />,
    disabled: true,
  },
  {
    title: "Data & Storage",
    description: "Manage your data and storage usage",
    icon: <Database size={20} />,
    disabled: true,
  },
  {
    title: "Privacy & Security",
    description: "Control your privacy settings",
    icon: <Shield size={20} />,
    disabled: true,
  },
  {
    title: "Help & Support",
    description: "Get help and contact support",
    icon: <HelpCircle size={20} />,
    disabled: true,
  },
]

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="返回首页"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </Link>

          <div className="flex items-center gap-2">
            <Settings size={20} className="text-simpod-mark" />
            <h1 className="text-lg font-bold text-foreground">Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Coming Soon Notice */}
        <div className="mb-8 p-4 rounded-xl bg-simpod-mark/5 border border-simpod-mark/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-simpod-mark/10 flex items-center justify-center">
              <Settings size={18} className="text-simpod-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Settings Coming Soon
              </h2>
              <p className="text-xs text-muted-foreground">
                These settings will be available in a future update.
              </p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-3">
          {settingSections.map((section) => (
            <SettingItem key={section.title} {...section} />
          ))}
        </div>

        {/* Version Info */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            Simpod v2.0.0 (Preview)
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Built with Next.js 15 + TypeScript + Tailwind
          </p>
        </div>
      </main>
    </div>
  )
}

/**
 * SettingItem - 设置项
 */
function SettingItem({
  title,
  description,
  icon,
  href,
  disabled,
}: SettingSection) {
  const content = (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl",
        "bg-card border border-border",
        "transition-all duration-200",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:border-simpod-mark/30 hover:bg-card/80 cursor-pointer"
      )}
    >
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
        {icon}
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <ChevronRight size={16} className="text-muted-foreground" />
    </div>
  )

  if (href && !disabled) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
