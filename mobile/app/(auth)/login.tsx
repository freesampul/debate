import React, { useState } from 'react'
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
import { useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { textStyles, theme } from '../../theme/voltage'

export default function LoginScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ authError?: string | string[] }>()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const authError = Array.isArray(params.authError) ? params.authError[0] : params.authError
  const redirectTo = Linking.createURL('login', { scheme: 'debate' })

  const handleSendLink = async (): Promise<void> => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      Alert.alert('Enter your email', 'Please enter a valid email address.')
      return
    }

    setLoading(true)
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

          {sent ? (
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
                editable={!loading}
              />
              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, loading && styles.buttonDisabled]}
                onPress={handleSendLink}
                disabled={loading}
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
  sentBody: {
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
