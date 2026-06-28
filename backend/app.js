require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const {
  createSeedDatabase,
  hasSupabaseDatabase,
  createPool,
  ensureSchema,
  seedIfEmpty,
  loadDatabase,
  syncDatabase,
} = require('./supabase-store');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

const PORT = process.env.PORT || 3000;
const pool = createPool();
let database = createSeedDatabase();

async function persistDatabase() {
  if (!pool || !hasSupabaseDatabase()) return;
  await syncDatabase(pool, database);
}

async function bootstrapDatabase() {
  if (!pool || !hasSupabaseDatabase()) return;
  await ensureSchema(pool);
  await seedIfEmpty(pool, database);
  database = await loadDatabase(pool);
}

// ==============================
// HELPERS
// ==============================

function getWarga() { return database.warga || []; }
function getPbb() { return database.pbb || []; }
function getUsers() { return database.users || []; }

// Compute aggregate stats from warga data (with payments array)
function computeOverviewStats(wargaList) {
  if (!wargaList || wargaList.length === 0) {
    return { totalWp: 0, totalPajak: 0, totalLunas: 0, totalBelumBayar: 0, totalPending: 0 };
  }
  let totalPajak = 0, totalLunas = 0, totalBelumBayar = 0, totalPending = 0;
  for (const w of wargaList) {
    if (!w.payments || w.payments.length === 0) continue;
    for (const p of w.payments) {
      totalPajak += p.pajak || 0;
      if (p.status === 'Lunas') totalLunas += p.pajak || 0;
      else if (p.status === 'Pending') totalPending += p.pajak || 0;
      else totalBelumBayar += p.pajak || 0;
    }
  }
  return { totalWp: wargaList.length, totalPajak, totalLunas, totalBelumBayar, totalPending };
}

function computePerYearStats(wargaList) {
  const byYear = {};
  for (const w of wargaList) {
    if (!w.payments) continue;
    for (const p of w.payments) {
      if (!byYear[p.year]) byYear[p.year] = { year: p.year, total: 0, lunas: 0, pending: 0, belumBayar: 0, countLunas: 0, countPending: 0, countBelumBayar: 0 };
      byYear[p.year].total += p.pajak || 0;
      if (p.status === 'Lunas') { byYear[p.year].lunas += p.pajak || 0; byYear[p.year].countLunas++; }
      else if (p.status === 'Pending') { byYear[p.year].pending += p.pajak || 0; byYear[p.year].countPending++; }
      else { byYear[p.year].belumBayar += p.pajak || 0; byYear[p.year].countBelumBayar++; }
    }
  }
  return Object.values(byYear).sort((a, b) => a.year - b.year);
}

function computeDusunStats(wargaList) {
  const byDusun = {};
  for (const w of wargaList) {
    const key = w.dusun || 'luardesa';
    if (!byDusun[key]) byDusun[key] = { dusun: key, dusunNama: w.dusunNama || 'Luar Desa', totalPajak: 0, totalLunas: 0, totalBelumBayar: 0, totalPending: 0, count: 0 };
    byDusun[key].count++;
    if (!w.payments) continue;
    for (const p of w.payments) {
      byDusun[key].totalPajak += p.pajak || 0;
      if (p.status === 'Lunas') byDusun[key].totalLunas += p.pajak || 0;
      else if (p.status === 'Pending') byDusun[key].totalPending += p.pajak || 0;
      else byDusun[key].totalBelumBayar += p.pajak || 0;
    }
  }
  return Object.values(byDusun);
}

// ==============================
// AUTH MIDDLEWARE (simple JWT-like for now)
// ==============================

function findUserByCredentials({ email, nik, password }) {
  const users = getUsers();
  const normalizedEmail = email ? String(email).trim().toLowerCase() : '';
  const normalizedNik = nik ? String(nik).trim() : '';
  const normalizedPassword = password ? String(password) : '';
  return users.find(u => {
    if (normalizedEmail && u.email && u.email.toLowerCase() === normalizedEmail && u.password === normalizedPassword) return true;
    if (normalizedNik && u.nik && String(u.nik) === normalizedNik && u.password === normalizedPassword) return true;
    return false;
  });
}

function handleLogin(req, res) {
  const { email, nik, password } = req.body;
  const user = findUserByCredentials({ email, nik, password });
  if (!user) return res.status(401).json({ success: false, message: 'Kredensial tidak valid' });
  res.json({
    success: true,
    token: `${user.role}_token_${Date.now()}_${user.id}`,
    user: { id: user.id, name: user.name, role: user.role, email: user.email || null, nik: user.nik || null, rt: user.rt || null, rw: user.rw || null }
  });
}

// ==============================
// ======== AUTH ROUTES =========
// ==============================

app.post(['/api/auth/login', '/auth/login'], handleLogin);
app.post(['/api/auth/admin-login', '/auth/admin-login'], handleLogin);
app.post(['/api/auth/user-login', '/auth/user-login'], handleLogin);

// ==============================
// ====== PUBLIC PBB STATS ======
// ==============================

// Overall aggregate (no individual data)
app.get('/api/pbb/stats/overview', (req, res) => {
  const warga = getWarga();
  const overview = computeOverviewStats(warga);
  const perYear = computePerYearStats(warga);
  const perDusun = computeDusunStats(warga);
  res.json({ success: true, data: { overview, perYear, perDusun } });
});

// Per year breakdown
app.get('/api/pbb/stats/per-year', (req, res) => {
  const warga = getWarga();
  const perYear = computePerYearStats(warga);
  res.json({ success: true, data: perYear });
});

// Stats by dusun
app.get('/api/pbb/stats/by-dusun', (req, res) => {
  const warga = getWarga();
  const perDusun = computeDusunStats(warga);
  res.json({ success: true, data: perDusun });
});

// Stats by RW within a dusun
app.get('/api/pbb/stats/by-dusun/:dusunId', (req, res) => {
  const warga = getWarga().filter(w => (w.dusun || 'luardesa') === req.params.dusunId);
  const byRw = {};
  for (const w of warga) {
    const key = w.rw || 'luar';
    if (!byRw[key]) byRw[key] = { rw: key, rwNama: w.rwNama || '-', totalPajak: 0, totalLunas: 0, totalBelumBayar: 0, totalPending: 0, count: 0 };
    byRw[key].count++;
    if (!w.payments) continue;
    for (const p of w.payments) {
      byRw[key].totalPajak += p.pajak || 0;
      if (p.status === 'Lunas') byRw[key].totalLunas += p.pajak || 0;
      else if (p.status === 'Pending') byRw[key].totalPending += p.pajak || 0;
      else byRw[key].totalBelumBayar += p.pajak || 0;
    }
  }
  res.json({ success: true, data: Object.values(byRw), dusun: req.params.dusunId });
});

// Stats by RT within a RW in a dusun
app.get('/api/pbb/stats/by-dusun/:dusunId/rw/:rwId', (req, res) => {
  const warga = getWarga().filter(w => (w.dusun || 'luardesa') === req.params.dusunId && (w.rw || 'luar') === req.params.rwId);
  const byRt = {};
  for (const w of warga) {
    const key = w.rt || 'luar';
    if (!byRt[key]) byRt[key] = { rt: key, rtNama: w.rtNama || '-', totalPajak: 0, totalLunas: 0, totalBelumBayar: 0, totalPending: 0, count: 0 };
    byRt[key].count++;
    if (!w.payments) continue;
    for (const p of w.payments) {
      byRt[key].totalPajak += p.pajak || 0;
      if (p.status === 'Lunas') byRt[key].totalLunas += p.pajak || 0;
      else if (p.status === 'Pending') byRt[key].totalPending += p.pajak || 0;
      else byRt[key].totalBelumBayar += p.pajak || 0;
    }
  }
  res.json({ success: true, data: Object.values(byRt), dusun: req.params.dusunId, rw: req.params.rwId });
});

// **** NOP CHECK (PUBLIC) ****
app.post('/api/pbb/check-nop', (req, res) => {
  const { nop } = req.body;
  if (!nop) return res.status(400).json({ success: false, message: 'NOP wajib diisi' });
  const warga = getWarga().find(w => w.nop === String(nop).trim());
  if (!warga) return res.status(404).json({ success: false, message: 'NOP tidak ditemukan' });

  // Return only this NOP's data — no leak of other warga data
  const perYear = (warga.payments || []).map(p => ({
    year: p.year, status: p.status, pajak: p.pajak
  }));
  const totalBelumBayar = perYear.filter(p => p.status === 'Belum Bayar' || p.status === 'Pending').reduce((s, p) => s + p.pajak, 0);
  const totalLunas = perYear.filter(p => p.status === 'Lunas').reduce((s, p) => s + p.pajak, 0);

  res.json({
    success: true,
    data: {
      nop: warga.nop,
      nama: warga.nama,
      alamat: warga.alamat,
      dusun: warga.dusunNama,
      rw: warga.rwNama,
      rt: warga.rtNama,
      totalPajak: warga.totalPajak || perYear.reduce((s, p) => s + p.pajak, 0),
      totalLunas,
      totalBelumBayar,
      perYear,
    }
  });
});

// ==============================
// ====== LEGACY PBB ENDPOINTS (remain for admin use) ======
// ==============================

// Get all PBB (admin only - returns individual data)
app.get('/api/pbb', (req, res) => {
  res.json({ success: true, data: getPbb() });
});

// Get PBB summary counts
app.get('/api/pbb/summary', (req, res) => {
  const pbbData = getPbb();
  const total = pbbData.length;
  const lunas = pbbData.filter(p => p.status === 'Lunas').length;
  const nunggak = pbbData.filter(p => p.status !== 'Lunas').length;
  res.json({ success: true, data: { total, lunas, nunggak } });
});

// Check PBB by NOP (admin)
app.post('/api/pbb/check', (req, res) => {
  const { nop, nama } = req.body;
  const pbbData = getPbb().find(p => p.nop === nop && p.nama === nama);
  if (pbbData) {
    res.json({ success: true, data: { nop: pbbData.nop, nama: pbbData.nama, alamat: pbbData.alamat, pajak: pbbData.pajak, status: pbbData.status, year: pbbData.year, proofs: pbbData.proofs } });
  } else {
    res.status(404).json({ success: false, message: 'Data PBB tidak ditemukan' });
  }
});

app.post('/api/pbb/accessible', (req, res) => {
  const { userId } = req.body;
  const user = getUsers().find(u => u.id === Number(userId));
  if (!user) return res.status(401).json({ success: false, message: 'User tidak ditemukan' });
  let data = [];
  if (user.role === 'admin') data = getPbb();
  else if (user.role === 'kolektor' || user.role === 'rt') data = getPbb(); // simplified
  else if (user.role === 'penduduk') data = getPbb().filter(p => p.nik === user.nik);
  res.json({ success: true, data, user: { id: user.id, role: user.role, rt: user.rt || null, rw: user.rw || null } });
});

app.post('/api/pbb/upload', async (req, res) => {
  const { data } = req.body;
  if (!Array.isArray(data) || data.length === 0) return res.status(400).json({ success: false, message: 'Data upload tidak valid' });
  const pbbData = getPbb();
  const added = data.map(item => {
    const id = Math.max(...pbbData.map(p => p.id), 0) + 1;
    const record = { id, nop: item.nop, nama: item.nama, alamat: item.alamat, rt: item.rt, rw: item.rw, year: item.year, pajak: Number(item.pajak) || 0, status: item.status || 'Nunggak', proofs: [] };
    pbbData.push(record);
    return record;
  });
  await persistDatabase();
  res.status(201).json({ success: true, data: added });
});

app.post('/api/pbb/:id/proof', async (req, res) => {
  const { id } = req.params;
  const { userId, note, proofUrl } = req.body;
  const user = getUsers().find(u => u.id === Number(userId));
  const pbbData = getPbb().find(p => p.id === Number(id));
  if (!user || !pbbData) return res.status(404).json({ success: false, message: 'User atau data PBB tidak ditemukan' });
  if (user.role !== 'kolektor' && user.role !== 'rt') return res.status(403).json({ success: false, message: 'Akses terbatas: hanya kolektor atau RT' });
  const proof = { timestamp: new Date().toISOString(), uploader: user.name, role: user.role, note: note || '', proofUrl: proofUrl || null, status: 'Menunggu Persetujuan' };
  pbbData.proofs.push(proof);
  pbbData.status = 'Pending';
  await persistDatabase();
  res.status(201).json({ success: true, data: proof });
});

app.post('/api/pbb/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { userId, approveStatus, note } = req.body;
  const user = getUsers().find(u => u.id === Number(userId));
  const pbbData = getPbb().find(p => p.id === Number(id));
  if (!user || !pbbData) return res.status(404).json({ success: false, message: 'User atau data PBB tidak ditemukan' });
  if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Akses terbatas: hanya admin' });
  const approval = { id: (database.approvals || []).length + 1, pbbId: pbbData.id, nop: pbbData.nop, nama: pbbData.nama, approvedBy: user.name, approveStatus: approveStatus || 'Disetujui', note: note || '', approvedAt: new Date().toISOString() };
  database.approvals.push(approval);
  pbbData.status = approveStatus === 'Ditolak' ? 'Nunggak' : 'Lunas';
  await persistDatabase();
  res.json({ success: true, data: approval });
});

app.get('/api/pbb/approvals', (req, res) => {
  const { date } = req.query;
  let approvals = [...(database.approvals || [])];
  if (date) approvals = approvals.filter(a => a.approvedAt.startsWith(date));
  res.json({ success: true, data: approvals });
});

app.get('/api/pbb/approvals/export', (req, res) => {
  const rows = [['ID', 'PBB ID', 'NOP', 'Nama', 'Approved By', 'Status', 'Note', 'Approved At']];
  (database.approvals || []).forEach(a => rows.push([a.id, a.pbbId, a.nop, a.nama, a.approvedBy, a.approveStatus, a.note, a.approvedAt]));
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="approval-history.csv"');
  res.send(csv);
});

// ==============================
// ======== BERITA ROUTES =======
// ==============================

app.get('/api/berita', (req, res) => res.json({ success: true, data: database.berita }));
app.get('/api/berita/:id', (req, res) => {
  const berita = database.berita.find(b => b.id == req.params.id);
  if (berita) res.json({ success: true, data: berita });
  else res.status(404).json({ success: false, message: 'Berita tidak ditemukan' });
});
app.post('/api/berita', async (req, res) => {
  const { title, category, content } = req.body;
  const newBerita = { id: Math.max(...database.berita.map(b => b.id), 0) + 1, title, category, date: new Date().toISOString().split('T')[0], content };
  database.berita.push(newBerita);
  await persistDatabase();
  res.status(201).json({ success: true, data: newBerita });
});
app.put('/api/berita/:id', async (req, res) => {
  const { title, category, content } = req.body;
  const index = database.berita.findIndex(b => b.id == req.params.id);
  if (index !== -1) { database.berita[index] = { ...database.berita[index], title, category, content }; await persistDatabase(); res.json({ success: true, data: database.berita[index] }); }
  else res.status(404).json({ success: false, message: 'Berita tidak ditemukan' });
});
app.delete('/api/berita/:id', async (req, res) => {
  const index = database.berita.findIndex(b => b.id == req.params.id);
  if (index !== -1) { const deleted = database.berita.splice(index, 1); await persistDatabase(); res.json({ success: true, message: 'Berita dihapus', data: deleted[0] }); }
  else res.status(404).json({ success: false, message: 'Berita tidak ditemukan' });
});

// ==============================
// ======== BANSOS ROUTES =======
// ==============================

app.get('/api/bansos', (req, res) => res.json({ success: true, data: database.bansos }));
app.get('/api/bansos/programs', (req, res) => res.json({ success: true, data: database.bansosPrograms || [] }));
app.get('/api/bansos/rt/:rt', (req, res) => {
  const filtered = database.bansos.filter(b => b.rt && b.rt.startsWith(req.params.rt));
  res.json({ success: true, data: filtered });
});
app.post('/api/bansos', async (req, res) => {
  const { nama, alamat, rt, program, status } = req.body;
  const id = Math.max(...database.bansos.map(b => b.id), 0) + 1;
  const item = { id, no: id, nama, alamat, rt, program, status: status || 'Aktif' };
  database.bansos.push(item);
  await persistDatabase();
  res.status(201).json({ success: true, data: item });
});
app.put('/api/bansos/:id', async (req, res) => {
  const { nama, alamat, rt, program, status } = req.body;
  const idx = database.bansos.findIndex(b => b.id == req.params.id);
  if (idx !== -1) { database.bansos[idx] = { ...database.bansos[idx], nama, alamat, rt, program, status }; await persistDatabase(); res.json({ success: true, data: database.bansos[idx] }); }
  else res.status(404).json({ success: false, message: 'Data bansos tidak ditemukan' });
});
app.delete('/api/bansos/:id', async (req, res) => {
  const idx = database.bansos.findIndex(b => b.id == req.params.id);
  if (idx !== -1) { database.bansos.splice(idx, 1); await persistDatabase(); res.json({ success: true, message: 'Dihapus' }); }
  else res.status(404).json({ success: false, message: 'Data bansos tidak ditemukan' });
});

// ==============================
// ====== PENGADUAN ROUTES ======
// ==============================

app.get('/api/pengaduan', (req, res) => res.json({ success: true, data: database.pengaduan }));
app.post('/api/pengaduan', async (req, res) => {
  const { name, contact, type, message } = req.body;
  const newComplaint = { id: (database.pengaduan || []).length + 1, name, contact, type, message, submittedAt: new Date().toISOString(), status: 'Diterima' };
  database.pengaduan.push(newComplaint);
  await persistDatabase();
  res.status(201).json({ success: true, data: newComplaint });
});
app.put('/api/pengaduan/:id', async (req, res) => {
  const { status, balasan } = req.body;
  const idx = (database.pengaduan || []).findIndex(p => p.id == req.params.id);
  if (idx !== -1) { database.pengaduan[idx] = { ...database.pengaduan[idx], status, balasan }; await persistDatabase(); res.json({ success: true, data: database.pengaduan[idx] }); }
  else res.status(404).json({ success: false, message: 'Pengaduan tidak ditemukan' });
});

// ==============================
// ====== USER MANAGEMENT =======
// ==============================

app.get('/api/users', (req, res) => {
  res.json({ success: true, data: getUsers().map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, rt: u.rt, rw: u.rw })) });
});
app.post('/api/users', async (req, res) => {
  const { name, email, password, role, rt, rw } = req.body;
  const id = Math.max(...getUsers().map(u => u.id), 0) + 1;
  const user = { id, name, email, password, role, rt: rt || null, rw: rw || null };
  database.users.push(user);
  await persistDatabase();
  res.status(201).json({ success: true, data: { id, name, email, role, rt, rw } });
});
app.put('/api/users/:id', async (req, res) => {
  const idx = getUsers().findIndex(u => u.id == req.params.id);
  if (idx !== -1) {
    const { name, email, password, role, rt, rw } = req.body;
    database.users[idx] = { ...database.users[idx], name: name || database.users[idx].name, email: email || database.users[idx].email, password: password || database.users[idx].password, role: role || database.users[idx].role, rt: rt !== undefined ? rt : database.users[idx].rt, rw: rw !== undefined ? rw : database.users[idx].rw };
    await persistDatabase();
    res.json({ success: true, data: { id: database.users[idx].id, name: database.users[idx].name, email: database.users[idx].email, role: database.users[idx].role } });
  } else res.status(404).json({ success: false, message: 'User tidak ditemukan' });
});
app.delete('/api/users/:id', async (req, res) => {
  const idx = getUsers().findIndex(u => u.id == req.params.id);
  if (idx !== -1) { database.users.splice(idx, 1); await persistDatabase(); res.json({ success: true, message: 'User dihapus' }); }
  else res.status(404).json({ success: false, message: 'User tidak ditemukan' });
});

// ==============================
// ======== DASHBOARD ===========
// ==============================

app.get('/api/dashboard/stats', (req, res) => {
  const warga = getWarga();
  const pbbData = getPbb();
  const totalPenduduk = warga.length;
  const totalPajakTerkumpul = pbbData.reduce((sum, item) => item.status === 'Lunas' ? sum + item.pajak : sum, 0);
  const lunasCount = pbbData.filter(item => item.status === 'Lunas').length;
  const totalPBB = pbbData.length;
  res.json({
    success: true, data: {
      totalPenduduk,
      totalKK: Math.max(1, Math.floor(totalPenduduk / 3)),
      totalBerita: database.berita.length,
      totalPBB,
      totalBansos: database.bansos.length,
      totalPajakTerkumpul,
      tingkatPembayaranPBB: totalPBB ? Math.round((lunasCount / totalPBB) * 100) : 0,
      pendingPBB: pbbData.filter(p => p.status === 'Pending').length,
    }
  });
});

// ==============================
// ======== HEALTH ==============
// ==============================

app.get(['/api/health', '/health'], (req, res) => {
  res.json({ success: true, message: 'API SI-KASKUL - OK', dataCount: getWarga().length, time: new Date().toISOString() });
});

// ==============================
// ====== 404 + ERROR ===========
// ==============================

app.use((req, res) => res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
});

// ==============================
// ====== START SERVER ==========
// ==============================

if (require.main === module) {
  bootstrapDatabase()
    .catch(error => console.error('Gagal inisialisasi database:', error.message))
    .finally(() => {
      app.listen(PORT, () => {
        console.log(`✅ SI-KASKUL API running at http://localhost:${PORT}`);
        console.log(`📊 Warga terdaftar: ${getWarga().length} orang`);
        console.log(`📅 Data PBB: 2020-2026`);
        if (hasSupabaseDatabase()) console.log('🗄️  Database: Supabase Postgres');
        console.log('📚 New endpoints:');
        console.log('   GET  /api/pbb/stats/overview     (Aggregate stats)');
        console.log('   GET  /api/pbb/stats/per-year     (Per year breakdown)');
        console.log('   GET  /api/pbb/stats/by-dusun     (By dusun)');
        console.log('   GET  /api/pbb/stats/by-dusun/:id (By RW in dusun)');
        console.log('   GET  /api/pbb/stats/by-dusun/:id/rw/:rw (By RT in RW)');
        console.log('   POST /api/pbb/check-nop          (NOP check - public)');
      });
    });
}

module.exports = app;