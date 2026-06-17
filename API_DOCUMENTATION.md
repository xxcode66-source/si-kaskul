# 📚 API Documentation - SI-KASKUL

Dokumentasi lengkap untuk REST API Sistem Informasi Desa Kasomalang Kulon

## Base URL
```
http://localhost:3000/api
```

## Headers
Semua request harus include header:
```
Content-Type: application/json
```

## Response Format
Semua response menggunakan format:
```json
{
  "success": true/false,
  "data": {},
  "message": "..."
}
```

---

## 🔐 Authentication Endpoints

### 1. Admin Login
**Endpoint:** `POST /api/auth/admin-login`

**Request Body:**
```json
{
  "email": "admin@kasomalangkulon.id",
  "password": "admin123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "admin_token_1234567890",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@kasomalangkulon.id",
    "role": "admin"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Email atau password salah"
}
```

---

### 2. Penduduk Login
**Endpoint:** `POST /api/auth/user-login`

**Request Body:**
```json
{
  "nik": "1234567890123456",
  "password": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "user_token_1234567890",
  "user": {
    "id": 2,
    "name": "Budi Santoso",
    "nik": "1234567890123456",
    "role": "user"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "NIK atau password salah"
}
```

---

## 📰 Berita Endpoints

### 1. Get All News
**Endpoint:** `GET /api/berita`

**Query Parameters:**
- `category` (optional): Filter by category (pengumuman, program, acara, edukasi)
- `limit` (optional): Limit results
- `page` (optional): Pagination

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Program Pelatihan Kewirausahaan",
      "category": "program",
      "date": "2024-01-15",
      "content": "Desa Kasomalang Kulon mengadakan program pelatihan..."
    }
  ]
}
```

### 2. Get News by ID
**Endpoint:** `GET /api/berita/:id`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Program Pelatihan Kewirausahaan",
    "category": "program",
    "date": "2024-01-15",
    "content": "Desa Kasomalang Kulon mengadakan program pelatihan..."
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Berita tidak ditemukan"
}
```

### 3. Create News
**Endpoint:** `POST /api/berita`

**Headers:** Include auth token
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Judul Berita",
  "category": "program",
  "content": "Isi berita lengkap..."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "title": "Judul Berita",
    "category": "program",
    "date": "2024-01-20",
    "content": "Isi berita lengkap..."
  }
}
```

### 4. Update News
**Endpoint:** `PUT /api/berita/:id`

**Request Body:**
```json
{
  "title": "Judul Berita Diubah",
  "category": "acara",
  "content": "Isi berita yang sudah diupdate..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Judul Berita Diubah",
    "category": "acara",
    "date": "2024-01-15",
    "content": "Isi berita yang sudah diupdate..."
  }
}
```

### 5. Delete News
**Endpoint:** `DELETE /api/berita/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "Berita dihapus",
  "data": {
    "id": 1,
    "title": "Program Pelatihan Kewirausahaan",
    "category": "program",
    "date": "2024-01-15"
  }
}
```

---

## 🏠 PBB Endpoints

### 1. Get All PBB Data
**Endpoint:** `GET /api/pbb`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nop": "1234567890123456",
      "nama": "Budi Santoso",
      "alamat": "Jl. Raya No. 12",
      "pajak": 500000,
      "status": "Lunas"
    }
  ]
}
```

### 2. Check PBB Data
**Endpoint:** `POST /api/pbb/check`

**Request Body:**
```json
{
  "nop": "1234567890123456",
  "nama": "Budi Santoso"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "nop": "1234567890123456",
    "nama": "Budi Santoso",
    "alamat": "Jl. Raya No. 12",
    "pajak": 500000,
    "status": "Lunas"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Data PBB tidak ditemukan"
}
```

---

## 🤝 Bansos Endpoints

### 1. Get All Bansos Data
**Endpoint:** `GET /api/bansos`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "no": 1,
      "nama": "Siti Nurhaliza",
      "alamat": "Jl. Raya No. 12",
      "rt": "01/01",
      "program": "PKH + BPNT",
      "status": "Aktif"
    }
  ]
}
```

### 2. Get Bansos by RT
**Endpoint:** `GET /api/bansos/rt/:rt`

**Parameters:**
- `rt`: RT code (contoh: 01 untuk RT 1)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "no": 1,
      "nama": "Siti Nurhaliza",
      "alamat": "Jl. Raya No. 12",
      "rt": "01/01",
      "program": "PKH + BPNT",
      "status": "Aktif"
    },
    {
      "id": 2,
      "no": 2,
      "nama": "Ahmad Sutisna",
      "alamat": "Jl. Raya No. 15",
      "rt": "01/01",
      "program": "BPNT",
      "status": "Aktif"
    }
  ]
}
```

---

## 📊 Dashboard Endpoints

### 1. Get Dashboard Statistics
**Endpoint:** `GET /api/dashboard/stats`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalPenduduk": 3245,
    "totalKK": 856,
    "totalRW": 4,
    "totalBerita": 9,
    "totalPBB": 856,
    "totalBansos": 156,
    "totalPajakTerkumpul": 2500000000,
    "tingkatPembayaranPBB": 87,
    "pajakMenunggak": 111
  }
}
```

---

## ❤️ Health Check

### API Health Status
**Endpoint:** `GET /api/health`

**Response (200):**
```json
{
  "success": true,
  "message": "API Backend Desa Kasomalang Kulon - Running OK"
}
```

---

## 🧪 Testing dengan cURL

### Test Health
```bash
curl http://localhost:3000/api/health
```

### Get All News
```bash
curl http://localhost:3000/api/berita
```

### Admin Login
```bash
curl -X POST http://localhost:3000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kasomalangkulon.id","password":"admin123"}'
```

### Create News (Requires Token)
```bash
curl -X POST http://localhost:3000/api/berita \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Berita Baru","category":"program","content":"Konten berita..."}'
```

### Check PBB
```bash
curl -X POST http://localhost:3000/api/pbb/check \
  -H "Content-Type: application/json" \
  -d '{"nop":"1234567890123456","nama":"Budi Santoso"}'
```

### Get Bansos by RT
```bash
curl http://localhost:3000/api/bansos/rt/01
```

---

## 📋 Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Authentication failed |
| 404 | Not Found - Resource tidak ditemukan |
| 500 | Internal Server Error - Server error |

---

## 🔄 Error Handling

Semua error response mengikuti format:
```json
{
  "success": false,
  "message": "Deskripsi error"
}
```

### Common Errors
- `Email atau password salah` - Invalid credentials
- `NIK atau password salah` - Invalid NIK or password
- `Berita tidak ditemukan` - News not found
- `Data PBB tidak ditemukan` - PBB data not found
- `Endpoint tidak ditemukan` - Invalid endpoint

---

## 🔐 Authentication

Untuk endpoint yang memerlukan authentication:
1. Login menggunakan `/api/auth/admin-login` atau `/api/auth/user-login`
2. Ambil token dari response
3. Include token di header: `Authorization: Bearer <token>`

Contoh:
```bash
curl -H "Authorization: Bearer admin_token_1234567890" \
  http://localhost:3000/api/berita
```

---

## 📈 Rate Limiting

Currently no rate limiting. Dalam production, implement:
- API rate limiting (requests per minute)
- User-based rate limiting
- IP-based rate limiting

---

## 🔜 Future Enhancements

- [ ] Pagination for list endpoints
- [ ] Search filters for news
- [ ] Image upload endpoints
- [ ] Comment system for news
- [ ] Rating system for services
- [ ] Advanced filtering for PBB dan Bansos
- [ ] Export data to PDF/Excel
- [ ] Notification system
- [ ] Real-time updates dengan WebSocket

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-20 | Initial release |

---

**API Status:** ✅ Active  
**Last Updated:** 2024-01-20  
**Maintained by:** xxcode66-source
