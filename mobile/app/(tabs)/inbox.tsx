import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { Notification } from '@debate-app/shared'
import { VButton, VPill } from '../../components/voltage'
import { acceptInvite, declineInvite, listNotifications, markNotificationRead } from '../../lib/api'
import { describeNotification, getNotificationTargets } from '../../lib/notifications'
import { textStyles, theme } from '../../theme/voltage'

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function InboxScreen(): React.ReactElement {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [workingInviteId, setWorkingInviteId] = useState<string | null>(null)
  const [handledInviteIds, setHandledInviteIds] = useState<string[]>([])

  const loadNotifications = useCallback(async (): Promise<void> => {
    const next = await listNotifications()
    setNotifications(next)
    setError(null)
  }, [])

  useEffect(() => {
    loadNotifications()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load inbox')
      })
      .finally(() => setLoading(false))
  }, [loadNotifications])

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true)
    try {
      await loadNotifications()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh inbox')
    } finally {
      setRefreshing(false)
    }
  }, [loadNotifications])

  const markReadLocally = useCallback((notificationId: string): void => {
    setNotifications((prev) => prev.map((item) => (
      item.id === notificationId ? { ...item, read_at: new Date().toISOString() } : item
    )))
  }, [])

  const handleNotificationPress = useCallback(async (notification: Notification): Promise<void> => {
    try {
      if (!notification.read_at) {
        await markNotificationRead(notification.id)
        markReadLocally(notification.id)
      }

      const { roomId, questionId, followerId } = getNotificationTargets(notification)

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
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to open notification')
    }
  }, [markReadLocally, router])

  const handleInviteAction = useCallback(async (
    notification: Notification,
    action: 'accept' | 'decline',
  ): Promise<void> => {
    const { roomId, inviteId } = getNotificationTargets(notification)
    if (!roomId || !inviteId) return

    setWorkingInviteId(inviteId)
    try {
      if (action === 'accept') {
        await acceptInvite(roomId, inviteId)
      } else {
        await declineInvite(roomId, inviteId)
      }

      if (!notification.read_at) {
        await markNotificationRead(notification.id)
      }
      markReadLocally(notification.id)
      setHandledInviteIds((prev) => [...prev, inviteId])

      if (action === 'accept') {
        router.push(`/room/${roomId}`)
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : `Failed to ${action} invite`)
    } finally {
      setWorkingInviteId(null)
    }
  }, [markReadLocally, router])

  const unread = useMemo(
    () => notifications.filter((notification) => !notification.read_at),
    [notifications],
  )
  const read = useMemo(
    () => notifications.filter((notification) => Boolean(notification.read_at)),
    [notifications],
  )
  const sections = useMemo(
    () => [
      { key: 'unread', title: 'Unread', data: unread },
      { key: 'read', title: 'Earlier', data: read },
    ].filter((section) => section.data.length > 0),
    [read, unread],
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.color.pro} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.color.pro}
          />
        )}
        renderItem={({ item: section }) => (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <VPill label={`${section.data.length}`} />
            </View>
            <View style={styles.sectionBody}>
              {section.data.map((notification) => {
                const { inviteId } = getNotificationTargets(notification)
                const canHandleInvite = notification.type === 'room_invite'
                  && Boolean(inviteId)
                  && !handledInviteIds.includes(inviteId as string)

                return (
                  <View
                    key={notification.id}
                    style={[
                      styles.notificationRow,
                      !notification.read_at && styles.notificationUnread,
                    ]}
                  >
                    <Pressable onPress={() => { void handleNotificationPress(notification) }} style={styles.notificationPressable}>
                      <Text style={styles.notificationCopy}>{describeNotification(notification)}</Text>
                    </Pressable>
                    <Text style={styles.notificationMeta}>{formatDate(notification.created_at)}</Text>
                    {canHandleInvite ? (
                      <View style={styles.inviteActions}>
                        <VButton
                          label={workingInviteId === inviteId ? 'Working…' : 'Accept'}
                          variant="pro"
                          size="sm"
                          onPress={() => { void handleInviteAction(notification, 'accept') }}
                          disabled={workingInviteId === inviteId}
                          style={styles.inviteButton}
                        />
                        <VButton
                          label="Decline"
                          variant="ghost"
                          size="sm"
                          onPress={() => { void handleInviteAction(notification, 'decline') }}
                          disabled={workingInviteId === inviteId}
                          style={styles.inviteButton}
                        />
                      </View>
                    ) : null}
                  </View>
                )
              })}
            </View>
          </View>
        )}
        contentContainerStyle={styles.container}
        ListHeaderComponent={(
          <View style={styles.headerBlock}>
            <Text style={styles.kicker}>INBOX</Text>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>Follows, invites, and live debate activity land here.</Text>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No notifications yet.</Text>
            <Text style={styles.emptyBody}>Follow people and join debates to start building an inbox.</Text>
          </View>
        )}
      />
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
    marginBottom: theme.spacing.xl,
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
  errorBanner: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.dangerSurface,
    borderWidth: 1,
    borderColor: theme.color.danger,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  errorText: {
    ...textStyles.bodySM,
    color: theme.color.con,
  },
  section: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  sectionTitle: {
    ...textStyles.titleLG,
  },
  sectionBody: {
    gap: theme.spacing.md,
  },
  notificationRow: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.line,
    backgroundColor: theme.color.surface,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  notificationUnread: {
    borderColor: theme.color.pro,
  },
  notificationPressable: {
    width: '100%',
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
  inviteActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  inviteButton: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    ...textStyles.titleLG,
  },
  emptyBody: {
    ...textStyles.bodySM,
    color: theme.color.muted,
    maxWidth: 280,
    textAlign: 'center',
  },
})
