// Fruit Swap: swap neighbouring fruits to line up 3 or more. Reach the target score in the moves you have.
(() => {
  const N = 8;
  const FRUITS = ['🍓', '🍋', '🍇', '🍊', '🍏', '🫐'];
  const boardEl = $('#frBoard');
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

  function freshGrid(lv) {
    let g;
    do {
      g = [];
      for (let r = 0; r < N; r++) {
        g.push([]);
        for (let c = 0; c < N; c++) {
          let t;
          do { t = rand(kinds(lv)); }
          while ((c >= 2 && g[r][c - 1].t === t && g[r][c - 2].t === t) || (r >= 2 && g[r - 1][c].t === t && g[r - 2][c].t === t));
          g[r].push(mk(t));
        }
      }
      grid = g;
    } while (!hasMove());
    return g;
  }

  function startLevel(lv) {
    st = { level: lv, score: 0, moves: levelMoves(lv) };
    grid = freshGrid(lv);
    save(); fullRender();
  }
  const save = () => store.set('fruit', { ...st, grid: grid.map(row => row.map(x => [x.t, x.special || 0])) });

  // ----- rendering -----
  const cell = () => boardEl.clientWidth / N;

  function fullRender() {
    boardEl.innerHTML = '';
    tileEls.clear();
    boardEl.style.setProperty('--cell', cell() + 'px');
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) ensureTile(grid[r][c], r, c);
    updateHud();
  }

  function ensureTile(tile, r, c, fromRow) {
    let el = tileEls.get(tile.id);
    const s = cell();
    if (!el) {
      el = document.createElement('div');
      el.className = 'fr-tile';
      el.innerHTML = `<span>${FRUITS[tile.t]}</span>`;
      el.style.width = el.style.height = s + 'px';
      el.style.transition = 'none';
      el.style.transform = `translate(${c * s}px, ${(fromRow ?? r) * s}px)`;
      boardEl.appendChild(el);
      tileEls.set(tile.id, el);
      void el.offsetWidth;
      el.style.transition = '';
    }
    el.classList.toggle('line', tile.special === 'h' || tile.special === 'v');
    el.classList.toggle('h', tile.special === 'h');
    el.classList.toggle('v', tile.special === 'v');
    el.classList.toggle('bomb', tile.special === 'b');
    el.style.transform = `translate(${c * s}px, ${r * s}px)`;
    return el;
  }

  function placeAll() {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (grid[r][c]) ensureTile(grid[r][c], r, c);
  }

  function updateHud() {
    $('#frLevel').textContent = st.level;
    $('#frScore').textContent = st.score;
    $('#frMoves').textContent = st.moves;
    const goal = levelGoal(st.level);
    $('#frGoalFill').style.width = Math.min(100, st.score / goal * 100) + '%';
    $('#frGoalText').textContent = `Goal ${goal}`;
  }

  // ----- matching -----
  function findMatches() {
    const runs = [];
    for (let r = 0; r < N; r++) {
      let c = 0;
      while (c < N) {
        let e = c + 1;
        while (e < N && grid[r][e].t === grid[r][c].t) e++;
        if (e - c >= 3) runs.push({ dir: 'h', cells: Array.from({ length: e - c }, (_, k) => [r, c + k]) });
        c = e;
      }
    }
    for (let c = 0; c < N; c++) {
      let r = 0;
      while (r < N) {
        let e = r + 1;
        while (e < N && grid[e][c].t === grid[r][c].t) e++;
        if (e - r >= 3) runs.push({ dir: 'v', cells: Array.from({ length: e - r }, (_, k) => [r + k, c]) });
        r = e;
      }
    }
    return runs;
  }

  function hasMove() {
    const sw = (a, b) => { const t = grid[a[0]][a[1]]; grid[a[0]][a[1]] = grid[b[0]][b[1]]; grid[b[0]][b[1]] = t; };
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const r2 = r + dr, c2 = c + dc;
        if (r2 >= N || c2 >= N) continue;
        sw([r, c], [r2, c2]);
        const ok = findMatches().length > 0;
        sw([r, c], [r2, c2]);
        if (ok) return true;
      }
    }
    return false;
  }

  function floatScore(pts, r, c) {
    const s = cell();
    const el = document.createElement('div');
    el.className = 'fr-pop';
    el.textContent = '+' + pts;
    el.style.left = (c + 0.5) * s + 'px';
    el.style.top = (r + 0.5) * s + 'px';
    boardEl.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  // Resolve matches, gravity and refills until the board settles
  async function resolve(swapped) {
    let chain = 0;
    while (true) {
      const runs = findMatches();
      if (!runs.length) break;
      chain++;
      const clear = new Set();
      const keep = new Map(); // key -> special to create
      for (const run of runs) {
        run.cells.forEach(([r, c]) => clear.add(r * N + c));
        if (run.cells.length >= 4) {
          // put the special where the player swapped, if it's in this run
          const at = run.cells.find(([r, c]) => swapped?.some(([sr, sc]) => sr === r && sc === c)) || run.cells[Math.floor(run.cells.length / 2)];
          keep.set(at[0] * N + at[1], run.cells.length >= 5 ? 'b' : (run.dir === 'h' ? 'v' : 'h'));
        }
      }
      // crossing runs (L/T shapes) make a bomb
      const counts = {};
      runs.forEach(run => run.cells.forEach(([r, c]) => { counts[r * N + c] = (counts[r * N + c] || 0) + 1; }));
      Object.entries(counts).forEach(([k, n]) => { if (n > 1) keep.set(+k, 'b'); });

      // specials caught in the blast fire off
      const queue = [...clear];
      const fired = new Set();
      while (queue.length) {
        const k = queue.pop();
        const r = Math.floor(k / N), c = k % N, t = grid[r][c];
        if (!t?.special || fired.has(k) || keep.has(k)) continue;
        fired.add(k);
        const add = (rr, cc) => { if (rr >= 0 && cc >= 0 && rr < N && cc < N) { const kk = rr * N + cc; if (!clear.has(kk)) { clear.add(kk); queue.push(kk); } } };
        if (t.special === 'h') for (let x = 0; x < N; x++) add(r, x);
        if (t.special === 'v') for (let x = 0; x < N; x++) add(x, c);
        if (t.special === 'b') for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) add(r + dr, c + dc);
      }

      const pts = clear.size * 10 * chain;
      st.score += pts;
      const first = runs[0].cells[Math.floor(runs[0].cells.length / 2)];
      floatScore(pts, first[0], first[1]);

      for (const k of clear) {
        const r = Math.floor(k / N), c = k % N;
        if (keep.has(k)) continue;
        tileEls.get(grid[r][c].id)?.classList.add('pop');
      }
      updateHud();
      await sleep(220);
      for (const k of clear) {
        const r = Math.floor(k / N), c = k % N;
        if (keep.has(k)) { grid[r][c].special = keep.get(k); continue; }
        const el = tileEls.get(grid[r][c].id);
        el?.remove();
        tileEls.delete(grid[r][c].id);
        grid[r][c] = null;
      }
      // gravity + refill
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
      await sleep(260);
      swapped = null;
    }
    return chain;
  }

  async function trySwap(a, b) {
    if (busy || st.moves <= 0) return;
    busy = true;
    clearSel();
    const [r1, c1] = a, [r2, c2] = b;
    [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
    placeAll();
    await sleep(230);
    if (!findMatches().length) {
      [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
      placeAll();
      await sleep(230);
      busy = false;
      return;
    }
    st.moves--;
    updateHud();
    await resolve([a, b]);
    if (!hasMove()) {
      toast('No moves left, shuffling');
      await sleep(500);
      reshuffle();
    }
    save();
    busy = false;
    checkEnd();
  }

  function reshuffle() {
    const tiles = grid.flat();
    do {
      shuffle(tiles);
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) grid[r][c] = tiles[r * N + c];
    } while (findMatches().length || !hasMove());
    placeAll();
  }

  function checkEnd() {
    const goal = levelGoal(st.level);
    if (st.score >= goal) {
      const next = st.level + 1;
      if (next > bestLevel) { bestLevel = next; store.set('fruitBest', bestLevel); }
      overlay.show(`<h2>Level ${st.level} done!</h2><p>${st.score} points with ${st.moves} move${st.moves === 1 ? '' : 's'} to spare.</p>
        <button class="big-btn" id="ovNext">Level ${next}</button>`, { '#ovNext': () => startLevel(next) });
    } else if (st.moves <= 0) {
      overlay.show(`<h2>Out of moves</h2><p>${st.score} of ${goal}. So close, try again!</p>
        <button class="big-btn" id="ovRetry">Try again</button>`, { '#ovRetry': () => startLevel(st.level) });
    }
  }

  // ----- input: swipe or tap-tap -----
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
    const p = cellAt(e);
    if (!p) return;
    touch = { p, x: e.clientX, y: e.clientY, id: e.pointerId };
  });
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
    if (!same) { sel = p; tileEls.get(grid[p[0]][p[1]].id)?.classList.add('sel'); }
  });

  $('#frRestart').onclick = () => overlay.show(`<h2>Restart level ${st.level}?</h2><p>Your score for this level resets.</p>
    <button class="big-btn" id="ovYes">Restart</button><button class="big-btn alt" id="ovNo">Keep playing</button>`,
    { '#ovYes': () => startLevel(st.level), '#ovNo': () => {} });

  // restore saved game
  if (st && st.grid) {
    grid = st.grid.map(row => row.map(([t, sp]) => mk(t, sp || undefined)));
    delete st.grid;
  } else {
    st = { level: 1, score: 0, moves: levelMoves(1) };
    grid = freshGrid(1);
  }

  screens.fruit = {
    onShow() { fullRender(); checkEnd(); },
    meta: () => bestLevel > 1 ? `Level ${bestLevel}` : 'Match 3 fruits',
  };
  window.addEventListener('resize', () => { if (nav.current === 'fruit') fullRender(); });
})();
