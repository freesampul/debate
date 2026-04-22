import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { TabActions } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme } from '../../theme/voltage'

type VoltageTabKey = 'index' | 'questions' | 'create' | 'inbox' | 'profile'

interface PreviewProps {
  activeKey?: VoltageTabKey
  onItemPress?: (key: VoltageTabKey) => void
}

export type VBottomNavProps = Partial<BottomTabBarProps> & PreviewProps

const TAB_ITEMS: Array<{ key: VoltageTabKey; icon: string; label: string; isCreate?: boolean }> = [
  { key: 'index', icon: '◎', label: 'Rooms' },
  { key: 'questions', icon: '❝', label: 'Takes' },
  { key: 'create', icon: '+', label: 'Create', isCreate: true },
  { key: 'inbox', icon: '✦', label: 'Inbox' },
  { key: 'profile', icon: '●', label: 'Me' },
]

function isBottomTabProps(props: VBottomNavProps): props is BottomTabBarProps {
  return Boolean(props.state && props.navigation && props.descriptors)
}

export function VBottomNav(props: VBottomNavProps): React.ReactElement {
  const insets = useSafeAreaInsets()
  const bottomPadding = Math.max(insets.bottom, theme.spacing.md)

  const activeKey = isBottomTabProps(props)
    ? (props.state.routes[props.state.index]?.name as VoltageTabKey | undefined)
    : props.activeKey

  const handlePress = (key: VoltageTabKey): void => {
    if (isBottomTabProps(props)) {
      const routeIndex = props.state.routes.findIndex((route) => route.name === key)
      if (routeIndex === -1) return

      const route = props.state.routes[routeIndex]
      const event = props.navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      })

      if (!event.defaultPrevented) {
        props.navigation.dispatch(TabActions.jumpTo(route.name, route.params))
      }
      return
    }

    props.onItemPress?.(key)
  }

  return (
    <View style={[styles.outer, { paddingBottom: bottomPadding }]}>
      <View style={styles.container}>
        {TAB_ITEMS.map((item) => {
          const focused = item.key === activeKey

          if (item.isCreate) {
            return (
              <Pressable key={item.key} onPress={() => handlePress(item.key)} style={styles.createWrap}>
                <View style={styles.createButton}>
                  <Text style={styles.createIcon}>{item.icon}</Text>
                </View>
              </Pressable>
            )
          }

          return (
            <Pressable key={item.key} onPress={() => handlePress(item.key)} style={styles.item}>
              <Text style={[styles.icon, !focused && styles.inactive]}>{item.icon}</Text>
              <Text style={[styles.label, !focused && styles.inactive]}>{item.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: theme.color.bg,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  container: {
    backgroundColor: theme.color.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    minHeight: 52,
  },
  createWrap: {
    paddingHorizontal: theme.spacing.xs,
  },
  createButton: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.color.pro,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  createIcon: {
    fontFamily: theme.font.displayBold,
    fontSize: 28,
    lineHeight: 30,
    color: theme.color.conInk,
  },
  icon: {
    fontFamily: theme.font.displayBold,
    fontSize: 18,
    lineHeight: 18,
    color: theme.color.ink,
  },
  label: {
    fontFamily: theme.font.monoBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: theme.color.ink,
  },
  inactive: {
    opacity: 0.4,
  },
})
