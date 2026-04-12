-- ============================================================
-- Debate App — Initial Schema Migration
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================


-- ────────────────────────────────────────
-- TABLES
-- ────────────────────────────────────────

-- Users (extends Supabase auth.users)
CREATE TABLE public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text UNIQUE NOT NULL,
  username    text UNIQUE NOT NULL,
  avatar_url  text,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

-- Questions (debate topics submitted and voted on by the community)
CREATE TABLE public.questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content       text NOT NULL CHECK (char_length(content) BETWEEN 10 AND 300),
  submitted_by  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vote_count    int NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_debate', 'closed')),
  created_at    timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_questions_status    ON public.questions (status, vote_count DESC);
CREATE INDEX idx_questions_submitter ON public.questions (submitted_by);

-- Question upvotes (one per user per question, toggleable)
CREATE TABLE public.question_votes (
  question_id  uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, user_id)
);

-- Rooms
CREATE TABLE public.rooms (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  topic         text NOT NULL,
  status        text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'live', 'ended')),
  host_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id   uuid REFERENCES public.questions(id) ON DELETE SET NULL,
  livekit_room  text UNIQUE,
  recording_url text,
  max_speakers  int NOT NULL DEFAULT 4 CHECK (max_speakers BETWEEN 2 AND 4),
  created_at    timestamptz DEFAULT now() NOT NULL,
  ended_at      timestamptz
);

-- Room participants
CREATE TABLE public.room_participants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('speaker', 'audience')),
  media_type  text NOT NULL DEFAULT 'audio' CHECK (media_type IN ('audio', 'video')),
  joined_at   timestamptz DEFAULT now() NOT NULL,
  left_at     timestamptz,
  UNIQUE (room_id, user_id)
);

-- Votes
CREATE TABLE public.votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  side        text NOT NULL CHECK (side IN ('for', 'against')),
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (room_id, user_id)
);

-- Messages
CREATE TABLE public.messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content     text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at  timestamptz DEFAULT now() NOT NULL
);


-- ────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────

CREATE INDEX idx_rooms_status        ON public.rooms (status);
CREATE INDEX idx_rooms_host          ON public.rooms (host_id);
CREATE INDEX idx_participants_room   ON public.room_participants (room_id);
CREATE INDEX idx_participants_user   ON public.room_participants (user_id);
CREATE INDEX idx_votes_room          ON public.votes (room_id);
CREATE INDEX idx_messages_room       ON public.messages (room_id, created_at);


-- ────────────────────────────────────────
-- AUTO-UPDATE updated_at ON users
-- ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ────────────────────────────────────────
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- Creates a row in public.users when someone signs up via Supabase Auth
-- ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    -- Default username: part before @ in email, + random suffix to avoid collisions
    split_part(NEW.email, '@', 1) || '_' || substr(gen_random_uuid()::text, 1, 6)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────

ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages          ENABLE ROW LEVEL SECURITY;


-- users
CREATE POLICY "Users are publicly readable"
  ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE USING (auth.uid() = id);


-- rooms
CREATE POLICY "Rooms are publicly readable"
  ON public.rooms FOR SELECT USING (true);

CREATE POLICY "Auth users can create rooms"
  ON public.rooms FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update own room"
  ON public.rooms FOR UPDATE USING (auth.uid() = host_id);


-- room_participants
CREATE POLICY "Participants are publicly readable"
  ON public.room_participants FOR SELECT USING (true);

CREATE POLICY "Auth users can join rooms"
  ON public.room_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON public.room_participants FOR UPDATE USING (auth.uid() = user_id);


-- votes
CREATE POLICY "Votes are publicly readable"
  ON public.votes FOR SELECT USING (true);

CREATE POLICY "Auth users can vote"
  ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change own vote"
  ON public.votes FOR UPDATE USING (auth.uid() = user_id);


-- questions
ALTER TABLE public.questions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions are publicly readable"
  ON public.questions FOR SELECT USING (true);

CREATE POLICY "Auth users can submit questions"
  ON public.questions FOR INSERT WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Question votes are publicly readable"
  ON public.question_votes FOR SELECT USING (true);

CREATE POLICY "Auth users can vote on questions"
  ON public.question_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own question vote"
  ON public.question_votes FOR DELETE USING (auth.uid() = user_id);


-- messages
CREATE POLICY "Messages are publicly readable"
  ON public.messages FOR SELECT USING (true);

CREATE POLICY "Auth users can send messages"
  ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────
-- VOTE HELPER RPCs
-- Called by the questions route to increment/decrement vote_count atomically
-- ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_question_vote(qid uuid)
RETURNS void AS $$
  UPDATE public.questions SET vote_count = vote_count + 1 WHERE id = qid;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_question_vote(qid uuid)
RETURNS void AS $$
  UPDATE public.questions SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = qid;
$$ LANGUAGE sql SECURITY DEFINER;


-- ────────────────────────────────────────
-- REALTIME
-- Enable realtime on the tables the mobile app subscribes to
-- ────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
