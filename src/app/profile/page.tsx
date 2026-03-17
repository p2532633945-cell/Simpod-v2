"use client"

/**
 * 用户资料页面 - P5-1 用户认证系统
 * 
 * 用户可以编辑个人信息、查看账户状态、管理偏好设置
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, AlertCircle, Check, Mail, User, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/authStore"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export default function ProfilePage() {
  const { user, signOut } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [userMetadata, setUserMetadata] = useState<any>(null)

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || "")
      setUserMetadata(user.user_metadata || {})
    }
  }, [user])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: displayName,
          ...userMetadata,
        },
      })

      if (error) throw error
      setMessage("Profile updated successfully!")
      console.log('[Profile] Profile updated')
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile"
      console.error('[Profile] Error:', message)
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to view your profile</p>
          <Link
            href="/auth"
            className="px-4 py-2 rounded-lg bg-simpod-mark text-simpod-dark font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="返回首页"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Account Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Account Status */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Account Status</h2>
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-foreground font-medium">{user.email}</p>
                </div>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                user.email_confirmed_at
                  ? "bg-green-500/10 text-green-500"
                  : "bg-amber-500/10 text-amber-500"
              )}>
                {user.email_confirmed_at ? "Verified" : "Pending"}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="text-sm text-muted-foreground">Account Created</p>
                <p className="text-foreground font-medium">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Profile Information */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Profile Information</h2>
          <form onSubmit={handleSaveProfile} className="bg-card border border-border rounded-xl p-6 space-y-4">
            {/* Display Name */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Display Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className={cn(
                    "w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary/50 border border-border",
                    "text-sm text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:border-simpod-mark/50"
                  )}
                />
              </div>
            </div>

            {/* Error / Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}
            {message && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-500">{message}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className={cn(
                "w-full py-2.5 rounded-lg font-semibold text-sm transition-all",
                "bg-simpod-mark text-simpod-dark hover:opacity-90",
                saving && "opacity-50 cursor-not-allowed"
              )}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </form>
        </section>

        {/* Preferences */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Preferences</h2>
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive updates about your learning progress</p>
              </div>
              <input
                type="checkbox"
                defaultChecked={true}
                className="w-5 h-5 rounded border-border"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Data Export</p>
                <p className="text-xs text-muted-foreground">Download your hotzones and transcripts</p>
              </div>
              <button className="px-3 py-1.5 rounded-lg text-xs bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
                Export
              </button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Danger Zone</h2>
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Sign Out</p>
              <p className="text-xs text-muted-foreground mb-4">Sign out from this device</p>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
