// Flight countdown: Bangkok → Chiang Mai
const PHASES = [
  { until: 0.11, name: 'Taxiing to the runway', normal: [
    'Stop-start rolling and turns. The plane is queuing like traffic.',
    'Thuds and whirs under you are the flaps getting set for takeoff.',
    'The safety demo happens on every flight. It doesn\'t mean anything is up.',
  ] },
  { until: 0.33, name: 'Takeoff & climb', normal: [
    'A loud roar and being pushed into your seat means full power, which is what you want.',
    'A clunk right after liftoff is the landing gear folding away.',
    'The engines going quieter a minute later is planned. Pilots ease off once you\'re up.',
    'Bumps while going through cloud are common. Smoother air is above.',
  ] },
  { until: 0.61, name: 'Cruising', normal: [
    'This is the smoothest part of the flight.',
    'Small bumps now and then are like ripples on a road.',
    'The seatbelt sign going on just means stay seated for a bit.',
  ] },
  { until: 0.89, name: 'Descending into Chiang Mai', normal: [
    'Your ears popping is just the air pressure changing.',
    'The nose dipping and the engines going quiet is a normal, gentle descent.',
    'Rumbling or a whir means flaps and air brakes are slowing the plane down on purpose.',
    'There are mountains around Chiang Mai, so a few bumps on the way in are routine.',
  ] },
  { until: 1.01, name: 'Landing', normal: [
    'A "thunk" a few minutes before landing is the wheels coming down.',
    'A firm touchdown is normal, and on wet runways it\'s done on purpose.',
    'A big roar after touchdown is the engines helping to brake.',
  ] },
];

const flight = {
  get state() { return store.get('flight', { start: null, duration: 90 }); },
  set state(v) { store.set('flight', v); },
  elapsedMin() { const s = this.state; return s.start ? (Date.now() - s.start) / 60000 : 0; },
  remainingMin() { const s = this.state; return Math.max(0, s.duration - this.elapsedMin()); },
  progress() { const s = this.state; return s.start ? Math.min(1, this.elapsedMin() / s.duration) : 0; },
  phase() { const p = this.progress(); return PHASES.find(ph => p < ph.until) || PHASES[PHASES.length - 1]; },
  active() { return !!this.state.start; },
  landed() { return this.active() && this.remainingMin() <= 0; },
};

const fmtMin = m => {
  m = Math.ceil(m);
  if (m >= 60) return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
  return `${m}m`;
};
const clock = date => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const PLANE = 'M13,0 C13,-1.5 11,-2 9,-2 L2,-2 L-4,-11 L-7,-11 L-3,-2 L-9,-2 L-12,-6 L-14,-6 L-12.5,0 L-14,6 L-12,6 L-9,2 L-3,2 L-7,11 L-4,11 L2,2 L9,2 C11,2 13,1.5 13,0 Z';
const ROUTE = 'M 200 178 C 215 120, 100 110, 112 42';

function mapSVG() {
  return `<svg viewBox="0 0 300 210" preserveAspectRatio="xMidYMid meet">
    <g fill="#1a2c45" opacity=".9">
      <path d="M40 70 L70 30 L95 70 Z"/><path d="M75 70 L105 22 L135 70 Z" opacity=".7"/><path d="M128 70 L150 40 L172 70 Z" opacity=".5"/>
    </g>
    <path id="routeBase" d="${ROUTE}" fill="none" stroke="#2c3d58" stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round"/>
    <path id="routeDone" d="${ROUTE}" fill="none" stroke="url(#rg)" stroke-width="3" stroke-linecap="round"/>
    <defs><linearGradient id="rg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#7cb4ff"/><stop offset="1" stop-color="#5eead4"/></linearGradient></defs>
    <circle cx="200" cy="178" r="5" fill="#7cb4ff"/><circle cx="112" cy="42" r="5" fill="#5eead4"/>
    <circle cx="112" cy="42" r="11" fill="none" stroke="#5eead4" opacity=".35"/>
    <text x="214" y="182" fill="#8a97ab" font-size="12" font-weight="600">Bangkok</text>
    <text x="128" y="46" fill="#cfe" font-size="12" font-weight="600">Chiang Mai</text>
    <g id="plane"><path d="${PLANE}" fill="#fff"/></g>
  </svg>`;
}

function phaseHTML() {
  const ph = flight.phase();
  return `<div class="fl-phase"><div class="fl-phase-name">${ph.name}</div>
    <ul class="fl-normal">${ph.normal.map(n => `<li>${n}</li>`).join('')}</ul></div>`;
}

function renderFlightCard() {
  const card = $('#flightCard');
  const s = flight.state;

  if (!s.start) {
    card.innerHTML = `<div class="fl-map">${mapSVG()}</div>
      <div class="fl-setup">
        <h3>Ready when you are</h3>
        <p>Tap start when the plane starts moving. The countdown keeps going even if you close the app.</p>
        <div class="dur-row"><button id="durMinus">−</button><div style="text-align:center"><small style="color:var(--muted);font-size:12px">Flight length</small><br><b id="durVal">${fmtMin(s.duration)}</b></div><button id="durPlus">+</button></div>
        <button class="big-btn" id="flStart">Start · we're moving</button>
      </div>`;
    const setDur = d => { flight.state = { ...flight.state, duration: Math.max(30, Math.min(240, d)) }; $('#durVal').textContent = fmtMin(flight.state.duration); };
    $('#durMinus').onclick = () => setDur(flight.state.duration - 5);
    $('#durPlus').onclick = () => setDur(flight.state.duration + 5);
    $('#flStart').onclick = () => { flight.state = { ...flight.state, start: Date.now() }; renderFlightCard(); };
    placePlane(0);
    return;
  }

  if (flight.landed()) {
    card.innerHTML = `<div class="fl-map">${mapSVG()}</div>
      <div class="fl-main">
        <div class="fl-big">Welcome to Chiang Mai</div>
        <div class="fl-sub">You did it. สวัสดี (sa-wat-dee)!</div>
        <div class="fl-bar"><i style="width:100%"></i></div>
        <div class="fl-tools"><button id="flMore">Not landed yet · +10 min</button><button id="flReset">Reset</button></div>
      </div>`;
    $('#flMore').onclick = () => { const st = flight.state; flight.state = { ...st, duration: Math.ceil(flight.elapsedMin()) + 10 }; renderFlightCard(); };
    $('#flReset').onclick = resetFlight;
    placePlane(1);
    return;
  }

  card.innerHTML = `<div class="fl-map">${mapSVG()}</div>
    <div class="fl-main">
      <div class="fl-big" id="flRemain"></div>
      <div class="fl-sub" id="flSub"></div>
      <div class="fl-bar"><i id="flBar"></i></div>
      <div class="fl-ends"><span id="flDep"></span><span id="flArr"></span></div>
      <div id="flPhase"></div>
      <div class="fl-tools"><button id="flLess">−5 min</button><button id="flAdd">+5 min</button><button id="flReset">Reset</button></div>
    </div>`;
  const adjust = d => { const st = flight.state; flight.state = { ...st, duration: Math.max(Math.ceil(flight.elapsedMin()) + 1, st.duration + d) }; tickFlight(true); };
  $('#flLess').onclick = () => adjust(-5);
  $('#flAdd').onclick = () => adjust(5);
  $('#flReset').onclick = resetFlight;
  tickFlight(true);
}

function resetFlight() {
  overlay.show(`<h2>Reset flight?</h2><p>This clears the countdown.</p>
    <button class="big-btn" id="ovYes">Reset</button><button class="big-btn alt" id="ovNo">Cancel</button>`,
    { '#ovYes': () => { flight.state = { ...flight.state, start: null }; renderFlightCard(); renderChips(); }, '#ovNo': () => {} });
}

function placePlane(p) {
  const path = $('#flightCard #routeBase');
  const done = $('#flightCard #routeDone');
  const plane = $('#flightCard #plane');
  if (!path) return;
  const len = path.getTotalLength();
  const at = path.getPointAtLength(len * p);
  const ahead = path.getPointAtLength(Math.min(len, len * p + 1));
  const behind = path.getPointAtLength(Math.max(0, len * p - 1));
  const angle = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180 / Math.PI;
  plane.setAttribute('transform', `translate(${at.x} ${at.y}) rotate(${angle})`);
  done.style.strokeDasharray = `${len * p} ${len}`;
}

let lastPhase = null;
function tickFlight(force) {
  renderChips();
  if (!flight.active()) return;
  if (flight.landed()) { if ($('#flRemain')) renderFlightCard(); return; }
  const el = $('#flRemain');
  if (!el) return;
  const s = flight.state;
  const rem = flight.remainingMin();
  el.innerHTML = `${fmtMin(rem)}<small>to go</small>`;
  const pct = Math.floor(flight.progress() * 100);
  $('#flSub').textContent = `${pct}% of the way there`;
  $('#flBar').style.width = pct + '%';
  $('#flDep').textContent = 'Left ' + clock(new Date(s.start));
  $('#flArr').textContent = 'Lands ~' + clock(new Date(s.start + s.duration * 60000));
  const ph = flight.phase();
  if (force || ph !== lastPhase) { $('#flPhase').innerHTML = phaseHTML(); lastPhase = ph; }
  placePlane(flight.progress());
}

function renderChips() {
  const txt = !flight.active() ? '' : flight.landed() ? 'Landed 🎉' : `✈ ${fmtMin(flight.remainingMin())} to go`;
  $$('[data-chip]').forEach(c => c.textContent = txt);
}

// ---------- "It's bumpy" screen ----------
const FACTS = [
  'Turbulence is just moving air, like waves under a boat. The plane rides over it. It isn\'t fighting it.',
  'Airliner wings are tested by bending them far beyond anything turbulence can do. They flex on purpose, like a diving board.',
  'What feels like a big drop is usually only a few metres. Your body exaggerates it.',
  'Pilots hear about bumps from planes ahead and change height to find smoother air. They\'re probably doing it right now.',
  'The seatbelt sign means "stay seated so you don\'t bump your head". It doesn\'t mean danger.',
  'Most patches of turbulence last only a few minutes.',
  'To pilots, turbulence is like a bumpy road. It\'s about comfort, not safety.',
  'Bangkok to Chiang Mai is one of Thailand\'s busiest routes. Crews fly it many times a day and know every bump.',
  'On short flights you spend lots of time climbing and descending through cloud, which is where the bumps are. The air above is usually calmer.',
  'If the crew are still walking around, it\'s mild. If they sit down, that\'s only so they stay steady, same as you.',
  'Your seatbelt, done up snugly, is all you need. Then you\'re in the safest place on the plane.',
  'The thumps and whirs you hear are flaps, landing gear and engine settings changing. All of it is planned.',
  'Planes are built to keep flying straight and level by themselves. Bumps nudge them, and they settle right back.',
  'The bumps feel a bit bigger at the back of the plane. That changes nothing about how safe you are.',
  'Every bump you feel is one less between you and Chiang Mai.',
];
let factIdx = rand(FACTS.length);
function showFact() {
  const t = $('#factText');
  t.textContent = FACTS[factIdx % FACTS.length];
  t.classList.remove('fade'); void t.offsetWidth; t.classList.add('fade');
  $('#factNum').textContent = `Fact ${(factIdx % FACTS.length) + 1} of ${FACTS.length}`;
}
$('#factCard').addEventListener('click', () => { factIdx++; showFact(); });
screens.bumpy = {
  onShow() {
    showFact();
    $('#bumpyPhase').innerHTML = flight.active() && !flight.landed()
      ? `${phaseHTML()}<div class="fl-sub" style="margin-top:8px">${fmtMin(flight.remainingMin())} until Chiang Mai</div>`
      : `<div class="fl-phase"><div class="fl-phase-name">Normal sounds & feelings</div><ul class="fl-normal">${PHASES[1].normal.slice(0, 3).map(n => `<li>${n}</li>`).join('')}</ul></div>`;
  },
};
screens.home = { onShow() { renderFlightCard(); } };

renderFlightCard();
setInterval(() => tickFlight(false), 5000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { if (nav.current === 'home') renderFlightCard(); else tickFlight(true); } });
