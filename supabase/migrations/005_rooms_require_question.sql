-- ============================================================
-- Debate App — Migration 005: Enforce rooms.question_id NOT NULL
--
-- BREAKING CHANGE — only run this once the create-room flow in
-- the mobile app and backend have been updated to always select
-- or create a question when creating a room.
--
-- What this does:
-- 1. Backfills any existing rooms that have no question_id by
--    auto-generating a question from their topic/title.
-- 2. Replaces the FK from ON DELETE SET NULL → ON DELETE RESTRICT
--    (a question can no longer be deleted while rooms reference it).
-- 3. Enforces NOT NULL on rooms.question_id.
-- 4. Syncs question.status to reflect current room activity.
--
-- Pre-flight check: the migration will RAISE an exception and roll
-- back if any room cannot be backfilled, so it is safe to re-run.
-- ============================================================


-- ────────────────────────────────────────
-- 1. Backfill rooms that still have no question_id
-- ────────────────────────────────────────

DO $$
DECLARE
  room_rec             record;
  seeded_question_id   uuid;
  remaining_null_rooms integer;
  fk_name              text;
BEGIN
  FOR room_rec IN
    SELECT id, host_id, title, topic, status, created_at
    FROM public.rooms
    WHERE question_id IS NULL
    ORDER BY created_at ASC
  LOOP
    INSERT INTO public.questions (
      content,
      submitted_by,
      vote_count,
      status,
      created_at,
      updated_at
    )
    VALUES (
      -- Truncate to 300 chars (questions limit); fall back to title if topic is blank
      LEFT(COALESCE(NULLIF(trim(room_rec.topic), ''), trim(room_rec.title)), 300),
      room_rec.host_id,
      0,
      CASE
        WHEN room_rec.status IN ('waiting', 'live') THEN 'in_debate'
        ELSE 'closed'
      END,
      room_rec.created_at,
      room_rec.created_at
    )
    RETURNING id INTO seeded_question_id;

    UPDATE public.rooms
    SET question_id = seeded_question_id
    WHERE id = room_rec.id;
  END LOOP;

  -- Hard stop if anything is still unlinked
  SELECT COUNT(*) INTO remaining_null_rooms
  FROM public.rooms
  WHERE question_id IS NULL;

  IF remaining_null_rooms > 0 THEN
    RAISE EXCEPTION
      'Cannot enforce rooms.question_id NOT NULL: % room(s) remain unlinked',
      remaining_null_rooms;
  END IF;

  -- ────────────────────────────────────────
  -- 2. Replace the FK (SET NULL → RESTRICT)
  -- ────────────────────────────────────────

  -- Drop whatever FK currently exists on rooms.question_id
  FOR fk_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.rooms'::regclass
      AND c.contype = 'f'
      AND a.attname = 'question_id'
  LOOP
    EXECUTE format('ALTER TABLE public.rooms DROP CONSTRAINT %I', fk_name);
  END LOOP;

  -- Recreate with RESTRICT so questions can't be deleted while rooms reference them
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rooms_question_id_fkey'
      AND conrelid = 'public.rooms'::regclass
  ) THEN
    ALTER TABLE public.rooms
      ADD CONSTRAINT rooms_question_id_fkey
      FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE RESTRICT;
  END IF;
END $$;


-- ────────────────────────────────────────
-- 3. Enforce NOT NULL
-- ────────────────────────────────────────

ALTER TABLE public.rooms
  ALTER COLUMN question_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rooms_question
  ON public.rooms (question_id, created_at DESC);


-- ────────────────────────────────────────
-- 4. Sync question status to match room activity
-- ────────────────────────────────────────

-- Mark questions as in_debate if they have an active room
UPDATE public.questions q
SET status    = 'in_debate',
    updated_at = now()
WHERE q.status <> 'closed'
  AND EXISTS (
    SELECT 1 FROM public.rooms r
    WHERE r.question_id = q.id
      AND r.status IN ('waiting', 'live')
  );

-- Revert to open if all linked rooms have ended
UPDATE public.questions q
SET status    = 'open',
    updated_at = now()
WHERE q.status = 'in_debate'
  AND NOT EXISTS (
    SELECT 1 FROM public.rooms r
    WHERE r.question_id = q.id
      AND r.status IN ('waiting', 'live')
  );
