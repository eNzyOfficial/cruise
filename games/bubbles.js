// Bubble Wrap: endless sheets to pop. Tap or drag across.
(() => {
  const sheet = $('#bbSheet');
  const COLS = 6, ROWS = 9;
  let total = store.get('bubblesPopped', 0), left = 0;

  const sound = {
    on: store.get('bubbleSound', false), ctx: null, buf: null,
    init() {
      try {
        this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
        this.ctx.resume();
        if (!this.buf) {
          // a short burst of noise sounds like a pop
          const len = this.ctx.sampleRate * 0.06;
          this.buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
          const d = this.buf.getChannelData(0);
          for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
        }
      } catch {}
    },
    pop() {
      if (!this.on || !this.ctx || !this.buf) return;
      const src = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      src.buffer = this.buf;
      f.type = 'bandpass'; f.frequency.value = 900 + Math.random() * 1400; f.Q.value = 1.2;
      g.gain.value = 0.9;
      src.connect(f).connect(g).connect(this.ctx.destination);
      src.start();
    },
  };
  const sb = $('#bbSound');
  const paintSound = () => sb.textContent = sound.on ? '🔊' : '🔇';
  sb.onclick = () => { sound.on = !sound.on; store.set('bubbleSound', sound.on); if (sound.on) { sound.init(); sound.pop(); } paintSound(); };
  paintSound();

  function newSheet(animate) {
    left = COLS * ROWS;
    const uniOn = window.uni?.on;
    sheet.innerHTML = Array.from({ length: COLS * ROWS }, (_, i) => {
      // the odd golden bubble, and in Unicorn mode a few hide the dog
      const special = Math.random() < 0.04 ? 'gold' : uniOn && Math.random() < 0.06 ? 'dog' : '';
      return `<i class="bb ${special}" data-i="${i}" style="--h:${(i * 37) % 360}"></i>`;
    }).join('');
    if (animate) { sheet.classList.remove('roll'); void sheet.offsetWidth; sheet.classList.add('roll'); }
    count();
  }
  const count = () => { $('#bbCount').textContent = `${total.toLocaleString()} popped`; };

  function pop(el) {
    if (!el || !el.classList.contains('bb') || el.classList.contains('popped')) return;
    el.classList.add('popped');
    total++; left--;
    if (total % 10 === 0) store.set('bubblesPopped', total);
    count();
    sound.pop();
    haptic();
    const b = el.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
    if (el.classList.contains('gold')) {
      fx.explode(x, y, '#ffd166', 2.5); fx.ring(x, y, '#ffd166', 90, 5, 600);
      toast('✨ Golden bubble!');
    } else if (el.classList.contains('dog')) {
      fx.emojiBurst(x, y, ['🐶', '🐾', '💜'], 8);
    } else {
      fx.sparkle(x, y, '#cfe8ff', 3, 2);
    }
    if (window.uni?.on) uni.boom(x, y, Math.random() < 0.1);
    if (left === 0) {
      fx.celebrate();
      setTimeout(() => newSheet(true), 700);
    }
  }

  // pop everything the finger passes over
  let down = false;
  sheet.addEventListener('pointerdown', e => {
    if (sound.on) sound.init();
    down = true;
    try { sheet.releasePointerCapture(e.pointerId); } catch {}
    pop(e.target.closest('.bb'));
  });
  window.addEventListener('pointermove', e => {
    if (!down || nav.current !== 'bubbles') return;
    pop(document.elementFromPoint(e.clientX, e.clientY)?.closest('.bb'));
  });
  window.addEventListener('pointerup', () => { down = false; store.set('bubblesPopped', total); });

  newSheet(false);
  screens.bubbles = {
    onShow() { count(); },
    meta: () => total ? `${total.toLocaleString()} popped` : 'Pop pop pop',
  };
})();
