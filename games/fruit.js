// Fruit Swap: swap neighbouring fruits to line up 3 or more. Reach the target score in the moves you have.
// Match 4 → striped fruit (clears a line), L/T shape → royal bomb (clears around it), match 5 → crown jewel (clears a whole colour).
(() => {
  const N = 8;
  const FRUITS = ['🍓', '🍋', '🍇', '🍊', '🍏', '🫐'];
  const COLORS = ['#ff4d7a', '#ffe14d', '#b77bff', '#ffa53d', '#7ee36b', '#6b9bff'];
  const JEWEL = -1; // crown jewel tiles have no colour of their own
  const boardEl = $('#frBoard'), stage = $('.fr-stage');
  let st = store.get('fruit', null);
  let bestLevel = store.get('fruitBest', 1);
  let busy = false;
  let nextId = 1;
  let grid; // grid[r][c] = { id, t, special? }
  const tileEls = new Map();

  const levelGoal = lv => 600 + (lv - 1) * 350;
  const levelMoves = lv => Math.max(14, 22 - Math.floor((lv - 1) / 3));
  const kinds = lv => (lv < 3 ? 5 : 6);
  const mk = (t, special) => ({ id: nextId++, t, special });

  // ---------- sound (off by default; plane-friendly) ----------
  const sound = {
    on: store.get('fruitSound', false),
    ctx: null,
    init() {
      try { this.ctx ||= new (window.AudioContext || window.webkitAudioContext)(); this.ctx.resume(); } catch {}
    },
    note(freq, delay = 0, dur = 0.28, type = 'triangle', vol = 0.12) {
      if (!this.on || !this.ctx) return;
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime + delay;
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination);
      o.start(t); o.stop(t + dur + 0.05);
    },
    scale: [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28],
    pitch(i) { return 523.25 * Math.pow(2, this.scale[Math.min(i, this.scale.length - 1)] / 12); },
    match(chain) { this.note(this.pitch(chain + 1)); this.note(this.pitch(chain + 3), 0.05, 0.35, 'sine', 0.07); },
    special() { [0, 2, 4, 6].forEach((n, i) => this.note(this.pitch(n + 2), i * 0.05, 0.3, 'sine', 0.08)); },
    win() { [0, 2, 4, 5, 7, 9, 11].forEach((n, i) => this.note(this.pitch(n), i * 0.09, 0.5, 'triangle', 0.1)); },
  };
  const soundBtn = $('#frSound');
  const paintSound = () => soundBtn.textContent = sound.on ? '🔊' : '🔇';
  soundBtn.onclick = () => { sound.on = !sound.on; store.set('fruitSound', sound.on); if (sound.on) { sound.init(); sound.match(1); } paintSound(); };
  paintSound();

  // ---------- board setup ----------
  function freshGrid(lv) {
    do {
      grid = [];
      for (let r = 0; r < N; r++) {
        grid.push([]);
        for (let c = 0; c < N; c++) {
          let t;
          do { t = rand(kinds(lv)); }
          while ((c >= 2 && grid[r][c - 1].t === t && grid[r][c - 2].t === t) || (r >= 2 && grid[r - 1][c].t === t && grid[r - 2][c].t === t));
          grid[r].push(mk(t));
        }
      }
    } while (!findMove());
  }

  function startLevel(lv) {
    st = { level: lv, score: 0, moves: levelMoves(lv) };
    freshGrid(lv);
    shownScore = 0;
    save(); fullRender();
    combo(`Level ${lv}`, 'small');
  }
  const save = () => store.set('fruit', { ...st, grid: grid.map(row => row.map(x => [x.t, x.special || 0])) });

  // ---------- rendering ----------
  const cell = () => boardEl.clientWidth / N;
  const center = (r, c) => {
    const b = boardEl.getBoundingClientRect(), s = b.width / N;
    return { x: b.left + (c + 0.5) * s, y: b.top + (r + 0.5) * s };
  };

  function fullRender() {
    boardEl.innerHTML = '<div class="fr-cells">' + '<i></i>'.repeat(N * N) + '</div>';
    tileEls.clear();
    boardEl.style.setProperty('--cell', cell() + 'px');
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) ensureTile(grid[r][c], r, c);
    updateHud(true);
  }

  function paintTile(el, tile) {
    const span = el.querySelector('span');
    span.textContent = tile.t === JEWEL ? '💎' : FRUITS[tile.t];
    el.style.setProperty('--c', tile.t === JEWEL ? '#ffffff' : COLORS[tile.t]);
    el.classList.toggle('line', tile.special === 'h' || tile.special === 'v');
    el.classList.toggle('h', tile.special === 'h');
    el.classList.toggle('v', tile.special === 'v');
    el.classList.toggle('bomb', tile.special === 'b');
    el.classList.toggle('jewel', tile.special === 'c');
  }

  function ensureTile(tile, r, c, fromRow) {
    let el = tileEls.get(tile.id);
    const s = cell();
    if (!el) {
      el = document.createElement('div');
      el.className = 'fr-tile';
      el.innerHTML = '<div class="fr-gem"><span></span></div>';
      el.style.width = el.style.height = s + 'px';
      el.style.transition = 'none';
      el.style.transform = `translate(${c * s}px, ${(fromRow ?? r) * s}px)`;
      boardEl.appendChild(el);
      tileEls.set(tile.id, el);
      void el.offsetWidth;
      el.style.transition = '';
    }
    paintTile(el, tile);
    el.style.transform = `translate(${c * s}px, ${r * s}px)`;
    return el;
  }

  function placeAll() {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (grid[r][c]) ensureTile(grid[r][c], r, c);
  }

  // Score counts up smoothly
  let shownScore = 0, scoreAnim = 0;
  function updateHud(instant) {
    $('#frLevel').textContent = st.level;
    $('#frMoves').textContent = st.moves;
    $('#frMoves').classList.toggle('low', st.moves <= 3);
    const goal = levelGoal(st.level);
    const pct = Math.min(100, st.score / goal * 100);
    $('#frGoalFill').style.width = pct + '%';
    $('#frGoalFill').classList.toggle('full', pct >= 100);
    $('#frGoalText').textContent = `${Math.min(st.score, goal)} / ${goal}`;
    cancelAnimationFrame(scoreAnim);
    if (instant) { shownScore = st.score; $('#frScore').textContent = st.score; return; }
    const from = shownScore, to = st.score, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 500);
      shownScore = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      $('#frScore').textContent = shownScore;
      if (k < 1) scoreAnim = requestAnimationFrame(step);
    };
    scoreAnim = requestAnimationFrame(step);
    const sc = $('#frScore');
    sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump');
  }

  // Big golden words over the board
  function combo(text, size = '') {
    const el = document.createElement('div');
    el.className = 'fr-combo ' + size;
    el.innerHTML = (size === 'big' || size === 'huge' ? '<i class="fr-rays"></i>' : '') + `<b>${text}</b>`;
    stage.appendChild(el);
    setTimeout(() => el.remove(), 1500);
    if (size !== 'small') {
      const b = el.getBoundingClientRect();
      fx.glitter(b.left + b.width / 2, b.top + b.height / 2, size === 'huge' ? 40 : 20, undefined, size === 'huge' ? 9 : 6);
      fx.sparkle(b.left + b.width / 2, b.top + b.height / 2, '#ffd166', size === 'huge' ? 20 : 10, 7);
    }
  }

  function floatScore(pts, r, c) {
    const s = cell();
    const el = document.createElement('div');
    el.className = 'fr-pop';
    el.textContent = '+' + pts;
    el.style.left = (c + 0.5) * s + 'px';
    el.style.top = (r + 0.5) * s + 'px';
    boardEl.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  function shake(strong) {
    stage.classList.remove('shake', 'shake-big'); void stage.offsetWidth;
    stage.classList.add(strong ? 'shake-big' : 'shake');
  }

  function glow(color) {
    stage.style.setProperty('--glow', color);
    stage.classList.remove('glow'); void stage.offsetWidth; stage.classList.add('glow');
  }

  // Ambient sparkle: gems catch the light now and then
  setInterval(() => {
    if (nav.current !== 'fruit' || busy || document.hidden) return;
    for (let i = 0; i < 2; i++) {
      const r = rand(N), c = rand(N);
      const el = tileEls.get(grid[r]?.[c]?.id);
      if (!el) continue;
      el.classList.remove('glint'); void el.offsetWidth; el.classList.add('glint');
      if (Math.random() < 0.6) { const p = center(r, c); fx.sparkle(p.x + (Math.random() - 0.5) * 14, p.y - 10, '#ffffff', 1, 0.5); }
    }
  }, 700);

  // ---------- matching ----------
  function findMatches() {
    const runs = [];
    const same = (a, b) => a.t !== JEWEL && a.t === b.t;
    for (let r = 0; r < N; r++) {
      let c = 0;
      while (c < N) {
        let e = c + 1;
        while (e < N && same(grid[r][c], grid[r][e])) e++;
        if (e - c >= 3) runs.push({ dir: 'h', cells: Array.from({ length: e - c }, (_, k) => [r, c + k]) });
        c = e;
      }
    }
    for (let c = 0; c < N; c++) {
      let r = 0;
      while (r < N) {
        let e = r + 1;
        while (e < N && same(grid[r][c], grid[e][c])) e++;
        if (e - r >= 3) runs.push({ dir: 'v', cells: Array.from({ length: e - r }, (_, k) => [r + k, c]) });
        r = e;
      }
    }
    return runs;
  }

  function findMove() {
    const sw = (a, b) => { const t = grid[a[0]][a[1]]; grid[a[0]][a[1]] = grid[b[0]][b[1]]; grid[b[0]][b[1]] = t; };
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const r2 = r + dr, c2 = c + dc;
        if (r2 >= N || c2 >= N) continue;
        if (grid[r][c].special === 'c' || grid[r2][c2].special === 'c') return [[r, c], [r2, c2]];
        sw([r, c], [r2, c2]);
        const ok = findMatches().length > 0;
        sw([r, c], [r2, c2]);
        if (ok) return [[r, c], [r2, c2]];
      }
    }
    return null;
  }

  // Clear a set of cells: fire any specials caught inside, sparkle, score, then drop and refill
  async function clearCells(clear, keep, chain) {
    const queue = [...clear];
    const fired = [];
    while (queue.length) {
      const k = queue.pop();
      const r = Math.floor(k / N), c = k % N, t = grid[r][c];
      if (!t?.special || keep.has(k) || fired.some(f => f.k === k)) continue;
      fired.push({ k, r, c, special: t.special, t: t.t });
      const add = (rr, cc) => {
        if (rr < 0 || cc < 0 || rr >= N || cc >= N) return;
        const kk = rr * N + cc;
        if (!clear.has(kk)) { clear.add(kk); queue.push(kk); }
      };
      if (t.special === 'h') for (let x = 0; x < N; x++) add(r, x);
      if (t.special === 'v') for (let x = 0; x < N; x++) add(x, c);
      if (t.special === 'b') for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) add(r + dr, c + dc);
      if (t.special === 'c') {
        const target = rand(kinds(st.level));
        for (let rr = 0; rr < N; rr++) for (let cc = 0; cc < N; cc++) if (grid[rr][cc].t === target) add(rr, cc);
      }
    }

    // effects
    const b = boardEl.getBoundingClientRect(), s = b.width / N;
    for (const f of fired) {
      const p = center(f.r, f.c);
      const col = COLORS[f.t] || '#ffffff';
      if (f.special === 'h' || f.special === 'v') {
        const hz = f.special === 'h';
        fx.beam(hz ? { left: b.left - 40, right: b.right + 40, y: p.y, w: s * 0.6 } : { top: b.top - 40, bottom: b.bottom + 40, x: p.x, w: s * 0.6 }, hz, col);
        fx.beam(hz ? { left: b.left - 40, right: b.right + 40, y: p.y, w: s * 0.2 } : { top: b.top - 40, bottom: b.bottom + 40, x: p.x, w: s * 0.2 }, hz, '#ffffff');
        if (hz) { fx.bolt(p.x, p.y, b.left, p.y, col); fx.bolt(p.x, p.y, b.right, p.y, col); }
        else { fx.bolt(p.x, p.y, p.x, b.top, col); fx.bolt(p.x, p.y, p.x, b.bottom, col); }
        fx.flash(col, 0.35);
      }
      if (f.special === 'b') {
        fx.flash('#ffd166', 0.6);
        fx.explode(p.x, p.y, '#ffd166', 3.5);
        fx.ring(p.x, p.y, '#ffd166', s * 3, 10, 700); fx.ring(p.x, p.y, '#ff8fc7', s * 2, 6, 550); fx.ring(p.x, p.y, '#ffffff', s * 4, 3, 900);
        fx.emojiBurst(p.x, p.y, ['💥', '✨', '⭐', '💖'], 12);
      }
      if (f.special === 'c') {
        fx.flash('#ffffff', 0.7);
        fx.ring(p.x, p.y, '#ffffff', s * 5, 8, 900);
        for (const k of clear) { const q = center(Math.floor(k / N), k % N); fx.bolt(p.x, p.y, q.x, q.y, col); }
      }
    }
    for (const k of clear) {
      if (keep.has(k)) continue;
      const r = Math.floor(k / N), c = k % N;
      const p = center(r, c);
      const col = COLORS[grid[r][c].t] || '#ffffff';
      fx.explode(p.x, p.y, col, Math.min(2.4, 0.9 + chain * 0.35 + (fired.length ? 0.4 : 0)));
      tileEls.get(grid[r][c].id)?.classList.add('pop');
    }
    shake(fired.some(f => f.special === 'b' || f.special === 'c') || chain >= 3);
    glow(COLORS[grid[Math.floor([...clear][0] / N)][[...clear][0] % N].t] || '#ffd166');

    const pts = clear.size * 10 * chain + fired.length * 60;
    st.score += pts;
    haptic();
    sound.match(chain);
    if (fired.length) sound.special();
    updateHud();
    await sleep(240);

    for (const k of clear) {
      const r = Math.floor(k / N), c = k % N;
      if (keep.has(k)) {
        const sp = keep.get(k);
        grid[r][c].special = sp;
        if (sp === 'c') grid[r][c].t = JEWEL;
        const el = tileEls.get(grid[r][c].id);
        paintTile(el, grid[r][c]);
        el.classList.remove('born'); void el.offsetWidth; el.classList.add('born');
        const p = center(r, c);
        fx.ring(p.x, p.y, '#ffd166', s, 4, 500);
        fx.sparkle(p.x, p.y, '#ffd166', 12, 5);
        continue;
      }
      const el = tileEls.get(grid[r][c].id);
      el?.remove();
      tileEls.delete(grid[r][c].id);
      grid[r][c] = null;
    }

    // gravity + refill from above
    for (let c = 0; c < N; c++) {
      let write = N - 1;
      for (let r = N - 1; r >= 0; r--) {
        if (grid[r][c]) { const t = grid[r][c]; grid[r][c] = null; grid[write][c] = t; write--; }
      }
      let spawn = -1;
      for (let r = write; r >= 0; r--) {
        const t = mk(rand(kinds(st.level)));
        grid[r][c] = t;
        ensureTile(t, r, c, spawn--);
      }
    }
    await sleep(16);
    placeAll();
    await sleep(300);
    return { pts, fired };
  }

  const PRAISE = ['', '', 'Sweet!', 'Gorgeous!', 'Stunning!', 'Iconic!', 'Yas Queen! 👑', 'Royalty! 👑', 'Legendary! 👑'];

  async function resolve(swapped) {
    let chain = 0;
    while (true) {
      const runs = findMatches();
      if (!runs.length) break;
      chain++;
      const clear = new Set();
      const keep = new Map(); // cell -> special to create there
      for (const run of runs) {
        run.cells.forEach(([r, c]) => clear.add(r * N + c));
        if (run.cells.length >= 4) {
          const at = run.cells.find(([r, c]) => swapped?.some(([sr, sc]) => sr === r && sc === c)) || run.cells[Math.floor(run.cells.length / 2)];
          keep.set(at[0] * N + at[1], run.cells.length >= 5 ? 'c' : (run.dir === 'h' ? 'v' : 'h'));
        }
      }
      // crossing runs (L or T shapes) make a royal bomb
      const counts = {};
      runs.forEach(run => run.cells.forEach(([r, c]) => { counts[r * N + c] = (counts[r * N + c] || 0) + 1; }));
      Object.entries(counts).forEach(([k, n]) => { if (n > 1 && keep.get(+k) !== 'c') keep.set(+k, 'b'); });

      const made = [...keep.values()];
      const mid = runs[0].cells[Math.floor(runs[0].cells.length / 2)];
      const { pts, fired } = await clearCells(clear, keep, chain);
      floatScore(pts, mid[0], mid[1]);

      if (made.includes('c')) combo('Crown Jewel! 💎', 'big');
      else if (made.includes('b')) combo('Royal Bomb! 💣', 'big');
      else if (chain >= 2) combo(PRAISE[Math.min(chain, PRAISE.length - 1)], chain >= 5 ? 'huge' : 'big');
      else if (made.length) combo('Striped! ✨');
      else if (fired.length >= 2 || clear.size >= 12) combo('Slay! 💅', 'big');
      if (chain >= 2) fx.flash('#ffd166', Math.min(0.6, 0.15 * chain));
      if (window.uni?.on) { const b = boardEl.getBoundingClientRect(); uni.phrase(b.left + b.width / 2, b.top + b.height * 0.75); if (chain >= 2) uni.runner(b.top + b.height / 2); }
      if (chain >= 3) fx.fireworks(Math.min(10, chain * 2), 900);
      if (chain >= 4) fx.emojiRain(['👑', '💎', '✨', '💖', '⭐'], 12 + chain * 4);
      if (made.includes('c')) { fx.emojiRain(['💎', '👑', '✨'], 30); fx.fireworks(4, 600); }
      swapped = null;
    }
    return chain;
  }

  async function jewelBlast(jewelPos, otherPos) {
    const [jr, jc] = jewelPos, [or, oc] = otherPos;
    const other = grid[or][oc];
    const clear = new Set([jr * N + jc]);
    const target = other.special === 'c' ? null : other.t;
    const p0 = center(jr, jc);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (target === null || grid[r][c].t === target) {
        clear.add(r * N + c);
        const p = center(r, c);
        const delay = Math.hypot(p.x - p0.x, p.y - p0.y) * 0.8;
        setTimeout(() => { fx.bolt(p0.x, p0.y, p.x, p.y, COLORS[target ?? rand(6)]); fx.explode(p.x, p.y, COLORS[grid[r]?.[c]?.t] || '#fff', 1.6); }, delay);
      }
    }
    grid[jr][jc].special = null; // the jewel itself is used up
    fx.ring(p0.x, p0.y, '#ffffff', cell() * 5, 8, 800);
    combo(target === null ? 'Double Jewel! 👑💎' : 'Crown Jewel! 💎', 'huge');
    fx.flash('#ffffff', 0.7);
    fx.emojiRain(['💎', '👑', '✨', '💖'], 36);
    fx.fireworks(6, 1000);
    shake(true);
    await sleep(250);
    await clearCells(clear, new Map(), 2);
  }

  async function trySwap(a, b) {
    if (busy || st.moves <= 0) return;
    busy = true;
    clearHint();
    clearSel();
    const [r1, c1] = a, [r2, c2] = b;
    const jewel = grid[r1][c1].special === 'c' ? a : grid[r2][c2].special === 'c' ? b : null;
    [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
    placeAll();
    await sleep(240);
    if (jewel) {
      const jPos = jewel === a ? b : a; // it moved
      const oPos = jewel === a ? a : b;
      st.moves--;
      updateHud();
      await jewelBlast(jPos, oPos);
      await resolve(null);
    } else {
      if (!findMatches().length) {
        [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
        placeAll();
        tileEls.get(grid[r1][c1].id)?.classList.add('nope');
        tileEls.get(grid[r2][c2].id)?.classList.add('nope');
        await sleep(300);
        tileEls.get(grid[r1][c1].id)?.classList.remove('nope');
        tileEls.get(grid[r2][c2].id)?.classList.remove('nope');
        busy = false;
        armHint();
        return;
      }
      st.moves--;
      updateHud();
      await resolve([a, b]);
    }
    if (!findMove()) {
      toast('No moves left, shuffling');
      await sleep(500);
      reshuffle();
    }
    save();
    await checkEnd();
    busy = false;
    armHint();
  }

  function reshuffle() {
    const tiles = grid.flat();
    do {
      shuffle(tiles);
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) grid[r][c] = tiles[r * N + c];
    } while (findMatches().length || !findMove());
    placeAll();
  }

  // Leftover moves become striped fruits that go off one after another
  async function royalFinale() {
    combo('Royal Finale! ✨', 'huge');
    fx.flash('#ffd166', 0.5);
    fx.emojiRain(['👑', '✨', '💎'], 24);
    await sleep(700);
    let n = 0;
    while (st.moves > 0 && n < 10) {
      st.moves--; n++;
      let r, c;
      do { r = rand(N); c = rand(N); } while (grid[r][c].t === JEWEL);
      grid[r][c].special = Math.random() < 0.5 ? 'h' : 'v';
      const el = tileEls.get(grid[r][c].id);
      paintTile(el, grid[r][c]);
      const p = center(r, c);
      fx.sparkle(p.x, p.y, '#ffd166', 10, 5);
      updateHud();
      await sleep(160);
      await clearCells(new Set([r * N + c]), new Map(), 1);
      await resolve(null);
    }
    if (st.moves > 0) { st.score += st.moves * 100; st.moves = 0; updateHud(); }
  }

  async function checkEnd() {
    const goal = levelGoal(st.level);
    if (st.score >= goal) {
      if (st.moves > 0) await royalFinale();
      const next = st.level + 1;
      if (next > bestLevel) { bestLevel = next; store.set('fruitBest', bestLevel); }
      const stars = st.score >= goal * 2 ? 3 : st.score >= goal * 1.4 ? 2 : 1;
      const title = ['', 'Royal in training', 'Fruit Princess', 'Queen of the Orchard'][stars];
      save();
      sound.win();
      fx.flash('#ffd166', 0.7);
      fx.confetti(220);
      fx.fireworks(12, 3200);
      fx.emojiRain(['👑', '💎', '✨', '💖', '🍓', '⭐'], 50);
      fx.celebrate();
      await sleep(400);
      overlay.show(`<div class="crown-big">👑</div><h2>Level ${st.level} complete!</h2>
        <div class="stars">${[1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</span>`).join('')}</div>
        <div class="royal-title">${title}</div>
        <p>${st.score} points</p>
        ${window.tia?.ready ? '<p style="color:#ff9fc8">🎟️ Check For Tia for new coupons</p>' : ''}
        <button class="big-btn royal" id="ovNext">Level ${next} →</button>`, { '#ovNext': () => startLevel(next) });
      if (window.tia?.heartAvailable('fruit')) setTimeout(() => tia.findHeart('fruit'), 1500);
      st = { ...st, done: true };
    } else if (st.moves <= 0) {
      overlay.show(`<h2>Out of moves</h2><p>${st.score} of ${goal}. So close, try again!</p>
        <button class="big-btn royal" id="ovRetry">Try again</button>`, { '#ovRetry': () => startLevel(st.level) });
    }
  }

  // ---------- hints: wiggle a possible move after a quiet moment ----------
  let hintTimer, hinted = [];
  function clearHint() {
    clearTimeout(hintTimer);
    hinted.forEach(el => el.classList.remove('hint'));
    hinted = [];
  }
  function armHint() {
    clearHint();
    hintTimer = setTimeout(() => {
      if (busy || nav.current !== 'fruit') return;
      const m = findMove();
      if (!m) return;
      hinted = m.map(([r, c]) => tileEls.get(grid[r][c].id)).filter(Boolean);
      hinted.forEach(el => el.classList.add('hint'));
    }, 7000);
  }

  // ---------- input: swipe or tap-tap ----------
  let sel = null, touch = null;
  const cellAt = e => {
    const b = boardEl.getBoundingClientRect(), s = b.width / N;
    const c = Math.floor((e.clientX - b.left) / s), r = Math.floor((e.clientY - b.top) / s);
    return r >= 0 && c >= 0 && r < N && c < N ? [r, c] : null;
  };
  const clearSel = () => { if (sel) tileEls.get(grid[sel[0]][sel[1]]?.id)?.classList.remove('sel'); sel = null; };
  const adjacent = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;

  boardEl.addEventListener('pointerdown', e => {
    if (busy) return;
    if (sound.on) sound.init();
    const p = cellAt(e);
    if (!p) return;
    clearHint();
    touch = { p, x: e.clientX, y: e.clientY, id: e.pointerId };
  });
  boardEl.addEventListener('pointermove', e => { if (!window.uni?.on && (e.buttons || e.pointerType === 'touch')) fx.trail(e.clientX, e.clientY); });
  window.addEventListener('pointermove', e => {
    if (!touch || e.pointerId !== touch.id) return;
    const dx = e.clientX - touch.x, dy = e.clientY - touch.y;
    const s = boardEl.clientWidth / N;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > s * 0.35) {
      const [r, c] = touch.p;
      const to = Math.abs(dx) > Math.abs(dy) ? [r, c + Math.sign(dx)] : [r + Math.sign(dy), c];
      touch = null;
      if (to[0] >= 0 && to[1] >= 0 && to[0] < N && to[1] < N) trySwap([r, c], to);
    }
  });
  window.addEventListener('pointerup', e => {
    if (!touch || e.pointerId !== touch.id) return;
    const p = touch.p;
    touch = null;
    if (sel && adjacent(sel, p)) { const a = sel; clearSel(); trySwap(a, p); return; }
    const same = sel && sel[0] === p[0] && sel[1] === p[1];
    clearSel();
    if (!same) {
      sel = p; tileEls.get(grid[p[0]][p[1]].id)?.classList.add('sel');
      const q = center(p[0], p[1]); fx.sparkle(q.x, q.y, COLORS[grid[p[0]][p[1]].t] || '#fff', 6, 2.5);
    }
    armHint();
  });

  $('#frRestart').onclick = () => overlay.show(`<h2>Restart level ${st.level}?</h2><p>Your score for this level resets.</p>
    <button class="big-btn royal" id="ovYes">Restart</button><button class="big-btn alt" id="ovNo">Keep playing</button>`,
    { '#ovYes': () => startLevel(st.level), '#ovNo': () => {} });

  // restore saved game
  if (st && st.grid) {
    grid = st.grid.map(row => row.map(([t, sp]) => mk(t, sp || undefined)));
    delete st.grid;
    if (st.done) { st = null; }
  } else st = null;
  if (!st) { st = { level: bestLevel, score: 0, moves: levelMoves(bestLevel) }; freshGrid(bestLevel); }

  screens.fruit = {
    onShow() { fullRender(); if (!busy) checkEnd(); armHint(); },
    meta: () => bestLevel > 1 ? `Level ${bestLevel}` : 'Match 3 fruits',
  };
  window.addEventListener('resize', () => { if (nav.current === 'fruit') fullRender(); });
})();
