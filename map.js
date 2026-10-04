// Offline world map: airports, coastlines and borders from geo.js, drawn on a canvas.
// Also: airport search for the From/To boxes, and optional real GPS position (works in airplane mode).
const geoMap = (() => {
  let airports = null, land = null, borders = null, readyP = null;

  function decode(str) {
    return str.split(';').map(s => {
      const n = s.split(',').map(Number), pts = [];
      let x = 0, y = 0;
      for (let i = 0; i < n.length; i += 2) { x += n[i]; y += n[i + 1]; pts.push([x / 20, y / 20]); }
      let minX = 999, maxX = -999, minY = 999, maxY = -999;
      for (const [a, b] of pts) { if (a < minX) minX = a; if (a > maxX) maxX = a; if (b < minY) minY = b; if (b > maxY) maxY = b; }
      return { pts, bbox: [minX, minY, maxX, maxY] };
    });
  }
  function load() {
    return readyP ||= new Promise(res => {
      const go = () => {
        airports = new Map();
        for (const line of window.GEO.airports.split('\n')) {
          const [rank, code, city, cc, lat, lon, name] = line.split('|');
          airports.set(code, { rank, code, city, cc, lat: +lat, lon: +lon, name });
        }
        land = decode(window.GEO.land);
        borders = decode(window.GEO.borders);
        res();
      };
      if (window.GEO) return go();
      const s = document.createElement('script');
      s.src = 'geo.js?v=1'; s.onload = go; s.onerror = () => res();
      document.head.appendChild(s);
    });
  }
  const airport = code => airports?.get((code || '').toUpperCase()) || null;
  const byCity = name => {
    if (!airports || !name) return null;
    const n = name.toLowerCase().trim();
    for (const a of airports.values()) if (a.city.toLowerCase() === n) return a; // list is sorted big airports first
    return null;
  };

  // ---------- search for the From/To boxes ----------
  function search(q, limit = 6) {
    if (!airports || !q.trim()) return [];
    const n = q.toLowerCase().trim(), out = [];
    const exact = airports.get(q.toUpperCase().trim());
    if (exact) out.push(exact);
    for (const pass of [a => a.city.toLowerCase().startsWith(n), a => a.name.toLowerCase().includes(n) || a.city.toLowerCase().includes(n)]) {
      for (const a of airports.values()) {
        if (out.length >= limit) return out;
        if (!out.includes(a) && pass(a)) out.push(a);
      }
    }
    return out;
  }

  // ---------- geometry ----------
  const R = Math.PI / 180;
  function gcPoint(a, b, t) {
    const [la1, lo1, la2, lo2] = [a.lat * R, a.lon * R, b.lat * R, b.lon * R];
    const d = 2 * Math.asin(Math.sqrt(Math.sin((la2 - la1) / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin((lo2 - lo1) / 2) ** 2));
    if (d < 1e-6) return { lat: a.lat, lon: a.lon };
    const A = Math.sin((1 - t) * d) / Math.sin(d), B = Math.sin(t * d) / Math.sin(d);
    const x = A * Math.cos(la1) * Math.cos(lo1) + B * Math.cos(la2) * Math.cos(lo2);
    const y = A * Math.cos(la1) * Math.sin(lo1) + B * Math.cos(la2) * Math.sin(lo2);
    const z = A * Math.sin(la1) + B * Math.sin(la2);
    return { lat: Math.atan2(z, Math.hypot(x, y)) / R, lon: Math.atan2(y, x) / R };
  }
  const km = (a, b) => {
    const dLat = (b.lat - a.lat) * R, dLon = (b.lon - a.lon) * R;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * R) * Math.cos(b.lat * R) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(h));
  };
  const mercY = lat => Math.log(Math.tan(Math.PI / 4 + Math.max(-85, Math.min(85, lat)) * R / 2)) / R;

  // ---------- drawing ----------
  const PLANE = new Path2D('M13,0 C13,-1.5 11,-2 9,-2 L2,-2 L-4,-11 L-7,-11 L-3,-2 L-9,-2 L-12,-6 L-14,-6 L-12.5,0 L-14,6 L-12,6 L-9,2 L-3,2 L-7,11 L-4,11 L2,2 L9,2 C11,2 13,1.5 13,0 Z');
  function draw(canvas, { from, to, progress, gps, follow }) {
    const A = airport(from), B = airport(to);
    if (!A || !B || !land) return false;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (!W) return false;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    const route = Array.from({ length: 65 }, (_, i) => gcPoint(A, B, i / 64));
    const here = gps || gcPoint(A, B, progress);
    // fit the view: whole route, or zoomed in around the plane
    let pts = follow ? [here] : route;
    let minLon = Math.min(...pts.map(p => p.lon)), maxLon = Math.max(...pts.map(p => p.lon));
    let minY = Math.min(...pts.map(p => mercY(p.lat))), maxY = Math.max(...pts.map(p => mercY(p.lat)));
    const pad = follow ? 1 : 1.45;
    const lonSpan = follow ? 2.5 : Math.max(maxLon - minLon, 2.5);
    const ySpan = follow ? 2.5 * H / W : Math.max(maxY - minY, 2.5);
    const cx = (minLon + maxLon) / 2, cy = (minY + maxY) / 2;
    const scale = Math.min(W / (lonSpan * pad), H / (ySpan * pad));
    const px = lon => W / 2 + (lon - cx) * scale;
    const py = lat => H / 2 - (mercY(lat) - cy) * scale;
    const view = [cx - W / 2 / scale, cx + W / 2 / scale];

    // sea
    const sea = g.createLinearGradient(0, 0, 0, H);
    sea.addColorStop(0, '#0b1626'); sea.addColorStop(1, '#0e1d33');
    g.fillStyle = sea; g.fillRect(0, 0, W, H);
    // land
    g.fillStyle = '#1b2b42'; g.strokeStyle = '#2f4566'; g.lineWidth = 1;
    const inView = b => b[2] >= view[0] - 1 && b[0] <= view[1] + 1;
    for (const r of land) {
      if (!inView(r.bbox)) continue;
      g.beginPath();
      r.pts.forEach(([lo, la], i) => i ? g.lineTo(px(lo), py(la)) : g.moveTo(px(lo), py(la)));
      g.closePath(); g.fill(); g.stroke();
    }
    // borders
    g.strokeStyle = '#3d557a'; g.setLineDash([3, 3]); g.lineWidth = 0.8;
    for (const r of borders) {
      if (!inView(r.bbox)) continue;
      g.beginPath();
      r.pts.forEach(([lo, la], i) => i ? g.lineTo(px(lo), py(la)) : g.moveTo(px(lo), py(la)));
      g.stroke();
    }
    g.setLineDash([]);
    // faint latitude/longitude grid so movement is visible even over plain land
    const step = follow ? 0.5 : lonSpan > 40 ? 10 : lonSpan > 10 ? 5 : 1;
    g.strokeStyle = '#ffffff0d'; g.lineWidth = 1;
    for (let lo = Math.ceil(view[0] / step) * step; lo <= view[1]; lo += step) { g.beginPath(); g.moveTo(px(lo), 0); g.lineTo(px(lo), H); g.stroke(); }
    const latTop = Math.atan(Math.sinh((cy + H / 2 / scale) * R)) / R, latBot = Math.atan(Math.sinh((cy - H / 2 / scale) * R)) / R;
    for (let la = Math.ceil(latBot / step) * step; la <= latTop; la += step) { g.beginPath(); g.moveTo(0, py(la)); g.lineTo(W, py(la)); g.stroke(); }
    // a few airports for context
    g.font = '600 10px -apple-system, system-ui, sans-serif';
    let shown = 0;
    const placed = [[px(A.lon), py(A.lat)], [px(B.lon), py(B.lat)]];
    for (const a of airports.values()) {
      if (shown >= (follow ? 10 : 7) || (a.rank !== 'L' && !(follow && a.rank === 'M')) || a === A || a === B) continue;
      const x = px(a.lon), y = py(a.lat);
      if (x < 8 || x > W - 8 || y < 8 || y > H - 8 || placed.some(([u, v]) => Math.hypot(u - x, v - y) < 40)) continue;
      placed.push([x, y]); shown++;
      g.fillStyle = '#4a6288'; g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill();
      g.fillStyle = '#6f86a8'; g.fillText(a.city, x + 4, y + 3);
    }
    // route: the part flown is solid, the rest dashed
    const k = Math.round((gps ? closestT(route, here) : progress) * 64);
    g.lineWidth = 2.5; g.lineCap = 'round';
    g.strokeStyle = '#4a6288'; g.setLineDash([2, 6]);
    g.beginPath(); route.forEach((p, i) => i ? g.lineTo(px(p.lon), py(p.lat)) : g.moveTo(px(p.lon), py(p.lat))); g.stroke();
    g.setLineDash([]);
    const grad = g.createLinearGradient(px(A.lon), py(A.lat), px(B.lon), py(B.lat));
    if (window.uni?.on) { grad.addColorStop(0, '#ff4fa3'); grad.addColorStop(0.5, '#ffe14d'); grad.addColorStop(1, '#3cd5ff'); }
    else { grad.addColorStop(0, '#7cb4ff'); grad.addColorStop(1, '#5eead4'); }
    g.strokeStyle = grad; g.lineWidth = window.uni?.on ? 5 : 3;
    g.beginPath(); route.slice(0, k + 1).forEach((p, i) => i ? g.lineTo(px(p.lon), py(p.lat)) : g.moveTo(px(p.lon), py(p.lat)));
    if (gps) g.lineTo(px(here.lon), py(here.lat));
    g.stroke();
    // endpoints
    for (const [a, col] of [[A, '#7cb4ff'], [B, '#5eead4']]) {
      const x = px(a.lon), y = py(a.lat);
      g.fillStyle = col; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill();
      g.strokeStyle = col + '66'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 10, 0, 7); g.stroke();
      g.font = '700 12px -apple-system, system-ui, sans-serif';
      const label = `${a.city}`;
      const tw = g.measureText(label).width;
      const lx = Math.min(W - tw - 6, Math.max(6, x + 12)), ly = Math.max(14, Math.min(H - 6, y + 4));
      g.fillStyle = '#0b1626cc'; g.fillRect(lx - 3, ly - 11, tw + 6, 15);
      g.fillStyle = '#e8eef7'; g.fillText(label, lx, ly);
    }
    // the plane, pointing where it's heading
    const ahead = gps?.heading != null ? null : gcPoint(A, B, Math.min(1, (gps ? closestT(route, here) : progress) + 0.01));
    const ang = gps?.heading != null ? (gps.heading - 90) * R
      : Math.atan2(py(ahead.lat) - py(here.lat), px(ahead.lon) - px(here.lon));
    const x = px(here.lon), y = py(here.lat);
    if (gps) { g.fillStyle = '#5eead433'; g.beginPath(); g.arc(x, y, 18, 0, 7); g.fill(); }
    g.save(); g.translate(x, y);
    if (window.uni?.on) { g.font = '26px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🦄', 0, 0); }
    else { g.rotate(ang); g.scale(1.1, 1.1); g.shadowColor = '#000a'; g.shadowBlur = 6; g.fillStyle = '#fff'; g.fill(PLANE); }
    g.restore();
    return true;
  }
  function closestT(route, p) {
    let best = 0, bd = Infinity;
    route.forEach((q, i) => { const d = (q.lat - p.lat) ** 2 + (q.lon - p.lon) ** 2; if (d < bd) { bd = d; best = i; } });
    return best / (route.length - 1);
  }

  // ---------- GPS (optional, stays on the phone) ----------
  let watchId = null, fix = null, onFix = null;
  function gpsStart(cb) {
    onFix = cb;
    if (!navigator.geolocation || watchId != null) return false;
    watchId = navigator.geolocation.watchPosition(p => {
      fix = { lat: p.coords.latitude, lon: p.coords.longitude, alt: p.coords.altitude, speed: p.coords.speed, heading: Number.isFinite(p.coords.heading) ? p.coords.heading : null, acc: p.coords.accuracy, t: Date.now() };
      onFix?.(fix);
    }, err => { onFix?.(null, err); }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 60000 });
    return true;
  }
  function gpsStop() { if (watchId != null) navigator.geolocation.clearWatch(watchId); watchId = null; fix = null; }
  const gpsFix = () => (fix && Date.now() - fix.t < 120000 ? fix : null); // ignore fixes older than 2 minutes

  return { load, airport, byCity, search, draw, km, gpsStart, gpsStop, gpsFix, get gpsOn() { return watchId != null; } };
})();
