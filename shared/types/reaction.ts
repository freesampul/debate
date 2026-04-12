export interface ItemType {
  id: string       // 'clap' | 'tomato' | 'rose' | 'fire' | 'confetti' | 'boo'
  name: string
  emoji: string
  coin_price: number
  sort_order: number
  created_at: string
}

export interface RoomReaction {
  id: string
  room_id: string
  from_user_id: string
  to_user_id: string
  item_type_id: string
  quantity: number
  created_at: string
}
