import React from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { textStyles, theme } from '../../theme/voltage'

export interface VPillProps {
  label: string
  bg?: string
  fg?: string
  border?: string
  style?: StyleProp<ViewStyle>
}

export function VPill({
  label,
  bg = theme.color.surface,
  fg = theme.color.muted,
  border = theme.color.line,
  style,
}: VPillProps): React.ReactElement {
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: border }, style]}>
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    height: 26,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  label: {
    ...textStyles.label,
  },
})
