// Block Drop: drag shapes onto an 8×8 grid, fill rows or columns to clear them
(() => {
  const N = 8;
  const boardEl = $('#blBoard'), trayEl = $('#blTray');
  const COLORS = ['#f2994a', '#56ccf2', '#bb6bd9', '#6fcf97', '#eb5757', '#f2c94c', '#5b8def'];

  // ----- shapes -----
  const BASE = [
    { w: 3, cells: [[0, 0]] },
    { w: 5, cells: [[0, 0], [0, 1]] },
    { w: 5, cells: [[0, 0], [0, 1], [0, 2]] },
    { w: 3, cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
    { w: 2, cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
    { w: 5, cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
    { w: 1, cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]] },
    { w: 2, cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]] },
    { w: 5, cells: [[0, 0], [1, 0], [1, 1]] },
    { w: 3, cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
    { w: 3, cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
    { w: 2, cells: [[0, 1], [0, 2], [1, 0], [1, 1]] },
    { w: 2, cells: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]] },
  ];
  const norm = cells => {
    const mr = Math.min(...cells.map(c => c[0])), mc = Math.min(...cells.map(c => c[1]));
    return cells.map(([r, c]) => [r - mr, c - mc]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  };
  const SHAPES = [];
  for (const b of BASE) {
    const seen = new Set();
    let v = b.cells;
    const variants = [];
    for (let m = 0; m < 2; m++) {
      for (let r = 0; r < 4; r++) {
        v = norm(v.map(([r0, c0]) => [c0, -r0]));
        const key = JSON.stringify(v);
        if (!seen.has(key)) { seen.add(key); variants.push(v); }
      }
      v = norm(v.map(([r0, c0]) => [r0, -c0]));
    }
    for (const cells of variants) SHAPES.push({ cells, w: b.w / variants.length });
  }
  const totalW = SHAPES.reduce((s, x) => s + x.w, 0);
  const randomShape = () => {
    let t = Math.random() * totalW;
    for (const s of SHAPES) { if ((t -= s.w) <= 0) return s.cells; }
    return SHAPES[0].cells;
  };

  // ----- state -----
  let st = store.get('blocks', null);
  let best = store.get('blocksBest', 0);
  let busy = false;

  const emptyBoard = () => Array.from({ length: N }, () => Array(N).fill(null));
  const fitsAt = (cells, r, c, board = st.board) => cells.every(([dr, dc]) => {
    const rr = r + dr, cc = c + dc;
    return rr >= 0 && cc >= 0 && rr < N && cc < N && !board[rr][cc];
  });
  const fitsAnywhere = cells => {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (fitsAt(cells, r, c)) return true;
    return false;
  };

  function newTray() {
    for (let tries = 0; tries < 30; tries++) {
      const tray = [0, 1, 2].map(() => ({ cells: randomShape(), color: pick(COLORS) }));
      if (tray.some(p => fitsAnywhere(p.cells))) return tray;
    }
    return [0, 1, 2].map(() => ({ cells: [[0, 0]], color: pick(COLORS) }));
  }

  function newGame() {
    st = { board: emptyBoard(), tray: null, score: 0, streak: 0 };
    st.tray = newTray();
    save(); render();
  }
  const save = () => store.set('blocks', st);

  // ----- rendering -----
  const cellEls = [];
  for (let i = 0; i < N * N; i++) {
    const d = document.createElement('div');
    d.className = 'bl-cell';
    boardEl.appendChild(d);
    cellEls.push(d);
  }

  function renderBoard(ghost) {
    const willClear = new Set();
    let board = st.board;
    if (ghost) {
      board = st.board.map(row => row.slice());
      ghost.cells.forEach(([dr, dc]) => board[ghost.r + dr][ghost.c + dc] = ghost.color);
      for (let r = 0; r < N; r++) if (board[r].every(Boolean)) for (let c = 0; c < N; c++) willClear.add(r * N + c);
      for (let c = 0; c < N; c++) if (board.every(row => row[c])) for (let r = 0; r < N; r++) willClear.add(r * N + c);
    }
    const ghostSet = new Set(ghost ? ghost.cells.map(([dr, dc]) => (ghost.r + dr) * N + ghost.c + dc) : []);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const i = r * N + c, el = cellEls[i];
      const col = board[r][c];
      el.style.background = col || '';
      el.className = 'bl-cell' + (col ? ' on' : '') + (ghostSet.has(i) ? ' ghost' : '') + (willClear.has(i) ? ' willclear' : '');
    }
  }

  const cellSize = () => {
    const w = boardEl.clientWidth - 12;
    return (w - 3 * (N - 1)) / N;
  };

  function pieceEl(p, size) {
    const h = Math.max(...p.cells.map(c => c[0])) + 1, w = Math.max(...p.cells.map(c => c[1])) + 1;
    const el = document.createElement('div');
    el.className = 'bl-piece';
    el.style.setProperty('--s', size + 'px');
    el.style.gridTemplateColumns = `repeat(${w}, ${size}px)`;
    el.style.gap = (size > 24 ? 3 : 2) + 'px';
    const set = new Set(p.cells.map(([r, c]) => r * 10 + c));
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
      const i = document.createElement('i');
      if (set.has(r * 10 + c)) i.style.background = p.color; else i.className = 'empty';
      el.appendChild(i);
    }
    return el;
  }

  function renderTray() {
    trayEl.innerHTML = '';
    const size = Math.min(22, cellSize() * 0.55);
    st.tray.forEach((p, idx) => {
      const slot = document.createElement('div');
      slot.className = 'bl-slot';
      if (p) {
        const el = pieceEl(p, size);
        if (!fitsAnywhere(p.cells)) el.classList.add('dead');
        slot.appendChild(el);
        slot.addEventListener('pointerdown', e => startDrag(e, idx, slot));
      }
      trayEl.appendChild(slot);
    });
  }

  function render() {
    renderBoard();
    renderTray();
    $('#blScore').textContent = st.score;
    $('#blBest').textContent = best;
  }

  // ----- dragging -----
  let drag = null;
  function startDrag(e, idx, slot) {
    if (busy || drag) return;
    e.preventDefault();
    const p = st.tray[idx];
    const size = cellSize();
    const el = pieceEl(p, size);
    el.classList.add('bl-drag');
    document.body.appendChild(el);
    slot.firstChild.style.opacity = '0';
    drag = { idx, p, el, slot, size, pos: null, id: e.pointerId };
    moveDrag(e);
  }

  function moveDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const { el, size, p } = drag;
    const w = el.offsetWidth, h = el.offsetHeight;
    const left = e.clientX - w / 2, top = e.clientY - h - 50;
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    const b = boardEl.getBoundingClientRect();
    const step = size + 3;
    const c = Math.round((left - b.left - 6) / step), r = Math.round((top - b.top - 6) / step);
    drag.pos = fitsAt(p.cells, r, c) ? { r, c } : null;
    renderBoard(drag.pos ? { ...drag.pos, cells: p.cells, color: p.color } : null);
  }

  async function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const { el, slot, pos, idx, p } = drag;
    el.remove();
    drag = null;
    if (!pos) { if (slot.firstChild) slot.firstChild.style.opacity = ''; renderBoard(); return; }
    await place(idx, p, pos);
  }

  window.addEventListener('pointermove', moveDrag);
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  async function place(idx, p, { r, c }) {
    busy = true;
    p.cells.forEach(([dr, dc]) => st.board[r + dr][c + dc] = p.color);
    st.tray[idx] = null;
    st.score += p.cells.length;

    const rows = [], cols = [];
    for (let i = 0; i < N; i++) {
      if (st.board[i].every(Boolean)) rows.push(i);
      if (st.board.every(row => row[i])) cols.push(i);
    }
    const lines = rows.length + cols.length;
    renderBoard();
    if (lines) {
      st.streak++;
      const pts = lines * 10 * lines * Math.min(st.streak, 5);
      st.score += pts;
      const clear = new Set();
      rows.forEach(rr => { for (let k = 0; k < N; k++) clear.add(rr * N + k); });
      cols.forEach(cc => { for (let k = 0; k < N; k++) clear.add(k * N + cc); });
      clear.forEach(i => cellEls[i].classList.add('clearing'));
      const pop = document.createElement('div');
      pop.className = 'bl-pop';
      const words = ['', 'Nice!', 'Great!', 'Amazing!', 'Incredible!'];
      pop.textContent = `${words[Math.min(lines, 4)]} +${pts}${st.streak > 1 ? ` · combo ×${Math.min(st.streak, 5)}` : ''}`;
      boardEl.appendChild(pop);
      setTimeout(() => pop.remove(), 900);
      await sleep(330);
      clear.forEach(i => { st.board[Math.floor(i / N)][i % N] = null; });
      cellEls.forEach(el => el.classList.remove('clearing'));
    } else {
      st.streak = 0;
    }

    if (st.tray.every(x => !x)) st.tray = newTray();
    if (st.score > best) { best = st.score; store.set('blocksBest', best); }
    save();
    render();
    busy = false;

    if (!st.tray.some(x => x && fitsAnywhere(x.cells))) {
      await sleep(500);
      overlay.show(`<h2>No more room</h2><p>Score <b style="color:var(--text)">${st.score}</b> · Best ${best}</p>
        <button class="big-btn" id="ovNew">Play again</button>`, { '#ovNew': newGame });
    }
  }

  $('#blRestart').onclick = () => overlay.show(`<h2>Start over?</h2><p>Your current score will be lost.</p>
    <button class="big-btn" id="ovYes">New game</button><button class="big-btn alt" id="ovNo">Keep playing</button>`,
    { '#ovYes': newGame, '#ovNo': () => {} });

  if (!st) newGame();
  screens.blocks = {
    onShow() {
      render();
      if (!st.tray.some(x => x && fitsAnywhere(x.cells))) newGame();
    },
    meta: () => best ? `Best ${best}` : 'Clear the lines',
  };
  window.addEventListener('resize', () => { if (nav.current === 'blocks') render(); });
})();
