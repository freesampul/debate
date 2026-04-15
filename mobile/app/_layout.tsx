import React, { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Linking from 'expo-linking'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface AppErrorBoundaryState {
  error: Error | null
}

class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error): void {
    console.error('[app] Root render failed:', error)
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <View style={styles.center}>
          <Text style={styles.debugTitle}>Startup Error</Text>
          <Text style={styles.debugBody}>{this.state.error.message}</Text>
        </View>
      )
    }

    return this.props.children
  }
}

function AuthGuard(): React.ReactElement {
  const { session, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const [processingMagicLink, setProcessingMagicLink] = React.useState(false)
  const [bootMessage, setBootMessage] = React.useState('Booting app…')

  // Handle magic link deep link (debate://login?code=...)
  useEffect(() => {
    const handleUrl = async (url: string): Promise<void> => {
      if (!url) return
      setBootMessage('Processing login link…')
      const parsed = Linking.parse(url)
      const code = parsed.queryParams?.code as string | undefined
      if (code) {
        setProcessingMagicLink(true)
        try {
          await supabase.auth.exchangeCodeForSession(code)
        } finally {
          setProcessingMagicLink(false)
          setBootMessage('Finishing sign in…')
        }
      }
    }

    // Handle cold-start deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        void handleUrl(url)
      } else {
        setBootMessage('Checking session…')
      }
    })

    // Handle foreground deep link
    const sub = Linking.addEventListener('url', ({ url }) => { void handleUrl(url) })
    return () => sub.remove()
  }, [])

  useEffect(() => {
    if (loading || processingMagicLink) return

    const currentSegment = segments[0]
    const onAuthRoute = currentSegment === '(auth)' || currentSegment === 'login'

    if (!session && !onAuthRoute) {
      setBootMessage('Routing to login…')
      router.replace('/login')
    } else if (session && onAuthRoute) {
      setBootMessage('Opening app…')
      router.replace('/')
    }
  }, [session, loading, processingMagicLink, segments, router])

  if (loading || processingMagicLink) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.debugTitle}>Launching Debate</Text>
        <Text style={styles.debugBody}>{bootMessage}</Text>
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
        <AppErrorBoundary>
          <AuthGuard />
        </AppErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    gap: 12,
  },
  debugTitle: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  debugBody: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
})
