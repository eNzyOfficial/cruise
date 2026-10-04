// A surprise for Tia: after 5pm she answers one question, then a photo pops up at random.
// The photo lives encrypted in surprise.enc.js (made by tools/seal.mjs) so it's never a public file.
const tia = (() => {
  const S = window.SURPRISE;
  if (!S) return { popPhoto: () => false };
  const AT = Date.parse(S.at);
  const card = $('#tiaCard'), body = $('#tiaBody');
  let data = null;
  let preview = false; // ?unlock=ANSWER: Carl checking it himself, nothing saved
  let st = { key: null, ...store.get('tia', {}) };
  const save = () => { if (!preview) store.set('tia', { key: st.key }); };

  const timeOk = () => preview || Date.now() >= AT;
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const toB64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const norm = s => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9฀-๿]/g, '');
  const html = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  async function decrypt(key) {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(S.iv) }, key, b64(S.data));
    return JSON.parse(new TextDecoder().decode(pt));
  }
  async function tryAnswer(answer, persist = true) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(norm(answer)), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(S.salt), iterations: S.iter, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
    try { data = await decrypt(key); } catch { return false; }
    if (persist) { st.key = toB64(await crypto.subtle.exportKey('raw', key)); save(); }
    return true;
  }
  async function autoUnlock() {
    if (!st.key || data) return;
    try {
      const key = await crypto.subtle.importKey('raw', b64(st.key), 'AES-GCM', false, ['decrypt']);
      data = await decrypt(key);
    } catch { st.key = null; save(); }
  }
  async function previewFromUrl() {
    const params = new URLSearchParams(location.search);
    const ans = params.get('unlock');
    if (ans == null) return;
    params.delete('unlock');
    history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash);
    if (await tryAnswer(ans, false)) { preview = true; toast('👀 Preview mode: nothing is saved'); }
    else toast('Preview: wrong answer');
  }

  // Home card only shows after 5pm and until she's answered
  function renderCard() {
    card.hidden = !timeOk() || !!data;
    if (card.hidden) return;
    card.innerHTML = `<span class="tia-env">🤭</span><div><b>Something for Tia</b><small>Tap to open</small></div><i>›</i>`;
    card.classList.add('glow');
  }
  card.addEventListener('click', () => nav.go('tia'));

  function render() {
    body.innerHTML = `<div class="tia-lock">
      <img src="img/dog1.png" alt="" class="tia-lock-dog">
      <h2>This is for Tia 🤭</h2>
      <p>Answer this to open it:</p>
      <b>What's our dog's name? 🐶</b>
      <input id="tiaAnswer" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" placeholder="Type his name">
      <button class="big-btn" id="tiaGo">Open</button>
      <div class="tia-err" id="tiaErr"></div></div>`;
    const go = async () => {
      $('#tiaGo').textContent = 'Opening…';
      if (!(await tryAnswer($('#tiaAnswer').value))) {
        $('#tiaGo').textContent = 'Open';
        $('#tiaErr').textContent = pick(['Nope 🙈 try again', 'Hmm, not quite 🐶', 'He says that\'s not his name 🐾']);
        $('#tiaAnswer').classList.remove('shake'); void $('#tiaAnswer').offsetWidth; $('#tiaAnswer').classList.add('shake');
        return;
      }
      renderCard();
      nav.go('home');
      setTimeout(popPhoto, 400);
    };
    $('#tiaGo').onclick = go;
    $('#tiaAnswer').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  }

  // The photo pops up at random
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
    const wait = first ? (preview ? 12000 : 60000 + Math.random() * 60000)
      : (window.uni?.on ? 90000 + Math.random() * 90000 : 240000 + Math.random() * 300000);
    setTimeout(() => { if (data && timeOk()) popPhoto(); schedulePhoto(false); }, wait);
  }

  screens.tia = { onShow: render };
  previewFromUrl().then(autoUnlock).then(() => { renderCard(); schedulePhoto(true); });
  setInterval(renderCard, 5000);
  return { popPhoto };
})();
window.tia = tia;
