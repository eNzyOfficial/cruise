// Unicorn mode 🦄🌈 — makes every screen ridiculously extra
const uni = (() => {
  let on = store.get('unicorn', false);
  const RAINBOW = ['#ff4fa3', '#ff9a3c', '#ffe14d', '#5dff9a', '#3cd5ff', '#9b6bff', '#ff6bf0'];
  const EMO = ['🦄', '🌈', '✨', '💖', '⭐', '🍭', '🦋', '💫', '🌸', '🍬', '👑', '💜', '🫧', '🎀'];
  const PHRASES = ['slay ✨', 'iconic', 'no cap 🧢', 'it\'s giving 🦄', 'periodt 💅', 'main character', 'bestie!!', 'ate that', 'mother 👑',
    'rizz 🌈', 'yasss', 'obsessed 💖', 'unreal 🤯', 'literally magic', 'vibes ✨', 'big brain 🧠', 'legend', 'sparkle overload', 'so extra', 'magical 🦋'];

  // floating emoji background
  const bg = document.createElement('div');
  bg.id = 'uniBg';
  bg.innerHTML = Array.from({ length: 16 }, (_, i) =>
    `<span style="left:${(i * 6.3 + Math.random() * 4) % 100}%;animation-delay:${-Math.random() * 14}s;animation-duration:${10 + Math.random() * 8}s;font-size:${18 + Math.random() * 22}px">${EMO[i % EMO.length]}</span>`).join('');
  document.body.prepend(bg);

  const center = el => { const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; };

  function phrase(x, y, text) {
    const el = document.createElement('div');
    el.className = 'uni-phrase';
    el.textContent = text || pick(PHRASES);
    el.style.left = Math.max(70, Math.min(innerWidth - 70, x)) + 'px';
    el.style.top = y + 'px';
    el.style.setProperty('--r', (Math.random() * 24 - 12) + 'deg');
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  function boom(x, y, big) {
    if (!on) return;
    fx.explode(x, y, pick(RAINBOW), big ? 3 : 1.4);
    fx.emojiBurst(x, y, EMO, big ? 12 : 4);
    if (big) { fx.ring(x, y, pick(RAINBOW), 140, 6, 700); phrase(x, y - 30); }
  }
  const boomEl = (el, big) => { if (on && el) { const p = center(el); boom(p.x, p.y, big); } };

  // a unicorn gallops across the screen leaving a rainbow trail
  function runner(y) {
    const el = document.createElement('div');
    el.className = 'uni-runner';
    el.textContent = '🦄';
    const dur = 1800 + Math.random() * 1200;
    el.style.top = (y ?? (60 + Math.random() * (innerHeight - 160))) + 'px';
    el.style.animationDuration = dur + 'ms';
    document.body.appendChild(el);
    const t = setInterval(() => {
      const b = el.getBoundingClientRect();
      for (let i = 0; i < 2; i++) fx.sparkle(b.right - 8, b.top + b.height * 0.6, pick(RAINBOW), 1, 1.5);
    }, 40);
    setTimeout(() => { clearInterval(t); el.remove(); }, dur);
  }

  function stampede() {
    for (let i = 0; i < 6; i++) setTimeout(() => runner(), i * 220);
  }

  // ambient chaos
  setInterval(() => {
    if (!on || document.hidden) return;
    const r = Math.random();
    if (r < 0.25) runner();
    else if (r < 0.55) phrase(60 + Math.random() * (innerWidth - 120), 120 + Math.random() * (innerHeight - 260));
    else fx.sparkle(Math.random() * innerWidth, Math.random() * innerHeight, pick(RAINBOW), 8, 3);
  }, 2200);

  // every touch sparkles, dragging leaves a rainbow trail, every button pops
  document.addEventListener('pointerdown', e => {
    if (!on) return;
    fx.sparkle(e.clientX, e.clientY, pick(RAINBOW), 8, 4);
    fx.emojiBurst(e.clientX, e.clientY, EMO, 2);
  }, true);
  document.addEventListener('pointermove', e => {
    if (on && (e.buttons || e.pointerType === 'touch')) fx.trail(e.clientX, e.clientY);
  }, true);
  document.addEventListener('click', e => {
    if (!on) return;
    const b = e.target.closest('button');
    if (!b) return;
    b.classList.remove('uni-pop'); void b.offsetWidth; b.classList.add('uni-pop');
    if (Math.random() < 0.15) phrase(e.clientX, e.clientY - 40);
  }, true);

  function apply() {
    document.body.classList.toggle('unicorn', on);
    const t = $('#uniToggle');
    t.setAttribute('aria-pressed', on);
    t.classList.toggle('on', on);
  }
  $('#uniToggle').addEventListener('click', () => {
    on = !on;
    store.set('unicorn', on);
    apply();
    if (on) {
      fx.flash('#ff6bf0', 0.6);
      fx.emojiRain(['🦄', '🌈', '✨', '💖', '🦋', '🍭'], 60);
      fx.fireworks(8, 1500);
      stampede();
      phrase(innerWidth / 2, innerHeight * 0.4, 'UNICORN MODE 🦄🌈');
    } else {
      toast('Unicorn mode off');
    }
  });
  apply();

  return { get on() { return on; }, boom, boomEl, phrase, runner, RAINBOW, EMO };
})();
