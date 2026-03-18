"use client"

/**
 * PWAInstallPrompt - 自定义 PWA 安装提示
 *
 * 监听 beforeinstallprompt 事件，在用户有过交互后显示安装横幅。
 * 解决 Android Chrome 不自动显示安装提示的根本问题。
 */

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // 已安装为 PWA，不显示
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // 用户已永久关闭
    if (localStorage.getItem('simpod_pwa_dismissed') === 'true') return

    const handler = (e: Event) => {
      e.preventDefault()
      console.log('[PWA] beforeinstallprompt captured')
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // 延迟 3 秒再显示，避免刚进来就打扰
      setTimeout(() => setShowBanner(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // 监听安装成功事件
    const installedHandler = () => {
      console.log('[PWA] App installed successfully')
      setShowBanner(false)
      setDeferredPrompt(null)
    }
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    console.log('[PWA] Triggering install prompt')
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log('[PWA] Install prompt outcome:', outcome)
    setDeferredPrompt(null)
    setShowBanner(false)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setIsDismissed(true)
    // 永久关闭（存 localStorage）
    localStorage.setItem('simpod_pwa_dismissed', 'true')
    console.log('[PWA] Install banner dismissed permanently')
  }

  if (!showBanner || isDismissed || !deferredPrompt) return null

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:w-80"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-simpod-mark/30 shadow-xl shadow-black/40">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-simpod-mark/15 flex items-center justify-center shrink-0">
          <Download size={18} className="text-simpod-mark" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">Install Simpod</p>
          <p className="text-xs text-muted-foreground mt-0.5">Add to home screen for the best experience</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 rounded-lg bg-simpod-mark text-simpod-dark text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="关闭安装提示"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
