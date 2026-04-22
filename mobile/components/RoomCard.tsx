import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Room } from '@debate-app/shared'
import { textStyles, theme } from '../theme/voltage'

interface RoomCardProps {
  room: Room
  onPress: () => void
}

const STATUS_COLORS: Record<Room['status'], string> = {
  waiting: theme.color.warn,
  live: theme.color.live,
  ended: theme.color.dim,
}

const STATUS_LABELS: Record<Room['status'], string> = {
  waiting: 'Waiting',
  live: 'Live',
  ended: 'Ended',
}

export function RoomCard({ room, onPress }: RoomCardProps): React.ReactElement {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {room.title}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[room.status] }]}>
          <Text style={styles.statusText}>{STATUS_LABELS[room.status]}</Text>
        </View>
      </View>
      <Text style={styles.topic} numberOfLines={3}>
        {room.topic}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.meta}>Up to {room.max_speakers} speakers</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.color.line,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: theme.font.displayBold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.2,
    color: theme.color.ink,
  },
  statusBadge: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    flexShrink: 0,
  },
  statusText: {
    ...textStyles.tag,
    color: theme.color.proInk,
  },
  topic: {
    marginBottom: 12,
    ...textStyles.bodySM,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontFamily: theme.font.monoMedium,
    fontSize: 11,
    letterSpacing: 0.6,
    color: theme.color.dim,
    textTransform: 'uppercase',
  },
})
