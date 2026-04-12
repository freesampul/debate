export interface Message {
  id: string
  room_id: string
  user_id: string
  content: string
  filtered_content?: string | null
  moderation_status?: 'visible' | 'filtered' | 'removed'
  report_count?: number
  removed_at?: string | null
  created_at: string
}
