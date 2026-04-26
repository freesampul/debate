import type { Notification } from '@debate-app/shared'

export function notificationActorName(notification: Notification): string | null {
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

export function notificationQuestion(notification: Notification): string | null {
  const value = notification.data.question_content
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function notificationRoomTitle(notification: Notification): string | null {
  const value = notification.data.room_title
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function describeNotification(notification: Notification): string {
  const actor = notificationActorName(notification)
  const question = notificationQuestion(notification)
  const roomTitle = notificationRoomTitle(notification)

  if (notification.type === 'follow') {
    return actor ? `${actor} followed you` : 'Someone followed you'
  }

  if (notification.type === 'question_posted') {
    if (question && actor) return `${actor} posted "${question}"`
    if (question) return `A followed user posted "${question}"`
    return actor ? `${actor} posted a new take` : 'A followed user posted a new take'
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

export function getNotificationTargets(notification: Notification): {
  roomId: string | null
  questionId: string | null
  followerId: string | null
  inviteId: string | null
} {
  const roomId = typeof notification.data.room_id === 'string' ? notification.data.room_id : null
  const questionId = typeof notification.data.question_id === 'string' ? notification.data.question_id : null
  const followerId = typeof notification.data.follower_id === 'string' ? notification.data.follower_id : null
  const inviteId = typeof notification.data.invite_id === 'string' ? notification.data.invite_id : null

  return { roomId, questionId, followerId, inviteId }
}
