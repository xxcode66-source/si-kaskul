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
    { id: 7, name: 'Warga Demo 1', nik: '1234567890123456', password: '123456', role: 'warga', email: 'warga1@kasomalangkulon.id' },
    { id: 8, name: 'Warga Demo 2', nik: '9876543210987654', password: '123456', role: 'warga', email: 'warga2@kasomalangkulon.id' },
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

  // Gang Desa - Dummy data around Desa Kasomalang Kulon (-6.85, 108.15)
  const gangs = [
    // Dusun 1 - RW 01
    { id: 1, nama: 'Gang Anggur', dusun: 'dusun1', dusunNama: 'Dusun 1', rw: 'rw01', rwNama: 'RW 01', rt: 'rt01', rtNama: 'RT 01', lat: -6.8498, lng: 108.1512, bearing: 45, description: 'Gang dekat Masjid Al-Ikhlas' },
    { id: 2, nama: 'Gang Mangga', dusun: 'dusun1', dusunNama: 'Dusun 1', rw: 'rw01', rwNama: 'RW 01', rt: 'rt01', rtNama: 'RT 01', lat: -6.8502, lng: 108.1518, bearing: 90, description: 'Gang dekat Balai Desa' },
    { id: 3, nama: 'Gang Durian', dusun: 'dusun1', dusunNama: 'Dusun 1', rw: 'rw01', rwNama: 'RW 01', rt: 'rt02', rtNama: 'RT 02', lat: -6.8508, lng: 108.1505, bearing: 180, description: 'Gang dekat SDN Kasomalang' },
    { id: 4, nama: 'Gang Rambutan', dusun: 'dusun1', dusunNama: 'Dusun 1', rw: 'rw01', rwNama: 'RW 01', rt: 'rt02', rtNama: 'RT 02', lat: -6.8515, lng: 108.1522, bearing: 270, description: 'Gang dekat lapangan voli' },
    { id: 5, nama: 'Gang Jeruk', dusun: 'dusun1', dusunNama: 'Dusun 1', rw: 'rw01', rwNama: 'RW 01', rt: 'rt03', rtNama: 'RT 03', lat: -6.8522, lng: 108.1498, bearing: 135, description: 'Gang dekat pos ronda' },
    // Dusun 1 - RW 02
    { id: 6, nama: 'Gang Apel', dusun: 'dusun1', dusunNama: 'Dusun 1', rw: 'rw02', rwNama: 'RW 02', rt: 'rt01', rtNama: 'RT 01', lat: -6.8485, lng: 108.1535, bearing: 0, description: 'Gang dekat warung Bu Neng' },
    { id: 7, nama: 'Gang Pisang', dusun: 'dusun1', dusunNama: 'Dusun 1', rw: 'rw02', rwNama: 'RW 02', rt: 'rt01', rtNama: 'RT 01', lat: -6.8492, lng: 108.1542, bearing: 60, description: 'Gang dekat mushola' },
    { id: 8, nama: 'Gang Nangka', dusun: 'dusun1', dusunNama: 'Dusun 1', rw: 'rw02', rwNama: 'RW 02', rt: 'rt02', rtNama: 'RT 02', lat: -6.8478, lng: 108.1528, bearing: 120, description: 'Gang dekat sumur umum' },
    { id: 9, nama: 'Gang Salak', dusun: 'dusun1', dusunNama: 'Dusun 1', rw: 'rw02', rwNama: 'RW 02', rt: 'rt03', rtNama: 'RT 03', lat: -6.8472, lng: 108.1555, bearing: 200, description: 'Gang dekat taman bermain' },
    { id: 10, nama: 'Gang Sawo', dusun: 'dusun1', dusunNama: 'Dusun 1', rw: 'rw02', rwNama: 'RW 02', rt: 'rt04', rtNama: 'RT 04', lat: -6.8465, lng: 108.1548, bearing: 300, description: 'Gang dekat kandang sapi' },
    // Dusun 2 - RW 01
    { id: 11, nama: 'Gang Melati', dusun: 'dusun2', dusunNama: 'Dusun 2', rw: 'rw01', rwNama: 'RW 01', rt: 'rt01', rtNama: 'RT 01', lat: -6.8535, lng: 108.1485, bearing: 30, description: 'Gang dekat pabrik tahu' },
    { id: 12, nama: 'Gang Mawar', dusun: 'dusun2', dusunNama: 'Dusun 2', rw: 'rw01', rwNama: 'RW 01', rt: 'rt01', rtNama: 'RT 01', lat: -6.8542, lng: 108.1478, bearing: 150, description: 'Gang dekat bengkel Pak Asep' },
    { id: 13, nama: 'Gang Dahlia', dusun: 'dusun2', dusunNama: 'Dusun 2', rw: 'rw01', rwNama: 'RW 01', rt: 'rt02', rtNama: 'RT 02', lat: -6.8548, lng: 108.1492, bearing: 210, description: 'Gang dekat kolam ikan' },
    { id: 14, nama: 'Gang Kenanga', dusun: 'dusun2', dusunNama: 'Dusun 2', rw: 'rw01', rwNama: 'RW 01', rt: 'rt02', rtNama: 'RT 02', lat: -6.8555, lng: 108.1472, bearing: 330, description: 'Gang dekat rumah Pak RT' },
    // Dusun 2 - RW 02
    { id: 15, nama: 'Gang Cempaka', dusun: 'dusun2', dusunNama: 'Dusun 2', rw: 'rw02', rwNama: 'RW 02', rt: 'rt01', rtNama: 'RT 01', lat: -6.8562, lng: 108.1505, bearing: 75, description: 'Gang dekat toko kelontong' },
    { id: 16, nama: 'Gang Flamboyan', dusun: 'dusun2', dusunNama: 'Dusun 2', rw: 'rw02', rwNama: 'RW 02', rt: 'rt01', rtNama: 'RT 01', lat: -6.8568, lng: 108.1512, bearing: 195, description: 'Gang dekat sekolah PAUD' },
    { id: 17, nama: 'Gang Bougenville', dusun: 'dusun2', dusunNama: 'Dusun 2', rw: 'rw02', rwNama: 'RW 02', rt: 'rt02', rtNama: 'RT 02', lat: -6.8575, lng: 108.1498, bearing: 285, description: 'Gang dekat lapangan basket' },
    // Dusun 3 - RW 01
    { id: 18, nama: 'Gang Teratai', dusun: 'dusun3', dusunNama: 'Dusun 3', rw: 'rw01', rwNama: 'RW 01', rt: 'rt01', rtNama: 'RT 01', lat: -6.8582, lng: 108.1525, bearing: 15, description: 'Gang dekat sawah' },
    { id: 19, nama: 'Gang Tulip', dusun: 'dusun3', dusunNama: 'Dusun 3', rw: 'rw01', rwNama: 'RW 01', rt: 'rt01', rtNama: 'RT 01', lat: -6.8588, lng: 108.1532, bearing: 105, description: 'Gang dekat sungai kecil' },
    { id: 20, nama: 'Gang Lily', dusun: 'dusun3', dusunNama: 'Dusun 3', rw: 'rw01', rwNama: 'RW 01', rt: 'rt02', rtNama: 'RT 02', lat: -6.8595, lng: 108.1518, bearing: 225, description: 'Gang dekat kebun sayur' },
    { id: 21, nama: 'Gang Matahari', dusun: 'dusun3', dusunNama: 'Dusun 3', rw: 'rw01', rwNama: 'RW 01', rt: 'rt02', rtNama: 'RT 02', lat: -6.8602, lng: 108.1542, bearing: 315, description: 'Gang dekat pos kamling' },
    { id: 22, nama: 'Gang Aster', dusun: 'dusun3', dusunNama: 'Dusun 3', rw: 'rw01', rwNama: 'RW 01', rt: 'rt03', rtNama: 'RT 03', lat: -6.8608, lng: 108.1528, bearing: 50, description: 'Gang dekat kandang ayam' },
    // Dusun 3 - RW 02
    { id: 23, nama: 'Gang Lavender', dusun: 'dusun3', dusunNama: 'Dusun 3', rw: 'rw02', rwNama: 'RW 02', rt: 'rt01', rtNama: 'RT 01', lat: -6.8615, lng: 108.1555, bearing: 170, description: 'Gang dekat hutan bambu' },
    { id: 24, nama: 'Gang Orchid', dusun: 'dusun3', dusunNama: 'Dusun 3', rw: 'rw02', rwNama: 'RW 02', rt: 'rt01', rtNama: 'RT 01', lat: -6.8622, lng: 108.1548, bearing: 250, description: 'Gang dekat embung desa' },
    { id: 25, nama: 'Gang Sakura', dusun: 'dusun3', dusunNama: 'Dusun 3', rw: 'rw02', rwNama: 'RW 02', rt: 'rt02', rtNama: 'RT 02', lat: -6.8628, lng: 108.1562, bearing: 340, description: 'Gang dekat gazebo' },
    { id: 26, nama: 'Gang Lotus', dusun: 'dusun3', dusunNama: 'Dusun 3', rw: 'rw02', rwNama: 'RW 02', rt: 'rt02', rtNama: 'RT 02', lat: -6.8635, lng: 108.1552, bearing: 80, description: 'Gang dekat tempat pembakaran sampah' },
    { id: 27, nama: 'Gang Kamboja', dusun: 'dusun3', dusunNama: 'Dusun 3', rw: 'rw02', rwNama: 'RW 02', rt: 'rt03', rtNama: 'RT 03', lat: -6.8642, lng: 108.1572, bearing: 160, description: 'Gang dekat makam desa' },
    { id: 28, nama: 'Gang Sedap Malam', dusun: 'dusun3', dusunNama: 'Dusun 3', rw: 'rw02', rwNama: 'RW 02', rt: 'rt03', rtNama: 'RT 03', lat: -6.8648, lng: 108.1565, bearing: 290, description: 'Gang dekat warung kopi' },
  ];

  return { users, penduduk, berita, pbb, bansos, bansosPrograms, pengaduan, approvals: [], warga, wilayah, surat: [], gangs };
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
  await pool.query(`CREATE TABLE IF NOT EXISTS penduduk (id INT PRIMARY KEY AUTO_INCREMENT, nik VARCHAR(50) UNIQUE NOT NULL, kk VARCHAR(50), nama VARCHAR(255) NOT NULL, tempatLahir VARCHAR(100), tanggalLahir VARCHAR(50), jenisKelamin VARCHAR(20), alamat TEXT, kampung VARCHAR(100), rt VARCHAR(50), rw VARCHAR(50), umur INT, shdk VARCHAR(100), agama VARCHAR(50), pendidikan VARCHAR(100), pekerjaan VARCHAR(100), ayah VARCHAR(255), ibu VARCHAR(255)) ENGINE=InnoDB`);
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
  let gangs = [];
  try { const [g] = await pool.query('SELECT * FROM gangs ORDER BY id'); gangs = g; } catch (e) { /* table may not exist yet */ }

  // Parse JSON fields
  for (const row of pbb) {
    if (typeof row.payments === 'string') row.payments = JSON.parse(row.payments);
    if (typeof row.proofs === 'string') row.proofs = JSON.parse(row.proofs);
  }
  for (const row of warga) {
    if (typeof row.payments === 'string') row.payments = JSON.parse(row.payments);
  }

  return { users, penduduk, berita, pbb, bansos, bansosPrograms, pengaduan, approvals, surat, warga, wilayah: [], gangs };
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
      await conn.query('INSERT INTO penduduk (id, nik, kk, nama, tempatLahir, tanggalLahir, jenisKelamin, alamat, kampung, rt, rw, umur, shdk, agama, pendidikan, pekerjaan, ayah, ibu) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [p.id, p.nik, p.kk || null, p.nama, p.tempatLahir || null, p.tanggalLahir || null, p.jenisKelamin || null, p.alamat, p.kampung || null, p.rt, p.rw, p.umur || null, p.shdk || null, p.agama || null, p.pendidikan || null, p.pekerjaan || null, p.ayah || null, p.ibu || null]);
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