import React from 'react'
import { Tabs } from 'expo-router'
import { Text } from 'react-native'

function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }): React.ReactElement {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{symbol}</Text>
}

export default function TabsLayout(): React.ReactElement {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#111827' },
        headerTintColor: '#f9fafb',
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: { backgroundColor: '#111827', borderTopColor: '#1f2937' },
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#6b7280',
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
