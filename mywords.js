// My Words: every word met in the games, tap to see the meaning again
(() => {
  const list = $('#mwList');
  const ago = t => {
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m} min ago`;
    if (m < 1440) return `${Math.round(m / 60)} h ago`;
    return `${Math.round(m / 1440)} d ago`;
  };
  async function render() {
    const words = learned.all();
    if (!words.length) {
      list.innerHTML = `<div class="mw-empty"><div style="font-size:44px">📖</div><h3>No words yet</h3>
        <p>Play Word Guess or Word Wheel and every word you meet will be saved here with its meaning.</p></div>`;
      return;
    }
    await dict.load();
    list.innerHTML = `<p class="mw-count">${words.length} word${words.length > 1 ? 's' : ''} · tap one for the full meaning</p>` +
      words.map(({ w, from, t }) => {
        const first = (window.DEFS?.[w] || '').split('~')[0].split('|');
        return `<button class="mw-row" data-def="${w}">
          <div class="mw-top"><b>${w}</b><small>${from || ''} · ${ago(t)}</small></div>
          <div class="mw-def">${first[1] || 'Rare word'}</div></button>`;
      }).join('');
  }
  list.addEventListener('click', e => {
    const w = e.target.closest('[data-def]')?.dataset.def;
    if (w) showDefinition(w, learned.all().find(x => x.w === w)?.from).then(render);
  });
  screens.mywords = {
    onShow: render,
    meta: () => { const n = learned.all().length; return n ? `${n} word${n > 1 ? 's' : ''} saved` : 'Words you\'ve met in the games'; },
  };
})();
