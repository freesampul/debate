import { useCallback, useEffect, useRef, useState } from 'react'
import type { TrackPublication } from 'livekit-client'
import { joinRoom, leaveRoom, getLiveKitToken } from '../lib/api'
import { connectToRoom, disconnectFromRoom } from '../lib/livekit'
import type { ParticipantRole } from '@debate-app/shared'

export interface LKParticipantInfo {
  identity: string      // user UUID — matches Supabase user_id
  username: string      // from token metadata
  avatar_url: string | null
  isSpeaking: boolean
  isMuted: boolean
  isLocal: boolean
  canSpeak: boolean     // has publish permission (speakers only)
  videoPublication: TrackPublication | undefined
}

interface UseLiveKitRoomReturn {
  connected: boolean
  connecting: boolean
  participants: LKParticipantInfo[]
  activeSpeakerIds: string[]
  isMuted: boolean
  myRole: ParticipantRole | null
  connect: (role: ParticipantRole) => Promise<void>
  disconnect: () => Promise<void>
  toggleMute: () => Promise<void>
}

function parseMetadata(raw: string | undefined): { username?: string; avatar_url?: string | null } {
  if (!raw) return {}
  try { return JSON.parse(raw) as { username?: string; avatar_url?: string | null } }
  catch { return {} }
}

export function useLiveKitRoom(roomId: string): UseLiveKitRoomReturn {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [participants, setParticipants] = useState<LKParticipantInfo[]>([])
  const [activeSpeakerIds, setActiveSpeakerIds] = useState<string[]>([])
  const [isMuted, setIsMuted] = useState(true)
  const [myRole, setMyRole] = useState<ParticipantRole | null>(null)

  // Store the LiveKit Room object in a ref so event handlers always have the latest
  type LKRoom = Awaited<ReturnType<typeof connectToRoom>>
  const roomRef = useRef<LKRoom | null>(null)
  // Separate ref for active speaker set so rebuildParticipants reads latest without stale closure
  const activeSpeakersRef = useRef(new Set<string>())

  const rebuildParticipants = useCallback(() => {
    const room = roomRef.current
    if (!room) return

    const allParticipants: LKParticipantInfo[] = []

    // Local participant first
    const local = room.localParticipant
    const localMeta = parseMetadata(local.metadata)
    const localVideoPublication = Array.from(local.trackPublications.values()).find(
      (pub) => pub.kind === 'video'
    )
    allParticipants.push({
      identity: local.identity,
      username: localMeta.username ?? local.identity.slice(0, 8),
      avatar_url: localMeta.avatar_url ?? null,
      isSpeaking: activeSpeakersRef.current.has(local.identity),
      isMuted: !local.isMicrophoneEnabled,
      isLocal: true,
      canSpeak: local.permissions?.canPublish ?? false,
      videoPublication: localVideoPublication,
    })

    // Remote participants
    for (const remote of room.remoteParticipants.values()) {
      const meta = parseMetadata(remote.metadata)
      const videoPublication = Array.from(remote.trackPublications.values()).find(
        (pub) => pub.kind === 'video'
      )
      allParticipants.push({
        identity: remote.identity,
        username: meta.username ?? remote.identity.slice(0, 8),
        avatar_url: meta.avatar_url ?? null,
        isSpeaking: activeSpeakersRef.current.has(remote.identity),
        isMuted: !remote.isMicrophoneEnabled,
        isLocal: false,
        canSpeak: remote.permissions?.canPublish ?? false,
        videoPublication,
      })
    }

    setParticipants(allParticipants)
  }, [roomId])

  const connect = useCallback(async (role: ParticipantRole) => {
    setConnecting(true)
    try {
      // Record participation in our DB first
      await joinRoom(roomId, role)

      // Get a scoped LiveKit token with our username embedded as metadata
      const { token, livekitUrl } = await getLiveKitToken(roomId)

      // Connect to the LiveKit room (deferred native module import)
      const room = await connectToRoom(token, livekitUrl)
      roomRef.current = room

      // Import RoomEvent after native modules are loaded
      const { RoomEvent } = await import('livekit-client')

      room.on(RoomEvent.ParticipantConnected, rebuildParticipants)
      room.on(RoomEvent.ParticipantDisconnected, rebuildParticipants)
      room.on(RoomEvent.TrackPublished, rebuildParticipants)
      room.on(RoomEvent.TrackUnpublished, rebuildParticipants)
      room.on(RoomEvent.TrackSubscribed, rebuildParticipants)
      room.on(RoomEvent.TrackUnsubscribed, rebuildParticipants)
      room.on(RoomEvent.LocalTrackPublished, rebuildParticipants)
      room.on(RoomEvent.LocalTrackUnpublished, rebuildParticipants)
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const ids = speakers.map((s) => s.identity)
        activeSpeakersRef.current = new Set(ids)
        setActiveSpeakerIds(ids)
        rebuildParticipants()
      })

      // Speakers start with mic enabled; audience is listen-only
      if (role === 'speaker') {
        await room.localParticipant.setMicrophoneEnabled(true)
        setIsMuted(false)
      }

      rebuildParticipants()
      setMyRole(role)
      setConnected(true)
    } finally {
      setConnecting(false)
    }
  }, [roomId, rebuildParticipants])

  const disconnect = useCallback(async () => {
    const room = roomRef.current
    if (room) {
      await disconnectFromRoom(room)
      roomRef.current = null
    }
    // Best-effort leave — ignore errors (e.g. room already ended)
    try { await leaveRoom(roomId) } catch { /* intentional */ }

    setConnected(false)
    setMyRole(null)
    setParticipants([])
    setActiveSpeakerIds([])
    activeSpeakersRef.current = new Set()
    setIsMuted(true)
  }, [roomId])

  const toggleMute = useCallback(async () => {
    const room = roomRef.current
    if (!room || myRole !== 'speaker') return
    const newMuted = !isMuted
    await room.localParticipant.setMicrophoneEnabled(!newMuted)
    setIsMuted(newMuted)
    rebuildParticipants()
  }, [isMuted, myRole, rebuildParticipants])

  // Disconnect on unmount (e.g. navigating away without pressing Leave)
  useEffect(() => {
    return () => {
      const room = roomRef.current
      if (room) {
        disconnectFromRoom(room).catch(() => {})
        roomRef.current = null
      }
      leaveRoom(roomId).catch(() => {})
    }
  }, [])

  return {
    connected,
    connecting,
    participants,
    activeSpeakerIds,
    isMuted,
    myRole,
    connect,
    disconnect,
    toggleMute,
  }
}
