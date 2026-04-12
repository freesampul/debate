import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { chatLimiter } from '../middleware/rateLimit'
import { supabase } from '../lib/supabase'
import { moderateMessageContent } from '../lib/moderation'
import type { Message } from '../types'

const router = Router({ mergeParams: true })

const sendMessageSchema = z.object({
  content: z.string().min(1).max(500).trim(),
})

const reportMessageSchema = z.object({
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

// POST /rooms/:id/messages — send a chat message
router.post(
  '/',
  requireAuth,
  chatLimiter,
  validate(sendMessageSchema),
  async (req: Request, res: Response): Promise<void> => {
    const roomId = req.params.id
    const userId = req.user.id
    const { content } = req.body as z.infer<typeof sendMessageSchema>

    // Verify room exists and is not ended
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, status')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    if (room.status === 'ended') {
      res.status(400).json({ error: 'Room has ended' })
      return
    }

    const { data: participant } = await supabase
      .from('room_participants')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .is('left_at', null)
      .maybeSingle()

    if (!participant) {
      res.status(403).json({ error: 'You must join the room before sending messages' })
      return
    }

    const { data: ban } = await supabase
      .from('room_bans')
      .select('user_id, expires_at')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .maybeSingle()

    if (ban && (!ban.expires_at || new Date(ban.expires_at).getTime() > Date.now())) {
      res.status(403).json({ error: 'You are banned from this room' })
      return
    }

    const moderation = moderateMessageContent(content)

    const { data, error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        user_id: userId,
        content,
        filtered_content: moderation.filteredContent,
        moderation_status: moderation.moderationStatus,
      })
      .select('id, room_id, user_id, content, filtered_content, moderation_status, report_count, removed_at, created_at')
      .single()

    if (error || !data) {
      console.error('[messages] Send failed:', error)
      res.status(500).json({ error: 'Internal server error' })
      return
    }

    res.status(201).json({ message: data as Message })
  }
)

// DELETE /rooms/:id/messages/:messageId — host removes a message from chat
router.delete(
  '/:messageId',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const roomId = req.params.id
    const { messageId } = req.params
    const userId = req.user.id

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, host_id')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }

    if (room.host_id !== userId) {
      res.status(403).json({ error: 'Only the host can remove chat messages' })
      return
    }

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('id, user_id, moderation_status')
      .eq('id', messageId)
      .eq('room_id', roomId)
      .single()

    if (messageError || !message) {
      res.status(404).json({ error: 'Message not found' })
      return
    }

    if (message.moderation_status === 'removed') {
      res.json({ ok: true })
      return
    }

    const { error: updateError } = await supabase
      .from('messages')
      .update({
        moderation_status: 'removed',
        filtered_content: 'Message removed by host',
        removed_at: new Date().toISOString(),
        removed_by: userId,
        moderation_reason: 'host_removed',
      })
      .eq('id', messageId)

    if (updateError) {
      console.error('[messages] Remove failed:', updateError)
      res.status(500).json({ error: 'Internal server error' })
      return
    }

    await supabase.from('room_moderation_actions').insert({
      room_id: roomId,
      action_by: userId,
      target_user_id: message.user_id,
      message_id: messageId,
      action_type: 'remove_message',
      reason: 'host_removed',
    })

    res.json({ ok: true })
  },
)

// POST /rooms/:id/messages/:messageId/report — report a message and its sender
router.post(
  '/:messageId/report',
  requireAuth,
  chatLimiter,
  validate(reportMessageSchema),
  async (req: Request, res: Response): Promise<void> => {
    const roomId = req.params.id
    const { messageId } = req.params
    const reporterUserId = req.user.id
    const { category, details } = req.body as z.infer<typeof reportMessageSchema>

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('id, room_id, user_id')
      .eq('id', messageId)
      .eq('room_id', roomId)
      .single()

    if (messageError || !message) {
      res.status(404).json({ error: 'Message not found' })
      return
    }

    const { error: reportError } = await supabase
      .from('moderation_reports')
      .insert({
        reporter_user_id: reporterUserId,
        room_id: roomId,
        message_id: messageId,
        reported_user_id: message.user_id,
        category,
        details: details ?? null,
      })

    if (reportError && reportError.code !== '23505') {
      console.error('[messages] Report failed:', reportError)
      res.status(500).json({ error: 'Internal server error' })
      return
    }

    if (!reportError) {
      const { data: existingMessage } = await supabase
        .from('messages')
        .select('report_count')
        .eq('id', messageId)
        .single()

      await supabase
        .from('messages')
        .update({ report_count: (existingMessage?.report_count ?? 0) + 1 })
        .eq('id', messageId)
    }

    res.status(201).json({ ok: true })
  },
)

export default router
