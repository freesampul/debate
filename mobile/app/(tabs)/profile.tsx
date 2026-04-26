import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { UserProfile } from '@debate-app/shared'
import { VButton, VPill } from '../../components/voltage'
import { useAuth } from '../../hooks/useAuth'
import { listNotifications, getMyProfile, updateMyProfile } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { textStyles, theme } from '../../theme/voltage'

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function ProfileScreen(): React.ReactElement {
  const { session } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationLoadError, setNotificationLoadError] = useState<string | null>(null)

  const loadProfile = useCallback(async (): Promise<void> => {
    try {
      const next = await getMyProfile()
      setProfile(next)
      setUsername(next.username)
      setDisplayName(next.display_name ?? '')
      setBio(next.bio ?? '')
      setAvatarUrl(next.avatar_url ?? null)
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadNotificationCount = useCallback(async (): Promise<void> => {
    try {
      const notifications = await listNotifications()
      setUnreadCount(notifications.filter((notification) => !notification.read_at).length)
      setNotificationLoadError(null)
    } catch (err) {
      setNotificationLoadError(err instanceof Error ? err.message : 'Failed to load notifications')
    }
  }, [])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  useEffect(() => {
    void loadNotificationCount()
  }, [loadNotificationCount])

  const handlePickAvatar = useCallback(async (): Promise<void> => {
    let ImagePicker: typeof import('expo-image-picker')
    try {
      ImagePicker = await import('expo-image-picker')
    } catch {
      Alert.alert('Rebuild required', 'The updated avatar picker needs a fresh native iPhone build from Xcode or `npx expo run:ios --device`.')
      return
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to choose an avatar.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    })

    if (result.canceled) return

    const asset = result.assets[0]
    if (!asset?.base64) {
      Alert.alert('Error', 'Failed to prepare this image. Try a different photo.')
      return
    }

    const mimeType = asset.mimeType ?? 'image/jpeg'
    setAvatarUrl(`data:${mimeType};base64,${asset.base64}`)
  }, [])

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!username.trim()) return false
    setSaving(true)
    try {
      const next = await updateMyProfile({
        username: username.trim(),
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      })
      setProfile(next)
      setUsername(next.username)
      setDisplayName(next.display_name ?? '')
      setBio(next.bio ?? '')
      setAvatarUrl(next.avatar_url ?? null)
      Alert.alert('Saved', 'Profile updated.')
      return true
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save profile')
      return false
    } finally {
      setSaving(false)
    }
  }, [avatarUrl, bio, displayName, username])

  const handleLogout = useCallback((): void => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true)
            const { error } = await supabase.auth.signOut()
            setLoggingOut(false)
            if (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.')
            }
          },
        },
      ],
    )
  }, [])

  const initial = useMemo(() => {
    const source = displayName || username || session?.user.email || '?'
    return source.charAt(0).toUpperCase()
  }, [displayName, session?.user.email, username])

  if (!session || loading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.color.pro} />
      </View>
    )
  }

  const email = session.user.email ?? 'Unknown'
  const joined = formatDate(session.user.created_at)

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerBlock}>
          <Text style={styles.kicker}>ME</Text>
          <Text style={styles.title}>Account</Text>
          <Text style={styles.subtitle}>Tune your public identity, then jump into Inbox or preview how other people see you.</Text>
        </View>

        <View style={styles.heroCard}>
          <Pressable onPress={() => { void handlePickAvatar() }} style={styles.avatarButton}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarLetter}>{initial}</Text>
              </View>
            )}
          </Pressable>
          <Text style={styles.handle}>@{profile.username}</Text>
          <Text style={styles.subcopy}>{displayName || 'No display name yet'}</Text>
          {bio ? (
            <Text style={styles.bioPreview}>{bio}</Text>
          ) : (
            <Text style={styles.bioPlaceholder}>No bio yet. Add one from Edit profile.</Text>
          )}
          <View style={styles.pillRow}>
            <VPill label={`${profile.follower_count} FOLLOWERS`} />
            <VPill label={`${profile.following_count} FOLLOWING`} />
            {unreadCount > 0 ? (
              <VPill
                label={`${unreadCount} INBOX`}
                bg={theme.color.con}
                fg={theme.color.conInk}
                border={theme.color.con}
              />
            ) : null}
          </View>
          <View style={styles.heroActions}>
            <VButton label="Edit profile" variant="ghost" size="sm" onPress={() => setEditVisible(true)} style={styles.heroActionButton} />
            <VButton label="View public profile" variant="pro" size="sm" onPress={() => router.push(`/user/${profile.id}`)} style={styles.heroActionButton} />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.hosted_room_count}</Text>
            <Text style={styles.statLabel}>HOSTED</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.speaker_room_count}</Text>
            <Text style={styles.statLabel}>SPOKE</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.follower_count}</Text>
            <Text style={styles.statLabel}>FOLLOWERS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.following_count}</Text>
            <Text style={styles.statLabel}>FOLLOWING</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Identity</Text>
          <View style={styles.identityPreview}>
            <View style={styles.identityRow}>
              <Text style={styles.infoLabel}>HANDLE</Text>
              <Text style={styles.infoValue}>@{username}</Text>
            </View>
            <View style={styles.identityRow}>
              <Text style={styles.infoLabel}>DISPLAY NAME</Text>
              <Text style={styles.infoValue}>{displayName || 'Not set'}</Text>
            </View>
            <View style={styles.identityBlock}>
              <Text style={styles.infoLabel}>BIO</Text>
              <Text style={styles.identityBody}>{bio || 'No bio yet.'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>EMAIL</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>MEMBER SINCE</Text>
            <Text style={styles.infoValue}>{joined}</Text>
          </View>

          <View style={styles.buttonRow}>
            <VButton
              label="Edit profile"
              variant="primary"
              onPress={() => setEditVisible(true)}
              style={styles.buttonHalf}
            />
            <VButton
              label={loggingOut ? 'Signing out…' : 'Sign out'}
              variant="ghost"
              onPress={handleLogout}
              disabled={loggingOut}
              style={styles.buttonHalf}
            />
          </View>
        </View>

        <View style={styles.inboxCard}>
          <View style={styles.inboxHeader}>
            <View style={styles.inboxCopy}>
              <Text style={styles.sectionTitle}>Inbox</Text>
              <Text style={styles.inboxBody}>
                {notificationLoadError ?? 'Follow alerts, invites, and live-room updates live here now.'}
              </Text>
            </View>
            {unreadCount > 0 ? (
              <VPill
                label={`${unreadCount} NEW`}
                bg={theme.color.con}
                fg={theme.color.conInk}
                border={theme.color.con}
              />
            ) : (
              <VPill label="ALL CAUGHT UP" />
            )}
          </View>
          <VButton label="Open inbox" variant="pro" onPress={() => router.push('/inbox')} />
        </View>
      </ScrollView>

      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setEditVisible(false)} />
          <View style={styles.modalSheet}>
            <ScrollView contentContainerStyle={styles.modalSheetContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetKicker}>EDIT PROFILE</Text>
              <Text style={styles.sheetTitle}>Shape your public identity.</Text>
              <Text style={styles.sheetBody}>Change your avatar, handle, display name, and bio here.</Text>

              <View style={styles.modalAvatarBlock}>
                <Pressable onPress={() => { void handlePickAvatar() }} style={styles.avatarButton}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarLetter}>{initial}</Text>
                    </View>
                  )}
                </Pressable>
                <VButton label="Change avatar" variant="ghost" size="sm" onPress={() => { void handlePickAvatar() }} />
              </View>

              <Text style={styles.fieldLabel}>Handle</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
                placeholder="@handle"
                placeholderTextColor={theme.color.dim}
              />

              <Text style={styles.fieldLabel}>Display name</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                editable={!saving}
                placeholder="How people see you"
                placeholderTextColor={theme.color.dim}
              />

              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                maxLength={280}
                editable={!saving}
                textAlignVertical="top"
                placeholder="What do you fight about?"
                placeholderTextColor={theme.color.dim}
              />
              <Text style={styles.charCount}>{bio.length}/280</Text>

              <View style={styles.buttonRow}>
                <VButton
                  label="Cancel"
                  variant="ghost"
                  onPress={() => setEditVisible(false)}
                  style={styles.buttonHalf}
                />
                <VButton
                  label={saving ? 'Saving…' : 'Save profile'}
                  variant="primary"
                  onPress={() => { void handleSave().then((saved) => { if (saved) setEditVisible(false) }) }}
                  disabled={saving || !username.trim()}
                  style={styles.buttonHalf}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.color.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.bg,
  },
  container: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: 120,
    gap: theme.spacing.xl,
  },
  headerBlock: {
    gap: theme.spacing.sm,
  },
  kicker: {
    ...textStyles.label,
    color: theme.color.pro,
  },
  title: {
    ...textStyles.displayXL,
  },
  subtitle: {
    ...textStyles.bodySM,
    color: theme.color.muted,
  },
  heroCard: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatarButton: {
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.pill,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.pro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: theme.font.displayBold,
    fontSize: 34,
    lineHeight: 36,
    color: theme.color.proInk,
  },
  handle: {
    fontFamily: theme.font.monoBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: theme.color.ink,
  },
  subcopy: {
    ...textStyles.bodySM,
    textAlign: 'center',
  },
  bioPreview: {
    ...textStyles.bodySM,
    textAlign: 'center',
    color: theme.color.ink,
  },
  bioPlaceholder: {
    ...textStyles.bodySM,
    textAlign: 'center',
    color: theme.color.dim,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  heroActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  heroActionButton: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.line,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  statValue: {
    ...textStyles.displayMD,
  },
  statLabel: {
    ...textStyles.label,
    color: theme.color.dim,
  },
  formCard: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  identityPreview: {
    gap: theme.spacing.md,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  identityBlock: {
    gap: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.color.line,
    paddingTop: theme.spacing.md,
  },
  identityBody: {
    ...textStyles.bodySM,
    color: theme.color.ink,
  },
  sectionTitle: {
    ...textStyles.titleLG,
  },
  fieldLabel: {
    ...textStyles.label,
  },
  input: {
    minHeight: 56,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.line,
    backgroundColor: theme.color.surfaceAlt,
    paddingHorizontal: theme.spacing.lg,
    color: theme.color.ink,
    fontFamily: theme.font.body,
    fontSize: theme.type.body.size,
    lineHeight: theme.type.body.lineHeight,
  },
  bioInput: {
    minHeight: 116,
    paddingVertical: theme.spacing.lg,
  },
  charCount: {
    fontFamily: theme.font.monoMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    color: theme.color.dim,
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.color.line,
    paddingTop: theme.spacing.md,
  },
  infoLabel: {
    ...textStyles.label,
    color: theme.color.dim,
  },
  infoValue: {
    ...textStyles.bodySM,
    color: theme.color.ink,
    flexShrink: 1,
    textAlign: 'right',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  buttonHalf: {
    flex: 1,
  },
  inboxCard: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  inboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  inboxCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  inboxBody: {
    ...textStyles.bodySM,
    color: theme.color.muted,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.color.overlay,
  },
  modalSheet: {
    maxHeight: '88%',
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    backgroundColor: theme.color.surface,
    borderTopWidth: 1,
    borderColor: theme.color.line,
  },
  modalSheetContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing['2xl'],
    gap: theme.spacing.md,
  },
  sheetKicker: {
    ...textStyles.label,
    color: theme.color.pro,
  },
  sheetTitle: {
    ...textStyles.displayMD,
  },
  sheetBody: {
    ...textStyles.bodySM,
    color: theme.color.muted,
  },
  modalAvatarBlock: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
})
