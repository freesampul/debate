import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { VButton, VPill } from '../../components/voltage'
import { useAuth } from '../../hooks/useAuth'
import { followUser, getUserProfile, unfollowUser } from '../../lib/api'
import type { UserProfile } from '@debate-app/shared'
import { textStyles, theme } from '../../theme/voltage'

export default function UserProfileScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { session } = useAuth()
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

  const initial = useMemo(() => {
    const source = profile?.display_name || profile?.username || '?'
    return source.charAt(0).toUpperCase()
  }, [profile?.display_name, profile?.username])

  if (loading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.color.pro} />
      </View>
    )
  }

  const isOwnProfile = session?.user.id === profile.id

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <VButton label="Back" variant="ghost" size="sm" onPress={() => router.back()} />
        </View>

        <View style={styles.heroCard}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>
          )}
          <Text style={styles.name}>{profile.display_name || profile.username}</Text>
          <Text style={styles.handle}>@{profile.username}</Text>
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          <View style={styles.pillRow}>
            <VPill label={`${profile.follower_count} FOLLOWERS`} />
            <VPill label={`${profile.following_count} FOLLOWING`} />
          </View>
          {!isOwnProfile ? (
            <VButton
              label={updatingFollow ? 'Working…' : (profile.is_following ? 'Following' : 'Follow')}
              variant={profile.is_following ? 'ghost' : 'primary'}
              onPress={() => { void handleToggleFollow() }}
              disabled={updatingFollow}
              style={styles.followButton}
            />
          ) : null}
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
    paddingBottom: 80,
    gap: theme.spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
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
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: theme.radius.pill,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.pro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: theme.font.displayBold,
    fontSize: 38,
    lineHeight: 40,
    color: theme.color.proInk,
  },
  name: {
    ...textStyles.displayMD,
    textAlign: 'center',
  },
  handle: {
    fontFamily: theme.font.monoBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: theme.color.dim,
  },
  bio: {
    ...textStyles.body,
    textAlign: 'center',
    color: theme.color.muted,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  followButton: {
    width: '100%',
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
})
