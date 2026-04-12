import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { getParticipants } from '../lib/api'
import type { RoomParticipantWithUser } from '@debate-app/shared'

interface UseParticipantsReturn {
  participants: RoomParticipantWithUser[]
  speakers: RoomParticipantWithUser[]
  loading: boolean
}

export function useParticipants(roomId: string): UseParticipantsReturn {
  const [participants, setParticipants] = useState<RoomParticipantWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const fetchParticipants = useCallback(async () => {
    try {
      const data = await getParticipants(roomId)
      setParticipants(data)
    } catch {
      // Non-fatal — participant list may just be empty
    }
  }, [roomId])

  useEffect(() => {
    setLoading(true)
    fetchParticipants().finally(() => setLoading(false))

    // Subscribe to room_participants changes so the list stays live
    // (requires migration 002 to have run, adding room_participants to realtime)
    const channel = supabase
      .channel(`participants:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // Re-fetch on any join/leave — simpler than merging diffs
          void fetchParticipants()
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
  }, [roomId, fetchParticipants])

  const speakers = participants.filter((p) => p.role === 'speaker')

  return { participants, speakers, loading }
}
