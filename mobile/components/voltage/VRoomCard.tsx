import React from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import type { Room } from '@debate-app/shared'
import { textStyles, theme } from '../../theme/voltage'
import { usePressScale } from './usePressScale'
import { VLiveBadge } from './VLiveBadge'
import { VMeter } from './VMeter'
import { VPill } from './VPill'

export interface VRoomCardProps {
  room: Room
  onPress: () => void
}

function getStatusPill(room: Room): React.ReactElement {
  if (room.status === 'live') return <VLiveBadge />
  if (room.status === 'waiting') {
    return <VPill label="WAITING" bg={theme.color.warn} fg={theme.color.conInk} border={theme.color.warn} />
  }

  return <VPill label="ENDED" bg={theme.color.surfaceAlt} fg={theme.color.dim} border={theme.color.line} />
}

function getHandle(hostId: string): string {
  return `@${hostId.slice(0, 8)}`
}

function deriveForPct(room: Room): number {
  const seed = [...room.id].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return 28 + (seed % 45)
}

export function VRoomCard({ room, onPress }: VRoomCardProps): React.ReactElement {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale({
    pressedOpacity: 1,
    pressedScale: 0.985,
  })

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={styles.meterSlot}>
          <VMeter forPct={deriveForPct(room)} total={room.max_speakers} orientation="v" />
        </View>
        <View style={styles.body}>
          <View style={styles.badgeRow}>
            {getStatusPill(room)}
            <VPill label={`${room.max_speakers} SPOTS`} />
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {room.title}
          </Text>
          <Text style={styles.topic} numberOfLines={2}>
            {room.topic}
          </Text>
          <Text style={styles.host}>{getHandle(room.host_id)}</Text>
        </View>
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  meterSlot: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  title: {
    ...textStyles.displayMD,
    fontSize: 22,
    lineHeight: 24,
  },
  topic: {
    ...textStyles.bodySM,
    color: theme.color.muted,
  },
  host: {
    fontFamily: theme.font.monoMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    color: theme.color.dim,
    textTransform: 'uppercase',
  },
})
