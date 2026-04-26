// ARENA screens — wrapped in iPhone frame
const A2 = window.ARENA;

function ArenaRoomsScreen() {
  return (
    <IOSDevice dark>
      <div style={{ background: A2.bg, minHeight: '100%', color: A2.ink, fontFamily: A2.font.body, paddingBottom: 100 }}>
        <IOSStatusBar dark />
        {/* header */}
        <div style={{ padding: '8px 20px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: A2.font.mono, fontSize: 11, color: A2.pro, letterSpacing: 2 }}>● LIVE NOW</div>
              <div style={{ fontFamily: A2.font.display, fontSize: 40, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1, marginTop: 6 }}>
                Rooms
              </div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: A2.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⌕</div>
          </div>
        </div>

        {/* filter chips */}
        <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px', overflow: 'hidden' }}>
          {['All', 'Hot 🔥', 'Following', 'Politics', 'Culture', 'Sports'].map((c, i) => (
            <div key={c} style={{
              padding: '8px 14px', borderRadius: 999,
              background: i === 0 ? A2.ink : A2.surface, color: i === 0 ? A2.bg : A2.muted,
              fontFamily: A2.font.mono, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
              whiteSpace: 'nowrap', border: i === 0 ? 'none' : `1px solid ${A2.line}`,
            }}>{c}</div>
          ))}
        </div>

        {/* featured big card */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{
            background: `linear-gradient(135deg, ${A2.con} 0%, ${A2.accent} 100%)`,
            borderRadius: 24, padding: 20, color: '#fff', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <span style={{ fontFamily: A2.font.mono, fontSize: 10, background: '#000', color: A2.pro, padding: '4px 8px', borderRadius: 999, letterSpacing: 1.5, fontWeight: 700 }}>● LIVE</span>
              <span style={{ fontFamily: A2.font.mono, fontSize: 10, background: 'rgba(0,0,0,0.25)', padding: '4px 8px', borderRadius: 999, letterSpacing: 1 }}>🎧 2.4K</span>
            </div>
            <div style={{ fontFamily: A2.font.display, fontSize: 26, fontWeight: 700, lineHeight: 1.1, letterSpacing: -0.8, marginBottom: 12 }}>
              Is "be yourself" the worst advice ever given?
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex' }}>
                {['JM', 'RT', 'KL', 'DN'].map((s, i) => (
                  <div key={i} style={{
                    width: 26, height: 26, borderRadius: 13, background: '#fff',
                    marginLeft: i ? -8 : 0, border: '2px solid rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: A2.font.mono, fontSize: 9, fontWeight: 700, color: '#000',
                  }}>{s}</div>
                ))}
              </div>
              <div style={{ fontFamily: A2.font.mono, fontSize: 10, letterSpacing: 1 }}>HOSTED BY @jay.debates</div>
            </div>
          </div>
        </div>

        {/* room list */}
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <MiniRoomCard live pct={72} title="Therapy-speak is ruining relationships" listeners="1.2K" />
          <MiniRoomCard live pct={34} title="Taylor Swift is overrated" listeners="847" />
          <MiniRoomCard waiting pct={50} title="Is AI art actually art?" listeners="starts in 3m" />
          <MiniRoomCard live pct={62} title="Open offices were a mistake" listeners="412" />
        </div>

        {/* bottom nav */}
        <div style={{ position: 'absolute', bottom: 24, left: 16, right: 16 }}>
          <ArenaBottomNav active="rooms" />
        </div>
      </div>
    </IOSDevice>
  );
}

function MiniRoomCard({ live, waiting, pct, title, listeners }) {
  return (
    <div style={{
      background: A2.surface, borderRadius: 18, padding: 14,
      border: `1px solid ${A2.line}`, display: 'flex', gap: 12,
    }}>
      {/* vertical split meter */}
      <div style={{
        width: 40, borderRadius: 10, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ flex: 100 - pct, background: A2.con, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: A2.font.mono, fontSize: 9, color: A2.conInk, fontWeight: 700 }}>{100 - pct}</div>
        <div style={{ flex: pct, background: A2.pro, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: A2.font.mono, fontSize: 9, color: A2.proInk, fontWeight: 700 }}>{pct}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ fontFamily: A2.font.display, fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>{title}</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {live && <span style={{ fontFamily: A2.font.mono, fontSize: 9, color: A2.con, fontWeight: 700, letterSpacing: 1 }}>● LIVE</span>}
          {waiting && <span style={{ fontFamily: A2.font.mono, fontSize: 9, color: A2.warn, fontWeight: 700, letterSpacing: 1 }}>● WAITING</span>}
          <span style={{ fontFamily: A2.font.mono, fontSize: 10, color: A2.muted }}>🎧 {listeners}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Inside-the-room screen ────────────────────────────────
function ArenaRoomDetailScreen() {
  return (
    <IOSDevice dark>
      <div style={{ background: A2.bg, minHeight: '100%', color: A2.ink, fontFamily: A2.font.body, display: 'flex', flexDirection: 'column' }}>
        <IOSStatusBar dark />

        {/* top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px 12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: A2.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: A2.ink }}>‹</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <LiveBadge />
            <Pill bg={A2.surface} fg={A2.muted} border={A2.line}>🎧 1.2K</Pill>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: A2.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: A2.ink }}>⋯</div>
        </div>

        {/* the question */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ fontFamily: A2.font.mono, fontSize: 10, color: A2.muted, letterSpacing: 2, marginBottom: 6 }}>THE MOTION</div>
          <div style={{ fontFamily: A2.font.display, fontSize: 26, fontWeight: 600, lineHeight: 1.1, letterSpacing: -0.5 }}>
            Therapy-speak is ruining relationships.
          </div>
        </div>

        {/* speakers */}
        <div style={{ padding: '8px 20px 16px', display: 'flex', gap: 10, justifyContent: 'space-between' }}>
          <SpeakerTile name="Jay" handle="@jay" side="pro" speaking />
          <SpeakerTile name="Maya" handle="@maya" side="pro" />
          <SpeakerTile name="Rena" handle="@rena" side="con" speaking />
          <SpeakerTile name="Tom" handle="@tom" side="con" />
        </div>

        {/* big meter */}
        <div style={{ padding: '4px 20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: A2.font.mono, fontSize: 10, letterSpacing: 1.5 }}>
            <span style={{ color: A2.con, fontWeight: 700 }}>AGAINST 28%</span>
            <span style={{ color: A2.muted }}>847 VOTES</span>
            <span style={{ color: A2.pro, fontWeight: 700 }}>72% FOR</span>
          </div>
          <div style={{
            display: 'flex', height: 14, borderRadius: 999, overflow: 'hidden', background: A2.surface,
            border: `1px solid ${A2.line}`,
          }}>
            <div style={{ width: '28%', background: A2.con }} />
            <div style={{ width: '72%', background: A2.pro }} />
          </div>
        </div>

        {/* chat */}
        <div style={{ flex: 1, padding: '8px 20px', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
          <ChatBubble user="mags.7" text="this is a W take honestly" side="pro" />
          <ChatBubble user="ethan_d" text="brother this is the worst opinion i've ever heard" side="con" />
          <ChatBubble user="lena" text="nuance? in THIS economy?" />
          <ChatBubble user="jay" text="y'all keep it civil" host />
          <ChatBubble user="sam.22" text="cook him jay" side="pro" />
        </div>

        {/* vote bar */}
        <div style={{ padding: '12px 16px 16px', display: 'flex', gap: 10, background: A2.surface, borderTop: `1px solid ${A2.line}` }}>
          <button style={{
            flex: 1, height: 52, borderRadius: 26, background: A2.con, color: A2.conInk,
            fontFamily: A2.font.display, fontWeight: 700, fontSize: 15, letterSpacing: 0.5, border: 'none',
          }}>✗ AGAINST</button>
          <button style={{
            flex: 1, height: 52, borderRadius: 26, background: A2.pro, color: A2.proInk,
            fontFamily: A2.font.display, fontWeight: 700, fontSize: 15, letterSpacing: 0.5, border: 'none',
          }}>✓ FOR</button>
        </div>
      </div>
    </IOSDevice>
  );
}

function SpeakerTile({ name, side, speaking }) {
  const c = side === 'pro' ? A2.pro : A2.con;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
      <div style={{
        width: 60, height: 60, borderRadius: 30, background: A2.surfaceAlt,
        border: `2.5px solid ${speaking ? c : A2.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        boxShadow: speaking ? `0 0 0 4px ${c}22` : 'none',
      }}>
        <span style={{ fontFamily: A2.font.display, fontWeight: 700, fontSize: 20, color: A2.ink }}>{name[0]}</span>
        {/* side dot */}
        <div style={{
          position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9,
          background: c, border: `2px solid ${A2.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: side === 'pro' ? A2.proInk : A2.conInk, fontSize: 10, fontWeight: 800, fontFamily: A2.font.mono,
        }}>{side === 'pro' ? '✓' : '✗'}</div>
      </div>
      <div style={{ fontFamily: A2.font.mono, fontSize: 10, color: A2.muted, letterSpacing: 0.5 }}>{name.toLowerCase()}</div>
    </div>
  );
}

// ─── Questions / takes screen ───────────────────────────────
function ArenaQuestionsScreen() {
  const takes = [
    { text: 'Working from home makes people worse at their jobs', votes: 2847, live: true },
    { text: 'Everyone should be required to do a year of manual labor before 25', votes: 1920, live: false },
    { text: 'Marvel movies have destroyed cinema', votes: 3412, live: true },
    { text: 'You should be able to sell your vote', votes: 891, live: false },
    { text: 'The 4-day work week is a lie that only works for certain jobs', votes: 1256, live: true },
  ];
  return (
    <IOSDevice dark>
      <div style={{ background: A2.bg, minHeight: '100%', color: A2.ink, fontFamily: A2.font.body, paddingBottom: 100 }}>
        <IOSStatusBar dark />
        <div style={{ padding: '8px 20px 20px' }}>
          <div style={{ fontFamily: A2.font.mono, fontSize: 11, color: A2.accent, letterSpacing: 2 }}>#HOTTAKES</div>
          <div style={{ fontFamily: A2.font.display, fontSize: 40, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1, marginTop: 6 }}>Takes</div>
          <div style={{ fontSize: 13, color: A2.muted, marginTop: 6 }}>Upvote what's worth debating. Start a room when you're ready to fight.</div>
        </div>

        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {takes.map((t, i) => (
            <div key={i} style={{
              background: A2.surface, borderRadius: 18, padding: 16,
              border: `1px solid ${A2.line}`, display: 'flex', gap: 12, alignItems: 'center',
            }}>
              {/* rank */}
              <div style={{ fontFamily: A2.font.display, fontSize: 28, fontWeight: 700, color: A2.dim, width: 28, textAlign: 'center' }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: A2.font.display, fontSize: 16, fontWeight: 600, lineHeight: 1.25, marginBottom: 8 }}>{t.text}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: A2.font.mono, fontSize: 10, color: A2.muted, letterSpacing: 1 }}>▲ {t.votes.toLocaleString()}</span>
                  {t.live && <span style={{ fontFamily: A2.font.mono, fontSize: 9, color: A2.con, fontWeight: 700, letterSpacing: 1 }}>● 3 ROOMS LIVE</span>}
                </div>
              </div>
              <div style={{
                width: 44, height: 44, borderRadius: 22, background: A2.pro, color: A2.proInk,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontFamily: A2.font.display, fontWeight: 700,
              }}>▶</div>
            </div>
          ))}
        </div>

        {/* FAB */}
        <div style={{ position: 'absolute', bottom: 100, right: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 28, background: A2.pro, color: A2.proInk,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: A2.font.display, fontSize: 28, fontWeight: 500, lineHeight: 1,
            boxShadow: `0 8px 24px ${A2.pro}55`,
          }}>+</div>
        </div>

        <div style={{ position: 'absolute', bottom: 24, left: 16, right: 16 }}>
          <ArenaBottomNav active="questions" />
        </div>
      </div>
    </IOSDevice>
  );
}

Object.assign(window, { ArenaRoomsScreen, ArenaRoomDetailScreen, ArenaQuestionsScreen });
