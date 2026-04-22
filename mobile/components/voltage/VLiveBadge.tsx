import React, { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import { textStyles, theme } from '../../theme/voltage'

export function VLiveBadge(): React.ReactElement {
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulse, {
            toValue: 0.85,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    )

    animation.start()
    return () => animation.stop()
  }, [pulse])

  const animatedDotStyle = {
    opacity: pulse.interpolate({
      inputRange: [0.85, 1],
      outputRange: [0.55, 1],
    }),
    transform: [{ scale: pulse }],
  }

  return (
    <View style={styles.badge}>
      <Animated.View style={[styles.dot, animatedDotStyle]} />
      <Text style={styles.label}>LIVE</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.con,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.conInk,
  },
  label: {
    ...textStyles.label,
    color: theme.color.conInk,
  },
})
