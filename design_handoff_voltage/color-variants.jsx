// 3 Arena color variants + showcase.
// All share the same shape/type DNA as ARENA, only the opposition pair and accent change.

const VARIANTS = [
  {
    id: 'v1',
    name: 'Voltage',
    vibe: 'Electric blue vs hot pink — current era, neon nightlife',
    pro: '#2D7BFF', proInk: '#FFFFFF',
    con: '#FF2D87', conInk: '#0B0B0F',
    accent: '#C6FF3D',
  },
  {
    id: 'v2',
    name: 'Halftime',
    vibe: 'Tangerine vs cyan — Jackbox/trading-card, warm-cool split',
    pro: '#00E5D4', proInk: '#0B0B0F',
    con: '#FF6B2C', conInk: '#0B0B0F',
    accent: '#FFD93D',
  },
  {
    id: 'v3',
    name: 'Stadium',
    vibe: 'Red vs blue — the classic, but cranked to neon',
    pro: '#2D7BFF', proInk: '#FFFFFF',
    con: '#FF2D2D', conInk: '#FFFFFF',
    accent: '#FFCE3D',
  },
];
window.VARIANTS = VARIANTS;

function VariantHeader() {
  const A = window.ARENA;
  return (
    <div style={{ width: 1600, padding: '56px 56px 32px', background: A.bg, color: A.ink, fontFamily: A.font.body }}>
      <div style={{ fontFamily: A.font.mono, fontSize: 12, color: A.muted, letterSpacing: 3, marginBottom: 16 }}>DIRECTION A · COLOR EXPLORATION</div>
      <div style={{ fontFamily: A.font.display, fontSize: 88, fontWeight: 700, letterSpacing: -3, lineHeight: 0.95, marginBottom: 16 }}>
        Three ways to <span style={{ color: '#FF2D87', fontStyle: 'italic' }}>shout</span>.
      </div>
      <div style={{ fontSize: 17, color: A.muted, maxWidth: 780, lineHeight: 1.5 }}>
        Same Arena skeleton — different opposition pair and system accent. Each variant keeps max saturation so the vote action
        still feels like a referee's whistle. Pick one, steal from two, or tell me to push further.
      </div>
    </div>
  );
}
window.VariantHeader = VariantHeader;

// Compact showcase for one color variant: swatches + room card + vote buttons + mini screen
function VariantCard({ v }) {
  const A = window.ARENA;
  return (
    <div style={{
      background: A.surface, border: `1px solid ${A.line}`, borderRadius: 22,
      padding: 32, fontFamily: A.font.body, color: A.ink,
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      {/* header */}
      <div>
        <div style={{ fontFamily: A.font.mono, fontSize: 11, color: v.accent, letterSpacing: 2, marginBottom: 4 }}>VARIANT · {v.id.toUpperCase()}</div>
        <div style={{ fontFamily: A.font.display, fontSize: 40, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1 }}>{v.name}</div>
        <div style={{ fontSize: 13, color: A.muted, marginTop: 6, lineHeight: 1.4 }}>{v.vibe}</div>
      </div>

      {/* swatches */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, height: 72, background: v.con, borderRadius: 12, display: 'flex', alignItems: 'flex-end', padding: 10, fontFamily: A.font.mono, fontSize: 10, color: v.conInk, fontWeight: 700, letterSpacing: 1 }}>CON {v.con}</div>
        <div style={{ flex: 1, height: 72, background: v.pro, borderRadius: 12, display: 'flex', alignItems: 'flex-end', padding: 10, fontFamily: A.font.mono, fontSize: 10, color: v.proInk, fontWeight: 700, letterSpacing: 1 }}>PRO {v.pro}</div>
        <div style={{ width: 40, height: 72, background: v.accent, borderRadius: 12 }} title={v.accent} />
      </div>

      {/* headline treatment */}
      <div>
        <div style={{ fontFamily: A.font.display, fontSize: 28, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.1 }}>
          Is <span style={{ color: v.pro }}>therapy-speak</span> actually <span style={{ color: v.con }}>ruining</span> relationships?
        </div>
      </div>

      {/* split meter */}
      <div>
        <div style={{ display: 'flex', height: 12, borderRadius: 999, overflow: 'hidden', border: `1px solid ${A.line}` }}>
          <div style={{ width: '28%', background: v.con }} />
          <div style={{ width: '72%', background: v.pro }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: A.font.mono, fontSize: 10, letterSpacing: 1.5 }}>
          <span style={{ color: v.con }}>AGAINST 28%</span>
          <span style={{ color: A.muted }}>847 VOTES</span>
          <span style={{ color: v.pro }}>72% FOR</span>
        </div>
      </div>

      {/* buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={{
          flex: 1, height: 48, borderRadius: 24, background: v.con, color: v.conInk, border: 'none',
          fontFamily: A.font.display, fontWeight: 700, fontSize: 14, letterSpacing: 0.5,
        }}>✗ AGAINST</button>
        <button style={{
          flex: 1, height: 48, borderRadius: 24, background: v.pro, color: v.proInk, border: 'none',
          fontFamily: A.font.display, fontWeight: 700, fontSize: 14, letterSpacing: 0.5,
        }}>✓ FOR</button>
      </div>

      {/* pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 10px', background: v.con, color: v.conInk, borderRadius: 999, fontFamily: A.font.mono, fontSize: 10, fontWeight: 700, letterSpacing: 1.5 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: v.conInk, animation: 'pulse 1.2s ease-in-out infinite' }} />
          LIVE
        </span>
        <span style={{ height: 24, padding: '0 10px', background: 'transparent', color: v.accent, border: `1px solid ${v.accent}`, borderRadius: 999, fontFamily: A.font.mono, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, display: 'inline-flex', alignItems: 'center' }}>HOST</span>
        <span style={{ height: 24, padding: '0 10px', background: A.surfaceAlt, color: A.muted, border: `1px solid ${A.line}`, borderRadius: 999, fontFamily: A.font.mono, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, display: 'inline-flex', alignItems: 'center' }}>🎧 1.2K</span>
      </div>

      {/* speaker avatars */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: `1px solid ${A.line}` }}>
        <div style={{ display: 'flex' }}>
          {[v.pro, v.pro, v.con, v.con].map((c, i) => (
            <div key={i} style={{
              width: 32, height: 32, borderRadius: 16, background: c,
              marginLeft: i ? -8 : 0, border: `2.5px solid ${A.surface}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: A.font.mono, fontSize: 10, fontWeight: 800, color: i < 2 ? v.proInk : v.conInk,
            }}>{['JM', 'RT', 'KL', 'DN'][i]}</div>
          ))}
        </div>
        <div style={{ fontFamily: A.font.mono, fontSize: 10, color: A.muted, letterSpacing: 1 }}>TAP TO ENTER →</div>
      </div>
    </div>
  );
}

function VariantGrid() {
  const A = window.ARENA;
  return (
    <div style={{
      width: 1600, padding: '8px 56px 56px', background: A.bg,
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20,
    }}>
      {VARIANTS.map(v => <VariantCard key={v.id} v={v} />)}
    </div>
  );
}
window.VariantGrid = VariantGrid;
