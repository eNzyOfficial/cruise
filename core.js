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
