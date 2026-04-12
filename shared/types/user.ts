export interface User {
  id: string
  email: string
  username: string
  avatar_url: string | null
  display_name?: string | null
  bio?: string | null
  created_at: string
  updated_at: string
}

/** Safe public representation — omits email */
export type PublicUser = Omit<User, 'email'>

export interface UserProfile extends PublicUser {
  follower_count: number
  following_count: number
  hosted_room_count: number
  speaker_room_count: number
  is_following?: boolean
}
