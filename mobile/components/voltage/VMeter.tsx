import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import type { LayoutChangeEvent } from 'react-native'
import { theme } from '../../theme/voltage'

export interface VMeterProps {
  forPct: number
  total: number
  orientation?: 'h' | 'v'
}

const HORIZONTAL_HEIGHT = 14
const VERTICAL_WIDTH = 14
const VERTICAL_HEIGHT = 40

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function VMeter({
  forPct,
  total,
  orientation = 'h',
}: VMeterProps): React.ReactElement {
  const safeForPct = clampPercent(forPct)
  const againstPct = 100 - safeForPct
  const animatedFor = useRef(new Animated.Value(safeForPct)).current
  const [containerWidth, setContainerWidth] = useState(0)
  const handleLayout = (e: LayoutChangeEvent): void => {
    const w = e.nativeEvent.layout.width
    if (w > 0 && w !== containerWidth) setContainerWidth(w)
  }

  useEffect(() => {
    Animated.timing(animatedFor, {
      toValue: safeForPct,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [animatedFor, safeForPct])

  const forDimension = animatedFor.interpolate({
    inputRange: [0, 100],
    outputRange: orientation === 'h' ? [0, containerWidth] : [0, VERTICAL_HEIGHT],
  })

  const againstDimension = animatedFor.interpolate({
    inputRange: [0, 100],
    outputRange: orientation === 'h' ? [containerWidth, 0] : [VERTICAL_HEIGHT, 0],
  })

  const voteLabel = useMemo(() => {
    if (total === 1) return '1 vote'
    return `${total} votes`
  }, [total])

  if (orientation === 'v') {
    return (
      <View style={styles.verticalWrap}>
        <View style={styles.verticalMeter}>
          <Animated.View style={[styles.verticalAgainst, { height: againstDimension }]} />
          <Animated.View style={[styles.verticalFor, { height: forDimension }]} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.horizontalWrap}>
      <View style={styles.horizontalLabels}>
        <Text style={[styles.percentLabel, styles.proLabel]}>{safeForPct}% FOR</Text>
        <Text style={styles.totalLabel}>{voteLabel}</Text>
        <Text style={[styles.percentLabel, styles.conLabel]}>{againstPct}% AGAINST</Text>
      </View>
      <View style={styles.horizontalMeter} onLayout={handleLayout}>
        {containerWidth > 0 ? (
          <>
            <Animated.View style={[styles.horizontalFor, { width: forDimension }]} />
            <Animated.View style={[styles.horizontalAgainst, { width: againstDimension }]} />
          </>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  horizontalWrap: {
    gap: theme.spacing.sm,
    alignSelf: 'stretch',
  },
  horizontalLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  percentLabel: {
    fontFamily: theme.font.monoBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
  },
  proLabel: {
    color: theme.color.pro,
  },
  conLabel: {
    color: theme.color.con,
  },
  totalLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.font.monoMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.1,
    color: theme.color.dim,
    textTransform: 'uppercase',
  },
  horizontalMeter: {
    height: HORIZONTAL_HEIGHT,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
    backgroundColor: theme.color.surfaceAlt,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.color.line,
  },
  horizontalFor: {
    height: HORIZONTAL_HEIGHT,
    backgroundColor: theme.color.pro,
  },
  horizontalAgainst: {
    height: HORIZONTAL_HEIGHT,
    backgroundColor: theme.color.con,
  },
  verticalWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalMeter: {
    width: VERTICAL_WIDTH,
    height: VERTICAL_HEIGHT,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
    backgroundColor: theme.color.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.color.line,
    justifyContent: 'flex-end',
  },
  verticalAgainst: {
    width: VERTICAL_WIDTH,
    backgroundColor: theme.color.con,
  },
  verticalFor: {
    width: VERTICAL_WIDTH,
    backgroundColor: theme.color.pro,
  },
})
