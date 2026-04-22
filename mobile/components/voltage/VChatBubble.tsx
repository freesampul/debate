import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { textStyles, theme } from '../../theme/voltage'
import { VPill } from './VPill'

export interface VChatBubbleProps {
  userId: string
  text: string
  side: 'pro' | 'con' | null
  isOwn: boolean
}

function initialFromUser(userId: string): string {
  const cleaned = userId.replace(/[^a-zA-Z0-9]/g, '')
  return (cleaned.charAt(0) || '?').toUpperCase()
}

function avatarColors(side: 'pro' | 'con' | null): { bg: string; fg: string } {
  if (side === 'pro') return { bg: theme.color.pro, fg: theme.color.proInk }
  if (side === 'con') return { bg: theme.color.con, fg: theme.color.conInk }
  return { bg: theme.color.surfaceAlt, fg: theme.color.ink }
}

export function VChatBubble({
  userId,
  text,
  side,
  isOwn,
}: VChatBubbleProps): React.ReactElement {
  const avatar = avatarColors(side)
  const sideLabel = side === 'pro' ? '● PRO' : side === 'con' ? '● CON' : null

  return (
    <View style={[styles.row, isOwn && styles.rowOwn]}>
      {!isOwn ? (
        <View style={[styles.avatar, { backgroundColor: avatar.bg }]}>
          <Text style={[styles.avatarText, { color: avatar.fg }]}>{initialFromUser(userId)}</Text>
        </View>
      ) : null}
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        {sideLabel ? (
          <VPill
            label={sideLabel}
            bg={side === 'pro' ? theme.color.pro : theme.color.con}
            fg={side === 'pro' ? theme.color.proInk : theme.color.conInk}
            border={side === 'pro' ? theme.color.pro : theme.color.con}
            style={styles.sidePill}
          />
        ) : null}
        <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>{text}</Text>
      </View>
      {isOwn ? (
        <View style={[styles.avatar, { backgroundColor: avatar.bg }]}>
          <Text style={[styles.avatarText, { color: avatar.fg }]}>{initialFromUser(userId)}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: theme.font.displayBold,
    fontSize: 12,
    lineHeight: 14,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
  },
  ownBubble: {
    backgroundColor: theme.color.pro,
    borderColor: theme.color.pro,
  },
  otherBubble: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
  },
  sidePill: {
    marginBottom: theme.spacing.xs,
  },
  messageText: {
    ...textStyles.body,
    color: theme.color.ink,
  },
  messageTextOwn: {
    color: theme.color.proInk,
  },
})
