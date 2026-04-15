import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { createRoom, submitQuestion } from '../../lib/api'

const MAX_SPEAKERS_OPTIONS = [2, 3, 4] as const
type MaxSpeakers = (typeof MAX_SPEAKERS_OPTIONS)[number]

export default function CreateScreen(): React.ReactElement {
  const { questionId, questionContent } = useLocalSearchParams<{ questionId?: string; questionContent?: string }>()
  const [questionPrompt, setQuestionPrompt] = useState(questionContent ?? '')
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState(questionContent ?? '')
  const [maxSpeakers, setMaxSpeakers] = useState<MaxSpeakers>(2)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const hasSelectedQuestion = Boolean(questionId)

  const questionError = !hasSelectedQuestion && questionPrompt.trim().length > 0 && questionPrompt.trim().length < 10
    ? 'Question must be at least 10 characters'
    : null
  const titleError = title.trim().length > 0 && title.trim().length < 3
    ? 'Title must be at least 3 characters'
    : null
  const topicError = topic.trim().length > 0 && topic.trim().length < 10
    ? 'Topic must be at least 10 characters'
    : null
  const canSubmit = title.trim().length >= 3
    && topic.trim().length >= 10
    && (hasSelectedQuestion || questionPrompt.trim().length >= 10)
    && !loading

  const handleCreate = async (): Promise<void> => {
    if (!canSubmit) return
    setLoading(true)
    try {
      let linkedQuestionId = questionId
      if (!linkedQuestionId) {
        const question = await submitQuestion(questionPrompt.trim())
        linkedQuestionId = question.id
      }

      const room = await createRoom({
        title: title.trim(),
        topic: topic.trim(),
        max_speakers: maxSpeakers,
        question_id: linkedQuestionId,
      })
      router.replace(`/room/${room.id}`)
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.helperText}>
            Every debate room must link to a question. Pick one from the Questions tab or create a new one here.
          </Text>

          {hasSelectedQuestion ? (
            <View style={styles.questionCard}>
              <Text style={styles.questionCardLabel}>Linked question</Text>
              <Text style={styles.questionCardContent}>{questionContent}</Text>
              <Pressable onPress={() => router.push('/questions')}>
                <Text style={styles.questionCardAction}>Choose a different question</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Question prompt</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline, questionError ? styles.inputError : null]}
                value={questionPrompt}
                onChangeText={setQuestionPrompt}
                placeholder="What is the underlying question this debate room is about?"
                placeholderTextColor="#6b7280"
                multiline
                numberOfLines={3}
                maxLength={300}
                editable={!loading}
                textAlignVertical="top"
              />
              {questionError && <Text style={styles.fieldError}>{questionError}</Text>}
              <Text style={styles.charCount}>{questionPrompt.length}/300</Text>
            </>
          )}

          <Text style={styles.sectionLabel}>Room title</Text>
          <TextInput
            style={[styles.input, titleError ? styles.inputError : null]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Should AI be regulated?"
            placeholderTextColor="#6b7280"
            maxLength={100}
            editable={!loading}
          />
          {titleError && <Text style={styles.fieldError}>{titleError}</Text>}
          <Text style={styles.charCount}>{title.length}/100</Text>

          <Text style={styles.sectionLabel}>Debate topic / motion</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline, topicError ? styles.inputError : null]}
            value={topic}
            onChangeText={setTopic}
            placeholder="Describe the motion or question being debated…"
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={4}
            maxLength={500}
            editable={!loading}
            textAlignVertical="top"
          />
          {topicError && <Text style={styles.fieldError}>{topicError}</Text>}
          <Text style={styles.charCount}>{topic.length}/500</Text>

          <Text style={styles.sectionLabel}>Max speakers</Text>
          <View style={styles.speakerRow}>
            {MAX_SPEAKERS_OPTIONS.map((n) => (
              <Pressable
                key={n}
                style={[styles.speakerOption, maxSpeakers === n && styles.speakerOptionSelected]}
                onPress={() => setMaxSpeakers(n)}
                disabled={loading}
              >
                <Text
                  style={[styles.speakerOptionText, maxSpeakers === n && styles.speakerOptionTextSelected]}
                >
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.createButton,
              !canSubmit && styles.createButtonDisabled,
              pressed && canSubmit && styles.createButtonPressed,
            ]}
            onPress={handleCreate}
            disabled={!canSubmit}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Create debate room</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111827',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  helperText: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 20,
  },
  questionCard: {
    marginTop: 20,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 16,
    gap: 8,
  },
  questionCardLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  questionCardContent: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  questionCardAction: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d5db',
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: '#1f2937',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    color: '#f9fafb',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  fieldError: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  charCount: {
    color: '#6b7280',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  speakerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  speakerOption: {
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
  },
  speakerOptionSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#312e81',
  },
  speakerOptionText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#9ca3af',
  },
  speakerOptionTextSelected: {
    color: '#f9fafb',
  },
  createButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonPressed: {
    opacity: 0.85,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
