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
import * as SplashScreen from 'expo-splash-screen'
import { useAuth } from '../hooks/useAuth'
import { textStyles, theme } from '../theme/voltage'

SplashScreen.preventAutoHideAsync()

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

  useEffect(() => {
    if (loading) return

    const currentSegment = segments[0]
    const onAuthRoute = currentSegment === '(auth)' || currentSegment === 'login'

    if (!session && !onAuthRoute) {
      router.replace('/login')
    } else if (session && onAuthRoute) {
      router.replace('/(tabs)')
    }
  }, [session, loading, segments, router])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.color.pro} />
        <Text style={styles.debugTitle}>Launching Debate</Text>
        <Text style={styles.debugBody}>Checking session…</Text>
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
