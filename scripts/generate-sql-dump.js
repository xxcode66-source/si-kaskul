/**
 * Generate MySQL SQL dump from Excel files
 * - MONOGRAFI DESA.xlsx -> penduduk table
 * - SPPT PBB 2026.xlsx -> pbb_warga + pbb_records tables
 * 
 * Output: database/si-kaskul-data.sql
 * 
 * Usage: node scripts/generate-sql-dump.js
 */

const XLSX = require('../backend/node_modules/xlsx');
const fs = require('fs');
const path = require('path');

const MONOGRAFI_FILE = path.join(__dirname, '..', 'MONOGRAFI DESA.xlsx');
const SPPT_FILE = path.join(__dirname, '..', 'tes pbb.xlsx');
const OUTPUT_FILE = path.join(__dirname, '..', 'database', 'si-kaskul-data.sql');

// Escape string for SQL
function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  const s = String(val).replace(/'/g, "''").replace(/\\/g, '\\\\');
  return `'${s}'`;
}

function escInt(val) {
  if (val === null || val === undefined || val === '') return 'NULL';
  const n = parseInt(val);
  return isNaN(n) ? 'NULL' : String(n);
}

function escBigInt(val) {
  if (val === null || val === undefined || val === '') return '0';
  const n = parseInt(val);
  return isNaN(n) ? '0' : String(n);
}

// ==============================
// IMPORT MONOGRAFI -> PENDUDUK
// ==============================
function importPenduduk() {
  console.log('Reading MONOGRAFI DESA.xlsx...');
  const wb = XLSX.readFile(MONOGRAFI_FILE);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const rows = [];
  let skipped = 0;

  for (let i = 5; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[1] || String(row[1]).trim() === '') { skipped++; continue; }
    const nik = String(row[1] || '').trim();
    if (nik.length < 10) { skipped++; continue; }

    const kampung = String(row[8] || '').trim();
    const rt = String(row[9] || '').trim().padStart(3, '0');
    const rw = String(row[10] || '').trim().padStart(3, '0');
    const alamat = `${kampung} RT ${rt}/RW ${rw}`;

    rows.push({
      nik, kk: String(row[2] || '').trim(), nama: String(row[3] || '').trim(),
      tempatLahir: String(row[5] || '').trim(), tanggalLahir: String(row[6] || '').trim(),
      jenisKelamin: String(row[7] || '').trim(), kampung, rt, rw, alamat,
      umur: row[11] ? parseInt(row[11]) : null,
      shdk: String(row[12] || '').trim(), agama: String(row[13] || '').trim(),
      pendidikan: String(row[14] || '').trim(), pekerjaan: String(row[15] || '').trim(),
      ayah: String(row[16] || '').trim(), ibu: String(row[17] || '').trim()
    });
  }

  console.log(`  Penduduk: ${rows.length} records (${skipped} skipped)`);
  return rows;
}

// ==============================
// IMPORT SPPT -> PBB
// ==============================
function importPBB() {
  console.log('Reading SPPT PBB 2026.xlsx...');
  const wb = XLSX.readFile(SPPT_FILE);
  const pbbByNOP = {};

  for (const sheetName of wb.SheetNames) {
    const yearMatch = sheetName.match(/(\d{4})/);
    if (!yearMatch) continue;
    const year = parseInt(yearMatch[1]);

    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    let processed = 0;

    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      let nop, rtRwCode, jumlah, wajibBayar, namaPemilik, nikPemilik, namaSppt, tanggal, namaPenyetor, ket;

      if (year === 2020) {
        nop = String(row[10] || '').trim();
        const rtCol = String(row[3] || '').trim();
        const rwCol = String(row[4] || '').trim();
        rtRwCode = `${rtCol}${rwCol}`;
        namaSppt = String(row[9] || '').trim();
        namaPemilik = namaSppt; nikPemilik = '';
        jumlah = row[12] || 0; wajibBayar = row[13] || 0;
        tanggal = row[14] || null; namaPenyetor = String(row[15] || '').trim();
        ket = String(row[16] || '').trim();
      } else if (year === 2021) {
        nop = String(row[0] || '').trim();
        const rtCol = String(row[5] || '').trim();
        const rwCol = String(row[6] || '').trim();
        rtRwCode = `${rtCol}${rwCol}`;
        namaSppt = String(row[11] || '').trim();
        namaPemilik = namaSppt; nikPemilik = '';
        jumlah = row[19] || 0; wajibBayar = row[20] || 0;
        tanggal = row[21] || null; namaPenyetor = String(row[22] || '').trim();
        ket = String(row[23] || '').trim();
      } else {
        nop = String(row[0] || '').trim();
        rtRwCode = String(row[2] || '').trim();
        jumlah = row[3] || 0; wajibBayar = row[4] || 0;
        namaPemilik = String(row[5] || '').trim(); nikPemilik = String(row[6] || '').trim();
        namaSppt = String(row[7] || '').trim();
        tanggal = row[8] || null; namaPenyetor = String(row[9] || '').trim();
        ket = String(row[10] || '').trim();
      }

      nop = nop.replace(/\s+/g, '');
      if (!nop || nop.length < 10) continue;

      let rt = '00', rw = '00';
      const codeNum = parseInt(rtRwCode);
      if (!isNaN(codeNum) && codeNum > 0) {
        rt = String(Math.floor(codeNum / 10)).padStart(2, '0');
        rw = String(codeNum % 10).padStart(2, '0');
      }

      const statusBayar = (ket || '').toUpperCase();
      let status = 'Belum Bayar';
      if (statusBayar.includes('SUDAH') || statusBayar.includes('BAYAR') || statusBayar === 'LUNAS') status = 'Lunas';
      else if (statusBayar.includes('PENDING') || statusBayar.includes('PROSES')) status = 'Pending';

      const nama = namaPemilik || namaSppt || 'Unknown';

      if (!pbbByNOP[nop]) {
        pbbByNOP[nop] = { nop, nama, nik: nikPemilik || '', rt, rw, payments: {} };
      }

      if (jumlah > 0) {
        pbbByNOP[nop].payments[year] = {
          year, pajak: parseInt(jumlah) || 0, wajibBayar: parseInt(wajibBayar) || 0,
          status, paidAt: tanggal ? String(tanggal) : null,
          namaPenyetor: namaPenyetor || '', keterangan: ket || ''
        };
      }

      if (nama !== 'Unknown') pbbByNOP[nop].nama = nama;
      if (nikPemilik && !pbbByNOP[nop].nik) pbbByNOP[nop].nik = nikPemilik;
      processed++;
    }
  }

  const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const warga = [];
  const records = [];
  let wargaId = 0, recordId = 0;

  for (const nop of Object.keys(pbbByNOP)) {
    const entry = pbbByNOP[nop];
    wargaId++;

    const payments = [];
    for (const year of years) {
      if (entry.payments[year]) {
        payments.push(entry.payments[year]);
      } else {
        payments.push({ year, pajak: 0, wajibBayar: 0, status: 'Belum Bayar', paidAt: null, namaPenyetor: '', keterangan: '' });
      }
    }

    const totalPajak = payments.reduce((s, p) => s + (p.pajak || 0), 0);
    const totalLunas = payments.filter(p => p.status === 'Lunas').reduce((s, p) => s + (p.pajak || 0), 0);
    const totalBelumBayar = payments.filter(p => p.status !== 'Lunas').reduce((s, p) => s + (p.pajak || 0), 0);
    const lunasCount = payments.filter(p => p.status === 'Lunas').length;
    const pendingCount = payments.filter(p => p.status === 'Pending').length;

    let summaryStatus = 'Belum Bayar';
    if (lunasCount === years.length) summaryStatus = 'Lunas';
    else if (pendingCount > 0) summaryStatus = 'Pending';
    else if (lunasCount >= 3) summaryStatus = 'Sebagian';
    else if (lunasCount === 0) summaryStatus = 'Menunggak';

    const rtStr = entry.rt || '00';
    const rwStr = entry.rw || '00';
    const alamat = `RT ${rtStr}/RW ${rwStr}`;

    let dusun = 'dusun1', dusunNama = 'Dusun 01';
    const rwNum = parseInt(rwStr);
    if (rwNum >= 3 && rwNum <= 6) { dusun = 'dusun2'; dusunNama = 'Dusun 02'; }
    else if (rwNum >= 7) { dusun = 'dusun3'; dusunNama = 'Dusun 03'; }

    const pajak2026 = (entry.payments[2026] || {}).pajak || (entry.payments[2025] || {}).pajak || 0;

    warga.push({
      id: wargaId, nik: entry.nik || `PBB${String(wargaId).padStart(10, '0')}`,
      nop: entry.nop, nama: entry.nama, alamat,
      dusun, dusunNama, rw: `rw${rwStr}`, rwNama: `RW ${rwStr}`,
      rt: `rt${rtStr}`, rtNama: `RT ${rtStr}`,
      pajak2026, status: summaryStatus,
      totalPajak, totalLunas, totalBelumBayar,
      paymentsJson: JSON.stringify(payments)
    });

    for (const payment of payments) {
      if (payment.pajak > 0) {
        recordId++;
        records.push({
          id: recordId, nop: entry.nop, nik: entry.nik || '', nama: entry.nama, alamat,
          dusun, dusunNama, rw: `rw${rwStr}`, rwNama: `RW ${rwStr}`,
          rt: `rt${rtStr}`, rtNama: `RT ${rtStr}`,
          year: payment.year, pajak: payment.pajak, wajibBayar: payment.wajibBayar,
          status: payment.status, paidAt: payment.paidAt,
          namaPenyetor: payment.namaPenyetor, keterangan: payment.keterangan
        });
      }
    }
  }

  console.log(`  PBB Warga: ${warga.length} unique NOP`);
  console.log(`  PBB Records: ${records.length} year-records`);
  return { warga, records };
}

// ==============================
// GENERATE SQL
// ==============================
function generateSQL(penduduk, pbbWarga, pbbRecords) {
  const lines = [];
  const BATCH = 500;

  // ====== SCHEMA (CREATE TABLE) ======
  lines.push('-- ============================================');
  lines.push('-- SI-KASKUL Complete Database Dump');
  lines.push('-- Generated: ' + new Date().toISOString().split('T')[0]);
  lines.push('-- Source: MONOGRAFI DESA.xlsx + SPPT PBB 2026.xlsx');
  lines.push('-- Contains: Schema + Data (import this single file)');
  lines.push('-- ============================================');
  lines.push('');
  lines.push('-- NOTE: Create the database first via cPanel, then import this file into it.');
  lines.push('-- CREATE DATABASE IF NOT EXISTS si_kaskul CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
  lines.push('-- USE si_kaskul;');
  lines.push('');
  lines.push('SET NAMES utf8mb4;');
  lines.push('SET FOREIGN_KEY_CHECKS = 0;');
  lines.push('');

  // -- Users
  lines.push('-- ============================================');
  lines.push('-- TABLE: users');
  lines.push('-- ============================================');
  lines.push(`CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  nik VARCHAR(50) UNIQUE,
  rt VARCHAR(100),
  rw VARCHAR(50)
) ENGINE=InnoDB;`);
  lines.push('');

  // -- Penduduk
  lines.push('-- ============================================');
  lines.push('-- TABLE: penduduk');
  lines.push('-- ============================================');
  lines.push(`CREATE TABLE IF NOT EXISTS penduduk (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nik VARCHAR(50) UNIQUE NOT NULL,
  kk VARCHAR(50),
  nama VARCHAR(255) NOT NULL,
  tempatLahir VARCHAR(100),
  tanggalLahir VARCHAR(50),
  jenisKelamin VARCHAR(20),
  kampung VARCHAR(255),
  rt VARCHAR(10),
  rw VARCHAR(10),
  alamat TEXT,
  umur INT,
  shdk VARCHAR(50),
  agama VARCHAR(50),
  pendidikan VARCHAR(100),
  pekerjaan VARCHAR(100),
  ayah VARCHAR(255),
  ibu VARCHAR(255),
  INDEX idx_rt (rt),
  INDEX idx_rw (rw),
  INDEX idx_agama (agama),
  INDEX idx_jk (jenisKelamin),
  INDEX idx_nama (nama)
) ENGINE=InnoDB;`);
  lines.push('');

  // -- PBB Warga
  lines.push('-- ============================================');
  lines.push('-- TABLE: pbb_warga');
  lines.push('-- ============================================');
  lines.push(`CREATE TABLE IF NOT EXISTS pbb_warga (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nik VARCHAR(50),
  nop VARCHAR(100) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  alamat TEXT,
  dusun VARCHAR(50),
  dusunNama VARCHAR(100),
  rw VARCHAR(50),
  rwNama VARCHAR(50),
  rt VARCHAR(50),
  rtNama VARCHAR(50),
  pajak2026 BIGINT DEFAULT 0,
  status VARCHAR(50),
  totalPajak BIGINT DEFAULT 0,
  totalLunas BIGINT DEFAULT 0,
  totalBelumBayar BIGINT DEFAULT 0,
  payments JSON DEFAULT NULL,
  INDEX idx_nop (nop),
  INDEX idx_nik (nik),
  INDEX idx_dusun (dusun),
  INDEX idx_rw (rw),
  INDEX idx_rt (rt),
  INDEX idx_status (status),
  INDEX idx_nama (nama)
) ENGINE=InnoDB;`);
  lines.push('');

  // -- PBB Records
  lines.push('-- ============================================');
  lines.push('-- TABLE: pbb_records');
  lines.push('-- ============================================');
  lines.push(`CREATE TABLE IF NOT EXISTS pbb_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nop VARCHAR(100) NOT NULL,
  nik VARCHAR(50),
  nama VARCHAR(255) NOT NULL,
  alamat TEXT,
  dusun VARCHAR(50),
  dusunNama VARCHAR(100),
  rw VARCHAR(50),
  rwNama VARCHAR(50),
  rt VARCHAR(50),
  rtNama VARCHAR(50),
  year INT NOT NULL,
  pajak BIGINT DEFAULT 0,
  wajibBayar BIGINT DEFAULT 0,
  status VARCHAR(50),
  paidAt VARCHAR(100),
  namaPenyetor VARCHAR(255),
  keterangan TEXT,
  INDEX idx_nop (nop),
  INDEX idx_year (year),
  INDEX idx_status (status),
  INDEX idx_rw (rw),
  INDEX idx_rt (rt)
) ENGINE=InnoDB;`);
  lines.push('');

  // -- Other tables
  lines.push('-- ============================================');
  lines.push('-- TABLE: berita, bansos, pengaduan, approvals, surat, activity_logs');
  lines.push('-- ============================================');
  lines.push(`CREATE TABLE IF NOT EXISTS berita (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  date VARCHAR(50) NOT NULL,
  content TEXT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bansos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  no INT,
  nama VARCHAR(255) NOT NULL,
  alamat TEXT,
  rt VARCHAR(50),
  program VARCHAR(255),
  status VARCHAR(50)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bansos_programs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama VARCHAR(255) NOT NULL,
  sumber VARCHAR(100),
  periode VARCHAR(50),
  kuota INT,
  deskripsi TEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pengaduan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(100),
  type VARCHAR(100),
  message TEXT,
  submittedAt VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'Diterima',
  balasan TEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS approvals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pbbId INT NOT NULL,
  nop VARCHAR(100),
  nama VARCHAR(255),
  approvedBy VARCHAR(255),
  approveStatus VARCHAR(50),
  note TEXT,
  approvedAt VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS surat (
  id INT PRIMARY KEY AUTO_INCREMENT,
  jenis VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  nik VARCHAR(50) NOT NULL,
  alamat TEXT,
  keperluan TEXT,
  status VARCHAR(50) DEFAULT 'Diajukan',
  nomorSurat VARCHAR(100),
  ditandatanganiOleh VARCHAR(255),
  catatan TEXT,
  diajukanPada VARCHAR(100) NOT NULL,
  diprosesPada VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  action VARCHAR(255) NOT NULL,
  userId INT,
  userName VARCHAR(255),
  details TEXT,
  createdAt VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS gangs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama VARCHAR(255) NOT NULL,
  dusun VARCHAR(50),
  dusunNama VARCHAR(100),
  rw VARCHAR(50),
  rwNama VARCHAR(50),
  rt VARCHAR(50),
  rtNama VARCHAR(50),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  bearing INT DEFAULT 0,
  description TEXT,
  INDEX idx_dusun (dusun),
  INDEX idx_rw (rw),
  INDEX idx_rt (rt)
) ENGINE=InnoDB;`);
  lines.push('');

  // ====== DATA (INSERT) ======
  lines.push('-- ============================================');
  lines.push('-- DATA INSERTS');
  lines.push('-- ============================================');
  lines.push('');

  // --- PENDUDUK ---
  lines.push('-- ============================================');
  lines.push(`-- PENDUDUK: ${penduduk.length} records`);
  lines.push('-- ============================================');

  for (let i = 0; i < penduduk.length; i += BATCH) {
    const batch = penduduk.slice(i, i + BATCH);
    lines.push('INSERT INTO penduduk (nik, kk, nama, tempatLahir, tanggalLahir, jenisKelamin, kampung, rt, rw, alamat, umur, shdk, agama, pendidikan, pekerjaan, ayah, ibu) VALUES');
    const vals = batch.map(p => {
      return `(${esc(p.nik)}, ${esc(p.kk)}, ${esc(p.nama)}, ${esc(p.tempatLahir)}, ${esc(p.tanggalLahir)}, ${esc(p.jenisKelamin)}, ${esc(p.kampung)}, ${esc(p.rt)}, ${esc(p.rw)}, ${esc(p.alamat)}, ${escInt(p.umur)}, ${esc(p.shdk)}, ${esc(p.agama)}, ${esc(p.pendidikan)}, ${esc(p.pekerjaan)}, ${esc(p.ayah)}, ${esc(p.ibu)})`;
    });
    lines.push(vals.join(',\n') + ';');
    lines.push('');
  }

  // --- PBB_WARGA ---
  lines.push('-- ============================================');
  lines.push(`-- PBB_WARGA: ${pbbWarga.length} records`);
  lines.push('-- ============================================');
  for (let i = 0; i < pbbWarga.length; i += BATCH) {
    const batch = pbbWarga.slice(i, i + BATCH);
    lines.push('INSERT INTO pbb_warga (nik, nop, nama, alamat, dusun, dusunNama, rw, rwNama, rt, rtNama, pajak2026, status, totalPajak, totalLunas, totalBelumBayar, payments) VALUES');
    const vals = batch.map(w => {
      return `(${esc(w.nik)}, ${esc(w.nop)}, ${esc(w.nama)}, ${esc(w.alamat)}, ${esc(w.dusun)}, ${esc(w.dusunNama)}, ${esc(w.rw)}, ${esc(w.rwNama)}, ${esc(w.rt)}, ${esc(w.rtNama)}, ${escBigInt(w.pajak2026)}, ${esc(w.status)}, ${escBigInt(w.totalPajak)}, ${escBigInt(w.totalLunas)}, ${escBigInt(w.totalBelumBayar)}, ${esc(w.paymentsJson)})`;
    });
    lines.push(vals.join(',\n') + ';');
    lines.push('');
  }

  // --- PBB_RECORDS ---
  lines.push('-- ============================================');
  lines.push(`-- PBB_RECORDS: ${pbbRecords.length} records`);
  lines.push('-- ============================================');
  for (let i = 0; i < pbbRecords.length; i += BATCH) {
    const batch = pbbRecords.slice(i, i + BATCH);
    lines.push('INSERT INTO pbb_records (nop, nik, nama, alamat, dusun, dusunNama, rw, rwNama, rt, rtNama, year, pajak, wajibBayar, status, paidAt, namaPenyetor, keterangan) VALUES');
    const vals = batch.map(r => {
      return `(${esc(r.nop)}, ${esc(r.nik)}, ${esc(r.nama)}, ${esc(r.alamat)}, ${esc(r.dusun)}, ${esc(r.dusunNama)}, ${esc(r.rw)}, ${esc(r.rwNama)}, ${esc(r.rt)}, ${esc(r.rtNama)}, ${r.year}, ${escBigInt(r.pajak)}, ${escBigInt(r.wajibBayar)}, ${esc(r.status)}, ${esc(r.paidAt)}, ${esc(r.namaPenyetor)}, ${esc(r.keterangan)})`;
    });
    lines.push(vals.join(',\n') + ';');
    lines.push('');
  }

  lines.push('SET FOREIGN_KEY_CHECKS = 1;');
  lines.push('');
  lines.push('-- ============================================');
  lines.push('-- SEED DATA');
  lines.push('-- ============================================');
  lines.push('');

  // --- USERS ---
  lines.push('-- Users (admin, rt, kolektor, warga)');
  lines.push(`INSERT INTO users (id, name, email, password, role, nik, rt, rw) VALUES
(1, 'Admin Desa', 'admin@kasomalangkulon.id', 'admin123', 'admin', NULL, NULL, NULL),
(2, 'Kolektor 1', 'kolektor1@kasomalangkulon.id', 'kolektor123', 'kolektor', NULL, 'dusun1/rw1/rt1,rt2,rt3', '01'),
(3, 'Kolektor 2', 'kolektor2@kasomalangkulon.id', 'kolektor123', 'kolektor', NULL, 'dusun1/rw2/rt1,rt2,rt3,rt4', '02'),
(4, 'Ketua RT 1', 'rt1@kasomalangkulon.id', 'rt123', 'rt', NULL, 'dusun1/rw1/rt1', '01'),
(5, 'Ketua RT 2', 'rt2@kasomalangkulon.id', 'rt123', 'rt', NULL, 'dusun1/rw1/rt2', '01'),
(6, 'Ketua RW 1', 'rwk1@kasomalangkulon.id', 'rt123', 'rw', NULL, 'dusun1/rw1', '01'),
(7, 'Warga Demo 1', 'warga1@kasomalangkulon.id', '123456', 'warga', '1234567890123456', NULL, NULL),
(8, 'Warga Demo 2', 'warga2@kasomalangkulon.id', '123456', 'warga', '9876543210987654', NULL, NULL);`);
  lines.push('');

  // --- BERITA ---
  lines.push('-- Berita');
  lines.push(`INSERT INTO berita (id, title, category, date, content) VALUES
(1, 'Pembayaran PBB 2026 Sudah Dibuka', 'pengumuman', '2026-01-15', 'Pembayaran PBB tahun 2026 sudah dapat dilakukan melalui kolektor desa. Silakan hubungi kolektor di wilayah masing-masing.'),
(2, 'Penyaluran BPNT Triwulan I 2026', 'program', '2026-01-10', 'Penyaluran BPNT triwulan I tahun 2026 akan dilaksanakan pada tanggal 20-25 Januari 2026 di Balai Desa.'),
(3, 'Realisasi PBB 2025 Capai 78%', 'pengumuman', '2025-12-30', 'Realisasi pembayaran PBB tahun 2025 mencapai 78% dari total target.');`);
  lines.push('');

  // --- BANSOS PROGRAMS ---
  lines.push('-- Bansos Programs');
  lines.push(`INSERT INTO bansos_programs (id, nama, sumber, periode, kuota, deskripsi) VALUES
(1, 'PKH', 'APBN', '2026', 85, 'Program Keluarga Harapan'),
(2, 'BPNT', 'APBN', '2026', 120, 'Bantuan Pangan Non Tunai'),
(3, 'BLT Dana Desa', 'APBDes', '2026', 65, 'Bantuan Langsung Tunai Dana Desa');`);
  lines.push('');

  // --- GANGS ---
  lines.push('-- Gangs (28 gangs across 3 dusun)');
  const gangs = [
    [1,'Gang Anggur','dusun1','Dusun 1','rw01','RW 01','rt01','RT 01',-6.8498,108.1512,45,'Gang dekat Masjid Al-Ikhlas'],
    [2,'Gang Mangga','dusun1','Dusun 1','rw01','RW 01','rt01','RT 01',-6.8502,108.1518,90,'Gang dekat Balai Desa'],
    [3,'Gang Durian','dusun1','Dusun 1','rw01','RW 01','rt02','RT 02',-6.8508,108.1505,180,'Gang dekat SDN Kasomalang'],
    [4,'Gang Rambutan','dusun1','Dusun 1','rw01','RW 01','rt02','RT 02',-6.8515,108.1522,270,'Gang dekat lapangan voli'],
    [5,'Gang Jeruk','dusun1','Dusun 1','rw01','RW 01','rt03','RT 03',-6.8522,108.1498,135,'Gang dekat pos ronda'],
    [6,'Gang Apel','dusun1','Dusun 1','rw02','RW 02','rt01','RT 01',-6.8485,108.1535,0,'Gang dekat warung Bu Neng'],
    [7,'Gang Pisang','dusun1','Dusun 1','rw02','RW 02','rt01','RT 01',-6.8492,108.1542,60,'Gang dekat mushola'],
    [8,'Gang Nangka','dusun1','Dusun 1','rw02','RW 02','rt02','RT 02',-6.8478,108.1528,120,'Gang dekat sumur umum'],
    [9,'Gang Salak','dusun1','Dusun 1','rw02','RW 02','rt03','RT 03',-6.8472,108.1555,200,'Gang dekat taman bermain'],
    [10,'Gang Sawo','dusun1','Dusun 1','rw02','RW 02','rt04','RT 04',-6.8465,108.1548,300,'Gang dekat kandang sapi'],
    [11,'Gang Melati','dusun2','Dusun 2','rw01','RW 01','rt01','RT 01',-6.8535,108.1485,30,'Gang dekat pabrik tahu'],
    [12,'Gang Mawar','dusun2','Dusun 2','rw01','RW 01','rt01','RT 01',-6.8542,108.1478,150,'Gang dekat bengkel Pak Asep'],
    [13,'Gang Dahlia','dusun2','Dusun 2','rw01','RW 01','rt02','RT 02',-6.8548,108.1492,210,'Gang dekat kolam ikan'],
    [14,'Gang Kenanga','dusun2','Dusun 2','rw01','RW 01','rt02','RT 02',-6.8555,108.1472,330,'Gang dekat rumah Pak RT'],
    [15,'Gang Cempaka','dusun2','Dusun 2','rw02','RW 02','rt01','RT 01',-6.8562,108.1505,75,'Gang dekat toko kelontong'],
    [16,'Gang Flamboyan','dusun2','Dusun 2','rw02','RW 02','rt01','RT 01',-6.8568,108.1512,195,'Gang dekat sekolah PAUD'],
    [17,'Gang Bougenville','dusun2','Dusun 2','rw02','RW 02','rt02','RT 02',-6.8575,108.1498,285,'Gang dekat lapangan basket'],
    [18,'Gang Teratai','dusun3','Dusun 3','rw01','RW 01','rt01','RT 01',-6.8582,108.1525,15,'Gang dekat sawah'],
    [19,'Gang Tulip','dusun3','Dusun 3','rw01','RW 01','rt01','RT 01',-6.8588,108.1532,105,'Gang dekat sungai kecil'],
    [20,'Gang Lily','dusun3','Dusun 3','rw01','RW 01','rt02','RT 02',-6.8595,108.1518,225,'Gang dekat kebun sayur'],
    [21,'Gang Matahari','dusun3','Dusun 3','rw01','RW 01','rt02','RT 02',-6.8602,108.1542,315,'Gang dekat pos kamling'],
    [22,'Gang Aster','dusun3','Dusun 3','rw01','RW 01','rt03','RT 03',-6.8608,108.1528,50,'Gang dekat kandang ayam'],
    [23,'Gang Lavender','dusun3','Dusun 3','rw02','RW 02','rt01','RT 01',-6.8615,108.1555,170,'Gang dekat hutan bambu'],
    [24,'Gang Orchid','dusun3','Dusun 3','rw02','RW 02','rt01','RT 01',-6.8622,108.1548,250,'Gang dekat embung desa'],
    [25,'Gang Sakura','dusun3','Dusun 3','rw02','RW 02','rt02','RT 02',-6.8628,108.1562,340,'Gang dekat gazebo'],
    [26,'Gang Lotus','dusun3','Dusun 3','rw02','RW 02','rt02','RT 02',-6.8635,108.1552,80,'Gang dekat tempat pembakaran sampah'],
    [27,'Gang Kamboja','dusun3','Dusun 3','rw02','RW 02','rt03','RT 03',-6.8642,108.1572,160,'Gang dekat makam desa'],
    [28,'Gang Sedap Malam','dusun3','Dusun 3','rw02','RW 02','rt03','RT 03',-6.8648,108.1565,290,'Gang dekat warung kopi'],
  ];
  lines.push('INSERT INTO gangs (id, nama, dusun, dusunNama, rw, rwNama, rt, rtNama, lat, lng, bearing, description) VALUES');
  const gangVals = gangs.map(g => `(${g[0]}, ${esc(g[1])}, ${esc(g[2])}, ${esc(g[3])}, ${esc(g[4])}, ${esc(g[5])}, ${esc(g[6])}, ${esc(g[7])}, ${g[8]}, ${g[9]}, ${g[10]}, ${esc(g[11])})`);
  lines.push(gangVals.join(',\n') + ';');
  lines.push('');

  return lines.join('\n');
}

// ==============================
// MAIN
// ==============================
function main() {
  console.log('=== SI-KASKUL SQL Dump Generator ===\n');

  const penduduk = importPenduduk();
  const { warga, records } = importPBB();

  console.log('\nGenerating SQL dump...');
  const sql = generateSQL(penduduk, warga, records);

  fs.writeFileSync(OUTPUT_FILE, sql, 'utf8');
  const sizeMB = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2);

  console.log(`\n================================`);
  console.log(`SQL dump saved to: ${OUTPUT_FILE}`);
  console.log(`File size: ${sizeMB} MB`);
  console.log(`\nSummary:`);
  console.log(`  penduduk:    ${penduduk.length} rows`);
  console.log(`  pbb_warga:   ${warga.length} rows`);
  console.log(`  pbb_records: ${records.length} rows`);
  console.log(`  gangs:       28 rows`);
  console.log(`  users:       8 rows`);
  console.log(`  berita:      3 rows`);
  console.log(`  bansos_prog: 3 rows`);
  console.log(`\nUpload this file to your cloud hosting MySQL (via phpMyAdmin or CLI).`);
}

main();
