// Flight countdown + "It's bumpy" facts
const THAI = /chiang|bangkok|phuket|krabi|samui|pattaya|hat yai|udon|thai|chiang rai|hua hin/i;

const flight = {
  get state() { return { start: null, duration: 90, from: 'Bangkok', to: 'Chiang Mai', ...store.get('flight', {}) }; },
  set state(v) { store.set('flight', v); },
  update(patch) { this.state = { ...this.state, ...patch }; },
  elapsedMin() { const s = this.state; return s.start ? (Date.now() - s.start) / 60000 : 0; },
  remainingMin() { return Math.max(0, this.state.duration - this.elapsedMin()); },
  progress() { const s = this.state; return s.start ? Math.min(1, this.elapsedMin() / s.duration) : 0; },
  active() { return !!this.state.start; },
  landed() { return this.active() && this.remainingMin() <= 0; },
  // Phases use real-world minutes (taxi ~10, climb ~20, descent ~25, landing ~10), squeezed for short flights
  phase() {
    const s = this.state, D = s.duration, k = Math.min(1, D / 90);
    const bounds = [10 * k, 30 * k, D - 35 * k, D - 10 * k, Infinity];
    const e = this.elapsedMin();
    return phases()[bounds.findIndex(b => e < b)];
  },
};

function phases() {
  const { to, duration } = flight.state;
  const cruise = [
    'This is the smoothest part of the flight.',
    'Small bumps now and then are like ripples on a road.',
    'The seatbelt sign going on just means stay seated for a bit.',
  ];
  if (duration >= 180) cruise.push(
    'Dimmed lights are just bedtime on board so people can sleep.',
    'A gentle climb hours into the flight is a "step climb". The plane is lighter after burning fuel, so it moves up to smoother air.',
    'Crew walking around and serving food means everything is calm.',
  );
  const descent = [
    'Your ears popping is just the air pressure changing.',
    'The nose dipping and the engines going quiet is a normal, gentle descent.',
    'Rumbling or a whir means flaps and air brakes are slowing the plane down on purpose.',
  ];
  if (/chiang mai/i.test(to)) descent.push('There are mountains around Chiang Mai, so a few bumps on the way in are routine.');
  return [
    { name: 'Taxiing to the runway', normal: [
      'Stop-start rolling and turns. The plane is queuing like traffic.',
      'Thuds and whirs under you are the flaps getting set for takeoff.',
      'The safety demo happens on every flight. It doesn\'t mean anything is up.',
    ] },
    { name: 'Takeoff & climb', normal: [
      'A loud roar and being pushed into your seat means full power, which is what you want.',
      'A clunk right after liftoff is the landing gear folding away.',
      'The engines going quieter a minute later is planned. Pilots ease off once you\'re up.',
      'Bumps while going through cloud are common. Smoother air is above.',
    ] },
    { name: 'Cruising', normal: cruise },
    { name: `Descending into ${to || 'your destination'}`, normal: descent },
    { name: 'Landing', normal: [
      'A "thunk" a few minutes before landing is the wheels coming down.',
      'A firm touchdown is normal, and on wet runways it\'s done on purpose.',
      'A big roar after touchdown is the engines helping to brake.',
    ] },
  ];
}

const fmtMin = m => {
  m = Math.ceil(m);
  if (m >= 60) return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
  return `${m}m`;
};
const clock = date => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const PLANE = 'M13,0 C13,-1.5 11,-2 9,-2 L2,-2 L-4,-11 L-7,-11 L-3,-2 L-9,-2 L-12,-6 L-14,-6 L-12.5,0 L-14,6 L-12,6 L-9,2 L-3,2 L-7,11 L-4,11 L2,2 L9,2 C11,2 13,1.5 13,0 Z';
const ROUTE = 'M 200 178 C 215 120, 100 110, 112 42';

function mapSVG() {
  const { from, to } = flight.state;
  return `<svg viewBox="0 0 300 210" preserveAspectRatio="xMidYMid meet">
    <g fill="#1a2c45" opacity=".9">
      <path d="M40 70 L70 30 L95 70 Z"/><path d="M75 70 L105 22 L135 70 Z" opacity=".7"/><path d="M128 70 L150 40 L172 70 Z" opacity=".5"/>
    </g>
    <path id="routeBase" d="${ROUTE}" fill="none" stroke="#2c3d58" stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round"/>
    <path id="routeDone" d="${ROUTE}" fill="none" stroke="url(#rg)" stroke-width="3" stroke-linecap="round"/>
    <defs><linearGradient id="rg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#7cb4ff"/><stop offset="1" stop-color="#5eead4"/></linearGradient></defs>
    <circle cx="200" cy="178" r="5" fill="#7cb4ff"/><circle cx="112" cy="42" r="5" fill="#5eead4"/>
    <circle cx="112" cy="42" r="11" fill="none" stroke="#5eead4" opacity=".35"/>
    <text x="214" y="182" fill="#8a97ab" font-size="12" font-weight="600">${esc(from)}</text>
    <text x="128" y="46" fill="#cfe" font-size="12" font-weight="600">${esc(to)}</text>
    <defs><linearGradient id="rbw" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff4fa3"/><stop offset=".33" stop-color="#ffe14d"/><stop offset=".66" stop-color="#3cd5ff"/><stop offset="1" stop-color="#9b6bff"/></linearGradient></defs>
    <g id="plane"><path d="${PLANE}" fill="#fff"/></g>
    <text id="uniPlane" font-size="26" text-anchor="middle" dominant-baseline="central">🦄</text>
  </svg>`;
}

function phaseHTML() {
  const ph = flight.phase();
  return `<div class="fl-phase"><div class="fl-phase-name">${esc(ph.name)}</div>
    <ul class="fl-normal">${ph.normal.map(n => `<li>${n}</li>`).join('')}</ul></div>`;
}

function renderRouteLabel() {
  const { from, to } = flight.state;
  $('.route-label').innerHTML = `${esc(from)} <span>→</span> ${esc(to)}`;
}

const PRESETS = [60, 90, 120, 180, 300, 480, 720];

function renderFlightCard() {
  const card = $('#flightCard');
  const s = flight.state;
  renderRouteLabel();

  if (!s.start) {
    card.innerHTML = `<div class="fl-map">${mapSVG()}</div>
      <div class="fl-setup">
        <h3>Ready when you are</h3>
        <p>Tap start when the plane starts moving. The countdown keeps going even if you close the app.</p>
        <div class="route-inputs">
          <label><small>From</small><input id="flFrom" value="${esc(s.from)}" autocomplete="off" enterkeyhint="done"></label>
          <span>→</span>
          <label><small>To</small><input id="flTo" value="${esc(s.to)}" autocomplete="off" enterkeyhint="done"></label>
        </div>
        <div class="dur-box">
          <div class="dur-head"><small>Flight length</small><b id="durVal">${fmtMin(s.duration)}</b></div>
          <input type="range" id="durRange" min="30" max="960" step="5" value="${s.duration}">
          <div class="dur-presets">${PRESETS.map(m => `<button data-min="${m}">${Math.floor(m / 60)}h${m % 60 ? ' ' + (m % 60) : ''}</button>`).join('')}</div>
          <div class="dur-fine"><button id="durMinus">− 5 min</button><button id="durPlus">+ 5 min</button></div>
        </div>
        <button class="big-btn" id="flStart">Start · we're moving</button>
      </div>`;
    const setDur = d => {
      d = Math.max(30, Math.min(960, d));
      flight.update({ duration: d });
      $('#durVal').textContent = fmtMin(d);
      $('#durRange').value = d;
      $$('.dur-presets button').forEach(b => b.classList.toggle('on', +b.dataset.min === d));
    };
    setDur(s.duration);
    $('#durRange').oninput = e => setDur(+e.target.value);
    $$('.dur-presets button').forEach(b => b.onclick = () => setDur(+b.dataset.min));
    $('#durMinus').onclick = () => setDur(flight.state.duration - 5);
    $('#durPlus').onclick = () => setDur(flight.state.duration + 5);
    const saveRoute = () => {
      flight.update({ from: $('#flFrom').value.trim() || 'Here', to: $('#flTo').value.trim() || 'There' });
      renderRouteLabel();
      const svg = $('#flightCard .fl-map');
      svg.innerHTML = mapSVG(); placePlane(0);
    };
    $('#flFrom').onchange = saveRoute;
    $('#flTo').onchange = saveRoute;
    $$('.route-inputs input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') i.blur(); }));
    $('#flStart').onclick = e => { window.uni?.boom(e.clientX, e.clientY, true); flight.update({ start: Date.now() }); renderFlightCard(); };
    placePlane(0);
    return;
  }

  if (flight.landed()) {
    card.innerHTML = `<div class="fl-map">${mapSVG()}</div>
      <div class="fl-main">
        <div class="fl-big">Welcome to ${esc(s.to)}</div>
        <div class="fl-sub">You did it!${THAI.test(s.to) ? ' สวัสดี (sa-wat-dee)!' : ''}</div>
        <div class="fl-bar"><i style="width:100%"></i></div>
        <div class="fl-tools"><button id="flMore">Not landed yet · +10 min</button><button id="flReset">Reset</button></div>
      </div>`;
    $('#flMore').onclick = () => { flight.update({ duration: Math.ceil(flight.elapsedMin()) + 10 }); renderFlightCard(); };
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
      <div class="fl-tools"><button id="flLess">−5 min</button><button id="flAdd">+5 min</button><button id="flLess30">−30</button><button id="flAdd30">+30</button><button id="flReset">Reset</button></div>
    </div>`;
  const adjust = d => { flight.update({ duration: Math.max(Math.ceil(flight.elapsedMin()) + 1, flight.state.duration + d) }); tickFlight(true); };
  $('#flLess').onclick = () => adjust(-5);
  $('#flAdd').onclick = () => adjust(5);
  $('#flLess30').onclick = () => adjust(-30);
  $('#flAdd30').onclick = () => adjust(30);
  $('#flReset').onclick = resetFlight;
  tickFlight(true);
}

function resetFlight() {
  overlay.show(`<h2>Reset flight?</h2><p>This clears the countdown.</p>
    <button class="big-btn" id="ovYes">Reset</button><button class="big-btn alt" id="ovNo">Cancel</button>`,
    { '#ovYes': () => { flight.update({ start: null }); renderFlightCard(); renderChips(); }, '#ovNo': () => {} });
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
  $('#flightCard #uniPlane')?.setAttribute('transform', `translate(${at.x} ${at.y})`);
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
  el.innerHTML = `${fmtMin(flight.remainingMin())}<small>to go</small>`;
  const pct = Math.floor(flight.progress() * 100);
  $('#flSub').textContent = `${pct}% of the way there`;
  $('#flBar').style.width = pct + '%';
  $('#flDep').textContent = 'Left ' + clock(new Date(s.start));
  $('#flArr').textContent = 'Lands ~' + clock(new Date(s.start + s.duration * 60000));
  const ph = flight.phase();
  if (force || ph.name !== lastPhase) { $('#flPhase').innerHTML = phaseHTML(); lastPhase = ph.name; }
  placePlane(flight.progress());
}

function renderChips() {
  const txt = !flight.active() ? '' : flight.landed() ? 'Landed 🎉' : `✈ ${fmtMin(flight.remainingMin())} to go`;
  $$('[data-chip]').forEach(c => c.textContent = txt);
}

// ---------- "It's bumpy" screen ----------
// Facts are shuffled into a deck so you see every one before any repeats
let deck = [], deckPos = 0, factCat = 'All';
const routeFacts = () => FACTS.filter(f => !f.only || f.only.test(flight.state.to + ' ' + flight.state.from));
function buildDeck() {
  const pool = routeFacts().filter(f => factCat === 'All' || f.cat === factCat);
  deck = shuffle(pool.slice());
  if (factCat === 'All') {
    // start with a few turbulence facts: that's why you tapped the button
    const first = deck.filter(f => f.cat === 'Turbulence').slice(0, 3);
    deck = [...first, ...deck.filter(f => !first.includes(f))];
  }
  deckPos = 0;
}
function renderCats() {
  const avail = new Set(routeFacts().map(f => f.cat));
  $('#factCats').innerHTML = ['All', ...FACT_CATS.filter(c => avail.has(c))]
    .map(c => `<button class="${c === factCat ? 'on' : ''}" data-cat="${c}">${c}</button>`).join('');
}
function showFact() {
  if (!deck.length) buildDeck();
  const f = deck[deckPos];
  const t = $('#factText');
  t.textContent = f.text.replace('{to}', flight.state.to || 'your destination');
  t.classList.remove('fade'); void t.offsetWidth; t.classList.add('fade');
  $('#factNum').innerHTML = `<span class="fact-cat">${f.cat}</span> ${deckPos + 1} of ${deck.length}`;
}
$('#factCats').addEventListener('click', e => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  factCat = b.dataset.cat;
  renderCats(); buildDeck(); showFact();
  b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
});
$('#factCard').addEventListener('click', e => {
  if (e.target.closest('#factPrev')) { deckPos = (deckPos - 1 + deck.length) % deck.length; }
  else { deckPos++; if (deckPos >= deck.length) buildDeck(); }
  showFact();
});
screens.bumpy = {
  onShow() {
    renderCats();
    buildDeck();
    showFact();
    $('#bumpyPhase').innerHTML = flight.active() && !flight.landed()
      ? `${phaseHTML()}<div class="fl-sub" style="margin-top:8px">${fmtMin(flight.remainingMin())} until ${esc(flight.state.to)}</div>`
      : `<div class="fl-phase"><div class="fl-phase-name">Normal sounds & feelings</div><ul class="fl-normal">${phases()[1].normal.slice(0, 3).map(n => `<li>${n}</li>`).join('')}</ul></div>`;
  },
};
screens.home = { onShow() { renderFlightCard(); } };

renderFlightCard();
setInterval(() => tickFlight(false), 5000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (nav.current === 'home' && !document.activeElement?.matches('input')) renderFlightCard(); else tickFlight(true);
});
