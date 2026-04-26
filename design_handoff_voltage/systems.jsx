// Shared design system tokens for both directions.
// Exposed on window so all component files can read them.

const ARENA = {
  name: 'Arena',
  tagline: 'Live debate as spectator sport',
  description: 'Loud, competitive, trading-card energy. For Gen Z who treat takes like sports.',
  font: { display: '"Space Grotesk", system-ui, sans-serif', body: '"Space Grotesk", system-ui, sans-serif', mono: '"JetBrains Mono", ui-monospace, monospace' },
  bg: '#0B0B0F',
  surface: '#15151C',
  surfaceAlt: '#1E1E28',
  line: '#2A2A38',
  ink: '#F5F5F7',
  muted: '#8E8EA0',
  dim: '#5A5A70',
  // signature opposition — hot pink vs acid lime
  pro: '#C6FF3D',        // acid lime - FOR
  proInk: '#0B0B0F',
  con: '#FF2D87',        // hot pink - AGAINST
  conInk: '#0B0B0F',
  accent: '#6B4BFF',     // electric indigo for system
  warn: '#FFB800',
  live: '#FF2D87',
  radius: { sm: 8, md: 14, lg: 22, xl: 32, pill: 9999 },
};

const OPED = {
  name: 'Op-Ed',
  tagline: 'Discourse, dignified',
  description: 'Warm editorial tones. For serious social debate that still feels alive.',
  font: { display: '"Instrument Serif", Georgia, serif', body: '"Inter", system-ui, sans-serif', mono: '"JetBrains Mono", ui-monospace, monospace' },
  bg: '#14110E',           // warm near-black
  surface: '#1D1814',
  surfaceAlt: '#2A231D',
  line: '#3A3028',
  ink: '#F3EDE3',          // cream
  muted: '#A89C8C',
  dim: '#6E6358',
  pro: '#E3B94F',          // warm gold - FOR (affirmative)
  proInk: '#14110E',
  con: '#D94A3B',          // terracotta - AGAINST
  conInk: '#F3EDE3',
  accent: '#E3B94F',
  warn: '#E3B94F',
  live: '#D94A3B',
  radius: { sm: 4, md: 6, lg: 10, xl: 14, pill: 9999 },
};

window.ARENA = ARENA;
window.OPED = OPED;

// Tiny helper components shared across systems.
function Swatch({ color, label, value, ink = '#fff', size = 88 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{
        width: size, height: size, borderRadius: 10, background: color,
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'flex-end', padding: 8,
        color: ink, fontSize: 10, fontFamily: 'ui-monospace, monospace', fontWeight: 600,
      }}>{value}</div>
      <div style={{ fontSize: 11, color: '#8E8EA0', fontFamily: 'ui-monospace, monospace' }}>{label}</div>
    </div>
  );
}

function TokenRow({ label, children }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16,
      padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
      alignItems: 'center',
    }}>
      <div style={{ fontSize: 11, color: '#8E8EA0', fontFamily: 'ui-monospace, monospace', letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

window.Swatch = Swatch;
window.TokenRow = TokenRow;
