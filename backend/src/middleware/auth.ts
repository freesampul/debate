import { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase'

/**
 * Verifies the Supabase JWT from the Authorization header.
 * Populates req.user with the verified user ID and email.
 * Never trusts any user ID from the request body or params.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' })
    return
  }

  const token = authHeader.slice(7)

  // Dev bypass — accept the fake token from the mobile dev build
  if (process.env.NODE_ENV !== 'production' && token === 'dev-token') {
    req.user = {
      id: 'a0df7ecd-d580-426a-8b65-ff7d0ec5b400',
      email: 'dev@debate.local',
    }
    next()
    return
  }

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  const email = data.user.email
  if (!email) {
    res.status(401).json({ error: 'Invalid token: missing email' })
    return
  }

  req.user = {
    id: data.user.id,
    email,
  }

  next()
}
