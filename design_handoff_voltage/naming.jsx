// Naming + wordmark + app icon exploration.
// Candidates mix literal (ring, floor, mic) and abstract (coined).

const NAMES = [
  { name: 'FLOOR', tag: '"You have the floor."', kind: 'literal', note: 'Parliamentary procedure. Calm, authoritative, universal.' },
  { name: 'Ringside', tag: 'A seat for every fight.', kind: 'literal', note: 'Audience-first. Boxing vibe without being macho.' },
  { name: 'Mic', tag: 'Pass the mic.', kind: 'literal', note: 'Short, verb-able ("mic\'d up"). Speaks to live audio.' },
  { name: 'Versus', tag: 'Two sides. One room.', kind: 'literal', note: 'Built-in for/against. Easy to say, easy to search.' },
  { name: 'Hotfloor', tag: 'Takes go live here.', kind: 'coined', note: 'Like "hotline" + "floor". Playful compound. Domain-available class.' },
  { name: 'Pivot', tag: 'Change your mind, live.', kind: 'abstract', note: 'Suggests movement on the vote meter. Twitter-shaped.' },
];
window.NAMES = NAMES;

function NamesHeader() {
  const A = window.ARENA;
  return (
    <div style={{ width: 1600, padding: '56px 56px 24px', background: A.bg, color: A.ink, fontFamily: A.font.body }}>
      <div style={{ fontFamily: A.font.mono, fontSize: 12, color: A.muted, letterSpacing: 3, marginBottom: 16 }}>NAMING · 6 CANDIDATES</div>
      <div style={{ fontFamily: A.font.display, fontSize: 88, fontWeight: 700, letterSpacing: -3, lineHeight: 0.95 }}>
        A name, a mark.
      </div>
      <div style={{ fontSize: 17, color: A.muted, maxWidth: 780, lineHeight: 1.5, marginTop: 16 }}>
        Mix of literal and abstract, each with a wordmark sketch and app icon concept. These are first drafts —
        tell me which two you want to see polished and I'll make them real.
      </div>
    </div>
  );
}
window.NamesHeader = NamesHeader;

// ─── Wordmark renderers ────────────────────────────────────
function Wordmark({ name, id }) {
  const A = window.ARENA;
  // Each gets a distinct treatment — wordmarks are not interchangeable
  switch (id) {
    case 'floor':
      return (
        <div style={{ fontFamily: A.font.display, fontSize: 72, fontWeight: 700, letterSpacing: -2, lineHeight: 1, color: A.ink }}>
          FL<span style={{ color: '#C6FF3D' }}>⚌</span><span>OR</span>
        </div>
      );
    case 'ringside':
      return (
        <div style={{ fontFamily: A.font.display, fontSize: 56, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1, color: A.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 40, height: 40, borderRadius: 20, border: `4px solid #C6FF3D`, display: 'inline-block' }} />
          ingside
        </div>
      );
    case 'mic':
      return (
        <div style={{ fontFamily: A.font.display, fontSize: 120, fontWeight: 700, letterSpacing: -6, lineHeight: 0.9, color: A.ink }}>
          m<span style={{ color: '#FF2D87' }}>i</span>c<span style={{ color: '#C6FF3D' }}>.</span>
        </div>
      );
    case 'versus':
      return (
        <div style={{ fontFamily: A.font.display, fontSize: 64, fontWeight: 700, letterSpacing: -2, lineHeight: 1, color: A.ink, display: 'flex', alignItems: 'baseline' }}>
          <span style={{ color: '#C6FF3D' }}>ver</span><span style={{ color: A.ink }}>·</span><span style={{ color: '#FF2D87' }}>sus</span>
        </div>
      );
    case 'hotfloor':
      return (
        <div style={{ fontFamily: A.font.display, fontSize: 60, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1, color: A.ink, fontStyle: 'italic' }}>
          <span style={{ color: '#FF2D87' }}>hot</span>floor
        </div>
      );
    case 'pivot':
      return (
        <div style={{ fontFamily: A.font.display, fontSize: 88, fontWeight: 700, letterSpacing: -3, lineHeight: 0.95, color: A.ink }}>
          piv<span style={{ display: 'inline-block', transform: 'rotate(-12deg)', color: '#C6FF3D' }}>o</span>t
        </div>
      );
  }
}

function AppIcon({ id, size = 128 }) {
  const A = window.ARENA;
  const base = {
    width: size, height: size, borderRadius: size * 0.22,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: A.font.display, fontWeight: 700, color: '#0B0B0F',
    overflow: 'hidden', position: 'relative', flexShrink: 0,
  };
  switch (id) {
    case 'floor':
      return (
        <div style={{ ...base, background: '#0B0B0F', color: '#C6FF3D', fontSize: size * 0.5, letterSpacing: -2 }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: size * 0.6, height: 2, background: '#C6FF3D' }} />
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 2, height: size * 0.45, background: '#FF2D87' }} />
          </div>
        </div>
      );
    case 'ringside':
      return (
        <div style={{ ...base, background: '#FF2D87' }}>
          <div style={{ width: size * 0.6, height: size * 0.6, borderRadius: '50%', border: `${size * 0.09}px solid #0B0B0F` }} />
        </div>
      );
    case 'mic':
      return (
        <div style={{ ...base, background: '#C6FF3D', fontSize: size * 0.62, letterSpacing: -4, lineHeight: 1, paddingTop: size * 0.06 }}>
          m<span style={{ color: '#FF2D87' }}>.</span>
        </div>
      );
    case 'versus':
      return (
        <div style={{ ...base, background: '#0B0B0F', padding: 0 }}>
          <div style={{ flex: 1, height: '100%', background: '#C6FF3D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B0B0F', fontSize: size * 0.5 }}>V</div>
          <div style={{ flex: 1, height: '100%', background: '#FF2D87', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B0B0F', fontSize: size * 0.5 }}>S</div>
        </div>
      );
    case 'hotfloor':
      return (
        <div style={{ ...base, background: '#FF2D87', color: '#C6FF3D', fontSize: size * 0.8, lineHeight: 0.8, fontStyle: 'italic' }}>
          h
        </div>
      );
    case 'pivot':
      return (
        <div style={{ ...base, background: '#C6FF3D' }}>
          <div style={{ width: size * 0.5, height: size * 0.5, borderRadius: '50%', background: '#FF2D87', transform: 'translateX(10%)' }} />
          <div style={{ position: 'absolute', width: size * 0.5, height: size * 0.5, borderRadius: '50%', background: '#0B0B0F', transform: 'translateX(-20%)', mixBlendMode: 'multiply', opacity: 0.85 }} />
        </div>
      );
  }
}

function NameCard({ candidate, id }) {
  const A = window.ARENA;
  return (
    <div style={{
      background: A.surface, border: `1px solid ${A.line}`, borderRadius: 22,
      padding: 28, fontFamily: A.font.body, color: A.ink,
      display: 'flex', flexDirection: 'column', gap: 18, minHeight: 380,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: A.font.mono, fontSize: 10, letterSpacing: 2, color: A.muted }}>
          {String(NAMES.indexOf(candidate) + 1).padStart(2, '0')} · {candidate.kind.toUpperCase()}
        </div>
        <AppIcon id={id} size={64} />
      </div>

      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 0', borderTop: `1px solid ${A.line}`, borderBottom: `1px solid ${A.line}`,
        minHeight: 140,
      }}>
        <Wordmark name={candidate.name} id={id} />
      </div>

      <div>
        <div style={{ fontFamily: A.font.display, fontSize: 18, fontStyle: 'italic', color: A.ink, marginBottom: 6, letterSpacing: -0.3 }}>"{candidate.tag}"</div>
        <div style={{ fontSize: 13, color: A.muted, lineHeight: 1.5 }}>{candidate.note}</div>
      </div>
    </div>
  );
}

function NamesGrid() {
  const A = window.ARENA;
  const ids = ['floor', 'ringside', 'mic', 'versus', 'hotfloor', 'pivot'];
  return (
    <div style={{
      width: 1600, padding: '8px 56px 56px', background: A.bg,
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20,
    }}>
      {NAMES.map((c, i) => <NameCard key={ids[i]} candidate={c} id={ids[i]} />)}
    </div>
  );
}
window.NamesGrid = NamesGrid;
window.AppIcon = AppIcon;
window.Wordmark = Wordmark;

// App icon showcase — all six on home-screen grid style
function IconShowcase() {
  const A = window.ARENA;
  const ids = ['floor', 'ringside', 'mic', 'versus', 'hotfloor', 'pivot'];
  return (
    <div style={{ width: 1600, padding: 56, background: A.bg, color: A.ink, fontFamily: A.font.body }}>
      <div style={{ fontFamily: A.font.mono, fontSize: 12, color: A.muted, letterSpacing: 3, marginBottom: 16 }}>APP ICONS · ON HOME SCREEN</div>
      <div style={{ fontFamily: A.font.display, fontSize: 56, fontWeight: 700, letterSpacing: -1.8, lineHeight: 1, marginBottom: 40 }}>On the grid</div>

      <div style={{
        background: `linear-gradient(180deg, #1a1a22 0%, #0B0B0F 100%)`, borderRadius: 40, padding: 56,
        display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 48,
      }}>
        {ids.map((id, i) => (
          <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <AppIcon id={id} size={128} />
            <div style={{ fontFamily: A.font.body, fontSize: 14, fontWeight: 500, color: A.ink }}>{NAMES[i].name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
window.IconShowcase = IconShowcase;
