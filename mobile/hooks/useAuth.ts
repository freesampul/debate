import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  session: Session | null
  loading: boolean
}

// Dev bypass: when EXPO_PUBLIC_DEV_BYPASS=true, the app still tries to use a
// real Supabase session first. The fake dev-token fallback is only used if there
// is no real session — this way existing rooms/data created under your real account
// remain accessible once you've signed in at least once.
const DEV_BYPASS = process.env.EXPO_PUBLIC_DEV_BYPASS === 'true'

const DEV_FALLBACK_SESSION: Session = {
  user: {
    id: 'a0df7ecd-d580-426a-8b65-ff7d0ec5b400',
    email: 'dev@debate.local',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  },
  access_token: 'dev-token',
  refresh_token: 'dev-refresh',
  expires_in: 9999999,
  expires_at: 9999999,
  token_type: 'bearer',
} as unknown as Session

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth
      .getSession()
      .then((result) => {
        const s = result?.data?.session ?? null
        // If no real session and dev bypass is on, use the fake dev session
        setSession(s ?? (DEV_BYPASS ? DEV_FALLBACK_SESSION : null))
        setLoading(false)
      })
      .catch(() => {
        setSession(DEV_BYPASS ? DEV_FALLBACK_SESSION : null)
        setLoading(false)
      })

    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      // If signed out and dev bypass is on, keep the dev session
      setSession(s ?? (DEV_BYPASS ? DEV_FALLBACK_SESSION : null))
    })

    return () => {
      data?.subscription?.unsubscribe()
    }
  }, [])

  return { session, loading }
}
