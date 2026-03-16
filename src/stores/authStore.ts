"use client"

import { create } from "zustand"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

interface AuthStore {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
  initialize: () => Promise<() => void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  signOut: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ user: null })
  },

  initialize: async () => {
    const supabase = createClient()

    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    set({ user: session?.user ?? null, loading: false })
    console.log('[AuthStore] Initialized, user:', session?.user?.email ?? 'none')

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[AuthStore] Auth state changed:', _event, session?.user?.email ?? 'none')
      set({ user: session?.user ?? null, loading: false })
    })

    // Return unsubscribe function
    return () => subscription.unsubscribe()
  },
}))
