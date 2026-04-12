import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { supabase } from '../lib/supabase'
import type { Notification } from '../types'

const router = Router()

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user.id

  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, type, data, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[notifications] List failed:', error)
    res.status(500).json({ error: 'Internal server error' })
    return
  }

  res.json({ notifications: (data ?? []) as Notification[] })
})

router.post('/:id/read', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user.id
  const { id } = req.params

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('[notifications] Mark read failed:', error)
    res.status(500).json({ error: 'Internal server error' })
    return
  }

  res.json({ ok: true })
})

export default router
