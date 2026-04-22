import React, { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { TrackPublication, Participant } from 'livekit-client'
import { theme } from '../theme/voltage'
// Track is NOT imported as a value — livekit-client uses DOMException and other browser
// APIs that crash in React Native at module load time. Use the string literal instead.

// Lazily resolved VideoView — @livekit/react-native requires native modules
// that are absent in Expo Go and would crash at startup if imported statically.
type VideoViewType = React.ComponentType<{ style: object; trackSid: string }>
let VideoViewResolved: VideoViewType | null = null
function useLazyVideoView(): VideoViewType | null {
  const [, forceUpdate] = useState(0)
  const loaded = useRef(false)
  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    import('@livekit/react-native')
      .then((m) => { VideoViewResolved = m.VideoView as VideoViewType; forceUpdate(n => n + 1) })
      .catch(() => {})
  }, [])
  return VideoViewResolved
}

interface ParticipantTileProps {
  participant: Participant
  videoPublication?: TrackPublication
  isSpeaking?: boolean
  isMuted?: boolean
}

function parseUsername(metadata: string | undefined, fallback: string): string {
  if (!metadata) return fallback.slice(0, 8)
  try {
    const parsed = JSON.parse(metadata) as { username?: string }
    return parsed.username ?? fallback.slice(0, 8)
  } catch {
    return fallback.slice(0, 8)
  }
}

export function ParticipantTile({
  participant,
  videoPublication,
  isSpeaking = false,
  isMuted = false,
}: ParticipantTileProps): React.ReactElement {
  const VideoView = useLazyVideoView()
  const hasVideo =
    VideoView !== null &&
    videoPublication?.isSubscribed === true &&
    videoPublication.track?.source === 'camera' // Track.Source.Camera = 'camera'

  const username = parseUsername(participant.metadata, participant.identity ?? '?')
  const initial = username.charAt(0).toUpperCase()

  return (
    <View style={[styles.tile, isSpeaking && styles.tileSpeaking]}>
      {hasVideo && videoPublication?.track && VideoView ? (
        <VideoView
          style={styles.video}
          trackSid={videoPublication.trackSid}
        />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      )}
      {isMuted && (
        <View style={styles.mutedBadge}>
          <Text style={styles.mutedIcon}>🔇</Text>
        </View>
      )}
      <View style={styles.nameTag}>
        <Text style={styles.nameText} numberOfLines={1}>
          {username}
        </Text>
        {isSpeaking && <View style={styles.speakingDot} />}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  tile: {
    width: 120,
    height: 140,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.color.surface,
    margin: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tileSpeaking: {
    borderColor: theme.color.accent,
  },
  video: {
    flex: 1,
  },
  avatar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surfaceAlt,
  },
  avatarText: {
    fontSize: 40,
    color: theme.color.muted,
    fontFamily: theme.font.displayBold,
  },
  nameTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.color.overlay,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nameText: {
    flex: 1,
    fontSize: 12,
    color: theme.color.ink,
    fontFamily: theme.font.bodySemibold,
  },
  speakingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.color.accent,
  },
  mutedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: theme.color.overlaySoft,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  mutedIcon: {
    fontSize: 11,
  },
})
