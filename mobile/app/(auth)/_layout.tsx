import React from 'react'
import { Stack } from 'expo-router'
import { theme } from '../../theme/voltage'

export default function AuthLayout(): React.ReactElement {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.color.bg },
        animation: 'fade',
      }}
    />
  )
}
