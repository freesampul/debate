import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { VButton, VPill, VRoomCard } from '../../components/voltage'
import { getQuestion } from '../../lib/api'
import type { QuestionDetails } from '../../lib/api'
import { textStyles, theme } from '../../theme/voltage'

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

  const handleBackPress = useCallback((): void => {
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.replace('/(tabs)/questions')
  }, [router])

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
        <ActivityIndicator size="large" color={theme.color.pro} />
      </View>
    )
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? 'Question not found'}</Text>
          <VButton label="Go back" variant="ghost" onPress={handleBackPress} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <FlatList
        data={data.liveRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VRoomCard room={item} onPress={() => router.push(`/room/${item.id}`)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.cardGap} />}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.color.pro}
          />
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={(
          <View style={styles.header}>
            <View style={styles.topBar}>
              <VButton label="Back" variant="ghost" size="sm" onPress={handleBackPress} />
            </View>

            <Text style={styles.kicker}>QUESTION</Text>
            <Text style={styles.questionText}>{data.question.content}</Text>
            <Text style={styles.subtitle}>
              Open a live room now or spin up a fresh one from this prompt.
            </Text>

            <View style={styles.metaRow}>
              <VPill label={`${data.question.vote_count} VOTES`} />
              <VPill
                label={`${data.liveRooms.length} LIVE ROOM${data.liveRooms.length === 1 ? '' : 'S'}`}
                bg={data.liveRooms.length > 0 ? theme.color.con : theme.color.surfaceAlt}
                fg={data.liveRooms.length > 0 ? theme.color.conInk : theme.color.muted}
                border={data.liveRooms.length > 0 ? theme.color.con : theme.color.line}
              />
            </View>

            <VButton
              label={data.activeRoom ? 'Join most recent active room' : 'Start a room from this question'}
              variant={data.activeRoom ? 'pro' : 'primary'}
              onPress={handlePrimaryAction}
            />

            {data.recentRooms.length > 0 ? (
              <View style={styles.recentSection}>
                <Text style={styles.sectionTitle}>Recent rooms</Text>
                <Text style={styles.sectionBody}>
                  Jump back into recent debates tied to this question.
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentCardsRow}>
                  {data.recentRooms.map((room) => (
                    <View key={room.id} style={styles.recentCardWrap}>
                      <VRoomCard room={room} onPress={() => router.push(`/room/${room.id}`)} />
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Live rooms</Text>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No live rooms yet.</Text>
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
    backgroundColor: theme.color.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.bg,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  list: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 32,
  },
  header: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  kicker: {
    ...textStyles.label,
    color: theme.color.pro,
  },
  questionText: {
    ...textStyles.displayMD,
  },
  subtitle: {
    ...textStyles.body,
    color: theme.color.muted,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    ...textStyles.titleLG,
  },
  sectionBody: {
    ...textStyles.bodySM,
    color: theme.color.muted,
  },
  recentSection: {
    gap: theme.spacing.md,
  },
  recentCardsRow: {
    paddingRight: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  recentCardWrap: {
    width: 300,
  },
  cardGap: {
    height: theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    ...textStyles.titleLG,
  },
  emptyBody: {
    ...textStyles.bodySM,
    textAlign: 'center',
    maxWidth: 280,
  },
  errorText: {
    ...textStyles.body,
    textAlign: 'center',
    color: theme.color.con,
  },
})
