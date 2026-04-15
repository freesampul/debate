import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RoomCard } from '../../components/RoomCard'
import { getQuestion } from '../../lib/api'
import type { QuestionDetails } from '../../lib/api'

export default function QuestionDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<QuestionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchQuestion = useCallback(async (): Promise<void> => {
    try {
      const next = await getQuestion(id)
      setData(next)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question')
    }
  }, [id])

  useEffect(() => {
    fetchQuestion().finally(() => setLoading(false))
  }, [fetchQuestion])

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true)
    await fetchQuestion()
    setRefreshing(false)
  }, [fetchQuestion])

  const handlePrimaryAction = useCallback((): void => {
    if (!data) return
    if (data.activeRoom) {
      router.push(`/room/${data.activeRoom.id}`)
      return
    }
    router.push({
      pathname: '/create',
      params: {
        questionId: data.question.id,
        questionContent: data.question.content,
      },
    })
  }, [data, router])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? 'Question not found'}</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={data.liveRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RoomCard room={item} onPress={() => router.push(`/room/${item.id}`)} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4f46e5" />
        }
        contentContainerStyle={styles.list}
        ListHeaderComponent={(
          <View style={styles.header}>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.backLink}>Back</Text>
            </Pressable>
            <Text style={styles.kicker}>Question</Text>
            <Text style={styles.questionText}>{data.question.content}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{data.question.vote_count} votes</Text>
              <Text style={styles.metaText}>
                {data.liveRooms.length} active room{data.liveRooms.length === 1 ? '' : 's'}
              </Text>
            </View>
            <Pressable style={styles.primaryButton} onPress={handlePrimaryAction}>
              <Text style={styles.primaryButtonText}>
                {data.activeRoom ? 'Join most recent active room' : 'Start a room from this question'}
              </Text>
            </Pressable>

            {data.recentRooms.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={styles.sectionTitle}>Recent rooms</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
                  {data.recentRooms.map((room) => (
                    <Pressable key={room.id} style={styles.recentCard} onPress={() => router.push(`/room/${room.id}`)}>
                      <Text style={styles.recentCardStatus}>{room.status.toUpperCase()}</Text>
                      <Text style={styles.recentCardTitle} numberOfLines={2}>{room.title}</Text>
                      <Text style={styles.recentCardBody} numberOfLines={3}>{room.topic}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.sectionTitle}>Active rooms</Text>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No active rooms yet</Text>
            <Text style={styles.emptyBody}>Start the first debate from this question.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111827',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    padding: 24,
    gap: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backLink: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '600',
  },
  kicker: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  questionText: {
    color: '#f9fafb',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '700',
  },
  recentSection: {
    gap: 10,
  },
  recentScroll: {
    paddingRight: 8,
    gap: 12,
  },
  recentCard: {
    width: 220,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 14,
    gap: 8,
  },
  recentCardStatus: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  recentCardTitle: {
    color: '#f9fafb',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  recentCardBody: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyBody: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 15,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
})
