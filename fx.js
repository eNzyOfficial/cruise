// Sparkles, glitter, rings and confetti drawn on one full-screen canvas
const fx = (() => {
  const cv = document.createElement('canvas');
  cv.id = 'fx';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, last = 0, running = false;
  const parts = [];
  const MAX = 1400;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  const GOLD = ['#ffe9a8', '#ffd166', '#fff3d1', '#ffb3d9', '#ffffff'];
  // Unicorn mode doubles everything and paints it rainbow
  const RBW = ['#ff4fa3', '#ff9a3c', '#ffe14d', '#5dff9a', '#3cd5ff', '#9b6bff', '#ff6bf0'];
  const U = () => window.uni?.on;
  const col = c => (U() && Math.random() < 0.7 ? pick(RBW) : c);
  const more = n => (U() ? Math.round(n * 2) : n);
  const add = p => { if (parts.length < MAX) parts.push({ born: performance.now(), rot: 0, vr: 0, g: 0, drag: 1, ...p }); start(); };

  function star(x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = rot + i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  }

  function draw(p, t) {
    const fade = 1 - t;
    if (p.kind === 'spark') {
      const tw = 0.6 + 0.4 * Math.sin((performance.now() - p.born) / 60 + p.seed);
      const r = p.size * (t < 0.15 ? t / 0.15 : fade) * tw;
      ctx.globalAlpha = Math.min(1, fade * 1.4);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.2);
      g.addColorStop(0, p.color); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(p.x - r * 2.2, p.y - r * 2.2, r * 4.4, r * 4.4);
      ctx.fillStyle = '#fff';
      star(p.x, p.y, r, p.rot);
    } else if (p.kind === 'glitter') {
      ctx.globalAlpha = fade;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      const flip = Math.abs(Math.cos(p.rot * 2));
      ctx.fillRect(-p.size / 2, -p.size * flip / 2, p.size, p.size * flip + 0.5);
      ctx.restore();
    } else if (p.kind === 'ring') {
      ctx.globalAlpha = fade * 0.9;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.width * fade + 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r0 + (p.r1 - p.r0) * (1 - Math.pow(1 - t, 3)), 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === 'blob') {
      ctx.globalAlpha = fade;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.4 + fade * 0.6), 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = fade * 0.6; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.25 * fade, 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === 'ray') {
      ctx.globalAlpha = fade;
      ctx.strokeStyle = p.color; ctx.lineWidth = p.size * fade + 0.5; ctx.lineCap = 'round';
      const d0 = p.len * t, d1 = p.len * Math.min(1, t * 1.8 + 0.2);
      ctx.beginPath();
      ctx.moveTo(p.x + Math.cos(p.a) * d0, p.y + Math.sin(p.a) * d0);
      ctx.lineTo(p.x + Math.cos(p.a) * d1, p.y + Math.sin(p.a) * d1);
      ctx.stroke();
    } else if (p.kind === 'emoji') {
      ctx.globalAlpha = Math.min(1, fade * 2);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.font = `${p.size}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.char, 0, 0);
      ctx.restore();
    } else if (p.kind === 'bolt') {
      ctx.globalAlpha = fade;
      for (const [w, col] of [[p.size * 3, p.color], [p.size, '#ffffff']]) {
        ctx.strokeStyle = col; ctx.lineWidth = w * fade + 0.5; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(p.x0, p.y0);
        const segs = 7;
        for (let i = 1; i < segs; i++) {
          const k = i / segs, j = (Math.random() - 0.5) * 18;
          const nx = -(p.y1 - p.y0), ny = p.x1 - p.x0, nl = Math.hypot(nx, ny) || 1;
          ctx.lineTo(p.x0 + (p.x1 - p.x0) * k + nx / nl * j, p.y0 + (p.y1 - p.y0) * k + ny / nl * j);
        }
        ctx.lineTo(p.x1, p.y1); ctx.stroke();
      }
    } else if (p.kind === 'rocket') {
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill();
      if (Math.random() < 0.7) parts.push({ kind: 'spark', x: p.x, y: p.y, vx: (Math.random() - 0.5), vy: 1, g: 0.05, drag: 0.95, size: 3, color: p.color, life: 400, born: performance.now(), seed: 1, rot: 0, vr: 0.1 });
    } else if (p.kind === 'beam') {
      ctx.globalAlpha = fade;
      const g = p.horizontal
        ? ctx.createLinearGradient(0, p.y - p.w, 0, p.y + p.w)
        : ctx.createLinearGradient(p.x - p.w, 0, p.x + p.w, 0);
      g.addColorStop(0, 'transparent'); g.addColorStop(0.5, p.color); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      const grow = 1 - Math.pow(1 - Math.min(1, t * 3), 3);
      if (p.horizontal) ctx.fillRect(p.x0 + (p.x1 - p.x0) * (0.5 - grow / 2), p.y - p.w, (p.x1 - p.x0) * grow, p.w * 2);
      else ctx.fillRect(p.x - p.w, p.y0 + (p.y1 - p.y0) * (0.5 - grow / 2), p.w * 2, (p.y1 - p.y0) * grow);
    }
  }

  function loop(now) {
    const dt = Math.min(3, (now - (last || now)) / 16.67);
    last = now;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      const t = (now - p.born) / p.life;
      if (t >= 1) { parts.splice(i, 1); p.onDone?.(p); continue; }
      if (t < 0) continue;
      p.vy += p.g * dt;
      p.vx *= Math.pow(p.drag, dt); p.vy *= Math.pow(p.drag, dt);
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += p.vr * dt;
      ctx.globalCompositeOperation = p.kind === 'glitter' ? 'source-over' : 'lighter';
      draw(p, t);
    }
    ctx.globalAlpha = 1;
    if (parts.length) requestAnimationFrame(loop);
    else { running = false; last = 0; ctx.clearRect(0, 0, W, H); }
  }
  function start() { if (!running) { running = true; requestAnimationFrame(loop); } }

  const api = {
    sparkle(x, y, color = '#ffd166', n = 8, speed = 4) {
      for (let i = 0; i < more(n); i++) {
        const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random());
        add({ kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 0.92, g: 0.04, size: 4 + Math.random() * 6,
          color: col(Math.random() < 0.5 ? color : pick(GOLD)), life: 500 + Math.random() * 500, seed: Math.random() * 9, rot: Math.random(), vr: 0.08 });
      }
    },
    glitter(x, y, n = 10, colors = GOLD, speed = 5) {
      if (U()) colors = RBW;
      for (let i = 0; i < more(n); i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.6, v = speed * (0.5 + Math.random());
        add({ kind: 'glitter', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.18, drag: 0.97, size: 3 + Math.random() * 4,
          color: pick(colors), life: 900 + Math.random() * 700, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4 });
      }
    },
    ring(x, y, color = '#ffd166', r1 = 60, width = 4, life = 500) {
      add({ kind: 'ring', x, y, vx: 0, vy: 0, r0: 4, r1, width, color, life });
    },
    beam(rect, horizontal, color = '#fff3d1') {
      if (horizontal) add({ kind: 'beam', horizontal, x0: rect.left, x1: rect.right, y: rect.y, w: rect.w, x: 0, vx: 0, vy: 0, color, life: 550 });
      else add({ kind: 'beam', horizontal, y0: rect.top, y1: rect.bottom, x: rect.x, w: rect.w, y: 0, vx: 0, vy: 0, color, life: 550 });
    },
    confetti(n = 120) {
      n = more(n);
      const colors = ['#ff6b9d', '#ffd166', '#7ee3c8', '#b28dff', '#ff9f5a', '#ffffff', '#7cb4ff'];
      for (let i = 0; i < n; i++) {
        add({ kind: 'glitter', x: Math.random() * W, y: -20 - Math.random() * H * 0.4, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3,
          g: 0.05, drag: 0.995, size: 6 + Math.random() * 6, color: pick(colors), life: 2600 + Math.random() * 1400, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3 });
      }
    },
    // juicy explosion: splash blobs, star rays, sparkles, glitter and a shockwave
    explode(x, y, color = '#ffd166', power = 1) {
      if (U() && Math.random() < 0.35) api.emojiBurst(x, y, ['🦄', '🌈', '✨', '💖'], 2);
      color = col(color);
      const n = more(Math.round(6 * power));
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = (3 + Math.random() * 5) * Math.sqrt(power);
        add({ kind: 'blob', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, g: 0.25, drag: 0.97, size: 3 + Math.random() * 4, color, life: 600 + Math.random() * 400 });
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.random() * 0.3;
        add({ kind: 'ray', x, y, vx: 0, vy: 0, a, len: 26 + 18 * power, size: 3, color: i % 2 ? '#fff6d6' : color, life: 380 });
      }
      api.sparkle(x, y, color, Math.round(5 * power), 4 + power);
      api.glitter(x, y, Math.round(4 * power), [color, '#ffd166', '#ffffff', '#ff9fc8'], 4 + power);
      api.ring(x, y, color, 22 + 14 * power, 3, 420);
    },
    firework(x, y, color) {
      color ||= pick(['#ff6b9d', '#ffd166', '#7ee3c8', '#b28dff', '#7cb4ff', '#ff9f5a']);
      add({ kind: 'rocket', x, y: H + 10, vx: (Math.random() - 0.5) * 1.5, vy: -(Math.sqrt(2 * 0.22 * (H + 10 - y))), g: 0.22, drag: 1, color,
        life: 1000 * Math.sqrt(2 * (H + 10 - y) / 0.22) / 60 / 1.0,
        onDone: p => {
          for (let i = 0; i < 46; i++) {
            const a = (i / 46) * Math.PI * 2, v = 3 + Math.random() * 4;
            add({ kind: 'spark', x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.06, drag: 0.95, size: 3 + Math.random() * 4, color: Math.random() < 0.7 ? color : '#ffffff', life: 900 + Math.random() * 600, seed: Math.random() * 9, rot: 0, vr: 0.1 });
          }
          api.glitter(p.x, p.y, 16, [color, '#ffd166', '#fff'], 6);
          api.ring(p.x, p.y, color, 90, 3, 600);
        } });
    },
    fireworks(n = 6, spread = 1800) {
      for (let i = 0; i < n; i++) setTimeout(() => api.firework(W * (0.15 + Math.random() * 0.7), H * (0.12 + Math.random() * 0.35)), (i / n) * spread);
    },
    emojiRain(chars = ['👑', '💎', '✨', '💖'], n = 24) {
      for (let i = 0; i < n; i++) {
        add({ kind: 'emoji', char: pick(chars), x: Math.random() * W, y: -30 - Math.random() * 200, vx: (Math.random() - 0.5) * 1.5, vy: 2 + Math.random() * 3,
          g: 0.08, drag: 0.995, size: 22 + Math.random() * 20, life: 2200 + Math.random() * 1000, rot: (Math.random() - 0.5), vr: (Math.random() - 0.5) * 0.08 });
      }
    },
    emojiBurst(x, y, chars, n = 10) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 6;
        add({ kind: 'emoji', char: pick(chars), x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, g: 0.22, drag: 0.98, size: 20 + Math.random() * 18, life: 1100 + Math.random() * 500, rot: 0, vr: (Math.random() - 0.5) * 0.3 });
      }
    },
    bolt(x0, y0, x1, y1, color = '#bde0ff') {
      add({ kind: 'bolt', x0, y0, x1, y1, x: 0, y: 0, vx: 0, vy: 0, size: 2.5, color, life: 420 });
    },
    trail(x, y) {
      add({ kind: 'spark', x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 10, vx: (Math.random() - 0.5) * 1.5, vy: -Math.random() * 1.5, g: 0.02, drag: 0.96,
        size: 3 + Math.random() * 4, color: pick(['#ffd166', '#ff9fc8', '#ffffff', '#b28dff']), life: 450 + Math.random() * 300, seed: Math.random() * 9, rot: 0, vr: 0.1 });
    },
    flash(color = '#fff6d6', strength = 0.5) {
      const el = document.createElement('div');
      el.className = 'fx-flash';
      el.style.background = `radial-gradient(circle at 50% 45%, ${color}, transparent 75%)`;
      el.style.setProperty('--a', strength);
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 600);
    },
    // quick all-round celebration for wins in any game
    celebrate() {
      api.confetti(90);
      for (let i = 0; i < 5; i++) setTimeout(() => api.sparkle(W * (0.2 + Math.random() * 0.6), H * (0.25 + Math.random() * 0.3), pick(GOLD), 14, 6), i * 140);
    },
  };
  return api;
})();
