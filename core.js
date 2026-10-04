// Reserve these names: otherwise the browser maps window.tia to the <section id="tia"> element
window.tia = null;
window.uni = null;

// Shared helpers: storage, navigation, overlay, toast
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem('cruise:' + key); return v == null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('cruise:' + key, JSON.stringify(value)); } catch {}
  },
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand = n => Math.floor(Math.random() * n);
const pick = arr => arr[rand(arr.length)];
const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = rand(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };

// Screen navigation. Games register an onShow hook.
const screens = {};
const nav = {
  current: 'home',
  go(id) {
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
    nav.current = id;
    screens[id]?.onShow?.();
    if (id !== 'home' && id !== 'bumpy') store.set('lastGame', id);
    if (id === 'home') refreshMeta();
  },
};
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-go]');
  if (btn) nav.go(btn.dataset.go);
});

function refreshMeta() {
  for (const id of Object.keys(screens)) {
    const el = $('#meta-' + id);
    if (el && screens[id].meta) el.textContent = screens[id].meta();
  }
}

const overlay = {
  show(html, actions) {
    $('#overlayCard').innerHTML = html;
    for (const [sel, fn] of Object.entries(actions || {})) {
      $(sel, $('#overlayCard')).addEventListener('click', () => { overlay.hide(); fn(); });
    }
    $('#overlay').classList.add('show');
  },
  hide() { $('#overlay').classList.remove('show'); },
};

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1400);
}

// Keep the screen awake while the app is open, where supported
let wakeLock;
async function keepAwake() {
  try { if ('wakeLock' in navigator && document.visibilityState === 'visible') wakeLock = await navigator.wakeLock.request('screen'); } catch {}
}
document.addEventListener('visibilitychange', keepAwake);
keepAwake();

// Stop iOS pinch zoom (double-tap zoom is handled by touch-action in CSS)
document.addEventListener('gesturestart', e => e.preventDefault());

window.addEventListener('load', refreshMeta);

// ---------- tiny haptic tap (iOS 18+ Safari; silently does nothing elsewhere) ----------
const haptic = (() => {
  let label;
  return () => {
    try {
      if (!label) {
        const input = document.createElement('input');
        input.type = 'checkbox'; input.setAttribute('switch', ''); input.id = 'hapticSwitch'; input.style.display = 'none';
        label = document.createElement('label'); label.htmlFor = 'hapticSwitch'; label.style.display = 'none';
        document.body.append(input, label);
      }
      label.click();
    } catch {}
  };
})();

// ---------- dictionary (loaded in the background, works offline) ----------
const POS_NAME = { n: 'noun', v: 'verb', a: 'adjective', r: 'adverb', x: '' };
const dict = {
  ready: null,
  load() {
    return this.ready ||= new Promise(res => {
      const s = document.createElement('script');
      s.src = 'defs.js'; s.onload = res; s.onerror = res;
      document.head.appendChild(s);
    });
  },
  async get(word) {
    await this.load();
    const raw = window.DEFS?.[word];
    if (!raw) return null;
    return raw.split('~').map(x => { const [p, d, e, l] = x.split('|'); return { p, d, e, l }; });
  },
};
setTimeout(() => dict.load(), 1200);

// Words the player has met: saved so they can review them later
// Each entry: { w: word, from: game, t: time, star: bool, knew: times answered "I knew it" }
const learned = {
  all() { return store.get('learned', []); },
  save(list) { store.set('learned', list.slice(0, 1000)); },
  add(word, from) {
    const list = learned.all();
    const old = list.find(x => x.w === word);
    const rest = list.filter(x => x.w !== word);
    rest.unshift({ ...old, w: word, from: old?.from || from, t: Date.now() });
    learned.save(rest);
  },
  patch(word, changes) { learned.save(learned.all().map(x => x.w === word ? { ...x, ...changes } : x)); },
  remove(word) { learned.save(learned.all().filter(x => x.w !== word)); },
};

function sensesHTML(senses, word) {
  if (!senses) return `<p class="def-none">No definition saved for this one. It's a real word, just a rare one.</p>`;
  const base = senses.find(s => s.l)?.l;
  return (base && base !== word ? `<div class="def-base">a form of <b>${base}</b></div>` : '') +
    senses.map(s => `<div class="def-sense">${POS_NAME[s.p] ? `<span class="def-pos">${POS_NAME[s.p]}</span>` : ''}
      <div class="def-text">${s.d}</div>${s.e ? `<div class="def-ex">"${s.e}"</div>` : ''}</div>`).join('');
}

// Bottom sheet showing a word's meaning
async function showDefinition(word, from) {
  const senses = await dict.get(word);
  learned.add(word, from);
  const sheet = $('#sheet');
  $('#sheetCard').innerHTML = `<div class="sheet-grab"></div>
    <div class="def-word">${word}</div>
    ${sensesHTML(senses, word)}
    <div class="def-saved">✓ Saved to My Words <button id="sheetStar"></button></div>
    <button class="big-btn alt" id="sheetClose">Close</button>`;
  sheet.classList.add('show');
  $('#sheetClose').onclick = hideSheet;
  const paintStar = () => {
    const on = learned.all().find(x => x.w === word)?.star;
    $('#sheetStar').textContent = on ? '★ Starred' : '☆ Star it';
    $('#sheetStar').classList.toggle('on', !!on);
  };
  $('#sheetStar').onclick = () => { learned.patch(word, { star: !learned.all().find(x => x.w === word)?.star }); paintStar(); };
  paintStar();
}
function hideSheet() { $('#sheet').classList.remove('show'); if (nav.current === 'mywords') screens.mywords?.onShow(); }
document.addEventListener('click', e => { if (e.target.id === 'sheet') hideSheet(); });
