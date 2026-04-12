export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export interface SpeakerInvite {
  id: string
  room_id: string
  invited_by: string
  invited_user_id: string
  status: InviteStatus
  created_at: string
  responded_at: string | null
}

/** Invite with the invited user's profile data, returned by the list endpoint */
export interface SpeakerInviteWithUser extends SpeakerInvite {
  username: string
  avatar_url: string | null
}
