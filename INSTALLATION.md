# 📦 Installation Guide - SI-KASKUL

Panduan instalasi lengkap untuk Sistem Informasi Desa Kasomalang Kulon

## Prerequisites (Prasyarat)

### Required Software
- **Node.js** v14.0.0 atau lebih tinggi
  - Download: https://nodejs.org/
  - Check: `node --version`
  
- **npm** (biasanya included dengan Node.js)
  - Check: `npm --version`
  
- **Git** (optional, untuk version control)
  - Download: https://git-scm.com/
  - Check: `git --version`

- **Code Editor** (VS Code recommended)
  - Download: https://code.visualstudio.com/

- **Browser Modern**
  - Chrome, Firefox, Safari, atau Edge

## 🛠️ Installation Steps

### 1. Persiapan Project

#### Clone Repository (Jika menggunakan Git)
```bash
git clone https://github.com/xxcode66-source/si-kaskul.git
cd si-kaskul
```

#### Atau Extract File ZIP
```bash
# Extract file si-kaskul.zip
# Buka folder si-kaskul di terminal/command prompt
cd /path/to/si-kaskul
```

### 2. Frontend Setup

#### Method 1: Menggunakan Python HTTP Server (Recommended)
```bash
# Python 3
python -m http.server 8000

# atau Python 2
python -m SimpleHTTPServer 8000
```

Akses: http://localhost:8000

#### Method 2: Menggunakan Live Server VS Code
1. Install extension "Live Server" di VS Code
2. Klik kanan di `index.html`
3. Pilih "Open with Live Server"
4. Browser otomatis buka di http://localhost:5500

#### Method 3: Menggunakan Node.js HTTP Server
```bash
npm install -g http-server
http-server -p 8000
```

Akses: http://localhost:8000

### 3. Backend Setup

#### Step 1: Navigate to Backend Folder
```bash
cd backend
```

#### Step 2: Install Dependencies
```bash
npm install
```

Expected output:
```
npm WARN deprecated warning-messages...
added 50 packages, and audited 51 packages in 5s
found 0 vulnerabilities
```

#### Step 3: Create Environment File (Optional)
File `.env` sudah ada dengan isi:
```
PORT=3000
NODE_ENV=development
```

Jika perlu ubah port:
```
PORT=3001
NODE_ENV=development
```

#### Step 4: Start Backend Server
```bash
# Using npm start (node)
npm start

# Or using nodemon for development (auto-reload)
npm install -g nodemon
nodemon app.js

# Or using npm run dev (if configured in package.json)
npm run dev
```

Expected output:
```
✅ Backend API Desa Kasomalang Kulon berjalan di http://localhost:3000
📚 API Documentation:
   - GET  /api/health                 (Health check)
   - POST /api/auth/admin-login       (Admin login)
   ...
```

### 4. Verify Installation

#### Test Frontend
```
Open browser: http://localhost:8000
Check:
- Homepage loads correctly
- Navigation works
- Links to pages work (gallery, berita, etc.)
```

#### Test Backend
```bash
# Method 1: Browser
http://localhost:3000/api/health

# Method 2: cURL
curl http://localhost:3000/api/health

# Expected response:
{"success": true, "message": "API Backend Desa Kasomalang Kulon - Running OK"}
```

#### Test Full Integration
1. Go to http://localhost:8000/pages/login.html
2. Try login with credentials:
   - Email: `admin@kasomalangkulon.id`
   - Password: `admin123`
3. Should navigate to admin dashboard
4. Check browser console for any errors

## 🚀 Automated Startup

### Windows
```bash
# Double-click file ini atau jalankan di Command Prompt:
start-backend.bat
```

### Linux / MacOS
```bash
# Jalankan di terminal:
bash start-backend.sh

# Atau
chmod +x start-backend.sh
./start-backend.sh
```

## 📋 Folder Structure Verification

Setelah instalasi, struktur folder seharusnya seperti ini:

```
si-kaskul/
├── admin/
│   └── dashboard.html           ✓
├── assets/
│   ├── script.js                ✓
│   └── style.css                ✓
├── backend/
│   ├── node_modules/            ✓ (setelah npm install)
│   ├── package.json             ✓
│   ├── package-lock.json        ✓ (auto-generated)
│   ├── app.js                   ✓
│   └── .env                     ✓
├── pages/
│   ├── gallery.html             ✓
│   ├── berita.html              ✓
│   ├── bansos.html              ✓
│   ├── pbb.html                 ✓
│   └── login.html               ✓
├── index.html                   ✓
├── README.md                    ✓
├── QUICK_START.md               ✓
├── INSTALLATION.md              ✓ (this file)
├── start-backend.bat            ✓
├── start-backend.sh             ✓
└── .gitignore                   ✓
```

## 🔧 Troubleshooting

### Port Already in Use

#### Port 8000 (Frontend)
```bash
# Windows: Find process using port 8000
netstat -ano | findstr :8000

# Linux/Mac: Find process using port 8000
lsof -i :8000

# Kill process or use different port
python -m http.server 9000
```

#### Port 3000 (Backend)
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>

# Atau ubah port di backend/.env
PORT=3001
```

### npm install Failed

```bash
# Clear npm cache
npm cache clean --force

# Try install again
npm install

# Jika masih gagal, gunakan yarn (alternative package manager)
npm install -g yarn
cd backend
yarn install
```

### Node.js Not Found

```bash
# Check if Node.js installed
node --version

# If not installed, download from https://nodejs.org/
# After installation, verify:
node --version
npm --version
```

### CORS Error di Frontend

Jika mendapat error seperti:
```
Access to XMLHttpRequest at 'http://localhost:3000/...' 
from origin 'http://localhost:8000' has been blocked by CORS policy
```

Solution:
1. Pastikan backend sudah running di port 3000
2. Backend sudah include CORS middleware (sudah included di app.js)
3. Check browser console untuk detail error

### Page Not Loading

```
1. Check if frontend server is running
2. Check browser console (F12) for JavaScript errors
3. Check network tab for 404 errors
4. Check if file paths are correct
5. Try refresh browser (Ctrl+F5 or Cmd+Shift+R)
```

## 📱 Testing Checklist

Setelah instalasi, test fitur-fitur berikut:

- [ ] Homepage loads correctly
- [ ] Navigation menus work
- [ ] Berita page loads
- [ ] Galeri page loads with images
- [ ] PBB dashboard shows correctly
- [ ] Bansos table displays data
- [ ] Search functionality works (Berita)
- [ ] Filter functionality works (Galeri, Bansos)
- [ ] Login form submits
- [ ] Admin dashboard loads (after login)
- [ ] Loading spinner appears
- [ ] Responsive on mobile
- [ ] All animations smooth
- [ ] API endpoints respond correctly

## 🔐 Security Notes

### Development Only
Saat development:
- Demo credentials hard-coded
- No database encryption
- CORS allows all origins

### Before Production
Sebelum go to production:
- [ ] Setup real database
- [ ] Encrypt sensitive data
- [ ] Use environment variables
- [ ] Setup HTTPS
- [ ] Implement proper authentication
- [ ] Add rate limiting
- [ ] Setup backup system
- [ ] Configure firewall
- [ ] Use reverse proxy (Nginx)
- [ ] Enable CORS properly

## 📞 Getting Help

### Common Issues
1. **Check QUICK_START.md** untuk quick troubleshooting
2. **Check README.md** untuk dokumentasi lengkap
3. **Check API_DOCUMENTATION.md** untuk API details

### Useful Commands
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# List installed packages
npm list

# Update npm
npm install -g npm@latest

# Update Node.js
# Download dari https://nodejs.org/

# Check port usage (Windows)
netstat -ano | findstr :3000

# Check port usage (Linux/Mac)
lsof -i :3000
```

## 🎉 Next Steps

Setelah instalasi berhasil:

1. **Explore the application**
   - Kunjungi semua halaman
   - Test semua fitur
   - Check responsiveness

2. **Customize data**
   - Edit data sample di halaman
   - Connect ke real database (optional)
   - Upload actual images

3. **Configure for production**
   - Setup web server
   - Configure domain
   - Setup SSL/HTTPS
   - Setup CI/CD pipeline

4. **Deploy**
   - Frontend ke web hosting
   - Backend ke server
   - Configure database
   - Setup monitoring

---

**Installation completed successfully! 🎉**

For questions or issues, refer to the main README.md or QUICK_START.md

**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** ✅ Production Ready
