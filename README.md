# Debate App

A mobile-first live debate network built with Expo, Express, Supabase, and LiveKit.

This project is designed around one core idea: the primary product is the **live room**, not the prompt feed. Users create or discover reusable questions, start debate rooms attached to those questions, join as speakers or audience, vote in real time, chat during the debate, follow debaters they like, and receive notifications when live activity starts again.

Questions are the seed layer. Rooms are the destination.

## Why This Project Exists

Most social products optimize for static posting, passive consumption, or one-way broadcasting. This project explores a different interaction model:

- live, structured disagreement instead of comment-thread sprawl
- audience participation through voting and chat instead of pure spectatorship
- reusable prompts that can spawn multiple rooms over time
- creator and fan dynamics through follows, notifications, and future gifting/reactions

The intended long-term feel is somewhere between:

- Twitter/X for prompts and topic discovery
- Twitch or TikTok Live for repeat engagement and creator/fan energy
- Twitter Spaces / live audio for the room format itself

## Current Product State

The app already supports a real end-to-end core loop:

1. Sign in with Supabase auth.
2. Browse live or waiting rooms from the Home tab.
3. Browse trending questions from the Questions tab.
4. Start a new room from an existing question or create a new question inline.
5. Join a room as a speaker or listener.
6. Vote `for` or `against` in real time.
7. Chat inside the room.
8. Follow other users and receive notifications for live activity.
9. Use host moderation tools for messages and room participants.

This is not a static UI mockup or architecture-only repo. It is an implemented product skeleton with backend routes, schema migrations, shared types, mobile flows, and moderation primitives.

## What Is Implemented

### Mobile app

- Expo / React Native iOS-first app
- file-based routing with Expo Router
- auth guard and magic-link login flow
- Rooms tab for live/waiting room discovery
- Questions tab for trending prompt discovery
- Create flow that always links a room to a question
- room detail screen with:
  - question context
  - participant strip
  - live vote dial
  - chat
  - audio join controls
  - host controls
- profile screen with editing
- public profile screens with follow/unfollow
- notification inbox with actionable routing

### Backend

- Node.js + Express API
- Zod request validation
- JWT-based auth via Supabase
- room lifecycle APIs
- question creation and voting APIs
- LiveKit token issuance
- message posting and host moderation
- participant moderation and room bans
- notification creation and read state
- rate limiting middleware

### Data model / schema

- users and profiles
- reusable questions
- question votes
- rooms with required `question_id`
- room participants
- live vote records
- messages with moderation state
- follows
- notifications
- moderation reports / actions / room bans

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Mobile client | Expo + React Native + Expo Router | Fast iteration, native mobile UI, simple navigation model |
| Backend API | Node.js + Express + TypeScript | Explicit control over auth, moderation, and room lifecycle |
| Database | Supabase Postgres | Relational model, managed Postgres, good developer speed |
| Auth | Supabase Auth | Magic-link auth without building auth from scratch |
| Realtime data | Supabase Realtime | Live updates for chat, votes, rooms, and questions |
| Media transport | LiveKit | Purpose-built for audio/video rooms and React Native support |
| Shared contracts | Workspace package with TypeScript types | Keeps mobile/backend payloads aligned |
| Validation | Zod | Runtime-safe request validation and better API boundaries |
| Rate limiting | express-rate-limit | Simple abuse protection for APIs |
| Monorepo tooling | npm workspaces + TypeScript | Shared code without overengineering the build system |

## Repository Structure

```text
debate-app/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── index.ts         # Server entrypoint
│   │   ├── lib/             # Supabase, LiveKit, moderation helpers, typed DB schema
│   │   ├── middleware/      # Auth, validation, rate limits
│   │   └── routes/          # Rooms, questions, users, messages, notifications, etc.
│   └── package.json
├── mobile/                  # Expo React Native app
│   ├── app/                 # Expo Router screens
│   ├── components/          # Reusable UI components
│   ├── hooks/               # Data + realtime hooks
│   ├── lib/                 # API, Supabase, LiveKit helpers
│   └── package.json
├── shared/                  # Shared TS types used by mobile and backend
├── supabase/
│   └── migrations/          # SQL schema migrations
├── ARCHITECTURE.md          # Technical architecture overview
├── PRODUCT_ROADMAP.md       # Product vision and detailed roadmap
├── SECURITY.md              # Required security rules for contributors/agents
└── README.md
```

## Product Model

### Core concepts

- **Question**: a reusable prompt or topic seed
- **Room**: the actual live debate object users join
- **Speaker**: a participant with publish permission in LiveKit
- **Audience member**: a listener who can vote, chat, and observe
- **Vote**: a real-time `for` / `against` stance within a room
- **Follow**: a social graph edge used for retention and notifications

### Important product rules

- every room must be attached to a question
- multiple rooms can exist for the same question
- questions are reusable prompts, not one-time containers
- audio-first is acceptable, but the room model is designed so video can be layered in later
- all meaningful participation is authenticated
- moderation is part of the product, not a post-launch cleanup

## Architecture Overview

At a high level:

1. The mobile app handles UI, local state, and realtime subscriptions.
2. The backend owns privileged logic: auth checks, moderation, room lifecycle, and LiveKit token issuance.
3. Supabase stores relational data and powers realtime subscriptions.
4. LiveKit handles actual audio/video transport.

### Request flow example: creating a room

1. User opens Create on mobile.
2. User selects an existing question or creates one inline.
3. Mobile sends `POST /api/v1/rooms` with `question_id`, title, topic, and speaker cap.
4. Backend validates auth and request shape.
5. Backend verifies the question exists and is usable.
6. Backend inserts the room and marks the question as `in_debate`.
7. Mobile routes into the new room screen.

### Request flow example: joining audio

1. User joins the room as speaker or audience.
2. Backend records room participation.
3. Mobile requests a room-scoped LiveKit token from `POST /api/v1/livekit/token`.
4. Backend validates that:
   - the room exists
   - the room is joinable
   - the user is a current participant
   - the user has the right role
5. Backend issues a short-lived, room-scoped, user-scoped LiveKit token.
6. Mobile connects to LiveKit using that token.

### Realtime model

Supabase Realtime is used for:

- room list changes
- vote updates
- chat messages
- question activity

LiveKit is used for:

- speaker/listener presence in media
- audio/video transport
- mute state / publish capability

This separation is intentional. The backend does not try to be a custom realtime media server. It coordinates state and permissions while delegating media transport to LiveKit.

## Security Model

This repo takes the security boundary seriously because it mixes auth, realtime data, and media tokens.

Key rules:

- all privileged routes require a verified Supabase JWT
- client-supplied user IDs are never trusted
- LiveKit tokens are generated server-side only
- the backend uses the Supabase service role key, so route-level authorization matters even with RLS
- room host actions are enforced server-side
- rate limiting exists for general API, room creation, chat, and token issuance
- moderation/reporting infrastructure exists in schema and backend routes

See [SECURITY.md](./SECURITY.md) for the full ruleset.

## Notable Engineering Decisions

### 1. Rooms are required to link to questions

This is enforced at both the product and schema level. It keeps debate context explicit, supports discovery by topic, and allows many rooms to cluster around the same prompt over time.

### 2. Shared types across backend and mobile

The project uses a `shared/` workspace package for domain types. That keeps the API surface from drifting and makes it easier to refactor mobile/backend behavior together.

### 3. Backend-owned privileged writes

Critical actions like room creation, moderation, token issuance, follows, and notifications go through the backend rather than trusting direct client writes. That gives a single place to enforce policy and rate limits.

### 4. LiveKit only for media, not app state

LiveKit is used where it is strongest: audio/video transport. App state still lives in Postgres/Supabase. That keeps the data model queryable and easier to reason about.

### 5. Expo Go vs native dev builds are handled explicitly

The app uses deferred native imports for LiveKit and guards audio join with a clear error path in Expo Go, because LiveKit native modules require a development build to function correctly.

## Local Development

### Prerequisites

- Node.js 20+
- npm
- a Supabase project
- a LiveKit project
- Xcode for iOS simulator / device testing
- ideally a development build for audio testing rather than Expo Go

### 1. Install dependencies

From the repo root:

```bash
npm install
```

From the mobile workspace:

```bash
cd mobile
npm install
```

### 2. Configure backend environment

Copy the backend example file:

```bash
cp backend/.env.example backend/.env
```

Set:

```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
LIVEKIT_URL=...
ALLOWED_ORIGINS=
```

### 3. Configure mobile environment

Copy the mobile example file:

```bash
cp mobile/.env.example mobile/.env
```

Set:

```env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_API_URL=...
EXPO_PUBLIC_LIVEKIT_URL=...
```

For LAN/local device testing, `EXPO_PUBLIC_API_URL` may point at your local machine. For public/off-network testing, the backend should be hosted on a public URL.

### 4. Run the backend

From the repo root:

```bash
npm run backend:dev
```

Or directly:

```bash
cd backend
npm run dev
```

### 5. Run the mobile app

```bash
cd mobile
npm run start
```

For native audio/video testing, use a dev build:

```bash
npm run ios
```

or:

```bash
npm run android
```

### 6. Build check

From the repo root:

```bash
npm run build
```

Mobile typecheck:

```bash
npx tsc -p mobile/tsconfig.json --noEmit
```

## Deployment Shape

The current architecture is well-suited to a managed backend deployment:

- mobile app runs as a native client
- backend runs as an Express service
- Supabase is hosted
- LiveKit is hosted

The pragmatic deployment path is:

- Railway / Render / Fly.io for the backend
- Supabase for database/auth/realtime
- LiveKit Cloud for media

The backend does not need a custom low-level HTTP server. It already is the correct server. The real production task is hosting the existing Express app in a stable, public environment.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) for technical system design
- [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) for product direction and build order
- [SECURITY.md](./SECURITY.md) for security requirements and contributor rules

## Roadmap Direction

The current repo already covers the core debate loop plus early moderation and social graph work. The next major layers are:

- richer notification UX
- reactions / gifting
- stronger host controls for live media participants
- more polished room and discovery ranking
- production deployment and operational hardening

## Why This Repo Is Interesting

From an engineering perspective, this project shows work across several layers at once:

- mobile product development
- backend API design
- relational schema design and migrations
- realtime systems
- auth and authorization
- media token orchestration
- moderation tooling
- monorepo/shared-contract discipline

It is a good example of a product where the hard parts are not just UI polish. The interesting work is in keeping social UX, realtime state, permissions, and infrastructure boundaries coherent.

## Status

Active prototype / pre-launch build.

The project is beyond the idea stage and beyond static wireframes, but still early enough that core product decisions are being shaped in code. That is intentional: the repo is being used to push the actual product model forward, not just to decorate a concept.
