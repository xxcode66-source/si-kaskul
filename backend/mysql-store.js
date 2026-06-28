// MySQL Database Store — menggantikan supabase-store.js
const mysql = require('mysql2/promise');

function getConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'si_kaskul',
  };
}

function hasDatabase() {
  return Boolean(process.env.DB_HOST || process.env.DB_NAME);
}

async function createPool() {
  if (!hasDatabase()) return null;
  try {
    const pool = mysql.createPool(getConfig());
    await pool.query('SELECT 1');
    return pool;
  } catch (e) {
    console.error('MySQL connection failed:', e.message);
    return null;
  }
}

// ==============================
// SEED DATA — SAME AS supabase-store.js
// ==============================
function createSeedDatabase() {
  const wilayah = [
    { dusun: 'dusun1', dusunNama: 'Dusun 01' },
    { dusun: 'dusun2', dusunNama: 'Dusun 02' },
    { dusun: 'dusun3', dusunNama: 'Dusun 03' },
  ];
  const rwMap = { dusun1: ['01', '02'], dusun2: ['03', '04', '05', '06'], dusun3: ['04', '05', '07'] };
  const rtPerRw = 5;
  const namaDepan = ['Asep','Ujang','Entis','Tati','Yuli','Rudi','Siti','Dedi','Ade','Iwan','Nina','Agus','Wati','Euis','Cecep','Dede','Lilis','Aam','Toto','Aneu','Jajang','Mimin','Usep','Elis','Yayan'];
  const namaBelakang = ['Sunandar','Hidayat','Suryana','Mulyana','Kusnadi','Nurdin','Supriadi','Hermawan','Wijaya','Permadi','Gunawan','Suhendar','Rohmat','Saepulloh','Suganda'];
  const jalan = ['Kp. Cikadu','Kp. Cikalong','Kp. Babakan','Kp. Pasir','Kp. Lembang','Jl. Raya','Kp. Hegarmanah','Kp. Cibogo','Kp. Bojong','Kp. Gandasoli'];

  let wargaId = 0;
  let pbbId = 0;
  const warga = [];
  const pbb = [];
  const penduduk = [];

  for (const w of wilayah) {
    const rws = rwMap[w.dusun];
    for (const rwNomor of rws) {
      for (let rtNomor = 1; rtNomor <= rtPerRw; rtNomor++) {
        const count = 2 + (rtNomor % 2);
        for (let i = 0; i < count; i++) {
          wargaId++;
          const nik = `320812${String(wargaId).padStart(10, '0')}`;
          const nop = `32.08.120.${String(wargaId).padStart(10, '0')}`;
          const nama = `${namaDepan[Math.floor(Math.random() * namaDepan.length)]} ${namaBelakang[Math.floor(Math.random() * namaBelakang.length)]}`;
          const alamatJalan = jalan[Math.floor(Math.random() * jalan.length)];
          const rwStr = String(rwNomor);
          const rtStr = String(rtNomor).padStart(2, '0');
          const basePajak = 200000 + Math.floor(Math.random() * 500000);
          const payments = [];
          for (let year = 2020; year <= 2026; year++) {
            const pajakTahun = Math.round(basePajak * (1 + (year - 2020) * 0.03));
            const isLunas = Math.random() > 0.25;
            let status = 'Belum Bayar', paidAt = null, approvedBy = null;
            if (isLunas && year <= 2025) {
              status = 'Lunas'; const month = 1 + Math.floor(Math.random() * 4); const day = 1 + Math.floor(Math.random() * 28);
              paidAt = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`; approvedBy = 'Admin Desa';
            } else if (!isLunas && year > 2024) { status = 'Pending'; }
            payments.push({ year, pajak: pajakTahun, status, paidAt, approvedBy });
          }
          const lunasCount = payments.filter(p => p.status === 'Lunas').length;
          const pendingCount = payments.filter(p => p.status === 'Pending').length;
          let summaryStatus = 'Belum Bayar';
          if (lunasCount === 7) summaryStatus = 'Lunas';
          else if (pendingCount > 0) summaryStatus = 'Pending';
          else if (lunasCount >= 3) summaryStatus = 'Sebagian';
          else summaryStatus = 'Menunggak';

          warga.push({ id: wargaId, nik, nop, nama, alamat: `${alamatJalan} RT ${rtStr}/RW ${rwStr}`, dusun: w.dusun, dusunNama: w.dusunNama, rw: `rw${rwNomor}`, rwNama: `RW ${rwNomor}`, rt: `rt${rtNomor}`, rtNama: `RT ${rtStr}`, pajak: basePajak, status: summaryStatus, totalPajak: payments.reduce((s,p)=>s+p.pajak,0), totalLunas: payments.filter(p=>p.status==='Lunas').reduce((s,p)=>s+p.pajak,0), totalBelumBayar: payments.filter(p=>p.status!=='Lunas').reduce((s,p)=>s+p.pajak,0), payments });
          penduduk.push({ id: wargaId, nik, nama, alamat: `${alamatJalan} RT ${rtStr}/RW ${rwStr}`, rt: `${rtStr}/${rwStr}`, rw: rwStr });
          pbbId++;
          pbb.push({ id: pbbId, nop, nik, nama, alamat: `${alamatJalan} RT ${rtStr}/RW ${rwStr}`, dusun: w.dusun, dusunNama: w.dusunNama, rw: `rw${rwNomor}`, rwNama: `RW ${rwNomor}`, rt: `rt${rtNomor}`, rtNama: `RT ${rtStr}`, year: 2026, pajak: basePajak, status: summaryStatus, payments, proofs: [] });
        }
      }
    }
  }
  for (let i = 0; i < 8; i++) {
    wargaId++; const nik = `320812${String(wargaId).padStart(10,'0')}`; const nop = `32.08.999.${String(wargaId).padStart(10,'0')}`;
    const nama = `${namaDepan[Math.floor(Math.random()*namaDepan.length)]} ${namaBelakang[Math.floor(Math.random()*namaBelakang.length)]}`;
    const basePajak = 150000 + Math.floor(Math.random() * 300000);
    const payments = [];
    for (let year = 2020; year <= 2026; year++) payments.push({ year, pajak: Math.round(basePajak*(1+(year-2020)*0.03)), status: 'Belum Bayar', paidAt: null, approvedBy: null });
    warga.push({ id: wargaId, nik, nop, nama, alamat: 'Luar Desa', dusun: 'luardesa', dusunNama: 'Luar Desa', rw: 'luar', rwNama: '-', rt: 'luar', rtNama: '-', pajak: basePajak, status: 'Menunggak', totalPajak: payments.reduce((s,p)=>s+p.pajak,0), totalLunas: 0, totalBelumBayar: payments.reduce((s,p)=>s+p.pajak,0), payments });
    pbb.push({ id: ++pbbId, nop, nik, nama, alamat: 'Luar Desa', dusun: 'luardesa', dusunNama: 'Luar Desa', rw: 'luar', rwNama: '-', rt: 'luar', rtNama: '-', year: 2026, pajak: basePajak, status: 'Menunggak', payments, proofs: [] });
  }

  const users = [
    { id: 1, name: 'Admin Desa', email: 'admin@kasomalangkulon.id', password: 'admin123', role: 'admin' },
    { id: 2, name: 'Kolektor 1', email: 'kolektor1@kasomalangkulon.id', password: 'kolektor123', role: 'kolektor', rt: 'dusun1/rw1/rt1,rt2,rt3', rw: '01' },
    { id: 3, name: 'Kolektor 2', email: 'kolektor2@kasomalangkulon.id', password: 'kolektor123', role: 'kolektor', rt: 'dusun1/rw2/rt1,rt2,rt3,rt4', rw: '02' },
    { id: 4, name: 'Ketua RT 1', email: 'rt1@kasomalangkulon.id', password: 'rt123', role: 'rt', rt: 'dusun1/rw1/rt1', rw: '01' },
    { id: 5, name: 'Ketua RT 2', email: 'rt2@kasomalangkulon.id', password: 'rt123', role: 'rt', rt: 'dusun1/rw1/rt2', rw: '01' },
    { id: 6, name: 'Ketua RW 1', email: 'rwk1@kasomalangkulon.id', password: 'rt123', role: 'rw', rt: 'dusun1/rw1', rw: '01' },
  ];

  const berita = [
    { id: 1, title: 'Pembayaran PBB 2026 Sudah Dibuka', category: 'pengumuman', date: '2026-01-15', content: 'Pembayaran PBB tahun 2026 sudah dapat dilakukan melalui kolektor desa. Silakan hubungi kolektor di wilayah masing-masing.' },
    { id: 2, title: 'Penyaluran BPNT Triwulan I 2026', category: 'program', date: '2026-01-10', content: 'Penyaluran BPNT triwulan I tahun 2026 akan dilaksanakan pada tanggal 20-25 Januari 2026 di Balai Desa.' },
    { id: 3, title: 'Realisasi PBB 2025 Capai 78%', category: 'pengumuman', date: '2025-12-30', content: 'Realisasi pembayaran PBB tahun 2025 mencapai 78% dari total target.' },
  ];

  const bansos = [
    { id: 1, no: 1, nama: 'Asep Sunandar', alamat: 'Kp. Cikadu RT 01/RW 01', rt: '01/01', program: 'PKH', status: 'Aktif' },
    { id: 2, no: 2, nama: 'Siti Nurhayati', alamat: 'Kp. Cikalong RT 02/RW 01', rt: '02/01', program: 'BPNT', status: 'Aktif' },
    { id: 3, no: 3, nama: 'Dedi Hermawan', alamat: 'Kp. Babakan RT 01/RW 02', rt: '01/02', program: 'BLT Dana Desa', status: 'Aktif' },
    { id: 4, no: 4, nama: 'Euis Mulyana', alamat: 'Kp. Pasir RT 03/RW 03', rt: '03/03', program: 'PKH + BPNT', status: 'Aktif' },
    { id: 5, no: 5, nama: 'Cecep Nurdin', alamat: 'Kp. Lembang RT 02/RW 04', rt: '02/04', program: 'BPNT', status: 'Nonaktif' },
  ];

  const bansosPrograms = [
    { id: 1, nama: 'PKH', sumber: 'APBN', periode: '2026', kuota: 85, deskripsi: 'Program Keluarga Harapan' },
    { id: 2, nama: 'BPNT', sumber: 'APBN', periode: '2026', kuota: 120, deskripsi: 'Bantuan Pangan Non Tunai' },
    { id: 3, nama: 'BLT Dana Desa', sumber: 'APBDes', periode: '2026', kuota: 65, deskripsi: 'Bantuan Langsung Tunai Dana Desa' },
  ];

  const pengaduan = [
    { id: 1, name: 'Warga 1', contact: '081234567890', type: 'Infrastruktur', message: 'Jalan di Kp. Cikadu rusak parah.', submittedAt: '2026-01-05T09:30:00Z', status: 'Selesai' },
    { id: 2, name: 'Warga 2', contact: '081298765432', type: 'Lingkungan', message: 'Drainase tersumbat di depan SDN.', submittedAt: '2026-01-12T14:20:00Z', status: 'Diproses' },
  ];

  return { users, penduduk, berita, pbb, bansos, bansosPrograms, pengaduan, approvals: [], warga, wilayah, surat: [] };
}

// ==============================
// DATABASE OPERATIONS
// ==============================

async function ensureTables(pool) {
  // Tables already created by schema.sql, just make sure they exist
  await pool.query(`CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE, password VARCHAR(255) NOT NULL, role VARCHAR(50) NOT NULL, nik VARCHAR(50) UNIQUE, rt VARCHAR(100), rw VARCHAR(50)) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS warga (id INT PRIMARY KEY AUTO_INCREMENT, nik VARCHAR(50) UNIQUE NOT NULL, nop VARCHAR(100), nama VARCHAR(255) NOT NULL, alamat TEXT, dusun VARCHAR(50), dusunNama VARCHAR(100), rw VARCHAR(50), rwNama VARCHAR(50), rt VARCHAR(50), rtNama VARCHAR(50), pajak BIGINT DEFAULT 0, status VARCHAR(50), totalPajak BIGINT DEFAULT 0, totalLunas BIGINT DEFAULT 0, totalBelumBayar BIGINT DEFAULT 0, payments JSON DEFAULT NULL) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS pbb (id INT PRIMARY KEY AUTO_INCREMENT, nop VARCHAR(100) NOT NULL, nik VARCHAR(50), nama VARCHAR(255) NOT NULL, alamat TEXT, dusun VARCHAR(50), dusunNama VARCHAR(100), rw VARCHAR(50), rwNama VARCHAR(50), rt VARCHAR(50), rtNama VARCHAR(50), year INT, pajak BIGINT DEFAULT 0, status VARCHAR(50), payments JSON DEFAULT NULL, proofs JSON DEFAULT NULL) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS berita (id INT PRIMARY KEY AUTO_INCREMENT, title VARCHAR(255) NOT NULL, category VARCHAR(100), date VARCHAR(50) NOT NULL, content TEXT NOT NULL) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS bansos (id INT PRIMARY KEY AUTO_INCREMENT, no INT, nama VARCHAR(255) NOT NULL, alamat TEXT, rt VARCHAR(50), program VARCHAR(255), status VARCHAR(50)) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS bansos_programs (id INT PRIMARY KEY AUTO_INCREMENT, nama VARCHAR(255) NOT NULL, sumber VARCHAR(100), periode VARCHAR(50), kuota INT, deskripsi TEXT) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS pengaduan (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255) NOT NULL, contact VARCHAR(100), type VARCHAR(100), message TEXT, submittedAt VARCHAR(100) NOT NULL, status VARCHAR(50) DEFAULT 'Diterima', balasan TEXT) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS approvals (id INT PRIMARY KEY AUTO_INCREMENT, pbbId INT NOT NULL, nop VARCHAR(100), nama VARCHAR(255), approvedBy VARCHAR(255), approveStatus VARCHAR(50), note TEXT, approvedAt VARCHAR(100)) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS surat (id INT PRIMARY KEY AUTO_INCREMENT, jenis VARCHAR(255) NOT NULL, nama VARCHAR(255) NOT NULL, nik VARCHAR(50) NOT NULL, alamat TEXT, keperluan TEXT, status VARCHAR(50) DEFAULT 'Diajukan', nomorSurat VARCHAR(100), ditandatanganiOleh VARCHAR(255), catatan TEXT, diajukanPada VARCHAR(100) NOT NULL, diprosesPada VARCHAR(100)) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS activity_logs (id INT PRIMARY KEY AUTO_INCREMENT, action VARCHAR(255) NOT NULL, userId INT, userName VARCHAR(255), details TEXT, createdAt VARCHAR(100) NOT NULL) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS penduduk (id INT PRIMARY KEY AUTO_INCREMENT, nik VARCHAR(50) UNIQUE NOT NULL, nama VARCHAR(255) NOT NULL, alamat TEXT, rt VARCHAR(50), rw VARCHAR(50)) ENGINE=InnoDB`);
}

async function seedIfEmpty(pool, database) {
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM users');
  if (rows[0].count > 0) return;
  await syncAll(pool, database || createSeedDatabase());
}

async function loadAll(pool) {
  const [users] = await pool.query('SELECT * FROM users ORDER BY id');
  const [penduduk] = await pool.query('SELECT * FROM penduduk ORDER BY id');
  const [berita] = await pool.query('SELECT * FROM berita ORDER BY id');
  const [pbb] = await pool.query('SELECT * FROM pbb ORDER BY id');
  const [bansos] = await pool.query('SELECT * FROM bansos ORDER BY id');
  const [bansosPrograms] = await pool.query('SELECT * FROM bansos_programs ORDER BY id');
  const [pengaduan] = await pool.query('SELECT * FROM pengaduan ORDER BY id');
  const [approvals] = await pool.query('SELECT * FROM approvals ORDER BY id');
  const [surat] = await pool.query('SELECT * FROM surat ORDER BY id');
  const [warga] = await pool.query('SELECT * FROM warga ORDER BY id');

  // Parse JSON fields
  for (const row of pbb) {
    if (typeof row.payments === 'string') row.payments = JSON.parse(row.payments);
    if (typeof row.proofs === 'string') row.proofs = JSON.parse(row.proofs);
  }
  for (const row of warga) {
    if (typeof row.payments === 'string') row.payments = JSON.parse(row.payments);
  }

  return { users, penduduk, berita, pbb, bansos, bansosPrograms, pengaduan, approvals, surat, warga, wilayah: [] };
}

async function syncAll(pool, database) {
  const conn = await pool.getConnection();
  try {
    await conn.query('START TRANSACTION');

    // Clear all tables
    await conn.query('DELETE FROM users');
    await conn.query('DELETE FROM warga');
    await conn.query('DELETE FROM pbb');
    await conn.query('DELETE FROM berita');
    await conn.query('DELETE FROM bansos');
    await conn.query('DELETE FROM bansos_programs');
    await conn.query('DELETE FROM pengaduan');
    await conn.query('DELETE FROM approvals');
    await conn.query('DELETE FROM surat');
    await conn.query('DELETE FROM penduduk');

    // Insert seed data
    for (const u of database.users) {
      await conn.query('INSERT INTO users (id, name, email, password, role, nik, rt, rw) VALUES (?,?,?,?,?,?,?,?)',
        [u.id, u.name, u.email, u.password, u.role, u.nik || null, u.rt || null, u.rw || null]);
    }
    for (const w of database.warga) {
      await conn.query('INSERT INTO warga (id, nik, nop, nama, alamat, dusun, dusunNama, rw, rwNama, rt, rtNama, pajak, status, totalPajak, totalLunas, totalBelumBayar, payments) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [w.id, w.nik, w.nop, w.nama, w.alamat, w.dusun, w.dusunNama, w.rw, w.rwNama, w.rt, w.rtNama, w.pajak, w.status, w.totalPajak, w.totalLunas, w.totalBelumBayar, JSON.stringify(w.payments)]);
    }
    for (const p of database.pbb) {
      await conn.query('INSERT INTO pbb (id, nop, nik, nama, alamat, dusun, dusunNama, rw, rwNama, rt, rtNama, year, pajak, status, payments, proofs) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [p.id, p.nop, p.nik, p.nama, p.alamat, p.dusun, p.dusunNama, p.rw, p.rwNama, p.rt, p.rtNama, p.year, p.pajak, p.status, JSON.stringify(p.payments), JSON.stringify(p.proofs || [])]);
    }
    for (const b of database.berita) {
      await conn.query('INSERT INTO berita (id, title, category, date, content) VALUES (?,?,?,?,?)',
        [b.id, b.title, b.category, b.date, b.content]);
    }
    for (const b of database.bansos) {
      await conn.query('INSERT INTO bansos (id, no, nama, alamat, rt, program, status) VALUES (?,?,?,?,?,?,?)',
        [b.id, b.no, b.nama, b.alamat, b.rt, b.program, b.status]);
    }
    for (const bp of (database.bansosPrograms || [])) {
      await conn.query('INSERT INTO bansos_programs (id, nama, sumber, periode, kuota, deskripsi) VALUES (?,?,?,?,?,?)',
        [bp.id, bp.nama, bp.sumber, bp.periode, bp.kuota, bp.deskripsi]);
    }
    for (const p of (database.pengaduan || [])) {
      await conn.query('INSERT INTO pengaduan (id, name, contact, type, message, submittedAt, status) VALUES (?,?,?,?,?,?,?)',
        [p.id, p.name, p.contact, p.type, p.message, p.submittedAt, p.status || 'Diterima']);
    }
    for (const a of (database.approvals || [])) {
      await conn.query('INSERT INTO approvals (id, pbbId, nop, nama, approvedBy, approveStatus, note, approvedAt) VALUES (?,?,?,?,?,?,?,?)',
        [a.id, a.pbbId, a.nop, a.nama, a.approvedBy, a.approveStatus, a.note, a.approvedAt]);
    }
    for (const s of (database.surat || [])) {
      await conn.query('INSERT INTO surat (id, jenis, nama, nik, alamat, keperluan, status, nomorSurat, ditandatanganiOleh, catatan, diajukanPada, diprosesPada) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [s.id, s.jenis, s.nama, s.nik, s.alamat, s.keperluan, s.status, s.nomorSurat, s.ditandatanganiOleh, s.catatan, s.diajukanPada, s.diprosesPada]);
    }
    for (const p of database.penduduk) {
      await conn.query('INSERT INTO penduduk (id, nik, nama, alamat, rt, rw) VALUES (?,?,?,?,?,?)',
        [p.id, p.nik, p.nama, p.alamat, p.rt, p.rw]);
    }

    await conn.query('COMMIT');
  } catch (e) {
    await conn.query('ROLLBACK');
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = {
  createSeedDatabase,
  hasDatabase,
  createPool,
  ensureTables,
  seedIfEmpty,
  loadAll,
  syncAll,
};