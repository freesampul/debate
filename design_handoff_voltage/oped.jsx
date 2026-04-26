// OP-ED — Direction B: Editorial, warm, discourse-forward
const O = window.OPED;

function OpedTokens() {
  return (
    <div style={{ width: 1040, padding: 48, background: O.bg, color: O.ink, fontFamily: O.font.body }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: `1px solid ${O.line}`, paddingBottom: 24, marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: O.font.mono, fontSize: 11, color: O.pro, letterSpacing: 2, marginBottom: 8 }}>DIRECTION B · 01</div>
          <div style={{ fontFamily: O.font.display, fontSize: 80, fontWeight: 400, letterSpacing: -1, lineHeight: 0.95, fontStyle: 'italic' }}>Op-Ed</div>
          <div style={{ fontSize: 15, color: O.muted, marginTop: 10, maxWidth: 560, lineHeight: 1.5 }}>{O.description}</div>
        </div>
        <div style={{ padding: '6px 12px', border: `1px solid ${O.con}`, color: O.con, fontFamily: O.font.mono, fontSize: 11, letterSpacing: 2, borderRadius: 2 }}>VOL · 001</div>
      </div>

      <div style={{ fontFamily: O.font.mono, fontSize: 11, color: O.muted, letterSpacing: 2, marginBottom: 16 }}>01 · COLOR</div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 8 }}>
        <Swatch color={O.bg} label="bg" value={O.bg} />
        <Swatch color={O.surface} label="surface" value={O.surface} />
        <Swatch color={O.surfaceAlt} label="surface-2" value={O.surfaceAlt} />
        <Swatch color={O.ink} label="ink (cream)" value={O.ink} ink="#000" />
        <Swatch color={O.muted} label="muted" value={O.muted} ink="#000" />
      </div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 32 }}>
        <Swatch color={O.pro} label="pro · affirm" value={O.pro} ink="#000" />
        <Swatch color={O.con} label="con · rebut" value={O.con} />
        <Swatch color={O.accent} label="accent" value={O.accent} ink="#000" />
        <Swatch color={O.live} label="live" value={O.live} />
      </div>

      <div style={{ fontFamily: O.font.mono, fontSize: 11, color: O.muted, letterSpacing: 2, marginBottom: 16 }}>02 · TYPE · INSTRUMENT SERIF + INTER</div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: O.font.display, fontSize: 110, fontWeight: 400, letterSpacing: -2, lineHeight: 0.95, fontStyle: 'italic' }}>A fair hearing.</div>
        <div style={{ fontFamily: O.font.display, fontSize: 48, fontWeight: 400, letterSpacing: -0.5, lineHeight: 1.05, marginTop: 14 }}>Pineapple belongs on pizza.</div>
        <div style={{ fontFamily: O.font.body, fontSize: 18, color: O.ink, lineHeight: 1.55, maxWidth: 680, marginTop: 18 }}>Room titles read like headlines. Motions read like claims. The feel is of a weekly magazine — opinionated but not cheap. Inter handles UI and body; Instrument Serif carries the moments that matter.</div>
        <div style={{ fontFamily: O.font.mono, fontSize: 12, color: O.pro, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 14 }}>MONO · CATEGORY · TIMESTAMP · METADATA</div>
      </div>

      <div style={{ fontFamily: O.font.mono, fontSize: 11, color: O.muted, letterSpacing: 2, marginBottom: 16 }}>03 · SHAPE</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, alignItems: 'flex-end' }}>
        {[{ k: 'sm', v: O.radius.sm }, { k: 'md', v: O.radius.md }, { k: 'lg', v: O.radius.lg }, { k: 'xl', v: O.radius.xl }, { k: 'pill', v: 9999 }].map(r => (
          <div key={r.k} style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, background: O.surfaceAlt, borderRadius: r.v, border: `1px solid ${O.line}` }} />
            <div style={{ fontFamily: O.font.mono, fontSize: 10, color: O.muted, marginTop: 6 }}>{r.k} · {r.v === 9999 ? '∞' : r.v}</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: O.font.mono, fontSize: 11, color: O.muted, letterSpacing: 2, marginBottom: 16 }}>04 · VOICE</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, fontSize: 14, lineHeight: 1.6 }}>
        <div style={{ padding: 20, background: O.surface, borderRadius: 6, border: `1px solid ${O.line}` }}>
          <div style={{ color: O.pro, fontFamily: O.font.mono, fontSize: 11, letterSpacing: 1.5, marginBottom: 8 }}>DO</div>
          <div style={{ color: O.ink }}>"Make your case." "Yield the floor." "Rebuttal." Words that suggest a real debate has rules, stakes, and a structure worth respecting.</div>
        </div>
        <div style={{ padding: 20, background: O.surface, borderRadius: 6, border: `1px solid ${O.line}` }}>
          <div style={{ color: O.con, fontFamily: O.font.mono, fontSize: 11, letterSpacing: 1.5, marginBottom: 8 }}>DON'T</div>
          <div style={{ color: O.ink }}>"Drop a W." "Let's goooo." Don't mimic TikTok. The edge here is that the app treats people like adults and still feels contemporary.</div>
        </div>
      </div>
    </div>
  );
}

// ─── Components ─────────────────────────────────────────────
function OpedComponents() {
  return (
    <div style={{ width: 1040, padding: 48, background: O.bg, color: O.ink, fontFamily: O.font.body }}>
      <div style={{ fontFamily: O.font.mono, fontSize: 11, color: O.pro, letterSpacing: 2, marginBottom: 8 }}>DIRECTION B · 02</div>
      <div style={{ fontFamily: O.font.display, fontSize: 64, fontWeight: 400, letterSpacing: -1, marginBottom: 40, lineHeight: 1, fontStyle: 'italic' }}>Components</div>

      <OLabel text="BUTTONS" />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
        <OBtn variant="pro">Affirm</OBtn>
        <OBtn variant="con">Rebut</OBtn>
        <OBtn variant="primary">Open a room</OBtn>
        <OBtn variant="ghost">Listen in</OBtn>
        <OBtn variant="pro" size="sm">Follow</OBtn>
        <OBtn variant="ghost" size="sm">Share quote</OBtn>
      </div>

      <OLabel text="BADGES" />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 40, alignItems: 'center' }}>
        <OLiveBadge />
        <OPill bg={O.surfaceAlt} fg={O.ink} border={O.line}>OPENS IN 4 MIN</OPill>
        <OPill bg="transparent" fg={O.pro} border={O.pro}>AFFIRMATIVE</OPill>
        <OPill bg="transparent" fg={O.con} border={O.con}>NEGATIVE</OPill>
        <OPill bg={O.accent} fg={O.proInk}>HOST</OPill>
        <OPill bg={O.surface} fg={O.muted} border={O.line}>412 listening</OPill>
      </div>

      <OLabel text="VOTE MARGIN · signature" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginBottom: 40 }}>
        <OMargin forPct={62} total={847} title="Therapy-speak ruins relationships" />
        <OMargin forPct={18} total={312} title="Open offices were a success" />
      </div>

      <OLabel text="ROOM CARDS" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
        <ORoomCard live title="Is therapy-speak ruining relationships?" host="Maya Okafor" forPct={62} listeners={1204} />
        <ORoomCard title="Taylor Swift is overrated" host="Dan Nguyen" forPct={34} listeners={89} opens="4 min" />
      </div>

      <OLabel text="CHAT · a written record" />
      <div style={{ padding: 20, background: O.surface, borderRadius: 6, border: `1px solid ${O.line}`, marginBottom: 40 }}>
        <OChat user="mags.okafor" text="The term itself has been drained of meaning." side="pro" />
        <OChat user="ethan.dao" text="Disagree — it gives people vocabulary they didn't have before." side="con" />
        <OChat user="lena.w" text="Both can be true at the same time." />
        <OChat user="Maya (host)" text="One minute left for closing statements." host />
      </div>

      <OLabel text="TAB BAR" />
      <div style={{ padding: 20, background: O.surface, borderRadius: 6, marginBottom: 40 }}>
        <OpedTabBar />
      </div>
    </div>
  );
}

function OLabel({ text }) { return <div style={{ fontFamily: O.font.mono, fontSize: 11, color: O.muted, letterSpacing: 2, marginBottom: 16 }}>{text}</div>; }

function OBtn({ children, variant = 'primary', size = 'md' }) {
  const sizes = { sm: { padding: '6px 14px', fontSize: 13, height: 32 }, md: { padding: '12px 22px', fontSize: 15, height: 46 } };
  const v = {
    pro: { bg: O.pro, fg: O.proInk, border: O.pro },
    con: { bg: 'transparent', fg: O.con, border: O.con },
    primary: { bg: O.ink, fg: O.bg, border: O.ink },
    ghost: { bg: 'transparent', fg: O.ink, border: O.line },
  }[variant];
  return <button style={{
    ...sizes[size], background: v.bg, color: v.fg, border: `1px solid ${v.border}`,
    borderRadius: 4, fontFamily: O.font.body, fontWeight: 500, letterSpacing: 0, cursor: 'pointer',
  }}>{children}</button>;
}

function OPill({ children, bg, fg, border }) {
  return <span style={{
    display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 8px',
    background: bg, color: fg, border: border ? `1px solid ${border}` : 'none',
    borderRadius: 2, fontFamily: O.font.mono, fontSize: 10, fontWeight: 600, letterSpacing: 1.5,
  }}>{children}</span>;
}

function OLiveBadge() {
  return <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 22, padding: '0 8px',
    background: O.con, color: O.conInk, borderRadius: 2, fontFamily: O.font.mono, fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
  }}>
    <span style={{ width: 6, height: 6, borderRadius: 3, background: O.conInk, animation: 'pulse 1.2s ease-in-out infinite' }} />
    ON AIR
  </span>;
}

function OMargin({ forPct, total, title }) {
  const against = 100 - forPct;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontFamily: O.font.display, fontSize: 20, fontStyle: 'italic' }}>{title}</div>
        <div style={{ fontFamily: O.font.mono, fontSize: 10, color: O.muted, letterSpacing: 1.5 }}>{total} VOTES</div>
      </div>
      <div style={{ position: 'relative', height: 32, background: O.surface, border: `1px solid ${O.line}`, borderRadius: 2 }}>
        {/* center line */}
        <div style={{ position: 'absolute', left: '50%', top: -4, bottom: -4, width: 1, background: O.muted }} />
        {/* against bar */}
        {against > 50 && <div style={{ position: 'absolute', right: '50%', top: 0, bottom: 0, width: `${against - 50}%`, background: O.con }} />}
        {against <= 50 && <div style={{ position: 'absolute', left: `${against}%`, top: 0, bottom: 0, width: `${50 - against}%`, background: O.con, opacity: 0.25 }} />}
        {/* for bar */}
        {forPct > 50 && <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: `${forPct - 50}%`, background: O.pro }} />}
        {forPct <= 50 && <div style={{ position: 'absolute', left: `${50}%`, top: 0, bottom: 0, width: `${0}%` }} />}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: O.font.mono, fontSize: 10, letterSpacing: 1.5 }}>
        <span style={{ color: O.con }}>NEGATIVE {against}%</span>
        <span style={{ color: O.pro }}>{forPct}% AFFIRMATIVE</span>
      </div>
    </div>
  );
}

function ORoomCard({ title, host, forPct, listeners, live, opens }) {
  return (
    <div style={{ background: O.surface, borderRadius: 6, padding: 22, border: `1px solid ${O.line}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {live && <OLiveBadge />}
          {opens && <OPill bg={O.surfaceAlt} fg={O.warn} border={O.line}>OPENS · {opens}</OPill>}
        </div>
        <span style={{ fontFamily: O.font.mono, fontSize: 10, color: O.muted, letterSpacing: 1 }}>{listeners.toLocaleString()} listening</span>
      </div>
      <div style={{ fontFamily: O.font.display, fontSize: 22, fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.4 }}>{title}</div>

      <div style={{ position: 'relative', height: 6, background: O.surfaceAlt, borderRadius: 1 }}>
        <div style={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: 1, background: O.dim }} />
        {(100 - forPct) > 50
          ? <div style={{ position: 'absolute', right: '50%', top: 0, bottom: 0, width: `${(100 - forPct) - 50}%`, background: O.con }} />
          : null}
        {forPct > 50
          ? <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: `${forPct - 50}%`, background: O.pro }} />
          : null}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, borderTop: `1px solid ${O.line}` }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: 11, background: O.accent, color: O.proInk, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: O.font.display, fontSize: 12, fontStyle: 'italic' }}>{host[0]}</div>
          <span style={{ fontFamily: O.font.mono, fontSize: 10, color: O.muted, letterSpacing: 0.5 }}>HOST · {host}</span>
        </div>
      </div>
    </div>
  );
}

function OChat({ user, text, side, host }) {
  const c = side === 'pro' ? O.pro : side === 'con' ? O.con : O.muted;
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${O.line}` }}>
      <div style={{ width: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
        <div style={{ width: 6, height: 6, borderRadius: 3, background: c }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 2 }}>
          <span style={{ fontFamily: O.font.body, fontSize: 12, color: O.ink, fontWeight: 600 }}>{user}</span>
          {host && <span style={{ fontFamily: O.font.mono, fontSize: 9, color: O.accent, letterSpacing: 1 }}>MODERATOR</span>}
        </div>
        <div style={{ fontFamily: O.font.body, fontSize: 14, color: O.ink, lineHeight: 1.4 }}>{text}</div>
      </div>
    </div>
  );
}

function OpedTabBar({ active = 'rooms' }) {
  const items = [
    { k: 'rooms', label: 'Rooms' },
    { k: 'motions', label: 'Motions' },
    { k: 'new', label: '＋', primary: true },
    { k: 'notes', label: 'Notes' },
    { k: 'you', label: 'You' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', borderTop: `1px solid ${O.line}`, paddingTop: 12 }}>
      {items.map(it => {
        if (it.primary) return <div key={it.k} style={{
          width: 44, height: 44, borderRadius: 4, background: O.ink, color: O.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: O.font.display, fontSize: 24,
        }}>{it.label}</div>;
        return <div key={it.k} style={{
          fontFamily: O.font.display, fontSize: 16, fontStyle: 'italic',
          color: active === it.k ? O.ink : O.dim,
          borderBottom: active === it.k ? `1px solid ${O.ink}` : '1px solid transparent',
          paddingBottom: 4,
        }}>{it.label}</div>;
      })}
    </div>
  );
}

Object.assign(window, { OpedTokens, OpedComponents, OBtn, OPill, OLiveBadge, OMargin, ORoomCard, OChat, OpedTabBar });
