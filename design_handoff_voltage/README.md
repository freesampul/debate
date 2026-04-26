# Handoff: Debate App — Voltage Design System v1

## Overview

This is a complete visual + component redesign of the live-debate mobile app (`freesampul/debate`). It applies the **Voltage** color system (electric blue × hot pink, lime accent) on top of the existing Expo/React Native codebase, and adds several new flows (onboarding, polished auth) plus a handful of missing DB fields.

The designs are built as high-fidelity interactive HTML prototypes in this folder. They are **design references**, not code to ship. Recreate them inside the existing Expo app using React Native primitives + StyleSheet + the existing navigation (Expo Router) and data layer (Supabase + LiveKit).

## Fidelity

**High-fidelity.** All colors, type scales, spacing, radii, and component structure are final. Recreate pixel-to-pixel in React Native using `StyleSheet.create`. Map the tokens below to a `mobile/theme/voltage.ts` file and refactor existing screens to consume them.

---

## Design Tokens (Voltage)

```ts
// mobile/theme/voltage.ts
export const theme = {
  color: {
    bg:         '#0B0B0F', // app background
    surface:    '#15151C', // cards, sheets
    surfaceAlt: '#1E1E28', // raised / pressed surfaces
    line:       '#2A2A38', // 1px hairlines, card borders
    ink:        '#F5F5F7', // primary text
    muted:      '#8E8EA0', // secondary text
    dim:        '#5A5A70', // tertiary, disabled
    pro:        '#2D7BFF', // FOR / affirm — electric blue
    proInk:     '#FFFFFF', // text on pro bg
    con:        '#FF2D87', // AGAINST / rebut — hot pink
    conInk:     '#0B0B0F', // text on con bg
    accent:     '#C6FF3D', // reserved for hosts, CTAs, vote highlights
    warn:       '#FFB800', // waiting states
    live:       '#FF2D87', // "ON AIR" dot / badge (same as con)
  },
  radius: { sm: 8, md: 14, lg: 22, xl: 32, pill: 9999 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32 },
  font: {
    display: 'SpaceGrotesk',      // headlines, buttons, room titles
    body: 'SpaceGrotesk',         // same family, lighter weights
    mono: 'JetBrainsMono',        // metadata, tags, counters, badges
  },
  type: {
    displayXL: { size: 44, weight: '700', letterSpacing: -1.5, lineHeight: 44 },
    displayLG: { size: 36, weight: '700', letterSpacing: -1.2, lineHeight: 38 },
    displayMD: { size: 26, weight: '600', letterSpacing: -0.5, lineHeight: 30 },
    titleLG:   { size: 22, weight: '600', letterSpacing: -0.4, lineHeight: 26 },
    body:      { size: 15, weight: '400', lineHeight: 22 },
    bodySM:    { size: 13, weight: '400', lineHeight: 18 },
    label:     { size: 11, weight: '700', letterSpacing: 2, font: 'JetBrainsMono' },
    tag:       { size: 10, weight: '700', letterSpacing: 1.5, font: 'JetBrainsMono' },
  },
};
```

**Fonts to add** via `expo-font`:
- Space Grotesk (400, 500, 600, 700)
- JetBrains Mono (400, 500, 700)

Both on Google Fonts. Use `expo-google-fonts/space-grotesk` and `expo-google-fonts/jetbrains-mono`.

---

## What's in the repo today (gap audit)

### ✅ Already implemented (visual refactor only)
- Rooms list, room detail, live/waiting states — rebrand using new tokens
- Questions feed — rebrand as "Takes"
- For/against voting — change colors and button shapes
- Chat messages — new bubble style
- Follows & notifications — exist, just needs new UI
- LiveKit audio join — untouched, visual only
- Auth (magic link via Supabase) — exists, needs new UI shell

### ⚠️ Partial — needs UI + minor backend
- **Onboarding flow** — 3 intro screens before sign-up. Needs local flag (AsyncStorage `@voltage/onboarded=true`) to skip on re-open.
- **Handle picker w/ live availability** — `users.username` is already unique. Add backend endpoint:
  ```
  GET /api/v1/users/check-handle?handle=xyz → { available: boolean, suggestions?: string[] }
  ```
- **Magic-link sent screen w/ resend cooldown** — UI + 60s client-side cooldown; Supabase handles the rest.

### ❌ Missing — needs schema + API
- **Room/question categories** (CULTURE, WORK, MUSIC, TECH, POLITICS, SOCIETY). Add:
  ```sql
  ALTER TABLE questions ADD COLUMN category text;
  ALTER TABLE rooms ADD COLUMN category text;
  CREATE INDEX questions_category_idx ON questions (category);
  ```
  Seed a fixed enum in shared types.
- **Featured/trending ranking.** Add either a `featured` boolean OR compute via `listeners * recency`. Start with a simple trending view in Postgres:
  ```sql
  CREATE VIEW trending_rooms AS
  SELECT rooms.*,
    (SELECT count(*) FROM room_participants WHERE room_id = rooms.id AND left_at IS NULL) AS current_listeners
  FROM rooms
  WHERE status = 'live'
  ORDER BY current_listeners DESC, created_at DESC;
  ```
- **Onboarded flag** — optional, can live client-side only. If you want server-side: `ALTER TABLE users ADD COLUMN onboarded_at timestamptz;`

---

## Screens

### 1. Onboarding 01 — Pick a side
- Full-bleed dark bg `#0B0B0F`.
- Status bar white.
- Top: mono label `01 / 03` in `#2D7BFF`, letter-spacing 2.
- Middle: a **220px tall split rectangle**, 36% pink (✗ glyph) / 64% blue (✓ glyph), radius 28, with a 2px `#0B0B0F` center divider at 50% opacity 0.5.
- Below: display headline "Pick a side.\nWatch it move." — 44px/700, letter-spacing -1.5, centered.
- Subcopy: 15px muted `#8E8EA0`, max 320px, centered.
- CTA: pill button 54px tall, bg `#2D7BFF`, white text, "Continue".
- `SKIP` mono link underneath.

### 2. Onboarding 02 — Rooms open all the time
- Same chrome. 3 stacked fake room cards at top, each showing a 36x36 mini split meter + title + LIVE tag. Then headline "Rooms open\nall the time." + subcopy.

### 3. Onboarding 03 — Follow the loud ones
- Row of 4 speaker avatars (56px, alternating blue/pink bg, with colored glow box-shadow ring). Headline "Follow the\nloud ones." + subcopy. CTA "Get started". Secondary "ALREADY HAVE AN ACCOUNT? SIGN IN".

### 4. Sign Up
- Back chevron in 36x36 surface circle at top-left.
- Mono label `NEW HERE` in blue.
- Display headline "Start shouting." 44px/700.
- Subcopy: "We'll send you a magic link. No passwords."
- **Email field**: 56px tall, bg `#15151C`, 1.5px border `#2D7BFF` when focused, radius 14, 16px body text, blinking blue cursor.
- **Primary CTA**: "Send magic link →", pill 54px, bg `#2D7BFF`.
- `OR` divider with hairlines.
- Google / Apple continue buttons: 52px, surface bg, line border, 26 radius.
- Footer small print muted: "By continuing you agree to our Terms & Privacy. Be real. Be loud. Don't be a dick."

### 5. Magic Link Sent
- Centered layout.
- 120x120 blue circle w/ lime `✦` glyph, box-shadow rings `0 0 0 8px #2D7BFF22, 0 0 0 20px #2D7BFF11`.
- Headline "Check your email."
- Body: "We sent a link to **you@domain.com**. Tap it on this device to sign in."
- Mono counter "RESEND IN 0:42".

### 6. Pick Handle
- Mono label `STEP 02`, headline "Pick a handle.", subcopy "How people will find you mid-fight."
- **Handle field**: 64px, bg surface, 1.5px blue border when valid, radius 16. Text is "@" muted + handle bold + blinking blue cursor.
- Availability state: `✓ AVAILABLE` in blue mono, 11px letter-spacing 1, right after field.
- **Suggestions**: row of 5 pill chips, 32px, line border, mono text.
- Bottom CTA "Claim @jay.debates →" pill 54px blue.

### 7. Rooms (Home) — see `arena-screens.jsx ArenaRoomsScreen`
- Mono "● LIVE NOW" in blue + display "Rooms" 40px.
- Horizontal filter chip scroller (selected chip has `ink` bg + `bg` text, others are surface/muted).
- **Featured card**: 24-radius, `linear-gradient(135deg, #FF2D87, #6B4BFF)` bg (re-map accent to `#6B4BFF` if you want, or solid pink). Contains LIVE pill (black bg, lime text), listener count pill, display 26px title, avatar stack, host handle mono.
- **Mini room cards**: 18-radius surface cards w/ 40px vertical split meter on left showing percentage numbers inside.
- Bottom nav (see below).

### 8. In-Room — see `ArenaRoomDetailScreen`
- Top bar: back button + LIVE badge + listener pill + overflow.
- Motion block: mono "THE MOTION" label + 26px display title.
- **Speaker grid**: 4 circular tiles (60px) with colored border + glow ring while speaking. Side-indicator 18px dot in bottom-right corner (blue ✓ or pink ✗).
- **Giant meter**: 14px tall pill bar with 28/72 split, percentages above as mono.
- Chat: scroll region with bubbles. Each bubble = 28px circle avatar + handle (colored by side) + optional "● PRO/CON" side tag + body text.
- **Vote bar pinned bottom**: two 52x flex pill buttons — pink `✗ AGAINST` + blue `✓ FOR`.

### 9. Takes / Motions — see `ArenaQuestionsScreen`
- Mono `#HOTTAKES` label, display "Takes" 40px, subcopy.
- List of ranked cards: 28px rank numeral (dim) + display title + mono vote count + "3 ROOMS LIVE" tag (pink) + round 44px play button (blue).
- FAB bottom-right: 56px lime circle, `+` glyph, blue glow shadow `0 8px 24px #2D7BFF55`.

### 10. Bottom Nav
Tab bar with 5 items, centered, surface bg, 28 radius container, 8 padding, 1px line border:
- Rooms (◎)
- Takes (❝)
- **Create** — primary 52px lime circle with `+`
- Inbox (✦)
- Me (●)

Active = ink, inactive = dim.

---

## Components (map to React Native)

All in `mobile/components/voltage/`:

- `<VButton variant="pro|con|primary|ghost" size="sm|md">` — Pressable w/ pill radius, display font 700.
- `<VPill bg fg border>` — mono 11px, height 26, radius 999, horizontal padding 10.
- `<VLiveBadge>` — con-pink bg with pulsing dot (use `Animated` loop).
- `<VMeter forPct total orientation="h|v">` — the split bar (Animated.View widths).
- `<VRoomCard room onPress>` — replaces existing `RoomCard`.
- `<VChatBubble user text side host>` — replaces existing `ChatMessage`.
- `<VSpeakerTile name side speaking>` — replaces `ParticipantTile`.
- `<VBottomNav active>` — new; Expo Router custom `tabBar` prop.

Replace the existing `VotingDial.tsx` semicircle with the new horizontal split meter — it's the signature component and the old dial doesn't fit the new look.

---

## Interactions & behavior

- **Pulsing dot** (LIVE badge): `Animated.loop` on opacity 1→0.55, scale 1→0.85, 1200ms ease-in-out.
- **Meter update**: 600ms `Easing.out(cubic)` width transition on vote tick.
- **Vote tap**: haptic `Haptics.impactAsync(Medium)`, then the button briefly scales to 0.96 and back (spring).
- **Room card press**: 0.96 scale down, 150ms.
- **Handle field availability check**: debounce 400ms, hit `/api/v1/users/check-handle`, transition border color red→blue when valid.
- **Magic-link resend**: 60s countdown after submit; button disabled until 0.
- **Onboarding swipe**: horizontal FlatList `pagingEnabled`, 3 pages; dots indicator reflects `01/03`.

---

## State & data

Keep existing `useAuth`, `useRoom`, `useVotes` hooks. Add:
- `useOnboarding()` — reads/writes `@voltage/onboarded` in AsyncStorage.
- `useHandleAvailability(handle)` — debounced lookup + suggestions.
- `useResendCooldown(seconds)` — tick-down timer hook for magic-link screen.

---

## Migration order (recommended)

1. **Tokens + fonts** — land the theme file, load Space Grotesk + JetBrains Mono, swap global colors. (1 PR)
2. **Component library** — build `components/voltage/*` in isolation with a Storybook-style screen. (1 PR)
3. **Existing screens** — re-skin Rooms, Room detail, Questions, Profile. No new features. (1 PR)
4. **Auth UI refresh** — new Sign Up, Magic Link Sent, Pick Handle screens. (1 PR)
5. **Onboarding** — 3-step flow + AsyncStorage flag. (1 PR)
6. **Categories** — schema migration + filter chips + ranking. (1 PR)

---

## Files in this handoff

- `index.html` — master design canvas (open in a browser to pan/zoom through everything)
- `systems.jsx` — ARENA/OPED token constants
- `arena.jsx` / `arena-screens.jsx` — component + 3 main screens
- `color-variants.jsx` — the three color options (**Voltage** is chosen — variant `v1`)
- `naming.jsx` — 6 name candidates + wordmarks + app icons (still to pick)
- `onboarding-auth.jsx` — 3 onboarding screens + 3 auth screens
- `oped.jsx` / `oped-screens.jsx` — alternate direction, not chosen, kept for reference
- `design-canvas.jsx` / `ios-frame.jsx` — helpers for the canvas

## Naming

**Working name: Pivot.** Chosen for now with the expectation it may change — the movement of the vote meter is the core metaphor, so the name fits. Treat every string, bundle ID, and asset reference as a single source of truth (`APP_NAME` constant + `app.config.ts` bundle id) so a future rename is one find-and-replace, not fifty.

**Wordmark:** see `naming.jsx` — the Pivot wordmark uses Space Grotesk 700 italic with a 90° arrow glyph replacing the `i` dot, on the blue `#2D7BFF`. Icon is the same glyph centered on blue, lime accent stroke.

Other candidates kept in `naming.jsx` for reference: FLOOR, Ringside, mic., Versus, hotfloor.
