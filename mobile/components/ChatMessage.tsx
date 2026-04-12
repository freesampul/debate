import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Message } from '@debate-app/shared'

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
    borderRadius: 12,
    padding: 10,
  },
  bubbleOther: {
    backgroundColor: '#1f2937',
    borderBottomLeftRadius: 4,
  },
  bubbleOwn: {
    backgroundColor: '#4f46e5',
    borderBottomRightRadius: 4,
  },
  userId: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 2,
    fontWeight: '600',
  },
  content: {
    fontSize: 14,
    color: '#f9fafb',
    lineHeight: 19,
  },
  contentOwn: {
    color: '#fff',
  },
  contentRemoved: {
    fontStyle: 'italic',
    opacity: 0.8,
  },
  time: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeOwn: {
    color: 'rgba(255,255,255,0.6)',
  },
})
