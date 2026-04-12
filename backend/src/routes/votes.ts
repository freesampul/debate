import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { voteLimiter } from '../middleware/rateLimit'
import { supabase } from '../lib/supabase'
import type { Vote, VoteCounts } from '../types'

const router = Router({ mergeParams: true })

const castVoteSchema = z.object({
  side: z.enum(['for', 'against']),
})

// POST /rooms/:id/vote — cast or change vote
router.post(
  '/',
  requireAuth,
  voteLimiter,
  validate(castVoteSchema),
  async (req: Request, res: Response): Promise<void> => {
    const roomId = req.params.id
    const userId = req.user.id
    const { side } = req.body as z.infer<typeof castVoteSchema>

    // Verify the room exists and is live
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, status')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    if (room.status !== 'live') {
      res.status(400).json({ error: 'Voting is only allowed in live rooms' })
      return
    }

    // Upsert — one vote per user per room (enforced by UNIQUE constraint too)
    const { data, error } = await supabase
      .from('votes')
      .upsert(
        { room_id: roomId, user_id: userId, side },
        { onConflict: 'room_id,user_id' }
      )
      .select('id, room_id, user_id, side, created_at')
      .single()

    if (error || !data) {
      console.error('[votes] Cast failed:', error)
      res.status(500).json({ error: 'Internal server error' })
      return
    }

    res.json({ ok: true, vote: data as Vote })
  }
)

// GET /rooms/:id/votes — get current vote counts
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const roomId = req.params.id

  const { data, error } = await supabase
    .from('votes')
    .select('side')
    .eq('room_id', roomId)

  if (error) {
    console.error('[votes] Fetch failed:', error)
    res.status(500).json({ error: 'Internal server error' })
    return
  }

  const counts: VoteCounts = { for: 0, against: 0, total: 0 }
  for (const row of data ?? []) {
    if (row.side === 'for') counts.for++
    else if (row.side === 'against') counts.against++
  }
  counts.total = counts.for + counts.against

  res.json({ counts })
})

export default router
