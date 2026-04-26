import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as Linking from 'expo-linking'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { EmailOtpType, Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { textStyles, theme } from '../../theme/voltage'

interface LoginRouteParams {
  access_token?: string | string[]
  authError?: string | string[]
  code?: string | string[]
  error?: string | string[]
  errorDescription?: string | string[]
  error_description?: string | string[]
  refresh_token?: string | string[]
  token_hash?: string | string[]
  type?: string | string[]
}

interface AuthCallbackParams {
  accessToken?: string
  code?: string
  error?: string
  errorDescription?: string
  refreshToken?: string
  tokenHash?: string
  type?: EmailOtpType
}

const VALID_EMAIL_OTP_TYPES: EmailOtpType[] = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function normalizeEmailOtpType(value: string | undefined): EmailOtpType | undefined {
  if (!value) return undefined
  return VALID_EMAIL_OTP_TYPES.find((candidate) => candidate === value)
}

function parseCallbackObject(params: Record<string, string | undefined>): AuthCallbackParams {
  return {
    accessToken: params.access_token,
    code: params.code,
    error: params.error,
    errorDescription: params.error_description ?? params.errorDescription,
    refreshToken: params.refresh_token,
    tokenHash: params.token_hash,
    type: normalizeEmailOtpType(params.type),
  }
}

function parseAuthCallbackUrl(url: string): AuthCallbackParams {
  const queryIndex = url.indexOf('?')
  const hashIndex = url.indexOf('#')
  const query = queryIndex >= 0
    ? url.slice(queryIndex + 1, hashIndex >= 0 ? hashIndex : undefined)
    : ''
  const hash = hashIndex >= 0 ? url.slice(hashIndex + 1) : ''
  const merged = new URLSearchParams()

  for (const source of [query, hash]) {
    const params = new URLSearchParams(source)
    params.forEach((value, key) => {
      if (!merged.has(key)) merged.set(key, value)
    })
  }

  return parseCallbackObject({
    access_token: merged.get('access_token') ?? undefined,
    code: merged.get('code') ?? undefined,
    error: merged.get('error') ?? undefined,
    error_description: merged.get('error_description') ?? undefined,
    errorDescription: merged.get('errorDescription') ?? undefined,
    refresh_token: merged.get('refresh_token') ?? undefined,
    token_hash: merged.get('token_hash') ?? undefined,
    type: merged.get('type') ?? undefined,
  })
}

function hasAuthCallback(params: AuthCallbackParams): boolean {
  return Boolean(
    params.accessToken
      || params.code
      || params.error
      || params.refreshToken
      || params.tokenHash
      || params.type,
  )
}

async function waitForDurableSession(timeoutMs = 7000): Promise<Session> {
  const initial = await supabase.auth.getSession()
  if (initial.data.session) return initial.data.session

  return new Promise<Session>((resolve, reject) => {
    let settled = false

    const finish = (result: Session | Error, isError: boolean): void => {
      if (settled) return
      settled = true
      clearTimeout(timeoutId)
      clearInterval(pollId)
      subscription.data.subscription.unsubscribe()

      if (isError) {
        reject(result)
      } else {
        resolve(result as Session)
      }
    }

    const timeoutId = setTimeout(() => {
      finish(new Error('Sign in completed, but no persisted session was found.'), true)
    }, timeoutMs)

    const pollId = setInterval(() => {
      void supabase.auth.getSession().then(({ data }) => {
        if (data.session) finish(data.session, false)
      }).catch((error: unknown) => {
        finish(error instanceof Error ? error : new Error('Failed to read auth session.'), true)
      })
    }, 200)

    const subscription = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish(session, false)
    })
  })
}

export default function LoginScreen(): React.ReactElement {
  const params = useLocalSearchParams() as LoginRouteParams
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [authError, setAuthError] = useState<string | null>(firstParam(params.authError) ?? null)
  const [callbackProcessing, setCallbackProcessing] = useState(false)
  const [callbackMessage, setCallbackMessage] = useState('Verifying your sign-in link…')
  const redirectTo = useMemo(() => Linking.createURL('login', { scheme: 'debate' }), [])
  const lastHandledKey = useRef<string | null>(null)

  const processAuthCallback = useCallback(async (callback: AuthCallbackParams, sourceKey: string): Promise<void> => {
    if (!hasAuthCallback(callback)) return
    if (lastHandledKey.current === sourceKey) return
    lastHandledKey.current = sourceKey

    setSent(false)
    setAuthError(null)
    setCallbackProcessing(true)
    setCallbackMessage('Verifying your sign-in link…')

    try {
      if (callback.error) {
        throw new Error(callback.errorDescription ?? callback.error)
      }

      if (callback.accessToken && callback.refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: callback.accessToken,
          refresh_token: callback.refreshToken,
        })
        if (error) throw error
      } else if (callback.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(callback.code)
        if (error) throw error
      } else if (callback.tokenHash && callback.type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: callback.tokenHash,
          type: callback.type,
        })
        if (error) throw error
      } else {
        throw new Error('Auth callback did not include a valid session or exchange code.')
      }

      setCallbackMessage('Finishing sign in…')
      await waitForDurableSession()
      router.replace('/(tabs)')
    } catch (callbackError) {
      const message = callbackError instanceof Error ? callbackError.message : 'Failed to complete sign in.'
      console.error('[auth] Failed to complete login callback:', callbackError)
      setAuthError(message)
      setSent(false)
    } finally {
      setCallbackProcessing(false)
    }
  }, [router])

  useEffect(() => {
    const routeCallback = parseCallbackObject({
      access_token: firstParam(params.access_token),
      code: firstParam(params.code),
      error: firstParam(params.error),
      error_description: firstParam(params.error_description),
      errorDescription: firstParam(params.errorDescription),
      refresh_token: firstParam(params.refresh_token),
      token_hash: firstParam(params.token_hash),
      type: firstParam(params.type),
    })

    if (hasAuthCallback(routeCallback)) {
      const routeKey = JSON.stringify(routeCallback)
      void processAuthCallback(routeCallback, `route:${routeKey}`)
      return
    }

    const paramError = firstParam(params.authError)
    if (paramError) {
      setAuthError(paramError)
    }
  }, [
    params.access_token,
    params.authError,
    params.code,
    params.error,
    params.error_description,
    params.errorDescription,
    params.refresh_token,
    params.token_hash,
    params.type,
    processAuthCallback,
  ])

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (!url) return
      const callback = parseAuthCallbackUrl(url)
      if (!hasAuthCallback(callback)) return
      void processAuthCallback(callback, `initial:${url}`)
    }).catch(() => {})

    const sub = Linking.addEventListener('url', ({ url }) => {
      const callback = parseAuthCallbackUrl(url)
      if (!hasAuthCallback(callback)) return
      void processAuthCallback(callback, `event:${url}`)
    })

    return () => sub.remove()
  }, [processAuthCallback])

  const handleSendLink = async (): Promise<void> => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      Alert.alert('Enter your email', 'Please enter a valid email address.')
      return
    }

    setLoading(true)
    setAuthError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo,
      },
    })
    setLoading(false)

    if (error) {
      Alert.alert('Error', error.message || 'Failed to send magic link. Please try again.')
      return
    }

    setSent(true)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          <Text style={styles.appName}>Debate</Text>
          <Text style={styles.tagline}>Join live debates. Vote in real time.</Text>

          {authError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Sign-in link failed</Text>
              <Text style={styles.errorBody}>{authError}</Text>
            </View>
          ) : null}

          {callbackProcessing ? (
            <View style={styles.callbackBox}>
              <ActivityIndicator size="large" color={theme.color.pro} />
              <Text style={styles.callbackTitle}>Finishing sign in</Text>
              <Text style={styles.callbackBody}>{callbackMessage}</Text>
            </View>
          ) : sent ? (
            <View style={styles.sentBox}>
              <Text style={styles.sentTitle}>Check your inbox</Text>
              <Text style={styles.sentBody}>
                We sent a magic link to {email.trim().toLowerCase()}. Tap it to sign in.
              </Text>
              <Pressable onPress={() => setSent(false)} style={styles.resendButton}>
                <Text style={styles.resendText}>Use a different email</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={theme.color.dim}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                editable={!loading && !callbackProcessing}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                  (loading || callbackProcessing) && styles.buttonDisabled,
                ]}
                onPress={handleSendLink}
                disabled={loading || callbackProcessing}
              >
                {loading ? (
                  <ActivityIndicator color={theme.color.proInk} />
                ) : (
                  <Text style={styles.buttonText}>Send magic link</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.color.bg,
  },
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing['2xl'],
    paddingBottom: 40,
  },
  appName: {
    ...textStyles.displayXL,
    textAlign: 'center',
    marginBottom: 8,
    color: theme.color.ink,
  },
  tagline: {
    ...textStyles.body,
    textAlign: 'center',
    marginBottom: 48,
    color: theme.color.muted,
  },
  form: {
    gap: theme.spacing.md,
  },
  label: {
    ...textStyles.label,
    marginBottom: 4,
    color: theme.color.ink,
  },
  input: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.line,
    color: theme.color.ink,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: theme.font.body,
  },
  button: {
    backgroundColor: theme.color.pro,
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.color.proInk,
    fontFamily: theme.font.displayBold,
    fontSize: 16,
  },
  sentBox: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  callbackBox: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  errorBox: {
    backgroundColor: theme.color.dangerSurface,
    borderWidth: 1,
    borderColor: theme.color.danger,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    gap: 6,
  },
  errorTitle: {
    ...textStyles.bodySemibold,
    color: theme.color.con,
  },
  errorBody: {
    ...textStyles.bodySM,
    color: theme.color.con,
  },
  sentTitle: {
    ...textStyles.titleLG,
  },
  callbackTitle: {
    ...textStyles.titleLG,
  },
  sentBody: {
    textAlign: 'center',
    ...textStyles.body,
  },
  callbackBody: {
    textAlign: 'center',
    ...textStyles.body,
  },
  resendButton: {
    marginTop: 8,
  },
  resendText: {
    color: theme.color.pro,
    fontFamily: theme.font.bodySemibold,
    fontSize: 15,
  },
})
