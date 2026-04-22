import React from 'react'
import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../hooks/useAuth'
import { theme } from '../theme/voltage'

export default function IndexScreen(): React.ReactElement {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.color.bg }}>
        <ActivityIndicator size="large" color={theme.color.pro} />
      </View>
    )
  }

  return <Redirect href={session ? '/' : '/login'} />
}
