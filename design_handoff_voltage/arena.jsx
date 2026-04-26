// ARENA — Direction A components & screens
// Loud, sport-energy, trading-card.
const A = window.ARENA;

// ─── Tokens card ────────────────────────────────────────────
function ArenaTokens() {
  return (
    <div style={{
      width: 1040, padding: 48, background: A.bg, color: A.ink,
      fontFamily: A.font.body,
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: `1px solid ${A.line}`, paddingBottom: 24, marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: A.font.mono, fontSize: 11, color: A.pro, letterSpacing: 2, marginBottom: 8 }}>DIRECTION A · 01</div>
          <div style={{ fontFamily: A.font.display, fontSize: 72, fontWeight: 700, letterSpacing: -2, lineHeight: 0.95 }}>ARENA</div>
          <div style={{ fontSize: 16, color: A.muted, marginTop: 10, maxWidth: 560 }}>{A.description}</div>
        </div>
        <div style={{
          padding: '6px 12px', border: `1px solid ${A.con}`, color: A.con,
          fontFamily: A.font.mono, fontSize: 11, letterSpacing: 2, borderRadius: 4,
        }}>● LIVE · v0.1</div>
      </div>

      {/* color */}
      <div style={{ fontFamily: A.font.mono, fontSize: 11, color: A.muted, letterSpacing: 2, marginBottom: 16 }}>01 · COLOR</div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 8 }}>
        <Swatch color={A.bg} label="bg" value={A.bg} />
        <Swatch color={A.surface} label="surface" value={A.surface} />
        <Swatch color={A.surfaceAlt} label="surface-2" value={A.surfaceAlt} />
        <Swatch color={A.ink} label="ink" value={A.ink} ink="#000" />
        <Swatch color={A.muted} label="muted" value={A.muted} />
      </div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 32 }}>
        <Swatch color={A.pro} label="pro · FOR" value={A.pro} ink="#000" />
        <Swatch color={A.con} label="con · AGAINST" value={A.con} />
        <Swatch color={A.accent} label="accent" value={A.accent} />
        <Swatch color={A.warn} label="warn" value={A.warn} ink="#000" />
        <Swatch color={A.live} label="live" value={A.live} />
      </div>

      {/* type */}
      <div style={{ fontFamily: A.font.mono, fontSize: 11, color: A.muted, letterSpacing: 2, marginBottom: 16 }}>02 · TYPE · SPACE GROTESK + JETBRAINS MONO</div>
      <div style={{ display: 'grid', gap: 4, marginBottom: 32 }}>
        <div style={{ fontFamily: A.font.display, fontSize: 96, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>Hot take.</div>
        <div style={{ fontFamily: A.font.display, fontSize: 56, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.05 }}>Pineapple belongs on pizza.</div>
        <div style={{ fontFamily: A.font.display, fontSize: 28, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.2, marginTop: 10 }}>Medium weight headline for room titles and callouts.</div>
        <div style={{ fontFamily: A.font.body, fontSize: 16, color: A.muted, lineHeight: 1.5, maxWidth: 640 }}>Body copy. Used sparingly — this product is about voices, not text. Keep it short, punchy, declarative. The app does the shouting; the UI shouldn't.</div>
        <div style={{ fontFamily: A.font.mono, fontSize: 12, color: A.pro, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 8 }}>MONO · TAGS · METADATA · COUNTS · LIVE BADGES</div>
      </div>

      {/* radius & spacing */}
      <div style={{ fontFamily: A.font.mono, fontSize: 11, color: A.muted, letterSpacing: 2, marginBottom: 16 }}>03 · SHAPE</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, alignItems: 'flex-end' }}>
        {[{ k: 'sm', v: A.radius.sm }, { k: 'md', v: A.radius.md }, { k: 'lg', v: A.radius.lg }, { k: 'xl', v: A.radius.xl }, { k: 'pill', v: 9999 }].map(r => (
          <div key={r.k} style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, background: A.surfaceAlt, borderRadius: r.v, border: `1px solid ${A.line}` }} />
            <div style={{ fontFamily: A.font.mono, fontSize: 10, color: A.muted, marginTop: 6 }}>{r.k} · {r.v === 9999 ? '∞' : r.v}</div>
          </div>
        ))}
      </div>

      {/* voice */}
      <div style={{ fontFamily: A.font.mono, fontSize: 11, color: A.muted, letterSpacing: 2, marginBottom: 16 }}>04 · VOICE</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, fontSize: 14, lineHeight: 1.6 }}>
        <div style={{ padding: 20, background: A.surface, borderRadius: 14, border: `1px solid ${A.line}` }}>
          <div style={{ color: A.pro, fontFamily: A.font.mono, fontSize: 11, letterSpacing: 1.5, marginBottom: 8 }}>DO</div>
          <div>"Who's winning?" "Cook him." "Drop a W." Verbs, not nouns. Copy should read like a group chat, not a press release.</div>
        </div>
        <div style={{ padding: 20, background: A.surface, borderRadius: 14, border: `1px solid ${A.line}` }}>
          <div style={{ color: A.con, fontFamily: A.font.mono, fontSize: 11, letterSpacing: 1.5, marginBottom: 8 }}>DON'T</div>
          <div>"Engage in structured discourse with the community." "Contribute your perspective." Polite corporate softspeak has no place here.</div>
        </div>
      </div>
    </div>
  );
}

// ─── Components card ────────────────────────────────────────
function ArenaComponents() {
  return (
    <div style={{ width: 1040, padding: 48, background: A.bg, color: A.ink, fontFamily: A.font.body }}>
      <div style={{ fontFamily: A.font.mono, fontSize: 11, color: A.pro, letterSpacing: 2, marginBottom: 8 }}>DIRECTION A · 02</div>
      <div style={{ fontFamily: A.font.display, fontSize: 56, fontWeight: 700, letterSpacing: -1.5, marginBottom: 40, lineHeight: 1 }}>Components</div>

      {/* BUTTONS */}
      <Label text="BUTTONS" />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
        <ArenaBtn variant="pro">VOTE FOR</ArenaBtn>
        <ArenaBtn variant="con">VOTE AGAINST</ArenaBtn>
        <ArenaBtn variant="primary">Start a room</ArenaBtn>
        <ArenaBtn variant="ghost">Join as audience</ArenaBtn>
        <ArenaBtn variant="pro" size="sm">+ Follow</ArenaBtn>
        <ArenaBtn variant="ghost" size="sm">Share</ArenaBtn>
      </div>

      {/* BADGES */}
      <Label text="BADGES" />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 40, alignItems: 'center' }}>
        <LiveBadge />
        <Pill bg={A.surfaceAlt} fg={A.ink} border={A.line}>WAITING · 2 min</Pill>
        <Pill bg={A.pro} fg={A.proInk}>+128 FOR</Pill>
        <Pill bg={A.con} fg={A.conInk}>−94 AGAINST</Pill>
        <Pill bg="transparent" fg={A.accent} border={A.accent}>HOST</Pill>
        <Pill bg={A.surface} fg={A.muted} border={A.line}>🎧 847 listening</Pill>
      </div>

      {/* VOTING DIAL */}
      <Label text="VOTING METER · signature" />
      <div style={{ display: 'flex', gap: 40, marginBottom: 40, alignItems: 'center' }}>
        <ArenaMeter forPct={62} total={847} />
        <ArenaMeter forPct={18} total={312} />
        <ArenaMeter forPct={50} total={12} />
      </div>

      {/* ROOM CARD */}
      <Label text="ROOM CARDS" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
        <ArenaRoomCard live title="Is therapy-speak ruining relationships?" topic="Labeling every conflict 'gaslighting' is the real problem." forPct={72} listeners={1204} speakers={['JM', 'RT', 'KL']} />
        <ArenaRoomCard title="Taylor Swift is overrated" topic="Her discography has peaks but it's not generational." forPct={34} listeners={89} speakers={['AS', 'DN']} waiting />
      </div>

      {/* CHAT BUBBLE */}
      <Label text="CHAT BUBBLES" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40, padding: 20, background: A.surface, borderRadius: 18, border: `1px solid ${A.line}` }}>
        <ChatBubble user="mags.7" text="this is a W take actually" side="pro" />
        <ChatBubble user="ethan_d" text="brother this is the worst opinion i've ever heard" side="con" />
        <ChatBubble user="lena" text="nuance? in THIS economy?" />
        <ChatBubble user="HOST · jay" text="y'all keep it civil or you're muted" host />
      </div>

      {/* BOTTOM NAV */}
      <Label text="BOTTOM NAV" />
      <div style={{ padding: 20, background: A.surface, borderRadius: 18, marginBottom: 40 }}>
        <ArenaBottomNav />
      </div>
    </div>
  );
}

function Label({ text }) {
  return <div style={{ fontFamily: A.font.mono, fontSize: 11, color: A.muted, letterSpacing: 2, marginBottom: 16 }}>{text}</div>;
}

function ArenaBtn({ children, variant = 'primary', size = 'md' }) {
  const sizes = {
    sm: { padding: '8px 14px', fontSize: 13, height: 34 },
    md: { padding: '14px 22px', fontSize: 15, height: 48 },
  };
  const variants = {
    pro: { bg: A.pro, fg: A.proInk, border: 'transparent' },
    con: { bg: A.con, fg: A.conInk, border: 'transparent' },
    primary: { bg: A.ink, fg: A.bg, border: 'transparent' },
    ghost: { bg: 'transparent', fg: A.ink, border: A.line },
  };
  const v = variants[variant]; const s = sizes[size];
  return (
    <button style={{
      ...s, background: v.bg, color: v.fg, border: `1.5px solid ${v.border === 'transparent' ? v.bg : v.border}`,
      borderRadius: 999, fontFamily: A.font.display, fontWeight: 700, letterSpacing: -0.2,
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, textTransform: variant === 'pro' || variant === 'con' ? 'uppercase' : 'none',
    }}>{children}</button>
  );
}

function Pill({ children, bg, fg, border }) {
  return <span style={{
    display: 'inline-flex', alignItems: 'center', height: 26, padding: '0 10px',
    background: bg, color: fg, border: border ? `1px solid ${border}` : 'none',
    borderRadius: 999, fontFamily: A.font.mono, fontSize: 11, fontWeight: 600, letterSpacing: 1,
  }}>{children}</span>;
}

function LiveBadge() {
  return <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, padding: '0 10px',
    background: A.con, color: A.conInk, borderRadius: 999,
    fontFamily: A.font.mono, fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
  }}>
    <span style={{ width: 7, height: 7, borderRadius: 4, background: A.conInk, animation: 'pulse 1.2s ease-in-out infinite' }} />
    LIVE
  </span>;
}

function ArenaMeter({ forPct, total }) {
  const againstPct = 100 - forPct;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 240, height: 64, display: 'flex',
        borderRadius: 12, overflow: 'hidden', border: `1px solid ${A.line}`,
        position: 'relative',
      }}>
        <div style={{ width: `${againstPct}%`, background: A.con, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: 12 }}>
          <span style={{ fontFamily: A.font.display, fontWeight: 700, color: A.conInk, fontSize: againstPct > 20 ? 22 : 0 }}>{againstPct}%</span>
        </div>
        <div style={{ width: `${forPct}%`, background: A.pro, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 12 }}>
          <span style={{ fontFamily: A.font.display, fontWeight: 700, color: A.proInk, fontSize: forPct > 20 ? 22 : 0 }}>{forPct}%</span>
        </div>
        {/* center divider */}
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: A.bg, opacity: 0.5 }} />
      </div>
      <div style={{ display: 'flex', gap: 24, fontFamily: A.font.mono, fontSize: 10, letterSpacing: 1.5 }}>
        <span style={{ color: A.con }}>● AGAINST</span>
        <span style={{ color: A.muted }}>{total} VOTES</span>
        <span style={{ color: A.pro }}>FOR ●</span>
      </div>
    </div>
  );
}

function ArenaRoomCard({ title, topic, forPct, listeners, speakers, live, waiting }) {
  return (
    <div style={{
      background: A.surface, borderRadius: 22, padding: 20,
      border: `1px solid ${A.line}`, display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {live && <LiveBadge />}
        {waiting && <Pill bg={A.surfaceAlt} fg={A.warn} border={A.line}>● WAITING</Pill>}
        <Pill bg={A.surfaceAlt} fg={A.muted} border={A.line}>🎧 {listeners.toLocaleString()}</Pill>
      </div>
      <div style={{ fontFamily: A.font.display, fontSize: 22, fontWeight: 600, lineHeight: 1.15, letterSpacing: -0.5 }}>{title}</div>
      <div style={{ fontSize: 13, color: A.muted, lineHeight: 1.4 }}>{topic}</div>

      {/* mini meter */}
      <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', background: A.surfaceAlt }}>
        <div style={{ width: `${100 - forPct}%`, background: A.con }} />
        <div style={{ width: `${forPct}%`, background: A.pro }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex' }}>
          {speakers.map((s, i) => (
            <div key={i} style={{
              width: 28, height: 28, borderRadius: 14, background: [A.pro, A.con, A.accent][i % 3],
              marginLeft: i ? -8 : 0, border: `2px solid ${A.surface}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: A.font.mono, fontSize: 10, fontWeight: 700, color: '#000',
            }}>{s}</div>
          ))}
        </div>
        <div style={{ fontFamily: A.font.mono, fontSize: 10, color: A.muted, letterSpacing: 1 }}>TAP TO ENTER →</div>
      </div>
    </div>
  );
}

function ChatBubble({ user, text, side, host }) {
  const color = side === 'pro' ? A.pro : side === 'con' ? A.con : A.muted;
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{
        width: 28, height: 28, borderRadius: 14, background: host ? A.accent : A.surfaceAlt,
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: A.font.mono, fontSize: 10, fontWeight: 700, color: host ? '#fff' : A.ink,
      }}>{user.slice(0, 2).toUpperCase()}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginBottom: 2 }}>
          <span style={{ fontFamily: A.font.mono, fontSize: 11, color, fontWeight: 700, letterSpacing: 0.5 }}>{user}</span>
          {side && <span style={{ fontFamily: A.font.mono, fontSize: 9, color, letterSpacing: 1 }}>● {side.toUpperCase()}</span>}
        </div>
        <div style={{ fontSize: 14, color: A.ink, lineHeight: 1.35 }}>{text}</div>
      </div>
    </div>
  );
}

function ArenaBottomNav({ active = 'rooms' }) {
  const items = [
    { k: 'rooms', label: 'Rooms', icon: '◎' },
    { k: 'questions', label: 'Takes', icon: '❝' },
    { k: 'create', label: '', icon: '+', primary: true },
    { k: 'inbox', label: 'Inbox', icon: '✦' },
    { k: 'me', label: 'Me', icon: '●' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', background: A.surfaceAlt, borderRadius: 28, padding: 8, border: `1px solid ${A.line}` }}>
      {items.map(it => {
        if (it.primary) {
          return <div key={it.k} style={{
            width: 52, height: 52, borderRadius: 26, background: A.pro, color: A.proInk,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: A.font.display, fontSize: 28, fontWeight: 500, lineHeight: 1,
          }}>{it.icon}</div>;
        }
        return <div key={it.k} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 12px',
          color: active === it.k ? A.ink : A.dim,
        }}>
          <span style={{ fontSize: 18, fontFamily: A.font.display }}>{it.icon}</span>
          <span style={{ fontFamily: A.font.mono, fontSize: 10, letterSpacing: 1, fontWeight: 700 }}>{it.label}</span>
        </div>;
      })}
    </div>
  );
}

Object.assign(window, { ArenaTokens, ArenaComponents, ArenaBtn, ArenaMeter, ArenaRoomCard, ChatBubble: ChatBubble, ArenaBottomNav, LiveBadge, Pill });
