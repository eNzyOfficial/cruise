// My Words: every word met in the games. Search, filter, star, delete and practise them.
(() => {
  const list = $('#mwList');
  let filter = 'all', query = '', undo = null, undoTimer;
  const FILTERS = [['all', 'All'], ['star', '★ Starred'], ['learning', 'Learning'], ['known', 'Known ✓'], ['Word Guess', 'Word Guess'], ['Word Wheel', 'Word Wheel']];
  const isKnown = x => (x.knew || 0) >= 2;

  const ago = t => {
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m} min ago`;
    if (m < 1440) return `${Math.round(m / 60)} h ago`;
    return `${Math.round(m / 1440)} d ago`;
  };
  const firstDef = w => (window.DEFS?.[w] || '').split('~')[0].split('|')[1] || 'Rare word';

  function visible() {
    return learned.all().filter(x =>
      (filter === 'all' || (filter === 'star' && x.star) || (filter === 'learning' && !isKnown(x)) || (filter === 'known' && isKnown(x)) || x.from === filter) &&
      (!query || x.w.includes(query)));
  }

  async function render() {
    const all = learned.all();
    $('#mwFilters').innerHTML = FILTERS.map(([k, label]) => {
      const n = all.filter(x => k === 'all' || (k === 'star' && x.star) || (k === 'learning' && !isKnown(x)) || (k === 'known' && isKnown(x)) || x.from === k).length;
      return `<button class="${filter === k ? 'on' : ''}" data-f="${k}">${label} <small>${n}</small></button>`;
    }).join('');
    $('#mwPractice').disabled = !all.length;
    $('#mwClear').style.display = all.length ? '' : 'none';

    if (!all.length) {
      list.innerHTML = `<div class="mw-empty"><div style="font-size:44px">📖</div><h3>No words yet</h3>
        <p>Play Word Guess or Word Wheel. Every word you meet is saved here with its meaning.</p></div>`;
      return;
    }
    await dict.load();
    const rows = visible();
    list.innerHTML = rows.length ? rows.map(x => `
      <div class="mw-row" data-w="${x.w}">
        <button class="mw-main" data-open="${x.w}">
          <div class="mw-top"><b>${x.w}</b>${isKnown(x) ? '<span class="mw-known">known</span>' : ''}<small>${x.from || ''} · ${ago(x.t)}</small></div>
          <div class="mw-def">${firstDef(x.w)}</div>
        </button>
        <div class="mw-btns">
          <button class="mw-star ${x.star ? 'on' : ''}" data-star="${x.w}" aria-label="Star">${x.star ? '★' : '☆'}</button>
          <button class="mw-del" data-del="${x.w}" aria-label="Delete">✕</button>
        </div>
      </div>`).join('') : `<p class="mw-count">No words match.</p>`;
  }

  list.addEventListener('click', e => {
    const open = e.target.closest('[data-open]')?.dataset.open;
    const star = e.target.closest('[data-star]')?.dataset.star;
    const del = e.target.closest('[data-del]')?.dataset.del;
    if (star) { learned.patch(star, { star: !learned.all().find(x => x.w === star)?.star }); render(); }
    else if (del) remove(del);
    else if (open) showDefinition(open, learned.all().find(x => x.w === open)?.from);
  });
  $('#mwFilters').addEventListener('click', e => { const f = e.target.closest('[data-f]')?.dataset.f; if (f) { filter = f; render(); } });
  $('#mwSearch').addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); render(); });

  function remove(word) {
    const all = learned.all();
    const idx = all.findIndex(x => x.w === word);
    undo = { items: [all[idx]], positions: [idx] };
    learned.remove(word);
    showUndo(`Removed "${word}"`);
    render();
  }
  function showUndo(text) {
    $('#mwUndoText').textContent = text;
    $('#mwUndo').classList.add('show');
    clearTimeout(undoTimer);
    undoTimer = setTimeout(() => { $('#mwUndo').classList.remove('show'); undo = null; }, 4500);
  }
  $('#mwUndoBtn').onclick = () => {
    if (!undo) return;
    const all = learned.all();
    undo.items.forEach((item, i) => all.splice(Math.min(undo.positions[i], all.length), 0, item));
    learned.save(all);
    undo = null;
    $('#mwUndo').classList.remove('show');
    render();
  };
  $('#mwClear').onclick = () => overlay.show(`<h2>Clear all words?</h2><p>This removes all ${learned.all().length} words from My Words.</p>
    <button class="big-btn" id="ovYes">Clear all</button><button class="big-btn alt" id="ovNo">Keep them</button>`,
    { '#ovYes': () => { const all = learned.all(); undo = { items: all, positions: all.map((_, i) => i) }; learned.save([]); showUndo('Cleared all words'); render(); }, '#ovNo': () => {} });

  // ---------- practice: flashcards ----------
  let deck = [], pos = 0, right = 0;
  $('#mwPractice').onclick = () => {
    let pool = visible();
    if (!pool.length) pool = learned.all();
    // words you're still learning first, starred ones before others
    pool = shuffle(pool.slice()).sort((a, b) => (isKnown(a) - isKnown(b)) || ((b.star ? 1 : 0) - (a.star ? 1 : 0)));
    deck = pool.slice(0, 10); pos = 0; right = 0;
    card();
  };
  async function card() {
    if (pos >= deck.length) {
      if (right === deck.length) fx.celebrate();
      overlay.show(`<h2>${right === deck.length ? 'Perfect! 🎉' : 'Nice practice!'}</h2><p>You knew ${right} of ${deck.length}.</p>
        <button class="big-btn" id="ovAgain">Practice again</button><button class="big-btn alt" id="ovNo">Done</button>`,
        { '#ovAgain': () => $('#mwPractice').click(), '#ovNo': render });
      return;
    }
    const w = deck[pos].w;
    const senses = await dict.get(w);
    overlay.show(`<div class="fc-count">${pos + 1} / ${deck.length}</div>
      <div class="fc-word">${w}</div>
      <p>Do you remember what it means?</p>
      <div class="fc-answer" id="fcAnswer"><div class="ov-def">${sensesHTML(senses ? senses.slice(0, 2) : null, w)}</div></div>
      <button class="big-btn" id="fcShow">Show meaning</button>
      <div class="fc-judge" id="fcJudge"><button class="big-btn alt" id="fcNo">Still learning</button><button class="big-btn" id="fcYes">I knew it ✓</button></div>
      <button class="fc-quit" id="fcQuit">Stop practising</button>`, {});
    $('#fcShow').onclick = () => { $('#fcAnswer').classList.add('show'); $('#fcShow').style.display = 'none'; $('#fcJudge').classList.add('show'); };
    $('#fcYes').onclick = () => { learned.patch(w, { knew: (deck[pos].knew || 0) + 1 }); right++; pos++; card(); };
    $('#fcNo').onclick = () => { learned.patch(w, { knew: 0 }); pos++; card(); };
    $('#fcQuit').onclick = () => { overlay.hide(); render(); };
  }

  screens.mywords = {
    onShow: render,
    meta: () => { const n = learned.all().length; return n ? `${n} word${n > 1 ? 's' : ''} saved · practise them` : 'Words you\'ve met in the games'; },
  };
})();
