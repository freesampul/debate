import React from 'react'
import { Stack } from 'expo-router'
import { theme } from '../../theme/voltage'

export default function DevLayout(): React.ReactElement {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.color.bg },
        headerTintColor: theme.color.ink,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.color.bg },
      }}
    />
  )
}
