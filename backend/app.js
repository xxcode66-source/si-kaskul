require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Port Configuration
const PORT = process.env.PORT || 3000;

// Sample Database (In-Memory)
const database = {
  users: [
    { id: 1, name: 'Admin', email: 'admin@kasomalangkulon.id', password: 'admin123', role: 'admin' },
    { id: 2, name: 'Budi Santoso', nik: '1234567890123456', password: '123456', role: 'user' }
  ],
  berita: [
    { id: 1, title: 'Program Pelatihan Kewirausahaan', category: 'program', date: '2024-01-15', content: 'Desa mengadakan pelatihan kewirausahaan...' },
    { id: 2, title: 'Pengumuman Pendaftaran Bansos', category: 'pengumuman', date: '2024-01-10', content: 'Dibuka pendaftaran bantuan sosial...' }
  ],
  pbb: [
    { id: 1, nop: '1234567890123456', nama: 'Budi Santoso', alamat: 'Jl. Raya No. 12', pajak: 500000, status: 'Lunas' },
    { id: 2, nop: '1234567890123457', nama: 'Siti Nurhaliza', alamat: 'Jl. Raya No. 15', pajak: 650000, status: 'Lunas' }
  ],
  bansos: [
    { id: 1, no: 1, nama: 'Siti Nurhaliza', alamat: 'Jl. Raya No. 12', rt: '01/01', program: 'PKH + BPNT', status: 'Aktif' },
    { id: 2, no: 2, nama: 'Ahmad Sutisna', alamat: 'Jl. Raya No. 15', rt: '01/01', program: 'BPNT', status: 'Aktif' }
  ],
  pengaduan: []
};

// ==================== AUTH ROUTES ====================

// Admin Login
app.post('/api/auth/admin-login', (req, res) => {
  const { email, password } = req.body;
  const user = database.users.find(u => u.email === email && u.password === password && u.role === 'admin');
  
  if (user) {
    res.json({ 
      success: true, 
      token: 'admin_token_' + Date.now(),
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } else {
    res.status(401).json({ success: false, message: 'Email atau password salah' });
  }
});

// User Login
app.post('/api/auth/user-login', (req, res) => {
  const { nik, password } = req.body;
  const user = database.users.find(u => u.nik === nik && u.password === password && u.role === 'user');
  
  if (user) {
    res.json({ 
      success: true, 
      token: 'user_token_' + Date.now(),
      user: { id: user.id, name: user.name, nik: user.nik, role: user.role }
    });
  } else {
    res.status(401).json({ success: false, message: 'NIK atau password salah' });
  }
});

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
app.post('/api/berita', (req, res) => {
  const { title, category, content } = req.body;
  const newBerita = {
    id: Math.max(...database.berita.map(b => b.id), 0) + 1,
    title,
    category,
    date: new Date().toISOString().split('T')[0],
    content
  };
  database.berita.push(newBerita);
  res.status(201).json({ success: true, data: newBerita });
});

// Update news
app.put('/api/berita/:id', (req, res) => {
  const { title, category, content } = req.body;
  const index = database.berita.findIndex(b => b.id == req.params.id);
  
  if (index !== -1) {
    database.berita[index] = { ...database.berita[index], title, category, content };
    res.json({ success: true, data: database.berita[index] });
  } else {
    res.status(404).json({ success: false, message: 'Berita tidak ditemukan' });
  }
});

// Delete news
app.delete('/api/berita/:id', (req, res) => {
  const index = database.berita.findIndex(b => b.id == req.params.id);
  
  if (index !== -1) {
    const deleted = database.berita.splice(index, 1);
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
        status: pbbData.status
      }
    });
  } else {
    res.status(404).json({ success: false, message: 'Data PBB tidak ditemukan' });
  }
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
app.post('/api/pengaduan', (req, res) => {
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
  res.status(201).json({ success: true, data: newComplaint });
});

// Get all pengaduan
app.get('/api/pengaduan', (req, res) => {
  res.json({ success: true, data: database.pengaduan });
});

// ==================== DASHBOARD ROUTES ====================

// Get dashboard statistics
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalPenduduk: 3245,
      totalKK: 856,
      totalRW: 4,
      totalBerita: database.berita.length,
      totalPBB: database.pbb.length,
      totalBansos: database.bansos.length,
      totalPajakTerkumpul: 2500000000,
      tingkatPembayaranPBB: 87,
      pajakMenunggak: 111
    }
  });
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
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

app.listen(PORT, () => {
  console.log(`✅ Backend API Desa Kasomalang Kulon berjalan di http://localhost:${PORT}`);
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
