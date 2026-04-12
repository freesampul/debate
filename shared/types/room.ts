export type RoomStatus = 'waiting' | 'live' | 'ended'
export type MediaType = 'audio' | 'video'
export type ParticipantRole = 'speaker' | 'audience'

export interface Room {
  question_id: string | null
  question_content?: string | null
  id: string
  title: string
  topic: string
  status: RoomStatus
  host_id: string
  livekit_room: string | null
  recording_url: string | null
  max_speakers: number
  created_at: string
  ended_at: string | null
}

export interface RoomParticipant {
  id: string
  room_id: string
  user_id: string
  role: ParticipantRole
  media_type: MediaType
  joined_at: string
  left_at: string | null
}

/** RoomParticipant with joined user profile data, returned by the participants endpoint */
export interface RoomParticipantWithUser extends RoomParticipant {
  username: string
  avatar_url: string | null
}
