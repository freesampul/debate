import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Message } from '@debate-app/shared'
import { textStyles, theme } from '../theme/voltage'

interface ChatMessageProps {
  message: Message
  isOwn: boolean
  onPress?: () => void
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ChatMessage({ message, isOwn, onPress }: ChatMessageProps): React.ReactElement {
  const displayContent = message.moderation_status === 'removed'
    ? (message.filtered_content ?? 'Message removed')
    : (message.filtered_content ?? message.content)

  return (
    <View style={[styles.row, isOwn && styles.rowOwn]}>
      <Pressable onPress={onPress} style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && (
          <Text style={styles.userId} numberOfLines={1}>
            {message.user_id.slice(0, 8)}
          </Text>
        )}
        <Text style={[styles.content, isOwn && styles.contentOwn, message.moderation_status === 'removed' && styles.contentRemoved]}>
          {displayContent}
        </Text>
        <Text style={[styles.time, isOwn && styles.timeOwn]}>{formatTime(message.created_at)}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: theme.radius.md,
    padding: 10,
    borderWidth: 1,
  },
  bubbleOther: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderBottomLeftRadius: 4,
  },
  bubbleOwn: {
    backgroundColor: theme.color.pro,
    borderColor: theme.color.pro,
    borderBottomRightRadius: 4,
  },
  userId: {
    ...textStyles.tag,
    marginBottom: 2,
    color: theme.color.muted,
  },
  content: {
    ...textStyles.bodySM,
    color: theme.color.ink,
  },
  contentOwn: {
    color: theme.color.proInk,
  },
  contentRemoved: {
    fontStyle: 'italic',
    opacity: 0.8,
  },
  time: {
    marginTop: 4,
    alignSelf: 'flex-end',
    fontFamily: theme.font.mono,
    fontSize: 10,
    color: theme.color.dim,
  },
  timeOwn: {
    color: 'rgba(255,255,255,0.72)',
  },
})
