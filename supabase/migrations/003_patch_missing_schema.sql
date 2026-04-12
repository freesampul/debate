-- ============================================================
-- Debate App — Migration 003: Patch missing schema
-- Run this if you already ran 001 and are missing the questions
-- tables and/or the question_id column on rooms.
-- All statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- so they are safe to re-run.
-- ============================================================


-- ────────────────────────────────────────
-- QUESTIONS TABLE (missing from original 001)
-- ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content       text NOT NULL CHECK (char_length(content) BETWEEN 10 AND 300),
  submitted_by  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vote_count    int NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_debate', 'closed')),
  created_at    timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_questions_status    ON public.questions (status, vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_questions_submitter ON public.questions (submitted_by);


-- ────────────────────────────────────────
-- QUESTION VOTES TABLE
-- ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.question_votes (
  question_id  uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, user_id)
);


-- ────────────────────────────────────────
-- question_id COLUMN ON ROOMS
-- ────────────────────────────────────────

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS question_id uuid REFERENCES public.questions(id) ON DELETE SET NULL;


-- ────────────────────────────────────────
-- RLS FOR NEW TABLES
-- ────────────────────────────────────────

ALTER TABLE public.questions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_votes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'questions' AND policyname = 'Questions are publicly readable'
  ) THEN
    CREATE POLICY "Questions are publicly readable"
      ON public.questions FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'questions' AND policyname = 'Auth users can submit questions'
  ) THEN
    CREATE POLICY "Auth users can submit questions"
      ON public.questions FOR INSERT WITH CHECK (auth.uid() = submitted_by);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'question_votes' AND policyname = 'Question votes are publicly readable'
  ) THEN
    CREATE POLICY "Question votes are publicly readable"
      ON public.question_votes FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'question_votes' AND policyname = 'Auth users can vote on questions'
  ) THEN
    CREATE POLICY "Auth users can vote on questions"
      ON public.question_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'question_votes' AND policyname = 'Users can remove own question vote'
  ) THEN
    CREATE POLICY "Users can remove own question vote"
      ON public.question_votes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;


-- ────────────────────────────────────────
-- VOTE HELPER RPCs
-- ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_question_vote(qid uuid)
RETURNS void AS $$
  UPDATE public.questions SET vote_count = vote_count + 1 WHERE id = qid;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_question_vote(qid uuid)
RETURNS void AS $$
  UPDATE public.questions SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = qid;
$$ LANGUAGE sql SECURITY DEFINER;
