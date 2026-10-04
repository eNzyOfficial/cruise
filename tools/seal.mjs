// Encrypts private/surprise.json with the secret answer so it can be published safely.
// Usage: node tools/seal.mjs "<dog name>"
import fs from 'fs';
const { subtle } = globalThis.crypto;
const dog = process.argv[2];
if (!dog) { console.error('Usage: node tools/seal.mjs "<dog name>"'); process.exit(1); }

const norm = s => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9฀-๿]/g, '');
const ITER = 150000;
const json = fs.readFileSync(new URL('../private/surprise.json', import.meta.url), 'utf8').replaceAll('{{DOG}}', dog);
const obj = JSON.parse(json);
// embed photos inside the encrypted payload so they're never public files
if (obj.photo?.file) {
  obj.photo.src = 'data:image/jpeg;base64,' + fs.readFileSync(new URL('../private/' + obj.photo.file, import.meta.url)).toString('base64');
  delete obj.photo.file;
}
const plain = JSON.stringify(obj);

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await subtle.importKey('raw', new TextEncoder().encode(norm(dog)), 'PBKDF2', false, ['deriveKey']);
const key = await subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const data = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain)));
const b64 = u => Buffer.from(u).toString('base64');
fs.writeFileSync(new URL('../surprise.enc.js', import.meta.url),
  `// Encrypted surprise. Unlocks after 5pm on 4 Oct 2026 with the right answer.\nwindow.SURPRISE = ${JSON.stringify({ at: '2026-10-04T17:00:00+07:00', iter: ITER, salt: b64(salt), iv: b64(iv), data: b64(data) })};\n`);
console.log('sealed', data.length, 'bytes');
