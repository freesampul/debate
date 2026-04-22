import React, { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import type { VoteCounts } from '@debate-app/shared'
import { textStyles, theme } from '../theme/voltage'

interface VotingDialProps {
  counts: VoteCounts
}

const DIAL_SIZE = 240
const NEEDLE_LENGTH = DIAL_SIZE / 2 - 16
const NEEDLE_WIDTH = 4

/**
 * Animated semicircle voting dial.
 * Needle sweeps from -90° (100% against, left) to +90° (100% for, right).
 * At 0° the vote is perfectly split.
 */
export function VotingDial({ counts }: VotingDialProps): React.ReactElement {
  const rotation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const forRatio = counts.total === 0 ? 0.5 : counts.for / counts.total
    const degrees = (forRatio - 0.5) * 180
    Animated.timing(rotation, {
      toValue: degrees,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [counts, rotation])

  // RN doesn't support transformOrigin; simulate bottom-pivot rotation by
  // translating up by half the needle length before rotating, then back.
  const rotateDeg = rotation.interpolate({ inputRange: [-90, 90], outputRange: ['-90deg', '90deg'] })
  const needleStyle = {
    transform: [
      { translateY: NEEDLE_LENGTH / 2 },
      { rotate: rotateDeg },
      { translateY: -NEEDLE_LENGTH / 2 },
    ],
  }

  const forPct = counts.total > 0 ? Math.round((counts.for / counts.total) * 100) : 50
  const againstPct = 100 - forPct

  return (
    <View style={styles.container}>
      {/* Semicircle background */}
      <View style={styles.dialContainer}>
        {/* Against half (left, red) — full circle, top half visible via container overflow */}
        <View style={[styles.halfCircle, styles.againstHalf]} />
        {/* For half (right, green) — clipped to right half of the dial */}
        <View style={styles.forHalfClip}>
          <View style={[styles.halfCircle, styles.forHalf]} />
        </View>

        {/* Center cap */}
        <View style={styles.centerCap} />

        {/* Animated needle */}
        <View style={styles.needleOrigin}>
          <Animated.View style={[styles.needle, needleStyle as object]} />
        </View>
      </View>

      {/* Labels */}
      <View style={styles.labels}>
        <Text style={[styles.labelText, styles.againstLabel]}>
          AGAINST {againstPct}%
        </Text>
        <Text style={[styles.labelText, styles.forLabel]}>
          FOR {forPct}%
        </Text>
      </View>

      {/* Vote count */}
      <Text style={styles.totalText}>
        {counts.total} {counts.total === 1 ? 'vote' : 'votes'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  dialContainer: {
    width: DIAL_SIZE,
    height: DIAL_SIZE / 2,
    overflow: 'hidden',
    position: 'relative',
  },
  halfCircle: {
    position: 'absolute',
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_SIZE / 2,
    top: 0,
  },
  againstHalf: {
    backgroundColor: theme.color.con,
    left: 0,
  },
  forHalfClip: {
    position: 'absolute',
    top: 0,
    left: DIAL_SIZE / 2,
    width: DIAL_SIZE / 2,
    height: DIAL_SIZE,
    overflow: 'hidden',
  },
  forHalf: {
    backgroundColor: theme.color.pro,
    left: -DIAL_SIZE / 2,
  },
  centerCap: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.color.surface,
    bottom: 0,
    alignSelf: 'center',
    left: DIAL_SIZE / 2 - 12,
    zIndex: 3,
  },
  needleOrigin: {
    position: 'absolute',
    bottom: 0,
    left: DIAL_SIZE / 2 - NEEDLE_WIDTH / 2,
    width: NEEDLE_WIDTH,
    height: NEEDLE_LENGTH,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  needle: {
    width: NEEDLE_WIDTH,
    height: NEEDLE_LENGTH,
    backgroundColor: theme.color.ink,
    borderRadius: NEEDLE_WIDTH / 2,
    position: 'absolute',
    bottom: 0,
    // transformOrigin is not supported in React Native StyleSheet (RN Web only).
    // Rotation is handled by the Animated interpolation anchored at the needleOrigin View.
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: DIAL_SIZE,
    marginTop: 8,
  },
  labelText: {
    ...textStyles.label,
  },
  againstLabel: {
    color: theme.color.con,
  },
  forLabel: {
    color: theme.color.pro,
  },
  totalText: {
    marginTop: 4,
    ...textStyles.bodySM,
  },
})
