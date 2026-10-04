// Surprises for Tia: hidden until 5pm, then unlocked with a secret answer.
// Content lives encrypted in surprise.enc.js (made by tools/seal.mjs).
const tia = (() => {
  const S = window.SURPRISE;
  if (!S) return { ready: false, heartAvailable: () => false };
  const AT = Date.parse(S.at);
  const ALL_OPEN = Date.parse('2026-10-04T23:00:00+07:00'); // every note opens by late tonight anyway
  const HEARTS = ['map', 'facts', 'wordle', 'wheel', 'fruit'];
  const card = $('#tiaCard'), body = $('#tiaBody');
  let data = null;
  let st = { key: null, hearts: [], read: [], notified: [], words: 0, wheel: false, quiz: null, welcomed: false, dogTaps: 0, ...store.get('tia', {}) };
  const save = () => { if (!preview) store.set('tia', st); };

  let preview = false; // ?unlock=ANSWER: Carl checking it himself, nothing saved
  const timeOk = () => preview || Date.now() >= AT;
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const toB64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const norm = s => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9฀-๿]/g, '');
  const html = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/\n/g, '<br>');

  async function decrypt(key) {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(S.iv) }, key, b64(S.data));
    return JSON.parse(new TextDecoder().decode(pt));
  }
  async function tryAnswer(answer, persist = true) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(norm(answer)), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(S.salt), iterations: S.iter, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
    try { data = await decrypt(key); } catch { return false; }
    if (!persist) return true;
    st.key = toB64(await crypto.subtle.exportKey('raw', key));
    save();
    return true;
  }
  async function autoUnlock() {
    if (!st.key || data) return;
    try {
      const key = await crypto.subtle.importKey('raw', b64(st.key), 'AES-GCM', false, ['decrypt']);
      data = await decrypt(key);
    } catch { st.key = null; save(); }
  }

  // Preview link: ?unlock=ANSWER opens everything for this visit only, ignoring the 5pm lock
  async function previewFromUrl() {
    const params = new URLSearchParams(location.search);
    const ans = params.get('unlock');
    if (ans == null) return;
    params.delete('unlock');
    history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash);
    if (await tryAnswer(ans, false)) { preview = true; toast('👀 Preview mode: nothing is saved'); }
    else toast('Preview: wrong answer');
  }

  // ---------- notes that open as the flight goes ----------
  function noteOpen(n) {
    if (preview || Date.now() >= ALL_OPEN) return true;
    if (!flight.active()) return false;
    if (flight.landed()) return true;
    const idx = phases().findIndex(p => p.name === flight.phase().name);
    const need = { taxi: 0, climb: 1, cruise: 2, descent: 3 }[n.when];
    if (n.when === 'half') return flight.progress() >= 0.5;
    if (n.when === 'landed') return false;
    return idx >= need;
  }
  const unread = () => data ? data.notes.filter(n => noteOpen(n) && !st.read.includes(n.id)) : [];

  function letter(title, text, extra = '') {
    overlay.show(`<div class="letter"><div class="letter-title">${html(title)}</div><div class="letter-text">${html(text)}</div>${extra}</div>
      <button class="big-btn" id="ovClose">💜</button>`, { '#ovClose': () => { if (nav.current === 'tia') render(); } });
    fx.emojiBurst(innerWidth / 2, innerHeight * 0.3, ['💜', '💖', '✨'], 10);
  }

  // ---------- hearts ----------
  function heartAvailable(id) { return !!data && !st.hearts.includes(id); }
  function findHeart(id, x = innerWidth / 2, y = innerHeight / 2) {
    if (!heartAvailable(id)) return;
    st.hearts.push(id);
    save();
    haptic();
    fx.explode(x, y, '#ff4f8b', 3);
    fx.emojiBurst(x, y, ['💖', '💗', '💕', '💜'], 16);
    fx.ring(x, y, '#ff4f8b', 140, 6, 700);
    toast(`💖 Heart ${st.hearts.length} of 5 found!`);
    renderCard();
    if (st.hearts.length === HEARTS.length) {
      setTimeout(() => {
        fx.flash('#ff8fc7', 0.6); fx.confetti(200); fx.fireworks(10, 2500);
        fx.emojiRain(['💖', '💜', '💕', '✨', '🐶'], 50);
        letter(data.hearts.final.title, data.hearts.final.text);
      }, 1200);
    }
  }

  // ---------- home card ----------
  function renderCard() {
    if (!timeOk()) { card.hidden = true; return; }
    card.hidden = false;
    if (!data) {
      card.innerHTML = `<span class="tia-env">💌</span><div><b>Something for Tia</b><small>Tap to open</small></div><i>›</i>`;
      card.classList.add('glow');
      return;
    }
    const n = unread().length;
    card.innerHTML = `<span class="tia-env">💌</span><div><b>For Tia</b><small>${n ? `${n} new note${n > 1 ? 's' : ''} from Carl · ` : ''}💖 ${st.hearts.length}/5 hearts</small></div>${n ? `<em>${n}</em>` : '<i>›</i>'}`;
    card.classList.toggle('glow', n > 0 || !st.welcomed);
  }
  card.addEventListener('click', () => nav.go('tia'));

  // ---------- the Tia screen ----------
  async function render() {
    await autoUnlock();
    if (!data) {
      body.innerHTML = `<div class="tia-lock">
        <img src="img/dog1.png" alt="" class="tia-lock-dog">
        <h2>This is for Tia 💜</h2>
        <p>Answer this to open it:</p>
        <b>What's our dog's name? 🐶</b>
        <input id="tiaAnswer" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" placeholder="Type his name">
        <button class="big-btn" id="tiaGo">Open</button>
        <div class="tia-err" id="tiaErr"></div></div>`;
      const go = async () => {
        $('#tiaGo').textContent = 'Opening…';
        const ok = await tryAnswer($('#tiaAnswer').value);
        if (!ok) {
          $('#tiaGo').textContent = 'Open';
          $('#tiaErr').textContent = pick(['Nope 🙈 try again', 'Hmm, not quite 🐶', 'He says that\'s not his name 🐾']);
          $('#tiaAnswer').classList.remove('shake'); void $('#tiaAnswer').offsetWidth; $('#tiaAnswer').classList.add('shake');
          return;
        }
        fx.flash('#ff8fc7', 0.6); fx.confetti(180); fx.fireworks(8, 1800); fx.emojiRain(['💜', '💖', '🐶', '✨'], 40);
        renderCard();
        render();
      };
      $('#tiaGo').onclick = go;
      $('#tiaAnswer').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      return;
    }
    if (!st.welcomed) { st.welcomed = true; save(); setTimeout(() => letter(data.welcome.title, data.welcome.text), 300); }

    const best = store.get('fruitBest', 1) - 1; // fruit levels beaten
    body.innerHTML = `
      <div class="tia-hero"><img src="img/dog2.png" alt="" id="tiaDog"><div><h1>For ${html(data.name)} 💜</h1><p>From Carl (and the dog)</p></div></div>

      <h2 class="section-title">Notes from Carl</h2>
      <div class="tia-notes">${[data.welcome, ...data.notes].map((n, i) => {
        const open = i === 0 || noteOpen(n);
        const isNew = i > 0 && open && !st.read.includes(n.id);
        return `<button class="tia-note ${open ? 'open' : 'locked'} ${isNew ? 'new' : ''}" data-note="${i}">
          <span>${open ? (isNew ? '💌' : '📖') : '🔒'}</span><div><b>${open ? html(n.title) : 'Sealed'}</b><small>${i === 0 ? 'Start here' : html(n.label)}</small></div>${isNew ? '<em>new</em>' : ''}</button>`;
      }).join('')}</div>
      ${!flight.active() ? '<p class="tia-tip">Notes open as your flight goes. Tap <b>Start</b> on the home screen when the plane starts moving.</p>' : ''}

      <h2 class="section-title">Heart hunt 💖 ${st.hearts.length}/5</h2>
      <div class="tia-hearts">${HEARTS.map(h => `<div class="tia-heart ${st.hearts.includes(h) ? 'got' : ''}"><span>${st.hearts.includes(h) ? '💖' : '🤍'}</span><small>${st.hearts.includes(h) ? 'Found!' : html(data.hearts.hints[h])}</small></div>`).join('')}</div>
      ${st.hearts.length === 5 ? '<button class="big-btn" id="tiaFinal">Read the final letter 💖</button>' : ''}

      <h2 class="section-title">Just for you</h2>
      <div class="tia-grid">
        <button id="tiaQuiz"><span>🧠</span><b>How well do you know Carl?</b><small>${st.quiz == null ? '8 questions' : `Best: ${st.quiz}/8`}</small></button>
        <button id="tiaCompliment"><span>💐</span><b>Compliment button</b><small>Tap as often as you like</small></button>
      </div>

      <h2 class="section-title">Love coupons 🎟️</h2>
      <div class="tia-coupons">${data.coupons.map(c => {
        const got = best >= c.level;
        return `<div class="tia-coupon ${got ? 'got' : ''}"><span>${got ? c.emoji : '🔒'}</span><div><b>${got ? html(c.title) : 'Locked'}</b><small>${got ? 'Show Carl to redeem' : `Beat Fruit Swap level ${c.level}`}</small></div></div>`;
      }).join('')}</div>

      <h2 class="section-title">Chiang Mai ideas</h2>
      <div class="tia-cm">${data.chiangmai.map(c => `<div class="tia-cm-row"><span>${c.emoji}</span><div><b>${html(c.title)}</b><small>${html(c.text)}</small></div></div>`).join('')}</div>
      <p class="tia-tip">Psst: try tapping the dog at the top. A lot. 🐾</p>`;

    $$('[data-note]', body).forEach(b => b.onclick = () => {
      const i = +b.dataset.note;
      const n = i === 0 ? data.welcome : data.notes[i - 1];
      if (i > 0 && !noteOpen(n)) { toast(`Opens: ${n.label.toLowerCase()}`); return; }
      if (i > 0 && !st.read.includes(n.id)) { st.read.push(n.id); save(); renderCard(); }
      letter(n.title, n.text);
    });
    $('#tiaFinal')?.addEventListener('click', () => letter(data.hearts.final.title, data.hearts.final.text));
    $('#tiaQuiz').onclick = quiz;
    $('#tiaCompliment').onclick = e => {
      const p = { x: e.clientX, y: e.clientY };
      fx.emojiBurst(p.x, p.y, ['💐', '💖', '✨', '🌸'], 10);
      overlay.show(`<div class="compliment">${html(pick(data.compliments))}</div>
        <button class="big-btn" id="ovMore">Another one 💐</button><button class="big-btn alt" id="ovNo">Thanks 💜</button>`,
        { '#ovMore': () => $('#tiaCompliment').click(), '#ovNo': () => {} });
    };
    $('#tiaDog').onclick = e => {
      st.dogTaps++; save();
      const d = $('#tiaDog');
      d.classList.remove('boing'); void d.offsetWidth; d.classList.add('boing');
      fx.emojiBurst(e.clientX, e.clientY, ['🐾', '💜', '🦴'], 4);
      if (st.dogTaps % 10 === 0) {
        fx.confetti(120); fx.emojiRain(['🐶', '🐾', '🦴', '💜'], 40);
        setTimeout(() => letter(data.dogMessage.title, data.dogMessage.text), 500);
      } else toast(`${10 - (st.dogTaps % 10)} more 🐾`);
    };
  }

  // ---------- quiz ----------
  function quiz() {
    let i = 0, score = 0;
    const qs = data.quiz;
    const ask = () => {
      if (i >= qs.length) {
        st.quiz = Math.max(st.quiz ?? 0, score); save();
        const msg = score === qs.length ? 'You know me better than I know myself 💜' : score >= qs.length - 2 ? 'Okay, you really know me 😍' : 'We need more date nights to study 😅';
        if (score >= qs.length - 2) { fx.confetti(150); fx.fireworks(6, 1500); }
        overlay.show(`<h2>${score}/${qs.length}</h2><p>${msg}</p><button class="big-btn" id="ovAgain">Play again</button><button class="big-btn alt" id="ovNo">Done</button>`,
          { '#ovAgain': quiz, '#ovNo': render });
        return;
      }
      const q = qs[i];
      overlay.show(`<div class="fc-count">Question ${i + 1} of ${qs.length}</div><h2 class="quiz-q">${html(q.q)}</h2>
        <div class="quiz-opts">${q.options.map((o, k) => `<button data-k="${k}">${html(o)}</button>`).join('')}</div>`, {});
      $$('#overlayCard .quiz-opts button').forEach(b => b.onclick = e => {
        const k = +b.dataset.k, right = k === q.a;
        $$('#overlayCard .quiz-opts button').forEach(x => { x.disabled = true; if (+x.dataset.k === q.a) x.classList.add('right'); });
        if (right) { score++; fx.explode(e.clientX, e.clientY, '#5dff9a', 2); fx.emojiBurst(e.clientX, e.clientY, ['💜', '✨'], 6); }
        else b.classList.add('wrong');
        setTimeout(() => { i++; ask(); }, 1100);
      });
    };
    ask();
  }

  // ---------- hooks used by the games ----------
  const api = {
    get ready() { return !!data; },
    popPhoto,
    heartAvailable,
    findHeart,
    nextWord() { return data && st.words < data.words.length ? data.words[st.words] : null; },
    wordDone() { st.words++; save(); },
    wordWhy(w) { return data?.words.find(x => x.word === w)?.why; },
    wheelPending() { return !!data && !st.wheel; },
    wheelBase() { return data?.wheel.base; },
    wheelDone() { st.wheel = true; save(); },
    wheelWhy() { return data?.wheel.why; },
  };

  // new notes pop up wherever she is
  function checkNew() {
    renderCard();
    if (!data) return;
    for (const n of data.notes) {
      if (noteOpen(n) && !st.notified.includes(n.id)) {
        st.notified.push(n.id); save();
        const el = document.createElement('button');
        el.className = 'tia-banner';
        el.innerHTML = `<span>💌</span><div><b>New note from Carl</b><small>${html(n.label)}</small></div>`;
        el.onclick = () => { el.remove(); st.read.includes(n.id) || st.read.push(n.id); save(); renderCard(); letter(n.title, n.text); };
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 9000);
        fx.emojiBurst(innerWidth / 2, 80, ['💌', '💜', '✨'], 10);
        haptic();
        break;
      }
    }
  }

  // ---------- the surprise photo: pops up at random ----------
  function popPhoto() {
    if (!data?.photo || document.hidden || $('#overlay').classList.contains('show') || $('.tia-photo')) return false;
    const el = document.createElement('button');
    el.className = 'tia-photo';
    el.style.setProperty('--r', (Math.random() * 10 - 5) + 'deg');
    el.innerHTML = `<img src="${data.photo.src}" alt=""><b>${html(data.photo.caption)}</b><small>${html(data.photo.sub || '')}</small>`;
    document.body.appendChild(el);
    const b = el.getBoundingClientRect();
    fx.emojiBurst(b.left + b.width / 2, b.top + 40, ['🤭', '😂', '💜', '👢'], 10);
    haptic();
    const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 400); };
    el.onclick = close;
    setTimeout(close, 7000);
    return true;
  }
  function schedulePhoto(first) {
    const uniOn = window.uni?.on;
    const wait = first ? (preview ? 12000 : 60000 + Math.random() * 60000) : (uniOn ? 90000 + Math.random() * 90000 : 240000 + Math.random() * 300000);
    setTimeout(() => { if (data && timeOk()) popPhoto(); schedulePhoto(false); }, wait);
  }

  screens.tia = { onShow: render };
  previewFromUrl().then(autoUnlock).then(() => { renderCard(); checkNew(); schedulePhoto(true); });
  setInterval(checkNew, 5000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkNew(); });
  return api;
})();
window.tia = tia;
