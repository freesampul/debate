import React, { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts } from 'expo-font'
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono'
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk'
import * as Linking from 'expo-linking'
import * as SplashScreen from 'expo-splash-screen'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { textStyles, theme } from '../theme/voltage'

SplashScreen.preventAutoHideAsync()

interface AppErrorBoundaryState {
  error: Error | null
}

interface AuthCallbackParams {
  accessToken?: string
  code?: string
  error?: string
  errorDescription?: string
  refreshToken?: string
}

function parseAuthCallback(url: string): AuthCallbackParams {
  const normalized = url.replace('#', '?')
  const parsed = Linking.parse(normalized)
  const params = parsed.queryParams ?? {}

  return {
    accessToken: typeof params.access_token === 'string' ? params.access_token : undefined,
    code: typeof params.code === 'string' ? params.code : undefined,
    error: typeof params.error === 'string' ? params.error : undefined,
    errorDescription:
      typeof params.error_description === 'string'
        ? params.error_description
        : typeof params.errorDescription === 'string'
          ? params.errorDescription
          : undefined,
    refreshToken: typeof params.refresh_token === 'string' ? params.refresh_token : undefined,
  }
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
  const [authCallbackError, setAuthCallbackError] = React.useState<string | null>(null)
  const lastHandledUrl = React.useRef<string | null>(null)

  // Handle magic link deep link (debate://login?... or debate://login#...)
  useEffect(() => {
    const handleUrl = async (url: string): Promise<void> => {
      if (!url || lastHandledUrl.current === url) return
      lastHandledUrl.current = url
      setBootMessage('Processing login link…')
      setAuthCallbackError(null)

      const { accessToken, code, error, errorDescription, refreshToken } = parseAuthCallback(url)

      if (!accessToken && !code && !error && !refreshToken) {
        setBootMessage('Checking session…')
        return
      }

      setProcessingMagicLink(true)

      try {
        if (error) {
          throw new Error(errorDescription ?? error)
        }

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          setBootMessage('Finishing sign in…')
          return
        }

        if (code) {
          await supabase.auth.exchangeCodeForSession(code)
          setBootMessage('Finishing sign in…')
          return
        }

        throw new Error('Auth callback did not include a valid session or exchange code.')
      } catch (callbackError) {
        const message = callbackError instanceof Error ? callbackError.message : 'Failed to complete sign in.'
        console.error('[auth] Failed to complete auth callback:', callbackError)
        setAuthCallbackError(message)
        setBootMessage('Sign in failed.')
      } finally {
        setProcessingMagicLink(false)
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
    const loginHref = authCallbackError
      ? {
          pathname: '/login' as const,
          params: { authError: authCallbackError },
        }
      : '/login'

    if (!session && !onAuthRoute) {
      setBootMessage('Routing to login…')
      router.replace(loginHref)
    } else if (session && onAuthRoute) {
      setBootMessage('Opening app…')
      router.replace('/')
    } else if (!session && onAuthRoute && authCallbackError) {
      router.replace(loginHref)
    }
  }, [session, loading, processingMagicLink, segments, router, authCallbackError])

  if (loading || processingMagicLink) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.color.pro} />
        <Text style={styles.debugTitle}>Launching Debate</Text>
        <Text style={styles.debugBody}>{bootMessage}</Text>
      </View>
    )
  }

  return <Slot />
}

export default function RootLayout(): React.ReactElement {
  const [fontsLoaded, fontError] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontError, fontsLoaded])

  if (!fontsLoaded && !fontError) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.color.pro} />
            <Text style={styles.debugTitle}>Loading Voltage</Text>
            <Text style={styles.debugBody}>Preparing fonts and theme…</Text>
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    )
  }

  return (
    <GestureHandlerRootView style={styles.root}>
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
  root: {
    flex: 1,
    backgroundColor: theme.color.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.bg,
    paddingHorizontal: theme.spacing['2xl'],
    gap: theme.spacing.md,
  },
  debugTitle: {
    textAlign: 'center',
    ...textStyles.titleLG,
  },
  debugBody: {
    textAlign: 'center',
    ...textStyles.bodySM,
  },
})
