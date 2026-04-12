# ARCHITECTURE.md — Debate App

## Overview

A live, mobile-first debate platform centered on real-time rooms. Users discover or create reusable debate questions, start rooms attached to those questions, join as speakers or audience, vote in real time, and participate through chat and social/live mechanics. Built with an Expo mobile app, a Node/Express backend, Supabase for auth/database/realtime, LiveKit for audio/video, and Cloudflare R2 for media storage.

For the full product definition and roadmap, see `PRODUCT_ROADMAP.md`.

---

## Monorepo Structure

```
debate-app/
├── mobile/          # Expo (React Native) iOS app
├── backend/         # Node.js + Express API server
├── shared/          # Shared TypeScript types and utilities
├── docs/            # Additional documentation
├── ARCHITECTURE.md  # This file
├── SECURITY.md      # Security rules and guidelines
└── package.json     # Root workspace config
```

---

## Stack

| Layer | Technology | Reason |
|---|---|---|
| Mobile | Expo (React Native) | React-compatible, iOS-first, easy to build |
| Backend | Node.js + Express | Lightweight, fast to build, JS throughout |
| Database | Supabase (PostgreSQL) | Relational, real-time subscriptions, auth built-in |
| Auth | Supabase Auth | Magic link + Google OAuth, no custom auth code |
| Real-time voting | Supabase Realtime | Already in stack, avoids extra Socket.io dependency |
| Video/Audio | LiveKit | Open source, React Native SDK, self-hostable |
| Media storage | Cloudflare R2 | Zero egress fees, S3-compatible |
| Hosting | Hetzner VPS (backend + LiveKit) | Cheap, reliable, full control |
| Frontend hosting | Cloudflare Pages (future web) | Free, fast CDN |

---

## Database Schema

### users
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
email           text UNIQUE NOT NULL
username        text UNIQUE NOT NULL
avatar_url      text
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### questions
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
content         text NOT NULL
submitted_by    uuid REFERENCES users(id) ON DELETE CASCADE
vote_count      int NOT NULL DEFAULT 0
status          text NOT NULL DEFAULT 'open'  -- open | in_debate | closed
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### question_votes
```sql
question_id      uuid REFERENCES questions(id) ON DELETE CASCADE
user_id          uuid REFERENCES users(id) ON DELETE CASCADE
created_at       timestamptz DEFAULT now()
PRIMARY KEY (question_id, user_id)
```

### rooms
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
title           text NOT NULL
topic           text NOT NULL
status          text NOT NULL DEFAULT 'waiting'  -- waiting | live | ended
host_id         uuid REFERENCES users(id) ON DELETE CASCADE
question_id     uuid NOT NULL REFERENCES questions(id) ON DELETE RESTRICT
livekit_room    text UNIQUE  -- LiveKit room name
recording_url   text  -- R2 storage URL after ended
max_speakers    int NOT NULL DEFAULT 4
created_at      timestamptz DEFAULT now()
ended_at        timestamptz
```

### room_participants
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
room_id         uuid REFERENCES rooms(id) ON DELETE CASCADE
user_id         uuid REFERENCES users(id) ON DELETE CASCADE
role            text NOT NULL  -- speaker | audience
media_type      text NOT NULL DEFAULT 'audio'  -- audio | video
joined_at       timestamptz DEFAULT now()
left_at         timestamptz
UNIQUE(room_id, user_id)
```

### votes
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
room_id         uuid REFERENCES rooms(id) ON DELETE CASCADE
user_id         uuid REFERENCES users(id) ON DELETE CASCADE
side            text NOT NULL  -- 'for' | 'against'
created_at      timestamptz DEFAULT now()
UNIQUE(room_id, user_id)  -- one vote per user per room
```

### messages
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
room_id         uuid REFERENCES rooms(id) ON DELETE CASCADE
user_id         uuid REFERENCES users(id) ON DELETE CASCADE
content         text NOT NULL
created_at      timestamptz DEFAULT now()
```

---

## API Routes

All routes prefixed with `/api/v1`.

### Questions
- `GET /questions` — list trending / open questions
- `GET /questions/:id` — get question details + active room context
- `POST /questions` — submit a question (auth required)
- `POST /questions/:id/vote` — toggle an upvote on a question (auth required)

### Rooms
- `GET /rooms` — list live/recent rooms
- `POST /rooms` — create a room (auth required)
- `GET /rooms/:id` — get room details
- `POST /rooms/:id/join` — join as speaker or audience
- `POST /rooms/:id/leave` — leave room
- `POST /rooms/:id/start` — start a room (host only)
- `POST /rooms/:id/end` — end room (host only)

### Voting
- `POST /rooms/:id/vote` — cast or change vote
- `GET /rooms/:id/votes` — get current vote counts

### LiveKit
- `POST /livekit/token` — generate a LiveKit access token (auth required)

---

## Real-Time Architecture

- **Voting dial:** Supabase Realtime channel on the `votes` table — clients subscribe and recompute the dial position on every insert/update
- **Audience chat:** Supabase Realtime channel on the `messages` table
- **Room status changes:** Supabase Realtime channel on the `rooms` table
- **Question discovery:** Supabase Realtime on `questions` / `question_votes` enables live question ranking and room counts
- **Video/Audio:** LiveKit handles all WebRTC — backend only issues tokens

---

## Mobile App Structure

```
mobile/
├── app/                  # Expo Router file-based routing
│   ├── (auth)/           # Login, signup screens
│   ├── (tabs)/           # Main tab navigation
│   │   ├── index.tsx     # Home — browse rooms
│   │   ├── create.tsx    # Create a room
│   │   └── profile.tsx   # User profile
│   └── room/
│       └── [id].tsx      # Room screen (debate + voting + chat)
├── components/
│   ├── VotingDial.tsx    # THE core mechanic — animated dial
│   ├── RoomCard.tsx      # Room preview card
│   ├── ChatMessage.tsx   # Audience chat message
│   └── ParticipantTile.tsx  # Video/audio participant
├── lib/
│   ├── supabase.ts       # Supabase client
│   ├── livekit.ts        # LiveKit client helpers
│   └── api.ts            # Backend API calls
├── hooks/
│   ├── useRoom.ts        # Room state + realtime subscription
│   ├── useVotes.ts       # Vote state + realtime subscription
│   └── useAuth.ts        # Auth state
└── types/                # Re-exports from shared/
```

---

## Backend Structure

```
backend/
├── src/
│   ├── index.ts          # Entry point
│   ├── routes/
│   │   ├── rooms.ts
│   │   ├── votes.ts
│   │   └── livekit.ts
│   ├── middleware/
│   │   ├── auth.ts       # Verify Supabase JWT
│   │   ├── rateLimit.ts  # Rate limiting
│   │   └── validate.ts   # Request validation (Zod)
│   ├── lib/
│   │   ├── supabase.ts   # Supabase admin client
│   │   └── livekit.ts    # LiveKit server SDK
│   └── types/            # Re-exports from shared/
└── package.json
```

---

## Shared Types

```
shared/
├── types/
│   ├── user.ts
│   ├── room.ts
│   ├── vote.ts
│   └── message.ts
└── package.json
```

---

## Environment Variables

### Backend (.env)
```
PORT=3000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=   # Server-side only, never expose
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
```

### Mobile (.env)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=   # Anon key only — safe to expose
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_LIVEKIT_URL=
```

---

## Deployment

- **Backend:** Hetzner VPS, Node process managed by PM2, reverse proxy via Nginx, HTTPS via Certbot
- **LiveKit:** Self-hosted on same Hetzner VPS (or separate, depending on load)
- **Database:** Supabase cloud (managed)
- **Storage:** Cloudflare R2

---

## Product Direction Notes

- Rooms are the primary product surface.
- Every room must attach to a reusable question.
- Multiple rooms can exist for the same question.
- Questions are the prompt layer, not the primary destination.
- Audio-first is acceptable for MVP, but the room model remains video-compatible.
- Moderation is required early: backend-owned chat, profanity filtering, reporting, and host moderation controls.
- [ ] Browse and create debate rooms
- [ ] Join a room as speaker (video or audio) or audience
- [ ] LiveKit video/audio integration
- [ ] Real-time voting dial (for/against, live percentage)
- [ ] Audience text chat
- [ ] End room (host only)

The following is explicitly OUT OF SCOPE for MVP:

- Followers / social graph
- Donations / monetization
- Recording storage to R2
- Notifications
- Moderation tools
- Web app
