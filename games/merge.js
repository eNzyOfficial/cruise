// Fruit Merge: drop fruits into the jar; two of the same merge into the next bigger fruit.
// Now and then the magic dog turns up: a magic piece that levels up whatever fruit he touches.
(() => {
  const CHAIN = ['🫐', '🍒', '🍓', '🍋', '🍊', '🍎', '🍐', '🍑', '🍍', '🍈', '🍉'];
  const NAMES = ['Blueberry', 'Cherry', 'Strawberry', 'Lemon', 'Orange', 'Apple', 'Pear', 'Peach', 'Pineapple', 'Melon', 'WATERMELON'];
  const COLORS = ['#6b9bff', '#ff4f6d', '#ff4d7a', '#ffe14d', '#ffa53d', '#ff5a5a', '#c5e86c', '#ffb07c', '#ffd34d', '#b8f08a', '#5ee36b'];
  const SIZE = [0.045, 0.058, 0.072, 0.086, 0.102, 0.12, 0.138, 0.158, 0.18, 0.205, 0.235, 0.07]; // radius as a share of jar width
  const MAGIC = CHAIN.length; // the magic dog, a wildcard
  COLORS[MAGIC] = '#ffd166';
  const stage = $('#mgStage'), cv = $('#mgCanvas'), ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  let bodies = [], score = 0, best = store.get('mergeBest', 0), next = 0, cur = 0, aimX = 0.5, drops = 0;
  let dropReady = true, over = false, danger = 0, running = false, last = 0, acc = 0, nextId = 1;
  // everything is measured in jar widths so the game plays the same on every screen
  const DROP_Y = () => W * 0.15;
  const LINE_Y = () => W * 0.27;
  const LOSE_AFTER = 2; // seconds a landed fruit may poke above the line

  // emoji drawn once into sprites, trimmed so the fruit fills its circle exactly
  const sprites = CHAIN.map(ch => {
    const c = document.createElement('canvas'); c.width = c.height = 160;
    const g = c.getContext('2d');
    g.font = '120px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(ch, 80, 84);
    const px = g.getImageData(0, 0, 160, 160).data;
    let x0 = 160, y0 = 160, x1 = 0, y1 = 0;
    for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) if (px[(y * 160 + x) * 4 + 3] > 40) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    if (x1 <= x0) return { c, cx: 80, cy: 84, size: 120 };
    return { c, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, size: Math.max(x1 - x0, y1 - y0) };
  });
  // The dog's face in a golden coin
  sprites[MAGIC] = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 160;
    const im = new Image();
    im.onload = () => {
      const g = c.getContext('2d');
      g.fillStyle = '#fff6dc'; g.beginPath(); g.arc(80, 80, 76, 0, Math.PI * 2); g.fill();
      g.save(); g.clip(); g.drawImage(im, 150, 4, 220, 220, 4, 4, 152, 152); g.restore();
      g.strokeStyle = '#ffd166'; g.lineWidth = 8; g.beginPath(); g.arc(80, 80, 76, 0, Math.PI * 2); g.stroke();
    };
    im.src = 'img/dog1.png';
    return { c, cx: 80, cy: 80, size: 160 };
  })();

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
    if (oldW && oldW !== W) bodies.forEach(b => { const k = W / oldW; b.x *= k; b.y *= k; b.vx *= k; b.vy *= k; b.r = SIZE[b.t] * W; });
  }
  const radius = t => SIZE[t] * W;
  // The dog shows up about once every 18 drops, never in the first few and never twice in a row
  const randStart = () => drops > 6 && cur !== MAGIC && next !== MAGIC && Math.random() < 0.055 ? MAGIC : rand(5);

  function newGame() {
    bodies = []; score = 0; over = false; danger = 0; drops = 0;
    cur = rand(5); next = rand(5);
    hud(); save();
  }
  function hud() {
    $('#mgScore').textContent = score;
    $('#mgBest').textContent = best;
    $('#mgNext').innerHTML = next === MAGIC ? '<img class="mg-dog" src="img/dog1.png" alt="Magic dog">' : CHAIN[next];
    $('#mgChain').innerHTML = CHAIN.map((c, i) => `<span style="font-size:${12 + i * 1.6}px">${c}</span>`).join('<i>›</i>');
  }
  function save() {
    store.set('merge', { score, cur, next, drops, bodies: bodies.map(b => ({ t: b.t, x: b.x / W, y: b.y / W })) });
  }
  function load() {
    const s = store.get('merge', null);
    if (!s) return newGame();
    score = s.score; cur = s.cur; next = s.next; drops = s.drops || 0;
    bodies = s.bodies.map(b => ({ id: nextId++, t: b.t, x: b.x * W, y: b.y * W, vx: 0, vy: 0, r: radius(b.t), rot: 0, landed: true }));
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
    bodies.push({ id: nextId++, t: cur, x, y: DROP_Y(), vx: 0, vy: 0, r, rot: 0, landed: false });
    drops++;
    cur = next; next = randStart();
    dropReady = false;
    setTimeout(() => dropReady = true, 450);
    hud();
  }

  // ---------- physics ----------
  // Small fixed steps, several solver passes, a little friction and a settle threshold so stacks rest instead of jittering.
  const ITER = 6, BOUNCE = 0.12, FRICTION = 0.25;
  function step(dt) {
    const G = W * 6.5;
    for (const b of bodies) {
      if (b.grow < 1) { b.grow = Math.min(1, b.grow + dt * 6); b.r = radius(b.t) * (0.55 + 0.45 * b.grow); }
      b.vy += G * dt;
      const damp = Math.pow(0.6, dt); // gentle air drag
      b.vx *= damp; b.vy *= damp;
      b.x += b.vx * dt; b.y += b.vy * dt;
    }
    const merges = [];
    for (let it = 0; it < ITER; it++) {
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];
        if (a.dead) continue;
        for (let j = i + 1; j < bodies.length; j++) {
          const b = bodies[j];
          if (b.dead) continue;
          const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r;
          if (dx * dx + dy * dy >= rr * rr) continue;
          if (canMerge(a, b)) { a.dead = b.dead = true; merges.push([a, b]); break; }
          if (a.landed || b.landed) a.landed = b.landed = true;
          const d = Math.sqrt(dx * dx + dy * dy) || 0.01, nx = dx / d, ny = dy / d;
          const ma = a.r * a.r, mb = b.r * b.r, sum = ma + mb, overlap = (rr - d) * 0.8;
          a.x -= nx * overlap * mb / sum; a.y -= ny * overlap * mb / sum;
          b.x += nx * overlap * ma / sum; b.y += ny * overlap * ma / sum;
          if (it) continue; // velocities once per step, positions every pass
          const rvx = b.vx - a.vx, rvy = b.vy - a.vy, vn = rvx * nx + rvy * ny;
          if (vn >= 0) continue;
          const jn = -(1 + BOUNCE) * vn / (1 / ma + 1 / mb);
          // friction along the contact, capped by the push
          const tx = -ny, ty = nx, vt = rvx * tx + rvy * ty;
          const jt = Math.max(-FRICTION * jn, Math.min(FRICTION * jn, -vt / (1 / ma + 1 / mb)));
          a.vx -= (jn * nx + jt * tx) / ma; a.vy -= (jn * ny + jt * ty) / ma;
          b.vx += (jn * nx + jt * tx) / mb; b.vy += (jn * ny + jt * ty) / mb;
        }
      }
      for (const b of bodies) {
        if (b.x < b.r) { b.x = b.r; if (b.vx < 0) b.vx = -b.vx * 0.2; }
        if (b.x > W - b.r) { b.x = W - b.r; if (b.vx > 0) b.vx = -b.vx * 0.2; }
        if (b.y > H - b.r) { b.y = H - b.r; if (b.vy > 0) b.vy = -b.vy * BOUNCE; b.vx *= 0.97; b.landed = true; }
      }
    }
    for (const b of bodies) {
      // roll with the motion; let near-still fruit come fully to rest
      b.rot += b.vx * dt / b.r;
      if (b.landed && Math.abs(b.vx) < W * 0.01 && Math.abs(b.vy) < W * 0.02) b.vx *= 0.8;
    }
    for (const [a, b] of merges) merge(a, b);
    if (merges.length) bodies = bodies.filter(b => !b.dead);
  }
  const canMerge = (a, b) => (a.t === MAGIC) !== (b.t === MAGIC) || (a.t === b.t && a.t !== MAGIC);

  let combo = 0, comboTimer;
  function merge(a, b) {
    const magic = a.t === MAGIC || b.t === MAGIC;
    if (magic && a.t !== MAGIC) [a, b] = [b, a]; // a is the dog, b the fruit he levels up
    const x = magic ? b.x : (a.x + b.x) / 2, y = magic ? b.y : (a.y + b.y) / 2;
    const r = cv.getBoundingClientRect(), sx = r.left + x, sy = r.top + y;
    const big = b.t === CHAIN.length - 1;
    combo++; clearTimeout(comboTimer); comboTimer = setTimeout(() => combo = 0, 900);
    if (magic) {
      fx.emojiBurst(sx, sy, ['🐾', '✨', '🦴', '💖'], 10);
      fx.ring(sx, sy, '#ffd166', radius(Math.min(b.t + 1, CHAIN.length - 1)) * 2.5, 6, 600);
      bigText(pick(['Dog magic! 🐾', 'Good boy!! 🐶', 'Boop! ✨', 'Best boy magic 🐾']));
    }
    if (big) {
      // two watermelons: they vanish in a huge celebration
      score += 500;
      fx.flash('#5ee36b', 0.6); fx.confetti(160); fx.fireworks(8, 1500);
      fx.emojiBurst(sx, sy, ['🍉', '✨', '💖'], 20);
      bigText('DOUBLE WATERMELON 🍉🍉');
    } else {
      const t = b.t + 1;
      bodies.push({ id: nextId++, t, x, y, vx: (a.vx + b.vx) / 2, vy: Math.min(a.vy, b.vy) / 2 - W * 0.3, r: radius(t) * 0.55, grow: 0, rot: 0, landed: true });
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
    const dy = DROP_Y(), ly = LINE_Y();
    // danger line: pulses faster and redder the closer you are to losing
    const k = danger / LOSE_AFTER;
    ctx.strokeStyle = k > 0 ? `rgba(255,90,120,${0.45 + 0.55 * Math.abs(Math.sin(now / (160 - 110 * k)))})` : 'rgba(255,255,255,0.18)';
    ctx.setLineDash([6, 8]); ctx.lineWidth = 2 + k * 2;
    ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke();
    ctx.setLineDash([]);
    if (k > 0) {
      ctx.fillStyle = `rgba(255,60,90,${0.18 * k})`;
      ctx.fillRect(0, 0, W, ly);
    }
    // aim guide + the fruit about to drop
    if (!over) {
      const r = radius(cur), x = Math.max(r, Math.min(W - r, aimX * W));
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, dy); ctx.lineTo(x, H); ctx.stroke();
      if (dropReady) drawFruit(cur, x, dy, r, 0, 1);
    }
    for (const b of bodies) drawFruit(b.t, b.x, b.y, b.r, b.rot, 1, b.landed && b.y - b.r < ly);
  }
  // A soft disc shows the fruit's real size, so what you see is exactly what touches the line
  function drawFruit(t, x, y, r, rot, a, warn) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y);
    if (t === MAGIC) {
      ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 10 + 6 * Math.sin(performance.now() / 150);
    } else {
      const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      g.addColorStop(0, COLORS[t] + '55'); g.addColorStop(1, COLORS[t] + '22');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    }
    if (warn) { ctx.strokeStyle = '#ff5a78'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.rotate(rot);
    const sp = sprites[t], k = (t === MAGIC ? 2 : 1.9) * r / sp.size;
    ctx.drawImage(sp.c, -sp.cx * k, -sp.cy * k, 160 * k, 160 * k);
    ctx.restore();
  }

  // ---------- loop ----------
  function loop(now) {
    if (nav.current !== 'merge' || document.hidden || sideways.matches) { running = false; return; }
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    acc += dt;
    const h = 1 / 240;
    while (acc >= h) { step(h); acc -= h; }
    // game over once a fruit that has landed on the pile pokes above the line for long enough.
    // The timer drains instead of resetting, so a wobbly pile can't dodge it forever.
    const line = LINE_Y();
    const high = !over && bodies.some(b => b.landed && b.y - b.r < line);
    danger = high ? danger + dt : Math.max(0, danger - dt * 1.5);
    if (danger >= LOSE_AFTER) gameOver();
    draw(now);
    if (Math.random() < 0.02) save();
    requestAnimationFrame(loop);
  }
  function start() {
    resize();
    acc = 0;
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
  sideways.addEventListener('change', () => { if (!sideways.matches && nav.current === 'merge') start(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && nav.current === 'merge') start(); else save(); });
})();
