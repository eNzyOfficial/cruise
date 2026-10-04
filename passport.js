// Passport: scan a boarding pass (camera or screenshot), get a stamp, and the flight countdown sets itself up.
// Boarding pass barcodes use the IATA "BCBP" format. Only the route, airline, flight, date and seat are kept;
// the passenger's name and booking reference are ignored and never stored.
const passport = (() => {
  // code: city, country, lat, lon
  const AIRPORTS = Object.fromEntries(`BKK|Bangkok|TH|13.69|100.75
DMK|Bangkok|TH|13.91|100.61
CNX|Chiang Mai|TH|18.77|98.96
CEI|Chiang Rai|TH|19.95|99.88
HKT|Phuket|TH|8.11|98.31
KBV|Krabi|TH|8.10|98.98
USM|Koh Samui|TH|9.55|100.06
HDY|Hat Yai|TH|6.93|100.39
UTH|Udon Thani|TH|17.39|102.79
UBP|Ubon Ratchathani|TH|15.25|104.87
KKC|Khon Kaen|TH|16.47|102.78
NST|Nakhon Si Thammarat|TH|8.54|99.94
URT|Surat Thani|TH|9.13|99.14
TST|Trang|TH|7.51|99.62
NAW|Narathiwat|TH|6.52|101.74
PHS|Phitsanulok|TH|16.78|100.28
LPT|Lampang|TH|18.27|99.50
NNT|Nan|TH|18.81|100.78
PRH|Phrae|TH|18.13|100.16
HHQ|Hua Hin|TH|12.64|99.95
UTP|U-Tapao (Pattaya)|TH|12.68|101.01
BFV|Buriram|TH|15.23|103.25
TDX|Trat|TH|12.27|102.32
ROI|Roi Et|TH|16.12|103.77
SNO|Sakon Nakhon|TH|17.20|104.12
LOE|Loei|TH|17.44|101.72
KOP|Nakhon Phanom|TH|17.38|104.64
MAQ|Mae Sot|TH|16.70|98.55
HGN|Mae Hong Son|TH|19.30|97.98
CJM|Chumphon|TH|10.71|99.36
RNG|Ranong|TH|9.78|98.59
SIN|Singapore|SG|1.36|103.99
KUL|Kuala Lumpur|MY|2.75|101.71
PEN|Penang|MY|5.30|100.28
LGK|Langkawi|MY|6.33|99.73
BKI|Kota Kinabalu|MY|5.94|116.05
HKG|Hong Kong|HK|22.31|113.92
MFM|Macau|MO|22.15|113.59
TPE|Taipei|TW|25.08|121.23
NRT|Tokyo|JP|35.77|140.39
HND|Tokyo|JP|35.55|139.78
KIX|Osaka|JP|34.43|135.24
NGO|Nagoya|JP|34.86|136.81
FUK|Fukuoka|JP|33.59|130.45
CTS|Sapporo|JP|42.78|141.69
OKA|Okinawa|JP|26.20|127.65
ICN|Seoul|KR|37.46|126.44
GMP|Seoul|KR|37.56|126.80
PUS|Busan|KR|35.18|128.94
PVG|Shanghai|CN|31.14|121.81
SHA|Shanghai|CN|31.20|121.34
PEK|Beijing|CN|40.08|116.58
PKX|Beijing|CN|39.51|116.41
CAN|Guangzhou|CN|23.39|113.30
SZX|Shenzhen|CN|22.64|113.81
CTU|Chengdu|CN|30.58|103.95
KMG|Kunming|CN|25.10|102.93
XMN|Xiamen|CN|24.54|118.13
SGN|Ho Chi Minh City|VN|10.82|106.65
HAN|Hanoi|VN|21.22|105.81
DAD|Da Nang|VN|16.04|108.20
CXR|Nha Trang|VN|11.99|109.22
PQC|Phu Quoc|VN|10.17|103.99
PNH|Phnom Penh|KH|11.55|104.84
REP|Siem Reap|KH|13.41|103.81
VTE|Vientiane|LA|17.99|102.56
LPQ|Luang Prabang|LA|19.90|102.16
RGN|Yangon|MM|16.91|96.13
MDL|Mandalay|MM|21.70|95.98
MNL|Manila|PH|14.51|121.02
CEB|Cebu|PH|10.31|123.98
CGK|Jakarta|ID|-6.13|106.66
DPS|Bali|ID|-8.75|115.17
DEL|Delhi|IN|28.56|77.10
BOM|Mumbai|IN|19.09|72.87
BLR|Bengaluru|IN|13.20|77.71
MAA|Chennai|IN|12.99|80.17
CCU|Kolkata|IN|22.65|88.45
CMB|Colombo|LK|7.18|79.88
MLE|Malé|MV|4.19|73.53
KTM|Kathmandu|NP|27.70|85.36
DAC|Dhaka|BD|23.84|90.40
DXB|Dubai|AE|25.25|55.36
AUH|Abu Dhabi|AE|24.43|54.65
DOH|Doha|QA|25.27|51.61
IST|Istanbul|TR|41.26|28.74
LHR|London|GB|51.47|-0.45
LGW|London|GB|51.15|-0.19
CDG|Paris|FR|49.01|2.55
FRA|Frankfurt|DE|50.04|8.56
MUC|Munich|DE|48.35|11.79
AMS|Amsterdam|NL|52.31|4.76
ZRH|Zurich|CH|47.46|8.55
VIE|Vienna|AT|48.11|16.57
FCO|Rome|IT|41.80|12.25
MXP|Milan|IT|45.63|8.72
MAD|Madrid|ES|40.47|-3.57
BCN|Barcelona|ES|41.30|2.08
CPH|Copenhagen|DK|55.62|12.65
ARN|Stockholm|SE|59.65|17.92
OSL|Oslo|NO|60.19|11.10
HEL|Helsinki|FI|60.32|24.96
DUB|Dublin|IE|53.42|-6.27
JFK|New York|US|40.64|-73.78
LAX|Los Angeles|US|33.94|-118.41
SFO|San Francisco|US|37.62|-122.38
SEA|Seattle|US|47.45|-122.31
YVR|Vancouver|CA|49.19|-123.18
SYD|Sydney|AU|-33.95|151.18
MEL|Melbourne|AU|-37.67|144.84
BNE|Brisbane|AU|-27.38|153.12
PER|Perth|AU|-31.94|115.97
AKL|Auckland|NZ|-37.01|174.79`.split('\n').map(l => { const [c, city, cc, la, lo] = l.split('|'); return [c, { city, cc, lat: +la, lon: +lo }]; }));

  const AIRLINES = { FD: 'Thai AirAsia', XJ: 'Thai AirAsia X', TG: 'Thai Airways', WE: 'Thai Smile', PG: 'Bangkok Airways', SL: 'Thai Lion Air',
    DD: 'Nok Air', VZ: 'Thai Vietjet', AK: 'AirAsia', D7: 'AirAsia X', SQ: 'Singapore Airlines', TR: 'Scoot', MH: 'Malaysia Airlines', CX: 'Cathay Pacific',
    JL: 'Japan Airlines', NH: 'ANA', KE: 'Korean Air', OZ: 'Asiana', VN: 'Vietnam Airlines', VJ: 'Vietjet', QR: 'Qatar Airways', EK: 'Emirates',
    EY: 'Etihad', TK: 'Turkish Airlines', BA: 'British Airways', LH: 'Lufthansa', AF: 'Air France', KL: 'KLM', QF: 'Qantas', CI: 'China Airlines',
    BR: 'EVA Air', CZ: 'China Southern', MU: 'China Eastern', CA: 'Air China', PR: 'Philippine Airlines', '5J': 'Cebu Pacific', GA: 'Garuda Indonesia',
    AI: 'Air India', '6E': 'IndiGo', UL: 'SriLankan', FZ: 'flydubai', MM: 'Peach', '7C': 'Jeju Air', TW: 't\'way', LJ: 'Jin Air', ZG: 'ZIPAIR' };
  const COUNTRY_FLAG = cc => cc ? String.fromCodePoint(...[...cc].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)) : '🌏';

  let stamps = store.get('stamps', []);
  const save = () => store.set('stamps', stamps);

  // ---------- BCBP parsing ----------
  function parse(raw) {
    const s = raw.replace(/\r?\n/g, '');
    if (!/^[MS][1-9]/.test(s) || s.length < 58) return null;
    const f = (a, b) => s.slice(a, b).trim();
    const from = f(30, 33), to = f(33, 36), carrier = f(36, 39), flightNo = f(39, 44).replace(/^0+/, ''), jd = parseInt(f(44, 47), 10);
    if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) return null;
    // the date is a day-of-year with no year: pick the year that puts it nearest today
    const now = new Date();
    const dayOf = (y, d) => new Date(y, 0, d);
    let date = dayOf(now.getFullYear(), jd || 1);
    if (date - now > 60 * 864e5) date = dayOf(now.getFullYear() - 1, jd);
    if (now - date > 300 * 864e5) date = dayOf(now.getFullYear() + 1, jd);
    return { from, to, carrier, flight: `${carrier}${flightNo}`, date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`, seat: f(48, 52).replace(/^0+/, ''), cabin: f(47, 48) };
  }

  const km = (a, b) => {
    if (!a || !b) return 0;
    const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
    return Math.round(6371 * 2 * Math.asin(Math.sqrt(h)));
  };
  // rough block time: cruise at ~780 km/h plus ~30 min for taxi, climb and descent
  const estMinutes = d => d ? Math.max(45, Math.round((d / 780 * 60 + 30) / 5) * 5) : 90;

  function addFromBarcode(text) {
    const p = parse(text);
    if (!p) return toast('That doesn\'t look like a boarding pass barcode');
    const A = AIRPORTS[p.from], B = AIRPORTS[p.to];
    const dist = km(A, B);
    const stamp = { id: Date.now(), ...p, km: dist, mins: estMinutes(dist), style: rand(6), tilt: Math.round(Math.random() * 16 - 8) };
    const dupe = stamps.find(x => x.flight === p.flight && x.date === p.date && x.from === p.from);
    if (!dupe) { stamps.unshift(stamp); save(); }
    // set up the countdown for this flight (unless one is already running)
    if (!flight.active()) {
      flight.update({ from: A?.city || p.from, to: B?.city || p.to, duration: stamp.mins });
      if (nav.current === 'home') renderFlightCard();
      renderRouteLabel();
    }
    showStamp(dupe || stamp, !dupe);
  }

  // ---------- stamp drawing ----------
  const INKS = ['#c0392b', '#1f5fa8', '#2e7d4f', '#7b3fa0', '#b5651d', '#a8326e'];
  const fmtDate = iso => new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  function stampSVG(s) {
    const ink = window.uni?.on ? 'url(#rainbowInk)' : INKS[s.style % INKS.length];
    const A = AIRPORTS[s.from], B = AIRPORTS[s.to];
    const shape = s.style % 3;
    const frame = shape === 0
      ? `<circle cx="100" cy="100" r="92" fill="none" stroke="${ink}" stroke-width="5"/><circle cx="100" cy="100" r="80" fill="none" stroke="${ink}" stroke-width="1.5"/>`
      : shape === 1
        ? `<rect x="10" y="30" width="180" height="140" rx="18" fill="none" stroke="${ink}" stroke-width="5"/><rect x="20" y="40" width="160" height="120" rx="10" fill="none" stroke="${ink}" stroke-width="1.5" stroke-dasharray="4 3"/>`
        : `<ellipse cx="100" cy="100" rx="95" ry="70" fill="none" stroke="${ink}" stroke-width="5"/><ellipse cx="100" cy="100" rx="84" ry="60" fill="none" stroke="${ink}" stroke-width="1.5"/>`;
    return `<svg viewBox="0 0 200 200" class="stamp-svg" style="transform:rotate(${s.tilt}deg)">
      <defs><filter id="ink${s.id}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${s.id % 97}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.85 1.2"/><feComposite in="SourceGraphic" operator="in"/></filter>
      <linearGradient id="rainbowInk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4fa3"/><stop offset=".33" stop-color="#ffb800"/><stop offset=".66" stop-color="#3cd5ff"/><stop offset="1" stop-color="#9b6bff"/></linearGradient></defs>
      <g filter="url(#ink${s.id})" fill="${ink}">
        ${frame}
        <text x="100" y="${shape === 0 ? 62 : 66}" text-anchor="middle" font-size="13" font-weight="700" letter-spacing="2">${(B?.city || s.to).toUpperCase().slice(0, 16)}</text>
        <text x="100" y="${shape === 0 ? 104 : 106}" text-anchor="middle" font-size="40" font-weight="900" letter-spacing="1">${s.to}</text>
        <text x="100" y="${shape === 0 ? 126 : 126}" text-anchor="middle" font-size="12" font-weight="700">✈ ${s.from} → ${s.to} · ${s.flight}</text>
        <text x="100" y="${shape === 0 ? 146 : 146}" text-anchor="middle" font-size="13" font-weight="800" letter-spacing="1">${fmtDate(s.date)}</text>
        ${shape === 0 ? `<text x="100" y="168" text-anchor="middle" font-size="10" font-weight="700" letter-spacing="3">ARRIVED</text>` : ''}
      </g></svg>`;
  }

  function showStamp(s, isNew) {
    const B = AIRPORTS[s.to];
    overlay.show(`<div class="stamp-drop">${stampSVG(s)}</div>
      <h2>${isNew ? 'Stamped! 🛂' : 'Already stamped'}</h2>
      <p>${COUNTRY_FLAG(B?.cc)} ${AIRPORTS[s.from]?.city || s.from} → ${B?.city || s.to} · ${AIRLINES[s.carrier] || s.carrier} ${s.flight}${s.seat ? ` · seat ${s.seat}` : ''}</p>
      ${!flight.active() ? `<p class="stamp-set">✈️ Countdown set: ${fmtMin(s.mins)}. Tap <b>Start</b> when the plane moves.</p>` : ''}
      <button class="big-btn" id="ovOk">${isNew ? 'Nice!' : 'OK'}</button>`, { '#ovOk': () => { if (nav.current === 'passport') render(); } });
    if (isNew) {
      setTimeout(() => {
        const r = $('.stamp-drop')?.getBoundingClientRect();
        if (!r) return;
        haptic();
        fx.ring(r.left + r.width / 2, r.top + r.height / 2, '#ffffff', 120, 4, 500);
        fx.glitter(r.left + r.width / 2, r.top + r.height / 2, 14);
        if (window.uni?.on) uni.boom(r.left + r.width / 2, r.top + r.height / 2, true);
      }, 380);
    }
  }

  // ---------- scanning ----------
  let zxing;
  function loadZXing() {
    return zxing ||= new Promise((res, rej) => {
      if (window.ZXing) return res(window.ZXing);
      const s = document.createElement('script');
      s.src = 'vendor/zxing.min.js';
      s.onload = () => res(window.ZXing); s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  async function reader() {
    const Z = await loadZXing();
    const hints = new Map();
    hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.PDF_417, Z.BarcodeFormat.AZTEC, Z.BarcodeFormat.QR_CODE, Z.BarcodeFormat.DATA_MATRIX]);
    hints.set(Z.DecodeHintType.TRY_HARDER, true);
    return { Z, r: new Z.BrowserMultiFormatReader(hints) };
  }

  function chooser() {
    overlay.show(`<div class="ev-icon">🎫</div><h2>Add boarding pass</h2><p>Scan the barcode, or pick a screenshot of your mobile boarding pass.</p>
      <button class="big-btn" id="bpCam">📷 Scan with camera</button>
      <button class="big-btn alt" id="bpPic">🖼️ Choose screenshot</button>
      <button class="fc-quit" id="ovNo">Cancel</button>`, { '#ovNo': () => {} });
    $('#bpCam').onclick = () => { overlay.hide(); camera(); };
    $('#bpPic').onclick = () => { overlay.hide(); $('#bpFile').click(); };
    loadZXing().catch(() => {});
  }

  // Decode a picked screenshot/photo. Try the full image, then the middle and lower parts, then a few scales.
  async function fromFile(file) {
    if (!file) return;
    toast('Reading boarding pass…');
    try {
      const { Z } = await reader();
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
      const hints = new Map([[Z.DecodeHintType.TRY_HARDER, true], [Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.PDF_417, Z.BarcodeFormat.AZTEC, Z.BarcodeFormat.QR_CODE, Z.BarcodeFormat.DATA_MATRIX]]]);
      const multi = new Z.MultiFormatReader(); multi.setHints(hints);
      const W = img.naturalWidth, H = img.naturalHeight;
      const crops = [[0, 0, 1, 1], [0, 0.25, 1, 0.5], [0, 0.45, 1, 0.55], [0, 0, 1, 0.5], [0.1, 0.3, 0.8, 0.45]];
      for (const scale of [1, 0.6, 1.5]) for (const [x, y, w, h] of crops) {
        const c = document.createElement('canvas');
        c.width = Math.round(W * w * scale); c.height = Math.round(H * h * scale);
        const g = c.getContext('2d', { willReadFrequently: true });
        g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, W * x, H * y, W * w, H * h, 0, 0, c.width, c.height);
        try {
          const src = new Z.HTMLCanvasElementLuminanceSource(c);
          const res = multi.decode(new Z.BinaryBitmap(new Z.HybridBinarizer(src)), hints);
          return addFromBarcode(res.getText());
        } catch {}
      }
      toast('Couldn\'t find a barcode. Try a clearer screenshot.');
    } catch { toast('Couldn\'t read that image'); }
  }

  async function camera() {
    const box = document.createElement('div');
    box.className = 'scanner';
    box.innerHTML = `<video playsinline muted></video><div class="scan-frame"><i></i></div>
      <p>Point at the barcode on the boarding pass</p><button class="big-btn alt" id="scanStop">Cancel</button>`;
    document.body.appendChild(box);
    let controls;
    const stop = () => { try { controls?.stop(); } catch {} box.remove(); };
    $('#scanStop').onclick = stop;
    try {
      const { r } = await reader();
      controls = await r.decodeFromConstraints({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } }, $('video', box), (result) => {
        if (!result) return;
        stop();
        addFromBarcode(result.getText());
      });
    } catch {
      stop();
      toast('Camera not available. Try a screenshot instead.');
    }
  }

  // ---------- passport book ----------
  function stats() {
    const cities = {};
    stamps.forEach(s => { const c = AIRPORTS[s.to]?.city || s.to; cities[c] = (cities[c] || 0) + 1; });
    const fav = Object.entries(cities).sort((a, b) => b[1] - a[1])[0];
    return {
      flights: stamps.length,
      km: stamps.reduce((a, s) => a + (s.km || 0), 0),
      hours: Math.round(stamps.reduce((a, s) => a + (s.mins || 0), 0) / 6) / 10,
      places: Object.keys(cities).length,
      fav: fav ? fav[0] : '–',
    };
  }
  function badges(st) {
    const b = [];
    if (st.flights >= 1) b.push(['🛫', 'First stamp']);
    if (st.flights >= 5) b.push(['✈️', '5 flights']);
    if (st.flights >= 10) b.push(['🏅', '10 flights']);
    if (st.flights >= 25) b.push(['👑', '25 flights']);
    if (st.km >= 1000) b.push(['🌏', '1,000 km']);
    if (st.km >= 10000) b.push(['🚀', '10,000 km']);
    const cnx = stamps.filter(s => s.to === 'CNX' || s.from === 'CNX').length;
    if (cnx >= 3) b.push(['🏔️', 'Chiang Mai regular']);
    if (st.places >= 5) b.push(['🗺️', '5 places']);
    return b;
  }

  function render() {
    const body = $('#ppBody');
    const st = stats();
    body.innerHTML = `
      <div class="pp-cover"><div class="pp-emblem">✈︎</div><b>PASSPORT</b><small>CRUISE AIRWAYS · FREQUENT FLYER</small></div>
      <div class="pp-stats">
        <div><b>${st.flights}</b><small>flights</small></div><div><b>${st.km.toLocaleString()}</b><small>km</small></div>
        <div><b>${st.hours}</b><small>hours</small></div><div><b>${st.places}</b><small>places</small></div></div>
      ${st.flights ? `<p class="pp-fav">Most visited: <b>${esc(st.fav)}</b></p>` : ''}
      ${badges(st).length ? `<div class="pp-badges">${badges(st).map(([i, t]) => `<span>${i} ${t}</span>`).join('')}</div>` : ''}
      <button class="big-btn" id="ppAdd">🎫 Add boarding pass</button>
      <div class="pp-pages">${stamps.length ? stamps.map(s => `<button class="pp-stamp" data-id="${s.id}">${stampSVG(s)}</button>`).join('')
        : '<p class="mys-tip">No stamps yet. Add a boarding pass and your first stamp lands here.</p>'}</div>`;
    $('#ppAdd').onclick = chooser;
    $$('.pp-stamp', body).forEach(b => b.onclick = () => {
      const s = stamps.find(x => x.id === +b.dataset.id);
      overlay.show(`<div class="stamp-drop still">${stampSVG(s)}</div>
        <p>${AIRPORTS[s.from]?.city || s.from} → ${AIRPORTS[s.to]?.city || s.to}<br>${AIRLINES[s.carrier] || s.carrier} ${s.flight} · ${fmtDate(s.date)}${s.seat ? ` · seat ${s.seat}` : ''}<br>${s.km ? `${s.km.toLocaleString()} km · ` : ''}~${fmtMin(s.mins)}</p>
        <button class="big-btn" id="ovOk">Close</button><button class="fc-quit" id="ppDel">Remove this stamp</button>`, { '#ovOk': () => {} });
      $('#ppDel').onclick = () => { stamps = stamps.filter(x => x.id !== s.id); save(); overlay.hide(); render(); };
    });
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // hidden file picker shared by the passport and the flight card
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*'; input.id = 'bpFile'; input.hidden = true;
  input.onchange = () => { fromFile(input.files[0]); input.value = ''; };
  document.body.appendChild(input);

  screens.passport = {
    onShow: render,
    meta: () => stamps.length ? `${stamps.length} stamp${stamps.length > 1 ? 's' : ''}` : 'Collect stamps',
  };
  return { chooser, addFromBarcode, parse, get stamps() { return stamps; } };
})();
