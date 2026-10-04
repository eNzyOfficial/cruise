// Fruit Merge: drop fruits into the jar; two of the same merge into the next bigger fruit.
(() => {
  const CHAIN = ['🫐', '🍒', '🍓', '🍋', '🍊', '🍎', '🍐', '🍑', '🍍', '🍈', '🍉'];
  const NAMES = ['Blueberry', 'Cherry', 'Strawberry', 'Lemon', 'Orange', 'Apple', 'Pear', 'Peach', 'Pineapple', 'Melon', 'WATERMELON'];
  const COLORS = ['#6b9bff', '#ff4f6d', '#ff4d7a', '#ffe14d', '#ffa53d', '#ff5a5a', '#c5e86c', '#ffb07c', '#ffd34d', '#b8f08a', '#5ee36b'];
  const SIZE = [0.045, 0.058, 0.072, 0.086, 0.102, 0.12, 0.138, 0.158, 0.18, 0.205, 0.235]; // radius as a share of jar width
  const stage = $('#mgStage'), cv = $('#mgCanvas'), ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  let bodies = [], score = 0, best = store.get('mergeBest', 0), next = 0, cur = 0, aimX = 0.5;
  let dropReady = true, over = false, dangerSince = 0, running = false, last = 0, acc = 0, nextId = 1;
  const DROP_Y = () => H * 0.11;

  // emoji drawn once into sprites, then reused every frame
  const sprites = CHAIN.map(ch => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.font = '104px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(ch, 64, 70);
    return c;
  });

  const sound = {
    on: store.get('mergeSound', false), ctx: null,
    init() { try { this.ctx ||= new (window.AudioContext || window.webkitAudioContext)(); this.ctx.resume(); } catch {} },
    plop(t) {
      if (!this.on || !this.ctx) return;
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(), now = c.currentTime;
      o.type = 'sine'; o.frequency.setValueAtTime(700 - t * 40, now); o.frequency.exponentialRampToValueAtTime(220 - t * 10, now + 0.18);
      g.gain.setValueAtTime(0.18, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      o.connect(g).connect(c.destination); o.start(now); o.stop(now + 0.22);
    },
  };
  const sb = $('#mgSound');
  const paintSound = () => sb.textContent = sound.on ? '🔊' : '🔇';
  sb.onclick = () => { sound.on = !sound.on; store.set('mergeSound', sound.on); if (sound.on) { sound.init(); sound.plop(3); } paintSound(); };
  paintSound();

  function resize() {
    const r = stage.getBoundingClientRect();
    if (!r.width) return;
    const oldW = W;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (oldW && oldW !== W) bodies.forEach(b => { b.x *= W / oldW; b.y *= W / oldW; b.r = SIZE[b.t] * W; });
  }
  const radius = t => SIZE[t] * W;
  const randStart = () => rand(5);

  function newGame() {
    bodies = []; score = 0; over = false; dangerSince = 0;
    cur = randStart(); next = randStart();
    hud(); save();
  }
  function hud() {
    $('#mgScore').textContent = score;
    $('#mgBest').textContent = best;
    $('#mgNext').textContent = CHAIN[next];
    $('#mgChain').innerHTML = CHAIN.map((c, i) => `<span style="font-size:${12 + i * 1.6}px">${c}</span>`).join('<i>›</i>');
  }
  function save() {
    store.set('merge', { score, cur, next, bodies: bodies.map(b => ({ t: b.t, x: b.x / W, y: b.y / W })) });
  }
  function load() {
    const s = store.get('merge', null);
    if (!s) return newGame();
    score = s.score; cur = s.cur; next = s.next;
    bodies = s.bodies.map(b => ({ id: nextId++, t: b.t, x: b.x * W, y: b.y * W, vx: 0, vy: 0, r: radius(b.t), born: performance.now() - 5000, rot: 0 }));
    hud();
  }

  // ---------- aiming and dropping ----------
  const toX = e => { const r = cv.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
  cv.addEventListener('pointerdown', e => { if (sound.on) sound.init(); aimX = toX(e); });
  cv.addEventListener('pointermove', e => { aimX = toX(e); });
  cv.addEventListener('pointerup', e => { aimX = toX(e); drop(); });

  function drop() {
    if (!dropReady || over) return;
    const r = radius(cur);
    const x = Math.max(r, Math.min(W - r, aimX * W));
    bodies.push({ id: nextId++, t: cur, x, y: DROP_Y(), vx: 0, vy: 0, r, born: performance.now(), rot: 0 });
    cur = next; next = randStart();
    dropReady = false;
    setTimeout(() => dropReady = true, 450);
    hud();
  }

  // ---------- physics ----------
  const G = 2400;
  function step(dt) {
    for (const b of bodies) {
      b.vy += G * dt;
      b.vx *= 0.999; b.vy *= 0.999;
      b.x += b.vx * dt; b.y += b.vy * dt;
      b.rot += b.vx * dt / b.r;
    }
    const merges = [];
    for (let it = 0; it < 3; it++) {
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];
        for (let j = i + 1; j < bodies.length; j++) {
          const b = bodies[j];
          const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r;
          if (dx * dx + dy * dy >= rr * rr) continue;
          const d = Math.sqrt(dx * dx + dy * dy) || 0.01, nx = dx / d, ny = dy / d;
          if (a.t === b.t && a.t < CHAIN.length - 1 && !a.dead && !b.dead) { a.dead = b.dead = true; merges.push([a, b]); continue; }
          if (a.t === b.t && a.t === CHAIN.length - 1 && !a.dead && !b.dead) { a.dead = b.dead = true; merges.push([a, b]); continue; }
          const ma = a.r * a.r, mb = b.r * b.r, overlap = rr - d;
          a.x -= nx * overlap * mb / (ma + mb); a.y -= ny * overlap * mb / (ma + mb);
          b.x += nx * overlap * ma / (ma + mb); b.y += ny * overlap * ma / (ma + mb);
          const vrel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (vrel < 0) {
            const jimp = -(1.15) * vrel / (1 / ma + 1 / mb);
            a.vx -= jimp * nx / ma; a.vy -= jimp * ny / ma;
            b.vx += jimp * nx / mb; b.vy += jimp * ny / mb;
          }
        }
      }
      for (const b of bodies) {
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.3; }
        if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.3; }
        if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy) * 0.15; b.vx *= 0.96; }
      }
    }
    for (const [a, b] of merges) merge(a, b);
    if (merges.length) bodies = bodies.filter(b => !b.dead);
  }

  let combo = 0, comboTimer;
  function merge(a, b) {
    const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
    const r = cv.getBoundingClientRect(), sx = r.left + x, sy = r.top + y;
    const big = a.t === CHAIN.length - 1;
    combo++; clearTimeout(comboTimer); comboTimer = setTimeout(() => combo = 0, 900);
    if (big) {
      // two watermelons: they vanish in a huge celebration
      score += 500;
      fx.flash('#5ee36b', 0.6); fx.confetti(160); fx.fireworks(8, 1500);
      fx.emojiBurst(sx, sy, ['🍉', '✨', '💖'], 20);
      bigText('DOUBLE WATERMELON 🍉🍉');
    } else {
      const t = a.t + 1;
      bodies.push({ id: nextId++, t, x, y, vx: (a.vx + b.vx) / 2, vy: Math.min(a.vy, b.vy) / 2 - 120, r: radius(t), born: performance.now(), rot: 0, pop: performance.now() });
      score += (t + 1) * (t + 2) / 2 * (combo > 1 ? combo : 1);
      fx.explode(sx, sy, COLORS[t], 0.9 + t * 0.22);
      if (t >= 5) fx.ring(sx, sy, COLORS[t], radius(t) * 2.5, 6, 600);
      if (t >= 7) { fx.flash(COLORS[t], 0.3); bigText(`${NAMES[t]}! ${CHAIN[t]}`); }
      else if (combo >= 3) bigText(`Combo ×${combo}!`);
      if (t === CHAIN.length - 1) { fx.fireworks(6, 1200); fx.emojiRain(['🍉', '✨'], 30); }
      sound.plop(t);
      haptic();
      if (window.uni?.on) { uni.boom(sx, sy, t >= 4); if (t >= 3) uni.phrase(sx, sy - 40); }
    }
    if (score > best) { best = score; store.set('mergeBest', best); }
    hud();
  }

  function bigText(text) {
    const el = document.createElement('div');
    el.className = 'fr-combo big';
    el.innerHTML = `<i class="fr-rays"></i><b>${text}</b>`;
    stage.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  // ---------- drawing ----------
  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    const dy = DROP_Y();
    // danger line
    const danger = dangerSince && now - dangerSince > 300;
    ctx.strokeStyle = danger ? `rgba(255,90,120,${0.5 + 0.5 * Math.sin(now / 90)})` : 'rgba(255,255,255,0.18)';
    ctx.setLineDash([6, 8]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, dy + radius(4)); ctx.lineTo(W, dy + radius(4)); ctx.stroke();
    ctx.setLineDash([]);
    // aim guide + the fruit about to drop
    if (!over) {
      const r = radius(cur), x = Math.max(r, Math.min(W - r, aimX * W));
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, dy); ctx.lineTo(x, H); ctx.stroke();
      if (dropReady) drawFruit(cur, x, dy, r, 0, 1);
    }
    for (const b of bodies) {
      const s = b.pop ? Math.min(1, 0.6 + (now - b.pop) / 250) : 1;
      drawFruit(b.t, b.x, b.y, b.r * s, b.rot, 1);
    }
  }
  function drawFruit(t, x, y, r, rot, a) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y); ctx.rotate(rot);
    const s = r * 2.3;
    ctx.drawImage(sprites[t], -s / 2, -s / 2, s, s);
    ctx.restore();
  }

  // ---------- loop ----------
  function loop(now) {
    if (nav.current !== 'merge' || document.hidden) { running = false; return; }
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    acc += dt;
    const h = 1 / 240;
    while (acc >= h) { step(h); acc -= h; }
    // game over if a settled fruit stays above the line
    const line = DROP_Y() + radius(4);
    const high = bodies.some(b => now - b.born > 1500 && b.y - b.r < line && Math.abs(b.vy) < 60);
    if (high) { dangerSince ||= now; if (now - dangerSince > 2500) gameOver(); } else dangerSince = 0;
    draw(now);
    if (Math.random() < 0.02) save();
    requestAnimationFrame(loop);
  }
  function start() {
    resize();
    if (!running) { running = true; last = 0; requestAnimationFrame(loop); }
  }

  function gameOver() {
    if (over) return;
    over = true; save();
    overlay.show(`<h2>Jar's full! 🫙</h2><p>Score <b style="color:var(--text)">${score}</b> · Best ${best}</p>
      <button class="big-btn" id="ovNew">Play again</button>`, { '#ovNew': () => { newGame(); start(); } });
  }
  $('#mgRestart').onclick = () => overlay.show(`<h2>Start over?</h2><p>Your current jar will be emptied.</p>
    <button class="big-btn" id="ovYes">New game</button><button class="big-btn alt" id="ovNo">Keep playing</button>`,
    { '#ovYes': () => { newGame(); start(); }, '#ovNo': () => {} });

  let loaded = false;
  screens.merge = {
    onShow() {
      resize();
      if (!loaded) { loaded = true; load(); }
      hud();
      start();
    },
    meta: () => best ? `Best ${best}` : 'Make a watermelon',
  };
  window.addEventListener('resize', () => { if (nav.current === 'merge') resize(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && nav.current === 'merge') start(); else save(); });
})();
