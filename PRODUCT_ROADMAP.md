# PRODUCT_ROADMAP.md — Debate App

## Product Thesis

Debate App is a live, mobile-first debate network.

The primary product is not a question board. The primary product is the live room:

- people start live debates quickly
- audiences join as listeners and voters
- speakers debate in real time
- the crowd shapes momentum through votes, chat, follows, reactions, and gifts

Questions are the prompt layer that seeds debates. They are reusable starting points, similar to a post on a social app. A question helps create context, makes discovery easier, and lets the app cluster multiple live rooms around the same topic. A question is not the destination. The room is the destination.

Over time, the product should feel closer to a blend of:

- Twitter/X for prompts and discussion seeds
- Twitch or TikTok Live for creator/fan energy and repeat engagement
- Twitter Spaces / live audio for the actual debate format

## Core Product Principles

1. Rooms are the center of the product.
2. Every room must be attached to a question.
3. Multiple rooms can exist for the same question.
4. Questions are reusable prompts, not one-time containers.
5. Audio-first is acceptable for MVP.
6. Video should remain easy to add without re-architecting the room model.
7. All users should be authenticated.
8. Moderation is a product requirement, not a later cleanup item.
9. Profiles, follows, notifications, reactions, and gifting are core user-facing pillars, not optional side features.
10. Hosts must be able to edit a room's attached question. Long term, the platform may also suggest or automatically reclassify the room's topic, but the host remains the final editor.

## Product Shape

### Primary User Loops

#### Loop A: Start a Debate

1. User opens the app.
2. User taps Create.
3. User either:
   - selects an existing question, or
   - creates a new question inline as part of room creation.
4. User creates a room attached to that question.
5. User enters the room as host speaker.
6. Host starts the debate.
7. Audience joins, listens, chats, votes, follows speakers, and later sends reactions/gifts.

#### Loop B: Join a Live Debate

1. User opens Home.
2. User sees live and waiting rooms first.
3. User taps a room card.
4. User joins as listener or speaker if allowed.
5. User listens, votes, chats, and follows participants they like.

#### Loop C: Use Questions as Discovery

1. User opens the Questions tab.
2. User sees trending questions.
3. User taps a question.
4. User sees:
   - live rooms for that question
   - recent rooms for that question
   - option to start a new room from that question
5. User joins an existing room or starts a new one.

#### Loop D: Become a Repeat Participant

1. User follows debaters they like.
2. User receives notifications when those people go live.
3. User builds a habit around returning to live rooms.
4. User eventually spends coins on reactions/gifts.

## Information Architecture

### Bottom Navigation

- Home / Rooms
- Questions
- Create
- Profile

### Home / Rooms Tab

Purpose:

- show users the most relevant live and waiting rooms immediately
- optimize for fast room entry

Expected content:

- live rooms first
- waiting rooms next
- room cards with topic context
- host/speaker indicators
- vote activity / audience activity signals later

### Questions Tab

Purpose:

- provide a discovery layer for reusable prompts
- show what topics are trending
- show all active room activity attached to a question

Expected content:

- trending questions
- active room count per question
- recent room count per question
- upvote affordance
- create-question affordance

Question tap behavior:

- open a question detail screen
- show live rooms for that question
- show recent rooms for that question
- allow starting a new room from that question

### Create Flow

Purpose:

- reduce friction to starting a room
- always preserve question linkage

Rules:

- every room must have a `question_id`
- user can select an existing question
- user can create a new question inline and immediately continue into room creation
- host can later edit the room's question mapping

### Profile Tab

Purpose:

- identity
- follow graph
- history
- repeat engagement

Expected content over time:

- avatar
- username
- display name
- bio
- follower / following counts
- rooms hosted
- rooms joined as speaker
- reactions/gifts received

## Core Feature Specifications

### 1. Authentication

MVP behavior:

- all users must be signed in
- Supabase Auth with magic link is acceptable
- local dev bypass may exist in development only
- dev bypass must never ship to production behavior

Requirements:

- all privileged actions use authenticated user ID from JWT
- no anonymous listening, voting, or chatting

### 2. Questions

Questions are reusable prompts that seed debates.

They are not the primary product surface, but they are required context for every room.

Question behavior:

- users can post questions
- users can upvote questions
- users browse trending questions
- one question can have many rooms
- one room belongs to one question
- the host can change which question a room is attached to
- long term, the system may suggest better question matches based on actual room discussion

Question states:

- `open`: active and available for reuse
- `in_debate`: at least one active room currently exists for the question
- `closed`: archived, moderated, or otherwise not available for new rooms

Important product note:

- `in_debate` does not mean a one-to-one mapping
- multiple concurrent rooms may still reuse the same question

Question ranking inputs:

- vote count
- recency
- current live room count
- recent room count
- later: engagement quality

### 3. Rooms

Rooms are the main product object.

Room rules:

- every room has a `question_id`
- rooms may also have a custom title and topic framing from the host
- multiple rooms can exist for one question
- a room has one host
- room states are `waiting`, `live`, and `ended`

Room lifecycle:

1. Host creates a room from a question.
2. Host enters as the first speaker.
3. Room starts in `waiting`.
4. Host taps Start Debate.
5. Room becomes `live`.
6. Audience and speakers participate.
7. Host ends the room.
8. Room becomes `ended`.

Planned room metadata:

- title
- topic / framing
- question_id
- host_id
- livekit_room
- recording_url
- status
- max_speakers
- timestamps

Future room metadata:

- primary language
- tags
- audience count snapshots
- peak concurrents
- moderation flags

### 4. Room Detail Experience

The room screen is the center of the app.

MVP room experience:

- attached question context
- room title / framing
- speaker strip
- audio participation
- real-time vote dial
- audience chat
- join/leave controls
- host start/end controls

Desired future room experience:

- video tiles when enabled
- live reactions/gifts flying across the screen
- better speaker queueing and host controls
- richer participant cards
- host tools for moderation and room management

### 5. Audio First, Video Ready

MVP:

- audio is the default and enough to launch
- listeners join as audience
- approved participants join as speakers

Long-term:

- video should be easy to enable inside the same room model
- the schema and room permissions should not assume audio-only forever
- LiveKit remains the right abstraction because it supports both audio and video

### 6. Voting

Voting is one of the core mechanics.

Rules:

- one vote per user per room
- vote can switch between `for` and `against`
- vote should update the room dial in real time
- voting only happens in live rooms

Future extensions:

- audience segment breakdowns
- vote momentum graph over time
- speaker-side analytics

### 7. Chat

Chat is mandatory for room energy and retention.

Requirements:

- chat must be authenticated
- chat must pass through the backend for moderation and rate limiting
- profanity filtering must exist
- chat messages must be reportable
- hosts must be able to remove messages

Important architecture rule:

- do not let chat writes bypass moderation by writing directly from the client to Supabase in production behavior

Recommended MVP moderation pipeline:

1. Client sends message to backend.
2. Backend validates auth, room membership, length, and rate limit.
3. Backend sanitizes input.
4. Backend applies profanity filtering.
5. Backend stores the raw moderation result and the filtered display content.
6. Clients receive new messages through realtime subscriptions.

### 8. Host Moderation

Host moderation is required in MVP.

Initial host powers:

- remove chat message
- remove listener from room
- remove speaker from room
- mute speaker
- ban user from room

Future host powers:

- temporary ban duration
- lock room
- speaker queue management
- co-host / moderator roles

### 9. Reporting and Trust & Safety

Trust & safety features discussed and required:

- profanity filter for chat
- user reporting
- message reporting
- room reporting
- audit trail for host moderation actions

Recommended MVP reporting categories:

- harassment
- hate or abuse
- spam
- sexual content
- violent or dangerous speech
- impersonation
- off-topic / low-quality disruption

Minimum-account-age gating:

- likely needed for room creation
- may be disabled during the first few days of launch
- should be configurable, not hardcoded into app assumptions

### 10. Profiles

Profiles are a core long-term retention system.

Profile goals:

- let users build identity
- make debaters followable
- support creator/fan dynamics

MVP profile fields:

- username
- avatar
- display name
- bio

Near-term profile features:

- hosted rooms
- speaker appearances
- follower / following counts

Later profile features:

- top debates
- reaction/gift totals
- badges
- moderation history visibility for admins only

### 11. Follows

Follows are a major future-facing feature and should be treated as first-class.

Use cases:

- follow favorite debaters
- know when they go live
- build repeat audience behavior

Expected product outcomes:

- stronger retention
- stronger creator identity
- stronger network effects

### 12. Notifications

Notification priority order, based on product direction:

1. someone you follow started a debate
2. someone you follow joined as a speaker
3. a question you engaged with now has live rooms

Other notifications later:

- room invite
- invite accepted / declined
- reaction received
- follow received

### 13. Invites

Speaker invites are not MVP, but the system should remain compatible with them.

Why they still matter now:

- they are part of future room quality
- they improve host control of speaker composition
- existing backend/schema work should not be thrown away

MVP status:

- keep schema/backend compatibility
- defer user-facing mobile flow until after core loop, moderation, and profiles are stronger

### 14. Reactions, Gifts, Coins

These are not optional novelty features. They are a major part of the desired product feel.

Target feel:

- Twitch / TikTok Live energy
- viewers can visibly support favorite debaters
- reactions are social signals and monetization primitives

Planned system:

- item catalog
- user wallet
- coin purchases
- room reactions targeting a specific participant
- real-time reaction animations

Expected later capabilities:

- leaderboard per room
- top-supported debaters
- reaction bundles
- gift streaks

## Discovery Model

### Home Feed

Home prioritizes rooms, not questions.

Sort priorities should evolve toward:

- live now
- participation velocity
- relevance to followed users
- question popularity
- recency

### Questions Feed

Questions prioritize topical discovery and room branching.

It should help users answer:

- what are people debating right now?
- what topic already has live momentum?
- should I join a live room or start my own spin on this question?

## MVP Definition

The MVP should be considered complete only when the following loop works cleanly:

1. signed-in user creates a new question or chooses an existing one
2. signed-in user creates a room attached to that question
3. host joins as speaker and starts the debate
4. signed-in audience joins as listener
5. audience votes in real time
6. audience chats through moderated backend writes
7. host can moderate participants and chat
8. users can view profiles and follow people
9. notifications exist for followed users going live

Everything else is important, but this is the minimum loop that proves the product.

## Recommended Delivery Order

### Phase 1: Foundation Correction

Goal:

- align codebase, schema, and docs with the real product direction

Work:

- make `rooms.question_id` real and required
- add missing questions schema and question vote mechanics
- clean up question semantics to support reusable prompts
- update app flows so room creation always starts with a question context

### Phase 2: Core Room Loop

Goal:

- make the core room experience stable and launchable

Work:

- finish question detail page with live/recent room listing
- improve room creation flow for existing or new question
- ensure room screen always displays question context
- polish host start/end and participant join flows

### Phase 3: Chat Through Backend + Moderation

Goal:

- close the biggest safety and architecture gap

Work:

- move message writes behind backend API
- add profanity filter
- add rate limits for chat
- add message removal
- add reporting flows
- add room bans and moderation audit trail

### Phase 4: Profiles + Follows

Goal:

- create repeat-user behavior

Work:

- richer public profiles
- follow/unfollow
- follower/following counts
- profile room history

### Phase 5: Notifications

Goal:

- drive return visits

Work:

- followed user started a debate
- followed user joined as speaker
- engaged question has live rooms

### Phase 6: Live Social Layer

Goal:

- make the app feel like a living network, not just utility

Work:

- reactions
- gifts
- coin wallet
- purchase flow
- top supporters

### Phase 7: Video and Richer Creator Tools

Goal:

- expand creator expression without changing the core model

Work:

- optional video-first room layouts
- better participant cards
- co-host / moderator roles
- speaker invites UI

## Data Model Summary

### Core tables required now

- `users`
- `questions`
- `question_votes`
- `rooms`
- `room_participants`
- `votes`
- `messages`

### Trust & safety tables required early

- `moderation_reports`
- `room_bans`
- `room_moderation_actions`

### Social tables required soon after MVP

- `follows`
- `notifications`

### Monetization and live-engagement tables required later

- `item_types`
- `user_wallets`
- `coin_purchases`
- `room_reactions`

## Non-Negotiable Product Rules

1. Rooms are the primary surface.
2. Every room must attach to a question.
3. Questions are reusable.
4. Multiple rooms per question are allowed.
5. All users are authenticated.
6. Chat is backend-owned and moderated.
7. Host moderation ships early.
8. Profiles, follows, and notifications are core roadmap items.
9. Reactions/gifts are part of the intended final product, not a side experiment.
10. Audio-first is acceptable, but the architecture must stay video-compatible.
