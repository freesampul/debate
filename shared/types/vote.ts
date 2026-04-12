export type VoteSide = 'for' | 'against'

export interface Vote {
  id: string
  room_id: string
  user_id: string
  side: VoteSide
  created_at: string
}

export interface VoteCounts {
  for: number
  against: number
  total: number
}
