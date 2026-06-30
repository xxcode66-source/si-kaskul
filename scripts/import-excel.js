/**
 * Import Excel data into SI-KASKUL database
 * - MONOGRAFI DESA.xlsx -> penduduk (resident) database
 * - SPPT PBB 2026.xlsx -> PBB (property tax) database with 7 year sheets (2020-2026)
 * 
 * Usage: node scripts/import-excel.js
 */

const XLSX = require('../backend/node_modules/xlsx');
const fs = require('fs');
const path = require('path');

// ==============================
// CONFIGURATION
// ==============================
const MONOGRAFI_FILE = path.join(__dirname, '..', 'MONOGRAFI DESA.xlsx');
const SPPT_FILE = path.join(__dirname, '..', 'SPPT PBB 2026.xlsx');
const OUTPUT_FILE = path.join(__dirname, '..', 'backend', 'imported-data.json');

// ==============================
// MONOGRAFI -> PENDUDUK
// ==============================
function importMonografi() {
    console.log('\n📋 Importing MONOGRAFI DESA.xlsx...');
    
    if (!fs.existsSync(MONOGRAFI_FILE)) {
        console.error('❌ File not found:', MONOGRAFI_FILE);
        return [];
    }

    const wb = XLSX.readFile(MONOGRAFI_FILE);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // Headers in rows 3-4 (0-indexed):
    // Row 3: NO, NIK, KK, NAMA LENGKAP, null, TEMPAT TGL LAHIR, null, JK, ALAMAT(KAMPUNG), null(RT), null(RW), UMUR, SHDK, AGAMA, PENDIDIKAN, PEKERJAAN, AYAH, IBU
    // Row 4: sub-headers KAMPUNG, RT, RW
    // Data starts row 5
    
    const penduduk = [];
    let skipped = 0;

    for (let i = 5; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[1] || String(row[1]).trim() === '') { skipped++; continue; }

        const nik = String(row[1] || '').trim();
        if (nik.length < 10) { skipped++; continue; }

        penduduk.push({
            id: penduduk.length + 1,
            nik: nik,
            kk: String(row[2] || '').trim(),
            nama: String(row[3] || '').trim(),
            tempatLahir: String(row[5] || '').trim(),
            tanggalLahir: String(row[6] || '').trim(),
            jenisKelamin: String(row[7] || '').trim(),
            kampung: String(row[8] || '').trim(),
            rt: String(row[9] || '').trim().padStart(3, '0'),
            rw: String(row[10] || '').trim().padStart(3, '0'),
            umur: row[11] ? parseInt(row[11]) : null,
            shdk: String(row[12] || '').trim(),
            agama: String(row[13] || '').trim(),
            pendidikan: String(row[14] || '').trim(),
            pekerjaan: String(row[15] || '').trim(),
            ayah: String(row[16] || '').trim(),
            ibu: String(row[17] || '').trim()
        });
    }

    // Set alamat
    penduduk.forEach(p => { p.alamat = `${p.kampung} RT ${p.rt}/RW ${p.rw}`; });

    console.log(`✅ Penduduk imported: ${penduduk.length} records (${skipped} skipped)`);
    return penduduk;
}

// ==============================
// SPPT PBB -> PBB DATABASE
// ==============================
function importSPPT() {
    console.log('\n📋 Importing SPPT PBB 2026.xlsx...');
    
    if (!fs.existsSync(SPPT_FILE)) {
        console.error('❌ File not found:', SPPT_FILE);
        return { warga: [], pbb: [] };
    }

    const wb = XLSX.readFile(SPPT_FILE);
    console.log(`   Sheets found: ${wb.SheetNames.join(', ')}`);

    const pbbByNOP = {};

    for (const sheetName of wb.SheetNames) {
        const yearMatch = sheetName.match(/(\d{4})/);
        if (!yearMatch) continue;
        const year = parseInt(yearMatch[1]);
        
        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        console.log(`\n   📄 Processing sheet: ${sheetName} (${data.length - 2} rows)`);
        
        let processed = 0, skipped = 0;

        for (let i = 2; i < data.length; i++) {
            const row = data[i];
            if (!row) { skipped++; continue; }

            let nop, rtRwCode, jumlah, wajibBayar, namaPemilik, nikPemilik, namaSppt, tanggal, namaPenyetor, ket;

            if (year === 2020) {
                // 2020: NO, PEMOHON..., RT(col3), RW(col4), BGN, TANAH, LUAS, null, NAMA SPPT(col9), NOP(col10), ...JUMLAH(col12), WAJIB(col13), TGL(col14), PENYETOR(col15), KET(col16)
                nop = String(row[10] || '').trim();
                const rtCol = String(row[3] || '').trim();
                const rwCol = String(row[4] || '').trim();
                rtRwCode = `${rtCol}${rwCol}`;
                namaSppt = String(row[9] || '').trim();
                namaPemilik = namaSppt;
                nikPemilik = '';
                jumlah = row[12] || 0;
                wajibBayar = row[13] || 0;
                tanggal = row[14] || null;
                namaPenyetor = String(row[15] || '').trim();
                ket = String(row[16] || '').trim();
            } else if (year === 2021) {
                // 2021: NOP(col0), NO, PEMOHON..., RT(col5), RW(col6), BGN, TANAH, LUAS, null, NAMA SPPT(col11), NOP2(col12), ..., JUMLAH(col19), WAJIB(col20), TGL(col21), PENYETOR(col22), KET(col23)
                nop = String(row[0] || '').trim();
                const rtCol = String(row[5] || '').trim();
                const rwCol = String(row[6] || '').trim();
                rtRwCode = `${rtCol}${rwCol}`;
                namaSppt = String(row[11] || '').trim();
                namaPemilik = namaSppt;
                nikPemilik = '';
                jumlah = row[19] || 0;
                wajibBayar = row[20] || 0;
                tanggal = row[21] || null;
                namaPenyetor = String(row[22] || '').trim();
                ket = String(row[23] || '').trim();
            } else {
                nop = String(row[0] || '').trim();
                rtRwCode = String(row[2] || '').trim();
                jumlah = row[3] || 0;
                wajibBayar = row[4] || 0;
                namaPemilik = String(row[5] || '').trim();
                nikPemilik = String(row[6] || '').trim();
                namaSppt = String(row[7] || '').trim();
                tanggal = row[8] || null;
                namaPenyetor = String(row[9] || '').trim();
                ket = String(row[10] || '').trim();
            }

            nop = nop.replace(/\s+/g, '');
            if (!nop || nop.length < 10) { skipped++; continue; }

            // Parse RT/RW
            let rt = '00', rw = '00';
            const codeNum = parseInt(rtRwCode);
            if (!isNaN(codeNum) && codeNum > 0) {
                rt = String(Math.floor(codeNum / 10)).padStart(2, '0');
                rw = String(codeNum % 10).padStart(2, '0');
            }

            // Status
            const statusBayar = (ket || '').toUpperCase();
            let status = 'Belum Bayar';
            if (statusBayar.includes('SUDAH') || statusBayar.includes('BAYAR') || statusBayar === 'LUNAS') {
                status = 'Lunas';
            } else if (statusBayar.includes('PENDING') || statusBayar.includes('PROSES')) {
                status = 'Pending';
            }

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
        
        console.log(`   ✅ ${sheetName}: ${processed} processed, ${skipped} skipped`);
    }

    // Build warga and pbb arrays
    const warga = [];
    const pbb = [];
    let wargaId = 0, pbbId = 0;
    const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

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
            pajak: pajak2026, status: summaryStatus,
            totalPajak, totalLunas, totalBelumBayar, payments
        });

        for (const payment of payments) {
            if (payment.pajak > 0) {
                pbbId++;
                pbb.push({
                    id: pbbId, nop: entry.nop, nik: entry.nik || '', nama: entry.nama, alamat,
                    dusun, dusunNama, rw: `rw${rwStr}`, rwNama: `RW ${rwStr}`,
                    rt: `rt${rtStr}`, rtNama: `RT ${rtStr}`,
                    year: payment.year, pajak: payment.pajak, status: payment.status,
                    payments: [payment], proofs: []
                });
            }
        }
    }

    console.log(`\n✅ PBB Warga: ${warga.length} unique NOP`);
    console.log(`✅ PBB Records: ${pbb.length} year-records`);
    return { warga, pbb };
}

// ==============================
// MAIN
// ==============================
function main() {
    console.log('🚀 SI-KASKUL Excel Import Tool');
    console.log('================================\n');

    const penduduk = importMonografi();
    const { warga, pbb } = importSPPT();

    const importedData = { penduduk, warga, pbb };
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(importedData, null, 2));
    
    console.log('\n================================');
    console.log(`💾 Data saved to: ${OUTPUT_FILE}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Penduduk: ${penduduk.length} records`);
    console.log(`   PBB Warga: ${warga.length} unique taxpayers`);
    console.log(`   PBB Records: ${pbb.length} year-records`);
    
    if (penduduk.length > 0) {
        const rtSet = new Set(penduduk.map(p => `${p.rt}/${p.rw}`));
        console.log(`   Unique RT/RW combinations: ${rtSet.size}`);
        const lk = penduduk.filter(p => p.jenisKelamin === 'LAKI-LAKI').length;
        const pr = penduduk.filter(p => p.jenisKelamin === 'PEREMPUAN').length;
        console.log(`   Laki-laki: ${lk}, Perempuan: ${pr}`);
    }
    
    if (warga.length > 0) {
        const l = warga.filter(w => w.status === 'Lunas').length;
        const s = warga.filter(w => w.status === 'Sebagian').length;
        const m = warga.filter(w => w.status === 'Menunggak').length;
        console.log(`   PBB Status - Lunas: ${l}, Sebagian: ${s}, Menunggak: ${m}`);
    }
    
    console.log('\n✅ Import complete!');
}

main();
