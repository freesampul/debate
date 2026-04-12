-- ============================================================
-- Debate App — Migration 004: Moderation Foundation + Schema Upgrades
-- Safe additive changes only — no NOT NULL enforcement, no FK changes.
-- Run migration 005 separately when the create-room flow is ready to
-- require every room to link to a question.
-- ============================================================


-- ────────────────────────────────────────
-- USERS: display_name + bio
-- ────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS bio text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_bio_length_check'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_bio_length_check
      CHECK (bio IS NULL OR char_length(bio) <= 280);
  END IF;
END $$;


-- ────────────────────────────────────────
-- QUESTIONS: tighten shape (tables exist from 003)
-- ────────────────────────────────────────

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'questions_content_length_check'
      AND conrelid = 'public.questions'::regclass
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT questions_content_length_check
      CHECK (char_length(content) BETWEEN 10 AND 300);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'questions_vote_count_nonnegative_check'
      AND conrelid = 'public.questions'::regclass
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT questions_vote_count_nonnegative_check
      CHECK (vote_count >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'questions_status_check'
      AND conrelid = 'public.questions'::regclass
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT questions_status_check
      CHECK (status IN ('open', 'in_debate', 'closed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_questions_status_vote
  ON public.questions (status, vote_count DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_questions_submitted_by
  ON public.questions (submitted_by, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'questions_updated_at'
      AND tgrelid = 'public.questions'::regclass
      AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER questions_updated_at
      BEFORE UPDATE ON public.questions
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;


-- ────────────────────────────────────────
-- QUESTION VOTES: add created_at if missing
-- ────────────────────────────────────────

ALTER TABLE public.question_votes
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_question_votes_user
  ON public.question_votes (user_id, created_at DESC);


-- ────────────────────────────────────────
-- ROOMS: nullable question_id column (safe — already added by 003)
-- The NOT NULL enforcement is in migration 005.
-- ────────────────────────────────────────

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS question_id uuid;


-- ────────────────────────────────────────
-- QUESTION VOTE RPCs (updated to touch updated_at)
-- ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_question_vote(qid uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.questions
  SET vote_count = vote_count + 1,
      updated_at = now()
  WHERE id = qid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_question_vote(qid uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.questions
  SET vote_count = GREATEST(vote_count - 1, 0),
      updated_at = now()
  WHERE id = qid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ────────────────────────────────────────
-- MESSAGES: moderation metadata columns
-- ────────────────────────────────────────

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS filtered_content text,
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'visible',
  ADD COLUMN IF NOT EXISTS report_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS removed_at timestamptz,
  ADD COLUMN IF NOT EXISTS removed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderation_reason text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'messages_moderation_status_check'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_moderation_status_check
      CHECK (moderation_status IN ('visible', 'filtered', 'removed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'messages_report_count_nonnegative_check'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_report_count_nonnegative_check
      CHECK (report_count >= 0);
  END IF;
END $$;

UPDATE public.messages
SET filtered_content = content
WHERE filtered_content IS NULL;


-- ────────────────────────────────────────
-- MODERATION REPORTS
-- ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.moderation_reports (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  room_id          uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
  message_id       uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  category         text NOT NULL,
  details          text,
  status           text NOT NULL DEFAULT 'open',
  created_at       timestamptz NOT NULL DEFAULT now(),
  reviewed_at      timestamptz
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'moderation_reports_category_check'
      AND conrelid = 'public.moderation_reports'::regclass
  ) THEN
    ALTER TABLE public.moderation_reports
      ADD CONSTRAINT moderation_reports_category_check
      CHECK (category IN (
        'harassment', 'hate_or_abuse', 'spam', 'sexual_content',
        'violent_or_dangerous', 'impersonation', 'off_topic_disruption'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'moderation_reports_status_check'
      AND conrelid = 'public.moderation_reports'::regclass
  ) THEN
    ALTER TABLE public.moderation_reports
      ADD CONSTRAINT moderation_reports_status_check
      CHECK (status IN ('open', 'reviewed', 'resolved', 'dismissed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'moderation_reports_reporter_target_uniqueness'
      AND conrelid = 'public.moderation_reports'::regclass
  ) THEN
    ALTER TABLE public.moderation_reports
      ADD CONSTRAINT moderation_reports_reporter_target_uniqueness
      UNIQUE (reporter_user_id, room_id, message_id, reported_user_id, category);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_moderation_reports_status
  ON public.moderation_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_room
  ON public.moderation_reports (room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_reported_user
  ON public.moderation_reports (reported_user_id, created_at DESC);


-- ────────────────────────────────────────
-- ROOM BANS
-- ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.room_bans (
  room_id    uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  banned_by  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_bans_user
  ON public.room_bans (user_id, created_at DESC);


-- ────────────────────────────────────────
-- ROOM MODERATION ACTIONS (audit trail)
-- ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.room_moderation_actions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id        uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  action_by      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  message_id     uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  action_type    text NOT NULL,
  reason         text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'room_moderation_actions_action_type_check'
      AND conrelid = 'public.room_moderation_actions'::regclass
  ) THEN
    ALTER TABLE public.room_moderation_actions
      ADD CONSTRAINT room_moderation_actions_action_type_check
      CHECK (action_type IN (
        'remove_message', 'remove_listener', 'remove_speaker',
        'mute_speaker', 'ban_user', 'unban_user'
      ));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_room_moderation_actions_room
  ON public.room_moderation_actions (room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_moderation_actions_target
  ON public.room_moderation_actions (target_user_id, created_at DESC);


-- ────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────

ALTER TABLE public.questions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_votes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_reports      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_bans               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_moderation_actions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'questions' AND cmd = 'SELECT') THEN
    CREATE POLICY "Questions are publicly readable" ON public.questions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'questions' AND cmd = 'INSERT') THEN
    CREATE POLICY "Auth users can create questions" ON public.questions FOR INSERT WITH CHECK (auth.uid() = submitted_by);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'questions' AND cmd = 'UPDATE') THEN
    CREATE POLICY "Question author can update own question" ON public.questions FOR UPDATE USING (auth.uid() = submitted_by);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'question_votes' AND cmd = 'SELECT') THEN
    CREATE POLICY "Question votes are publicly readable" ON public.question_votes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'question_votes' AND cmd = 'INSERT') THEN
    CREATE POLICY "Auth users can vote on questions" ON public.question_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'question_votes' AND cmd = 'DELETE') THEN
    CREATE POLICY "Users can remove own question vote" ON public.question_votes FOR DELETE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'moderation_reports' AND cmd = 'INSERT') THEN
    CREATE POLICY "Users can create moderation reports" ON public.moderation_reports FOR INSERT WITH CHECK (auth.uid() = reporter_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'moderation_reports' AND cmd = 'SELECT') THEN
    CREATE POLICY "Users can read own moderation reports" ON public.moderation_reports FOR SELECT USING (auth.uid() = reporter_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'room_bans' AND cmd = 'SELECT') THEN
    CREATE POLICY "Hosts and banned users can read room bans"
      ON public.room_bans FOR SELECT USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_id AND r.host_id = auth.uid())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'room_bans' AND cmd = 'INSERT') THEN
    CREATE POLICY "Room host can create bans"
      ON public.room_bans FOR INSERT WITH CHECK (
        auth.uid() = banned_by
        AND EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_id AND r.host_id = auth.uid())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'room_bans' AND cmd = 'DELETE') THEN
    CREATE POLICY "Room host can remove bans"
      ON public.room_bans FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_id AND r.host_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'room_moderation_actions' AND cmd = 'SELECT') THEN
    CREATE POLICY "Hosts and targets can read moderation actions"
      ON public.room_moderation_actions FOR SELECT USING (
        auth.uid() = target_user_id
        OR EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_id AND r.host_id = auth.uid())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'room_moderation_actions' AND cmd = 'INSERT') THEN
    CREATE POLICY "Room host can create moderation actions"
      ON public.room_moderation_actions FOR INSERT WITH CHECK (
        auth.uid() = action_by
        AND EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_id AND r.host_id = auth.uid())
      );
  END IF;
END $$;


-- ────────────────────────────────────────
-- REALTIME
-- ────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'questions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'question_votes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.question_votes;
  END IF;
END $$;
