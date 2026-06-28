const { Pool } = require('pg');

function createSeedDatabase() {
  // ==============================
  // DUSUN / RW / RT HIERARCHY
  // ==============================
  const wilayah = [
    { dusun: 'dusun1', dusunNama: 'Dusun 01' },
    { dusun: 'dusun2', dusunNama: 'Dusun 02' },
    { dusun: 'dusun3', dusunNama: 'Dusun 03' },
  ];
  // RW per dusun
  const rwMap = {
    dusun1: ['01', '02'],
    dusun2: ['03', '04', '05', '06'],
    dusun3: ['04', '05', '07'], // RW 04 & 05 overlap dusun 2 & 3 in real life
  };
  // RT per RW: 4-6 RT per RW
  const rtPerRw = 5;

  // ==============================
  // GENERATE WARGA (data penduduk)
  // ==============================
  const namaDepan = ['Asep','Ujang','Entis','Tati','Yuli','Rudi','Siti','Dedi','Ade','Iwan','Nina','Agus','Wati','Euis','Cecep','Dede','Lilis','Aam','Toto','Aneu','Jajang','Mimin','Usep','Elis','Yayan'];
  const namaBelakang = ['Sunandar','Hidayat','Suryana','Mulyana','Kusnadi','Nurdin','Supriadi','Hermawan','Wijaya','Permadi','Gunawan','Suhendar','Rohmat','Saepulloh','Suganda'];
  const jalan = ['Kp. Cikadu','Kp. Cikalong','Kp. Babakan','Kp. Pasir','Kp. Lembang','Jl. Raya','Kp. Hegarmanah','Kp. Cibogo','Kp. Bojong','Kp. Gandasoli'];

  let userId = 10;
  let wargaId = 0;
  let pbbId = 0;
  const warga = [];
  const pbb = [];
  const penduduk = [];

  // Generate warga per RT
  for (const w of wilayah) {
    const rws = rwMap[w.dusun];
    for (const rwNomor of rws) {
      for (let rtNomor = 1; rtNomor <= rtPerRw; rtNomor++) {
        // 2-3 warga per RT
        const count = 2 + (rtNomor % 2);
        for (let i = 0; i < count; i++) {
          wargaId++;
          const nik = `320812${String(wargaId).padStart(10, '0')}`;
          const nop = `32.08.120.${String(wargaId).padStart(10, '0')}`;
          const nama = `${namaDepan[Math.floor(Math.random() * namaDepan.length)]} ${namaBelakang[Math.floor(Math.random() * namaBelakang.length)]}`;
          const alamatJalan = jalan[Math.floor(Math.random() * jalan.length)];
          const rwStr = String(rwNomor);
          const rtStr = String(rtNomor).padStart(2, '0');
          const dusunLabel = w.dusunNama;

          // Pajak amount varies by year (increase each year)
          const basePajak = 200000 + Math.floor(Math.random() * 500000);

          // Per-year payment records (2020-2026)
          const payments = [];
          for (let year = 2020; year <= 2026; year++) {
            const pajakTahun = Math.round(basePajak * (1 + (year - 2020) * 0.03)); // 3% increase per year
            const isLunas = Math.random() > 0.25; // ~75% chance of being paid
            let status = 'Belum Bayar';
            let paidAt = null;
            let approvedBy = null;

            if (isLunas && year <= 2025) {
              status = 'Lunas';
              const month = 1 + Math.floor(Math.random() * 4); // Jan-Apr
              const day = 1 + Math.floor(Math.random() * 28);
              paidAt = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              approvedBy = 'Admin Desa';
            } else if (!isLunas && year > 2024) {
              status = 'Pending'; // recent years may be pending
            } else if (!isLunas) {
              status = 'Belum Bayar';
            }

            payments.push({ year, pajak: pajakTahun, status, paidAt, approvedBy });
          }

          // Summary: latest status
          const latestPayment = payments[payments.length - 1];
          let summaryStatus = 'Belum Bayar';
          const lunasCount = payments.filter(p => p.status === 'Lunas').length;
          const pendingCount = payments.filter(p => p.status === 'Pending').length;
          if (lunasCount === 7) summaryStatus = 'Lunas';
          else if (pendingCount > 0) summaryStatus = 'Pending';
          else if (lunasCount >= 3) summaryStatus = 'Sebagian';
          else summaryStatus = 'Menunggak';

          // Create warga record
          const wargaRec = {
            id: wargaId,
            nik,
            nop,
            nama,
            alamat: `${alamatJalan} RT ${rtStr}/RW ${rwStr}`,
            dusun: w.dusun,
            dusunNama: dusunLabel,
            rw: `rw${rwNomor}`,
            rwNama: `RW ${rwNomor}`,
            rt: `rt${rtNomor}`,
            rtNama: `RT ${rtStr}`,
            pajak: basePajak,
            status: summaryStatus,
            totalPajak: payments.reduce((s, p) => s + p.pajak, 0),
            totalLunas: payments.filter(p => p.status === 'Lunas').reduce((s, p) => s + p.pajak, 0),
            totalBelumBayar: payments.filter(p => p.status === 'Belum Bayar' || p.status === 'Pending').reduce((s, p) => s + p.pajak, 0),
            payments,
          };
          warga.push(wargaRec);
          penduduk.push({ id: wargaId, nik, nama, alamat: wargaRec.alamat, rt: `01/${rwStr}`, rw: rwStr });

          // Also create a pbb record (legacy flat format for existing endpoints)
          pbbId++;
          pbb.push({
            id: pbbId,
            nop,
            nik,
            nama,
            alamat: wargaRec.alamat,
            dusun: w.dusun,
            dusunNama: dusunLabel,
            rw: `rw${rwNomor}`,
            rwNama: `RW ${rwNomor}`,
            rt: `rt${rtNomor}`,
            rtNama: `RT ${rtStr}`,
            year: 2026,
            pajak: basePajak,
            status: summaryStatus,
            proofs: [],
            payments,
          });
        }
      }
    }
  }

  // Add a few "Luar Desa" records
  for (let i = 0; i < 8; i++) {
    wargaId++;
    const nik = `320812${String(wargaId).padStart(10, '0')}`;
    const nop = `32.08.999.${String(wargaId).padStart(10, '0')}`;
    const nama = `${namaDepan[Math.floor(Math.random() * namaDepan.length)]} ${namaBelakang[Math.floor(Math.random() * namaBelakang.length)]}`;
    const basePajak = 150000 + Math.floor(Math.random() * 300000);
    const payments = [];
    for (let year = 2020; year <= 2026; year++) {
      const pajakTahun = Math.round(basePajak * (1 + (year - 2020) * 0.03));
      payments.push({ year, pajak: pajakTahun, status: 'Belum Bayar', paidAt: null, approvedBy: null });
    }
    warga.push({
      id: wargaId, nik, nop, nama, alamat: 'Luar Desa',
      dusun: 'luardesa', dusunNama: 'Luar Desa',
      rw: 'luar', rwNama: '-',
      rt: 'luar', rtNama: '-',
      pajak: basePajak, status: 'Menunggak',
      totalPajak: payments.reduce((s, p) => s + p.pajak, 0),
      totalLunas: 0,
      totalBelumBayar: payments.reduce((s, p) => s + p.pajak, 0),
      payments,
    });
    pbbId++;
    pbb.push({
      id: pbbId, nop, nik, nama, alamat: 'Luar Desa',
      dusun: 'luardesa', dusunNama: 'Luar Desa',
      rw: 'luar', rwNama: '-',
      rt: 'luar', rtNama: '-',
      year: 2026, pajak: basePajak, status: 'Menunggak',
      proofs: [], payments,
    });
  }

  // ==============================
  // OTHER SEED DATA
  // ==============================
  const users = [
    { id: 1, name: 'Admin Desa', email: 'admin@kasomalangkulon.id', password: 'admin123', role: 'admin' },
    { id: 2, name: 'Kolektor 1', email: 'kolektor1@kasomalangkulon.id', password: 'kolektor123', role: 'kolektor', rt: 'dusun1/rw1/rt1,rt2,rt3', rw: '01' },
    { id: 3, name: 'Kolektor 2', email: 'kolektor2@kasomalangkulon.id', password: 'kolektor123', role: 'kolektor', rt: 'dusun1/rw2/rt1,rt2,rt3,rt4', rw: '02' },
    { id: 4, name: 'Ketua RT 1 Dusun 1', email: 'rt1@kasomalangkulon.id', password: 'rt123', role: 'rt', rt: 'dusun1/rw1/rt1', rw: '01' },
    { id: 5, name: 'Ketua RT 2 Dusun 1', email: 'rt2@kasomalangkulon.id', password: 'rt123', role: 'rt', rt: 'dusun1/rw1/rt2', rw: '01' },
    { id: 6, name: 'Ketua RW 1', email: 'rwk1@kasomalangkulon.id', password: 'rt123', role: 'rw', rt: 'dusun1/rw1', rw: '01' },
  ];

  // Update penduduk array with all generated warga
  const pendudukFinal = penduduk.length > 0 ? penduduk : [{ id: 1, nik: '3208120000000001', nama: 'Budi Santoso', alamat: 'Kp. Cikadu', rt: '01/01', rw: '01' }];

  const berita = [
    { id: 1, title: 'Pembayaran PBB 2026 Sudah Dibuka', category: 'pengumuman', date: '2026-01-15', content: 'Pembayaran PBB tahun 2026 sudah dapat dilakukan melalui kolektor desa. Silakan hubungi kolektor di wilayah masing-masing untuk melakukan pembayaran. Batas akhir pembayaran tanpa denda adalah 31 Maret 2026.' },
    { id: 2, title: 'Penyaluran BPNT Triwulan I 2026', category: 'program', date: '2026-01-10', content: 'Penyaluran BPNT triwulan I tahun 2026 akan dilaksanakan pada tanggal 20-25 Januari 2026 di Balai Desa. Bagi penerima yang berhalangan hadir, dapat diwakilkan dengan membawa surat kuasa.' },
    { id: 3, title: 'Realisasi PBB 2025 Capai 78%', category: 'pengumuman', date: '2025-12-30', content: 'Realisasi pembayaran PBB tahun 2025 mencapai 78% dari total target. Kami mengucapkan terima kasih kepada seluruh wajib pajak yang telah melunasi kewajibannya.' },
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
      { id: 1, name: 'Warga 1', contact: '081234567890', type: 'Infrastruktur', message: 'Jalan di Kp. Cikadu rusak parah, mohon perbaikan segera.', submittedAt: '2026-01-05T09:30:00Z', status: 'Selesai' },
      { id: 2, name: 'Warga 2', contact: '081298765432', type: 'Lingkungan', message: 'Drainase tersumbat di depan SDN Kasomalang.', submittedAt: '2026-01-12T14:20:00Z', status: 'Diproses' },
    ];

    const approvals = [];

    const surat = [];

    return { users, penduduk: pendudukFinal, berita, pbb, bansos, bansosPrograms, pengaduan, approvals, warga, wilayah, surat };
}

function getConnectionString() {
  return process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL || '';
}

function hasSupabaseDatabase() {
  return Boolean(getConnectionString());
}

function createPool() {
  const connectionString = getConnectionString();
  if (!connectionString) return null;
  return new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
}

async function ensureSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL, nik TEXT UNIQUE, rt TEXT, rw TEXT);
    CREATE TABLE IF NOT EXISTS penduduk (id INTEGER PRIMARY KEY, nik TEXT UNIQUE NOT NULL, nama TEXT NOT NULL, alamat TEXT, rt TEXT, rw TEXT);
    CREATE TABLE IF NOT EXISTS berita (id INTEGER PRIMARY KEY, title TEXT NOT NULL, category TEXT, date TEXT NOT NULL, content TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS pbb (id INTEGER PRIMARY KEY, nop TEXT NOT NULL, nik TEXT, nama TEXT NOT NULL, alamat TEXT, dusun TEXT, dusunNama TEXT, rw TEXT, rwNama TEXT, rt TEXT, rtNama TEXT, year INTEGER, pajak INTEGER DEFAULT 0, status TEXT, payments JSONB DEFAULT '[]'::jsonb, proofs JSONB DEFAULT '[]'::jsonb);
    CREATE TABLE IF NOT EXISTS bansos (id INTEGER PRIMARY KEY, no INTEGER, nama TEXT NOT NULL, alamat TEXT, rt TEXT, program TEXT, status TEXT);
    CREATE TABLE IF NOT EXISTS bansos_programs (id INTEGER PRIMARY KEY, nama TEXT NOT NULL, sumber TEXT, periode TEXT, kuota INTEGER, deskripsi TEXT);
    CREATE TABLE IF NOT EXISTS pengaduan (id INTEGER PRIMARY KEY, name TEXT NOT NULL, contact TEXT, type TEXT, message TEXT, submittedAt TEXT NOT NULL, status TEXT DEFAULT 'Diterima');
    CREATE TABLE IF NOT EXISTS approvals (id INTEGER PRIMARY KEY, pbbId INTEGER NOT NULL, nop TEXT NOT NULL, nama TEXT NOT NULL, approvedBy TEXT NOT NULL, approveStatus TEXT NOT NULL, note TEXT, approvedAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS activity_logs (id SERIAL PRIMARY KEY, action TEXT NOT NULL, userId INTEGER, userName TEXT, details TEXT, createdAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS surat (id INTEGER PRIMARY KEY, jenis TEXT NOT NULL, nama TEXT NOT NULL, nik TEXT NOT NULL, alamat TEXT, keperluan TEXT, status TEXT DEFAULT 'Diajukan', nomorSurat TEXT, ditandatanganiOleh TEXT, catatan TEXT, diajukanPada TEXT NOT NULL, diprosesPada TEXT);
  `);
}

async function seedIfEmpty(pool, database) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM users');
  if (rows[0].count > 0) return;
  await syncDatabase(pool, database || createSeedDatabase());
}

async function loadCollection(pool, tableName, orderBy = 'id') {
  const { rows } = await pool.query(`SELECT * FROM ${tableName} ORDER BY ${orderBy}`);
  return rows;
}

async function loadDatabase(pool) {
  const [users, penduduk, berita, pbb, bansos, bansosPrograms, pengaduan, approvals, surat] = await Promise.all([
      loadCollection(pool, 'users'),
      loadCollection(pool, 'penduduk'),
      loadCollection(pool, 'berita'),
      loadCollection(pool, 'pbb'),
      loadCollection(pool, 'bansos'),
      loadCollection(pool, 'bansos_programs'),
      loadCollection(pool, 'pengaduan'),
      loadCollection(pool, 'approvals'),
      loadCollection(pool, 'surat'),
    ]);
    return { users, penduduk, berita, pbb, bansos, bansosPrograms, pengaduan, approvals, surat };
}

async function syncTable(pool, tableName, rows, columns) {
  await pool.query('BEGIN');
  try {
    await pool.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
    for (const row of rows) {
      const values = columns.map(column => {
        if (['payments', 'proofs'].includes(column) && Array.isArray(row[column])) return JSON.stringify(row[column]);
        return row[column] ?? null;
      });
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      const columnList = columns.join(', ');
      await pool.query(`INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders})`, values);
    }
    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
}

async function syncDatabase(pool, database) {
  await syncTable(pool, 'users', database.users, ['id', 'name', 'email', 'password', 'role', 'nik', 'rt', 'rw']);
  await syncTable(pool, 'penduduk', database.penduduk, ['id', 'nik', 'nama', 'alamat', 'rt', 'rw']);
  await syncTable(pool, 'berita', database.berita, ['id', 'title', 'category', 'date', 'content']);
  await syncTable(pool, 'pbb', database.pbb, ['id', 'nop', 'nik', 'nama', 'alamat', 'dusun', 'dusunNama', 'rw', 'rwNama', 'rt', 'rtNama', 'year', 'pajak', 'status', 'payments', 'proofs']);
  await syncTable(pool, 'bansos', database.bansos, ['id', 'no', 'nama', 'alamat', 'rt', 'program', 'status']);
  await syncTable(pool, 'bansos_programs', database.bansosPrograms, ['id', 'nama', 'sumber', 'periode', 'kuota', 'deskripsi']);
  await syncTable(pool, 'pengaduan', database.pengaduan, ['id', 'name', 'contact', 'type', 'message', 'submittedAt', 'status']);
  await syncTable(pool, 'approvals', database.approvals, ['id', 'pbbId', 'nop', 'nama', 'approvedBy', 'approveStatus', 'note', 'approvedAt']);
  await syncTable(pool, 'surat', database.surat, ['id', 'jenis', 'nama', 'nik', 'alamat', 'keperluan', 'status', 'nomorSurat', 'ditandatanganiOleh', 'catatan', 'diajukanPada', 'diprosesPada']);
}

module.exports = {
  createSeedDatabase,
  hasSupabaseDatabase,
  createPool,
  ensureSchema,
  seedIfEmpty,
  loadDatabase,
  syncDatabase,
};