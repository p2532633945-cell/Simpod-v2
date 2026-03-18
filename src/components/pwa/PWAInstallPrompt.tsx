"use client"

/**
 * PWAInstallPrompt - PWA 安装引导
 *
 * 双模式：
 * 1. beforeinstallprompt 触发时 → 一键安装按钮
 * 2. 未触发时（大多数情况）→ 显示手动添加到主屏幕引导
 *
 * 通过 URL hash #pwa-install 或首次访问 5 秒后显示
 */

import { useEffect, useState } from "react"
import { Download, X, MoreVertical, Share } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isAndroid() {
  return /android/i.test(navigator.userAgent)
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop'>('desktop')

  useEffect(() => {
    // 已安装为 PWA standalone 模式，不显示
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // 用户已永久关闭
    if (localStorage.getItem('simpod_pwa_dismissed') === 'true') return

    // 检测平台
    if (isIOS()) setPlatform('ios')
    else if (isAndroid()) setPlatform('android')
    else setPlatform('desktop')

    // 监听 beforeinstallprompt（Android Chrome engagement 达标后触发）
    const handler = (e: Event) => {
      e.preventDefault()
      console.log('[PWA] beforeinstallprompt captured — showing one-click install')
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // 安装成功后隐藏
    const installedHandler = () => {
      console.log('[PWA] App installed')
      setShowBanner(false)
      setShowGuide(false)
    }
    window.addEventListener('appinstalled', installedHandler)

    // 5 秒后，如果还没有 beforeinstallprompt，显示手动引导横幅
    const fallbackTimer = setTimeout(() => {
      setDeferredPrompt(prev => {
        if (!prev) {
          // 没有自动提示，显示手动引导入口
          console.log('[PWA] No beforeinstallprompt after 5s, showing manual guide')
          setShowBanner(true)
        }
        return prev
      })
    }, 5000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
      clearTimeout(fallbackTimer)
    }
  }, [])

  const handleOneClickInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log('[PWA] Install outcome:', outcome)
    setDeferredPrompt(null)
    setShowBanner(false)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setShowGuide(false)
    localStorage.setItem('simpod_pwa_dismissed', 'true')
  }

  if (!showBanner) return null

  // ── 一键安装模式（beforeinstallprompt 已触发）──
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:w-80" role="alert">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-simpod-mark/30 shadow-xl shadow-black/40">
          <div className="w-10 h-10 rounded-xl bg-simpod-mark/15 flex items-center justify-center shrink-0">
            <Download size={18} className="text-simpod-mark" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">Install Simpod</p>
            <p className="text-xs text-muted-foreground mt-0.5">Add to home screen for the best experience</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleOneClickInstall}
              className="px-3 py-1.5 rounded-lg bg-simpod-mark text-simpod-dark text-xs font-bold"
            >
              Install
            </button>
            <button onClick={handleDismiss} className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary" aria-label="关闭">
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── 手动引导模式（无 beforeinstallprompt）──
  // 横幅入口 → 点击展开步骤说明
  if (!showGuide) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:w-80" role="alert">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border shadow-xl shadow-black/40">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <Download size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">Add to Home Screen</p>
            <p className="text-xs text-muted-foreground mt-0.5">Install Simpod for offline access</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowGuide(true)}
              className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80"
            >
              How?
            </button>
            <button onClick={handleDismiss} className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary" aria-label="关闭">
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── 展开的步骤说明 ──
  return (
    <div className="fixed inset-x-4 bottom-20 z-50 md:left-auto md:right-6 md:w-80" role="dialog" aria-label="安装引导">
      <div className="rounded-2xl bg-card border border-border shadow-2xl shadow-black/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Download size={16} className="text-simpod-mark" />
            <p className="text-sm font-bold text-foreground">Install Simpod</p>
          </div>
          <button onClick={handleDismiss} className="p-1 rounded-lg text-muted-foreground hover:bg-secondary" aria-label="关闭">
            <X size={16} />
          </button>
        </div>

        {/* Steps */}
        <div className="px-4 py-3 space-y-3">
          {platform === 'android' && (
            <>
              <p className="text-xs text-muted-foreground mb-2">In Chrome for Android:</p>
              <Step num={1} text="Tap the" icon={<MoreVertical size={14} className="inline mx-0.5 text-foreground" />} suffix="menu (top-right)" />
              <Step num={2} text='Select "Add to Home screen"' />
              <Step num={3} text='Tap "Add" to confirm' />
            </>
          )}
          {platform === 'ios' && (
            <>
              <p className="text-xs text-muted-foreground mb-2">In Safari for iOS:</p>
              <Step num={1} text="Tap the" icon={<Share size={14} className="inline mx-0.5 text-foreground" />} suffix="Share button" />
              <Step num={2} text='Scroll down, tap "Add to Home Screen"' />
              <Step num={3} text='Tap "Add" to confirm' />
            </>
          )}
          {platform === 'desktop' && (
            <>
              <p className="text-xs text-muted-foreground mb-2">In Chrome desktop:</p>
              <Step num={1} text="Click the install icon in the address bar" />
              <Step num={2} text='Click "Install" in the dialog' />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Step({ num, text, icon, suffix }: { num: number; text: string; icon?: React.ReactNode; suffix?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-5 h-5 rounded-full bg-simpod-mark/15 text-simpod-mark text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
        {num}
      </span>
      <p className="text-xs text-foreground leading-relaxed">
        {text}{icon}{suffix}
      </p>
    </div>
  )
}
