import { useRef } from 'react'
import { Animated } from 'react-native'

interface UsePressScaleOptions {
  pressedOpacity: number
  pressedScale: number
}

interface PressScaleHandlers {
  animatedStyle: {
    opacity: Animated.Value
    transform: { scale: Animated.Value }[]
  }
  onPressIn: () => void
  onPressOut: () => void
}

export function usePressScale({
  pressedOpacity,
  pressedScale,
}: UsePressScaleOptions): PressScaleHandlers {
  const scale = useRef(new Animated.Value(1)).current
  const opacity = useRef(new Animated.Value(1)).current

  const animateTo = (nextScale: number, nextOpacity: number): void => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: nextScale,
        useNativeDriver: true,
        speed: 32,
        bounciness: 6,
      }),
      Animated.timing(opacity, {
        toValue: nextOpacity,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start()
  }

  return {
    animatedStyle: {
      opacity,
      transform: [{ scale }],
    },
    onPressIn: () => animateTo(pressedScale, pressedOpacity),
    onPressOut: () => animateTo(1, 1),
  }
}
