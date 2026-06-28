// SI-KASKUL Backend — MySQL mode
// Usage: DB_HOST=localhost DB_USER=root DB_PASSWORD=mypass node app-mysql.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const store = require('./mysql-store');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

const PORT = process.env.PORT || 3000;
let database = store.createSeedDatabase();
let pool = null;

async function initDB() {
  pool = await store.createPool();
  if (pool) {
    await store.ensureTables(pool);
    await store.seedIfEmpty(pool, database);
    database = await store.loadAll(pool);
    console.log('🗄️  Database: MySQL');
  } else {
    console.log('🗄️  Database: In-Memory (set DB_HOST etc for MySQL)');
  }
}

async function persistDatabase() {
  if (pool) await store.syncAll(pool, database);
}

// ==============================
// HELPERS
// ==============================
function getWarga() { return database.warga || []; }
function getPbb() { return database.pbb || []; }
function getUsers() { return database.users || []; }

function computeOverviewStats(list) {
  if (!list || list.length === 0) return { totalWp: 0, totalPajak: 0, totalLunas: 0, totalBelumBayar: 0, totalPending: 0 };
  let totalPajak = 0, totalLunas = 0, totalBelumBayar = 0, totalPending = 0;
  for (const w of list) {
    if (!w.payments) continue;
    for (const p of w.payments) {
      totalPajak += p.pajak || 0;
      if (p.status === 'Lunas') totalLunas += p.pajak;
      else if (p.status === 'Pending') totalPending += p.pajak;
      else totalBelumBayar += p.pajak;
    }
  }
  return { totalWp: list.length, totalPajak, totalLunas, totalBelumBayar, totalPending };
}

function computePerYearStats(list) {
  const byYear = {};
  for (const w of list) {
    if (!w.payments) continue;
    for (const p of w.payments) {
      if (!byYear[p.year]) byYear[p.year] = { year: p.year, total: 0, lunas: 0, pending: 0, belumBayar: 0, countLunas: 0, countPending: 0, countBelumBayar: 0 };
      byYear[p.year].total += p.pajak;
      if (p.status === 'Lunas') { byYear[p.year].lunas += p.pajak; byYear[p.year].countLunas++; }
      else if (p.status === 'Pending') { byYear[p.year].pending += p.pajak; byYear[p.year].countPending++; }
      else { byYear[p.year].belumBayar += p.pajak; byYear[p.year].countBelumBayar++; }
    }
  }
  return Object.values(byYear).sort((a, b) => a.year - b.year);
}

function computeDusunStats(list) {
  const byDusun = {};
  for (const w of list) {
    const key = w.dusun || 'luardesa';
    if (!byDusun[key]) byDusun[key] = { dusun: key, dusunNama: w.dusunNama || 'Luar Desa', totalPajak: 0, totalLunas: 0, totalBelumBayar: 0, totalPending: 0, count: 0 };
    byDusun[key].count++;
    if (!w.payments) continue;
    for (const p of w.payments) {
      byDusun[key].totalPajak += p.pajak;
      if (p.status === 'Lunas') byDusun[key].totalLunas += p.pajak;
      else if (p.status === 'Pending') byDusun[key].totalPending += p.pajak;
      else byDusun[key].totalBelumBayar += p.pajak;
    }
  }
  return Object.values(byDusun);
}

// ==============================
// AUTH
// ==============================
function findUser({ email, nik, password }) {
  const users = getUsers();
  const e = email ? String(email).trim().toLowerCase() : '';
  const n = nik ? String(nik).trim() : '';
  const p = password ? String(password) : '';
  return users.find(u => (e && u.email && u.email.toLowerCase() === e || n && u.nik && String(u.nik) === n) && u.password === p);
}

function handleLogin(req, res) {
  const { email, nik, password } = req.body;
  const user = findUser({ email, nik, password });
  if (!user) return res.status(401).json({ success: false, message: 'Kredensial tidak valid' });
  res.json({ success: true, token: `${user.role}_token_${Date.now()}_${user.id}`, user: { id: user.id, name: user.name, role: user.role, email: user.email, nik: user.nik, rt: user.rt, rw: user.rw } });
}

// ==============================
// ROUTES
// ==============================
app.post(['/api/auth/login', '/auth/login'], handleLogin);
app.post(['/api/auth/admin-login', '/auth/admin-login'], handleLogin);
app.post(['/api/auth/user-login', '/auth/user-login'], handleLogin);

// --- PBB Public Stats ---
app.get('/api/pbb/stats/overview', (req, res) => {
  const w = getWarga();
  res.json({ success: true, data: { overview: computeOverviewStats(w), perYear: computePerYearStats(w), perDusun: computeDusunStats(w) } });
});
app.get('/api/pbb/stats/per-year', (req, res) => res.json({ success: true, data: computePerYearStats(getWarga()) }));
app.get('/api/pbb/stats/by-dusun', (req, res) => res.json({ success: true, data: computeDusunStats(getWarga()) }));
app.get('/api/pbb/stats/by-dusun/:dusunId', (req, res) => {
  const w = getWarga().filter(w => (w.dusun || 'luardesa') === req.params.dusunId);
  const byRw = {};
  for (const ww of w) {
    const key = ww.rw || 'luar';
    if (!byRw[key]) byRw[key] = { rw: key, rwNama: ww.rwNama || '-', totalPajak: 0, totalLunas: 0, totalBelumBayar: 0, totalPending: 0, count: 0 };
    byRw[key].count++;
    if (!ww.payments) continue;
    for (const p of ww.payments) { byRw[key].totalPajak += p.pajak; if (p.status === 'Lunas') byRw[key].totalLunas += p.pajak; else if (p.status === 'Pending') byRw[key].totalPending += p.pajak; else byRw[key].totalBelumBayar += p.pajak; }
  }
  res.json({ success: true, data: Object.values(byRw), dusun: req.params.dusunId });
});
app.get('/api/pbb/stats/by-dusun/:dusunId/rw/:rwId', (req, res) => {
  const w = getWarga().filter(w => (w.dusun || 'luardesa') === req.params.dusunId && (w.rw || 'luar') === req.params.rwId);
  const byRt = {};
  for (const ww of w) {
    const key = ww.rt || 'luar';
    if (!byRt[key]) byRt[key] = { rt: key, rtNama: ww.rtNama || '-', totalPajak: 0, totalLunas: 0, totalBelumBayar: 0, totalPending: 0, count: 0 };
    byRt[key].count++;
    if (!ww.payments) continue;
    for (const p of ww.payments) { byRt[key].totalPajak += p.pajak; if (p.status === 'Lunas') byRt[key].totalLunas += p.pajak; else if (p.status === 'Pending') byRt[key].totalPending += p.pajak; else byRt[key].totalBelumBayar += p.pajak; }
  }
  res.json({ success: true, data: Object.values(byRt), dusun: req.params.dusunId, rw: req.params.rwId });
});
app.post('/api/pbb/check-nop', (req, res) => {
  const { nop } = req.body;
  if (!nop) return res.status(400).json({ success: false, message: 'NOP wajib diisi' });
  const w = getWarga().find(w => w.nop === String(nop).trim());
  if (!w) return res.status(404).json({ success: false, message: 'NOP tidak ditemukan' });
  const perYear = (w.payments || []).map(p => ({ year: p.year, status: p.status, pajak: p.pajak }));
  res.json({ success: true, data: { nop: w.nop, nama: w.nama, alamat: w.alamat, dusun: w.dusunNama, rw: w.rwNama, rt: w.rtNama, totalPajak: w.totalPajak, totalLunas: w.totalLunas, totalBelumBayar: w.totalBelumBayar, perYear } });
});

// --- PBB Admin ---
app.get('/api/pbb', (req, res) => res.json({ success: true, data: getPbb() }));
app.get('/api/pbb/summary', (req, res) => {
  const p = getPbb(); const lunas = p.filter(x => x.status === 'Lunas').length;
  res.json({ success: true, data: { total: p.length, lunas, nunggak: p.length - lunas } });
});
app.post('/api/pbb/upload', async (req, res) => {
  const { data } = req.body;
  if (!Array.isArray(data) || !data.length) return res.status(400).json({ success: false, message: 'Data tidak valid' });
  const pbb = getPbb(); const maxId = pbb.length ? Math.max(...pbb.map(p => p.id)) : 0;
  const added = data.map((item, i) => {
    const id = maxId + i + 1;
    const rec = { id, nop: item.nop, nama: item.nama, alamat: item.alamat, rt: item.rt, rw: item.rw, year: item.year, pajak: Number(item.pajak) || 0, status: item.status || 'Nunggak', proofs: [] };
    pbb.push(rec); return rec;
  });
  await persistDatabase();
  res.status(201).json({ success: true, data: added });
});
app.post('/api/pbb/:id/proof', async (req, res) => {
  const { id } = req.params; const { userId, note, proofUrl } = req.body;
  const user = getUsers().find(u => u.id === Number(userId));
  const pbb = getPbb().find(p => p.id === Number(id));
  if (!user || !pbb) return res.status(404).json({ success: false, message: 'Not found' });
  if (user.role !== 'kolektor' && user.role !== 'rt') return res.status(403).json({ success: false });
  if (!pbb.proofs) pbb.proofs = [];
  pbb.proofs.push({ timestamp: new Date().toISOString(), uploader: user.name, role: user.role, note: note || '', proofUrl: proofUrl || null, status: 'Menunggu Persetujuan' });
  pbb.status = 'Pending';
  await persistDatabase();
  res.status(201).json({ success: true, data: pbb.proofs[pbb.proofs.length - 1] });
});
app.post('/api/pbb/:id/approve', async (req, res) => {
  const { id } = req.params; const { userId, approveStatus, note } = req.body;
  const user = getUsers().find(u => u.id === Number(userId));
  const pbb = getPbb().find(p => p.id === Number(id));
  if (!user || !pbb) return res.status(404).json({ success: false, message: 'Not found' });
  if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
  database.approvals.push({ id: (database.approvals||[]).length + 1, pbbId: pbb.id, nop: pbb.nop, nama: pbb.nama, approvedBy: user.name, approveStatus: approveStatus || 'Disetujui', note: note || '', approvedAt: new Date().toISOString() });
  pbb.status = approveStatus === 'Ditolak' ? 'Nunggak' : 'Lunas';
  await persistDatabase();
  res.json({ success: true, data: pbb });
});
app.get('/api/pbb/approvals', (req, res) => res.json({ success: true, data: database.approvals || [] }));
app.get('/api/pbb/approvals/export', (req, res) => {
  const rows = [['ID','PBB ID','NOP','Nama','Approved By','Status','Note','Approved At']];
  (database.approvals||[]).forEach(a => rows.push([a.id, a.pbbId, a.nop, a.nama, a.approvedBy, a.approveStatus, a.note, a.approvedAt]));
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="approval-history.csv"');
  res.send(rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n'));
});

// --- Berita CRUD ---
app.get('/api/berita', (req, res) => res.json({ success: true, data: database.berita }));
app.get('/api/berita/:id', (req, res) => { const b = database.berita.find(x => x.id == req.params.id); b ? res.json({ success: true, data: b }) : res.status(404).json({ success: false, message: 'Not found' }); });
app.post('/api/berita', async (req, res) => {
  const { title, category, content } = req.body;
  const id = Math.max(...database.berita.map(b => b.id), 0) + 1;
  const item = { id, title, category, date: new Date().toISOString().split('T')[0], content };
  database.berita.push(item); await persistDatabase(); res.status(201).json({ success: true, data: item });
});
app.put('/api/berita/:id', async (req, res) => {
  const i = database.berita.findIndex(b => b.id == req.params.id);
  if (i === -1) return res.status(404).json({ success: false, message: 'Not found' });
  Object.assign(database.berita[i], req.body); await persistDatabase(); res.json({ success: true, data: database.berita[i] });
});
app.delete('/api/berita/:id', async (req, res) => {
  const i = database.berita.findIndex(b => b.id == req.params.id);
  if (i === -1) return res.status(404).json({ success: false });
  database.berita.splice(i, 1); await persistDatabase(); res.json({ success: true, message: 'Dihapus' });
});

// --- Bansos CRUD ---
app.get('/api/bansos', (req, res) => res.json({ success: true, data: database.bansos }));
app.get('/api/bansos/programs', (req, res) => res.json({ success: true, data: database.bansosPrograms || [] }));
app.post('/api/bansos', async (req, res) => {
  const { nama, alamat, rt, program, status } = req.body;
  const id = Math.max(...database.bansos.map(b => b.id), 0) + 1;
  database.bansos.push({ id, no: id, nama, alamat, rt, program, status: status || 'Aktif' });
  await persistDatabase(); res.status(201).json({ success: true, data: { id } });
});
app.put('/api/bansos/:id', async (req, res) => {
  const i = database.bansos.findIndex(b => b.id == req.params.id);
  if (i === -1) return res.status(404).json({ success: false });
  Object.assign(database.bansos[i], req.body); await persistDatabase(); res.json({ success: true, data: database.bansos[i] });
});
app.delete('/api/bansos/:id', async (req, res) => {
  const i = database.bansos.findIndex(b => b.id == req.params.id);
  if (i === -1) return res.status(404).json({ success: false });
  database.bansos.splice(i, 1); await persistDatabase(); res.json({ success: true, message: 'Dihapus' });
});

// --- Pengaduan ---
app.get('/api/pengaduan', (req, res) => res.json({ success: true, data: database.pengaduan }));
app.post('/api/pengaduan', async (req, res) => {
  const { name, contact, type, message } = req.body;
  const id = (database.pengaduan||[]).length + 1;
  database.pengaduan.push({ id, name, contact, type, message, submittedAt: new Date().toISOString(), status: 'Diterima' });
  await persistDatabase(); res.status(201).json({ success: true, data: { id } });
});
app.put('/api/pengaduan/:id', async (req, res) => {
  const i = (database.pengaduan||[]).findIndex(p => p.id == req.params.id);
  if (i === -1) return res.status(404).json({ success: false });
  Object.assign(database.pengaduan[i], req.body); await persistDatabase(); res.json({ success: true, data: database.pengaduan[i] });
});

// --- Users CRUD ---
app.get('/api/users', (req, res) => res.json({ success: true, data: getUsers().map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, rt: u.rt, rw: u.rw })) }));
app.post('/api/users', async (req, res) => {
  const { name, email, password, role, rt, rw } = req.body;
  const id = Math.max(...getUsers().map(u => u.id), 0) + 1;
  database.users.push({ id, name, email, password, role, rt: rt||null, rw: rw||null });
  await persistDatabase(); res.status(201).json({ success: true, data: { id, name, email, role } });
});
app.put('/api/users/:id', async (req, res) => {
  const i = getUsers().findIndex(u => u.id == req.params.id);
  if (i === -1) return res.status(404).json({ success: false });
  Object.assign(database.users[i], req.body); await persistDatabase(); res.json({ success: true, data: database.users[i] });
});
app.delete('/api/users/:id', async (req, res) => {
  const i = getUsers().findIndex(u => u.id == req.params.id);
  if (i === -1) return res.status(404).json({ success: false });
  database.users.splice(i, 1); await persistDatabase(); res.json({ success: true, message: 'Dihapus' });
});

// --- Surat Online ---
app.get('/api/surat', (req, res) => res.json({ success: true, data: database.surat || [] }));
app.post('/api/surat', async (req, res) => {
  const { jenis, nama, nik, alamat, keperluan } = req.body;
  if (!jenis || !nama || !nik) return res.status(400).json({ success: false, message: 'Jenis, nama, dan NIK wajib' });
  const id = (database.surat||[]).length + 1;
  const surat = { id, jenis, nama, nik, alamat: alamat||'', keperluan: keperluan||'', status: 'Diajukan', nomorSurat: null, ditandatanganiOleh: null, catatan: '', diajukanPada: new Date().toISOString(), diprosesPada: null };
  if (!database.surat) database.surat = [];
  database.surat.push(surat); await persistDatabase(); res.status(201).json({ success: true, data: surat });
});
app.put('/api/surat/:id', async (req, res) => {
  const i = (database.surat||[]).findIndex(s => s.id == req.params.id);
  if (i === -1) return res.status(404).json({ success: false });
  const { status, catatan, nomorSurat, ditandatanganiOleh } = req.body;
  if (status) database.surat[i].status = status;
  if (catatan !== undefined) database.surat[i].catatan = catatan;
  if (nomorSurat) database.surat[i].nomorSurat = nomorSurat;
  if (ditandatanganiOleh) database.surat[i].ditandatanganiOleh = ditandatanganiOleh;
  if (status === 'Selesai' && !database.surat[i].nomorSurat) database.surat[i].nomorSurat = 'SURAT-' + String(database.surat[i].id).padStart(4,'0') + '/' + new Date().getFullYear();
  await persistDatabase(); res.json({ success: true, data: database.surat[i] });
});
app.delete('/api/surat/:id', async (req, res) => {
  const i = (database.surat||[]).findIndex(s => s.id == req.params.id);
  if (i === -1) return res.status(404).json({ success: false });
  database.surat.splice(i, 1); await persistDatabase(); res.json({ success: true, message: 'Dihapus' });
});

// --- Dashboard ---
app.get('/api/dashboard/stats', (req, res) => {
  const w = getWarga(); const p = getPbb();
  res.json({ success: true, data: {
    totalPenduduk: w.length, totalKK: Math.max(1, Math.floor(w.length/3)),
    totalBerita: database.berita.length, totalPBB: p.length, totalBansos: database.bansos.length,
    totalPajakTerkumpul: p.reduce((s,i)=>i.status==='Lunas'?s+i.pajak:s,0),
    tingkatPembayaranPBB: p.length ? Math.round(p.filter(i=>i.status==='Lunas').length/p.length*100) : 0,
    pendingPBB: p.filter(p=>p.status==='Pending').length,
  }});
});

// --- Health ---
app.get(['/api/health', '/health'], (req, res) => res.json({ success: true, message: 'API SI-KASKUL - OK', dataCount: getWarga().length, db: pool ? 'MySQL' : 'In-Memory', time: new Date().toISOString() }));

// --- 404 ---
app.use((req, res) => res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); });

// --- Start ---
async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`✅ SI-KASKUL API running at http://localhost:${PORT}`);
    console.log(`📊 Warga: ${getWarga().length} | PBB: ${getPbb().length}`);
    console.log(`🗄️  Database: ${pool ? 'MySQL' : 'In-Memory'}`);
  });
}
start().catch(e => { console.error('Fatal:', e); process.exit(1); });

module.exports = app;