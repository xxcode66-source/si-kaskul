# 🚀 Quick Start Guide - SI-KASKUL

Panduan cepat untuk menjalankan Sistem Informasi Desa Kasomalang Kulon

## ⚡ Startup Cepat (3 Langkah)

### Windows
1. **Double-click** file `start-backend.bat`
2. Backend akan berjalan di `http://localhost:3000`
3. Frontend akses di `http://localhost:8000` (atau gunakan Live Server)

### Linux / MacOS
1. Buka terminal dan jalankan:
```bash
bash start-backend.sh
```
2. Backend akan berjalan di `http://localhost:3000`
3. Frontend akses di `http://localhost:8000` (atau gunakan Live Server)

## 📂 Setup Manual

### Frontend Setup
```bash
# Option 1: Python HTTP Server
python -m http.server 8000
# atau
python3 -m http.server 8000

# Option 2: Node.js HTTP Server
npx http-server -p 8000

# Option 3: Gunakan Live Server di VS Code
# Klik kanan pada index.html → Open with Live Server
```

Akses di: `http://localhost:8000`

### Backend Setup
```bash
cd backend
npm install
npm start
```

Backend URL: `http://localhost:3000`

## 🔐 Demo Credentials

### Admin Login
- **Email:** `admin@kasomalangkulon.id`
- **Password:** `admin123`
- **Akses:** Dashboard di `/admin/dashboard.html`

### Penduduk Login
- **NIK:** `1234567890123456`
- **Password:** `123456`
- **Akses:** Portal penduduk

## 🧭 Navigasi Website

### Halaman Publik
- **[Beranda](http://localhost:8000/)** - Info desa dan statistik
- **[Berita](http://localhost:8000/pages/berita.html)** - Publikasi dan pengumuman
- **[Galeri](http://localhost:8000/pages/gallery.html)** - Foto kegiatan
- **[PBB](http://localhost:8000/pages/pbb.html)** - Pajak bumi bangunan
- **[Bansos](http://localhost:8000/pages/bansos.html)** - Bantuan sosial
- **[Login](http://localhost:8000/pages/login.html)** - Akses admin dan penduduk

### Admin Area
- **[Dashboard Admin](http://localhost:8000/admin/dashboard.html)** - Management system

## 📋 Troubleshooting

### Backend tidak berjalan
```bash
# Cek apakah Node.js sudah terinstall
node --version

# Cek apakah npm sudah terinstall
npm install

# Cek port 3000 sudah digunakan
# Windows: netstat -ano | findstr :3000
# Linux/Mac: lsof -i :3000

# Ubah port di backend/.env jika needed
PORT=3001
```

### Frontend tidak tampil
```bash
# Pastikan sudah di direktori root project
cd si-kaskul

# Gunakan Live Server atau HTTP Server
npx http-server -p 8000
```

### CORS Error
Jika mendapat CORS error di frontend:
1. Pastikan backend sudah running di port 3000
2. Cek di browser console untuk error detail
3. Lihat backend logs untuk informasi lebih detail

## 📱 Testing

### Test API dengan Browser
```
http://localhost:3000/api/health
http://localhost:3000/api/berita
http://localhost:3000/api/pbb
http://localhost:3000/api/bansos
```

### Test dengan cURL
```bash
# Health check
curl http://localhost:3000/api/health

# Get all news
curl http://localhost:3000/api/berita

# Admin login
curl -X POST http://localhost:3000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kasomalangkulon.id","password":"admin123"}'
```

## 🎯 Fitur Testing Checklist

- [ ] Homepage load dengan baik
- [ ] Berita bisa di-filter dan di-search
- [ ] Galeri bisa di-filter dan zoom
- [ ] PBB search bekerja
- [ ] Bansos filter bekerja
- [ ] Admin login berhasil
- [ ] Dashboard admin bisa menambah berita
- [ ] Loading animation tampil
- [ ] Responsive di mobile
- [ ] Semua link berfungsi

## 🔧 Development Tips

### Mengubah data sample
Edit data di:
- Berita: `pages/berita.html` (line ~240)
- Galeri: `pages/gallery.html` (line ~125)
- Bansos: `pages/bansos.html` (line ~158)
- PBB: `pages/pbb.html` (line ~400)

### Mengubah styling
Edit `assets/style.css` untuk global styles
Edit inline styles di masing-masing halaman

### Adding new pages
1. Buat file HTML baru di `pages/`
2. Copy struktur dari halaman existing
3. Update navigation di semua halaman
4. Update backend API jika diperlukan

## 📞 Need Help?

Lihat dokumentasi lengkap di [README.md](../README.md)

---

**Last Updated:** 2024
**Status:** ✅ Ready for development
