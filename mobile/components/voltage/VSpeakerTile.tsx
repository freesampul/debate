import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { theme } from '../../theme/voltage'

export interface VSpeakerTileProps {
  name: string
  side: 'pro' | 'con' | null
  speaking: boolean
}

function sideColors(side: 'pro' | 'con' | null): { bg: string; fg: string; glyph: string } {
  if (side === 'pro') return { bg: theme.color.pro, fg: theme.color.proInk, glyph: '✓' }
  if (side === 'con') return { bg: theme.color.con, fg: theme.color.conInk, glyph: '✗' }
  return { bg: theme.color.surfaceAlt, fg: theme.color.ink, glyph: '•' }
}

export function VSpeakerTile({ name, side, speaking }: VSpeakerTileProps): React.ReactElement {
  const colors = sideColors(side)
  const initial = name.charAt(0).toUpperCase() || '?'

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.circle,
          speaking && styles.circleSpeaking,
          {
            backgroundColor: side ? colors.bg : theme.color.surfaceAlt,
            borderColor: speaking ? theme.color.accent : theme.color.line,
          },
        ]}
      >
        <Text style={[styles.initial, { color: side ? colors.fg : theme.color.ink }]}>{initial}</Text>
        <View style={[styles.sideDot, { backgroundColor: colors.bg, borderColor: theme.color.bg }]}>
          <Text style={[styles.sideGlyph, { color: colors.fg }]}>{colors.glyph}</Text>
        </View>
      </View>
      <View style={styles.namePill}>
        <Text style={styles.nameText} numberOfLines={1}>
          {name}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    width: 86,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: theme.color.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  circleSpeaking: {
    shadowRadius: 12,
    shadowOpacity: 0.55,
    elevation: 6,
  },
  initial: {
    fontFamily: theme.font.displayBold,
    fontSize: 22,
    lineHeight: 24,
  },
  sideDot: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  sideGlyph: {
    fontFamily: theme.font.bodyBold,
    fontSize: 10,
    lineHeight: 12,
  },
  namePill: {
    maxWidth: '100%',
    minHeight: 26,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.line,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  nameText: {
    fontFamily: theme.font.monoMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1,
    color: theme.color.ink,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
})
