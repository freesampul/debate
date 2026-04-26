// Onboarding + Auth screens for Arena.
const AA = window.ARENA;

// ─── Onboarding ─────────────────────────────────────────────
function Onboard1() {
  return (
    <IOSDevice dark>
      <div style={{ background: AA.bg, minHeight: '100%', color: AA.ink, fontFamily: AA.font.body, display: 'flex', flexDirection: 'column' }}>
        <IOSStatusBar dark />
        <div style={{ flex: 1, padding: '32px 24px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: AA.font.mono, fontSize: 11, color: AA.pro, letterSpacing: 2 }}>01 / 03</div>
          </div>
          {/* the big split meter as hero */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
            <div style={{ display: 'flex', width: '100%', height: 220, borderRadius: 28, overflow: 'hidden', border: `1px solid ${AA.line}`, position: 'relative' }}>
              <div style={{ width: '36%', background: AA.con, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: AA.font.display, fontSize: 64, fontWeight: 700, color: AA.conInk }}>✗</div>
              <div style={{ width: '64%', background: AA.pro, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: AA.font.display, fontSize: 64, fontWeight: 700, color: AA.proInk }}>✓</div>
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: AA.bg, opacity: 0.5 }} />
            </div>
            <div style={{ fontFamily: AA.font.display, fontSize: 44, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1, textAlign: 'center' }}>
              Pick a side.<br />Watch it move.
            </div>
            <div style={{ fontSize: 15, color: AA.muted, textAlign: 'center', lineHeight: 1.5, maxWidth: 320 }}>
              Every live room has a motion. Vote for or against. The meter updates in real time while people speak.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button style={{ height: 54, borderRadius: 27, background: AA.pro, color: AA.proInk, border: 'none', fontFamily: AA.font.display, fontWeight: 700, fontSize: 16, letterSpacing: 0.5 }}>Continue</button>
            <div style={{ textAlign: 'center', fontFamily: AA.font.mono, fontSize: 11, color: AA.muted, letterSpacing: 1 }}>SKIP</div>
          </div>
        </div>
      </div>
    </IOSDevice>
  );
}

function Onboard2() {
  return (
    <IOSDevice dark>
      <div style={{ background: AA.bg, minHeight: '100%', color: AA.ink, fontFamily: AA.font.body, display: 'flex', flexDirection: 'column' }}>
        <IOSStatusBar dark />
        <div style={{ flex: 1, padding: '32px 24px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: AA.font.mono, fontSize: 11, color: AA.pro, letterSpacing: 2 }}>02 / 03</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center' }}>
            {/* stacked fake room cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              {[
                { t: 'Therapy-speak is ruining relationships', pct: 72 },
                { t: 'Taylor Swift is overrated', pct: 34 },
                { t: 'Open offices were a mistake', pct: 62 },
              ].map((r, i) => (
                <div key={i} style={{ background: AA.surface, border: `1px solid ${AA.line}`, borderRadius: 18, padding: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: AA.con, display: 'flex' }}>
                    <div style={{ width: `${100 - r.pct}%`, background: AA.con, borderRadius: '10px 0 0 10px' }} />
                    <div style={{ width: `${r.pct}%`, background: AA.pro, borderRadius: '0 10px 10px 0' }} />
                  </div>
                  <div style={{ flex: 1, fontFamily: AA.font.display, fontSize: 13, fontWeight: 600 }}>{r.t}</div>
                  <span style={{ fontFamily: AA.font.mono, fontSize: 9, color: AA.con, fontWeight: 700, letterSpacing: 1 }}>● LIVE</span>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: AA.font.display, fontSize: 44, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1, textAlign: 'center', marginTop: 20 }}>
              Rooms open<br />all the time.
            </div>
            <div style={{ fontSize: 15, color: AA.muted, textAlign: 'center', lineHeight: 1.5, maxWidth: 320 }}>
              Jump into one that's already live. Or start your own from a take you can't let go.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button style={{ height: 54, borderRadius: 27, background: AA.pro, color: AA.proInk, border: 'none', fontFamily: AA.font.display, fontWeight: 700, fontSize: 16 }}>Continue</button>
          </div>
        </div>
      </div>
    </IOSDevice>
  );
}

function Onboard3() {
  return (
    <IOSDevice dark>
      <div style={{ background: AA.bg, minHeight: '100%', color: AA.ink, fontFamily: AA.font.body, display: 'flex', flexDirection: 'column' }}>
        <IOSStatusBar dark />
        <div style={{ flex: 1, padding: '32px 24px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: AA.font.mono, fontSize: 11, color: AA.pro, letterSpacing: 2 }}>03 / 03</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
            {/* speakers */}
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
              {['JM', 'RT', 'KL', 'DN'].map((n, i) => (
                <div key={i} style={{
                  width: 56, height: 56, borderRadius: 28, background: i < 2 ? AA.pro : AA.con,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: AA.font.display, fontSize: 16, fontWeight: 700, color: '#0B0B0F',
                  boxShadow: `0 0 0 4px ${(i < 2 ? AA.pro : AA.con)}33`,
                }}>{n}</div>
              ))}
            </div>
            <div style={{ fontFamily: AA.font.display, fontSize: 44, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1, textAlign: 'center' }}>
              Follow the<br />loud ones.
            </div>
            <div style={{ fontSize: 15, color: AA.muted, textAlign: 'center', lineHeight: 1.5, maxWidth: 320 }}>
              Find voices worth hearing. Get pinged when they go live. Chat, heckle, pass the mic.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button style={{ height: 54, borderRadius: 27, background: AA.pro, color: AA.proInk, border: 'none', fontFamily: AA.font.display, fontWeight: 700, fontSize: 16 }}>Get started</button>
            <div style={{ textAlign: 'center', fontFamily: AA.font.mono, fontSize: 11, color: AA.muted, letterSpacing: 1 }}>ALREADY HAVE AN ACCOUNT? <span style={{ color: AA.pro }}>SIGN IN</span></div>
          </div>
        </div>
      </div>
    </IOSDevice>
  );
}

// ─── Auth ───────────────────────────────────────────────────
function SignUp() {
  return (
    <IOSDevice dark>
      <div style={{ background: AA.bg, minHeight: '100%', color: AA.ink, fontFamily: AA.font.body, display: 'flex', flexDirection: 'column' }}>
        <IOSStatusBar dark />
        <div style={{ padding: '8px 16px 0' }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: AA.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>‹</div>
        </div>
        <div style={{ flex: 1, padding: '24px 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontFamily: AA.font.mono, fontSize: 11, color: AA.pro, letterSpacing: 2, marginBottom: 6 }}>NEW HERE</div>
            <div style={{ fontFamily: AA.font.display, fontSize: 44, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1 }}>Start shouting.</div>
            <div style={{ fontSize: 14, color: AA.muted, marginTop: 8 }}>We'll send you a magic link. No passwords.</div>
          </div>

          {/* email field */}
          <div>
            <div style={{ fontFamily: AA.font.mono, fontSize: 10, color: AA.muted, letterSpacing: 1.5, marginBottom: 8 }}>EMAIL</div>
            <div style={{
              height: 56, background: AA.surface, border: `1.5px solid ${AA.pro}`, borderRadius: 14, padding: '0 16px',
              display: 'flex', alignItems: 'center', fontFamily: AA.font.body, fontSize: 16,
            }}>
              you@domain.com<span style={{ width: 1.5, height: 18, background: AA.pro, marginLeft: 2, animation: 'pulse 1s infinite' }} />
            </div>
          </div>

          <button style={{ height: 54, borderRadius: 27, background: AA.pro, color: AA.proInk, border: 'none', fontFamily: AA.font.display, fontWeight: 700, fontSize: 16 }}>
            Send magic link →
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: AA.line }} />
            <div style={{ fontFamily: AA.font.mono, fontSize: 10, color: AA.muted, letterSpacing: 2 }}>OR</div>
            <div style={{ flex: 1, height: 1, background: AA.line }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button style={{ height: 52, borderRadius: 26, background: AA.surface, color: AA.ink, border: `1px solid ${AA.line}`, fontFamily: AA.font.display, fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span style={{ width: 20, height: 20, borderRadius: 10, background: '#fff' }} />
              Continue with Google
            </button>
            <button style={{ height: 52, borderRadius: 26, background: AA.surface, color: AA.ink, border: `1px solid ${AA.line}`, fontFamily: AA.font.display, fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}></span>Continue with Apple
            </button>
          </div>

          <div style={{ textAlign: 'center', fontFamily: AA.font.body, fontSize: 12, color: AA.dim, lineHeight: 1.5, marginTop: 'auto' }}>
            By continuing you agree to our Terms & Privacy.<br />
            Be real. Be loud. Don't be a dick.
          </div>
        </div>
      </div>
    </IOSDevice>
  );
}

function MagicLinkSent() {
  return (
    <IOSDevice dark>
      <div style={{ background: AA.bg, minHeight: '100%', color: AA.ink, fontFamily: AA.font.body, display: 'flex', flexDirection: 'column' }}>
        <IOSStatusBar dark />
        <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 24, textAlign: 'center' }}>
          <div style={{
            width: 120, height: 120, borderRadius: 60, background: AA.pro, color: AA.proInk,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: AA.font.display, fontSize: 60, fontWeight: 700,
            boxShadow: `0 0 0 8px ${AA.pro}22, 0 0 0 20px ${AA.pro}11`,
          }}>✦</div>
          <div style={{ fontFamily: AA.font.display, fontSize: 40, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1 }}>
            Check your email.
          </div>
          <div style={{ fontSize: 15, color: AA.muted, lineHeight: 1.5, maxWidth: 300 }}>
            We sent a link to <span style={{ color: AA.ink, fontWeight: 600 }}>you@domain.com</span>. Tap it on this device to sign in.
          </div>
          <div style={{ marginTop: 8, fontFamily: AA.font.mono, fontSize: 11, color: AA.muted, letterSpacing: 1.5 }}>
            RESEND IN 0:42
          </div>
        </div>
      </div>
    </IOSDevice>
  );
}

function PickHandle() {
  return (
    <IOSDevice dark>
      <div style={{ background: AA.bg, minHeight: '100%', color: AA.ink, fontFamily: AA.font.body, display: 'flex', flexDirection: 'column' }}>
        <IOSStatusBar dark />
        <div style={{ flex: 1, padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontFamily: AA.font.mono, fontSize: 11, color: AA.pro, letterSpacing: 2, marginBottom: 6 }}>STEP 02</div>
            <div style={{ fontFamily: AA.font.display, fontSize: 44, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1 }}>Pick a handle.</div>
            <div style={{ fontSize: 14, color: AA.muted, marginTop: 8 }}>How people will find you mid-fight.</div>
          </div>

          <div>
            <div style={{
              height: 64, background: AA.surface, border: `1.5px solid ${AA.pro}`, borderRadius: 16, padding: '0 16px',
              display: 'flex', alignItems: 'center', fontFamily: AA.font.display, fontSize: 22, gap: 2,
            }}>
              <span style={{ color: AA.muted }}>@</span><span style={{ color: AA.ink, fontWeight: 600 }}>jay.debates</span><span style={{ width: 2, height: 22, background: AA.pro, marginLeft: 2, animation: 'pulse 1s infinite' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontFamily: AA.font.mono, fontSize: 11, color: AA.pro, letterSpacing: 1 }}>
              <span>✓</span> AVAILABLE
            </div>
          </div>

          <div>
            <div style={{ fontFamily: AA.font.mono, fontSize: 10, color: AA.muted, letterSpacing: 1.5, marginBottom: 10 }}>SUGGESTIONS</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['jay', 'jayp', 'jay_real', 'j.park', 'jpark'].map(h => (
                <span key={h} style={{
                  height: 32, padding: '0 14px', border: `1px solid ${AA.line}`, background: AA.surface,
                  color: AA.ink, borderRadius: 999, fontFamily: AA.font.mono, fontSize: 12, display: 'inline-flex', alignItems: 'center',
                }}>@{h}</span>
              ))}
            </div>
          </div>

          <button style={{
            marginTop: 'auto', height: 54, borderRadius: 27, background: AA.pro, color: AA.proInk, border: 'none',
            fontFamily: AA.font.display, fontWeight: 700, fontSize: 16,
          }}>Claim @jay.debates →</button>
        </div>
      </div>
    </IOSDevice>
  );
}

Object.assign(window, { Onboard1, Onboard2, Onboard3, SignUp, MagicLinkSent, PickHandle });
