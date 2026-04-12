export type NotificationType =
  | 'speaker_live'
  | 'question_live'
  | 'room_invite'
  | 'invite_accepted'
  | 'invite_declined'
  | 'reaction_received'
  | 'follow'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  data: Record<string, unknown>
  read_at: string | null
  created_at: string
}
