// OP-ED screens — wrapped in iPhone frame
const O2 = window.OPED;

function OpedRoomsScreen() {
  return (
    <IOSDevice dark>
      <div style={{ background: O2.bg, minHeight: '100%', color: O2.ink, fontFamily: O2.font.body, paddingBottom: 110 }}>
        <IOSStatusBar dark />
        {/* masthead */}
        <div style={{ padding: '4px 20px 16px', borderBottom: `1px solid ${O2.line}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontFamily: O2.font.mono, fontSize: 10, color: O2.muted, letterSpacing: 2 }}>WED · APR 22 · 2026</div>
            <div style={{ fontFamily: O2.font.mono, fontSize: 10, color: O2.muted, letterSpacing: 2 }}>VOL 001 · NO 047</div>
          </div>
          <div style={{ fontFamily: O2.font.display, fontSize: 52, fontWeight: 400, letterSpacing: -1.2, lineHeight: 0.95, marginTop: 4, fontStyle: 'italic' }}>Rooms</div>
          <div style={{ fontSize: 13, color: O2.muted, marginTop: 6, lineHeight: 1.4 }}>Live rooms, ordered by when they opened.</div>
        </div>

        {/* section chips */}
        <div style={{ display: 'flex', gap: 14, padding: '14px 20px', borderBottom: `1px solid ${O2.line}`, overflow: 'hidden' }}>
          {['Now', 'Opening soon', 'Following', 'All'].map((c, i) => (
            <div key={c} style={{
              fontFamily: O2.font.display, fontStyle: 'italic', fontSize: 15,
              color: i === 0 ? O2.ink : O2.dim,
              borderBottom: i === 0 ? `1px solid ${O2.ink}` : '1px solid transparent',
              paddingBottom: 2, whiteSpace: 'nowrap',
            }}>{c}</div>
          ))}
        </div>

        {/* feature */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <OLiveBadge />
            <OPill bg="transparent" fg={O2.muted} border={O2.line}>CULTURE</OPill>
          </div>
          <div style={{ fontFamily: O2.font.display, fontSize: 34, fontWeight: 400, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 10 }}>
            Is "be yourself" the worst advice ever given to young people?
          </div>
          <div style={{ fontSize: 14, color: O2.muted, lineHeight: 1.5, marginBottom: 14 }}>
            An uncomfortable conversation about authenticity, identity, and whether we've confused impulse for character.
          </div>

          {/* margin bar */}
          <div style={{ position: 'relative', height: 10, background: O2.surface, border: `1px solid ${O2.line}`, marginBottom: 6 }}>
            <div style={{ position: 'absolute', left: '50%', top: -3, bottom: -3, width: 1, background: O2.muted }} />
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '22%', background: O2.pro }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: O2.font.mono, fontSize: 10, letterSpacing: 1.5, color: O2.muted }}>
            <span>NEG 28%</span>
            <span>2,412 VOTES</span>
            <span style={{ color: O2.pro }}>72% AFF</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: `1px solid ${O2.line}` }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, background: O2.accent, color: O2.proInk, fontFamily: O2.font.display, fontSize: 13, fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>J</div>
              <span style={{ fontFamily: O2.font.mono, fontSize: 10, color: O2.muted, letterSpacing: 0.5 }}>HOSTED BY jay.debates</span>
            </div>
            <span style={{ fontFamily: O2.font.mono, fontSize: 10, color: O2.muted }}>2,412 listening</span>
          </div>
        </div>

        {/* divider */}
        <div style={{ margin: '24px 20px', fontFamily: O2.font.mono, fontSize: 10, color: O2.muted, letterSpacing: 2, borderTop: `1px solid ${O2.line}`, paddingTop: 14 }}>ALSO LIVE</div>

        {/* list */}
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column' }}>
          <OLineItem live title="Therapy-speak is ruining relationships" host="Maya Okafor" listeners={1204} forPct={72} cat="CULTURE" />
          <OLineItem live title="Taylor Swift is overrated" host="Dan Nguyen" listeners={89} forPct={34} cat="MUSIC" />
          <OLineItem opens="4m" title="Is AI art actually art?" host="Priya Shah" listeners={0} forPct={50} cat="TECH" />
          <OLineItem live title="Open offices were a mistake" host="Sam Levine" listeners={412} forPct={62} cat="WORK" />
        </div>

        <div style={{ position: 'absolute', bottom: 10, left: 20, right: 20, paddingTop: 14, background: O2.bg }}>
          <OpedTabBar active="rooms" />
        </div>
      </div>
    </IOSDevice>
  );
}

function OLineItem({ title, host, listeners, forPct, cat, live, opens }) {
  const neg = 100 - forPct;
  return (
    <div style={{ padding: '14px 0', borderBottom: `1px solid ${O2.line}`, display: 'flex', gap: 14 }}>
      {/* tiny margin indicator */}
      <div style={{ width: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ flex: 1, background: forPct > 50 ? O2.pro : O2.surfaceAlt, borderRadius: 1 }} />
        <div style={{ flex: 1, background: forPct < 50 ? O2.con : O2.surfaceAlt, borderRadius: 1 }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontFamily: O2.font.mono, fontSize: 9, color: O2.muted, letterSpacing: 1.5 }}>{cat}</span>
          {live && <span style={{ fontFamily: O2.font.mono, fontSize: 9, color: O2.con, letterSpacing: 1.5, fontWeight: 700 }}>● LIVE</span>}
          {opens && <span style={{ fontFamily: O2.font.mono, fontSize: 9, color: O2.accent, letterSpacing: 1.5, fontWeight: 700 }}>● OPENS {opens.toUpperCase()}</span>}
        </div>
        <div style={{ fontFamily: O2.font.display, fontSize: 18, fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.3 }}>{title}</div>
        <div style={{ display: 'flex', gap: 10, fontFamily: O2.font.body, fontSize: 11, color: O2.muted, marginTop: 4 }}>
          <span>by {host}</span>
          {listeners > 0 && <span>· {listeners.toLocaleString()} listening</span>}
        </div>
      </div>
      <div style={{ fontFamily: O2.font.display, fontStyle: 'italic', fontSize: 22, color: O2.dim, alignSelf: 'center' }}>›</div>
    </div>
  );
}

function OpedRoomDetailScreen() {
  return (
    <IOSDevice dark>
      <div style={{ background: O2.bg, minHeight: '100%', color: O2.ink, fontFamily: O2.font.body, display: 'flex', flexDirection: 'column' }}>
        <IOSStatusBar dark />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px 10px' }}>
          <div style={{ fontFamily: O2.font.display, fontStyle: 'italic', fontSize: 22, color: O2.muted }}>‹ Back</div>
          <OLiveBadge />
          <div style={{ fontFamily: O2.font.mono, fontSize: 11, color: O2.muted, letterSpacing: 1.5 }}>⋯</div>
        </div>

        {/* motion */}
        <div style={{ padding: '16px 20px 18px', borderTop: `1px solid ${O2.line}`, borderBottom: `1px solid ${O2.line}` }}>
          <div style={{ fontFamily: O2.font.mono, fontSize: 10, color: O2.muted, letterSpacing: 2, marginBottom: 8 }}>THE MOTION · CULTURE</div>
          <div style={{ fontFamily: O2.font.display, fontSize: 26, fontWeight: 400, lineHeight: 1.15, letterSpacing: -0.5 }}>
            Therapy-speak is ruining relationships.
          </div>
          <div style={{ fontFamily: O2.font.mono, fontSize: 10, color: O2.muted, letterSpacing: 1.5, marginTop: 10, display: 'flex', gap: 14 }}>
            <span>ON AIR 18 MIN</span>
            <span>·</span>
            <span>1,204 LISTENING</span>
          </div>
        </div>

        {/* speakers as two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${O2.line}` }}>
          <div style={{ padding: '16px 18px', borderRight: `1px solid ${O2.line}` }}>
            <div style={{ fontFamily: O2.font.mono, fontSize: 10, color: O2.pro, letterSpacing: 2, marginBottom: 10 }}>AFFIRMATIVE · 72%</div>
            <OSpeaker name="Maya Okafor" handle="maya.o" side="pro" speaking />
            <OSpeaker name="Jay Park" handle="jay" side="pro" />
          </div>
          <div style={{ padding: '16px 18px' }}>
            <div style={{ fontFamily: O2.font.mono, fontSize: 10, color: O2.con, letterSpacing: 2, marginBottom: 10 }}>NEGATIVE · 28%</div>
            <OSpeaker name="Rena Liu" handle="rena" side="con" speaking />
            <OSpeaker name="Tom Best" handle="tom.b" side="con" />
          </div>
        </div>

        {/* margin */}
        <div style={{ padding: '14px 20px 16px', borderBottom: `1px solid ${O2.line}` }}>
          <div style={{ position: 'relative', height: 12, background: O2.surface, border: `1px solid ${O2.line}` }}>
            <div style={{ position: 'absolute', left: '50%', top: -3, bottom: -3, width: 1, background: O2.muted }} />
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '22%', background: O2.pro }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: O2.font.mono, fontSize: 10, letterSpacing: 1.5 }}>
            <span style={{ color: O2.con }}>NEG 28%</span>
            <span style={{ color: O2.muted }}>847 VOTES</span>
            <span style={{ color: O2.pro }}>72% AFF</span>
          </div>
        </div>

        {/* chat */}
        <div style={{ flex: 1, padding: '8px 20px', overflow: 'hidden' }}>
          <OChat user="mags.okafor" text="The term itself has been drained of meaning." side="pro" />
          <OChat user="ethan.dao" text="Disagree — it gives people vocabulary they didn't have before." side="con" />
          <OChat user="lena.w" text="Both can be true." />
          <OChat user="Maya (host)" text="One minute for closing statements." host />
        </div>

        {/* vote */}
        <div style={{ padding: '14px 16px 16px', display: 'flex', gap: 10, borderTop: `1px solid ${O2.line}`, background: O2.surface }}>
          <button style={{ flex: 1, height: 48, border: `1px solid ${O2.con}`, background: 'transparent', color: O2.con, fontFamily: O2.font.display, fontStyle: 'italic', fontSize: 18 }}>Rebut</button>
          <button style={{ flex: 1, height: 48, border: `1px solid ${O2.pro}`, background: O2.pro, color: O2.proInk, fontFamily: O2.font.display, fontStyle: 'italic', fontSize: 18 }}>Affirm</button>
        </div>
      </div>
    </IOSDevice>
  );
}

function OSpeaker({ name, handle, side, speaking }) {
  const c = side === 'pro' ? O2.pro : O2.con;
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0' }}>
      <div style={{
        width: 38, height: 38, borderRadius: 19, background: O2.surfaceAlt,
        border: `1.5px solid ${speaking ? c : O2.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: O2.font.display, fontStyle: 'italic', fontSize: 18, color: O2.ink,
      }}>{name[0]}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: O2.font.body, fontSize: 13, fontWeight: 600 }}>{name}</div>
        <div style={{ fontFamily: O2.font.mono, fontSize: 9, color: speaking ? c : O2.muted, letterSpacing: 1, fontWeight: 700 }}>
          {speaking ? '● SPEAKING' : '@' + handle}
        </div>
      </div>
    </div>
  );
}

function OpedQuestionsScreen() {
  const motions = [
    { text: 'Working from home makes people worse at their jobs.', votes: 2847, rooms: 3, cat: 'WORK' },
    { text: 'Everyone should be required to do a year of manual labor before 25.', votes: 1920, rooms: 0, cat: 'SOCIETY' },
    { text: 'Marvel movies have destroyed cinema.', votes: 3412, rooms: 2, cat: 'CULTURE' },
    { text: 'You should be able to sell your vote.', votes: 891, rooms: 0, cat: 'POLITICS' },
    { text: 'The 4-day work week is a lie for certain industries.', votes: 1256, rooms: 1, cat: 'WORK' },
  ];
  return (
    <IOSDevice dark>
      <div style={{ background: O2.bg, minHeight: '100%', color: O2.ink, fontFamily: O2.font.body, paddingBottom: 110 }}>
        <IOSStatusBar dark />
        <div style={{ padding: '4px 20px 16px', borderBottom: `1px solid ${O2.line}` }}>
          <div style={{ fontFamily: O2.font.mono, fontSize: 10, color: O2.muted, letterSpacing: 2 }}>THIS WEEK · APR 20 — 26</div>
          <div style={{ fontFamily: O2.font.display, fontSize: 52, fontWeight: 400, letterSpacing: -1.2, lineHeight: 0.95, marginTop: 4, fontStyle: 'italic' }}>Motions</div>
          <div style={{ fontSize: 13, color: O2.muted, marginTop: 6, lineHeight: 1.4 }}>Propose a motion. Support the ones you want debated.</div>
        </div>

        <div style={{ padding: '0 20px' }}>
          {motions.map((m, i) => (
            <div key={i} style={{ padding: '18px 0', borderBottom: `1px solid ${O2.line}`, display: 'flex', gap: 14 }}>
              <div style={{
                fontFamily: O2.font.display, fontStyle: 'italic', fontSize: 28, color: O2.dim, width: 36, textAlign: 'right', lineHeight: 1,
              }}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: O2.font.mono, fontSize: 9, color: O2.muted, letterSpacing: 1.5, marginBottom: 4 }}>
                  {m.cat} {m.rooms > 0 && <span style={{ color: O2.con }}>· {m.rooms} LIVE ROOMS</span>}
                </div>
                <div style={{ fontFamily: O2.font.display, fontSize: 18, fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.3 }}>{m.text}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
                  <button style={{ height: 26, padding: '0 10px', border: `1px solid ${O2.line}`, background: 'transparent', color: O2.ink, fontFamily: O2.font.mono, fontSize: 10, letterSpacing: 1 }}>▲ {m.votes.toLocaleString()}</button>
                  <button style={{ height: 26, padding: '0 10px', border: `1px solid ${O2.accent}`, background: O2.accent, color: O2.proInk, fontFamily: O2.font.mono, fontSize: 10, letterSpacing: 1, fontWeight: 700 }}>{m.rooms > 0 ? 'JOIN DEBATE' : 'OPEN A ROOM'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ position: 'absolute', bottom: 10, left: 20, right: 20, paddingTop: 14, background: O2.bg }}>
          <OpedTabBar active="motions" />
        </div>
      </div>
    </IOSDevice>
  );
}

Object.assign(window, { OpedRoomsScreen, OpedRoomDetailScreen, OpedQuestionsScreen });
