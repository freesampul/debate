import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { supabase } from '../lib/supabase'
import type { Question, Room } from '../types'

const router = Router()

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

async function getQuestionContentMap(questionIds: Array<string | null>): Promise<Map<string, string>> {
  const ids = Array.from(new Set(questionIds.filter((id): id is string => Boolean(id))))
  if (ids.length === 0) return new Map()

  const { data } = await supabase
    .from('questions')
    .select('id, content')
    .in('id', ids)

  return new Map((data ?? []).map((question) => [question.id, question.content]))
}

async function notifyFollowersOfQuestion(userId: string, question: Question): Promise<void> {
  const { data: followers } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', userId)

  if (!followers || followers.length === 0) return

  const actor = await getUserIdentity(userId)

  await supabase.from('notifications').insert(
    followers
      .filter((row) => row.follower_id !== userId)
      .map((row) => ({
        user_id: row.follower_id,
        type: 'question_posted' as const,
        data: {
          question_id: question.id,
          question_content: question.content,
          actor_user_id: userId,
          actor_username: actor?.username ?? null,
          actor_display_name: actor?.display_name ?? null,
        },
      })),
  )
}

const createQuestionSchema = z.object({
  content: z.string().min(10).max(300).trim(),
})

const reportRoomSchema = z.object({
  category: z.enum([
    'harassment',
    'hate_or_abuse',
    'spam',
    'sexual_content',
    'violent_or_dangerous',
    'impersonation',
    'off_topic_disruption',
  ]),
  details: z.string().max(500).trim().optional(),
})

// GET /questions — list open questions sorted by votes then recency
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('questions')
    .select('id, content, submitted_by, vote_count, status, created_at')
    .in('status', ['open', 'in_debate'])
    .order('vote_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[questions] List failed:', error)
    res.status(500).json({ error: 'Internal server error' })
    return
  }

  res.json({ questions: data })
})

// GET /questions/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params

  const { data, error } = await supabase
    .from('questions')
    .select('id, content, submitted_by, vote_count, status, created_at')
    .eq('id', id)
    .single()

  if (error || !data) {
    res.status(404).json({ error: 'Question not found' })
    return
  }

  const { data: liveRoomRows, error: liveRoomsError } = await supabase
    .from('rooms')
    .select('id, title, topic, status, host_id, livekit_room, max_speakers, question_id, recording_url, created_at, ended_at')
    .eq('question_id', id)
    .in('status', ['waiting', 'live'])
    .order('created_at', { ascending: false })
    .limit(20)

  if (liveRoomsError) {
    console.error('[questions] Live rooms fetch failed:', liveRoomsError)
    res.status(500).json({ error: 'Internal server error' })
    return
  }

  const { data: recentRoomRows, error: recentRoomsError } = await supabase
    .from('rooms')
    .select('id, title, topic, status, host_id, livekit_room, max_speakers, question_id, recording_url, created_at, ended_at')
    .eq('question_id', id)
    .eq('status', 'ended')
    .order('ended_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20)

  if (recentRoomsError) {
    console.error('[questions] Recent rooms fetch failed:', recentRoomsError)
    res.status(500).json({ error: 'Internal server error' })
    return
  }

  const questionContentMap = await getQuestionContentMap([
    ...(liveRoomRows ?? []).map((room) => room.question_id),
    ...(recentRoomRows ?? []).map((room) => room.question_id),
  ])

  const mapRoom = (room: {
    id: string
    title: string
    topic: string
    status: Room['status']
    host_id: string
    livekit_room: string | null
    max_speakers: number
    question_id: string | null
    recording_url: string | null
    created_at: string
    ended_at: string | null
  }): Room => ({
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
  })

  const liveRooms = (liveRoomRows ?? []).map(mapRoom)
  const recentRooms = (recentRoomRows ?? []).map(mapRoom)

  res.json({
    question: data as Question,
    activeRoom: liveRooms[0] ?? null,
    liveRooms,
    recentRooms,
  })
})

// POST /questions — submit a question
router.post(
  '/',
  requireAuth,
  validate(createQuestionSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { content } = req.body as z.infer<typeof createQuestionSchema>
    const userId = req.user.id

    const { data, error } = await supabase
      .from('questions')
      .insert({ content, submitted_by: userId, vote_count: 0, status: 'open' })
      .select('id, content, submitted_by, vote_count, status, created_at')
      .single()

    if (error || !data) {
      console.error('[questions] Create failed:', error)
      res.status(500).json({ error: 'Internal server error' })
      return
    }

    await notifyFollowersOfQuestion(userId, data as Question)

    res.status(201).json({ question: data as Question })
  }
)

// POST /questions/:id/vote — upvote (toggle)
router.post('/:id/vote', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const userId = req.user.id

  // Check if already voted
  const { data: existing } = await supabase
    .from('question_votes')
    .select('question_id')
    .eq('question_id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    // Toggle off — remove vote
    await supabase.from('question_votes').delete().eq('question_id', id).eq('user_id', userId)
    await supabase.rpc('decrement_question_vote', { qid: id })
    res.json({ voted: false })
  } else {
    // Add vote
    const { error } = await supabase.from('question_votes').insert({ question_id: id, user_id: userId })
    if (error) {
      res.status(500).json({ error: 'Internal server error' })
      return
    }
    await supabase.rpc('increment_question_vote', { qid: id })
    res.json({ voted: true })
  }
})

// POST /questions/:id/report-room/:roomId — report a room
router.post(
  '/:id/report-room/:roomId',
  requireAuth,
  validate(reportRoomSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { roomId } = req.params
    const reporterUserId = req.user.id
    const { category, details } = req.body as z.infer<typeof reportRoomSchema>

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, host_id, question_id')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    const { error: reportError } = await supabase
      .from('moderation_reports')
      .insert({
        reporter_user_id: reporterUserId,
        room_id: roomId,
        reported_user_id: room.host_id,
        category,
        details: details ?? null,
      })

    if (reportError && reportError.code !== '23505') {
      console.error('[questions] Room report failed:', reportError)
      res.status(500).json({ error: 'Internal server error' })
      return
    }

    res.status(201).json({ ok: true })
  },
)

export default router
