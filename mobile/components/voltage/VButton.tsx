import React from 'react'
import { Animated, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'
import { theme } from '../../theme/voltage'
import { usePressScale } from './usePressScale'

export interface VButtonProps {
  label: string
  onPress?: () => void
  variant?: 'pro' | 'con' | 'primary' | 'ghost'
  size?: 'sm' | 'md'
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

const VARIANT_STYLES = {
  con: {
    backgroundColor: theme.color.con,
    borderColor: theme.color.con,
    textColor: theme.color.conInk,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: theme.color.line,
    textColor: theme.color.ink,
  },
  primary: {
    backgroundColor: theme.color.accent,
    borderColor: theme.color.accent,
    textColor: theme.color.conInk,
  },
  pro: {
    backgroundColor: theme.color.pro,
    borderColor: theme.color.pro,
    textColor: theme.color.proInk,
  },
} as const

const SIZE_STYLES = {
  md: {
    minHeight: 54,
    paddingHorizontal: theme.spacing.xl,
    textSize: 16,
  },
  sm: {
    minHeight: 40,
    paddingHorizontal: theme.spacing.lg,
    textSize: 14,
  },
} as const

export function VButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
}: VButtonProps): React.ReactElement {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale({
    pressedOpacity: 0.88,
    pressedScale: 0.96,
  })
  const variantStyle = VARIANT_STYLES[variant]
  const sizeStyle = SIZE_STYLES[size]

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={style}
    >
      <Animated.View
        style={[
          styles.button,
          animatedStyle,
          {
            backgroundColor: variantStyle.backgroundColor,
            borderColor: variantStyle.borderColor,
            minHeight: sizeStyle.minHeight,
            opacity: disabled ? 0.45 : undefined,
            paddingHorizontal: sizeStyle.paddingHorizontal,
          },
        ]}
      >
        <Text style={[styles.label, { color: variantStyle.textColor, fontSize: sizeStyle.textSize }]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: theme.font.displayBold,
    letterSpacing: -0.3,
  },
})
