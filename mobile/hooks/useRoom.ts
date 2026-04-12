import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getRoom } from '../lib/api'
import type { Room, Message } from '@debate-app/shared'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface RoomState {
  room: Room | null
  messages: Message[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useRoom(roomId: string): RoomState {
  const [room, setRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const fetchRoom = useCallback(async () => {
    try {
      const data = await getRoom(roomId)
      setRoom(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load room')
    }
  }, [roomId])

  useEffect(() => {
    setLoading(true)

    // Load initial messages
    supabase
      .from('messages')
      .select('id, room_id, user_id, content, filtered_content, moderation_status, report_count, removed_at, created_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data, error: fetchError }) => {
        if (!fetchError && data) {
          setMessages(data as Message[])
        }
      })

    fetchRoom().finally(() => setLoading(false))

    // Subscribe to room status changes
    const roomChannel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          setRoom((prev) => (prev ? { ...prev, ...(payload.new as Partial<Room>) } : null))
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) => prev.map((message) => (
            message.id === payload.new.id ? { ...message, ...(payload.new as Partial<Message>) } : message
          )))
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        },
      )
      .subscribe()

    channelRef.current = roomChannel

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [roomId, fetchRoom])

  return { room, messages, loading, error, refresh: fetchRoom }
}
