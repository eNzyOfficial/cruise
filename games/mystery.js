// Detective Desk: two-minute mysteries and full case files
(() => {
  const hub = $('#mysBody'), caseBody = $('#caseBody'), caseTabs = $('#caseTabs');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const paras = s => s.split(/\n\n+/).map(p => `<p>${esc(p)}</p>`).join('');
  let solvedMini = store.get('miniSolved', {}); // index -> true (right first time) / false (answered wrong)
  let view = { mini: null };

  // ===================== hub =====================
  function renderHub() {
    if (view.mini != null) return renderMini(view.mini);
    const done = Object.keys(solvedMini).length, right = Object.values(solvedMini).filter(Boolean).length;
    hub.innerHTML = `
      <div class="mys-hero"><span>🕵️</span><div><h1>Detective Desk</h1><p>Every clue you need is in the story.</p></div></div>
      <h2 class="section-title">Case files</h2>
      ${CASES.map(c => {
        const s = caseState(c);
        const status = s.solved ? `Solved ${'★'.repeat(s.stars)}${'☆'.repeat(3 - s.stars)}` : s.asked.length ? `In progress · ${s.lies.length}/${c.lies.length} lies caught` : 'New case';
        return `<button class="mys-case" data-case="${c.id}"><span>📁</span><div><b>${esc(c.title)}</b><small>${esc(c.tagline)} · ${status}</small></div><i>›</i></button>`;
      }).join('')}
      <h2 class="section-title">Two-minute mysteries · ${right}/${MINI_MYSTERIES.length} solved</h2>
      <div class="mys-minis">${MINI_MYSTERIES.map((m, i) => `<button class="mys-mini ${i in solvedMini ? (solvedMini[i] ? 'right' : 'wrong') : ''}" data-mini="${i}">
        <em>${i + 1}</em><b>${esc(m.title)}</b><span>${i in solvedMini ? (solvedMini[i] ? '✓' : '✗') : ''}</span></button>`).join('')}</div>
      ${done ? '' : '<p class="mys-tip">Start with #1. They get a little trickier as you go.</p>'}`;
    $$('[data-mini]', hub).forEach(b => b.onclick = () => { view.mini = +b.dataset.mini; renderMini(view.mini); hub.parentElement.scrollTop = 0; });
    $$('[data-case]', hub).forEach(b => b.onclick = () => openCase(b.dataset.case));
  }

  // ===================== two-minute mysteries =====================
  function renderMini(i, picked) {
    const m = MINI_MYSTERIES[i];
    const answered = picked != null;
    let story = paras(m.story);
    if (answered) story = story.replace(esc(m.clue), `<mark>${esc(m.clue)}</mark>`);
    hub.innerHTML = `
      <button class="mys-back" id="mysList">‹ All mysteries</button>
      <div class="mys-num">Mystery ${i + 1} of ${MINI_MYSTERIES.length}</div>
      <h1 class="mys-title">${esc(m.title)}</h1>
      <div class="mys-story">${story}</div>
      <h3 class="mys-q">${esc(m.question)}</h3>
      <div class="mys-opts">${m.options.map((o, k) => `<button data-k="${k}" class="${answered ? (k === m.answer ? 'right' : k === picked ? 'wrong' : 'dim') : ''}" ${answered ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
      ${answered ? `<div class="mys-reveal ${picked === m.answer ? 'good' : 'bad'}">
          <b>${picked === m.answer ? 'Solved! 🔍' : 'Not quite. Here\'s what happened:'}</b>
          <p>${esc(m.reveal)}</p></div>
        ${i + 1 < MINI_MYSTERIES.length ? `<button class="big-btn" id="mysNext">Next mystery →</button>` : `<button class="big-btn" id="mysList2">Back to the desk</button>`}` : ''}`;
    $('#mysList').onclick = () => { view.mini = null; renderHub(); };
    $('#mysList2')?.addEventListener('click', () => { view.mini = null; renderHub(); });
    $('#mysNext')?.addEventListener('click', () => { view.mini = i + 1; renderMini(i + 1); hub.parentElement.scrollTop = 0; });
    $$('.mys-opts [data-k]', hub).forEach(b => b.onclick = e => {
      const k = +b.dataset.k, right = k === m.answer;
      if (!(i in solvedMini)) { solvedMini[i] = right; store.set('miniSolved', solvedMini); }
      if (right) {
        fx.explode(e.clientX, e.clientY, '#5dff9a', 2); fx.emojiBurst(e.clientX, e.clientY, ['🔍', '✨', '🕵️'], 8);
        if (window.uni?.on) { uni.boom(e.clientX, e.clientY, true); uni.phrase(innerWidth / 2, e.clientY - 80, 'detective era 🕵️'); }
      }
      haptic();
      renderMini(i, k);
      setTimeout(() => $('.mys-reveal', hub)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    });
  }

  // ===================== case files =====================
  let C = null, S = null, tab = 'case', person = null;
  function caseState(c) { return { asked: [], lies: [], mistakes: 0, cracked: false, solved: false, stars: 0, wrongAccuse: 0, ...store.get('case:' + c.id, {}) }; }
  const saveCase = () => store.set('case:' + C.id, S);
  const has = req => !req || S.lies.includes(req);
  const visibleTalks = who => C.talks.filter(t => t.who === who && has(t.req));
  const visibleEvidence = () => Object.entries(C.evidence).filter(([, e]) => has(e.req));

  function openCase(id) {
    C = CASES.find(c => c.id === id);
    S = caseState(C);
    tab = S.asked.length ? 'people' : 'case';
    person = null;
    nav.go('case');
  }

  function renderCase() {
    if (!C) return;
    $('#caseTitle').textContent = C.title;
    const tabs = [['case', '📁 Case'], ['people', '🗣️ People'], ['evidence', '🔎 Evidence'], ['notes', '📒 Notes'], ['accuse', '⚖️ Accuse']];
    caseTabs.innerHTML = tabs.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('');
    $$('[data-tab]', caseTabs).forEach(b => b.onclick = () => { tab = b.dataset.tab; person = null; renderCase(); caseBody.parentElement.scrollTop = 0; });
    ({ case: tabCase, people: tabPeople, evidence: tabEvidence, notes: tabNotes, accuse: tabAccuse })[tab]();
  }

  function progressHTML() {
    return `<div class="case-progress">
      <div><b>${S.lies.length}/${C.lies.length}</b><small>lies caught</small></div>
      <div><b>${S.cracked ? '✓' : '?'}</b><small>code cracked</small></div>
      <div><b>${S.mistakes}</b><small>wrong challenges</small></div></div>`;
  }

  function tabCase() {
    caseBody.innerHTML = `${S.solved ? `<div class="case-solved">Solved ${'★'.repeat(S.stars)}${'☆'.repeat(3 - S.stars)} · <button id="caseSolution">Read the solution</button></div>` : ''}
      <div class="case-intro">${C.intro.map(p => `<p>${esc(p)}</p>`).join('')}</div>
      ${progressHTML()}
      <div class="case-how"><b>How to play</b>
        <p>🗣️ <b>People:</b> ask questions. Answers marked ⚡ are claims you can challenge.</p>
        <p>🔎 <b>Evidence:</b> look closely. Some things only show up after someone cracks.</p>
        <p>⚡ <b>Challenge</b> a claim by presenting the evidence that proves it false.</p>
        <p>⚖️ <b>Accuse</b> when you know who, how and why.</p></div>
      <button class="big-btn" id="caseStart">${S.asked.length ? 'Keep investigating' : 'Start investigating'}</button>`;
    $('#caseStart').onclick = () => { tab = 'people'; renderCase(); };
    $('#caseSolution')?.addEventListener('click', showSolution);
  }

  function tabPeople() {
    if (person) return interview(person);
    caseBody.innerHTML = progressHTML() + Object.entries(C.people).map(([id, p]) => {
      const left = visibleTalks(id).filter(t => !S.asked.includes(t.id)).length;
      return `<button class="case-person" data-p="${id}"><span>${p.icon}</span><div><b>${esc(p.name)}</b><small>${esc(p.role)}</small></div>${left ? `<em>${left}</em>` : '<i>›</i>'}</button>`;
    }).join('');
    $$('[data-p]', caseBody).forEach(b => b.onclick = () => { person = b.dataset.p; renderCase(); });
  }

  function interview(id) {
    const p = C.people[id];
    const talks = visibleTalks(id);
    const asked = talks.filter(t => S.asked.includes(t.id)).sort((a, b) => S.asked.indexOf(a.id) - S.asked.indexOf(b.id));
    const open = talks.filter(t => !S.asked.includes(t.id));
    caseBody.innerHTML = `<button class="mys-back" id="caseBackPeople">‹ Everyone</button>
      <div class="case-who"><span>${p.icon}</span><div><b>${esc(p.name)}</b><small>${esc(p.role)}</small></div></div>
      <div class="case-chat">${asked.map(t => {
        const caught = C.lies.find(l => l.talk === t.id && S.lies.includes(l.id));
        return `<div class="q">${esc(t.q)}</div><div class="a ${t.statement ? 'claim' : ''} ${caught ? 'caught' : ''}">${esc(t.a)}
          ${t.statement ? (caught ? '<span class="lie-tag">LIE ✗</span>' : `<button class="challenge" data-t="${t.id}">⚡ Challenge</button>`) : ''}</div>`;
      }).join('')}</div>
      ${open.length ? `<div class="case-ask"><small>Ask ${esc(p.name.split(' ')[0])}…</small>${open.map(t => `<button data-ask="${t.id}">${esc(t.q)}</button>`).join('')}</div>` : '<p class="mys-tip">Nothing more to ask right now. Catch a lie and they might say more.</p>'}`;
    $('#caseBackPeople').onclick = () => { person = null; renderCase(); };
    $$('[data-ask]', caseBody).forEach(b => b.onclick = () => {
      S.asked.push(b.dataset.ask); saveCase(); renderCase();
      const chat = $$('.case-chat .a', caseBody); chat[chat.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    $$('[data-t]', caseBody).forEach(b => b.onclick = () => challenge(C.talks.find(t => t.id === b.dataset.t)));
  }

  function challenge(talk) {
    overlay.show(`<h2>⚡ Challenge</h2><p>"${esc(talk.a)}"</p><p><b>Which evidence proves this is false?</b></p>
      <div class="ev-pick">${visibleEvidence().map(([k, e]) => `<button data-ev="${k}"><span>${e.icon}</span>${esc(e.name)}</button>`).join('')}</div>
      <button class="big-btn alt" id="ovNo">Never mind</button>`, { '#ovNo': () => {} });
    $$('#overlayCard [data-ev]').forEach(b => b.onclick = e => {
      const lie = C.lies.find(l => l.talk === talk.id && l.evidence === b.dataset.ev);
      overlay.hide();
      if (lie) caughtLie(lie, e);
      else {
        S.mistakes++; saveCase();
        toast('Hmm. That doesn\'t prove it.');
        renderCase();
      }
    });
  }

  function caughtLie(lie, e) {
    S.lies.push(lie.id); saveCase();
    const el = document.createElement('div');
    el.className = 'objection';
    el.textContent = 'THAT\'S A LIE!';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1300);
    fx.flash('#ff4f6d', 0.5);
    fx.explode(innerWidth / 2, innerHeight * 0.4, '#ff4f6d', 3);
    document.body.classList.remove('uni-quake'); void document.body.offsetWidth; document.body.classList.add('uni-quake');
    haptic();
    if (window.uni?.on) { uni.boom(innerWidth / 2, innerHeight * 0.45, true); uni.phrase(innerWidth / 2, innerHeight * 0.6, pick(['caught in 4K 📸', 'the audacity 💅', 'not the alibi 💀'])); }
    const unlocked = [
      ...C.talks.filter(t => t.req === lie.id).map(t => `🗣️ New question: "${esc(t.q)}"`),
      ...Object.values(C.evidence).filter(ev => ev.req === lie.id).map(ev => `🔎 New evidence: ${ev.icon} ${esc(ev.name)}`),
    ];
    setTimeout(() => overlay.show(`<h2>Caught! 🔍</h2><p>${esc(lie.reveal)}</p>${unlocked.length ? `<div class="case-unlocked">${unlocked.map(u => `<div>${u}</div>`).join('')}</div>` : ''}
      <button class="big-btn" id="ovOk">Continue</button>`, { '#ovOk': renderCase }), 900);
  }

  function tabEvidence() {
    caseBody.innerHTML = progressHTML() + `<div class="ev-grid">${visibleEvidence().map(([k, e]) =>
      `<button data-ev="${k}" class="${e.cipher && !S.cracked ? 'locked' : ''}"><span>${e.icon}</span><b>${esc(e.name)}</b>${e.cipher && !S.cracked ? '<small>Coded 🔐</small>' : ''}</button>`).join('')}</div>`;
    $$('[data-ev]', caseBody).forEach(b => b.onclick = () => {
      const e = C.evidence[b.dataset.ev];
      if (e.cipher) return cipher(e);
      overlay.show(`<div class="ev-icon">${e.icon}</div><h2>${esc(e.name)}</h2><p class="ev-text">${esc(e.text)}</p><button class="big-btn" id="ovOk">Close</button>`, { '#ovOk': () => {} });
    });
  }

  // Letter-shift code: turn the dial until the words make sense
  const shiftText = (t, n) => t.replace(/[A-Z]/g, ch => String.fromCharCode((ch.charCodeAt(0) - 65 + n + 26) % 26 + 65));
  function cipher(e) {
    const coded = shiftText(C.cipher.plain, C.cipher.shift);
    let k = S.cracked ? C.cipher.shift : 0;
    const draw = () => {
      $('#ciText').textContent = shiftText(coded, -k);
      $('#ciKey').textContent = k;
      const ok = k === C.cipher.shift;
      $('#ciText').classList.toggle('ok', ok);
      if (ok && !S.cracked) {
        S.cracked = true; saveCase();
        fx.flash('#ffd166', 0.4); fx.confetti(80);
        if (window.uni?.on) uni.phrase(innerWidth / 2, innerHeight * 0.3, 'big brain 🧠');
        toast('🔓 Code cracked!');
      }
    };
    overlay.show(`<div class="ev-icon">📓</div><h2>Coded notebook</h2><p class="ev-text">${esc(e.text)} Each letter has been moved along the alphabet by the same number. Turn the dial until it reads properly.</p>
      <div class="cipher-text" id="ciText"></div>
      <div class="cipher-dial"><button id="ciDown">−</button><div><small>Shift back by</small><b id="ciKey">0</b></div><button id="ciUp">+</button></div>
      <button class="big-btn" id="ovOk">Close</button>`, { '#ovOk': renderCase });
    $('#ciDown').onclick = () => { k = (k + 25) % 26; draw(); };
    $('#ciUp').onclick = () => { k = (k + 1) % 26; draw(); };
    draw();
  }

  function tabNotes() {
    const notes = [];
    for (const id of S.asked) { const t = C.talks.find(x => x.id === id); if (t?.note) notes.push(['🗣️', t.note]); }
    for (const id of S.lies) { const l = C.lies.find(x => x.id === id); notes.push(['⚡', l.reveal]); }
    if (S.cracked) notes.push(['🔓', C.cipher.note]);
    caseBody.innerHTML = progressHTML() + (notes.length ? `<div class="case-notes">${notes.map(([i, n]) => `<div><span>${i}</span><p>${esc(n)}</p></div>`).join('')}</div>`
      : '<p class="mys-tip">Your notebook fills in as you find things out. Go and talk to people!</p>');
  }

  function tabAccuse() {
    const pickd = S.pick || {};
    caseBody.innerHTML = `<p class="mys-tip" style="text-align:left">${S.lies.length < C.lies.length ? `You've caught ${S.lies.length} of ${C.lies.length} lies. You can accuse now, but more evidence makes it easier.` : 'You\'ve caught every lie. Time to name the culprit.'}</p>
      ${Object.entries(C.accuse).map(([k, a]) => `<h3 class="mys-q">${esc(a.q)}</h3><div class="mys-opts small">${a.options.map((o, i) => `<button data-k="${k}" data-i="${i}" class="${pickd[k] === i ? 'sel' : ''}">${esc(o)}</button>`).join('')}</div>`).join('')}
      <button class="big-btn" id="caseAccuse" ${Object.keys(C.accuse).every(k => pickd[k] != null) ? '' : 'disabled'}>⚖️ Make the accusation</button>`;
    $$('[data-k]', caseBody).forEach(b => b.onclick = () => { S.pick = { ...pickd, [b.dataset.k]: +b.dataset.i }; saveCase(); renderCase(); });
    $('#caseAccuse').onclick = accuse;
  }

  function accuse() {
    const right = Object.entries(C.accuse).filter(([k, a]) => S.pick[k] === a.answer).length;
    const total = Object.keys(C.accuse).length;
    if (right < total) {
      S.wrongAccuse++; saveCase();
      overlay.show(`<h2>Not quite… 🤔</h2><p>${right} of ${total} parts of your accusation are right. Something doesn't add up yet.</p>
        <p>Tip: catch more lies and check your notebook.</p><button class="big-btn" id="ovOk">Keep investigating</button>`, { '#ovOk': () => {} });
      return;
    }
    S.solved = true;
    S.stars = S.wrongAccuse === 0 && S.mistakes <= 2 ? 3 : S.wrongAccuse <= 1 && S.mistakes <= 5 ? 2 : 1;
    saveCase();
    fx.flash('#ffd166', 0.6); fx.confetti(200); fx.fireworks(10, 2500);
    if (window.uni?.on) { fx.emojiRain(['🕵️', '🔍', '🦄', '✨'], 50); uni.phrase(innerWidth / 2, innerHeight * 0.3, 'case closed 💅'); }
    overlay.show(`<div class="det-dog"><img src="img/dog2.png" alt=""><span>🕵️</span></div>
      <h2>Case closed!</h2><div class="stars">${[1, 2, 3].map(i => `<span class="${i <= S.stars ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</span>`).join('')}</div>
      <p>The detective dog approves.</p>
      <button class="big-btn" id="ovSol">Read the full solution</button>`, { '#ovSol': showSolution });
  }

  function showSolution() {
    overlay.show(`<h2>The solution</h2><div class="case-solution">${C.solution.map(p => `<p>${esc(p)}</p>`).join('')}</div>
      <button class="big-btn" id="ovOk">Back to the desk</button>`, { '#ovOk': () => nav.go('mystery') });
  }

  screens.mystery = {
    onShow() { renderHub(); },
    meta: () => { const n = Object.values(solvedMini).filter(Boolean).length; return n ? `${n} mysteries solved` : 'Crime & clues'; },
  };
  screens.case = { onShow: renderCase };
})();
