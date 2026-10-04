// Word Search: themed words hidden in a letter grid. Swipe across a word to find it.
(() => {
  const N = 10;
  const THEMES = {
    'Travel ✈️': ['plane', 'ticket', 'passport', 'luggage', 'window', 'pilot', 'cloud', 'runway', 'beach', 'hotel', 'island', 'map', 'taxi', 'train', 'suitcase', 'journey', 'airport', 'holiday'],
    'Food 🍜': ['noodle', 'mango', 'rice', 'curry', 'sushi', 'pizza', 'bread', 'cheese', 'coffee', 'honey', 'lemon', 'pepper', 'salad', 'soup', 'sugar', 'cookie', 'pancake', 'waffle'],
    'Animals 🐼': ['tiger', 'panda', 'koala', 'zebra', 'horse', 'rabbit', 'monkey', 'eagle', 'whale', 'shark', 'otter', 'parrot', 'turtle', 'puppy', 'kitten', 'camel', 'dolphin', 'penguin'],
    'Nature 🌿': ['river', 'forest', 'flower', 'ocean', 'mountain', 'rain', 'snow', 'storm', 'sunset', 'meadow', 'valley', 'desert', 'leaf', 'stone', 'moon', 'rainbow', 'breeze', 'wave'],
    'Cozy home 🛋️': ['pillow', 'blanket', 'sofa', 'lamp', 'kitchen', 'mirror', 'garden', 'candle', 'carpet', 'door', 'table', 'chair', 'shelf', 'towel', 'clock', 'teapot', 'slippers', 'cushion'],
    'Good vibes ✨': ['happy', 'calm', 'brave', 'proud', 'excited', 'cozy', 'joyful', 'relaxed', 'hopeful', 'cheerful', 'grateful', 'sunny', 'peaceful', 'silly', 'curious', 'gentle', 'kind', 'lucky'],
    'Thailand 🇹🇭': ['mango', 'temple', 'elephant', 'tuktuk', 'market', 'orchid', 'jasmine', 'coconut', 'lotus', 'island', 'beach', 'durian', 'chili', 'silk', 'spicy', 'lantern', 'monsoon', 'papaya'],
    'Fashion 👗': ['dress', 'jacket', 'scarf', 'jeans', 'boots', 'skirt', 'shirt', 'hoodie', 'socks', 'sweater', 'blouse', 'denim', 'linen', 'cotton', 'sandals', 'necklace', 'handbag', 'hat'],
  };
  const COLORS = ['#ff6b9d', '#ffd166', '#7ee3c8', '#7cb4ff', '#b28dff', '#ff9f5a', '#5dff9a', '#ff8fc7'];
  const gridEl = $('#wsGrid'), svg = $('#wsLines'), wordsEl = $('#wsWords');
  let st = store.get('wsearch', null);
  let solved = store.get('wsearchSolved', 0);

  function build() {
    const names = Object.keys(THEMES);
    const theme = pick(names);
    // after a few puzzles, words can also run backwards
    const dirs = [[0, 1], [1, 0], [1, 1], [-1, 1]];
    if (solved >= 3) dirs.push([0, -1], [-1, 0], [-1, -1], [1, -1]);
    for (let attempt = 0; attempt < 50; attempt++) {
      const g = Array.from({ length: N }, () => Array(N).fill(''));
      const placed = [];
      for (const w of shuffle(THEMES[theme].filter(w => w.length <= N).slice())) {
        if (placed.length >= 8) break;
        let ok = false;
        for (let t = 0; t < 150 && !ok; t++) {
          const [dr, dc] = pick(dirs);
          const r = rand(N), c = rand(N);
          const er = r + dr * (w.length - 1), ec = c + dc * (w.length - 1);
          if (er < 0 || er >= N || ec < 0 || ec >= N) continue;
          if ([...w].every((ch, i) => !g[r + dr * i][c + dc * i] || g[r + dr * i][c + dc * i] === ch)) {
            [...w].forEach((ch, i) => g[r + dr * i][c + dc * i] = ch);
            placed.push({ w, r, c, er, ec });
            ok = true;
          }
        }
      }
      if (placed.length < 7) continue;
      const abc = 'abcdefghijklmnoprstuwy';
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!g[r][c]) g[r][c] = pick([...abc]);
      return { theme, grid: g, words: placed, found: [] };
    }
  }

  function newPuzzle() { st = build(); save(); render(); }
  const save = () => store.set('wsearch', st);

  function render() {
    gridEl.innerHTML = st.grid.flat().map((ch, i) => `<i data-i="${i}">${ch}</i>`).join('');
    $('#wsTheme').textContent = `${st.theme} · ${st.found.length}/${st.words.length}`;
    wordsEl.innerHTML = st.words.map(x => `<button class="${st.found.includes(x.w) ? 'found' : ''}" data-w="${x.w}">${x.w}</button>`).join('');
    drawLines();
  }

  const cellCenter = (r, c) => {
    const s = gridEl.clientWidth / N;
    return [(c + 0.5) * s, (r + 0.5) * s];
  };
  function lineSVG(r1, c1, r2, c2, color, live) {
    const [x1, y1] = cellCenter(r1, c1), [x2, y2] = cellCenter(r2, c2);
    const w = gridEl.clientWidth / N * 0.78;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" opacity="${live ? 0.55 : 0.45}"/>`;
  }
  function drawLines(live) {
    const s = gridEl.clientWidth;
    svg.setAttribute('viewBox', `0 0 ${s} ${s}`);
    svg.innerHTML = st.words.map((x, i) => st.found.includes(x.w) ? lineSVG(x.r, x.c, x.er, x.ec, COLORS[i % COLORS.length]) : '').join('') +
      (live ? lineSVG(live.r1, live.c1, live.r2, live.c2, '#ffffff', true) : '');
  }

  // ---------- swipe to select ----------
  let sel = null;
  const cellAt = e => {
    const b = gridEl.getBoundingClientRect(), s = b.width / N;
    return [Math.floor((e.clientY - b.top) / s), Math.floor((e.clientX - b.left) / s)];
  };
  gridEl.addEventListener('pointerdown', e => {
    const [r, c] = cellAt(e);
    if (r < 0 || c < 0 || r >= N || c >= N) return;
    sel = { r1: r, c1: c, r2: r, c2: c, id: e.pointerId };
    drawLines(sel);
  });
  window.addEventListener('pointermove', e => {
    if (!sel || e.pointerId !== sel.id) return;
    let [r, c] = cellAt(e);
    let dr = r - sel.r1, dc = c - sel.c1;
    // snap to the nearest of the 8 straight directions
    const len = Math.max(Math.abs(dr), Math.abs(dc));
    if (len) {
      const a = Math.round(Math.atan2(dr, dc) / (Math.PI / 4)) * (Math.PI / 4);
      dr = Math.round(Math.sin(a)) * len; dc = Math.round(Math.cos(a)) * len;
    }
    sel.r2 = Math.max(0, Math.min(N - 1, sel.r1 + dr));
    sel.c2 = Math.max(0, Math.min(N - 1, sel.c1 + dc));
    drawLines(sel);
  });
  window.addEventListener('pointerup', e => {
    if (!sel || e.pointerId !== sel.id) return;
    const s = sel; sel = null;
    const dr = Math.sign(s.r2 - s.r1), dc = Math.sign(s.c2 - s.c1);
    const len = Math.max(Math.abs(s.r2 - s.r1), Math.abs(s.c2 - s.c1)) + 1;
    let word = '';
    for (let i = 0; i < len; i++) word += st.grid[s.r1 + dr * i][s.c1 + dc * i];
    const back = [...word].reverse().join('');
    const hit = st.words.find(x => !st.found.includes(x.w) && (x.w === word || x.w === back) && len > 1);
    if (hit) found(hit, s);
    drawLines();
  });

  function found(hit, s) {
    st.found.push(hit.w);
    // store the line as the player drew it so the highlight matches
    Object.assign(hit, { r: s.r1, c: s.c1, er: s.r2, ec: s.c2 });
    save();
    learned.add(hit.w, 'Word Search');
    haptic();
    const b = gridEl.getBoundingClientRect(), cs = b.width / N;
    const i = st.words.indexOf(hit);
    const steps = Math.max(Math.abs(s.r2 - s.r1), Math.abs(s.c2 - s.c1));
    for (let k = 0; k <= steps; k++) {
      const r = s.r1 + Math.sign(s.r2 - s.r1) * k, c = s.c1 + Math.sign(s.c2 - s.c1) * k;
      setTimeout(() => fx.sparkle(b.left + (c + 0.5) * cs, b.top + (r + 0.5) * cs, COLORS[i % COLORS.length], 4, 3), k * 40);
    }
    if (window.uni?.on) { uni.boom(b.left + (s.c2 + 0.5) * cs, b.top + (s.r2 + 0.5) * cs, true); }
    render();
    if (st.found.length === st.words.length) {
      solved++; store.set('wsearchSolved', solved);
      fx.celebrate();
      if (window.uni?.on) { fx.emojiRain(['🦄', '🌈', '✨', '💖'], 40); fx.fireworks(8, 1500); }
      setTimeout(() => overlay.show(`<h2>All found! 🎉</h2><p>${st.theme} · puzzles solved: ${solved}</p>
        <div class="word-chips">${st.words.map(x => `<button data-def="${x.w}">${x.w}</button>`).join('')}</div>
        <p style="font-size:13px">Tap a word to see what it means. They're saved in My Words.</p>
        <button class="big-btn" id="ovNext">Next puzzle</button>`, { '#ovNext': newPuzzle }), 600);
      setTimeout(() => $$('#overlayCard [data-def]').forEach(b2 => b2.onclick = () => showDefinition(b2.dataset.def, 'Word Search')), 650);
    }
  }

  wordsEl.addEventListener('click', e => {
    const w = e.target.closest('.found')?.dataset.w;
    if (w) showDefinition(w, 'Word Search');
  });
  $('#wsNew').onclick = newPuzzle;

  if (!st) { st = build(); save(); }
  screens.wsearch = {
    onShow() { render(); },
    meta: () => solved ? `${solved} solved` : 'Swipe to find words',
  };
  window.addEventListener('resize', () => { if (nav.current === 'wsearch') drawLines(); });
})();
