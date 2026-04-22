import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RoomCard } from '../../components/RoomCard'
import { listRooms } from '../../lib/api'
import type { Room } from '@debate-app/shared'
import { textStyles, theme } from '../../theme/voltage'

export default function HomeScreen(): React.ReactElement {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.color.pro} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RoomCard
            room={item}
            onPress={() => router.push(`/room/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.color.pro}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No debates yet</Text>
            <Text style={styles.emptyBody}>Be the first — tap Create to start one.</Text>
          </View>
        }
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
  errorBanner: {
    backgroundColor: theme.color.dangerSurface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  errorText: {
    ...textStyles.bodySM,
    color: theme.color.con,
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing['2xl'],
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
    textAlign: 'center',
    ...textStyles.bodySM,
  },
})
