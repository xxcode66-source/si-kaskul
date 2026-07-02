require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const store = require('./mysql-store');
const { createPbbRoutes } = require('./pbb-routes');
const { Document, Packer, Paragraph, TextRun, AlignmentType, Tab, TabStopPosition, TabStopType } = require('docx');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Clean URL support: try .html extension BEFORE static serving
app.use((req, res, next) => {
  // Skip if path has extension, is API, or ends with /
  if (path.extname(req.path) || req.path.startsWith('/api/') || req.path.endsWith('/')) return next();
  const htmlPath = path.join(__dirname, '..', req.path + '.html');
  if (fs.existsSync(htmlPath)) {
    req.url = req.path + '.html' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
  }
  next();
});

// Serve static frontend (after clean URL rewrite)
app.use(express.static(path.join(__dirname, '..')));

const PORT = process.env.PORT || 3000;
let database = store.createSeedDatabase();
let pool = null;

// Load imported Excel data if available
function loadImportedData() {
  const importedFile = path.join(__dirname, 'imported-data.json');
  if (fs.existsSync(importedFile)) {
    try {
      const imported = JSON.parse(fs.readFileSync(importedFile, 'utf-8'));
      // Merge imported data with seed data (keep users, berita, etc from seed)
      const seed = store.createSeedDatabase();
      database = {
        ...seed,
        penduduk: imported.penduduk || seed.penduduk,
        warga: imported.warga || seed.warga,
        pbb: imported.pbb || seed.pbb,
      };
      console.log(`📊 Imported data loaded: ${database.penduduk.length} penduduk, ${database.warga.length} PBB warga`);
    } catch (e) {
      console.error('⚠️ Failed to load imported data:', e.message);
    }
  }
}

loadImportedData();

async function initDB() {
  pool = await store.createPool();
  if (pool) {
    await store.ensureTables(pool);
    await store.seedIfEmpty(pool, database);
    database = await store.loadAll(pool);
    console.log(`🗄️  Database: MySQL — Penduduk: ${(database.penduduk||[]).length}, Warga: ${(database.warga||[]).length}, PBB: ${(database.pbb||[]).length}`);
  } else {
    console.log(`🗄️  Database: In-Memory — Penduduk: ${(database.penduduk||[]).length} (set DB_HOST etc for MySQL)`);
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
  return users.find(u =>
    (e && u.email && u.email.toLowerCase() === e || n && u.nik && String(u.nik) === n) &&
    u.password === p
  );
}

function handleLogin(req, res) {
  const { email, nik, password } = req.body;
  const user = findUser({ email, nik, password });
  if (!user) return res.status(401).json({ success: false, message: 'Kredensial tidak valid' });
  res.json({
    success: true,
    token: `${user.role}_token_${Date.now()}_${user.id}`,
    user: { id: user.id, name: user.name, role: user.role, email: user.email, nik: user.nik, rt: user.rt, rw: user.rw }
  });
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
    for (const p of ww.payments) {
      byRw[key].totalPajak += p.pajak;
      if (p.status === 'Lunas') byRw[key].totalLunas += p.pajak;
      else if (p.status === 'Pending') byRw[key].totalPending += p.pajak;
      else byRw[key].totalBelumBayar += p.pajak;
    }
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
    for (const p of ww.payments) {
      byRt[key].totalPajak += p.pajak;
      if (p.status === 'Lunas') byRt[key].totalLunas += p.pajak;
      else if (p.status === 'Pending') byRt[key].totalPending += p.pajak;
      else byRt[key].totalBelumBayar += p.pajak;
    }
  }
  res.json({ success: true, data: Object.values(byRt), dusun: req.params.dusunId, rw: req.params.rwId });
});

// --- PBB Check NOP ---
app.post('/api/pbb/check-nop', (req, res) => {
  const { nop } = req.body;
  if (!nop) return res.status(400).json({ success: false, message: 'NOP wajib diisi' });
  const w = getWarga().find(w => w.nop === String(nop).trim());
  if (!w) return res.status(404).json({ success: false, message: 'NOP tidak ditemukan' });
  const perYear = (w.payments || []).map(p => ({ year: p.year, status: p.status, pajak: p.pajak }));
  res.json({
    success: true,
    data: {
      nop: w.nop, nama: w.nama, alamat: w.alamat, dusun: w.dusunNama,
      rw: w.rwNama, rt: w.rtNama,
      totalPajak: w.totalPajak, totalLunas: w.totalLunas, totalBelumBayar: w.totalBelumBayar,
      perYear
    }
  });
});

// --- PBB Accessible (for user portal by NIK) ---
app.post('/api/pbb/accessible', (req, res) => {
  const { userId, nik } = req.body;
  if (!nik && !userId) return res.status(400).json({ success: false, message: 'NIK atau userId diperlukan' });
  const pbb = getPbb();
  if (!pbb || pbb.length === 0) return res.json({ success: true, data: [] });
  // Filter by NIK or try user ID
  let hasil;
  if (nik) {
    hasil = pbb.filter(p => p.nik === String(nik).trim());
  } else {
    const user = getUsers().find(u => u.id === Number(userId));
    if (!user) return res.json({ success: true, data: [] });
    hasil = user.nik ? pbb.filter(p => p.nik === user.nik) : [];
  }
  res.json({ success: true, data: hasil });
});

// --- PBB Warga List (for table view, with pagination + RT/RW filter) ---
app.get('/api/pbb/warga-list', (req, res) => {
  let w = getWarga();
  const { q, dusun, rw, rt, status, page = 1, limit = 50 } = req.query;
  // Filter
  if (q) {
    const lq = q.toLowerCase();
    w = w.filter(x => (x.nama || '').toLowerCase().includes(lq) || (x.nop || '').includes(lq) || (x.rtNama || '').toLowerCase().includes(lq) || (x.rwNama || '').toLowerCase().includes(lq));
  }
  if (dusun) w = w.filter(x => (x.dusun || '') === dusun);
  if (rw) w = w.filter(x => (x.rw || '') === rw || (x.rwNama || '').toLowerCase() === rw.toLowerCase());
  if (rt) w = w.filter(x => (x.rt || '') === rt || (x.rtNama || '').toLowerCase() === rt.toLowerCase());
  if (status) w = w.filter(x => {
    const p2026 = (x.payments || []).find(p => p.year === 2026);
    return p2026 && p2026.status === status;
  });
  const list = w.map(warga => {
    const payments = warga.payments || [];
    const totalPajak = payments.reduce((s, p) => s + (p.pajak || 0), 0);
    const totalLunas = payments.filter(p => p.status === 'Lunas').reduce((s, p) => s + (p.pajak || 0), 0);
    const totalBelumBayar = payments.filter(p => p.status !== 'Lunas' && p.status !== 'Pending').reduce((s, p) => s + (p.pajak || 0), 0);
    const totalPending = payments.filter(p => p.status === 'Pending').reduce((s, p) => s + (p.pajak || 0), 0);
    const p2026 = payments.find(p => p.year === 2026);
    const status2026 = p2026 ? p2026.status : 'Belum Bayar';
    const tunggakan = payments.filter(p => p.status !== 'Lunas').length;
    return {
      nop: warga.nop, nama: warga.nama, alamat: warga.alamat,
      dusun: warga.dusun, dusunNama: warga.dusunNama || '-',
      rw: warga.rw, rwNama: warga.rwNama || '-',
      rt: warga.rt, rtNama: warga.rtNama || '-',
      status: warga.status, status2026,
      tunggakan,
      totalPajak, totalLunas, totalBelumBayar, totalPending,
      payments,
      perYear: payments.map(p => ({ year: p.year, status: p.status, pajak: p.pajak }))
    };
  });
  // Pagination
  const total = list.length;
  const lim = parseInt(limit) || 50;
  const pg = parseInt(page) || 1;
  const start = (pg - 1) * lim;
  const paginated = list.slice(start, start + lim);
  res.json({ success: true, data: paginated, total, page: pg, limit: lim, totalPages: Math.ceil(total / lim) });
});

// --- PBB Admin CRUD ---
app.get('/api/pbb', (req, res) => res.json({ success: true, data: getPbb() }));
app.get('/api/pbb/summary', (req, res) => {
  const w = getWarga();
  const lunas = w.filter(x => x.status === 'Lunas').length;
  const sebagian = w.filter(x => x.status === 'Sebagian').length;
  res.json({ success: true, data: { total: w.length, lunas, sebagian, nunggak: w.length - lunas - sebagian } });
});

app.post('/api/pbb/upload', async (req, res) => {
  const { data } = req.body;
  if (!Array.isArray(data) || !data.length) return res.status(400).json({ success: false, message: 'Data tidak valid' });
  const pbb = getPbb();
  const maxId = pbb.length ? Math.max(...pbb.map(p => p.id)) : 0;
  const added = data.map((item, i) => {
    const id = maxId + i + 1;
    return { id, nop: item.nop, nama: item.nama, nik: item.nik, alamat: item.alamat, rt: item.rt, rw: item.rw, year: item.year, pajak: Number(item.pajak) || 0, status: item.status || 'Nunggak', payments: [], proofs: [] };
  });
  pbb.push(...added);
  await persistDatabase();
  res.status(201).json({ success: true, data: added });
});

app.post('/api/pbb/:id/proof', async (req, res) => {
  const { id } = req.params;
  const { userId, note, proofUrl } = req.body;
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
  const { id } = req.params;
  const { userId, approveStatus, note } = req.body;
  const user = getUsers().find(u => u.id === Number(userId));
  const pbb = getPbb().find(p => p.id === Number(id));
  if (!user || !pbb) return res.status(404).json({ success: false, message: 'Not found' });
  if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
  database.approvals.push({
    id: (database.approvals || []).length + 1, pbbId: pbb.id, nop: pbb.nop, nama: pbb.nama,
    approvedBy: user.name, approveStatus: approveStatus || 'Disetujui', note: note || '',
    approvedAt: new Date().toISOString()
  });
  pbb.status = approveStatus === 'Ditolak' ? 'Nunggak' : 'Lunas';
  await persistDatabase();
  res.json({ success: true, data: pbb });
});

app.get('/api/pbb/approvals', (req, res) => res.json({ success: true, data: database.approvals || [] }));

app.get('/api/pbb/approvals/export', (req, res) => {
  const rows = [['ID', 'PBB ID', 'NOP', 'Nama', 'Approved By', 'Status', 'Note', 'Approved At']];
  (database.approvals || []).forEach(a => rows.push([a.id, a.pbbId, a.nop, a.nama, a.approvedBy, a.approveStatus, a.note, a.approvedAt]));
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="approval-history.csv"');
  res.send(rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'));
});

// --- Payment Proofs (pbb_warga based) ---
if (!database.payment_proofs) database.payment_proofs = [];

// Upload proof for a NOP + year (RT/Kolektor)
app.post('/api/pbb/warga/:nop/proof', async (req, res) => {
  const { nop } = req.params;
  const { userId, year, proofData, proofName } = req.body;
  if (!year || !proofData) return res.status(400).json({ success: false, message: 'Tahun dan bukti wajib diisi' });
  const user = getUsers().find(u => u.id === Number(userId));
  if (!user || (user.role !== 'rt' && user.role !== 'kolektor' && user.role !== 'admin')) {
    return res.status(403).json({ success: false, message: 'Role tidak diizinkan' });
  }
  const warga = getWarga().find(w => w.nop === nop);
  if (!warga) return res.status(404).json({ success: false, message: 'NOP tidak ditemukan' });

  if (!database.payment_proofs) database.payment_proofs = [];
  const maxId = database.payment_proofs.length ? Math.max(...database.payment_proofs.map(p => p.id)) : 0;
  const proof = {
    id: maxId + 1,
    nop, nama: warga.nama, year: parseInt(year),
    proofData, proofName: proofName || 'bukti',
    uploadedBy: user.name, uploadedById: user.id,
    uploadedAt: new Date().toISOString(),
    status: 'Menunggu Approval'
  };
  database.payment_proofs.push(proof);
  await persistDatabase();
  res.status(201).json({ success: true, data: proof });
});

// List all payment proofs (admin)
app.get('/api/pbb/proofs', (req, res) => {
  const proofs = database.payment_proofs || [];
  res.json({ success: true, data: proofs });
});

// Approve/reject a proof (admin only)
app.post('/api/pbb/proof/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { userId, approveStatus, note } = req.body;
  const user = getUsers().find(u => u.id === Number(userId));
  if (!user || user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });

  const proof = (database.payment_proofs || []).find(p => p.id === Number(id));
  if (!proof) return res.status(404).json({ success: false, message: 'Proof tidak ditemukan' });

  const status = approveStatus || 'Disetujui';
  proof.status = status === 'Ditolak' ? 'Ditolak' : 'Disetujui';
  proof.reviewedBy = user.name;
  proof.reviewedAt = new Date().toISOString();
  proof.note = note || '';

  if (proof.status === 'Disetujui') {
    // Update pbb_warga payment status for that year
    const warga = getWarga().find(w => w.nop === proof.nop);
    if (warga && Array.isArray(warga.payments)) {
      const payment = warga.payments.find(p => p.year === proof.year);
      if (payment) {
        payment.status = 'Lunas';
        payment.paidAt = new Date().toISOString();
        payment.namaPenyetor = warga.nama;
        payment.keterangan = 'Disetujui admin - bukti upload RT';
      }
      // Recalculate totals
      warga.totalLunas = warga.payments.filter(p => p.status === 'Lunas').reduce((s, p) => s + (p.pajak || 0), 0);
      warga.totalBelumBayar = warga.payments.filter(p => p.status !== 'Lunas').reduce((s, p) => s + (p.pajak || 0), 0);
      const lunasCount = warga.payments.filter(p => p.status === 'Lunas').length;
      const years = warga.payments.length;
      if (lunasCount === years) warga.status = 'Lunas';
      else if (lunasCount >= 3) warga.status = 'Sebagian';
      else if (lunasCount === 0) warga.status = 'Menunggak';
      else warga.status = 'Belum Bayar';
    }
  }

  // Add to approvals log
  if (!database.approvals) database.approvals = [];
  database.approvals.push({
    id: (database.approvals || []).length + 1,
    pbbId: proof.id, nop: proof.nop, nama: proof.nama,
    approvedBy: user.name, approveStatus: proof.status,
    note: note || '', approvedAt: proof.reviewedAt
  });

  await persistDatabase();
  res.json({ success: true, data: proof });
});

// --- Berita CRUD ---
app.get('/api/berita', (req, res) => res.json({ success: true, data: database.berita }));
app.get('/api/berita/:id', (req, res) => {
  const b = database.berita.find(x => x.id == req.params.id);
  b ? res.json({ success: true, data: b }) : res.status(404).json({ success: false, message: 'Not found' });
});
app.post('/api/berita', async (req, res) => {
  const { title, category, content } = req.body;
  const id = Math.max(...database.berita.map(b => b.id), 0) + 1;
  const item = { id, title, category, date: new Date().toISOString().split('T')[0], content };
  database.berita.push(item);
  await persistDatabase();
  res.status(201).json({ success: true, data: item });
});
app.put('/api/berita/:id', async (req, res) => {
  const i = database.berita.findIndex(b => b.id == req.params.id);
  if (i === -1) return res.status(404).json({ success: false, message: 'Not found' });
  Object.assign(database.berita[i], req.body);
  await persistDatabase();
  res.json({ success: true, data: database.berita[i] });
});
app.delete('/api/berita/:id', async (req, res) => {
  const i = database.berita.findIndex(b => b.id == req.params.id);
  if (i === -1) return res.status(404).json({ success: false });
  database.berita.splice(i, 1);
  await persistDatabase();
  res.json({ success: true, message: 'Dihapus' });
});

// --- Bansos CRUD ---
app.get('/api/bansos', (req, res) => res.json({ success: true, data: database.bansos }));
app.get('/api/bansos/programs', (req, res) => res.json({ success: true, data: database.bansosPrograms || [] }));
app.post('/api/bansos', async (req, res) => {
  const { nama, alamat, rt, program, status } = req.body;
  const id = Math.max(...database.bansos.map(b => b.id), 0) + 1;
  database.bansos.push({ id, no: id, nama, alamat, rt, program, status: status || 'Aktif' });
  await persistDatabase();
  res.status(201).json({ success: true, data: { id } });
});
app.put('/api/bansos/:id', async (req, res) => {
  const i = database.bansos.findIndex(b => b.id == req.params.id);
  if (i === -1) return res.status(404).json({ success: false });
  Object.assign(database.bansos[i], req.body);
  await persistDatabase();
  res.json({ success: true, data: database.bansos[i] });
});
app.delete('/api/bansos/:id', async (req, res) => {
  const i = database.bansos.findIndex(b => b.id == req.params.id);
  if (i === -1) return res.status(404).json({ success: false });
  database.bansos.splice(i, 1);
  await persistDatabase();
  res.json({ success: true, message: 'Dihapus' });
});

// --- Pengaduan CRUD ---
app.get('/api/pengaduan', (req, res) => res.json({ success: true, data: database.pengaduan }));
app.get('/api/pengaduan/:id', (req, res) => {
  const item = (database.pengaduan || []).find(p => p.id == req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Pengaduan tidak ditemukan' });
  res.json({ success: true, data: item });
});
app.post('/api/pengaduan', async (req, res) => {
  const { name, contact, type, message } = req.body;
  const id = (database.pengaduan || []).length + 1;
  database.pengaduan.push({ id, name, contact, type, message, submittedAt: new Date().toISOString(), status: 'Diterima' });
  await persistDatabase();
  res.status(201).json({ success: true, data: { id } });
});
app.put('/api/pengaduan/:id', async (req, res) => {
  const i = (database.pengaduan || []).findIndex(p => p.id == req.params.id);
  if (i === -1) return res.status(404).json({ success: false });
  Object.assign(database.pengaduan[i], req.body);
  await persistDatabase();
  res.json({ success: true, data: database.pengaduan[i] });
});

// --- Surat Online CRUD ---
app.get('/api/surat', (req, res) => res.json({ success: true, data: database.surat || [] }));
app.post('/api/surat', async (req, res) => {
  const { jenis, nama, nik, alamat, keperluan, tempatLahir, tanggalLahir, pekerjaan, jenisUsaha, rt, rw, dusun, keterangan, fileKtp, fileKk, fileKtpName, fileKkName } = req.body;
  if (!jenis || !nama || !nik) return res.status(400).json({ success: false, message: 'Jenis, nama, dan NIK wajib' });
  if (!fileKtp || !fileKk) return res.status(400).json({ success: false, message: 'Upload KTP dan KK wajib dilengkapi' });
  const id = (database.surat || []).length + 1;
  const surat = {
    id, jenis, nama, nik, alamat: alamat || '', keperluan: keperluan || '',
    tempatLahir: tempatLahir || '', tanggalLahir: tanggalLahir || '',
    pekerjaan: pekerjaan || '', jenisUsaha: jenisUsaha || '',
    rt: rt || '', rw: rw || '', dusun: dusun || '', keterangan: keterangan || '',
    fileKtp: fileKtp || null, fileKtpName: fileKtpName || null,
    fileKk: fileKk || null, fileKkName: fileKkName || null,
    status: 'Pending', nomorSurat: null, ditandatanganiOleh: null,
    catatan: '', diajukanPada: new Date().toISOString(), diprosesPada: null
  };
  if (!database.surat) database.surat = [];
  database.surat.push(surat);
  await persistDatabase();
  res.status(201).json({ success: true, data: surat });
});
app.put('/api/surat/:id', async (req, res) => {
  const i = (database.surat || []).findIndex(s => s.id == req.params.id);
  if (i === -1) return res.status(404).json({ success: false });
  const { status, catatan, nomorSurat, ditandatanganiOleh, tandaTanganOleh } = req.body;
  if (status) database.surat[i].status = status;
  if (catatan !== undefined) database.surat[i].catatan = catatan;
  if (nomorSurat) database.surat[i].nomorSurat = nomorSurat;
  if (ditandatanganiOleh) database.surat[i].ditandatanganiOleh = ditandatanganiOleh;
  if (tandaTanganOleh) database.surat[i].tandaTanganOleh = tandaTanganOleh;
  if (status === 'Selesai' && !database.surat[i].nomorSurat) {
    database.surat[i].nomorSurat = 'SURAT-' + String(database.surat[i].id).padStart(4, '0') + '/' + new Date().getFullYear();
  }
  await persistDatabase();
  res.json({ success: true, data: database.surat[i] });
});
app.delete('/api/surat/:id', async (req, res) => {
  const i = (database.surat || []).findIndex(s => s.id == req.params.id);
  if (i === -1) return res.status(404).json({ success: false });
  database.surat.splice(i, 1);
  await persistDatabase();
  res.json({ success: true, message: 'Dihapus' });
});

// --- Surat Word Document Generation ---
app.get('/api/surat/:id/word', async (req, res) => {
  const surat = (database.surat || []).find(s => s.id == req.params.id);
  if (!surat) return res.status(404).json({ success: false, message: 'Surat tidak ditemukan' });

  const jenisLabels = {
    'Surat Keterangan Usaha': 'SURAT KETERANGAN USAHA',
    'Surat Keterangan Domisili': 'SURAT KETERANGAN DOMISILI',
    'Surat Keterangan Tidak Mampu (SKTM)': 'SURAT KETERANGAN TIDAK MAMPU',
    'Surat Pengantar KTP': 'SURAT PENGANTAR KTP',
    'Surat Pengantar KK': 'SURAT PENGANTAR KARTU KELUARGA',
    'Surat Keterangan Kematian': 'SURAT KETERANGAN KEMATIAN',
    'Surat Keterangan Kelahiran': 'SURAT KETERANGAN KELAHIRAN'
  };

  const title = jenisLabels[surat.jenis] || 'SURAT KETERANGAN';
  const nomorSurat = surat.nomorSurat || `${String(surat.id).padStart(4, '0')}/SK/${new Date().getFullYear()}`;
  const tgl = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const children = [];

  // Header
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'PEMERINTAH DESA KASOMALANG KULON', bold: true, size: 28 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'KECAMATAN KASOMALANG — KABUPATEN SUBANG', size: 22 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'Jl. Raya Kasomalang Kulon, Jawa Barat', size: 20, italics: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: '═══════════════════════════════════════════════════', size: 20 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: title, bold: true, size: 28, underline: {} })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: `Nomor: ${nomorSurat}`, size: 22 })] })
  );

  // Body
  children.push(
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: `Yang bertanda tangan di bawah ini Kepala Desa Kasomalang Kulon, dengan ini menerangkan bahwa:`, size: 24 })] }),
    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `Nama\t\t: ${surat.nama}`, size: 24 })] }),
    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `NIK\t\t: ${surat.nik}`, size: 24 })] }),
  );

  if (surat.tempatLahir && surat.tanggalLahir) {
    children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `TTL\t\t: ${surat.tempatLahir}, ${surat.tanggalLahir}`, size: 24 })] }));
  }
  if (surat.pekerjaan) {
    children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `Pekerjaan\t: ${surat.pekerjaan}`, size: 24 })] }));
  }
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `Alamat\t\t: ${surat.alamat}`, size: 24 })] }));
  if (surat.rt) children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `RT/RW\t\t: ${surat.rt}/${surat.rw}`, size: 24 })] }));

  // Type-specific content
  if (surat.jenis === 'Surat Keterangan Usaha' && surat.jenisUsaha) {
    children.push(
      new Paragraph({ spacing: { before: 200, after: 200 }, children: [new TextRun({ text: `Adalah benar warga desa kami yang memiliki usaha:`, size: 24 })] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: `Jenis Usaha\t: ${surat.jenisUsaha}`, bold: true, size: 24 })] })
    );
  }

  if (surat.keperluan) {
    children.push(new Paragraph({ spacing: { before: 200, after: 200 }, children: [new TextRun({ text: `Surat keterangan ini diberikan untuk keperluan: ${surat.keperluan}`, size: 24 })] }));
  }

  if (surat.keterangan) {
    children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: `Keterangan: ${surat.keterangan}`, size: 24 })] }));
  }

  // Closing & signature
  const ttdOleh = surat.tandaTanganOleh || 'Kepala Desa'; // 'Kepala Desa' or 'a.n. Kepala Desa - Sekretaris Desa'
  const ttdNama = surat.ditandatanganiOleh || '(....................................)';
  
  children.push(
    new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text: `Demikian surat keterangan ini diberikan untuk dapat dipergunakan sebagaimana mestinya.`, size: 24 })] }),
    new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Kasomalang Kulon, ${tgl}`, size: 24 })] })
  );
  
  if (ttdOleh && ttdOleh.includes('Sekretaris')) {
    // a.n. Kepala Desa, Sekretaris Desa
    children.push(
      new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'a.n. Kepala Desa Kasomalang Kulon', size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Sekretaris Desa', size: 24 })] }),
      new Paragraph({ spacing: { before: 800 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: ttdNama, bold: true, size: 24 })] })
    );
  } else {
    // Kepala Desa directly
    children.push(
      new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Kepala Desa Kasomalang Kulon', size: 24 })] }),
      new Paragraph({ spacing: { before: 800 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: ttdNama, bold: true, size: 24 })] })
    );
  }

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);

  const filename = `${title.replace(/ /g, '_')}_${surat.nama.replace(/ /g, '_')}.docx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

// --- Users CRUD ---
app.get('/api/users', (req, res) => {
  res.json({ success: true, data: getUsers().map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, rt: u.rt, rw: u.rw })) });
});
app.post('/api/users', async (req, res) => {
  const { name, email, password, role, rt, rw } = req.body;
  const id = Math.max(...getUsers().map(u => u.id), 0) + 1;
  database.users.push({ id, name, email, password, role, rt: rt || null, rw: rw || null });
  await persistDatabase();
  res.status(201).json({ success: true, data: { id, name, email, role } });
});
app.put('/api/users/:id', async (req, res) => {
  const i = getUsers().findIndex(u => u.id == req.params.id);
  if (i === -1) return res.status(404).json({ success: false });
  Object.assign(database.users[i], req.body);
  await persistDatabase();
  res.json({ success: true, data: database.users[i] });
});
app.delete('/api/users/:id', async (req, res) => {
  const i = getUsers().findIndex(u => u.id == req.params.id);
  if (i === -1) return res.status(404).json({ success: false });
  database.users.splice(i, 1);
  await persistDatabase();
  res.json({ success: true, message: 'Dihapus' });
});

// --- Penduduk (Resident) API ---
app.get('/api/penduduk', (req, res) => {
  const penduduk = database.penduduk || [];
  const { search, rt, rw, agama, pendidikan, pekerjaan, jenisKelamin, page = 1, limit = 50 } = req.query;
  
  let filtered = [...penduduk];
  
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p => 
      (p.nama && p.nama.toLowerCase().includes(q)) ||
      (p.nik && p.nik.includes(q)) ||
      (p.kk && p.kk.includes(q)) ||
      (p.alamat && p.alamat.toLowerCase().includes(q))
    );
  }
  if (rt) filtered = filtered.filter(p => p.rt === rt);
  if (rw) filtered = filtered.filter(p => p.rw === rw);
  if (agama) filtered = filtered.filter(p => p.agama && p.agama.toLowerCase() === agama.toLowerCase());
  if (jenisKelamin) filtered = filtered.filter(p => p.jenisKelamin === jenisKelamin);
  if (pendidikan) filtered = filtered.filter(p => p.pendidikan && p.pendidikan.toLowerCase().includes(pendidikan.toLowerCase()));
  if (pekerjaan) filtered = filtered.filter(p => p.pekerjaan && p.pekerjaan.toLowerCase().includes(pekerjaan.toLowerCase()));
  
  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + parseInt(limit));
  
  // Stats
  const lk = filtered.filter(p => p.jenisKelamin === 'LAKI-LAKI').length;
  const pr = filtered.filter(p => p.jenisKelamin === 'PEREMPUAN').length;
  const rtSet = new Set(filtered.map(p => `${p.rt}/${p.rw}`));
  
  res.json({
    success: true,
    data: paginated,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
    stats: { total, lakiLaki: lk, perempuan: pr, uniqueRT: rtSet.size }
  });
});

// Lightweight filter options endpoint
app.get('/api/penduduk/filters', (req, res) => {
  const penduduk = database.penduduk || [];
  const rtSet = [...new Set(penduduk.map(p => p.rt))].sort();
  const agamaSet = [...new Set(penduduk.map(p => p.agama).filter(Boolean))].sort();
  const total = penduduk.length;
  const lk = penduduk.filter(p => p.jenisKelamin === 'LAKI-LAKI').length;
  res.json({ success: true, data: { rt: rtSet, agama: agamaSet, total, lakiLaki: lk, perempuan: total - lk } });
});

// Analytics stats endpoint (for public analytics page)
app.get('/api/penduduk/stats', (req, res) => {
  const penduduk = database.penduduk || [];
  const total = penduduk.length;
  const lk = penduduk.filter(p => p.jenisKelamin === 'LAKI-LAKI').length;
  const pr = total - lk;

  // Per-agama breakdown
  const byAgama = {};
  penduduk.forEach(p => { const a = p.agama || 'Lainnya'; byAgama[a] = (byAgama[a] || 0) + 1; });

  // Per-RT breakdown
  const byRt = {};
  penduduk.forEach(p => { const key = `RT ${p.rt}/RW ${p.rw}`; byRt[key] = (byRt[key] || 0) + 1; });

  // Age groups
  const ageGroups = { '0-14': 0, '15-24': 0, '25-44': 0, '45-64': 0, '65+': 0, 'N/A': 0 };
  penduduk.forEach(p => {
    if (!p.umur) { ageGroups['N/A']++; return; }
    if (p.umur <= 14) ageGroups['0-14']++;
    else if (p.umur <= 24) ageGroups['15-24']++;
    else if (p.umur <= 44) ageGroups['25-44']++;
    else if (p.umur <= 64) ageGroups['45-64']++;
    else ageGroups['65+']++;
  });

  // Unique RT/RW count
  const rtSet = new Set(penduduk.map(p => `${p.rt}/${p.rw}`));
  const kkSet = new Set(penduduk.map(p => p.kk).filter(Boolean));

  res.json({
    success: true,
    data: {
      total, lakiLaki: lk, perempuan: pr,
      uniqueRT: rtSet.size, uniqueKK: kkSet.size,
      byAgama, byRt, ageGroups
    }
  });
});

// Single record lookup by NIK
app.get('/api/penduduk/:nik', (req, res) => {
  const penduduk = database.penduduk || [];
  const p = penduduk.find(d => d.nik === req.params.nik);
  if (!p) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: p });
});

// --- Dashboard Stats ---
app.get('/api/dashboard/stats', (req, res) => {
  const w = getWarga();
  const totalPajak = w.reduce((s, i) => s + (i.totalLunas || 0), 0);
  const totalTarget = w.reduce((s, i) => s + (i.totalPajak || 0), 0);
  res.json({
    success: true,
    data: {
      totalPenduduk: database.penduduk ? database.penduduk.length : w.length,
      totalKK: Math.max(1, Math.floor((database.penduduk ? database.penduduk.length : w.length) / 3)),
      totalBerita: database.berita.length,
      totalPBB: w.length,
      totalBansos: database.bansos.length,
      totalPajakTerkumpul: totalPajak,
      tingkatPembayaranPBB: totalTarget ? Math.round(totalPajak / totalTarget * 100) : 0,
      pendingPBB: 0,
    }
  });
});

// --- Health ---
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    success: true, message: 'API SI-KASKUL - OK',
    db: pool ? 'MySQL' : 'In-Memory',
    penduduk: (database.penduduk || []).length,
    warga: getWarga().length,
    pbb: getPbb().length,
    berita: (database.berita || []).length,
    time: new Date().toISOString()
  });
});

// --- PBB Routes ---
createPbbRoutes(app, getWarga, getPbb, database, persistDatabase);

// --- Gang Desa ---
if (!database.gangs) database.gangs = [];

app.get('/api/gangs', (req, res) => {
  let gangs = database.gangs || [];
  const { dusun, rw, rt, q } = req.query;
  if (dusun) gangs = gangs.filter(g => g.dusun === dusun);
  if (rw) gangs = gangs.filter(g => g.rw === rw);
  if (rt) gangs = gangs.filter(g => g.rt === rt);
  if (q) {
    const lq = q.toLowerCase();
    gangs = gangs.filter(g => (g.nama || '').toLowerCase().includes(lq));
  }
  res.json({ success: true, data: gangs, total: gangs.length });
});

app.get('/api/gangs/:id', (req, res) => {
  const gang = (database.gangs || []).find(g => g.id === Number(req.params.id));
  if (!gang) return res.status(404).json({ success: false, message: 'Gang tidak ditemukan' });
  res.json({ success: true, data: gang });
});

app.get('/api/gangs/structure/tree', (req, res) => {
  const gangs = database.gangs || [];
  const tree = {};
  gangs.forEach(g => {
    if (!tree[g.dusun]) tree[g.dusun] = { dusun: g.dusun, dusunNama: g.dusunNama, rwList: {} };
    const dusunObj = tree[g.dusun];
    if (!dusunObj.rwList[g.rw]) dusunObj.rwList[g.rw] = { rw: g.rw, rwNama: g.rwNama, rtList: {} };
    const rwObj = dusunObj.rwList[g.rw];
    if (!rwObj.rtList[g.rt]) rwObj.rtList[g.rt] = { rt: g.rt, rtNama: g.rtNama, gangs: [] };
    rwObj.rtList[g.rt].gangs.push({ id: g.id, nama: g.nama, lat: g.lat, lng: g.lng });
  });
  const result = Object.values(tree).map(d => ({
    dusun: d.dusun, dusunNama: d.dusunNama,
    rwList: Object.values(d.rwList).map(r => ({
      rw: r.rw, rwNama: r.rwNama,
      rtList: Object.values(r.rtList).map(t => ({
        rt: t.rt, rtNama: t.rtNama, gangs: t.gangs
      }))
    }))
  }));
  res.json({ success: true, data: result });
});

// --- Gallery ---
if (!database.gallery) database.gallery = [];

app.get('/api/gallery', (req, res) => {
  let gallery = database.gallery || [];
  const { category } = req.query;
  if (category) gallery = gallery.filter(g => g.category === category);
  res.json({ success: true, data: gallery, total: gallery.length });
});

app.get('/api/gallery/:id', (req, res) => {
  const item = (database.gallery || []).find(g => g.id === Number(req.params.id));
  if (!item) return res.status(404).json({ success: false, message: 'Galeri tidak ditemukan' });
  res.json({ success: true, data: item });
});

app.get('/api/gallery/categories', (req, res) => {
  const categories = [...new Set((database.gallery || []).map(g => g.category).filter(Boolean))];
  res.json({ success: true, data: categories });
});

// --- Config ---
app.get('/api/config/mapbox-token', (req, res) => {
  const token = process.env.MAPBOX_TOKEN || '';
  res.json({ success: true, token });
});

// --- 404 ---
app.use((req, res) => res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); });

// --- Start ---
async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`✅ SI-KASKUL API running at http://localhost:${PORT}`);
    console.log(`📊 Warga: ${getWarga().length} | Penduduk: ${(database.penduduk || []).length}`);
    console.log(`🗄️  Database: ${pool ? 'MySQL' : 'In-Memory'}`);
  });
}
start().catch(e => { console.error('Fatal:', e); process.exit(1); });

module.exports = app;