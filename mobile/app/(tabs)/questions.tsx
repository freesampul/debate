import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import type { Question } from '@debate-app/shared'
import { VButton, VPill } from '../../components/voltage'
import { useAuth } from '../../hooks/useAuth'
import { getQuestion, listQuestions, submitQuestion, voteQuestion } from '../../lib/api'
import { textStyles, theme } from '../../theme/voltage'

export default function QuestionsScreen(): React.ReactElement {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { session } = useAuth()
  const router = useRouter()

  const fetchQuestions = useCallback(async (): Promise<void> => {
    try {
      const data = await listQuestions()
      setQuestions(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions')
    }
  }, [])

  useEffect(() => {
    fetchQuestions().finally(() => setLoading(false))
  }, [fetchQuestions])

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true)
    await fetchQuestions()
    setRefreshing(false)
  }, [fetchQuestions])

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => b.vote_count - a.vote_count),
    [questions],
  )

  const handleVote = useCallback(async (id: string): Promise<void> => {
    if (!session) {
      Alert.alert('Sign in required', 'You need to be signed in to vote.')
      return
    }
    try {
      const { voted } = await voteQuestion(id)
      setQuestions((prev) => prev.map((q) => (
        q.id === id ? { ...q, vote_count: q.vote_count + (voted ? 1 : -1) } : q
      )))
    } catch {
      Alert.alert('Error', 'Failed to vote. Try again.')
    }
  }, [session])

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!session) {
      Alert.alert('Sign in required', 'You need to be signed in to submit a take.')
      return
    }

    const trimmed = newQuestion.trim()
    if (trimmed.length < 10) {
      Alert.alert('Too short', 'Take must be at least 10 characters.')
      return
    }

    setSubmitting(true)
    try {
      const question = await submitQuestion(trimmed)
      setQuestions((prev) => [question, ...prev])
      setNewQuestion('')
      setModalVisible(false)
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit take.')
    } finally {
      setSubmitting(false)
    }
  }, [session, newQuestion])

  const handleOpenQuestion = useCallback((questionId: string): void => {
    router.push(`/question/${questionId}`)
  }, [router])

  const handleStartDebate = useCallback(async (question: Question): Promise<void> => {
    try {
      const detail = await getQuestion(question.id)
      if (detail.activeRoom) {
        router.push(`/room/${detail.activeRoom.id}`)
        return
      }

      router.push({
        pathname: '/create',
        params: { questionId: question.id, questionContent: question.content },
      })
    } catch {
      Alert.alert('Error', 'Failed to open this take. Try again.')
    }
  }, [router])

  const renderItem = useCallback(({ item, index }: { item: Question; index: number }) => {
    const liveRooms = item.status === 'in_debate' ? 1 : 0
    return (
      <View style={styles.takeCard}>
        <Text style={styles.rank}>{index + 1}</Text>
        <Pressable style={styles.takeBody} onPress={() => handleOpenQuestion(item.id)}>
          <Text style={styles.takeTitle} numberOfLines={3}>
            {item.content}
          </Text>
          <View style={styles.takeMeta}>
            {liveRooms > 0 ? (
              <VPill
                label={`${liveRooms} ROOM${liveRooms === 1 ? '' : 'S'} LIVE`}
                bg={theme.color.con}
                fg={theme.color.conInk}
                border={theme.color.con}
              />
            ) : (
              <VPill label="OPEN TAKE" />
            )}
          </View>
        </Pressable>
        <View style={styles.takeActions}>
          <Pressable style={styles.voteButton} onPress={() => { void handleVote(item.id) }}>
            <Text style={styles.voteButtonIcon}>♥</Text>
            <Text style={styles.voteButtonText}>{item.vote_count}</Text>
          </Pressable>
          <Pressable style={styles.playButton} onPress={() => { void handleStartDebate(item) }}>
            <Text style={styles.playButtonIcon}>{item.status === 'in_debate' ? '▶' : '+'}</Text>
            <Text style={styles.playButtonText}>{item.status === 'in_debate' ? 'Join' : 'Start'}</Text>
          </Pressable>
        </View>
      </View>
    )
  }, [handleOpenQuestion, handleStartDebate, handleVote])

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
        data={sortedQuestions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.cardGap} />}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.color.pro}
          />
        )}
        ListHeaderComponent={(
          <View style={styles.headerBlock}>
            <Text style={styles.kicker}>#HOTTAKES</Text>
            <Text style={styles.title}>Takes</Text>
            <Text style={styles.subtitle}>
              Prompts that already have heat. Open one to join a live room or launch your own.
            </Text>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing loud yet.</Text>
            <Text style={styles.emptyBody}>Tap the lime button and seed the first take.</Text>
          </View>
        )}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetKicker}>NEW TAKE</Text>
            <Text style={styles.sheetTitle}>Post a take.</Text>
            <Text style={styles.sheetSubtitle}>
              Phrase it like a room-ready motion. Sharp beats vague.
            </Text>
            <TextInput
              style={styles.sheetInput}
              value={newQuestion}
              onChangeText={setNewQuestion}
              placeholder="AI will do more harm than good in the next decade"
              placeholderTextColor={theme.color.dim}
              multiline
              numberOfLines={4}
              maxLength={300}
              autoFocus
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{newQuestion.length}/300</Text>
            <View style={styles.sheetButtons}>
              <VButton
                label="Cancel"
                variant="ghost"
                onPress={() => setModalVisible(false)}
                style={styles.sheetButton}
              />
              <VButton
                label={submitting ? 'Posting…' : 'Post take'}
                variant="primary"
                onPress={() => { void handleSubmit() }}
                disabled={newQuestion.trim().length < 10 || submitting}
                style={styles.sheetButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    gap: theme.spacing.md,
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
  takeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: theme.spacing.lg,
  },
  rank: {
    width: 28,
    fontFamily: theme.font.displayBold,
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: -0.8,
    color: theme.color.dim,
    textAlign: 'center',
  },
  takeBody: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  takeTitle: {
    ...textStyles.displayMD,
    fontSize: 22,
    lineHeight: 24,
  },
  takeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  takeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  voteButton: {
    minWidth: 72,
    height: 40,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.color.line,
    backgroundColor: theme.color.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  voteButtonIcon: {
    fontFamily: theme.font.displayBold,
    fontSize: 13,
    lineHeight: 14,
    color: theme.color.con,
  },
  voteButtonText: {
    color: theme.color.pro,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    fontFamily: theme.font.monoBold,
    textTransform: 'uppercase',
  },
  playButton: {
    minWidth: 82,
    height: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.pro,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  playButtonIcon: {
    color: theme.color.proInk,
    fontSize: 12,
    lineHeight: 14,
    fontFamily: theme.font.displayBold,
  },
  playButtonText: {
    color: theme.color.proInk,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    fontFamily: theme.font.monoBold,
    textTransform: 'uppercase',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.color.overlay,
  },
  sheet: {
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    backgroundColor: theme.color.surface,
    borderTopWidth: 1,
    borderColor: theme.color.line,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  sheetKicker: {
    ...textStyles.label,
    color: theme.color.pro,
  },
  sheetTitle: {
    ...textStyles.displayMD,
  },
  sheetSubtitle: {
    ...textStyles.bodySM,
  },
  sheetInput: {
    minHeight: 120,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.line,
    backgroundColor: theme.color.surfaceAlt,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    color: theme.color.ink,
    fontFamily: theme.font.body,
    fontSize: theme.type.body.size,
    lineHeight: theme.type.body.lineHeight,
  },
  charCount: {
    fontFamily: theme.font.monoMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    color: theme.color.dim,
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  sheetButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  sheetButton: {
    flex: 1,
  },
})
