# SECURITY.md — Debate App

This document defines mandatory security rules for this codebase. All contributors (human and AI) must follow these rules without exception. When in doubt, be more restrictive, not less.

---

## 1. Authentication & Authorization

### Rules
- **All API routes must verify a Supabase JWT** using the `auth` middleware before processing any request. No exceptions.
- **Never trust client-supplied user IDs.** Always extract the user ID from the verified JWT (`req.user.id`), never from the request body or query params.
- **Row-level security (RLS) must be enabled** on all Supabase tables. The backend uses the service role key, so RLS alone isn't enough — backend must enforce ownership checks too.
- **Host-only actions** (ending a room, etc.) must verify `room.host_id === req.user.id` server-side before executing.
- **LiveKit tokens** must be generated server-side only. Never expose `LIVEKIT_API_SECRET` to the client. Tokens must be scoped to the specific room and user.

### What NOT to do
```typescript
// ❌ NEVER trust client-supplied user ID
app.post('/rooms/:id/vote', (req, res) => {
  const userId = req.body.userId  // BAD — attacker can spoof any user ID
})

// ✅ Always use verified JWT
app.post('/rooms/:id/vote', requireAuth, (req, res) => {
  const userId = req.user.id  // GOOD — extracted from verified token
})
```

---

## 2. Environment Variables & Secrets

### Rules
- **`SUPABASE_SERVICE_ROLE_KEY`** — backend only. Never referenced in mobile or any client code. Never logged.
- **`LIVEKIT_API_SECRET`** — backend only. Never referenced in mobile or any client code. Never logged.
- **`EXPO_PUBLIC_*`** variables are public by definition. Only put anon/public keys here.
- **Never commit `.env` files.** `.env` must be in `.gitignore` from day one.
- **Never log environment variables** or print full error objects that might contain them.

### .gitignore must include
```
.env
.env.local
.env.production
*.pem
*.key
```

---

## 3. Input Validation

### Rules
- **All incoming request bodies must be validated** using Zod schemas before touching the database or any other service.
- **Validate types, lengths, and allowed values.** Don't trust that a string is the right format.
- **Sanitize text content** before storing (strip HTML/script tags from chat messages, room titles, etc.).
- **Never pass raw user input** directly into SQL queries (use Supabase's query builder or parameterized queries only).

### Example pattern
```typescript
import { z } from 'zod'

const createRoomSchema = z.object({
  title: z.string().min(3).max(100).trim(),
  topic: z.string().min(10).max(500).trim(),
  max_speakers: z.number().int().min(2).max(4),
})

app.post('/rooms', requireAuth, validate(createRoomSchema), async (req, res) => {
  // req.body is now typed and validated
})
```

---

## 4. Rate Limiting

### Rules
- **All API endpoints must have rate limiting** via the `rateLimit` middleware.
- **Auth endpoints** (login, signup, token generation) must have stricter limits.
- **LiveKit token endpoint** must be rate limited — each call spins up a room connection.

### Suggested limits
| Endpoint group | Limit |
|---|---|
| Auth | 10 requests / 15 min per IP |
| Room creation | 5 rooms / hour per user |
| Voting | 10 requests / min per user |
| Chat messages | 30 messages / min per user |
| General API | 100 requests / min per IP |

---

## 5. CORS

### Rules
- **Explicitly whitelist allowed origins.** Never use `cors({ origin: '*' })` in production.
- In development, allow `localhost` origins only.
- In production, allow only the app's own domain(s).

```typescript
// ❌ Never in production
app.use(cors({ origin: '*' }))

// ✅ Explicit whitelist
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']
    : ['http://localhost:8081', 'http://localhost:3000'],
  credentials: true,
}))
```

---

## 6. Data Exposure

### Rules
- **API responses must never include sensitive fields.** When returning user objects, exclude `email` unless it's the authenticated user's own profile.
- **Never return full database rows** — always select only the fields needed.
- **Error messages in production must be generic.** Never leak stack traces, query details, or internal service errors to clients.

```typescript
// ❌ Leaks internal error details
res.status(500).json({ error: err.message, stack: err.stack })

// ✅ Generic in production
res.status(500).json({ error: 'Internal server error' })
// Log the real error server-side
console.error('[rooms] Create failed:', err)
```

---

## 7. LiveKit Security

### Rules
- **Tokens must be short-lived** — maximum 2 hours TTL.
- **Tokens must be room-scoped** — a token for room A cannot be used in room B.
- **Tokens must be user-scoped** — include the user's ID as the participant identity.
- **Never reuse tokens.** Generate a fresh token each time a user joins.
- **Validate room existence and user's right to join** before issuing a token.

---

## 8. Supabase RLS Policies

Every table must have RLS enabled with explicit policies. Baseline policies:

```sql
-- users: readable by anyone, writable only by owner
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users are publicly readable" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- rooms: readable by anyone, insertable by auth users, updatable by host
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rooms are publicly readable" ON rooms FOR SELECT USING (true);
CREATE POLICY "Auth users can create rooms" ON rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update own room" ON rooms FOR UPDATE USING (auth.uid() = host_id);

-- votes: readable by anyone, one vote per user enforced by UNIQUE constraint
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes are publicly readable" ON votes FOR SELECT USING (true);
CREATE POLICY "Auth users can vote" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- messages: readable by anyone, insertable by auth users only
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Messages are publicly readable" ON messages FOR SELECT USING (true);
CREATE POLICY "Auth users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## 9. Dependencies

### Rules
- **Pin dependency versions** in package.json — no `^` or `~` for production dependencies.
- **Run `npm audit`** before any release and fix HIGH/CRITICAL issues.
- **Keep dependencies minimal.** Every new package is an attack surface. Evaluate necessity before adding.
- **Never install packages from untrusted sources.** Official npm only.

---

## 10. General Code Rules

- **No `any` types in TypeScript.** Use proper types or `unknown` with guards.
- **No `console.log` in production paths** with user data — use structured logging only.
- **All async functions must handle errors** — no unhandled promise rejections.
- **Middleware order matters** — auth middleware must run before route handlers, always.
- **No hardcoded credentials** anywhere in source code, ever.

---

## AI Coding Agent Rules

When an AI agent (Claude Code, Codex, etc.) works on this codebase:

1. **Read SECURITY.md before writing any code** involving auth, data access, or external services
2. **Do not simplify away security checks** for convenience or to make tests pass
3. **Do not add `TODO: add auth later`** — auth is not optional and not deferred
4. **Do not use `any` types** to work around type errors — fix the types properly
5. **Do not hardcode test credentials** even in test files
6. **Flag security concerns** rather than silently working around them
