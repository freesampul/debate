import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getVoteCounts, castVote } from '../lib/api'
import type { VoteCounts, VoteSide } from '@debate-app/shared'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface VotesState {
  counts: VoteCounts
  userVote: VoteSide | null
  loading: boolean
  vote: (side: VoteSide) => Promise<void>
}

const EMPTY_COUNTS: VoteCounts = { for: 0, against: 0, total: 0 }

export function useVotes(roomId: string, userId: string | null): VotesState {
  const [counts, setCounts] = useState<VoteCounts>(EMPTY_COUNTS)
  const [userVote, setUserVote] = useState<VoteSide | null>(null)
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    setLoading(true)

    // Fetch initial counts
    getVoteCounts(roomId)
      .then(setCounts)
      .catch(() => setCounts(EMPTY_COUNTS))
      .finally(() => setLoading(false))

    // Fetch current user's vote if authenticated
    if (userId) {
      supabase
        .from('votes')
        .select('side')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setUserVote(data.side as VoteSide)
        })
    }

    // Subscribe to vote changes and recompute counts
    const channel = supabase
      .channel(`votes:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
        () => {
          // Re-fetch counts on any vote change
          getVoteCounts(roomId)
            .then(setCounts)
            .catch(() => {
              // Silently ignore — counts may be slightly stale
            })
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [roomId, userId])

  const vote = async (side: VoteSide): Promise<void> => {
    await castVote(roomId, side)
    setUserVote(side)
    // Optimistically update — realtime will reconcile
    setCounts((prev) => {
      const next = { ...prev }
      if (userVote === 'for') next.for = Math.max(0, next.for - 1)
      if (userVote === 'against') next.against = Math.max(0, next.against - 1)
      if (side === 'for') next.for += 1
      if (side === 'against') next.against += 1
      next.total = next.for + next.against
      return next
    })
  }

  return { counts, userVote, loading, vote }
}
