import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { livekitTokenLimiter } from '../middleware/rateLimit'
import { supabase } from '../lib/supabase'
import { createLiveKitToken } from '../lib/livekit'

const router = Router()

const tokenRequestSchema = z.object({
  room_id: z.string().uuid(),
})

// POST /livekit/token — generate a scoped LiveKit access token
router.post(
  '/token',
  requireAuth,
  livekitTokenLimiter,
  validate(tokenRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id
    const { room_id } = req.body as z.infer<typeof tokenRequestSchema>

    // Verify the room exists and is not ended
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, livekit_room, status')
      .eq('id', room_id)
      .single()

    if (roomError || !room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    if (room.status === 'ended') {
      res.status(400).json({ error: 'Room has ended' })
      return
    }

    if (!room.livekit_room) {
      res.status(400).json({ error: 'Room has no LiveKit session' })
      return
    }

    // Verify the user is a participant in this room
    const { data: participant, error: participantError } = await supabase
      .from('room_participants')
      .select('role, left_at')
      .eq('room_id', room_id)
      .eq('user_id', userId)
      .single()

    if (participantError || !participant) {
      res.status(403).json({ error: 'You must join the room before requesting a token' })
      return
    }

    if (participant.left_at !== null) {
      res.status(403).json({ error: 'You have already left this room' })
      return
    }

    const canPublish = participant.role === 'speaker'

    // Fetch username so tiles can display real names without a separate lookup
    const { data: profile } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', userId)
      .single()

    const participantMetadata = JSON.stringify({
      username: profile?.username ?? userId,
      avatar_url: profile?.avatar_url ?? null,
    })

    const token = await createLiveKitToken({
      roomName: room.livekit_room,
      participantIdentity: userId,
      canPublish,
      participantMetadata,
    })

    res.json({ token, livekit_url: process.env.LIVEKIT_URL })
  }
)

export default router
