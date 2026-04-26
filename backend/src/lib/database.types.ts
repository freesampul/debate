/**
 * Hand-written Supabase Database type matching the schema in ARCHITECTURE.md.
 * Pass this to createClient<Database> to get fully typed query results.
 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          avatar_url: string | null
          display_name: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          avatar_url?: string | null
          display_name?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          username?: string
          avatar_url?: string | null
          display_name?: string | null
          bio?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          id: string
          title: string
          topic: string
          status: 'waiting' | 'live' | 'ended'
          host_id: string
          question_id: string | null
          livekit_room: string | null
          recording_url: string | null
          max_speakers: number
          created_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          title: string
          topic: string
          status?: 'waiting' | 'live' | 'ended'
          host_id: string
          question_id?: string | null
          livekit_room?: string | null
          recording_url?: string | null
          max_speakers?: number
          created_at?: string
          ended_at?: string | null
        }
        Update: {
          title?: string
          topic?: string
          status?: 'waiting' | 'live' | 'ended'
          question_id?: string | null
          livekit_room?: string | null
          recording_url?: string | null
          ended_at?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          content: string
          submitted_by: string
          vote_count: number
          status: 'open' | 'in_debate' | 'closed'
          created_at: string
        }
        Insert: {
          id?: string
          content: string
          submitted_by: string
          vote_count?: number
          status?: 'open' | 'in_debate' | 'closed'
          created_at?: string
        }
        Update: {
          content?: string
          vote_count?: number
          status?: 'open' | 'in_debate' | 'closed'
        }
        Relationships: []
      }
      question_votes: {
        Row: {
          question_id: string
          user_id: string
        }
        Insert: {
          question_id: string
          user_id: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      room_participants: {
        Row: {
          id: string
          room_id: string
          user_id: string
          role: 'speaker' | 'audience'
          media_type: 'audio' | 'video'
          joined_at: string
          left_at: string | null
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          role: 'speaker' | 'audience'
          media_type?: 'audio' | 'video'
          joined_at?: string
          left_at?: string | null
        }
        Update: {
          left_at?: string | null
          role?: 'speaker' | 'audience'
        }
        Relationships: [
          {
            foreignKeyName: 'room_participants_room_id_fkey'
            columns: ['room_id']
            isOneToOne: false
            referencedRelation: 'rooms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'room_participants_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'speaker_live' | 'question_live' | 'question_posted' | 'room_invite' | 'invite_accepted' | 'invite_declined' | 'reaction_received' | 'follow'
          data: Record<string, unknown>
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'speaker_live' | 'question_live' | 'question_posted' | 'room_invite' | 'invite_accepted' | 'invite_declined' | 'reaction_received' | 'follow'
          data?: Record<string, unknown>
          read_at?: string | null
          created_at?: string
        }
        Update: {
          read_at?: string | null
        }
        Relationships: []
      }
      speaker_invites: {
        Row: {
          id: string
          room_id: string
          invited_by: string
          invited_user_id: string
          status: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          room_id: string
          invited_by: string
          invited_user_id: string
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at?: string
          responded_at?: string | null
        }
        Update: {
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          responded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'speaker_invites_invited_user_id_fkey'
            columns: ['invited_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      item_types: {
        Row: {
          id: string
          name: string
          emoji: string
          coin_price: number
          sort_order: number
          created_at: string
        }
        Insert: {
          id: string
          name: string
          emoji: string
          coin_price: number
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          emoji?: string
          coin_price?: number
          sort_order?: number
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          user_id: string
          coins: number
          updated_at: string
        }
        Insert: {
          user_id: string
          coins?: number
          updated_at?: string
        }
        Update: {
          coins?: number
          updated_at?: string
        }
        Relationships: []
      }
      coin_purchases: {
        Row: {
          id: string
          user_id: string
          coins_purchased: number
          amount_usd: number
          payment_provider: string | null
          payment_reference: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          coins_purchased: number
          amount_usd: number
          payment_provider?: string | null
          payment_reference?: string | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      room_reactions: {
        Row: {
          id: string
          room_id: string
          from_user_id: string
          to_user_id: string
          item_type_id: string
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          from_user_id: string
          to_user_id: string
          item_type_id: string
          quantity?: number
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      votes: {
        Row: {
          id: string
          room_id: string
          user_id: string
          side: 'for' | 'against'
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          side: 'for' | 'against'
          created_at?: string
        }
        Update: {
          side?: 'for' | 'against'
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          room_id: string
          user_id: string
          content: string
          filtered_content: string | null
          moderation_status: 'visible' | 'filtered' | 'removed'
          report_count: number
          removed_at: string | null
          removed_by: string | null
          moderation_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          content: string
          filtered_content?: string | null
          moderation_status?: 'visible' | 'filtered' | 'removed'
          report_count?: number
          removed_at?: string | null
          removed_by?: string | null
          moderation_reason?: string | null
          created_at?: string
        }
        Update: {
          content?: string
          filtered_content?: string | null
          moderation_status?: 'visible' | 'filtered' | 'removed'
          report_count?: number
          removed_at?: string | null
          removed_by?: string | null
          moderation_reason?: string | null
        }
        Relationships: []
      }
      moderation_reports: {
        Row: {
          id: string
          reporter_user_id: string
          room_id: string | null
          message_id: string | null
          reported_user_id: string | null
          category:
            | 'harassment'
            | 'hate_or_abuse'
            | 'spam'
            | 'sexual_content'
            | 'violent_or_dangerous'
            | 'impersonation'
            | 'off_topic_disruption'
          details: string | null
          status: 'open' | 'reviewed' | 'resolved' | 'dismissed'
          created_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          reporter_user_id: string
          room_id?: string | null
          message_id?: string | null
          reported_user_id?: string | null
          category:
            | 'harassment'
            | 'hate_or_abuse'
            | 'spam'
            | 'sexual_content'
            | 'violent_or_dangerous'
            | 'impersonation'
            | 'off_topic_disruption'
          details?: string | null
          status?: 'open' | 'reviewed' | 'resolved' | 'dismissed'
          created_at?: string
          reviewed_at?: string | null
        }
        Update: {
          status?: 'open' | 'reviewed' | 'resolved' | 'dismissed'
          reviewed_at?: string | null
        }
        Relationships: []
      }
      room_bans: {
        Row: {
          room_id: string
          user_id: string
          banned_by: string
          reason: string | null
          created_at: string
          expires_at: string | null
        }
        Insert: {
          room_id: string
          user_id: string
          banned_by: string
          reason?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          reason?: string | null
          expires_at?: string | null
        }
        Relationships: []
      }
      room_moderation_actions: {
        Row: {
          id: string
          room_id: string
          action_by: string
          target_user_id: string | null
          message_id: string | null
          action_type:
            | 'remove_message'
            | 'remove_listener'
            | 'remove_speaker'
            | 'mute_speaker'
            | 'ban_user'
            | 'unban_user'
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          action_by: string
          target_user_id?: string | null
          message_id?: string | null
          action_type:
            | 'remove_message'
            | 'remove_listener'
            | 'remove_speaker'
            | 'mute_speaker'
            | 'ban_user'
            | 'unban_user'
          reason?: string | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      increment_question_vote: { Args: { qid: string }; Returns: void }
      decrement_question_vote: { Args: { qid: string }; Returns: void }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
