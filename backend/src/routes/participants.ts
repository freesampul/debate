import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { supabase } from '../lib/supabase'
import type { ParticipantRole, MediaType, RoomParticipantWithUser } from '../types'

const router = Router({ mergeParams: true })

const moderationReasonSchema = z.object({
  reason: z.string().max(300).trim().optional(),
})

// GET /rooms/:id/participants — list active participants with user profile data
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const roomId = req.params.id

  const { data, error } = await supabase
    .from('room_participants')
    .select(`
      id,
      user_id,
      role,
      media_type,
      joined_at,
      left_at,
      users (
        username,
        avatar_url
      )
    `)
    .eq('room_id', roomId)
    .is('left_at', null)
    .order('joined_at', { ascending: true })

  if (error) {
    console.error('[participants] Fetch failed:', error)
    res.status(500).json({ error: 'Internal server error' })
    return
  }

  const participants: RoomParticipantWithUser[] = (data ?? []).map((p) => {
    const user = p.users as { username: string; avatar_url: string | null } | null
    return {
      id: p.id,
      room_id: roomId,
      user_id: p.user_id,
      role: p.role as ParticipantRole,
      media_type: p.media_type as MediaType,
      joined_at: p.joined_at,
      left_at: null,
      username: user?.username ?? p.user_id,
      avatar_url: user?.avatar_url ?? null,
    }
  })

  res.json({ participants })
})

// POST /rooms/:id/participants/:userId/remove — host removes a participant from the room
router.post(
  '/:userId/remove',
  requireAuth,
  validate(moderationReasonSchema),
  async (req: Request, res: Response): Promise<void> => {
    const roomId = req.params.id
    const targetUserId = req.params.userId
    const hostId = req.user.id
    const { reason } = req.body as z.infer<typeof moderationReasonSchema>

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, host_id')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    if (room.host_id !== hostId) {
      res.status(403).json({ error: 'Only the host can remove participants' })
      return
    }

    if (targetUserId === hostId) {
      res.status(400).json({ error: 'Host cannot remove themselves' })
      return
    }

    const { data: participant, error: participantError } = await supabase
      .from('room_participants')
      .select('user_id, role, left_at')
      .eq('room_id', roomId)
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (participantError || !participant || participant.left_at !== null) {
      res.status(404).json({ error: 'Active participant not found' })
      return
    }

    const { error: removeError } = await supabase
      .from('room_participants')
      .update({ left_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', targetUserId)
      .is('left_at', null)

    if (removeError) {
      console.error('[participants] Remove failed:', removeError)
      res.status(500).json({ error: 'Internal server error' })
      return
    }

    await supabase.from('room_moderation_actions').insert({
      room_id: roomId,
      action_by: hostId,
      target_user_id: targetUserId,
      action_type: participant.role === 'speaker' ? 'remove_speaker' : 'remove_listener',
      reason: reason ?? null,
    })

    res.json({ ok: true })
  },
)

// POST /rooms/:id/participants/:userId/ban — host bans a participant from the room
router.post(
  '/:userId/ban',
  requireAuth,
  validate(moderationReasonSchema),
  async (req: Request, res: Response): Promise<void> => {
    const roomId = req.params.id
    const targetUserId = req.params.userId
    const hostId = req.user.id
    const { reason } = req.body as z.infer<typeof moderationReasonSchema>

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, host_id')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    if (room.host_id !== hostId) {
      res.status(403).json({ error: 'Only the host can ban participants' })
      return
    }

    if (targetUserId === hostId) {
      res.status(400).json({ error: 'Host cannot ban themselves' })
      return
    }

    const { error: banError } = await supabase
      .from('room_bans')
      .upsert({
        room_id: roomId,
        user_id: targetUserId,
        banned_by: hostId,
        reason: reason ?? null,
      })

    if (banError) {
      console.error('[participants] Ban failed:', banError)
      res.status(500).json({ error: 'Internal server error' })
      return
    }

    await supabase
      .from('room_participants')
      .update({ left_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', targetUserId)
      .is('left_at', null)

    await supabase.from('room_moderation_actions').insert({
      room_id: roomId,
      action_by: hostId,
      target_user_id: targetUserId,
      action_type: 'ban_user',
      reason: reason ?? null,
    })

    res.json({ ok: true })
  },
)

export default router
