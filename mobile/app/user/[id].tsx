import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { followUser, getUserProfile, unfollowUser } from '../../lib/api'
import type { UserProfile } from '@debate-app/shared'

export default function UserProfileScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingFollow, setUpdatingFollow] = useState(false)

  const loadProfile = useCallback(async (): Promise<void> => {
    try {
      const next = await getUserProfile(id)
      setProfile(next)
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load profile')
      router.back()
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleToggleFollow = useCallback(async (): Promise<void> => {
    if (!profile) return
    setUpdatingFollow(true)
    try {
      if (profile.is_following) {
        await unfollowUser(profile.id)
        setProfile({ ...profile, is_following: false, follower_count: Math.max(0, profile.follower_count - 1) })
      } else {
        await followUser(profile.id)
        setProfile({ ...profile, is_following: true, follower_count: profile.follower_count + 1 })
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update follow')
    } finally {
      setUpdatingFollow(false)
    }
  }, [profile])

  if (loading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    )
  }

  const initial = (profile.display_name || profile.username).charAt(0).toUpperCase()

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Back</Text>
        </Pressable>

        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
          <Text style={styles.name}>{profile.display_name || profile.username}</Text>
          <Text style={styles.handle}>@{profile.username}</Text>
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
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

        <Pressable
          style={[styles.followButton, profile.is_following && styles.followingButton]}
          onPress={() => { void handleToggleFollow() }}
          disabled={updatingFollow}
        >
          {updatingFollow
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.followButtonText}>{profile.is_following ? 'Following' : 'Follow'}</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' },
  container: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 20 },
  backLink: { color: '#818cf8', fontSize: 14, fontWeight: '600' },
  avatarContainer: { alignItems: 'center', gap: 8 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: '#fff', fontSize: 42, fontWeight: '800' },
  name: { color: '#f9fafb', fontSize: 24, fontWeight: '800' },
  handle: { color: '#9ca3af', fontSize: 15, fontWeight: '600' },
  bio: { color: '#d1d5db', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
    paddingVertical: 16,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { color: '#f9fafb', fontSize: 18, fontWeight: '800' },
  statLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  followButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#374151',
  },
  followButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
