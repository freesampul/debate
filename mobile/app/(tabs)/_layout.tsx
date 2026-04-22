import React from 'react'
import { Tabs } from 'expo-router'
import { StyleSheet, Text } from 'react-native'
import { textStyles, theme } from '../../theme/voltage'

function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }): React.ReactElement {
  return (
    <Text
      style={[
        styles.tabIcon,
        { opacity: focused ? 1 : 0.5 },
      ]}
    >
      {symbol}
    </Text>
  )
}

export default function TabsLayout(): React.ReactElement {
  return (
    <Tabs
      screenOptions={{
        sceneStyle: styles.scene,
        headerStyle: styles.header,
        headerShadowVisible: false,
        headerTintColor: theme.color.ink,
        headerTitleStyle: styles.headerTitle,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: theme.color.ink,
        tabBarInactiveTintColor: theme.color.dim,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Rooms',
          tabBarIcon: ({ focused }) => <TabIcon symbol="🎙️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="questions"
        options={{
          title: 'Questions',
          tabBarIcon: ({ focused }) => <TabIcon symbol="💬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ focused }) => <TabIcon symbol="➕" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon symbol="👤" focused={focused} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  scene: {
    backgroundColor: theme.color.bg,
  },
  header: {
    backgroundColor: theme.color.bg,
  },
  headerTitle: {
    ...textStyles.titleLG,
  },
  tabBar: {
    backgroundColor: theme.color.surface,
    borderTopColor: theme.color.line,
    height: 74,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  tabLabel: {
    fontFamily: theme.font.monoBold,
    fontSize: theme.type.tag.size,
    letterSpacing: theme.type.tag.letterSpacing,
    textTransform: 'uppercase',
  },
  tabIcon: {
    fontSize: 22,
  },
})
