"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Mail, Lock, Eye, EyeOff, Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const supabase = createClient()

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage("Check your email for the confirmation link!")
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        console.log('[Auth] Login successful, redirecting...')
        router.push("/")
        router.refresh()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed"
      console.error('[Auth] Error:', message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Flame size={28} className="text-simpod-mark" />
          <span className="text-2xl font-bold text-foreground">Simpod</span>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          {/* Toggle */}
          <div className="flex mb-6 bg-secondary rounded-lg p-1">
            <button
              onClick={() => { setMode("login"); setError(null); setMessage(null) }}
              className={cn(
                "flex-1 py-2 rounded-md text-sm font-medium transition-all",
                mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("signup"); setError(null); setMessage(null) }}
              className={cn(
                "flex-1 py-2 rounded-md text-sm font-medium transition-all",
                mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className={cn(
                    "w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary/50 border border-border",
                    "text-sm text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:border-simpod-mark/50"
                  )}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                  className={cn(
                    "w-full pl-9 pr-10 py-2.5 rounded-lg bg-secondary/50 border border-border",
                    "text-sm text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:border-simpod-mark/50"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error / Message */}
            {error && (
              <p className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
            )}
            {message && (
              <p className="text-xs text-green-500 bg-green-500/10 rounded-lg px-3 py-2">{message}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-2.5 rounded-lg font-semibold text-sm transition-all",
                "bg-simpod-mark text-simpod-dark hover:opacity-90",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                mode === "login" ? "Sign In" : "Create Account"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          <Link href="/" className="hover:text-foreground transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
