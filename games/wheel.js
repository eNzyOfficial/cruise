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
      return `<div class="wh-word${found ? ' found' : ''}${w === flashWord ? ' flash' : ''}">${[...w].map((ch, i) =>
        `<i class="${!found && i < shown ? 'hint' : ''}">${i < shown ? ch : ''}</i>`).join('')}</div>`;
    }).join('');
    info.innerHTML = `Found ${st.found.length} of ${st.targets.length}${st.bonus.length ? ` · ${st.bonus.length} bonus` : ''} &nbsp;·&nbsp; <button id="whSkip" style="color:var(--accent);font-size:13px">New letters</button>`;
    $('#whSkip').onclick = () => overlay.show(`<h2>New letters?</h2><p>You'll skip this puzzle.</p>
      <button class="big-btn" id="ovYes">New letters</button><button class="big-btn alt" id="ovNo">Keep going</button>`,
      { '#ovYes': newPuzzle, '#ovNo': () => {} });
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
    else if (st.targets.includes(w)) { st.found.push(w); save(); render(w); if (st.found.length === st.targets.length) return finish(); return; }
    else if (WORDS.all.has(w)) { st.bonus.push(w); save(); toast(`Bonus word: ${w.toUpperCase()}`); render(); return; }
    else toast('Not a word');
    renderCurrent();
  }

  function finish() {
    solved++;
    store.set('wheelSolved', solved);
    setTimeout(() => overlay.show(`<h2>All found!</h2><div class="big-word">${st.base.toUpperCase()}</div>
      <p>${st.bonus.length ? `Plus ${st.bonus.length} bonus word${st.bonus.length > 1 ? 's' : ''}. ` : ''}Puzzles solved: ${solved}</p>
      <button class="big-btn" id="ovNext">Next puzzle</button>`, { '#ovNext': newPuzzle }), 500);
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
