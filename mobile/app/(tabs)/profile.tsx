import React, { useCallback, useEffect, useState } from 'react'
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
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { getMyProfile, listNotifications, markNotificationRead, updateMyProfile } from '../../lib/api'
import type { Notification, UserProfile } from '@debate-app/shared'

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

  const handleLogout = async (): Promise<void> => {
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
  }

  if (!session || loading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
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
  const unreadCount = notifications.filter((notification) => !notification.read_at).length

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

  function notificationActorName(notification: Notification): string | null {
    const candidateKeys = ['actor_display_name', 'actor_username', 'host_display_name', 'host_username', 'follower_display_name', 'follower_username']

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

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
          <Text style={styles.handle}>@{profile.username}</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.follower_count}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.following_count}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.hosted_room_count}</Text>
            <Text style={styles.statLabel}>Hosted</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.speaker_room_count}</Text>
            <Text style={styles.statLabel}>Speaker</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!saving}
          />

          <Text style={styles.label}>Display name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            editable={!saving}
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            maxLength={280}
            editable={!saving}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{bio.length}/280</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member since</Text>
            <Text style={styles.infoValue}>{joined}</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed, saving && styles.buttonDisabled]}
          onPress={() => { void handleSave() }}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save profile</Text>}
        </Pressable>

        <View style={styles.inboxCard}>
          <View style={styles.inboxHeader}>
            <Text style={styles.inboxTitle}>Notifications</Text>
            {unreadCount > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            ) : null}
          </View>
          {notifications.length === 0 ? (
            <Text style={styles.emptyInbox}>No notifications yet.</Text>
          ) : (
            notifications.map((notification) => (
              <Pressable
                key={notification.id}
                style={[styles.notificationRow, !notification.read_at && styles.notificationUnread]}
                onPress={() => { void handleNotificationPress(notification) }}
              >
                <Text style={styles.notificationText}>{describeNotification(notification)}</Text>
                <Text style={styles.notificationMeta}>
                  {new Date(notification.created_at).toLocaleDateString()}
                </Text>
              </Pressable>
            ))
          )}
        </View>

        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color="#ef4444" />
          ) : (
            <Text style={styles.logoutText}>Sign out</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' },
  container: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32, gap: 20 },
  avatarContainer: { alignItems: 'center', gap: 10 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 40, fontWeight: '700', color: '#fff' },
  handle: { color: '#f9fafb', fontSize: 18, fontWeight: '700' },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
    paddingVertical: 14,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { color: '#f9fafb', fontSize: 18, fontWeight: '800' },
  statLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  formCard: {
    backgroundColor: '#1f2937',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 16,
  },
  label: { color: '#d1d5db', fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 14 },
  input: {
    backgroundColor: '#111827',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    color: '#f9fafb',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bioInput: { minHeight: 110, paddingTop: 12 },
  charCount: { color: '#6b7280', fontSize: 11, textAlign: 'right', marginTop: 4 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 16,
  },
  infoLabel: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
  infoValue: { color: '#f9fafb', fontSize: 13, fontWeight: '500', flex: 1, textAlign: 'right' },
  saveButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonPressed: { opacity: 0.85 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  buttonDisabled: { opacity: 0.6 },
  inboxCard: {
    backgroundColor: '#1f2937',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 16,
    gap: 12,
  },
  inboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inboxTitle: { color: '#f9fafb', fontSize: 18, fontWeight: '700' },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  emptyInbox: { color: '#9ca3af', fontSize: 14 },
  notificationRow: {
    backgroundColor: '#111827',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  notificationUnread: {
    borderColor: '#4f46e5',
  },
  notificationText: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationMeta: {
    color: '#9ca3af',
    fontSize: 12,
  },
  logoutButton: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ef4444',
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonPressed: { backgroundColor: 'rgba(239,68,68,0.1)' },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
})
