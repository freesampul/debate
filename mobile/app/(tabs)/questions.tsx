import React, { useCallback, useEffect, useState } from 'react'
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { getQuestion, listQuestions, submitQuestion, voteQuestion } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import type { Question } from '@debate-app/shared'

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
  const insets = useSafeAreaInsets()

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

  const handleVote = useCallback(async (id: string): Promise<void> => {
    if (!session) {
      Alert.alert('Sign in required', 'You need to be signed in to vote.')
      return
    }
    try {
      const { voted } = await voteQuestion(id)
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === id ? { ...q, vote_count: q.vote_count + (voted ? 1 : -1) } : q
        )
      )
    } catch {
      Alert.alert('Error', 'Failed to vote. Try again.')
    }
  }, [session])

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!session) {
      Alert.alert('Sign in required', 'You need to be signed in to submit a question.')
      return
    }
    const trimmed = newQuestion.trim()
    if (trimmed.length < 10) {
      Alert.alert('Too short', 'Question must be at least 10 characters.')
      return
    }
    setSubmitting(true)
    try {
      const q = await submitQuestion(trimmed)
      setQuestions((prev) => [q, ...prev])
      setNewQuestion('')
      setModalVisible(false)
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit question.')
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
      Alert.alert('Error', 'Failed to open this question. Try again.')
    }
  }, [router])

  const renderItem = useCallback(({ item }: { item: Question }) => (
    <View style={styles.card}>
      <Pressable style={styles.cardBody} onPress={() => handleOpenQuestion(item.id)}>
        {item.status === 'in_debate' && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        )}
        <Text style={styles.questionText}>{item.content}</Text>
      </Pressable>
      <View style={styles.cardFooter}>
        <Pressable style={styles.voteButton} onPress={() => { void handleVote(item.id) }}>
          <Text style={styles.voteIcon}>▲</Text>
          <Text style={styles.voteCount}>{item.vote_count}</Text>
        </Pressable>
        <Pressable style={styles.debateButton} onPress={() => { void handleStartDebate(item) }}>
          <Text style={styles.debateButtonText}>
            {item.status === 'in_debate' ? 'Join debate' : 'Start debate'}
          </Text>
        </Pressable>
      </View>
    </View>
  ), [handleOpenQuestion, handleVote, handleStartDebate])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
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
        data={questions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4f46e5" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No questions yet</Text>
            <Text style={styles.emptyBody}>Be first — tap + to submit one.</Text>
          </View>
        }
      />

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      {/* Submit modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.sheetTitle}>Ask a question</Text>
          <Text style={styles.sheetSubtitle}>Something worth debating — a motion, a take, a controversy.</Text>
          <TextInput
            style={styles.sheetInput}
            value={newQuestion}
            onChangeText={setNewQuestion}
            placeholder="e.g. AI will do more harm than good in the next decade"
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={3}
            maxLength={300}
            autoFocus
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{newQuestion.length}/300</Text>
          <View style={styles.sheetButtons}>
            <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.submitButton, (newQuestion.trim().length < 10 || submitting) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={newQuestion.trim().length < 10 || submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.submitButtonText}>Submit</Text>
              }
            </Pressable>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' },
  errorBanner: { backgroundColor: '#7f1d1d', paddingHorizontal: 16, paddingVertical: 10 },
  errorText: { color: '#fca5a5', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardBody: { padding: 16, gap: 8 },
  liveBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#22c55e',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  liveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  questionText: { fontSize: 16, color: '#f9fafb', fontWeight: '600', lineHeight: 22 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  voteButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  voteIcon: { color: '#4f46e5', fontSize: 14 },
  voteCount: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  debateButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  debateButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f9fafb' },
  emptyBody: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 12,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: '#f9fafb' },
  sheetSubtitle: { fontSize: 14, color: '#9ca3af', lineHeight: 20 },
  sheetInput: {
    backgroundColor: '#111827',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    color: '#f9fafb',
    fontSize: 15,
    padding: 14,
    minHeight: 90,
  },
  charCount: { color: '#6b7280', fontSize: 11, textAlign: 'right' },
  sheetButtons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
  },
  cancelButtonText: { color: '#9ca3af', fontWeight: '600' },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#fff', fontWeight: '700' },
})
