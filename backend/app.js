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
  syncDatabase
} = require('./supabase-store');

const app = express();

function normalizeRole(role) {
  if (role === 'collector') return 'kolektor';
  return role;
}

function isKolektorRole(role) {
  return normalizeRole(role) === 'kolektor';
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Port Configuration
const PORT = process.env.PORT || 3000;

const pool = createPool();
let database = createSeedDatabase();

async function persistDatabase() {
  if (!pool || !hasSupabaseDatabase()) {
    return;
  }

  await syncDatabase(pool, database);
}

async function bootstrapDatabase() {
  if (!pool || !hasSupabaseDatabase()) {
    return;
  }

  await ensureSchema(pool);
  await seedIfEmpty(pool, database);
  database = await loadDatabase(pool);
}

// ==================== AUTH ROUTES ====================

function findUserByCredentials({ email, nik, password }) {
  const normalizedEmail = email ? String(email).trim().toLowerCase() : '';
  const normalizedNik = nik ? String(nik).trim() : '';
  const normalizedPassword = password ? String(password) : '';

  return database.users.find(u => {
    if (normalizedEmail && u.email && u.email.toLowerCase() === normalizedEmail && u.password === normalizedPassword) return true;
    if (normalizedNik && u.nik && String(u.nik) === normalizedNik && u.password === normalizedPassword) return true;
    return false;
  });
}

function handleLogin(req, res) {
  const { email, nik, password } = req.body;
  const user = findUserByCredentials({ email, nik, password });

  if (!user) {
    return res.status(401).json({ success: false, message: 'Kredensial tidak valid' });
  }

  res.json({
    success: true,
    token: `${normalizeRole(user.role)}_token_${Date.now()}`,
    user: {
      id: user.id,
      name: user.name,
      role: normalizeRole(user.role),
      email: user.email || null,
      nik: user.nik || null,
      rt: user.rt || null,
      rw: user.rw || null
    }
  });
}

app.post(['/api/auth/login', '/auth/login'], handleLogin);
app.post(['/api/auth/admin-login', '/auth/admin-login'], handleLogin);
app.post(['/api/auth/user-login', '/auth/user-login'], handleLogin);

// ==================== BERITA ROUTES ====================

// Get all news
app.get('/api/berita', (req, res) => {
  res.json({ success: true, data: database.berita });
});

// Get news by id
app.get('/api/berita/:id', (req, res) => {
  const berita = database.berita.find(b => b.id == req.params.id);
  if (berita) {
    res.json({ success: true, data: berita });
  } else {
    res.status(404).json({ success: false, message: 'Berita tidak ditemukan' });
  }
});

// Create news
app.post('/api/berita', async (req, res) => {
  const { title, category, content } = req.body;
  const newBerita = {
    id: Math.max(...database.berita.map(b => b.id), 0) + 1,
    title,
    category,
    date: new Date().toISOString().split('T')[0],
    content
  };
  database.berita.push(newBerita);
  await persistDatabase();
  res.status(201).json({ success: true, data: newBerita });
});

// Update news
app.put('/api/berita/:id', async (req, res) => {
  const { title, category, content } = req.body;
  const index = database.berita.findIndex(b => b.id == req.params.id);
  
  if (index !== -1) {
    database.berita[index] = { ...database.berita[index], title, category, content };
    await persistDatabase();
    res.json({ success: true, data: database.berita[index] });
  } else {
    res.status(404).json({ success: false, message: 'Berita tidak ditemukan' });
  }
});

// Delete news
app.delete('/api/berita/:id', async (req, res) => {
  const index = database.berita.findIndex(b => b.id == req.params.id);
  
  if (index !== -1) {
    const deleted = database.berita.splice(index, 1);
    await persistDatabase();
    res.json({ success: true, message: 'Berita dihapus', data: deleted[0] });
  } else {
    res.status(404).json({ success: false, message: 'Berita tidak ditemukan' });
  }
});

// ==================== PBB ROUTES ====================

// Get all PBB
app.get('/api/pbb', (req, res) => {
  res.json({ success: true, data: database.pbb });
});

// Get PBB summary counts
app.get('/api/pbb/summary', (req, res) => {
  const total = database.pbb.length;
  const lunas = database.pbb.filter(p => p.status.toLowerCase() === 'lunas').length;
  const nunggak = database.pbb.filter(p => p.status.toLowerCase() !== 'lunas').length;
  res.json({ success: true, data: { total, lunas, nunggak } });
});

// Check PBB by NOP
app.post('/api/pbb/check', (req, res) => {
  const { nop, nama } = req.body;
  const pbbData = database.pbb.find(p => p.nop === nop && p.nama === nama);
  
  if (pbbData) {
    res.json({ 
      success: true, 
      data: {
        nop: pbbData.nop,
        nama: pbbData.nama,
        alamat: pbbData.alamat,
        pajak: pbbData.pajak,
        status: pbbData.status,
        year: pbbData.year,
        proofs: pbbData.proofs
      }
    });
  } else {
    res.status(404).json({ success: false, message: 'Data PBB tidak ditemukan' });
  }
});

app.post('/api/pbb/accessible', (req, res) => {
  const { userId } = req.body;
  const user = database.users.find(u => u.id === Number(userId));

  if (!user) {
    return res.status(401).json({ success: false, message: 'User tidak ditemukan' });
  }

  let data = [];
  if (user.role === 'admin' || isKolektorRole(user.role)) {
    data = database.pbb;
  } else if (user.role === 'rt') {
    data = database.pbb.filter(p => p.rt === user.rt && p.rw === user.rw);
  } else if (user.role === 'penduduk') {
    data = database.pbb.filter(p => p.nop === user.nik || p.nik === user.nik);
  }

  res.json({ success: true, data, user: { id: user.id, role: user.role, rt: user.rt || null, rw: user.rw || null } });
});

app.post('/api/pbb/upload', async (req, res) => {
  const { data } = req.body;
  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ success: false, message: 'Data upload PBB tidak valid' });
  }

  const added = data.map(item => {
    const id = Math.max(...database.pbb.map(p => p.id), 0) + 1;
    const record = {
      id,
      nop: item.nop,
      nama: item.nama,
      alamat: item.alamat,
      rt: item.rt,
      rw: item.rw,
      year: item.year,
      pajak: Number(item.pajak) || 0,
      status: item.status || 'Nunggak',
      proofs: []
    };
    database.pbb.push(record);
    return record;
  });

  await persistDatabase();
  res.status(201).json({ success: true, data: added });
});

app.post('/api/pbb/:id/proof', async (req, res) => {
  const { id } = req.params;
  const { userId, note, proofUrl } = req.body;
  const user = database.users.find(u => u.id === Number(userId));
  const pbbData = database.pbb.find(p => p.id === Number(id));

  if (!user || !pbbData) {
    return res.status(404).json({ success: false, message: 'User atau data PBB tidak ditemukan' });
  }

  if (!isKolektorRole(user.role) && user.role !== 'rt') {
    return res.status(403).json({ success: false, message: 'Akses terbatas: hanya kolektor atau RT dapat mengirim bukti' });
  }

  const proof = {
    timestamp: new Date().toISOString(),
    uploader: user.name,
    role: user.role,
    note: note || '',
    proofUrl: proofUrl || null,
    status: 'Menunggu Persetujuan'
  };

  pbbData.proofs.push(proof);
  pbbData.status = 'Menunggu Persetujuan';

  await persistDatabase();
  res.status(201).json({ success: true, data: proof });
});

app.post('/api/pbb/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { userId, approveStatus, note } = req.body;
  const user = database.users.find(u => u.id === Number(userId));
  const pbbData = database.pbb.find(p => p.id === Number(id));

  if (!user || !pbbData) {
    return res.status(404).json({ success: false, message: 'User atau data PBB tidak ditemukan' });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Akses terbatas: hanya admin dapat menyetujui bukti pembayaran' });
  }

  const approval = {
    id: database.approvals.length + 1,
    pbbId: pbbData.id,
    nop: pbbData.nop,
    nama: pbbData.nama,
    approvedBy: user.name,
    approveStatus: approveStatus || 'Disetujui',
    note: note || '',
    approvedAt: new Date().toISOString()
  };

  database.approvals.push(approval);
  pbbData.status = approveStatus === 'Ditolak' ? 'Nunggak' : 'Lunas';

  await persistDatabase();
  res.json({ success: true, data: approval });
});

app.get('/api/pbb/approvals', (req, res) => {
  const { date } = req.query;
  let approvals = [...database.approvals];

  if (date) {
    approvals = approvals.filter(a => a.approvedAt.startsWith(date));
  }

  res.json({ success: true, data: approvals });
});

app.get('/api/pbb/approvals/export', (req, res) => {
  const rows = [
    ['ID', 'PBB ID', 'NOP', 'Nama', 'Approved By', 'Status', 'Note', 'Approved At']
  ];

  database.approvals.forEach(a => {
    rows.push([a.id, a.pbbId, a.nop, a.nama, a.approvedBy, a.approveStatus, a.note, a.approvedAt]);
  });

  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="approval-history.csv"');
  res.send(csv);
});

// ==================== BANSOS ROUTES ====================

// Get all Bansos
app.get('/api/bansos', (req, res) => {
  res.json({ success: true, data: database.bansos });
});

// Get Bansos by RT
app.get('/api/bansos/rt/:rt', (req, res) => {
  const filtered = database.bansos.filter(b => b.rt.startsWith(req.params.rt));
  res.json({ success: true, data: filtered });
});

// ==================== PENGADUAN ROUTES ====================

// Submit pengaduan
app.post('/api/pengaduan', async (req, res) => {
  const { name, contact, type, message } = req.body;
  const newComplaint = {
    id: database.pengaduan.length + 1,
    name,
    contact,
    type,
    message,
    submittedAt: new Date().toISOString()
  };
  database.pengaduan.push(newComplaint);
  await persistDatabase();
  res.status(201).json({ success: true, data: newComplaint });
});

// Get all pengaduan
app.get('/api/pengaduan', (req, res) => {
  res.json({ success: true, data: database.pengaduan });
});

// ==================== DASHBOARD ROUTES ====================

// Get dashboard statistics
app.get('/api/dashboard/stats', (req, res) => {
  const totalPenduduk = database.penduduk.length;
  const totalKK = Math.max(1, Math.floor(totalPenduduk / 4));
  const totalRW = [...new Set(database.penduduk.map(p => p.rw))].length;
  const totalPajakTerkumpul = database.pbb.reduce((sum, item) => item.status.toLowerCase() === 'lunas' ? sum + item.pajak : sum, 0);
  const totalPBB = database.pbb.length;
  const lunasCount = database.pbb.filter(item => item.status.toLowerCase() === 'lunas').length;
  const nunggakCount = totalPBB - lunasCount;

  res.json({
    success: true,
    data: {
      totalPenduduk,
      totalKK,
      totalRW,
      totalBerita: database.berita.length,
      totalPBB,
      totalBansos: database.bansos.length,
      totalPajakTerkumpul,
      tingkatPembayaranPBB: totalPBB ? Math.round((lunasCount / totalPBB) * 100) : 0,
      pajakMenunggak: nunggakCount
    }
  });
});

// ==================== HEALTH CHECK ====================

app.get(['/api/health', '/health'], (req, res) => {
  res.json({ success: true, message: 'API Backend Desa Kasomalang Kulon - Running OK' });
});

// ==================== 404 Handler ====================

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// ==================== Error Handler ====================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
});

// ==================== Start Server ====================

if (require.main === module) {
  bootstrapDatabase()
    .catch(error => {
      console.error('Gagal inisialisasi Supabase, memakai data seed lokal:', error.message);
    })
    .finally(() => {
      app.listen(PORT, () => {
        console.log(`✅ Backend API Desa Kasomalang Kulon berjalan di http://localhost:${PORT}`);
        if (hasSupabaseDatabase()) {
          console.log('🗄️  Database aktif melalui Supabase Postgres');
        }
        console.log(`📚 API Documentation:`);
        console.log(`   - GET  /api/health                 (Health check)`);
        console.log(`   - POST /api/auth/admin-login       (Admin login)`);
        console.log(`   - POST /api/auth/user-login        (User login)`);
        console.log(`   - GET  /api/berita                 (Get all news)`);
        console.log(`   - POST /api/berita                 (Create news)`);
        console.log(`   - GET  /api/pbb                    (Get all PBB)`);
        console.log(`   - POST /api/pbb/check              (Check PBB)`);
        console.log(`   - GET  /api/bansos                 (Get all Bansos)`);
        console.log(`   - POST /api/pengaduan              (Submit pengaduan)`);
        console.log(`   - GET  /api/pengaduan              (Get all pengaduan)`);
        console.log(`   - GET  /api/dashboard/stats        (Get statistics)`);
      });
    });
}

module.exports = app;
