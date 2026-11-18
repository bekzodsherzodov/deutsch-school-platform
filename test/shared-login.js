'use strict';
/* Sinov: node test/shared-login.js — o'quvchi va ota-ona bir xil login (parol har xil) + yangiliklarni tahrirlash/qadash */
const os = require('os'), path = require('path'), fs = require('fs');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-'));
process.env.PORT = '3917';
process.env.ADMIN_USER = 'boss';
process.env.ADMIN_PASSWORD = 'secret123';
delete process.env.DATABASE_URL;
const { init, server } = require('../server.js');

const base = 'http://localhost:3917';
let pass = 0, failN = 0;
const ok = (c, m) => { if (c) pass++; else { failN++; console.log('XATO:', m); } };

class Client {
  constructor() { this.cookie = ''; }
  async call(method, url, body) {
    const r = await fetch(base + url, {
      method,
      headers: { 'Content-Type': 'application/json', Cookie: this.cookie, Origin: base },
      body: body ? JSON.stringify(body) : undefined
    });
    const sc = r.headers.get('set-cookie');
    if (sc) this.cookie = sc.split(';')[0];
    let j = null; try { j = await r.json(); } catch (e) {}
    return { s: r.status, j };
  }
}

(async () => {
  await init();
  const admin = new Client(), stu = new Client(), par = new Client(), anon = new Client();
  let r = await admin.call('POST', '/api/auth/login', { user: 'boss', password: 'secret123' }); ok(r.s === 200, 'admin login');
  r = await admin.call('POST', '/api/data', { ops: [
    { p: ['groups'], v: [{ id: 'g1', name: '10a' }] },
    { p: ['students'], v: [
      { id: 'sx', first: 'Ali', last: 'Valiyev', groupId: 'g1', login: 'bola1' },
      { id: 'sy', first: 'Vali', last: 'Aliyev', groupId: 'g1' }
    ] }
  ] }); ok(r.s === 200, 'o‘quvchilar yozildi');

  r = await admin.call('POST', '/api/credentials', { studentId: 'sx', login: 'bola1', password: 'stud1' }); ok(r.s === 200, 'o‘quvchi logini');
  r = await admin.call('POST', '/api/credentials', { parentOf: 'sx', login: 'bola1', password: 'stud1' }); ok(r.s === 400, 'ota-ona paroli o‘quvchinikiga teng bo‘lsa rad');
  r = await admin.call('POST', '/api/credentials', { parentOf: 'sx', login: 'bola1', password: 'ota11' }); ok(r.s === 200, 'ota-ona bir xil login bilan yaratildi');
  r = await admin.call('POST', '/api/credentials', { studentId: 'sy', login: 'BOLA1', password: 'abcd' }); ok(r.s === 409, 'boshqa o‘quvchi bu loginni ololmaydi');
  r = await admin.call('POST', '/api/credentials', { studentId: 'sx', login: 'bola1', password: 'ota11' }); ok(r.s === 400, 'o‘quvchi paroli ota-onanikiga teng bo‘lsa rad');

  r = await stu.call('POST', '/api/auth/login', { user: 'bola1', password: 'stud1' }); ok(r.s === 200 && r.j.role === 'student' && r.j.id === 'sx', 'o‘quvchi paroli → o‘quvchi');
  r = await par.call('POST', '/api/auth/login', { user: 'bola1', password: 'ota11' }); ok(r.s === 200 && r.j.role === 'parent' && r.j.id === 'p:sx', 'ota-ona paroli → ota-ona');
  r = await anon.call('POST', '/api/auth/login', { user: 'bola1', password: 'xato' }); ok(r.s === 401, 'noto‘g‘ri parol rad');

  // serverdagi moslashtirish (reconcile) bir xil loginda xato bermasin
  r = await admin.call('POST', '/api/data', { ops: [{ p: ['payments', '2026-10', 'sx'], v: { paid: 1 } }] }); ok(r.s === 200, 'ma‘lumot yozish bir xil loginda ishlaydi');
  // login almashtirish: avval o'quvchi, keyin ota-ona (parolsiz — eski parol qoladi)
  r = await admin.call('POST', '/api/credentials', { studentId: 'sx', login: 'bola2', password: '' }); ok(r.s === 200, 'o‘quvchi logini almashdi');
  r = await admin.call('POST', '/api/credentials', { parentOf: 'sx', login: 'bola2', password: '' }); ok(r.s === 200, 'ota-ona logini almashdi');
  r = await admin.call('POST', '/api/data', { ops: [{ p: ['students', 0, 'login'], v: 'bola2' }] });
  ok(r.s === 200 || r.s === 400, 'doc login yangilandi (' + r.s + ')');
  const p2 = new Client();
  r = await p2.call('POST', '/api/auth/login', { user: 'bola2', password: 'ota11' }); ok(r.s === 200 && r.j.role === 'parent', 'yangi login bilan ota-ona kiradi');
  const s2 = new Client();
  r = await s2.call('POST', '/api/auth/login', { user: 'bola2', password: 'stud1' }); ok(r.s === 200 && r.j.role === 'student', 'yangi login bilan o‘quvchi kiradi');

  // ---- yangiliklar: tahrirlash va qadash ----
  r = await admin.call('POST', '/api/news', { title: 'Birinchi', text: 'matn 1' }); ok(r.s === 200, 'yangilik 1');
  const n1 = r.j.item.id;
  r = await admin.call('POST', '/api/news', { title: 'Ikkinchi', text: 'matn 2' }); ok(r.s === 200, 'yangilik 2');
  const n2 = r.j.item.id;
  r = await admin.call('GET', '/api/news'); ok(r.j.items[0].id === n2 && r.j.items[0].pinned === false, 'yangisi tepada');
  r = await admin.call('POST', '/api/news/update', { id: n1, pinned: true }); ok(r.s === 200 && r.j.item.pinned === true && r.j.item.edited === 0, 'qadaldi (tahrirlandi belgisiz)');
  r = await admin.call('GET', '/api/news'); ok(r.j.items[0].id === n1, 'qadalgan tepada');
  r = await admin.call('POST', '/api/news/update', { id: n2, title: 'Ikkinchi (yangi)', text: 'boshqa' }); ok(r.s === 200 && r.j.item.title === 'Ikkinchi (yangi)' && r.j.item.edited > 0, 'tahrirlandi');
  r = await admin.call('POST', '/api/news/update', { id: n2, title: '', text: '' }); ok(r.s === 400, 'bo‘sh yangilikka ruxsat yo‘q');
  r = await admin.call('POST', '/api/news/update', { id: 'yoq', title: 'x' }); ok(r.s === 404, 'yo‘q yangilik');
  r = await s2.call('POST', '/api/news/update', { id: n1, pinned: false }); ok(r.s === 403, 'o‘quvchi tahrirlay olmaydi');
  r = await p2.call('POST', '/api/news/update', { id: n1, title: 'x' }); ok(r.s === 403, 'ota-ona tahrirlay olmaydi');
  r = await s2.call('GET', '/api/news'); ok(r.s === 200 && r.j.items[0].id === n1 && r.j.items[0].pinned === true, 'o‘quvchi qadalgan yangilikni tepada ko‘radi');

  console.log('\n' + pass + ' ta o‘tdi, ' + failN + ' ta xato');
  server.close();
  process.exit(failN ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
