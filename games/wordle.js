// Word Guess: guess the 5-letter word in 6 tries, unlimited puzzles
(() => {
  const grid = $('#wdGrid'), kb = $('#wdKb'), msg = $('#wdMsg');
  let st = store.get('wordle', null);
  let stats = store.get('wordleStats', { played: 0, wins: 0, streak: 0 });
  let typed = '';
  let busy = false;

  // Easy mode (default) picks from the most common words and gives clue + reveal help
  let easy = store.get('wordleEasy', true);
  const newGame = () => {
    st = { answer: pick(easy ? WORDS.answers.slice(0, 450) : WORDS.answers), guesses: [], done: false, revealed: [], clue: false };
    typed = ''; save(); render();
  };
  const save = () => store.set('wordle', st);

  function score(guess, answer) {
    const res = Array(5).fill('x'), left = {};
    for (let i = 0; i < 5; i++) {
      if (guess[i] === answer[i]) res[i] = 'g';
      else left[answer[i]] = (left[answer[i]] || 0) + 1;
    }
    for (let i = 0; i < 5; i++) {
      if (res[i] !== 'g' && left[guess[i]]) { res[i] = 'y'; left[guess[i]]--; }
    }
    return res;
  }

  function buildGrid() {
    grid.innerHTML = '';
    for (let r = 0; r < 6; r++) {
      const row = document.createElement('div');
      row.className = 'wd-row';
      for (let c = 0; c < 5; c++) row.appendChild(document.createElement('div')).className = 'wd-cell';
      grid.appendChild(row);
    }
  }

  function buildKb() {
    const rows = ['qwertyuiop', 'asdfghjkl', '⏎zxcvbnm⌫'];
    kb.innerHTML = rows.map(r => `<div class="kb-row">${[...r].map(k =>
      k === '⏎' ? '<button class="wide" data-k="enter">Enter</button>'
      : k === '⌫' ? '<button class="wide" data-k="back">⌫</button>'
      : `<button data-k="${k}">${k}</button>`).join('')}</div>`).join('');
    kb.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { key(b.dataset.k); window.uni?.boomEl(b); } });
  }

  function render(animateRow = -1) {
    const rows = grid.children;
    const keyState = {};
    st.guesses.forEach((g, r) => {
      const res = score(g, st.answer);
      [...g].forEach((ch, c) => {
        const cell = rows[r].children[c];
        cell.textContent = ch;
        cell.className = 'wd-cell ' + res[c];
        cell.style.animationDelay = r === animateRow ? `${c * 0.12}s` : '0s';
        if (r !== animateRow) cell.style.animation = 'none';
        else cell.style.animation = '';
        const rank = { g: 3, y: 2, x: 1 };
        if (!keyState[ch] || rank[res[c]] > rank[keyState[ch]]) keyState[ch] = res[c];
      });
    });
    for (let r = st.guesses.length; r < 6; r++) {
      [...rows[r].children].forEach((cell, c) => {
        const ch = r === st.guesses.length ? (typed[c] || '') : '';
        cell.textContent = ch;
        cell.className = 'wd-cell' + (ch ? ' filled' : '');
        cell.style.animation = '';
      });
    }
    $$('button[data-k]', kb).forEach(b => {
      const s = keyState[b.dataset.k];
      b.className = (b.classList.contains('wide') ? 'wide ' : '') + (s || '');
    });
    $('#wdStats').textContent = stats.played ? `Solved ${stats.wins} · Streak ${stats.streak}` : '';
    // revealed letters: shown as a hint strip and green on the keyboard
    const rev = st.revealed || [];
    rev.forEach(p => { keyState[st.answer[p]] = 'g'; });
    $$('button[data-k]', kb).forEach(b => { if (keyState[b.dataset.k] === 'g') b.className = (b.classList.contains('wide') ? 'wide ' : '') + 'g'; });
    $('#wdReveal').textContent = `🔤 Reveal a letter (${2 - rev.length})`;
    $('#wdReveal').disabled = !easy || rev.length >= 2 || st.done;
    $('#wdClue').disabled = !easy || st.done;
    $('#wdEasy').textContent = easy ? 'Easy ✓' : 'Easy';
    $('#wdEasy').classList.toggle('on', easy);
    $('#wdClue').style.display = $('#wdReveal').style.display = easy ? '' : 'none';
    const strip = rev.length ? [...st.answer].map((ch, p) => rev.includes(p) ? ch.toUpperCase() : '_').join(' ') : '';
    msg.innerHTML = st.done ? '' : strip ? `Hint: <b class="wd-strip">${strip}</b>` : `Guess ${Math.min(st.guesses.length + 1, 6)} of 6` + (st.guesses.length ? ' · tap a word to see its meaning' : '');
  }

  async function key(k) {
    if (busy) return;
    if (st.done) return showEnd();
    if (k === 'back') typed = typed.slice(0, -1);
    else if (k === 'enter') return submit();
    else if (/^[a-z]$/.test(k) && typed.length < 5) typed += k;
    render();
  }

  async function submit() {
    const row = grid.children[st.guesses.length];
    if (typed.length < 5 || !WORDS.guesses.has(typed)) {
      toast(typed.length < 5 ? 'Not enough letters' : 'Not in word list');
      row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake');
      return;
    }
    st.guesses.push(typed);
    typed = '';
    const won = st.guesses[st.guesses.length - 1] === st.answer;
    if (won || st.guesses.length === 6) {
      st.done = true; st.won = won;
      stats.played++;
      if (won) { stats.wins++; stats.streak++; } else stats.streak = 0;
      store.set('wordleStats', stats);
    }
    save();
    busy = true;
    render(st.guesses.length - 1);
    if (window.uni?.on) [...row.children].forEach((cell, i) => setTimeout(() => uni.boomEl(cell, cell.classList.contains('g')), 120 * i + 250));
    await sleep(800);
    busy = false;
    if (st.done) showEnd();
  }

  async function showEnd() {
    const praise = ['Genius!', 'Brilliant!', 'Great job!', 'Nice one!', 'Got it!', 'Phew, made it!'];
    const senses = await dict.get(st.answer);
    learned.add(st.answer, 'Word Guess');
    if (st.won) { fx.celebrate(); if (window.uni?.on) { fx.emojiRain(['🦄', '🌈', '✨', '💖'], 40); fx.fireworks(8, 1500); } }
    const meaning = `<div class="ov-def">${sensesHTML(senses ? senses.slice(0, 2) : null, st.answer)}</div>`;
    overlay.show(st.won
      ? `<h2>${praise[st.guesses.length - 1]}</h2><div class="big-word">${st.answer.toUpperCase()}</div>${meaning}<p>Solved in ${st.guesses.length}. Streak: ${stats.streak}</p><button class="big-btn" id="ovNext">Next word</button>`
      : `<h2>So close</h2><p>The word was</p><div class="big-word">${st.answer.toUpperCase()}</div>${meaning}<button class="big-btn" id="ovNext">Next word</button>`,
      { '#ovNext': newGame });
  }

  // Tap a finished row to see what that word means
  grid.addEventListener('click', e => {
    const row = e.target.closest('.wd-row');
    const r = [...grid.children].indexOf(row);
    if (r >= 0 && r < st.guesses.length) showDefinition(st.guesses[r], 'Word Guess');
  });

  // ---------- help buttons ----------
  $('#wdReveal').onclick = () => {
    st.revealed ||= [];
    const known = new Set(st.revealed);
    st.guesses.forEach(g => [...g].forEach((ch, p) => { if (ch === st.answer[p]) known.add(p); }));
    const options = [0, 1, 2, 3, 4].filter(p => !known.has(p));
    if (!options.length || st.revealed.length >= 2) return;
    st.revealed.push(pick(options));
    save(); render();
    window.uni?.boomEl($('#wdReveal'), true);
  };
  $('#wdClue').onclick = async () => {
    const senses = await dict.get(st.answer);
    st.clue = true; save();
    const hide = t => t.replace(new RegExp(st.answer, 'gi'), '_____');
    overlay.show(`<h2>💡 Clue</h2><div class="ov-def">${senses ? senses.slice(0, 2).map(s => `<div class="def-sense">${POS_NAME[s.p] ? `<span class="def-pos">${POS_NAME[s.p]}</span>` : ''}<div class="def-text">${hide(s.d)}</div></div>`).join('') : '<p>No clue for this one, sorry!</p>'}</div>
      <button class="big-btn" id="ovOk">Got it</button>`, { '#ovOk': () => {} });
  };
  $('#wdEasy').onclick = () => {
    easy = !easy; store.set('wordleEasy', easy);
    toast(easy ? 'Easy mode on: common words, clues and hints' : 'Easy mode off: any word, no help');
    if (!st.guesses.length) newGame(); else render();
  };

  document.addEventListener('keydown', e => {
    if (nav.current !== 'wordle' || e.metaKey || e.ctrlKey) return;
    if (e.key === 'Enter') key('enter');
    else if (e.key === 'Backspace') key('back');
    else if (/^[a-zA-Z]$/.test(e.key)) key(e.key.toLowerCase());
  });

  buildGrid(); buildKb();
  if (!st) newGame(); else render();

  screens.wordle = {
    onShow() { render(); if (st.done) showEnd(); },
    meta: () => stats.played ? `${stats.wins} solved` : '5-letter words',
  };
})();
