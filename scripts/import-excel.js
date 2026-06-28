#!/usr/bin/env node
/**
 * SI-KASKUL Excel Import Script
 * 
 * Usage:
 *   node import-excel.js --penduduk data-penduduk.xlsx --pbb data-pbb.xlsx
 * 
 * This script reads Excel files and imports data into MySQL.
 * 
 * Untuk jalanin, install dulu: npm install xlsx mysql2
 */

const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// ==============================
// CONFIG — edit sesuai data lo
// ==============================
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'si_kaskul',
};

const TAHUN_PBB = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
const LOKASI_DUSUN = {
  // Mapping NOP range to dusun — LO SESUAIKAN
  defaultDusun: 'dusun1',
  defaultDusunNama: 'Dusun 01',
};

// ==============================
// HELPERS
// ==============================
function cleanNIK(val) {
  if (!val) return '';
  let s = String(val).trim();
  // Remove non-digit characters (Rp, dots, spaces)
  s = s.replace(/[^0-9]/g, '');
  // Pad with leading zeros if needed (NIK is 16 digits)
  while (s.length < 16) s = '0' + s;
  return s;
}

function cleanNOP(val) {
  if (!val) return '';
  let s = String(val).trim();
  // Remove spaces, standardize format
  s = s.replace(/\s+/g, '.');
  return s;
}

function cleanRupiah(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  let s = String(val).trim();
  s = s.replace(/[^0-9]/g, '');
  return parseInt(s) || 0;
}

function mapHeader(header) {
  const map = {
    'nik': 'nik', 'n i k': 'nik', 'no induk': 'nik',
    'nop': 'nop', 'no objek pajak': 'nop',
    'nama': 'nama', 'nama wp': 'nama', 'nama wajib pajak': 'nama', 'nama penduduk': 'nama',
    'alamat': 'alamat', 'alamat wp': 'alamat', 'alamat objek pajak': 'alamat', 'alamat op': 'alamat',
    'rt': 'rt', 'r t': 'rt',
    'rw': 'rw', 'r w': 'rw',
    'dusun': 'dusun', 'kampung': 'dusun', 'lingkungan': 'dusun',
    'pajak': 'pajak', 'jumlah': 'pajak', 'nominal': 'pajak', 'besar pajak': 'pajak', 'pbb': 'pajak', 'jumlah pbb': 'pajak',
    'tahun': 'year', 'tahun pajak': 'year', 'thn': 'year',
    'status': 'status', 'ket': 'status', 'keterangan': 'status',
  };
  const key = header.toLowerCase().trim();
  return map[key] || key;
}

// ==============================
// IMPORT PENDUDUK
// ==============================
async function importPenduduk(filePath, conn) {
  console.log(`\n📄 Membaca file penduduk: ${filePath}`);
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  console.log(`   Ditemukan ${data.length} baris data`);
  
  let imported = 0, skipped = 0;
  for (const row of data) {
    try {
      const nik = cleanNIK(row['NIK'] || row['nik'] || row['Nik'] || '');
      const nama = (row['NAMA'] || row['nama'] || row['Nama'] || '').trim();
      
      if (!nik || !nama) { skipped++; continue; }
      
      const alamat = (row['ALAMAT'] || row['alamat'] || row['Alamat'] || '').trim();
      const rt = String(row['RT'] || row['rt'] || '').trim();
      const rw = String(row['RW'] || row['rw'] || '').trim();

      await conn.query(
        'INSERT INTO penduduk (nik, nama, alamat, rt, rw) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nama=VALUES(nama), alamat=VALUES(alamat), rt=VALUES(rt), rw=VALUES(rw)',
        [nik, nama, alamat, rt, rw]
      );
      imported++;
    } catch (e) {
      console.error(`   ⚠️  Gagal import baris: ${e.message}`);
      skipped++;
    }
  }
  console.log(`   ✅ ${imported} diimport, ${skipped} dilewati`);
  return imported;
}

// ==============================
// IMPORT PBB
// ==============================
async function importPBB(filePath, conn) {
  console.log(`\n📄 Membaca file PBB: ${filePath}`);
  const wb = XLSX.readFile(filePath);
  
  let totalWarga = 0;
  let totalPayments = 0;

  for (const sheetName of wb.SheetNames) {
    // Try to determine year from sheet name
    let year = null;
    for (const y of TAHUN_PBB) {
      if (sheetName.includes(String(y))) { year = y; break; }
    }
    console.log(`   📋 Sheet: "${sheetName}" ${year ? `→ Tahun ${year}` : '(tahun tidak terdeteksi, coba import sebagai data biasa)'}`);

    const sheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    console.log(`      ${data.length} baris`);

    for (const row of data) {
      const nop = cleanNOP(row['NOP'] || row['nop'] || row['No Objek Pajak'] || '');
      const nik = cleanNIK(row['NIK'] || row['nik'] || '');
      const nama = (row['NAMA'] || row['nama'] || row['Nama WP'] || row['Nama Wajib Pajak'] || '').trim();
      const alamat = (row['ALAMAT'] || row['alamat'] || row['Alamat OP'] || '').trim();
      const rt = String(row['RT'] || row['rt'] || '').trim();
      const rw = String(row['RW'] || row['rw'] || '').trim();
      const dusun = (row['DUSUN'] || row['dusun'] || row['Kampung'] || LOKASI_DUSUN.defaultDusunNama).trim();
      
      // Pajak - bisa dari kolom spesifik atau kolom 'PAJAK'
      const pajak = cleanRupiah(row['PAJAK'] || row['pajak'] || row['Jumlah'] || row['PBB'] || '');
      const status = (row['STATUS'] || row['status'] || row['Ket'] || (pajak > 0 ? 'Belum Bayar' : 'Lunas')).trim();

      if (!nop || !nama) continue;

      // Insert into pbb table
      const rwNum = rw.replace(/[^0-9]/g, '');
      const rtNum = rt.replace(/[^0-9]/g, '');
      
      await conn.query(
        `INSERT INTO pbb (nop, nik, nama, alamat, dusun, dusunNama, rw, rwNama, rt, rtNama, year, pajak, status, payments, proofs)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '[]')
         ON DUPLICATE KEY UPDATE status=VALUES(status), pajak=VALUES(pajak)`,
        [
          nop, nik, nama, alamat,
          dusun.toLowerCase().replace(/\s+/g, ''),
          dusun,
          `rw${rwNum}`, `RW ${rwNum}`,
          `rt${rtNum}`, `RT ${rtNum}`,
          year || 2026, pajak, status
        ]
      );
      totalPayments++;
    }
    totalWarga += data.length;
  }

  console.log(`   ✅ ${totalPayments} data PBB diimport`);
  return totalPayments;
}

// ==============================
// BUILD WARGA FROM PBB DATA
// ==============================
async function buildWarga(conn) {
  console.log('\n🔨 Membangun data warga dari data PBB...');
  
  // Aggregate per NOP
  const [rows] = await conn.query(`
    SELECT nop, nik, nama, alamat, dusun, dusunNama, rw, rwNama, rt, rtNama,
           JSON_ARRAYAGG(JSON_OBJECT('year', year, 'pajak', pajak, 'status', status)) AS payments_raw,
           SUM(pajak) AS total_pajak
    FROM pbb
    GROUP BY nop
  `);

  let imported = 0;
  for (const row of rows) {
    const payments = JSON.parse(row.payments_raw);
    const totalLunas = payments.filter(p => p.status === 'Lunas').reduce((s, p) => s + p.pajak, 0);
    const totalBelum = payments.filter(p => p.status !== 'Lunas').reduce((s, p) => s + p.pajak, 0);
    const lunasCount = payments.filter(p => p.status === 'Lunas').length;
    let status = 'Belum Bayar';
    if (lunasCount === payments.length) status = 'Lunas';
    else if (payments.some(p => p.status === 'Pending')) status = 'Pending';
    else if (lunasCount >= 3) status = 'Sebagian';
    else status = 'Menunggak';

    const nik = row.nik || `AUTO${String(imported).padStart(10, '0')}`;

    await conn.query(
      `INSERT INTO warga (nik, nop, nama, alamat, dusun, dusunNama, rw, rwNama, rt, rtNama, pajak, status, totalPajak, totalLunas, totalBelumBayar, payments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nama=VALUES(nama), status=VALUES(status), payments=VALUES(payments)`,
      [nik, row.nop, row.nama, row.alamat, row.dusun, row.dusunNama, row.rw, row.rwNama, row.rt, row.rtNama,
       payments.reduce((s,p) => s + p.pajak, 0) / payments.length, status,
       row.total_pajak, totalLunas, totalBelum, JSON.stringify(payments)]
    );
    imported++;
  }

  console.log(`   ✅ ${imported} warga dibuat`);
  return imported;
}

// ==============================
// MAIN
// ==============================
async function main() {
  console.log('╔══════════════════════════════════╗');
  console.log('║   SI-KASKUL Excel Import Tool    ║');
  console.log('╚══════════════════════════════════╝');

  const args = process.argv.slice(2);
  const pendudukFile = args.includes('--penduduk') ? args[args.indexOf('--penduduk') + 1] : null;
  const pbbFile = args.includes('--pbb') ? args[args.indexOf('--pbb') + 1] : null;

  if (!pendudukFile && !pbbFile) {
    console.log('\nGunakan:');
    console.log('  node import-excel.js --penduduk data-penduduk.xlsx --pbb data-pbb.xlsx');
    console.log('\nAtau:');
    console.log('  node import-excel.js --penduduk data-penduduk.xlsx');
    console.log('  node import-excel.js --pbb data-pbb.xlsx');
    process.exit(1);
  }

  // Cek file exists
  for (const f of [pendudukFile, pbbFile].filter(Boolean)) {
    if (!fs.existsSync(f)) {
      console.error(`❌ File tidak ditemukan: ${f}`);
      process.exit(1);
    }
  }

  console.log(`\n🔌 Koneksi ke MySQL: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('   ✅ Terhubung');

  if (pendudukFile) {
    await importPenduduk(pendudukFile, conn);
  }

  if (pbbFile) {
    const count = await importPBB(pbbFile, conn);
    if (count > 0) {
      await buildWarga(conn);
    }
  }

  console.log('\n✅ Import selesai!');
  await conn.end();
}

main().catch(e => {
  console.error('\n❌ Error:', e.message);
  process.exit(1);
});