import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { Message, RoomParticipantWithUser } from '@debate-app/shared'
import { VButton, VChatBubble, VLiveBadge, VMeter, VPill, VSpeakerTile } from '../../components/voltage'
import { useAuth } from '../../hooks/useAuth'
import { useLiveKitRoom } from '../../hooks/useLiveKitRoom'
import { useParticipants } from '../../hooks/useParticipants'
import { useRoom } from '../../hooks/useRoom'
import { useVotes } from '../../hooks/useVotes'
import {
  banParticipant,
  endRoom,
  removeMessage,
  removeParticipant,
  reportMessage,
  reportRoom,
  sendMessage,
  startRoom,
} from '../../lib/api'
import { textStyles, theme } from '../../theme/voltage'

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function messageContent(message: Message): string {
  if (message.moderation_status === 'removed') {
    return message.filtered_content ?? 'Message removed'
  }
  return message.filtered_content ?? message.content
}

function identityLabel(userId: string): string {
  return `@${userId.slice(0, 8)}`
}

function statusPill(status: 'waiting' | 'live' | 'ended'): React.ReactElement {
  if (status === 'live') return <VLiveBadge />
  if (status === 'waiting') {
    return <VPill label="WAITING" bg={theme.color.warn} fg={theme.color.conInk} border={theme.color.warn} />
  }
  return <VPill label="ENDED" bg={theme.color.surfaceAlt} fg={theme.color.dim} border={theme.color.line} />
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
  const flatListRef = useRef<FlatList<Message>>(null)

  const isHost = room?.host_id === userId
  const isLive = room?.status === 'live'
  const isWaiting = room?.status === 'waiting'
  const isEnded = room?.status === 'ended'
  const isSpeaker = lkRoom.myRole === 'speaker'

  const liveSpeakers = useMemo(
    () => lkRoom.participants.filter((participant) => participant.canSpeak),
    [lkRoom.participants],
  )

  const participantCount = participants.length
  const speakerCount = dbSpeakers.length
  const listenerCount = Math.max(0, participantCount - speakerCount)
  const forPct = counts.total > 0 ? Math.round((counts.for / counts.total) * 100) : 50
  const connectionLabel = lkRoom.connecting
    ? 'Connecting to audio'
    : lkRoom.connected
      ? (isSpeaker ? (lkRoom.isMuted ? 'Connected as speaker (muted)' : 'Connected as speaker') : 'Connected as listener')
      : (isHost && isWaiting ? 'Host controls ready' : 'Not connected to audio')

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
  }, [id, messageText, userId])

  const handleStartRoom = useCallback(async (): Promise<void> => {
    try {
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
              await reportRoom(room.question_id as string, room.id, 'harassment')
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

  const renderMessage = useCallback(({ item }: { item: Message }): React.ReactElement => {
    const isOwn = item.user_id === userId
    const displayContent = messageContent(item)

    return (
      <Pressable
        onPress={isOwn && !isHost ? undefined : () => handleMessagePress(item)}
        style={styles.messageCard}
      >
        <View style={[styles.messageMetaRow, isOwn && styles.messageMetaRowOwn]}>
          {!isOwn ? (
            <Text style={styles.messageHandle}>{identityLabel(item.user_id)}</Text>
          ) : null}
          <Text style={styles.messageTime}>{formatTime(item.created_at)}</Text>
        </View>
        <VChatBubble
          userId={item.user_id}
          text={displayContent}
          side={null}
          isOwn={isOwn}
        />
      </Pressable>
    )
  }, [handleMessagePress, isHost, userId])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.color.pro} />
      </View>
    )
  }

  if (error || !room) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? 'Room not found.'}</Text>
          <VButton label="Go back" variant="ghost" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    )
  }

  const speakerElements = lkRoom.connected && liveSpeakers.length > 0
    ? liveSpeakers.map((speaker) => (
      <Pressable
        key={speaker.identity}
        onPress={() => {
          const dbSpeaker = participants.find((entry) => entry.user_id === speaker.identity)
          if (dbSpeaker) {
            handleParticipantPress(dbSpeaker)
          } else {
            router.push(`/user/${speaker.identity}`)
          }
        }}
        style={styles.speakerPressable}
      >
        <VSpeakerTile
          name={speaker.username}
          side={null}
          speaking={speaker.isSpeaking}
        />
      </Pressable>
    ))
    : dbSpeakers.map((speaker) => (
      <Pressable
        key={speaker.user_id}
        onPress={() => handleParticipantPress(speaker)}
        style={styles.speakerPressable}
      >
        <VSpeakerTile
          name={speaker.username}
          side={null}
          speaking={false}
        />
      </Pressable>
    ))

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={88}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={(
            <View style={styles.headerContent}>
              <View style={styles.topBar}>
                <VButton label="Back" variant="ghost" size="sm" onPress={handleBackPress} />
                <View style={styles.topBarCenter}>
                  {statusPill(room.status)}
                  <VPill label={`${listenerCount} LISTENERS`} />
                </View>
                {room.question_id ? (
                  <VButton
                    label="Question"
                    variant="ghost"
                    size="sm"
                    onPress={() => router.push(`/question/${room.question_id}`)}
                  />
                ) : (
                  <View style={styles.topBarSpacer} />
                )}
              </View>

              <View style={styles.motionCard}>
                <View style={styles.motionTop}>
                  <Text style={styles.motionLabel}>THE MOTION</Text>
                  {room.host_id !== userId ? (
                    <Pressable onPress={handleRoomReport}>
                      <Text style={styles.reportLink}>REPORT</Text>
                    </Pressable>
                  ) : null}
                </View>
                <Text style={styles.motionTitle} numberOfLines={3}>
                  {room.question_content ?? room.title}
                </Text>
                <Text style={styles.motionTopic} numberOfLines={3}>
                  {room.topic}
                </Text>
                <View style={styles.metaPills}>
                  <VPill label={`${speakerCount} SPEAKERS`} />
                  <VPill label={`${listenerCount} AUDIENCE`} />
                  {isHost ? (
                    <VPill
                      label="HOST"
                      bg={theme.color.accent}
                      fg={theme.color.conInk}
                      border={theme.color.accent}
                    />
                  ) : null}
                </View>
              </View>

              <View style={styles.connectionCard}>
                <Text style={styles.connectionLabel}>AUDIO STATUS</Text>
                <Text style={styles.connectionValue}>{connectionLabel}</Text>
              </View>

              <View style={styles.speakersCard}>
                <Text style={styles.sectionTitle}>Speakers</Text>
                {speakerElements.length > 0 ? (
                  <View style={styles.speakerGrid}>{speakerElements}</View>
                ) : (
                  <Text style={styles.emptySpeakers}>
                    {isWaiting ? 'Waiting for speakers to join.' : 'No speakers connected yet.'}
                  </Text>
                )}
              </View>

              {!isEnded ? (
                <View style={styles.meterCard}>
                  <VMeter forPct={forPct} total={counts.total} orientation="h" />
                </View>
              ) : null}

              <View style={styles.actionsCard}>
                <Text style={styles.sectionTitle}>Room controls</Text>
                <View style={styles.actionsGrid}>
                  {isHost && isWaiting && !lkRoom.connecting ? (
                    <VButton
                      label="Start debate"
                      variant="primary"
                      onPress={() => { void handleStartRoom() }}
                      style={styles.actionButton}
                    />
                  ) : null}

                  {!isHost && isLive && !lkRoom.connected && !lkRoom.connecting ? (
                    <>
                      <VButton
                        label="Speak"
                        variant="pro"
                        onPress={() => { void handleConnect('speaker') }}
                        style={styles.actionButton}
                      />
                      <VButton
                        label="Listen"
                        variant="ghost"
                        onPress={() => { void handleConnect('audience') }}
                        style={styles.actionButton}
                      />
                    </>
                  ) : null}

                  {lkRoom.connecting ? (
                    <View style={styles.connectingState}>
                      <ActivityIndicator size="small" color={theme.color.ink} />
                      <Text style={styles.connectingText}>Connecting…</Text>
                    </View>
                  ) : null}

                  {lkRoom.connected && isSpeaker && !lkRoom.connecting ? (
                    <VButton
                      label={lkRoom.isMuted ? 'Unmute' : 'Mute'}
                      variant={lkRoom.isMuted ? 'primary' : 'ghost'}
                      onPress={() => { void lkRoom.toggleMute() }}
                      style={styles.actionButton}
                    />
                  ) : null}

                  {lkRoom.connected && !lkRoom.connecting ? (
                    <VButton
                      label="Leave audio"
                      variant="ghost"
                      onPress={() => { void handleDisconnect() }}
                      style={styles.actionButton}
                    />
                  ) : null}

                  {isHost && !isEnded && !lkRoom.connecting ? (
                    <VButton
                      label="End debate"
                      variant="con"
                      onPress={handleEndRoom}
                      style={styles.actionButton}
                    />
                  ) : null}
                </View>
              </View>

              <Text style={styles.chatLabel}>CHAT</Text>
            </View>
          )}
          ListEmptyComponent={(
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>No messages yet. Start the conversation.</Text>
            </View>
          )}
        />

        {!isEnded ? (
          <View style={styles.bottomPanel}>
            <View style={styles.voteBar}>
              <VButton
                label={userVote === 'against' ? '✗ AGAINSTED' : '✗ AGAINST'}
                variant="con"
                onPress={() => { void vote('against') }}
                style={styles.voteButton}
              />
              <VButton
                label={userVote === 'for' ? '✓ FOR IT' : '✓ FOR'}
                variant="pro"
                onPress={() => { void vote('for') }}
                style={styles.voteButton}
              />
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Type a message…"
                placeholderTextColor={theme.color.dim}
                returnKeyType="send"
                onSubmitEditing={() => { void handleSendMessage() }}
                editable={!sending}
                blurOnSubmit={false}
              />
              <VButton
                label={sending ? '…' : 'Send'}
                variant="primary"
                size="sm"
                onPress={() => { void handleSendMessage() }}
                disabled={!messageText.trim() || sending}
              />
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.color.bg,
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.bg,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  errorText: {
    ...textStyles.body,
    textAlign: 'center',
    color: theme.color.ink,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing['2xl'],
  },
  headerContent: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing['2xl'],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  topBarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  topBarSpacer: {
    width: 88,
  },
  motionCard: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  motionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  motionLabel: {
    ...textStyles.label,
    color: theme.color.pro,
  },
  reportLink: {
    fontFamily: theme.font.monoBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    color: theme.color.con,
    textTransform: 'uppercase',
  },
  motionTitle: {
    ...textStyles.displayMD,
  },
  motionTopic: {
    ...textStyles.bodySM,
  },
  metaPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  connectionCard: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.color.line,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  connectionLabel: {
    ...textStyles.label,
    color: theme.color.dim,
  },
  connectionValue: {
    ...textStyles.bodySemibold,
  },
  speakersCard: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  sectionTitle: {
    ...textStyles.titleLG,
  },
  speakerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
  },
  speakerPressable: {
    alignItems: 'center',
  },
  emptySpeakers: {
    ...textStyles.bodySM,
  },
  meterCard: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.line,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  actionsCard: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  actionButton: {
    minWidth: 148,
  },
  connectingState: {
    minHeight: 54,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.color.line,
    backgroundColor: theme.color.surfaceAlt,
    paddingHorizontal: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  connectingText: {
    fontFamily: theme.font.displayBold,
    fontSize: 15,
    lineHeight: 18,
    color: theme.color.ink,
  },
  chatLabel: {
    ...textStyles.label,
    color: theme.color.dim,
  },
  messageCard: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  messageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  messageMetaRowOwn: {
    justifyContent: 'flex-end',
  },
  messageHandle: {
    fontFamily: theme.font.monoBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    color: theme.color.dim,
    textTransform: 'uppercase',
  },
  messageTime: {
    fontFamily: theme.font.monoMedium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.1,
    color: theme.color.dim,
    textTransform: 'uppercase',
  },
  emptyChat: {
    paddingVertical: theme.spacing.xl,
  },
  emptyChatText: {
    ...textStyles.bodySM,
    textAlign: 'center',
  },
  bottomPanel: {
    borderTopWidth: 1,
    borderTopColor: theme.color.line,
    backgroundColor: theme.color.bg,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  voteBar: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  voteButton: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.md,
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 116,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.line,
    backgroundColor: theme.color.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    color: theme.color.ink,
    fontFamily: theme.font.body,
    fontSize: theme.type.body.size,
    lineHeight: theme.type.body.lineHeight,
  },
})
