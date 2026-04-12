import React, { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Linking from 'expo-linking'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

function AuthGuard(): React.ReactElement {
  const { session, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  // Handle magic link deep link (debate://login?code=...)
  useEffect(() => {
    const handleUrl = async (url: string): Promise<void> => {
      if (!url) return
      const parsed = Linking.parse(url)
      const code = parsed.queryParams?.code as string | undefined
      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
      }
    }

    // Handle cold-start deep link
    Linking.getInitialURL().then((url) => { if (url) void handleUrl(url) })

    // Handle foreground deep link
    const sub = Linking.addEventListener('url', ({ url }) => { void handleUrl(url) })
    return () => sub.remove()
  }, [])

  useEffect(() => {
    if (loading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [session, loading, segments, router])

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  return <Slot />
}

export default function RootLayout(): React.ReactElement {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthGuard />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
