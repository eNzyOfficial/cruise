// Unicorn mode 🦄🌈 — makes every screen ridiculously extra
const uni = (() => {
  let on = store.get('unicorn', false);
  const RAINBOW = ['#ff4fa3', '#ff9a3c', '#ffe14d', '#5dff9a', '#3cd5ff', '#9b6bff', '#ff6bf0'];
  const EMO = ['🦄', '🌈', '✨', '💖', '⭐', '🍭', '🦋', '💫', '🌸', '🍬', '👑', '💜', '🫧', '🎀'];
  const PHRASES = ['slay ✨', 'iconic', 'no cap 🧢', 'it\'s giving 🦄', 'periodt 💅', 'main character', 'bestie!!', 'ate that', 'mother 👑',
    'rizz 🌈', 'yasss', 'obsessed 💖', 'unreal 🤯', 'literally magic', 'vibes ✨', 'big brain 🧠', 'legend', 'sparkle overload', 'so extra', 'magical 🦋',
    'good boy!! 🐶', 'best boy ever', 'who\'s a good boy?!', 'puppy power 🐾', 'zoomies!!', 'boop 👃'];
  const DOGS = ['img/dog1.png', 'img/dog2.png', 'img/dog3.png'];
  DOGS.forEach(src => fx.addSticker(src));

  // floating emoji background
  const bg = document.createElement('div');
  bg.id = 'uniBg';
  bg.innerHTML = Array.from({ length: 16 }, (_, i) =>
    `<span style="left:${(i * 6.3 + Math.random() * 4) % 100}%;animation-delay:${-Math.random() * 14}s;animation-duration:${10 + Math.random() * 8}s;font-size:${18 + Math.random() * 22}px">${i % 4 === 1
      ? `<img class="uni-dog-float" src="${DOGS[i % DOGS.length]}" alt="">` : EMO[i % EMO.length]}</span>`).join('');
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
    if (Math.random() < 0.5) { el.classList.add('dog'); el.innerHTML = `<img src="${pick(DOGS)}" alt=""><span>🦄</span>`; }
    else el.textContent = '🦄';
    const dur = 1800 + Math.random() * 1200;
    el.style.top = (y ?? (60 + Math.random() * (innerHeight - 160))) + 'px';
    el.style.animationDuration = dur + 'ms';
    document.body.appendChild(el);
    const t = setInterval(() => {
      const b = el.getBoundingClientRect();
      for (let i = 0; i < 2; i++) fx.sparkle(b.left + 8, b.top + b.height * 0.6, pick(RAINBOW), 1, 1.5);
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
  }, 1400);

  // ---------- MAXIMUM DOPAMINE ----------
  const hud = document.createElement('div');
  hud.id = 'uniHud';
  hud.innerHTML = `<div class="uni-rizz" id="uniRizz"></div><div class="uni-ticker"><span id="uniTicker"></span></div>
    <button class="uni-off" id="uniOff">🦄 OFF</button><img class="uni-cursor" id="uniCursor" alt="">`;
  document.body.appendChild(hud);
  $('#uniTicker').textContent = (PHRASES.join('  ✦  ') + '  ✦  ').repeat(3);
  const cursor = $('#uniCursor');
  cursor.src = DOGS[0];
  let rizz = store.get('rizz', 0), taps = 0, cursorTimer;

  const ACHIEVEMENTS = { 1: 'Touched the screen', 5: 'Tapped 5 times (iconic)', 10: 'Double digits!!', 25: 'Certified tapper', 50: 'Main character energy',
    100: 'Literal legend', 200: 'Touch grass? Never', 500: 'Unicorn royalty 👑', 1000: 'Ascended 🦄' };
  function achievement(text) {
    const el = document.createElement('div');
    el.className = 'uni-achieve';
    el.innerHTML = `<b>🏆 ACHIEVEMENT UNLOCKED</b><span>${text}</span>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
    fx.fireworks(3, 600);
  }
  function paintRizz() { const r = $('#uniRizz'); r.textContent = `✨ RIZZ ${rizz.toLocaleString()} ✨`; r.classList.remove('bump'); void r.offsetWidth; r.classList.add('bump'); }

  function mega() {
    fx.flash(pick(RAINBOW), 0.8);
    fx.fireworks(10, 1200);
    fx.emojiRain(EMO, 50);
    for (let i = 0; i < 4; i++) setTimeout(() => runner(), i * 180);
    phrase(innerWidth / 2, innerHeight / 2, `MEGA COMBO ×${taps} 🤯`);
    document.body.classList.remove('uni-quake'); void document.body.offsetWidth; document.body.classList.add('uni-quake');
  }

  document.addEventListener('pointerdown', e => {
    if (!on || e.target.closest('#uniOff')) return;
    taps++;
    rizz += 7 + rand(71);
    store.set('rizz', rizz);
    paintRizz();
    haptic();
    fx.explode(e.clientX, e.clientY, pick(RAINBOW), 2.4);
    fx.emojiBurst(e.clientX, e.clientY, EMO, 6);
    fx.ring(e.clientX, e.clientY, pick(RAINBOW), 120, 5, 600);
    if (Math.random() < 0.5) fx.flash(pick(RAINBOW), 0.22);
    phrase(e.clientX, e.clientY - 50);
    document.body.classList.remove('uni-shake'); void document.body.offsetWidth; document.body.classList.add('uni-shake');
    if (ACHIEVEMENTS[taps]) achievement(ACHIEVEMENTS[taps]);
    if (taps % 25 === 0) mega();
    cursor.style.display = 'block';
    cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px';
    cursor.src = pick(DOGS);
  }, true);
  document.addEventListener('pointermove', e => {
    if (!on) return;
    if (e.buttons || e.pointerType === 'touch') { fx.trail(e.clientX, e.clientY); fx.trail(e.clientX, e.clientY); fx.trail(e.clientX, e.clientY); }
    cursor.style.display = 'block';
    cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px';
    clearTimeout(cursorTimer);
    cursorTimer = setTimeout(() => cursor.style.display = 'none', 900);
  }, true);
  document.addEventListener('click', e => {
    if (!on) return;
    const b = e.target.closest('button');
    if (!b) return;
    b.classList.remove('uni-pop'); void b.offsetWidth; b.classList.add('uni-pop');
    const t = b.textContent.trim();
    if (t.length === 1) { // a keyboard key: show it HUGE
      const el = document.createElement('div');
      el.className = 'uni-giant';
      el.textContent = t.toUpperCase();
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 700);
    }
  }, true);
  // scrolling sprays glitter
  document.addEventListener('scroll', () => { if (on) fx.glitter(Math.random() * innerWidth, innerHeight * 0.3 + Math.random() * innerHeight * 0.4, 3); }, true);
  // every screen change is an EVENT
  const go = nav.go;
  nav.go = id => {
    go(id);
    if (!on) return;
    fx.flash(pick(RAINBOW), 0.5);
    fx.emojiRain(EMO, 20);
    runner();
    phrase(innerWidth / 2, innerHeight * 0.35, pick([`entering ${id} era`, 'new screen who dis', 'plot twist!!', 'and we\'re BACK']));
  };
  // never-ending chaos drizzle
  setInterval(() => {
    if (!on || document.hidden) return;
    const r = Math.random();
    if (r < 0.2) fx.emojiRain(EMO, 6);
    else if (r < 0.35) fx.firework();
    else if (r < 0.45) runner();
    else fx.sparkle(Math.random() * innerWidth, Math.random() * innerHeight, pick(RAINBOW), 6, 3);
  }, 650);
  $('#uniOff').addEventListener('click', () => { if (on) $('#uniToggle').click(); });

  function apply() {
    document.body.classList.toggle('unicorn', on);
    if (on) paintRizz();
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
      setTimeout(() => phrase(innerWidth / 2, innerHeight * 0.55, 'feat. the best boy 🐶'), 900);
    } else {
      toast('Unicorn mode off');
    }
  });
  apply();

  return { get on() { return on; }, boom, boomEl, phrase, runner, RAINBOW, EMO };
})();
