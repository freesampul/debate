import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { roomCreateLimiter } from '../middleware/rateLimit'
import { supabase } from '../lib/supabase'
import type { Room, RoomParticipant, ParticipantRole, MediaType } from '../types'

const router = Router()

async function getQuestionContentMap(questionIds: Array<string | null>): Promise<Map<string, string>> {
  const ids = Array.from(new Set(questionIds.filter((id): id is string => Boolean(id))))
  if (ids.length === 0) return new Map()

  const { data } = await supabase
    .from('questions')
    .select('id, content')
    .in('id', ids)

  return new Map((data ?? []).map((question) => [question.id, question.content]))
}

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

async function getQuestionContent(questionId: string | null): Promise<string | null> {
  if (!questionId) return null

  const { data, error } = await supabase
    .from('questions')
    .select('content')
    .eq('id', questionId)
    .single()

  if (error || !data) return null
  return data.content
}

async function notifyFollowers(
  actorUserId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const { data: followers } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', actorUserId)

  if (!followers || followers.length === 0) return

  const actor = await getUserIdentity(actorUserId)

  await supabase.from('notifications').insert(
    followers.map((row) => ({
      user_id: row.follower_id,
      type: 'speaker_live' as const,
      data: {
        ...data,
        actor_user_id: actorUserId,
        actor_username: actor?.username ?? null,
        actor_display_name: actor?.display_name ?? null,
      },
    })),
  )
}

async function notifyQuestionVoters(questionId: string, roomId: string, hostId: string): Promise<void> {
  const { data: voters } = await supabase
    .from('question_votes')
    .select('user_id')
    .eq('question_id', questionId)

  if (!voters || voters.length === 0) return

  const uniqueUserIds = Array.from(new Set(voters.map((row) => row.user_id))).filter((userId) => userId !== hostId)
  if (uniqueUserIds.length === 0) return

  const [host, questionContent, room] = await Promise.all([
    getUserIdentity(hostId),
    getQuestionContent(questionId),
    supabase.from('rooms').select('title').eq('id', roomId).single(),
  ])

  await supabase.from('notifications').insert(
    uniqueUserIds.map((userId) => ({
      user_id: userId,
      type: 'question_live' as const,
      data: {
        question_id: questionId,
        room_id: roomId,
        host_id: hostId,
        host_username: host?.username ?? null,
        host_display_name: host?.display_name ?? null,
        question_content: questionContent,
        room_title: room.data?.title ?? null,
      },
    })),
  )
}

// Zod schemas

const createRoomSchema = z.object({
  title: z.string().min(3).max(100).trim(),
  topic: z.string().min(10).max(500).trim(),
  max_speakers: z.number().int().min(2).max(4),
  question_id: z.string().uuid(),
})

const joinRoomSchema = z.object({
  role: z.enum(['speaker', 'audience']),
  media_type: z.enum(['audio', 'video']).default('audio'),
})

// GET /rooms — list live and recent rooms
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('rooms')
    .select('id, title, topic, status, host_id, livekit_room, max_speakers, question_id, recording_url, created_at, ended_at')
    .in('status', ['waiting', 'live'])
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[rooms] List failed:', error)
    res.status(500).json({ error: 'Internal server error' })
    return
  }

  const questionContentMap = await getQuestionContentMap((data ?? []).map((room) => room.question_id))

  const rooms: Room[] = (data ?? []).map((room) => ({
    id: room.id,
    title: room.title,
    topic: room.topic,
    status: room.status,
    host_id: room.host_id,
    livekit_room: room.livekit_room,
    max_speakers: room.max_speakers,
    question_id: room.question_id,
    question_content: room.question_id ? (questionContentMap.get(room.question_id) ?? null) : null,
    recording_url: room.recording_url,
    created_at: room.created_at,
    ended_at: room.ended_at,
  }))

  res.json({ rooms })
})

// GET /rooms/:id — get room details
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params

  const { data, error } = await supabase
    .from('rooms')
    .select('id, title, topic, status, host_id, livekit_room, max_speakers, question_id, recording_url, created_at, ended_at')
    .eq('id', id)
    .single()

  if (error || !data) {
    res.status(404).json({ error: 'Room not found' })
    return
  }

  const questionContentMap = await getQuestionContentMap([data.question_id])

  const room: Room = {
    id: data.id,
    title: data.title,
    topic: data.topic,
    status: data.status,
    host_id: data.host_id,
    livekit_room: data.livekit_room,
    max_speakers: data.max_speakers,
    question_id: data.question_id,
    question_content: data.question_id ? (questionContentMap.get(data.question_id) ?? null) : null,
    recording_url: data.recording_url,
    created_at: data.created_at,
    ended_at: data.ended_at,
  }

  res.json({ room })
})

// POST /rooms — create a room
router.post(
  '/',
  requireAuth,
  roomCreateLimiter,
  validate(createRoomSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { title, topic, max_speakers, question_id } = req.body as z.infer<typeof createRoomSchema>
    const hostId = req.user.id

    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id, status')
      .eq('id', question_id)
      .single()

    if (questionError || !question) {
      res.status(404).json({ error: 'Question not found' })
      return
    }

    if (question.status === 'closed') {
      res.status(400).json({ error: 'This question is closed and cannot be used for a new room' })
      return
    }

    // Generate a unique LiveKit room name
    const livekitRoom = `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        title,
        topic,
        max_speakers,
        host_id: hostId,
        livekit_room: livekitRoom,
        status: 'waiting',
        question_id,
      })
      .select('id, title, topic, status, host_id, livekit_room, max_speakers, question_id, created_at, ended_at')
      .single()

    if (error || !data) {
      console.error('[rooms] Create failed:', error)
      res.status(500).json({ error: 'Internal server error' })
      return
    }

    await supabase
      .from('questions')
      .update({ status: 'in_debate' })
      .eq('id', question_id)

    res.status(201).json({ room: data as Room })
  }
)

// POST /rooms/:id/join
router.post(
  '/:id/join',
  requireAuth,
  validate(joinRoomSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    const userId = req.user.id
    const { role, media_type } = req.body as z.infer<typeof joinRoomSchema>

    // Fetch the room to verify it exists and is joinable
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, host_id, status, max_speakers, question_id, title')
      .eq('id', id)
      .single()

    if (roomError || !room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    if (room.status === 'ended') {
      res.status(400).json({ error: 'Room has ended' })
      return
    }

    const { data: ban } = await supabase
      .from('room_bans')
      .select('user_id, expires_at')
      .eq('room_id', id)
      .eq('user_id', userId)
      .maybeSingle()

    if (ban && (!ban.expires_at || new Date(ban.expires_at).getTime() > Date.now())) {
      res.status(403).json({ error: 'You are banned from this room' })
      return
    }

    // Audience can only join once the debate is live
    if (role === 'audience' && room.status === 'waiting') {
      res.status(400).json({ error: 'Room is not live yet' })
      return
    }

    // Speakers must be the host or have an accepted invite
    if (role === 'speaker' && room.host_id !== userId) {
      const { data: invite } = await supabase
        .from('speaker_invites')
        .select('id')
        .eq('room_id', id)
        .eq('invited_user_id', userId)
        .eq('status', 'accepted')
        .maybeSingle()

      if (!invite) {
        res.status(403).json({ error: 'Speaker access requires an accepted invite from the host' })
        return
      }
    }

    // If joining as speaker, enforce the speaker cap
    if (role === 'speaker') {
      const { count, error: countError } = await supabase
        .from('room_participants')
        .select('id', { count: 'exact', head: true })
        .eq('room_id', id)
        .eq('role', 'speaker')
        .is('left_at', null)

      if (countError) {
        console.error('[rooms] Speaker count failed:', countError)
        res.status(500).json({ error: 'Internal server error' })
        return
      }

      if ((count ?? 0) >= room.max_speakers) {
        res.status(400).json({ error: 'Room is at speaker capacity' })
        return
      }
    }

    // Upsert participation record
    const { data, error } = await supabase
      .from('room_participants')
      .upsert(
        {
          room_id: id,
          user_id: userId,
          role: role as ParticipantRole,
          media_type: media_type as MediaType,
          left_at: null,
        },
        { onConflict: 'room_id,user_id' }
      )
      .select('id, room_id, user_id, role, media_type, joined_at, left_at')
      .single()

    if (error || !data) {
      console.error('[rooms] Join failed:', error)
      res.status(500).json({ error: 'Internal server error' })
      return
    }

    if (role === 'speaker') {
      await notifyFollowers(userId, {
        room_id: id,
        speaker_id: userId,
        question_id: room.question_id ?? null,
        room_title: room.title ?? null,
        question_content: await getQuestionContent(room.question_id ?? null),
      })
    }

    res.json({ participant: data as RoomParticipant })
  }
)

// POST /rooms/:id/leave
router.post('/:id/leave', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const userId = req.user.id

  const { error } = await supabase
    .from('room_participants')
    .update({ left_at: new Date().toISOString() })
    .eq('room_id', id)
    .eq('user_id', userId)
    .is('left_at', null)

  if (error) {
    console.error('[rooms] Leave failed:', error)
    res.status(500).json({ error: 'Internal server error' })
    return
  }

  res.json({ ok: true })
})

// POST /rooms/:id/start — host only, waiting → live
router.post('/:id/start', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const userId = req.user.id

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, host_id, status, question_id, title')
    .eq('id', id)
    .single()

  if (roomError || !room) {
    res.status(404).json({ error: 'Room not found' })
    return
  }

  if (room.host_id !== userId) {
    res.status(403).json({ error: 'Only the host can start this room' })
    return
  }

  if (room.status !== 'waiting') {
    res.status(400).json({ error: 'Room is not in waiting state' })
    return
  }

  const { error } = await supabase
    .from('rooms')
    .update({ status: 'live' })
    .eq('id', id)

  if (error) {
    console.error('[rooms] Start failed:', error)
    res.status(500).json({ error: 'Internal server error' })
    return
  }

  await notifyFollowers(userId, {
    room_id: id,
    host_id: userId,
    question_id: room.question_id ?? null,
    room_title: room.title ?? null,
    question_content: await getQuestionContent(room.question_id ?? null),
  })

  if (room.question_id) {
    await notifyQuestionVoters(room.question_id, id, userId)
  }

  res.json({ ok: true })
})

// POST /rooms/:id/end — host only
router.post('/:id/end', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const userId = req.user.id

  // Fetch room and verify host ownership
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, host_id, status, question_id')
    .eq('id', id)
    .single()

  if (roomError || !room) {
    res.status(404).json({ error: 'Room not found' })
    return
  }

  if (room.host_id !== userId) {
    res.status(403).json({ error: 'Only the host can end this room' })
    return
  }

  if (room.status === 'ended') {
    res.status(400).json({ error: 'Room has already ended' })
    return
  }

  const { error } = await supabase
    .from('rooms')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[rooms] End failed:', error)
    res.status(500).json({ error: 'Internal server error' })
    return
  }

  if (room.question_id) {
    const { count: activeRoomCount } = await supabase
      .from('rooms')
      .select('id', { count: 'exact', head: true })
      .eq('question_id', room.question_id)
      .in('status', ['waiting', 'live'])

    if ((activeRoomCount ?? 0) === 0) {
      await supabase
        .from('questions')
        .update({ status: 'open' })
        .eq('id', room.question_id)
        .neq('status', 'closed')
    }
  }

  res.json({ ok: true })
})

export default router
