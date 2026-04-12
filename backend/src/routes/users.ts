import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types'

const router = Router()

const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).trim().regex(/^[a-zA-Z0-9_]+$/),
  display_name: z.string().min(1).max(50).trim().nullable().optional(),
  bio: z.string().max(280).trim().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
})

async function getUserIdentity(userId: string): Promise<{
  id: string
  username: string
  display_name: string | null
} | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, display_name')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data
}

async function buildProfile(viewerId: string, targetUserId: string): Promise<UserProfile | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, avatar_url, display_name, bio, created_at, updated_at')
    .eq('id', targetUserId)
    .single()

  if (error || !user) return null

  const [
    { count: followerCount },
    { count: followingCount },
    { count: hostedRoomCount },
    { count: speakerRoomCount },
    { data: followRow },
  ] = await Promise.all([
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', targetUserId),
    supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', targetUserId),
    supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('host_id', targetUserId),
    supabase
      .from('room_participants')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetUserId)
      .eq('role', 'speaker'),
    viewerId === targetUserId
      ? Promise.resolve({ data: null })
      : supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', viewerId)
          .eq('following_id', targetUserId)
          .maybeSingle(),
  ])

  return {
    ...user,
    follower_count: followerCount ?? 0,
    following_count: followingCount ?? 0,
    hosted_room_count: hostedRoomCount ?? 0,
    speaker_room_count: speakerRoomCount ?? 0,
    is_following: viewerId === targetUserId ? false : Boolean(followRow),
  }
}

router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const profile = await buildProfile(req.user.id, req.user.id)
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' })
    return
  }
  res.json({ profile })
})

router.patch(
  '/me',
  requireAuth,
  validate(updateProfileSchema),
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id
    const { username, display_name, bio, avatar_url } = req.body as z.infer<typeof updateProfileSchema>

    const { error } = await supabase
      .from('users')
      .update({
        username,
        display_name: display_name ?? null,
        bio: bio ?? null,
        avatar_url: avatar_url ?? null,
      })
      .eq('id', userId)

    if (error) {
      if (error.code === '23505') {
        res.status(409).json({ error: 'Username is already taken' })
        return
      }
      console.error('[users] Update profile failed:', error)
      res.status(500).json({ error: 'Internal server error' })
      return
    }

    const profile = await buildProfile(userId, userId)
    res.json({ profile })
  },
)

router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const profile = await buildProfile(req.user.id, req.params.id)
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' })
    return
  }
  res.json({ profile })
})

router.post('/:id/follow', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const followerId = req.user.id
  const followingId = req.params.id

  if (followerId === followingId) {
    res.status(400).json({ error: 'You cannot follow yourself' })
    return
  }

  const { error } = await supabase
    .from('follows')
    .upsert({ follower_id: followerId, following_id: followingId })

  if (error) {
    console.error('[users] Follow failed:', error)
    res.status(500).json({ error: 'Internal server error' })
    return
  }

  const follower = await getUserIdentity(followerId)

  await supabase.from('notifications').insert({
    user_id: followingId,
    type: 'follow',
    data: {
      follower_id: followerId,
      follower_username: follower?.username ?? null,
      follower_display_name: follower?.display_name ?? null,
    },
  })

  res.json({ ok: true })
})

router.delete('/:id/follow', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const followerId = req.user.id
  const followingId = req.params.id

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)

  if (error) {
    console.error('[users] Unfollow failed:', error)
    res.status(500).json({ error: 'Internal server error' })
    return
  }

  res.json({ ok: true })
})

export default router
