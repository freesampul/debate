import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Room } from '@debate-app/shared'

interface RoomCardProps {
  room: Room
  onPress: () => void
}

const STATUS_COLORS: Record<Room['status'], string> = {
  waiting: '#f59e0b',
  live: '#22c55e',
  ended: '#6b7280',
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
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#f9fafb',
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topic: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontSize: 12,
    color: '#6b7280',
  },
})
