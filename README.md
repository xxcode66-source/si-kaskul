# 📋 Sistem Informasi Desa Kasomalang Kulon (SI-KASKUL)

Sebuah platform digital terintegrasi untuk meningkatkan pelayanan dan transparansi informasi di Desa Kasomalang Kulon.

## 🎯 Fitur Utama

### Frontend
- **Halaman Beranda** - Informasi umum dan statistik desa
- **Halaman Berita** - Publikasi berita dan pengumuman dengan filter kategori
- **Halaman Galeri** - Galeri foto dengan berbagai kategori dan filter
- **Dashboard PBB** - Informasi Pajak Bumi dan Bangunan dengan pencarian NOP
- **Dashboard Bansos** - Data penerima bantuan sosial dengan filter RT
- **Sistem Login** - Login untuk Admin dan Penduduk
- **Loading Animation** - Animasi loading indah di setiap halaman

### Backend API
- REST API dengan Node.js/Express
- Authentication endpoints untuk Admin dan Penduduk
- CRUD operations untuk Berita, PBB, dan Bansos
- Dashboard statistics endpoints
- CORS enabled untuk development

### Admin Dashboard
- Dashboard overview dengan statistik lengkap
- Kelola Berita (Create, Read, Update, Delete)
- Kelola PBB (View data)
- Kelola Bansos (View data)
- Sistem logout yang aman

## 📁 Struktur Folder

```
si-kaskul/
├── index.html                 # Halaman beranda utama
├── assets/
│   ├── style.css             # CSS global dan styling
│   └── script.js             # JavaScript global dan utilities
├── pages/
│   ├── gallery.html          # Halaman galeri
│   ├── berita.html           # Halaman berita
│   ├── bansos.html           # Halaman bantuan sosial
│   ├── pbb.html              # Halaman pajak bumi bangunan
│   └── login.html            # Halaman login
├── admin/
│   └── dashboard.html        # Dashboard admin
├── backend/
│   ├── package.json          # Node.js dependencies
│   ├── app.js                # Main backend server
│   └── .env                  # Environment variables
└── README.md                 # Dokumentasi ini
```

## 🚀 Cara Instalasi & Menjalankan

### Prerequisites
- Node.js v14 atau lebih tinggi
- npm atau yarn package manager
- Browser modern (Chrome, Firefox, Safari, Edge)

### Setup Frontend

1. **Clone atau buka project ini**
```bash
cd si-kaskul
```

2. **Jalankan server lokal untuk frontend**
   - Gunakan Live Server di VS Code, atau
   - Jalankan Python server:
```bash
python -m http.server 8000
# atau
python3 -m http.server 8000
```

3. **Buka di browser**
```
http://localhost:8000
```

### Setup Backend

1. **Install dependencies backend**
```bash
cd backend
npm install
```

2. **Jalankan backend server**
```bash
npm start
# atau untuk development dengan nodemon
npm run dev
```

Backend akan berjalan di `http://localhost:3000`

## 🔐 Kredensial Login Demo

### Admin Login
- **Email:** admin@kasomalangkulon.id
- **Password:** admin123

### Penduduk Login
- **NIK:** 1234567890123456
- **Password:** 123456

## 📊 API Endpoints

### Authentication
- `POST /api/auth/admin-login` - Login admin
- `POST /api/auth/user-login` - Login penduduk

### Berita
- `GET /api/berita` - Dapatkan semua berita
- `GET /api/berita/:id` - Dapatkan berita spesifik
- `POST /api/berita` - Buat berita baru
- `PUT /api/berita/:id` - Update berita
- `DELETE /api/berita/:id` - Hapus berita

### PBB
- `GET /api/pbb` - Dapatkan semua data PBB
- `POST /api/pbb/check` - Cek data PBB berdasarkan NOP

### Bansos
- `GET /api/bansos` - Dapatkan semua data bansos
- `GET /api/bansos/rt/:rt` - Dapatkan bansos berdasarkan RT

### Dashboard
- `GET /api/dashboard/stats` - Dapatkan statistik dashboard
- `GET /api/health` - Health check API

## 🎨 Fitur UI/UX

### Loading Animation
- Spinner animation smooth
- Page loader dengan message
- Transition animations yang halus

### Responsive Design
- Mobile-first approach
- Breakpoints untuk tablet dan desktop
- Navigation yang responsive

### Animasi
- Stagger animations untuk list items
- Hover effects untuk cards
- Smooth transitions di semua elemen
- Scroll animations dengan intersection observer

## 🔧 Kustomisasi

### Mengubah Warna Tema
Edit file `assets/style.css`:
```css
:root {
    --primary: #10b981;        /* Warna hijau */
    --primary-dark: #059669;
    --primary-light: #d1fae5;
}
```

### Menambah Halaman Baru
1. Buat file `.html` di folder `pages/`
2. Ikuti template yang ada
3. Import `assets/style.css` dan `assets/script.js`
4. Update navigation di semua halaman

### Mengubah Data Sample
Data sample ada di dalam JavaScript di setiap halaman. Untuk production, ganti dengan API calls ke backend.

## 📱 Penggunaan Halaman

### Halaman Beranda (index.html)
- Menampilkan statistik desa
- Quick links ke berbagai layanan
- Informasi profil desa

### Halaman Berita (pages/berita.html)
- Tampilkan berita dengan kategori
- Search dan filter berita
- Pagination untuk navigasi
- Featured news section

### Halaman Galeri (pages/gallery.html)
- Gallery grid dengan hover effect
- Filter berdasarkan kategori
- Lightbox untuk preview gambar
- Smooth animations

### Halaman PBB (pages/pbb.html)
- Dashboard PBB dengan statistik
- Form pencarian NOP
- Tabel data PBB
- Informasi cara pembayaran

### Halaman Bansos (pages/bansos.html)
- Tabel penerima bansos
- Filter berdasarkan RT
- Badge untuk status program
- Statistik bansos

### Login (pages/login.html)
- Tab untuk Admin dan Penduduk
- Form dengan password visibility toggle
- Demo credentials info
- Secure logout

### Dashboard Admin (admin/dashboard.html)
- Overview statistik
- Kelola berita CRUD
- View PBB dan Bansos
- Responsive sidebar navigation

## 🔄 Alur Kerja

### User Flow
1. User membuka halaman beranda
2. Explore berita, galeri, dan informasi
3. Cek data PBB dengan NOP
4. Lihat data bansos sesuai RT
5. Login jika perlu akses lebih

### Admin Flow
1. Login dengan kredensial admin
2. Dashboard menampilkan overview
3. Kelola berita (tambah, edit, hapus)
4. Monitor PBB dan Bansos
5. Logout untuk security

## 🚀 Production Deployment

### Frontend
1. Build untuk production (minify assets)
2. Deploy ke web server (Apache, Nginx, etc.)
3. Configure domain
4. Setup HTTPS

### Backend
1. Setup database (MongoDB, PostgreSQL, MySQL)
2. Migrate dari sample data ke real database
3. Setup environment variables
4. Deploy ke server (Heroku, DigitalOcean, AWS, etc.)
5. Configure API endpoints untuk frontend

## 📞 Support & Contact

- **Email:** info@kasomalangkulon.id
- **Telepon:** (021) 2234 5678
- **Alamat:** Desa Kasomalang Kulon, Jawa Barat

## 📄 Lisensi

MIT License - bebas untuk digunakan dan dimodifikasi

## 👨‍💻 Dibuat oleh

xxcode66-source - 2024

---

**Status:** ✅ Beta Release - Siap untuk testing dan production deployment