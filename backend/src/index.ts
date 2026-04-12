import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { generalLimiter } from './middleware/rateLimit'
import roomsRouter from './routes/rooms'
import votesRouter from './routes/votes'
import livekitRouter from './routes/livekit'
import questionsRouter from './routes/questions'
import participantsRouter from './routes/participants'
import invitesRouter from './routes/invites'
import messagesRouter from './routes/messages'
import usersRouter from './routes/users'
import notificationsRouter from './routes/notifications'

const app = express()
const port = process.env.PORT ?? 3000

// CORS — explicit allowlist in production; in dev allow LAN + Metro (devices use http://<host>:<port>)
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? (process.env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim())
        : true,
    credentials: true,
  })
)

app.use(express.json())

// Request logger (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[req] ${req.method} ${req.path}`)
    next()
  })
}

// Global rate limit — applied before all routes
app.use(generalLimiter)

// Routes
app.use('/api/v1/rooms', roomsRouter)
app.use('/api/v1/rooms/:id/votes', votesRouter)
app.use('/api/v1/rooms/:id/participants', participantsRouter)
app.use('/api/v1/rooms/:id/invites', invitesRouter)
app.use('/api/v1/rooms/:id/messages', messagesRouter)
app.use('/api/v1/livekit', livekitRouter)
app.use('/api/v1/questions', questionsRouter)
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/notifications', notificationsRouter)

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

// Generic 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`[server] Listening on http://0.0.0.0:${port}`)
})
