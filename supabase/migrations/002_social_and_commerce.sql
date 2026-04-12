-- ============================================================
-- Debate App — Migration 002: Social Features & Commerce
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================


-- ────────────────────────────────────────
-- SOCIAL: FOLLOWS
-- Users can follow other users (commentators, debaters).
-- Drives the "notify me when they go live" feature.
-- ────────────────────────────────────────

CREATE TABLE public.follows (
  follower_id   uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at    timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX idx_follows_follower  ON public.follows (follower_id);
CREATE INDEX idx_follows_following ON public.follows (following_id);


-- ────────────────────────────────────────
-- SOCIAL: NOTIFICATIONS
-- Inbox for all user-facing events.
-- `data` jsonb carries type-specific payload (room_id, sender name, etc.)
-- ────────────────────────────────────────

CREATE TABLE public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN (
    'speaker_live',       -- a followed user went live as a speaker
    'room_invite',        -- host invited you to speak in a room
    'invite_accepted',    -- someone accepted your speaker invite
    'invite_declined',    -- someone declined your speaker invite
    'reaction_received',  -- someone threw a reaction at you
    'follow'              -- someone followed you
  )),
  data        jsonb NOT NULL DEFAULT '{}',
  read_at     timestamptz,
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_notifications_user   ON public.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications (user_id) WHERE read_at IS NULL;


-- ────────────────────────────────────────
-- ROOMS: SPEAKER INVITES
-- Host can directly invite specific users to speak.
-- Invited users can accept (joining as speaker) or decline.
-- ────────────────────────────────────────

CREATE TABLE public.speaker_invites (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  invited_by      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invited_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at      timestamptz DEFAULT now() NOT NULL,
  responded_at    timestamptz,
  UNIQUE (room_id, invited_user_id)
);

CREATE INDEX idx_invites_room ON public.speaker_invites (room_id);
CREATE INDEX idx_invites_user ON public.speaker_invites (invited_user_id, status);


-- ────────────────────────────────────────
-- COMMERCE: ITEM TYPES
-- Seeded catalogue of throwable/giftable reactions.
-- coin_price is in internal coins, not USD (keep payment provider out of this table).
-- ────────────────────────────────────────

CREATE TABLE public.item_types (
  id          text PRIMARY KEY,   -- 'clap', 'tomato', etc. — stable identifier used in code
  name        text NOT NULL,
  emoji       text NOT NULL,
  coin_price  int NOT NULL CHECK (coin_price > 0),
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now() NOT NULL
);

INSERT INTO public.item_types (id, name, emoji, coin_price, sort_order) VALUES
  ('clap',     'Clap',     '👏', 1,  1),
  ('tomato',   'Tomato',   '🍅', 2,  2),
  ('rose',     'Rose',     '🌹', 5,  3),
  ('fire',     'Fire',     '🔥', 2,  4),
  ('confetti', 'Confetti', '🎉', 3,  5),
  ('boo',      'Boo',      '👎', 1,  6);


-- ────────────────────────────────────────
-- COMMERCE: USER WALLETS
-- Each user has a coin balance. Coins are purchased via in-app purchase
-- and spent on reactions. Never go negative (DB constraint).
-- ────────────────────────────────────────

CREATE TABLE public.user_wallets (
  user_id     uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  coins       int NOT NULL DEFAULT 0 CHECK (coins >= 0),
  updated_at  timestamptz DEFAULT now() NOT NULL
);

-- Auto-create wallet on user signup (fires after handle_new_user creates the public.users row)
CREATE OR REPLACE FUNCTION public.handle_new_wallet()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_wallet
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_wallet();


-- ────────────────────────────────────────
-- COMMERCE: COIN PURCHASES
-- Audit log of every in-app purchase. The actual coin credit
-- happens server-side after verifying the payment reference.
-- ────────────────────────────────────────

CREATE TABLE public.coin_purchases (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  coins_purchased   int NOT NULL CHECK (coins_purchased > 0),
  amount_usd        numeric(10, 2) NOT NULL CHECK (amount_usd > 0),
  payment_provider  text,           -- 'apple_iap' | 'google_play' | 'stripe'
  payment_reference text,           -- provider transaction ID for reconciliation
  created_at        timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_coin_purchases_user ON public.coin_purchases (user_id, created_at DESC);


-- ────────────────────────────────────────
-- COMMERCE: ROOM REACTIONS
-- A user spends coins to throw a reaction at a specific speaker.
-- quantity allows sending multiples in one tap (e.g. 5 claps at once).
-- Realtime-enabled so the room UI can animate incoming reactions live.
-- ────────────────────────────────────────

CREATE TABLE public.room_reactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  from_user_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_type_id  text NOT NULL REFERENCES public.item_types(id),
  quantity      int NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 50),
  created_at    timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_reactions_room ON public.room_reactions (room_id, created_at DESC);
CREATE INDEX idx_reactions_to   ON public.room_reactions (to_user_id, room_id);


-- ────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────

ALTER TABLE public.follows         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaker_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_types      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_purchases  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_reactions  ENABLE ROW LEVEL SECURITY;

-- follows: public read, self-write
CREATE POLICY "Follows are publicly readable"
  ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- notifications: private to owner
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mark own notifications read"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- speaker_invites: public read, host writes, invitee responds
CREATE POLICY "Speaker invites are publicly readable"
  ON public.speaker_invites FOR SELECT USING (true);
CREATE POLICY "Room host can create invites"
  ON public.speaker_invites FOR INSERT WITH CHECK (auth.uid() = invited_by);
CREATE POLICY "Invited user can respond to invite"
  ON public.speaker_invites FOR UPDATE USING (auth.uid() = invited_user_id);

-- item_types: read-only public catalogue
CREATE POLICY "Item types are publicly readable"
  ON public.item_types FOR SELECT USING (true);

-- user_wallets: private to owner (server writes via service role)
CREATE POLICY "Users can read own wallet"
  ON public.user_wallets FOR SELECT USING (auth.uid() = user_id);

-- coin_purchases: private to owner
CREATE POLICY "Users can read own purchases"
  ON public.coin_purchases FOR SELECT USING (auth.uid() = user_id);

-- room_reactions: public read, auth write
CREATE POLICY "Reactions are publicly readable"
  ON public.room_reactions FOR SELECT USING (true);
CREATE POLICY "Auth users can react"
  ON public.room_reactions FOR INSERT WITH CHECK (auth.uid() = from_user_id);


-- ────────────────────────────────────────
-- REALTIME
-- room_participants: needed for participant list updates (joins, leaves)
-- room_reactions:    needed for live reaction animations in the room
-- notifications:     needed for real-time inbox delivery
-- speaker_invites:   needed so host and invitee see status changes live
-- ────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.speaker_invites;
