// Sudoku: generated puzzles with a unique solution. Easy / Medium / Hard, notes, hints, undo.
(() => {
  const gridEl = $('#sdGrid'), padEl = $('#sdPad');
  const LEVELS = { Easy: 38, Medium: 31, Hard: 26 }; // how many numbers are given
  let st = store.get('sudoku', null);
  let stats = store.get('sudokuStats', { solved: 0 });
  let selIdx = -1, notesMode = false, history = [], timer;

  // ---------- generator ----------
  const rowOf = i => Math.floor(i / 9), colOf = i => i % 9, boxOf = i => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);
  const PEERS = Array.from({ length: 81 }, (_, i) => {
    const p = new Set();
    for (let j = 0; j < 81; j++) if (j !== i && (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i))) p.add(j);
    return [...p];
  });
  const canPlace = (g, i, n) => PEERS[i].every(j => g[j] !== n);

  function fill(g) {
    const i = g.indexOf(0);
    if (i < 0) return true;
    for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      if (canPlace(g, i, n)) { g[i] = n; if (fill(g)) return true; g[i] = 0; }
    }
    return false;
  }
  function countSolutions(g, limit = 2) {
    let best = -1, bestN = 10;
    for (let i = 0; i < 81; i++) if (!g[i]) {
      let n = 0;
      for (let v = 1; v <= 9; v++) if (canPlace(g, i, v)) n++;
      if (n < bestN) { best = i; bestN = n; if (!n) return 0; }
    }
    if (best < 0) return 1;
    let total = 0;
    for (let v = 1; v <= 9 && total < limit; v++) {
      if (canPlace(g, best, v)) { g[best] = v; total += countSolutions(g, limit - total); g[best] = 0; }
    }
    return total;
  }
  function generate(level) {
    const sol = Array(81).fill(0);
    fill(sol);
    const puz = sol.slice();
    let givens = 81;
    for (const i of shuffle([...Array(81).keys()])) {
      if (givens <= LEVELS[level]) break;
      const keep = puz[i];
      puz[i] = 0;
      if (countSolutions(puz.slice()) !== 1) puz[i] = keep; else givens--;
    }
    return { level, sol, given: puz.map(Boolean), vals: puz, notes: Array.from({ length: 81 }, () => []), mistakes: 0, time: 0, done: false };
  }

  function newGame(level) {
    st = generate(level);
    history = []; selIdx = -1;
    save(); render();
  }
  const save = () => store.set('sudoku', st);

  // ---------- rendering ----------
  function render() {
    const sv = selIdx >= 0 ? st.vals[selIdx] : 0;
    gridEl.innerHTML = st.vals.map((v, i) => {
      const cls = ['sd-c'];
      if (st.given[i]) cls.push('given');
      if (v && !st.given[i] && v !== st.sol[i]) cls.push('wrong');
      if (i === selIdx) cls.push('sel');
      else if (selIdx >= 0 && (rowOf(i) === rowOf(selIdx) || colOf(i) === colOf(selIdx) || boxOf(i) === boxOf(selIdx))) cls.push('peer');
      if (sv && v === sv && i !== selIdx) cls.push('same');
      if (colOf(i) % 3 === 2 && colOf(i) < 8) cls.push('sd-br');
      if (rowOf(i) % 3 === 2 && rowOf(i) < 8) cls.push('sd-bb');
      const inner = v ? v : `<span class="sd-notes">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<i>${st.notes[i].includes(n) ? n : ''}</i>`).join('')}</span>`;
      return `<button class="${cls.join(' ')}" data-i="${i}">${inner}</button>`;
    }).join('');
    const counts = Array(10).fill(0);
    st.vals.forEach((v, i) => { if (v && v === st.sol[i]) counts[v]++; });
    padEl.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-n="${n}" class="${counts[n] >= 9 ? 'done' : ''}">${n}<small>${9 - counts[n] || ''}</small></button>`).join('');
    $('#sdLevel').textContent = st.level;
    $('#sdMistakes').textContent = `Mistakes: ${st.mistakes}`;
    $('#sdNotesState').textContent = notesMode ? 'on' : 'off';
    $('#sdNotes').classList.toggle('on', notesMode);
    tick();
  }
  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  function tick() { $('#sdTime').textContent = fmt(st.time); }

  // ---------- input ----------
  gridEl.addEventListener('click', e => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    selIdx = +b.dataset.i;
    render();
  });
  padEl.addEventListener('click', e => {
    const b = e.target.closest('[data-n]');
    if (b) place(+b.dataset.n, b);
  });
  document.addEventListener('keydown', e => {
    if (nav.current !== 'sudoku') return;
    if (/^[1-9]$/.test(e.key)) place(+e.key);
    if (e.key === 'Backspace') erase();
  });

  function place(n, btn) {
    if (selIdx < 0 || st.given[selIdx] || st.done) return;
    const i = selIdx;
    history.push({ i, v: st.vals[i], notes: st.notes[i].slice() });
    if (notesMode && !st.vals[i]) {
      st.notes[i] = st.notes[i].includes(n) ? st.notes[i].filter(x => x !== n) : [...st.notes[i], n];
      save(); render(); return;
    }
    st.vals[i] = n;
    st.notes[i] = [];
    if (n !== st.sol[i]) {
      st.mistakes++;
      toast('Not quite');
    } else {
      PEERS[i].forEach(j => { st.notes[j] = st.notes[j].filter(x => x !== n); });
      haptic();
      celebrateUnits(i, btn);
    }
    save(); render();
    if (st.vals.every((v, k) => v === st.sol[k])) win();
  }

  // little bursts when a row, column or box is completed
  function celebrateUnits(i, btn) {
    const cells = el => { const b = el.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; };
    const units = [
      [...Array(81).keys()].filter(j => rowOf(j) === rowOf(i)),
      [...Array(81).keys()].filter(j => colOf(j) === colOf(i)),
      [...Array(81).keys()].filter(j => boxOf(j) === boxOf(i)),
    ];
    requestAnimationFrame(() => {
      const el = gridEl.children[i];
      if (el) { const [x, y] = cells(el); fx.sparkle(x, y, '#7cb4ff', 5, 2.5); if (window.uni?.on) uni.boom(x, y); }
      for (const u of units) {
        if (u.every(j => st.vals[j] === st.sol[j])) {
          u.forEach((j, k) => setTimeout(() => {
            const c = gridEl.children[j];
            if (!c) return;
            c.classList.add('flash');
            const [x, y] = cells(c); fx.sparkle(x, y, '#ffd166', 3, 2.5);
          }, k * 35));
          if (window.uni?.on) uni.phrase(innerWidth / 2, gridEl.getBoundingClientRect().top + 40);
        }
      }
    });
  }

  function erase() {
    if (selIdx < 0 || st.given[selIdx]) return;
    history.push({ i: selIdx, v: st.vals[selIdx], notes: st.notes[selIdx].slice() });
    st.vals[selIdx] = 0; st.notes[selIdx] = [];
    save(); render();
  }
  $('#sdErase').onclick = erase;
  $('#sdUndo').onclick = () => {
    const h = history.pop();
    if (!h) return;
    st.vals[h.i] = h.v; st.notes[h.i] = h.notes; selIdx = h.i;
    save(); render();
  };
  $('#sdNotes').onclick = () => { notesMode = !notesMode; render(); };
  $('#sdHint').onclick = () => {
    let i = selIdx >= 0 && st.vals[selIdx] !== st.sol[selIdx] ? selIdx : -1;
    if (i < 0) i = shuffle([...Array(81).keys()]).find(k => st.vals[k] !== st.sol[k]) ?? -1;
    if (i < 0) return;
    selIdx = i;
    const wasNotes = notesMode; notesMode = false;
    place(st.sol[i]);
    notesMode = wasNotes;
    render();
  };

  function win() {
    st.done = true; save();
    stats.solved++; store.set('sudokuStats', stats);
    fx.celebrate();
    if (window.uni?.on) { fx.emojiRain(['🦄', '🌈', '✨', '💖'], 40); fx.fireworks(8, 1500); }
    setTimeout(chooseLevel, 700, `<h2>Solved! 🎉</h2><p>${st.level} in ${fmt(st.time)} with ${st.mistakes} mistake${st.mistakes === 1 ? '' : 's'}.</p>`);
  }
  function chooseLevel(head = '<h2>New game</h2><p>Pick a level</p>') {
    overlay.show(`${head}${Object.keys(LEVELS).map(l => `<button class="big-btn ${l === 'Easy' ? '' : 'alt'}" data-l="${l}">${l}</button>`).join('')}`, {});
    $$('#overlayCard [data-l]').forEach(b => b.onclick = () => {
      b.textContent = 'Making puzzle…';
      setTimeout(() => { overlay.hide(); newGame(b.dataset.l); }, 30);
    });
  }
  $('#sdNew').onclick = () => chooseLevel();

  // timer runs only while the screen is open
  setInterval(() => {
    if (nav.current !== 'sudoku' || document.hidden || !st || st.done) return;
    st.time++; tick();
    if (st.time % 10 === 0) save();
  }, 1000);

  if (!st) { st = generate('Easy'); save(); }
  screens.sudoku = {
    onShow() { render(); if (st.done) chooseLevel(); },
    meta: () => stats.solved ? `${stats.solved} solved` : 'Easy, medium, hard',
  };
})();
