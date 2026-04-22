import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { Notification, UserProfile } from '@debate-app/shared'
import { VButton, VPill } from '../../components/voltage'
import { useAuth } from '../../hooks/useAuth'
import { getMyProfile, listNotifications, markNotificationRead, updateMyProfile } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { textStyles, theme } from '../../theme/voltage'

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function notificationActorName(notification: Notification): string | null {
  const candidateKeys = [
    'actor_display_name',
    'actor_username',
    'host_display_name',
    'host_username',
    'follower_display_name',
    'follower_username',
  ]

  for (const key of candidateKeys) {
    const value = notification.data[key]
    if (typeof value === 'string' && value.trim()) return value
  }

  return null
}

function notificationQuestion(notification: Notification): string | null {
  const value = notification.data.question_content
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function notificationRoomTitle(notification: Notification): string | null {
  const value = notification.data.room_title
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function describeNotification(notification: Notification): string {
  const actor = notificationActorName(notification)
  const question = notificationQuestion(notification)
  const roomTitle = notificationRoomTitle(notification)

  if (notification.type === 'follow') {
    return actor ? `${actor} followed you` : 'Someone followed you'
  }

  if (notification.type === 'speaker_live') {
    if (roomTitle && actor) return `${actor} is live in "${roomTitle}"`
    if (question && actor) return `${actor} is live debating "${question}"`
    if (actor) return `${actor} is live now`
    return 'A followed debater is live'
  }

  if (notification.type === 'question_live') {
    if (question && actor) return `${actor} started a live room for "${question}"`
    if (question) return `A live room started for "${question}"`
    return 'A question you engaged with has a live room'
  }

  if (notification.type === 'room_invite') return 'You were invited to speak'
  if (notification.type === 'invite_accepted') return 'A speaker accepted your invite'
  if (notification.type === 'invite_declined') return 'A speaker declined your invite'
  if (notification.type === 'reaction_received') return 'You received a reaction'
  return notification.type
}

export default function ProfileScreen(): React.ReactElement {
  const { session } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const loadProfile = useCallback(async (): Promise<void> => {
    try {
      const [next, inbox] = await Promise.all([
        getMyProfile(),
        listNotifications(),
      ])
      setProfile(next)
      setUsername(next.username)
      setDisplayName(next.display_name ?? '')
      setBio(next.bio ?? '')
      setNotifications(inbox)
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleSave = useCallback(async (): Promise<void> => {
    if (!username.trim()) return
    setSaving(true)
    try {
      const next = await updateMyProfile({
        username: username.trim(),
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
      })
      setProfile(next)
      setDisplayName(next.display_name ?? '')
      setBio(next.bio ?? '')
      Alert.alert('Saved', 'Profile updated.')
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }, [username, displayName, bio])

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

  const handleNotificationPress = useCallback(async (notification: Notification): Promise<void> => {
    try {
      if (!notification.read_at) {
        await markNotificationRead(notification.id)
        setNotifications((prev) => prev.map((item) => (
          item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item
        )))
      }

      const roomId = typeof notification.data.room_id === 'string' ? notification.data.room_id : null
      const questionId = typeof notification.data.question_id === 'string' ? notification.data.question_id : null
      const followerId = typeof notification.data.follower_id === 'string' ? notification.data.follower_id : null

      if (roomId) {
        router.push(`/room/${roomId}`)
        return
      }
      if (questionId) {
        router.push(`/question/${questionId}`)
        return
      }
      if (followerId) {
        router.push(`/user/${followerId}`)
      }
    } catch {
      Alert.alert('Error', 'Failed to update notification state.')
    }
  }, [router])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications],
  )

  if (!session || loading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.color.pro} />
      </View>
    )
  }

  const email = session.user.email ?? 'Unknown'
  const joined = new Date(session.user.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const initial = (displayName || username || email).charAt(0).toUpperCase()

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerBlock}>
          <Text style={styles.kicker}>ME</Text>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
          <Text style={styles.handle}>@{profile.username}</Text>
          <Text style={styles.subcopy}>{displayName || 'No display name yet'}</Text>
          <View style={styles.pillRow}>
            <VPill label={`${profile.follower_count} FOLLOWERS`} />
            <VPill label={`${profile.following_count} FOLLOWING`} />
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
              label={saving ? 'Saving…' : 'Save profile'}
              variant="primary"
              onPress={() => { void handleSave() }}
              disabled={saving || !username.trim()}
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
            <Text style={styles.sectionTitle}>Inbox</Text>
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
          {notifications.length === 0 ? (
            <Text style={styles.emptyInbox}>No notifications yet.</Text>
          ) : (
            notifications.map((notification) => (
              <Pressable
                key={notification.id}
                style={[
                  styles.notificationRow,
                  !notification.read_at && styles.notificationUnread,
                ]}
                onPress={() => { void handleNotificationPress(notification) }}
              >
                <Text style={styles.notificationCopy}>{describeNotification(notification)}</Text>
                <Text style={styles.notificationMeta}>{formatDate(notification.created_at)}</Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
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
  heroCard: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.line,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatar: {
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
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.sm,
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
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  notificationRow: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.line,
    backgroundColor: theme.color.surfaceAlt,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  notificationUnread: {
    borderColor: theme.color.pro,
  },
  notificationCopy: {
    ...textStyles.body,
  },
  notificationMeta: {
    fontFamily: theme.font.monoMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.color.dim,
  },
  emptyInbox: {
    ...textStyles.bodySM,
  },
})
