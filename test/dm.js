'use strict';
/* Sinov: node test/dm.js — chat a'zolari va shaxsiy yozishmalar (DM) */
const os = require('os'), path = require('path'), fs = require('fs');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'dsd-'));
process.env.PORT = '3914';
process.env.ADMIN_USER = 'boss';
process.env.ADMIN_PASSWORD = 'secret123';
delete process.env.DATABASE_URL;
const { init, server } = require('../server.js');

const base = 'http://localhost:3914';
let pass = 0, failN = 0;
const ok = (c, m) => { if (c) pass++; else { failN++; console.log('XATO:', m); } };

class Client {
  async call(method, url, body) {
    const r = await fetch(base + url, {
      method,
      headers: { 'Content-Type': 'application/json', Cookie: this.cookie || '', Origin: base },
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
  const admin = new Client(), t1 = new Client(), t2 = new Client(), par = new Client(), par2 = new Client(), stu = new Client();
  let r = await admin.call('POST', '/api/auth/login', { user: 'boss', password: 'secret123' }); ok(r.s === 200, 'admin kirdi');
  await admin.call('POST', '/api/data', { ops: [
    { p: ['groups'], v: [{ id: 'g1', name: '10-B' }] },
    { p: ['teachers'], v: [{ id: 'ta', name: 'Anna Ivanova', login: 'anna' }, { id: 'tb', name: 'Bobur Karimov', login: 'bobur' }] },
    { p: ['students'], v: [{ id: 'sa', first: 'Ali', last: 'Valiyev', groupId: 'g1', fee: 1 }, { id: 'sb', first: 'Vali', last: 'Karimov', groupId: 'g1', fee: 1 }] }
  ] });
  await admin.call('POST', '/api/credentials', { teacherId: 'ta', login: 'anna', password: 'abcd' });
  await admin.call('POST', '/api/credentials', { teacherId: 'tb', login: 'bobur', password: 'abcd' });
  await admin.call('POST', '/api/credentials', { parentOf: 'sa', login: 'ota_ali', password: 'abcd' });
  await admin.call('POST', '/api/credentials', { parentOf: 'sb', login: 'ota_vali', password: 'abcd' });
  await admin.call('POST', '/api/credentials', { studentId: 'sa', login: 'ali', password: 'wxyz' });
  await t1.call('POST', '/api/auth/login', { user: 'anna', password: 'abcd' });
  await t2.call('POST', '/api/auth/login', { user: 'bobur', password: 'abcd' });
  await par.call('POST', '/api/auth/login', { user: 'ota_ali', password: 'abcd' });
  await par2.call('POST', '/api/auth/login', { user: 'ota_vali', password: 'abcd' });
  await stu.call('POST', '/api/auth/login', { user: 'ali', password: 'wxyz' });

  // a'zolar
  r = await admin.call('GET', '/api/dm/members?room=staff'); ok(r.s === 200 && r.j.members.length === 3, 'admin: o‘qituvchilar xonasida 3 a‘zo (admin+2)');
  r = await admin.call('GET', '/api/dm/members?room=parents'); ok(r.s === 200 && r.j.members.length === 3 && r.j.members.some(m => m.name === 'Ali Valiyev ota-onasi'), 'admin: ota-onalar xonasi');
  r = await t1.call('GET', '/api/dm/members?room=staff'); ok(r.j.members.find(m => m.me).id === 'ta', 'o‘qituvchi o‘zini “me” deb ko‘radi');
  r = await t1.call('GET', '/api/dm/members?room=parents'); ok(r.s === 403, 'o‘qituvchi ota-onalar a‘zolarini ko‘ra olmaydi');
  r = await par.call('GET', '/api/dm/members?room=parents'); ok(r.s === 200 && r.j.members.length === 1 && r.j.members[0].role === 'admin', 'ota-ona faqat administratorni ko‘radi');
  r = await par.call('GET', '/api/dm/members?room=staff'); ok(r.s === 403, 'ota-ona o‘qituvchilar xonasiga kira olmaydi');
  r = await stu.call('GET', '/api/dm/members?room=staff'); ok(r.s === 403, 'o‘quvchi kira olmaydi');

  // yozish
  r = await admin.call('POST', '/api/dm', { peer: 'p:sa', text: '  Salom, Ali haqida gaplashamiz ' }); ok(r.s === 200 && r.j.msg.text === 'Salom, Ali haqida gaplashamiz' && r.j.msg.me, 'admin ota-onaga yozdi');
  r = await par.call('GET', '/api/dm/unread'); ok(r.j.unread === 1, 'ota-onada 1 ta o‘qilmagan');
  r = await par.call('GET', '/api/dm/members?room=parents'); ok(r.j.members[0].unread === 1 && r.j.members[0].last.text.startsWith('Salom'), 'a‘zolar ro‘yxatida o‘qilmagan va oxirgi xabar');
  r = await par.call('GET', '/api/dm?peer=admin&since=0'); ok(r.s === 200 && r.j.msgs.length === 1 && !r.j.msgs[0].me, 'ota-ona xabarni ochdi');
  r = await par.call('GET', '/api/dm/unread'); ok(r.j.unread === 0, 'ochgach o‘qilgan');
  r = await par.call('POST', '/api/dm', { peer: 'admin', text: 'Vaalaykum assalom' }); ok(r.s === 200, 'ota-ona javob yozdi');
  r = await admin.call('GET', '/api/dm?peer=p:sa&since=0'); ok(r.j.msgs.length === 2 && r.j.msgs[0].me && !r.j.msgs[1].me, 'admin ikkala xabarni ko‘radi');

  // maxfiylik
  r = await par.call('POST', '/api/dm', { peer: 'p:sb', text: 'boshqa ota-onaga' }); ok(r.s === 403, 'ota-ona boshqa ota-onaga yoza olmaydi');
  r = await par.call('POST', '/api/dm', { peer: 'ta', text: 'o‘qituvchiga' }); ok(r.s === 403, 'ota-ona o‘qituvchiga yoza olmaydi');
  r = await par2.call('GET', '/api/dm?peer=p:sa&since=0'); ok(r.s === 403, 'boshqa ota-ona yozishmani o‘qiy olmaydi');
  r = await stu.call('POST', '/api/dm', { peer: 'admin', text: 'x' }); ok(r.s === 403, 'o‘quvchi yoza olmaydi');
  r = await t1.call('POST', '/api/dm', { peer: 't1', text: 'o‘zimga' }); ok(r.s === 403, 'o‘ziga yozib bo‘lmaydi');
  r = await t1.call('POST', '/api/dm', { peer: 'tb', text: 'Bobur, salom' }); ok(r.s === 200, 'o‘qituvchi o‘qituvchiga yozdi');
  r = await t2.call('GET', '/api/dm?peer=ta&since=0'); ok(r.j.msgs.length === 1, 'ikkinchi o‘qituvchi oldi');
  r = await t1.call('GET', '/api/dm?peer=tb&since=0'); r = await admin.call('GET', '/api/dm?peer=ta&since=0'); ok(r.j.msgs.length === 0, 'administrator o‘qituvchilar yozishmasini ko‘ra olmaydi');
  r = await t1.call('POST', '/api/dm', { peer: 'tb', text: '   ' }); ok(r.s === 400, 'bo‘sh xabar rad');

  // o'chirish
  r = await admin.call('GET', '/api/dm?peer=p:sa&since=0'); const mid = r.j.msgs[1].id;
  r = await admin.call('POST', '/api/dm/delete', { id: mid }); r = await admin.call('GET', '/api/dm?peer=p:sa&since=0'); ok(r.j.msgs[1].text === 'Vaalaykum assalom' && !r.j.msgs[1].x, 'begona xabarni o‘chirib bo‘lmaydi');
  const mine = r.j.msgs[0].id; await admin.call('POST', '/api/dm/delete', { id: mine });
  r = await admin.call('GET', '/api/dm?peer=p:sa&since=0'); ok(r.j.msgs[0].x === true || r.j.msgs.find(m => m.id === mine).x, 'o‘z xabarini o‘chirdi');

  console.log(`\n${pass} ta o‘tdi, ${failN} ta xato`);
  server.close();
  process.exit(failN ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
