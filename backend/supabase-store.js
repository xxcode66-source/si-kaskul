const { Pool } = require('pg');

function createSeedDatabase() {
  return {
    users: [
      { id: 1, name: 'Admin Desa', email: 'admin@kasomalangkulon.id', password: 'admin123', role: 'admin' },
      { id: 2, name: 'Kolektor Desa', email: 'kolektor@kasomalangkulon.id', password: 'kolektor123', role: 'kolektor' },
      { id: 3, name: 'Ketua RT 1', email: 'rt1@kasomalangkulon.id', password: 'rt123', role: 'rt', rt: '01/01', rw: '01' },
      { id: 4, name: 'Ketua RT 2', email: 'rt2@kasomalangkulon.id', password: 'rt123', role: 'rt', rt: '02/01', rw: '01' },
      { id: 5, name: 'Budi Santoso', nik: '1234567890123456', password: '123456', role: 'penduduk' }
    ],
    penduduk: [
      { id: 1, nik: '1234567890123456', nama: 'Budi Santoso', alamat: 'Jl. Raya No. 12', rt: '01/01', rw: '01' }
    ],
    berita: [
      { id: 1, title: 'Program Pelatihan Kewirausahaan', category: 'program', date: '2024-01-15', content: 'Desa mengadakan pelatihan kewirausahaan...' },
      { id: 2, title: 'Pengumuman Pendaftaran Bansos', category: 'pengumuman', date: '2024-01-10', content: 'Dibuka pendaftaran bantuan sosial...' }
    ],
    pbb: [
      { id: 1, nop: '1234567890123456', nama: 'Budi Santoso', alamat: 'Jl. Raya No. 12', rt: '01/01', rw: '01', year: 2020, pajak: 500000, status: 'Nunggak', nik: '1234567890123456', proofs: [] },
      { id: 2, nop: '1234567890123457', nama: 'Budi Santoso', alamat: 'Jl. Raya No. 12', rt: '01/01', rw: '01', year: 2021, pajak: 520000, status: 'Nunggak', nik: '1234567890123456', proofs: [] },
      { id: 3, nop: '1234567890123456', nama: 'Budi Santoso', alamat: 'Jl. Raya No. 12', rt: '01/01', rw: '01', year: 2022, pajak: 530000, status: 'Lunas', nik: '1234567890123456', proofs: [] },
      { id: 4, nop: '1234567890123458', nama: 'Siti Nurhaliza', alamat: 'Jl. Raya No. 15', rt: '01/01', rw: '01', year: 2023, pajak: 650000, status: 'Lunas', proofs: [] },
      { id: 5, nop: '1234567890123459', nama: 'Rudi Hadi', alamat: 'Jl. Merdeka No. 21', rt: '02/01', rw: '01', year: 2024, pajak: 450000, status: 'Nunggak', proofs: [] },
      { id: 6, nop: '1234567890123460', nama: 'Dewi Kurnia', alamat: 'Jl. Melati No. 9', rt: '02/01', rw: '01', year: 2025, pajak: 550000, status: 'Lunas', proofs: [] }
    ],
    bansos: [
      { id: 1, no: 1, nama: 'Siti Nurhaliza', alamat: 'Jl. Raya No. 12', rt: '01/01', program: 'PKH + BPNT', status: 'Aktif' },
      { id: 2, no: 2, nama: 'Ahmad Sutisna', alamat: 'Jl. Raya No. 15', rt: '01/01', program: 'BPNT', status: 'Aktif' }
    ],
    pengaduan: [],
    approvals: []
  };
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

  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
}

async function ensureSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      nik TEXT UNIQUE,
      rt TEXT,
      rw TEXT
    );

    CREATE TABLE IF NOT EXISTS penduduk (
      id INTEGER PRIMARY KEY,
      nik TEXT UNIQUE NOT NULL,
      nama TEXT NOT NULL,
      alamat TEXT,
      rt TEXT,
      rw TEXT
    );

    CREATE TABLE IF NOT EXISTS berita (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      date TEXT NOT NULL,
      content TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pbb (
      id INTEGER PRIMARY KEY,
      nop TEXT NOT NULL,
      nama TEXT NOT NULL,
      alamat TEXT,
      rt TEXT,
      rw TEXT,
      year INTEGER,
      pajak INTEGER DEFAULT 0,
      status TEXT,
      nik TEXT,
      proofs JSONB DEFAULT '[]'::jsonb
    );

    CREATE TABLE IF NOT EXISTS bansos (
      id INTEGER PRIMARY KEY,
      no INTEGER,
      nama TEXT NOT NULL,
      alamat TEXT,
      rt TEXT,
      program TEXT,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS pengaduan (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT,
      type TEXT,
      message TEXT,
      submittedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id INTEGER PRIMARY KEY,
      pbbId INTEGER NOT NULL,
      nop TEXT NOT NULL,
      nama TEXT NOT NULL,
      approvedBy TEXT NOT NULL,
      approveStatus TEXT NOT NULL,
      note TEXT,
      approvedAt TEXT NOT NULL
    );
  `);
}

async function seedIfEmpty(pool, database) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM users');
  if (rows[0].count > 0) {
    return;
  }

  await syncDatabase(pool, database || createSeedDatabase());
}

async function loadCollection(pool, tableName, orderBy = 'id') {
  const { rows } = await pool.query(`SELECT * FROM ${tableName} ORDER BY ${orderBy}`);
  return rows.map(row => ({
    ...row,
    proofs: tableName === 'pbb' && row.proofs ? row.proofs : row.proofs
  }));
}

async function loadDatabase(pool) {
  const [users, penduduk, berita, pbb, bansos, pengaduan, approvals] = await Promise.all([
    loadCollection(pool, 'users'),
    loadCollection(pool, 'penduduk'),
    loadCollection(pool, 'berita'),
    loadCollection(pool, 'pbb'),
    loadCollection(pool, 'bansos'),
    loadCollection(pool, 'pengaduan'),
    loadCollection(pool, 'approvals')
  ]);

  return { users, penduduk, berita, pbb, bansos, pengaduan, approvals };
}

async function syncTable(pool, tableName, rows, columns) {
  await pool.query('BEGIN');
  try {
    await pool.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);

    for (const row of rows) {
      const values = columns.map(column => {
        if (column === 'proofs' && Array.isArray(row[column])) {
          return JSON.stringify(row[column]);
        }

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
  await syncTable(pool, 'pbb', database.pbb, ['id', 'nop', 'nama', 'alamat', 'rt', 'rw', 'year', 'pajak', 'status', 'nik', 'proofs']);
  await syncTable(pool, 'bansos', database.bansos, ['id', 'no', 'nama', 'alamat', 'rt', 'program', 'status']);
  await syncTable(pool, 'pengaduan', database.pengaduan, ['id', 'name', 'contact', 'type', 'message', 'submittedAt']);
  await syncTable(pool, 'approvals', database.approvals, ['id', 'pbbId', 'nop', 'nama', 'approvedBy', 'approveStatus', 'note', 'approvedAt']);
}

module.exports = {
  createSeedDatabase,
  hasSupabaseDatabase,
  createPool,
  ensureSchema,
  seedIfEmpty,
  loadDatabase,
  syncDatabase
};