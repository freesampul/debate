import React, { useCallback, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoom } from '../../hooks/useRoom'
import { useVotes } from '../../hooks/useVotes'
import { useAuth } from '../../hooks/useAuth'
import { useParticipants } from '../../hooks/useParticipants'
import { useLiveKitRoom } from '../../hooks/useLiveKitRoom'
import {
  startRoom,
  endRoom,
  sendMessage,
  removeMessage,
  reportMessage,
  reportRoom,
  removeParticipant,
  banParticipant,
} from '../../lib/api'
import { VotingDial } from '../../components/VotingDial'
import { ChatMessage } from '../../components/ChatMessage'
import { ParticipantTile } from '../../components/ParticipantTile'
import type { Message, RoomParticipantWithUser } from '@debate-app/shared'

// Plain-object shim that satisfies ParticipantTile's Participant prop without
// importing livekit-client at the top level (which crashes in Expo Go / React Native
// because livekit-client accesses DOMException and other browser APIs at module load).
// The cast to `any` is intentional — Participant is used as a structural type here.
function dbParticipantToLKShim(p: { user_id: string; username: string }): any { // eslint-disable-line @typescript-eslint/no-explicit-any
  return {
    identity: p.user_id,
    metadata: JSON.stringify({ username: p.username }),
    isMicrophoneEnabled: false,
    permissions: { canPublish: true },
    trackPublications: new Map(),
  }
}

export default function RoomScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { session } = useAuth()
  const userId = session?.user.id ?? null

  const { room, messages, loading, error, refresh } = useRoom(id)
  const { counts, userVote, vote } = useVotes(id, userId)
  const { participants, speakers: dbSpeakers } = useParticipants(id)
  const lkRoom = useLiveKitRoom(id)

  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  const isHost = room?.host_id === userId
  const isLive = room?.status === 'live'
  const isWaiting = room?.status === 'waiting'
  const isEnded = room?.status === 'ended'
  const isSpeaker = lkRoom.myRole === 'speaker'

  // ─── Message sending ──────────────────────────────────────────────────────

  const handleSendMessage = useCallback(async (): Promise<void> => {
    const text = messageText.trim()
    if (!text || !userId) return
    setSending(true)
    try {
      await sendMessage(id, text)
      setMessageText('')
    } catch {
      Alert.alert('Error', 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }, [messageText, userId, id])

  // ─── Audio / room controls ────────────────────────────────────────────────

  /** Host: connect as speaker then transition the room to live */
  const handleStartRoom = useCallback(async (): Promise<void> => {
    try {
      // Connect the host as a speaker first so they're live before anyone else joins
      if (!lkRoom.connected) {
        await lkRoom.connect('speaker')
      }
      await startRoom(id)
      await refresh()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to start room.')
    }
  }, [id, lkRoom, refresh])

  const handleConnect = useCallback(async (role: 'speaker' | 'audience'): Promise<void> => {
    try {
      await lkRoom.connect(role)
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to join audio.')
    }
  }, [lkRoom])

  const handleDisconnect = useCallback(async (): Promise<void> => {
    try {
      await lkRoom.disconnect()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to leave audio.')
    }
  }, [lkRoom])

  const handleBackPress = useCallback((): void => {
    if (!lkRoom.connected) {
      router.back()
      return
    }

    Alert.alert(
      'Leave room?',
      'Going back will disconnect you from audio for this debate.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave room',
          style: 'destructive',
          onPress: async () => {
            try {
              await lkRoom.disconnect()
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to leave audio.')
              return
            }
            router.back()
          },
        },
      ],
    )
  }, [lkRoom, router])

  const handleEndRoom = useCallback((): void => {
    Alert.alert(
      'End debate',
      'This will end the debate for all participants. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End debate',
          style: 'destructive',
          onPress: async () => {
            try {
              await lkRoom.disconnect()
              await endRoom(id)
              await refresh()
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to end room.')
            }
          },
        },
      ],
    )
  }, [id, lkRoom, refresh])

  const handleRoomReport = useCallback((): void => {
    if (!room || !room.question_id) return
    const questionId = room.question_id
    const roomId = room.id
    Alert.alert(
      'Report room',
      'Report this room for harassment, spam, or harmful content?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report room',
          style: 'destructive',
          onPress: async () => {
            try {
              await reportRoom(questionId, roomId, 'harassment')
              Alert.alert('Reported', 'Thanks. Your report was submitted.')
            } catch {
              Alert.alert('Error', 'Failed to report this room.')
            }
          },
        },
      ],
    )
  }, [room])

  const handleMessagePress = useCallback((message: Message): void => {
    const actions: Array<{ text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }> = [
      {
        text: 'Report message',
        onPress: async () => {
          try {
            await reportMessage(id, message.id, 'harassment')
            Alert.alert('Reported', 'Thanks. Your report was submitted.')
          } catch {
            Alert.alert('Error', 'Failed to report this message.')
          }
        },
      },
    ]

    if (isHost && message.moderation_status !== 'removed') {
      actions.unshift({
        text: 'Remove message',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeMessage(id, message.id)
          } catch {
            Alert.alert('Error', 'Failed to remove this message.')
          }
        },
      })
    }

    actions.push({ text: 'Cancel', style: 'cancel' })
    Alert.alert('Message actions', 'Choose an action for this message.', actions)
  }, [id, isHost])

  const handleParticipantPress = useCallback((participant: RoomParticipantWithUser): void => {
    if (!isHost || participant.user_id === userId) {
      router.push(`/user/${participant.user_id}`)
      return
    }

    Alert.alert(
      participant.username,
      'Choose a moderation action.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove from room',
          onPress: async () => {
            try {
              await removeParticipant(id, participant.user_id, 'host_removed')
            } catch {
              Alert.alert('Error', 'Failed to remove this participant.')
            }
          },
        },
        {
          text: 'Ban from room',
          style: 'destructive',
          onPress: async () => {
            try {
              await banParticipant(id, participant.user_id, 'host_banned')
            } catch {
              Alert.alert('Error', 'Failed to ban this participant.')
            }
          },
        },
      ],
    )
  }, [id, isHost, router, userId])

  // ─── Loading / error states ───────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  if (error || !room) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? 'Room not found.'}</Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  // ─── Speaker strip data ───────────────────────────────────────────────────
  // When connected to LiveKit, use the live participant list (has speaking state).
  // When not connected, fall back to the DB participant list (no speaking state).
  const speakerTiles = lkRoom.connected
    ? lkRoom.participants.filter((p) => p.canSpeak)
    : dbSpeakers

  const statusColor = room.status === 'live' ? '#22c55e' : room.status === 'waiting' ? '#f59e0b' : '#6b7280'
  const statusLabel = room.status === 'live' ? 'Live' : room.status === 'waiting' ? 'Waiting' : 'Ended'
  const participantCount = participants.length
  const speakerCount = dbSpeakers.length
  const audienceCount = Math.max(0, participantCount - speakerCount)
  const connectionLabel = lkRoom.connecting
    ? 'Connecting to audio'
    : lkRoom.connected
      ? (isSpeaker ? (lkRoom.isMuted ? 'Connected as speaker (muted)' : 'Connected as speaker') : 'Connected as listener')
      : (isHost && isWaiting ? 'Host controls ready' : 'Not connected to audio')

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={88}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.topBar}>
            <Pressable onPress={handleBackPress} style={styles.topBarButton}>
              <Text style={styles.topBarButtonText}>Back</Text>
            </Pressable>
            {room.question_id ? (
              <Pressable
                onPress={() => router.push(`/question/${room.question_id}`)}
                style={styles.topBarButton}
              >
                <Text style={styles.topBarButtonText}>Question</Text>
              </Pressable>
            ) : (
              <View style={styles.topBarSpacer} />
            )}
          </View>
          {room.question_content && (
            <View style={styles.questionBadge}>
              <View style={styles.questionBadgeTop}>
                <Text style={styles.questionBadgeLabel}>QUESTION</Text>
                {room.host_id !== userId && (
                  <Pressable onPress={handleRoomReport}>
                    <Text style={styles.questionBadgeAction}>Report</Text>
                  </Pressable>
                )}
              </View>
              <Text style={styles.questionBadgeText} numberOfLines={2}>{room.question_content}</Text>
            </View>
          )}
          <View style={styles.headerTop}>
            <Text style={styles.title} numberOfLines={2}>{room.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.topic} numberOfLines={3}>{room.topic}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipLabel}>People</Text>
              <Text style={styles.metaChipValue}>{participantCount}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipLabel}>Speakers</Text>
              <Text style={styles.metaChipValue}>{speakerCount}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipLabel}>Audience</Text>
              <Text style={styles.metaChipValue}>{audienceCount}</Text>
            </View>
            {isHost && (
              <View style={[styles.metaChip, styles.hostChip]}>
                <Text style={styles.metaChipValue}>Host</Text>
              </View>
            )}
          </View>
          <View style={styles.connectionCard}>
            <Text style={styles.connectionLabel}>Audio status</Text>
            <Text style={styles.connectionValue}>{connectionLabel}</Text>
          </View>
        </View>

        {/* ── Speaker strip ───────────────────────────────────────────────── */}
        {(speakerTiles.length > 0 || isLive || isWaiting) && (
          <View style={styles.speakerStrip}>
            {speakerTiles.length === 0 ? (
              <Text style={styles.noSpeakersText}>
                {isWaiting ? 'Waiting for speakers to join…' : 'No speakers connected yet'}
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.speakerScroll}
              >
                {lkRoom.connected
                  ? // LiveKit participants — have speaking / muted state
                    (speakerTiles as typeof lkRoom.participants).map((p) => {
                      const dbParticipant = participants.find((entry) => entry.user_id === p.identity)
                      return (
                        <Pressable key={p.identity} onPress={() => dbParticipant && handleParticipantPress(dbParticipant)}>
                          <ParticipantTile
                            participant={{
                              identity: p.identity,
                              metadata: JSON.stringify({ username: p.username, avatar_url: p.avatar_url }),
                              isMicrophoneEnabled: !p.isMuted,
                              permissions: { canPublish: p.canSpeak },
                              trackPublications: new Map(),
                            } as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                            videoPublication={p.videoPublication}
                            isSpeaking={p.isSpeaking}
                            isMuted={p.isMuted}
                          />
                        </Pressable>
                      )
                    })
                  : // DB participants — pre-connection, no live state
                    (speakerTiles as typeof dbSpeakers).map((p) => (
                      <Pressable key={p.user_id} onPress={() => handleParticipantPress(p)}>
                        <ParticipantTile participant={dbParticipantToLKShim(p)} />
                      </Pressable>
                    ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* ── Voting ──────────────────────────────────────────────────────── */}
        {!isEnded && (
          <View style={styles.votingSection}>
            <VotingDial counts={counts} />
            <View style={styles.voteButtons}>
              <Pressable
                style={[styles.voteBtn, styles.againstBtn, userVote === 'against' && styles.voteBtnActive]}
                onPress={() => { void vote('against') }}
              >
                <Text style={styles.voteBtnText}>Against</Text>
              </Pressable>
              <Pressable
                style={[styles.voteBtn, styles.forBtn, userVote === 'for' && styles.voteBtnActive]}
                onPress={() => { void vote('for') }}
              >
                <Text style={styles.voteBtnText}>For</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Chat ────────────────────────────────────────────────────────── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatMessage
              message={item}
              isOwn={item.user_id === userId}
              onPress={item.user_id === userId && !isHost ? undefined : () => handleMessagePress(item)}
            />
          )}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>No messages yet — start the conversation.</Text>
            </View>
          }
        />

        {/* ── Message input ───────────────────────────────────────────────── */}
        {!isEnded && (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message…"
              placeholderTextColor="#6b7280"
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
              editable={!sending}
              blurOnSubmit={false}
            />
            <Pressable
              style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sending}
            >
              {sending
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.sendButtonText}>Send</Text>
              }
            </Pressable>
          </View>
        )}

        {/* ── Footer controls ─────────────────────────────────────────────── */}
        <View style={styles.footer}>

          {/* Host: start the debate (also connects host as speaker) */}
          {isHost && isWaiting && !lkRoom.connecting && (
            <Pressable
              style={[styles.actionButton, styles.startButton]}
              onPress={handleStartRoom}
            >
              <Text style={styles.actionButtonText}>🎙 Start debate</Text>
            </Pressable>
          )}

          {/* Connecting spinner */}
          {lkRoom.connecting && (
            <View style={[styles.actionButton, styles.connectingButton]}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.actionButtonText}> Connecting…</Text>
            </View>
          )}

          {/* Non-host, live room, not connected: offer speaker or listener */}
          {!isHost && isLive && !lkRoom.connected && !lkRoom.connecting && (
            <>
              <Pressable
                style={[styles.actionButton, styles.speakButton]}
                onPress={() => { void handleConnect('speaker') }}
              >
                <Text style={styles.actionButtonText}>🎤 Speak</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.listenButton]}
                onPress={() => { void handleConnect('audience') }}
              >
                <Text style={styles.actionButtonText}>👂 Listen</Text>
              </Pressable>
            </>
          )}

          {/* Mute / unmute — speakers only */}
          {lkRoom.connected && isSpeaker && !lkRoom.connecting && (
            <Pressable
              style={[styles.actionButton, lkRoom.isMuted ? styles.unmuteButton : styles.muteButton]}
              onPress={() => { void lkRoom.toggleMute() }}
            >
              <Text style={styles.actionButtonText}>
                {lkRoom.isMuted ? '🔇 Unmute' : '🎙 Mute'}
              </Text>
            </Pressable>
          )}

          {/* Leave audio — any connected user */}
          {lkRoom.connected && !lkRoom.connecting && (
            <Pressable
              style={[styles.actionButton, styles.leaveButton]}
              onPress={() => { void handleDisconnect() }}
            >
              <Text style={styles.actionButtonText}>Leave audio</Text>
            </Pressable>
          )}

          {/* Host: end the debate */}
          {isHost && !isEnded && !lkRoom.connecting && (
            <Pressable style={[styles.actionButton, styles.endButton]} onPress={handleEndRoom}>
              <Text style={styles.actionButtonText}>End debate</Text>
            </Pressable>
          )}
        </View>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    padding: 20,
    gap: 16,
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topBarButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  topBarButtonText: {
    color: '#d1d5db',
    fontSize: 13,
    fontWeight: '700',
  },
  topBarSpacer: {
    width: 72,
  },
  questionBadge: {
    backgroundColor: '#1f2937',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 4,
  },
  questionBadgeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionBadgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 0.8,
  },
  questionBadgeAction: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '700',
  },
  questionBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
    lineHeight: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#f9fafb',
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1f2937',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  metaChipLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
  },
  metaChipValue: {
    color: '#f9fafb',
    fontSize: 12,
    fontWeight: '800',
  },
  hostChip: {
    backgroundColor: '#312e81',
    borderColor: '#4f46e5',
  },
  connectionCard: {
    marginTop: 10,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  connectionLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  connectionValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },

  // Speaker strip
  speakerStrip: {
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    justifyContent: 'center',
  },
  speakerScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 0,
  },
  noSpeakersText: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  // Voting
  votingSection: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  voteBtn: {
    flex: 1,
    maxWidth: 120,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  voteBtnActive: {
    opacity: 0.5,
  },
  againstBtn: {
    backgroundColor: '#ef4444',
  },
  forBtn: {
    backgroundColor: '#22c55e',
  },
  voteBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Chat
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: 10,
  },
  emptyChat: {
    padding: 24,
    alignItems: 'center',
  },
  emptyChatText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },

  // Input
  inputRow: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  input: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#f9fafb',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sendButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  startButton:      { backgroundColor: '#22c55e' },
  speakButton:      { backgroundColor: '#4f46e5' },
  listenButton:     { backgroundColor: '#374151' },
  muteButton:       { backgroundColor: '#374151' },
  unmuteButton:     { backgroundColor: '#f59e0b' },
  leaveButton:      { backgroundColor: '#4b5563' },
  endButton:        { backgroundColor: '#ef4444' },
  connectingButton: { backgroundColor: '#374151' },

  // Error state
  errorText: {
    color: '#fca5a5',
    fontSize: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
})
