import React from 'react'
import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../hooks/useAuth'

export default function IndexScreen(): React.ReactElement {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  return <Redirect href={session ? '/' : '/login'} />
}
