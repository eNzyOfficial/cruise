// Word Wheel: make words from 6 letters, find all the hidden ones
(() => {
  const ring = $('#whRing'), slots = $('#whSlots'), cur = $('#whCurrent'), info = $('#whInfo');
  let st = store.get('wheel', null);
  let solved = store.get('wheelSolved', 0);
  let picked = []; // indexes into st.letters

  const fits = (w, base) => {
    const c = {};
    for (const ch of base) c[ch] = (c[ch] || 0) + 1;
    for (const ch of w) { if (!c[ch]) return false; c[ch]--; }
    return true;
  };

  function newPuzzle() {
    const base = pick(WORDS.wheelBases);
    const targets = [...WORDS.common].filter(w => fits(w, base))
      .sort((a, b) => a.length - b.length || a.localeCompare(b));
    let letters;
    do { letters = shuffle([...base]); } while (letters.join('') === base);
    st = { base, letters, targets, found: [], bonus: [], hints: {} };
    picked = [];
    save(); render();
  }
  const save = () => store.set('wheel', st);

  function layoutRing() {
    ring.innerHTML = '';
    st.letters.forEach((ch, i) => {
      const a = (i / st.letters.length) * Math.PI * 2 - Math.PI / 2;
      const b = document.createElement('button');
      b.textContent = ch;
      b.style.left = (50 + Math.cos(a) * 33) + '%';
      b.style.top = (50 + Math.sin(a) * 33) + '%';
      b.addEventListener('click', () => tapLetter(i));
      ring.appendChild(b);
    });
  }

  function tapLetter(i) {
    const at = picked.indexOf(i);
    if (at === -1) picked.push(i);
    else if (at === picked.length - 1) picked.pop();
    else return;
    window.uni?.boomEl(ring.children[i]);
    renderCurrent();
  }

  function renderCurrent() {
    cur.textContent = picked.map(i => st.letters[i]).join('');
    [...ring.children].forEach((b, i) => b.classList.toggle('used', picked.includes(i)));
  }

  function render(flashWord) {
    slots.innerHTML = st.targets.map(w => {
      const found = st.found.includes(w);
      const shown = found ? w.length : (st.hints[w] || 0);
      return `<div data-w="${found ? w : ''}" class="wh-word${found ? ' found' : ''}${w === flashWord ? ' flash' : ''}">${[...w].map((ch, i) =>
        `<i class="${!found && i < shown ? 'hint' : ''}">${i < shown ? ch : ''}</i>`).join('')}</div>`;
    }).join('');
    info.innerHTML = `Found ${st.found.length} of ${st.targets.length}${st.found.length ? ' · tap to learn' : ''}${st.bonus.length ? ` · <button id="whBonus" style="color:var(--warm);font-size:13px">${st.bonus.length} bonus</button>` : ''} &nbsp;·&nbsp; <button id="whSkip" style="color:var(--accent);font-size:13px">New letters</button>`;
    $('#whSkip').onclick = () => overlay.show(`<h2>New letters?</h2><p>You'll skip this puzzle.</p>
      <button class="big-btn" id="ovYes">New letters</button><button class="big-btn alt" id="ovNo">Keep going</button>`,
      { '#ovYes': newPuzzle, '#ovNo': () => {} });
    $('#whBonus')?.addEventListener('click', showBonus);
    layoutRing();
    renderCurrent();
    if (flashWord) {
      const el = slots.querySelector('.flash');
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function enter() {
    const w = picked.map(i => st.letters[i]).join('');
    picked = [];
    if (w.length < 3) { if (w) toast('3 letters or more'); renderCurrent(); return; }
    if (st.found.includes(w) || st.bonus.includes(w)) toast('Already found');
    else if (st.targets.includes(w)) { st.found.push(w); learned.add(w, 'Word Wheel'); save(); render(w); window.uni?.boomEl(slots.querySelector('.flash'), true); if (window.uni?.on) fx.fireworks(2, 400); if (st.found.length === st.targets.length) return finish(); return; }
    else if (WORDS.all.has(w)) { st.bonus.push(w); save(); learned.add(w, 'Word Wheel'); toast(`Bonus word: ${w.toUpperCase()}`); render(); return; }
    else toast('Not a word');
    renderCurrent();
  }

  function showBonus() {
    overlay.show(`<h2>Bonus words</h2><p>Tap one to see what it means.</p>
      <div class="word-chips">${st.bonus.map(w => `<button data-def="${w}">${w}</button>`).join('')}</div>
      <button class="big-btn alt" id="ovNo">Close</button>`, { '#ovNo': () => {} });
    $$('#overlayCard [data-def]').forEach(b => b.onclick = () => { overlay.hide(); showDefinition(b.dataset.def, 'Word Wheel'); });
  }

  // Tap a found word to see its meaning
  slots.addEventListener('click', e => {
    const w = e.target.closest('[data-w]')?.dataset.w;
    if (w) showDefinition(w, 'Word Wheel');
  });

  function finish() {
    fx.celebrate();
    if (window.uni?.on) { fx.emojiRain(['🦄', '🌈', '✨', '💖'], 50); fx.fireworks(10, 2000); }
    solved++;
    store.set('wheelSolved', solved);
    setTimeout(() => {
      overlay.show(`<h2>All found!</h2><div class="big-word">${st.base.toUpperCase()}</div>
      <p>${st.bonus.length ? `Plus ${st.bonus.length} bonus word${st.bonus.length > 1 ? 's' : ''}. ` : ''}Puzzles solved: ${solved}</p>
      <div class="word-chips">${st.targets.map(w => `<button data-def="${w}">${w}</button>`).join('')}</div>
      <p style="font-size:13px">Tap a word to see what it means. They're all saved in My Words.</p>
      <button class="big-btn" id="ovNext">Next puzzle</button>`, { '#ovNext': newPuzzle });
      $$('#overlayCard [data-def]').forEach(b => b.onclick = () => showDefinition(b.dataset.def, 'Word Wheel'));
    }, 500);
  }

  function hint() {
    const w = st.targets.find(t => !st.found.includes(t) && (st.hints[t] || 0) < t.length - 1);
    if (!w) return toast('No more hints. You can do it!');
    st.hints[w] = (st.hints[w] || 0) + 1;
    save(); render();
  }

  $('#whEnter').onclick = enter;
  $('#whClear').onclick = () => { picked = []; renderCurrent(); };
  $('#whShuffle').onclick = () => { picked = []; shuffle(st.letters); save(); layoutRing(); renderCurrent(); };
  $('#whHint').onclick = hint;

  document.addEventListener('keydown', e => {
    if (nav.current !== 'wheel') return;
    if (e.key === 'Enter') enter();
    else if (e.key === 'Backspace') { picked.pop(); renderCurrent(); }
    else if (/^[a-z]$/i.test(e.key)) {
      const i = st.letters.findIndex((ch, idx) => ch === e.key.toLowerCase() && !picked.includes(idx));
      if (i >= 0) tapLetter(i);
    }
  });

  if (!st) newPuzzle(); else render();
  screens.wheel = {
    onShow() { render(); },
    meta: () => solved ? `${solved} solved` : 'Find hidden words',
  };
})();
