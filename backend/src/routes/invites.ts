import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { supabase } from '../lib/supabase'
import type { SpeakerInvite, SpeakerInviteWithUser, InviteStatus } from '../types'

const router = Router({ mergeParams: true })

const createInviteSchema = z.object({
  invited_user_id: z.string().uuid(),
})

// GET /rooms/:id/invites — list pending/accepted invites for a room
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const roomId = req.params.id

  const { data, error } = await supabase
    .from('speaker_invites')
    .select(`
      id,
      room_id,
      invited_by,
      invited_user_id,
      status,
      created_at,
      responded_at,
      users!speaker_invites_invited_user_id_fkey (
        username,
        avatar_url
      )
    `)
    .eq('room_id', roomId)
    .in('status', ['pending', 'accepted'])
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[invites] List failed:', error)
    res.status(500).json({ error: 'Internal server error' })
    return
  }

  const invites: SpeakerInviteWithUser[] = (data ?? []).map((inv) => {
    const user = inv.users as { username: string; avatar_url: string | null } | null
    return {
      id: inv.id,
      room_id: inv.room_id,
      invited_by: inv.invited_by,
      invited_user_id: inv.invited_user_id,
      status: inv.status as InviteStatus,
      created_at: inv.created_at,
      responded_at: inv.responded_at,
      username: user?.username ?? inv.invited_user_id,
      avatar_url: user?.avatar_url ?? null,
    }
  })

  res.json({ invites })
})

// POST /rooms/:id/invites — host invites a user to speak
router.post(
  '/',
  requireAuth,
  validate(createInviteSchema),
  async (req: Request, res: Response): Promise<void> => {
    const roomId = req.params.id
    const hostId = req.user.id
    const { invited_user_id } = req.body as z.infer<typeof createInviteSchema>

    // Verify the requesting user is the room host
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, host_id, status, max_speakers')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    if (room.host_id !== hostId) {
      res.status(403).json({ error: 'Only the host can invite speakers' })
      return
    }

    if (room.status === 'ended') {
      res.status(400).json({ error: 'Room has ended' })
      return
    }

    if (invited_user_id === hostId) {
      res.status(400).json({ error: 'Host cannot invite themselves' })
      return
    }

    // Check speaker cap: pending + accepted invites + active speakers
    const { count: existingCount } = await supabase
      .from('speaker_invites')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .in('status', ['pending', 'accepted'])

    const { count: activeSpeakerCount } = await supabase
      .from('room_participants')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('role', 'speaker')
      .is('left_at', null)

    if (((existingCount ?? 0) + (activeSpeakerCount ?? 0)) >= room.max_speakers) {
      res.status(400).json({ error: 'Speaker slots are full' })
      return
    }

    const { data: invite, error: inviteError } = await supabase
      .from('speaker_invites')
      .insert({
        room_id: roomId,
        invited_by: hostId,
        invited_user_id,
        status: 'pending',
      })
      .select('id, room_id, invited_by, invited_user_id, status, created_at, responded_at')
      .single()

    if (inviteError || !invite) {
      // Unique constraint violation = already invited
      if (inviteError?.code === '23505') {
        res.status(409).json({ error: 'User already invited to this room' })
        return
      }
      console.error('[invites] Create failed:', inviteError)
      res.status(500).json({ error: 'Internal server error' })
      return
    }

    // Create notification for the invited user
    await supabase.from('notifications').insert({
      user_id: invited_user_id,
      type: 'room_invite',
      data: { room_id: roomId, invited_by: hostId, invite_id: invite.id },
    })

    res.status(201).json({ invite: invite as SpeakerInvite })
  }
)

// POST /rooms/:id/invites/:inviteId/accept
router.post(
  '/:inviteId/accept',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const { id: roomId, inviteId } = req.params
    const userId = req.user.id

    const { data: invite, error: fetchError } = await supabase
      .from('speaker_invites')
      .select('id, room_id, invited_by, invited_user_id, status')
      .eq('id', inviteId)
      .eq('room_id', roomId)
      .single()

    if (fetchError || !invite) {
      res.status(404).json({ error: 'Invite not found' })
      return
    }

    if (invite.invited_user_id !== userId) {
      res.status(403).json({ error: 'Not your invite' })
      return
    }

    if (invite.status !== 'pending') {
      res.status(400).json({ error: `Invite is already ${invite.status}` })
      return
    }

    const { error: updateError } = await supabase
      .from('speaker_invites')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', inviteId)

    if (updateError) {
      console.error('[invites] Accept failed:', updateError)
      res.status(500).json({ error: 'Internal server error' })
      return
    }

    // Notify the host
    await supabase.from('notifications').insert({
      user_id: invite.invited_by,
      type: 'invite_accepted',
      data: { room_id: roomId, accepted_by: userId, invite_id: inviteId },
    })

    res.json({ ok: true })
  }
)

// POST /rooms/:id/invites/:inviteId/decline
router.post(
  '/:inviteId/decline',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const { id: roomId, inviteId } = req.params
    const userId = req.user.id

    const { data: invite, error: fetchError } = await supabase
      .from('speaker_invites')
      .select('id, room_id, invited_by, invited_user_id, status')
      .eq('id', inviteId)
      .eq('room_id', roomId)
      .single()

    if (fetchError || !invite) {
      res.status(404).json({ error: 'Invite not found' })
      return
    }

    if (invite.invited_user_id !== userId) {
      res.status(403).json({ error: 'Not your invite' })
      return
    }

    if (invite.status !== 'pending') {
      res.status(400).json({ error: `Invite is already ${invite.status}` })
      return
    }

    const { error: updateError } = await supabase
      .from('speaker_invites')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('id', inviteId)

    if (updateError) {
      console.error('[invites] Decline failed:', updateError)
      res.status(500).json({ error: 'Internal server error' })
      return
    }

    // Notify the host
    await supabase.from('notifications').insert({
      user_id: invite.invited_by,
      type: 'invite_declined',
      data: { room_id: roomId, declined_by: userId, invite_id: inviteId },
    })

    res.json({ ok: true })
  }
)

export default router
