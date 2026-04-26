import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { Room } from '@debate-app/shared'
import { VLiveBadge, VPill, VRoomCard } from '../../components/voltage'
import { listRooms } from '../../lib/api'
import { textStyles, theme } from '../../theme/voltage'

type RoomFilter = 'all' | 'live' | 'waiting' | 'ended'

const FILTERS: Array<{ key: RoomFilter; label: string }> = [
  { key: 'all', label: 'ALL' },
  { key: 'live', label: 'LIVE' },
  { key: 'waiting', label: 'WAITING' },
  { key: 'ended', label: 'ENDED' },
]

function formatHost(hostId: string): string {
  return `@${hostId.slice(0, 8)}`
}

export default function HomeScreen(): React.ReactElement {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<RoomFilter>('all')
  const router = useRouter()

  const fetchRooms = useCallback(async (): Promise<void> => {
    try {
      const data = await listRooms()
      setRooms(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rooms')
    }
  }, [])

  useEffect(() => {
    fetchRooms().finally(() => setLoading(false))
  }, [fetchRooms])

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true)
    await fetchRooms()
    setRefreshing(false)
  }, [fetchRooms])

  const filteredRooms = useMemo(() => {
    if (filter === 'all') return rooms
    return rooms.filter((room) => room.status === filter)
  }, [filter, rooms])

  const featuredRoom = useMemo(() => {
    return filteredRooms.find((room) => room.status === 'live') ?? filteredRooms[0] ?? null
  }, [filteredRooms])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.color.pro} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VRoomCard
            room={item}
            onPress={() => router.push(`/room/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.cardGap} />}
        contentContainerStyle={styles.list}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.color.pro}
          />
        )}
        ListHeaderComponent={(
          <View style={styles.headerBlock}>
            <Text style={styles.kicker}>● LIVE NOW</Text>
            <Text style={styles.title}>Rooms</Text>
            <Text style={styles.subtitle}>
              Drop into live debates, track the split, and jump in when the room tilts.
            </Text>

            <View style={styles.filterRow}>
              {FILTERS.map((item) => {
                const selected = item.key === filter
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setFilter(item.key)}
                    style={[
                      styles.filterChip,
                      selected && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selected && styles.filterChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            {featuredRoom ? (
              <Pressable
                onPress={() => router.push(`/room/${featuredRoom.id}`)}
                style={styles.featuredCard}
              >
                <View style={styles.featuredTop}>
                  {featuredRoom.status === 'live' ? (
                    <VLiveBadge />
                  ) : (
                    <VPill
                      label={featuredRoom.status.toUpperCase()}
                      bg={featuredRoom.status === 'waiting' ? theme.color.warn : theme.color.surfaceAlt}
                      fg={featuredRoom.status === 'waiting' ? theme.color.conInk : theme.color.ink}
                      border={featuredRoom.status === 'waiting' ? theme.color.warn : theme.color.line}
                    />
                  )}
                  <VPill label={`${featuredRoom.max_speakers} SPOTS`} />
                </View>
                <Text style={styles.featuredTitle} numberOfLines={2}>
                  {featuredRoom.title}
                </Text>
                <Text style={styles.featuredTopic} numberOfLines={2}>
                  {featuredRoom.topic}
                </Text>
                <View style={styles.featuredFooter}>
                  <Text style={styles.featuredHost}>{formatHost(featuredRoom.host_id)}</Text>
                  <Text style={styles.featuredAction}>OPEN</Text>
                </View>
              </Pressable>
            ) : null}

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No rooms yet.</Text>
            <Text style={styles.emptyBody}>
              Start the first debate or switch filters if you are looking for a different state.
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.color.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.bg,
  },
  list: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 120,
  },
  headerBlock: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  kicker: {
    ...textStyles.label,
    color: theme.color.pro,
  },
  title: {
    ...textStyles.displayXL,
  },
  subtitle: {
    ...textStyles.bodySM,
    maxWidth: 320,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterChip: {
    minHeight: 32,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.color.line,
    backgroundColor: theme.color.surface,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: theme.color.ink,
    borderColor: theme.color.ink,
  },
  filterChipText: {
    fontFamily: theme.font.monoBold,
    fontSize: theme.type.tag.size,
    lineHeight: theme.type.tag.lineHeight,
    letterSpacing: theme.type.tag.letterSpacing,
    color: theme.color.muted,
    textTransform: 'uppercase',
  },
  filterChipTextActive: {
    color: theme.color.bg,
  },
  featuredCard: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    backgroundColor: theme.color.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.color.line,
    gap: theme.spacing.md,
  },
  featuredTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  featuredTitle: {
    ...textStyles.displayMD,
  },
  featuredTopic: {
    ...textStyles.body,
    color: theme.color.muted,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  featuredHost: {
    fontFamily: theme.font.monoMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    color: theme.color.dim,
    textTransform: 'uppercase',
  },
  featuredAction: {
    fontFamily: theme.font.monoBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    color: theme.color.accent,
    textTransform: 'uppercase',
  },
  errorBanner: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.dangerSurface,
    borderWidth: 1,
    borderColor: theme.color.danger,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  errorText: {
    ...textStyles.bodySM,
    color: theme.color.con,
  },
  cardGap: {
    height: theme.spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    ...textStyles.titleLG,
  },
  emptyBody: {
    ...textStyles.bodySM,
    maxWidth: 280,
    textAlign: 'center',
  },
})
