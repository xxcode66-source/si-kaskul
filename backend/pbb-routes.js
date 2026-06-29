// PBB Routes — Full API for SIPBB-style frontend
// Serves real data from MySQL warga/pbb tables

function createPbbRoutes(app, getWarga, getPbb, database, persistDatabase) {

  // ─── AUTH ───────────────────────────────────────────────
  const users = [
    { id:1, username:'admin', password:'admin123', role:'admin', nama:'Admin Desa', wilayah:'' },
    { id:2, username:'kolektor1', password:'kolektor123', role:'kolektor', nama:'Kolektor 1', wilayah:'all' },
    { id:3, username:'rt01', password:'rt123', role:'rt', nama:'RT 01', wilayah:'dusun1/rw1/rt01' },
    { id:4, username:'rt02', password:'rt123', role:'rt', nama:'RT 02', wilayah:'dusun1/rw1/rt02' },
    { id:5, username:'rt03', password:'rt123', role:'rt', nama:'RT 03', wilayah:'dusun1/rw1/rt03' },
    { id:6, username:'rw01', password:'rw123', role:'rw', nama:'RW 01', wilayah:'dusun1/rw1' },
  ];

  let sessions = {};

  app.post('/api/pbb/login', (req, res) => {
    const { username, password, role } = req.body;
    const u = users.find(x => x.username === username && x.password === password);
    if (!u) return res.json({ success: false, message: 'Username/password salah' });
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessions[token] = u;
    res.json({ success: true, data: { token, user: { id: u.id, nama: u.nama, role: u.role, wilayah: u.wilayah } } });
  });

  app.post('/api/pbb/logout', (req, res) => {
    const { token } = req.body;
    delete sessions[token];
    res.json({ success: true });
  });

  function auth(req, res, next) {
    const authHeader = req.headers.authorization || req.query.token;
    // Check session token
    const user = sessions[authHeader];
    if (user) { req.user = user; return next(); }
    // Check Bearer token (admin dashboard)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Find admin user by token (from app.js users)
      const adminUsers = (typeof database !== 'undefined' && database.users) ? database.users : [];
      const adminUser = adminUsers.find(u => u.role === 'admin');
      if (adminUser) { req.user = { id: adminUser.id, nama: adminUser.name || adminUser.email, role: 'admin', wilayah: 'all' }; return next(); }
    }
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // ─── WARGA (WP) LIST ────────────────────────────────────
  app.get('/api/pbb/warga', (req, res) => {
    let list = [...getWarga()];
    const { dusun, rw, rt, status, q, tahun, limit } = req.query;

    if (q) {
      const lq = q.toLowerCase();
      list = list.filter(w => w.nama?.toLowerCase().includes(lq) || w.nop?.includes(lq));
    }
    if (status) list = list.filter(w => w.status === status);
    if (tahun) {
      list = list.filter(w => {
        if (!w.payments) return false;
        const p = Array.isArray(w.payments) ? w.payments.find(p => p.year === parseInt(tahun)) : null;
        return p && p.status === status;
      });
    }

    // Pagination
    const total = list.length;
    const lim = parseInt(limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const start = (page - 1) * lim;
    list = list.slice(start, start + lim);

    res.json({ success: true, data: list, total, page, limit: lim });
  });

  // ─── SINGLE WARGA ───────────────────────────────────────
  app.get('/api/pbb/warga/:nop', (req, res) => {
    const w = getWarga().find(x => x.nop === req.params.nop);
    if (!w) return res.status(404).json({ success: false, message: 'NOP tidak ditemukan' });
    res.json({ success: true, data: w });
  });

  // ─── STATS PER DUSUN ────────────────────────────────────
  app.get('/api/pbb/stats/by-dusun', (req, res) => {
    const tahun = parseInt(req.query.tahun) || 2026;
    const map = {};
    for (const w of getWarga()) {
      const dusun = w.dusun || 'luardesa';
      if (!map[dusun]) map[dusun] = { dusun, dusunNama: w.dusunNama || 'Luar Desa', total: 0, lunas: 0, pending: 0, tunggak: 0, rpLunas: 0, rpTotal: 0 };
      map[dusun].total++;
      if (!w.payments) continue;
      const p = Array.isArray(w.payments) ? w.payments.find(p => p.year === tahun) : null;
      if (p) {
        map[dusun].rpTotal += p.wajibBayar || p.pajak || 0;
        if (p.status === 'Lunas') { map[dusun].lunas++; map[dusun].rpLunas += p.wajibBayar || p.pajak || 0; }
      }
    }
    res.json({ success: true, data: Object.values(map) });
  });

  // ─── STATS PER RW ───────────────────────────────────────
  app.get('/api/pbb/stats/by-rw', (req, res) => {
    const tahun = parseInt(req.query.tahun) || 2026;
    const map = {};
    for (const w of getWarga()) {
      const rw = w.rw || 'luar';
      if (!map[rw]) map[rw] = { rw, rwNama: w.rwNama || 'Luar', total: 0, lunas: 0, tunggak: 0, rpLunas: 0, rpTotal: 0 };
      map[rw].total++;
      if (!w.payments) continue;
      const p = Array.isArray(w.payments) ? w.payments.find(p => p.year === tahun) : null;
      if (p) {
        map[rw].rpTotal += p.wajibBayar || p.pajak || 0;
        if (p.status === 'Lunas') { map[rw].lunas++; map[rw].rpLunas += p.wajibBayar || p.pajak || 0; }
      }
    }
    res.json({ success: true, data: Object.values(map) });
  });

  // ─── STATS PER RT ───────────────────────────────────────
  app.get('/api/pbb/stats/by-rt', (req, res) => {
    const tahun = parseInt(req.query.tahun) || 2026;
    const map = {};
    for (const w of getWarga()) {
      const rt = w.rt || 'luar';
      if (!map[rt]) map[rt] = { rt, rtNama: w.rtNama || 'Luar', total: 0, lunas: 0, rpTotal: 0, rpLunas: 0 };
      map[rt].total++;
      if (!w.payments) continue;
      const p = Array.isArray(w.payments) ? w.payments.find(p => p.year === tahun) : null;
      if (p) {
        map[rt].rpTotal += p.wajibBayar || p.pajak || 0;
        if (p.status === 'Lunas') { map[rt].lunas++; map[rt].rpLunas += p.wajibBayar || p.pajak || 0; }
      }
    }
    res.json({ success: true, data: Object.values(map) });
  });

  // ─── PER-YEAR STATS (extended) ──────────────────────────
  app.get('/api/pbb/stats/per-year-full', (req, res) => {
    const years = {};
    for (const w of getWarga()) {
      if (!w.payments) continue;
      for (const p of (Array.isArray(w.payments) ? w.payments : [])) {
        if (!years[p.year]) years[p.year] = { year: p.year, total: 0, lunas: 0, pending: 0, tunggak: 0, countLunas: 0, countTotal: 0 };
        years[p.year].total += p.wajibBayar || p.pajak || 0;
        years[p.year].countTotal++;
        if (p.status === 'Lunas') { years[p.year].lunas += p.wajibBayar || p.pajak || 0; years[p.year].countLunas++; }
        else if (p.status === 'Pending') years[p.year].pending += p.wajibBayar || p.pajak || 0;
        else years[p.year].tunggak += p.wajibBayar || p.pajak || 0;
      }
    }
    res.json({ success: true, data: Object.values(years).sort((a, b) => a.year - b.year) });
  });

  // ─── TUNGGAKAN LIST ─────────────────────────────────────
  app.get('/api/pbb/tunggakan', (req, res) => {
    const tahun = parseInt(req.query.tahun) || 2026;
    const list = [];
    for (const w of getWarga()) {
      if (!w.payments) continue;
      const p = Array.isArray(w.payments) ? w.payments.find(p => p.year === tahun) : null;
      if (p && p.status !== 'Lunas') {
        list.push({
          nop: w.nop, nama: w.nama,
          rt: w.rtNama || w.rt, rw: w.rwNama || w.rw,
          pajak: p.wajibBayar || p.pajak || 0,
          status: p.status || 'Belum Bayar',
          tahun: p.year,
        });
      }
    }
    res.json({ success: true, data: list, total: list.length });
  });

  // ─── RIWAYAT LUNAS ──────────────────────────────────────
  app.get('/api/pbb/riwayat', (req, res) => {
    const tahun = parseInt(req.query.tahun) || 2026;
    const list = [];
    for (const w of getWarga()) {
      if (!w.payments) continue;
      const p = Array.isArray(w.payments) ? w.payments.find(p => p.year === tahun) : null;
      if (p && p.status === 'Lunas') {
        list.push({
          nop: w.nop, nama: w.nama,
          rt: w.rtNama || w.rt, rw: w.rwNama || w.rw,
          pajak: p.wajibBayar || p.pajak || 0,
          paidAt: p.paidAt || p.tanggal || '',
          penyetor: p.penyetor || '',
          tahun: p.year,
        });
      }
    }
    res.json({ success: true, data: list, total: list.length });
  });

  // ─── SEARCH NOP ─────────────────────────────────────────
  app.post('/api/pbb/check-nop', (req, res) => {
    const { nop } = req.body;
    if (!nop) return res.json({ success: false, message: 'Masukkan NOP' });
    const w = getWarga().find(x => x.nop === nop || x.nop.includes(nop));
    if (!w) return res.json({ success: false, message: 'NOP tidak ditemukan' });
    
    const payments = {};
    if (Array.isArray(w.payments)) {
      for (const p of w.payments) {
        payments[p.year] = { status: p.status, pajak: p.wajibBayar || p.pajak, paidAt: p.paidAt || p.tanggal };
      }
    }
    
    res.json({
      success: true, data: {
        nop: w.nop, nama: w.nama, alamat: w.alamat || '',
        rt: w.rtNama || w.rt, rw: w.rwNama || w.rw,
        payments, status: w.status,
      }
    });
  });

  // ─── PENDING APPROVALS ──────────────────────────────────
  // Simplified: use session-based approvals list
  if (!database.pbbApprovals) database.pbbApprovals = [];

  app.get('/api/pbb/pending', (req, res) => {
    const list = database.pbbApprovals.filter(a => a.status === 'pending') || [];
    res.json({ success: true, data: list, total: list.length });
  });

  app.post('/api/pbb/upload', auth, (req, res) => {
    const { nop, tahun, penyetor } = req.body;
    const w = getWarga().find(x => x.nop === nop);
    if (!w) return res.json({ success: false, message: 'NOP tidak ditemukan' });
    
    const approval = {
      id: database.pbbApprovals.length + 1,
      nop, nama: w.nama, tahun: parseInt(tahun),
      penyetor: penyetor || req.user.nama,
      tanggal: new Date().toISOString().split('T')[0],
      status: 'pending',
      petugas: req.user.nama,
      approvedBy: null, ketAdmin: '',
    };
    database.pbbApprovals.unshift(approval);
    res.json({ success: true, data: approval });
  });

  app.post('/api/pbb/approve', auth, (req, res) => {
    const { id, approve, note } = req.body;
    const item = database.pbbApprovals.find(a => a.id === id);
    if (!item) return res.json({ success: false, message: 'Data tidak ditemukan' });
    
    item.status = approve ? 'lunas' : 'rejected';
    item.approvedBy = req.user.nama;
    item.ketAdmin = note || (approve ? 'Disetujui' : 'Ditolak');
    item.approvedAt = new Date().toISOString().split('T')[0];
    
    res.json({ success: true, data: item });
  });
}

module.exports = { createPbbRoutes };