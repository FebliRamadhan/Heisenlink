# Product Requirements Document (PRD)

## Heisenlink — Platform Shortlink & Bio Page

**Versi**: 1.0
**Tanggal**: 11 April 2026
**Status**: Implemented (v1.0)

---

## 1. Ringkasan Produk

Heisenlink adalah platform self-hosted untuk manajemen shortlink (pemendek URL) dan bio page (halaman profil link), dibangun untuk kebutuhan internal organisasi. Platform ini menyediakan kemampuan pembuatan shortlink kustom, halaman bio bergaya Linktree, analitik klik, dan panel administrasi terpusat, dengan dukungan autentikasi LDAP/Active Directory untuk integrasi enterprise.

### 1.1 Tujuan Produk

- Menyediakan layanan pemendek URL yang di-host secara mandiri (self-hosted) untuk kebutuhan internal organisasi
- Memberikan setiap pengguna kemampuan membuat bio page (halaman kumpulan link) publik yang bisa di-share
- Menyediakan analitik klik secara real-time untuk mengukur performa setiap link
- Memungkinkan admin mengelola pengguna, link, dan audit log secara terpusat

### 1.2 Target Pengguna

| Persona | Deskripsi |
|---------|-----------|
| **Pengguna Internal** | Pegawai organisasi yang perlu membuat shortlink untuk berbagi URL internal/eksternal dan mempunyai bio page |
| **Admin** | Administrator sistem yang mengelola pengguna, memantau aktivitas, dan mengelola semua link |

---

## 2. Arsitektur Teknis

### 2.1 Technology Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js (Express.js), JavaScript (ESM) |
| Database | PostgreSQL (via Prisma ORM) |
| Cache | Redis (via ioredis) |
| Auth | JWT (access + refresh token) + LDAP/Active Directory |
| State Management | Zustand (auth), TanStack React Query (server state) |

### 2.2 Arsitektur Sistem

```
┌────────────────────┐         ┌────────────────────┐
│   Next.js Frontend │ ──────> │  Express Backend   │
│   (Port 3000)      │ /api/*  │  (Port 4000)       │
│   TypeScript       │ proxy   │  JavaScript (ESM)  │
└────────────────────┘         └──────┬───────┬─────┘
                                      │       │
                               ┌──────┘       └──────┐
                               v                      v
                        ┌─────────────┐       ┌──────────────┐
                        │ PostgreSQL  │       │    Redis     │
                        │ (Database)  │       │   (Cache)    │
                        └─────────────┘       └──────────────┘
```

Frontend berkomunikasi ke backend melalui proxy rewrites (`next.config.js`), sehingga semua request `/api/*` diteruskan ke Express server.

### 2.3 Data Model

```
User (1) ──── (*) ShortLink ──── (*) ClickEvent
  │
  └── (1) BioPage ──── (*) BioLink ──── (*) ClickEvent
  │
  └── (*) AuditLog
```

**Entitas utama:**

- **User** — Pengguna platform (username, email, role ADMIN/USER, status aktif, integrasi LDAP)
- **ShortLink** — Link pendek (code/alias, destination URL, scheduling, password, confirmation page, click count)
- **BioPage** — Halaman bio per user (slug, title, bio, avatar, theme, social links, publish status)
- **BioLink** — Item link di dalam bio page (title, URL, icon, position, visibility, click count)
- **ClickEvent** — Record analitik per klik (IP, user-agent, referrer, device/browser/OS, timestamp)
- **AuditLog** — Log audit untuk setiap aksi penting (action, entity, old/new values, IP)

---

## 3. Fitur & Functional Requirements

### 3.1 Autentikasi & Otorisasi

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| AUTH-01 | Login dengan username & password (local credentials) | P0 |
| AUTH-02 | Login melalui LDAP/Active Directory (jika LDAP_ENABLED=true) | P0 |
| AUTH-03 | Auto-create user lokal dari data LDAP saat pertama kali login | P0 |
| AUTH-04 | JWT access token (default: 24h) + refresh token (default: 7d) | P0 |
| AUTH-05 | Auto-refresh token ketika access token expired (interceptor di frontend) | P0 |
| AUTH-06 | Logout (hapus token di client) | P0 |
| AUTH-07 | Role-based access: USER dan ADMIN | P0 |
| AUTH-08 | Update password (verifikasi password lama terlebih dahulu) | P1 |
| AUTH-09 | Rate limiting pada endpoint login (5 request/menit per IP) | P0 |

**Alur Login LDAP:**
1. User memasukkan username dan password
2. Sistem mencoba autentikasi ke LDAP server
3. Jika berhasil, cari/buat user lokal di database
4. Jika LDAP gagal, fallback ke autentikasi lokal
5. Generate JWT tokens dan kembalikan ke client

### 3.2 Manajemen Shortlink

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| LINK-01 | Buat shortlink dengan auto-generate code (nanoid) | P0 |
| LINK-02 | Buat shortlink dengan custom alias (3-50 karakter alfanumerik, hyphen, underscore) | P0 |
| LINK-03 | Validasi alias tidak menggunakan reserved words (api, admin, auth, bio, dsb.) | P0 |
| LINK-04 | Validasi dan sanitasi destination URL | P0 |
| LINK-05 | Daftar shortlink milik user dengan pagination, search, dan sorting | P0 |
| LINK-06 | Update shortlink (URL, title, status, scheduling, password, confirmation) | P0 |
| LINK-07 | Hapus shortlink | P0 |
| LINK-08 | Password protection untuk shortlink | P1 |
| LINK-09 | Scheduling: `startsAt` (link belum aktif sampai tanggal tertentu) | P1 |
| LINK-10 | Scheduling: `expiresAt` (link expired setelah tanggal tertentu) | P1 |
| LINK-11 | Confirmation page (showConfirmation) — tampilkan preview sebelum redirect | P1 |
| LINK-12 | Toggle aktif/nonaktif link (`isActive`) | P0 |
| LINK-13 | Bulk create shortlinks (array of link data) | P2 |
| LINK-14 | Export shortlinks milik user sebagai CSV atau JSON | P1 |
| LINK-15 | Rate limiting pada pembuatan link (30 request/menit per IP) | P0 |

**Alur Redirect:**
1. User mengakses `/{code}`
2. Sistem cek Redis cache, jika miss query database
3. Validasi: link aktif? belum expired? sudah mulai?
4. Jika password-protected → return 401 dengan prompt password
5. Jika ada confirmation page → return data link untuk preview
6. Track click event secara async (tidak blocking redirect)
7. Increment click count
8. HTTP 302 redirect ke destination URL

### 3.3 QR Code

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| QR-01 | Generate QR code untuk setiap shortlink | P1 |
| QR-02 | Format output: PNG (buffer), SVG (string), Data URL | P1 |
| QR-03 | Konfigurasi: ukuran, margin, warna, error correction level | P2 |
| QR-04 | Generate QR code untuk bio page | P2 |

### 3.4 Bio Page

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| BIO-01 | Setiap user memiliki 1 bio page (auto-create saat pertama kali akses) | P0 |
| BIO-02 | Bio page slug default dari username, bisa diubah (unik) | P0 |
| BIO-03 | Edit: title, bio text, avatar (upload), social links (JSON) | P0 |
| BIO-04 | Publish/unpublish bio page | P0 |
| BIO-05 | 13 tema tersedia: Light, Dark, Gradient, Ocean, Sunset, Forest, Midnight, Rose, Neon, Minimal, Aurora, Candy, Corporate | P0 |
| BIO-06 | CRUD bio links (title, URL, icon) di dalam bio page | P0 |
| BIO-07 | Reorder bio links via drag-and-drop (position-based) | P1 |
| BIO-08 | Toggle visibility per bio link (`isVisible`) | P1 |
| BIO-09 | Track click per bio link | P0 |
| BIO-10 | Bio page publik diakses via `/bio/{slug}` (tanpa login) | P0 |
| BIO-11 | Cache bio page di Redis (TTL: 5 menit) | P1 |

### 3.5 Analitik

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| ANA-01 | Track setiap klik: IP, user-agent, referrer, device, browser, OS, timestamp | P0 |
| ANA-02 | User-agent parsing otomatis (ua-parser-js) | P0 |
| ANA-03 | Overview dashboard per user: total links, total clicks, shortlink vs bio clicks | P0 |
| ANA-04 | Grafik clicks by day (30 hari terakhir) | P0 |
| ANA-05 | Top 5 performing links (berdasarkan click count) | P1 |
| ANA-06 | Breakdown: device type, browser, OS, referrer | P1 |
| ANA-07 | Date range filter (from, to) pada semua analitik | P1 |
| ANA-08 | Analitik per link individual: total clicks, unique visitors (by IP), breakdowns | P1 |
| ANA-09 | Analitik tidak boleh blocking redirect (async tracking, fire-and-forget) | P0 |

### 3.6 Admin Panel

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| ADM-01 | Lihat daftar semua user (pagination, search, filter by role/status) | P0 |
| ADM-02 | Update status user (aktifkan/deaktifkan) — tidak bisa deaktifkan diri sendiri | P0 |
| ADM-03 | Update role user (USER ↔ ADMIN) | P0 |
| ADM-04 | Lihat semua shortlinks dari semua user (pagination, search, filter by user) | P0 |
| ADM-05 | Hapus shortlink milik user manapun | P0 |
| ADM-06 | Lihat semua bio pages (pagination, search) | P1 |
| ADM-07 | Global analytics overview (semua user): total users, active users, total links, total bio pages, total clicks, clicks by day, top links, top users by links | P0 |
| ADM-08 | Audit logs: lihat semua log dengan pagination, filter by user/action/entity/date | P0 |
| ADM-09 | Export links sebagai CSV/JSON (admin bisa filter by user) | P1 |
| ADM-10 | Export audit logs sebagai CSV/JSON (filter by action/entity/date, max 10.000 records) | P1 |

### 3.7 Audit Logging

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| AUD-01 | Log setiap login user (termasuk IP dan user-agent) | P0 |
| AUD-02 | Log perubahan status/role user oleh admin | P0 |
| AUD-03 | Log penghapusan link oleh admin | P0 |
| AUD-04 | Simpan old values dan new values untuk setiap perubahan | P1 |
| AUD-05 | Audit log tidak boleh gagalkan operasi utama (fire-and-forget) | P0 |

---

## 4. Non-Functional Requirements

### 4.1 Performa

| ID | Requirement |
|----|-------------|
| PERF-01 | Redirect shortlink harus < 200ms (P99) dengan Redis cache hit |
| PERF-02 | Redis cache untuk shortlink (TTL: 1 jam) dan bio page (TTL: 5 menit) |
| PERF-03 | Cache invalidation otomatis saat link/bio diupdate atau dihapus |
| PERF-04 | Analitik tracking secara async, tidak blocking response |

### 4.2 Keamanan

| ID | Requirement |
|----|-------------|
| SEC-01 | Helmet middleware untuk security headers |
| SEC-02 | CORS dibatasi hanya domain yang diizinkan di production |
| SEC-03 | Rate limiting per endpoint (Redis-backed): API 100/min, Auth 5/min, Create Link 30/min, Redirect 200/min |
| SEC-04 | Password di-hash menggunakan bcrypt |
| SEC-05 | URL sanitization sebelum disimpan |
| SEC-06 | Request body validation menggunakan Zod schemas |
| SEC-07 | JWT token di-sign dengan secret, refresh token terpisah |
| SEC-08 | Rate limiter graceful degradation (allow request jika Redis down) |

### 4.3 Reliability

| ID | Requirement |
|----|-------------|
| REL-01 | Health check endpoint: `/health` (basic) dan `/health/ready` (DB + Redis) |
| REL-02 | Graceful shutdown: tutup HTTP server, disconnect DB, disconnect Redis |
| REL-03 | Force shutdown timeout 10 detik jika graceful gagal |
| REL-04 | Logging menggunakan Winston (file + console) |

### 4.4 Deployment

| ID | Requirement |
|----|-------------|
| DEP-01 | Docker Compose untuk development (app + PostgreSQL 16 + Redis 7) |
| DEP-02 | Docker Compose untuk production |
| DEP-03 | Next.js standalone output untuk production build |
| DEP-04 | Prisma Studio tersedia sebagai Docker profile `tools` (port 5555) |
| DEP-05 | Support environment-based configuration (.env) |

---

## 5. API Endpoints

### 5.1 Auth (`/api/auth`)

| Method | Path | Deskripsi | Auth |
|--------|------|-----------|------|
| POST | `/login` | Login (username + password) | Public |
| POST | `/refresh` | Refresh access token | Public |
| POST | `/logout` | Logout | Private |
| GET | `/me` | Get current user profile | Private |
| PATCH | `/password` | Update password | Private |

### 5.2 Links (`/api/links`)

| Method | Path | Deskripsi | Auth |
|--------|------|-----------|------|
| GET | `/` | Daftar shortlinks (pagination, search, sort) | Private |
| POST | `/` | Buat shortlink baru | Private |
| POST | `/bulk` | Bulk create shortlinks | Private |
| GET | `/export` | Export links sebagai CSV/JSON | Private |
| GET | `/:id` | Detail shortlink | Private |
| PATCH | `/:id` | Update shortlink | Private |
| DELETE | `/:id` | Hapus shortlink | Private |
| GET | `/:id/qr` | Generate QR code | Private |
| POST | `/:id/verify-password` | Verifikasi password link | Private |

### 5.3 Bio (`/api/bio`)

| Method | Path | Deskripsi | Auth |
|--------|------|-----------|------|
| GET | `/` | Get/create bio page user | Private |
| PATCH | `/` | Update bio page | Private |
| POST | `/avatar` | Upload avatar | Private |
| POST | `/links` | Tambah bio link | Private |
| PATCH | `/links/:id` | Update bio link | Private |
| DELETE | `/links/:id` | Hapus bio link | Private |
| PUT | `/links/reorder` | Reorder bio links | Private |

### 5.4 Analytics (`/api/analytics`)

| Method | Path | Deskripsi | Auth |
|--------|------|-----------|------|
| GET | `/overview` | Overview analitik user | Private |
| GET | `/links/:id` | Analitik per link | Private |

### 5.5 Admin (`/api/admin`)

| Method | Path | Deskripsi | Auth |
|--------|------|-----------|------|
| GET | `/users` | Daftar semua user | Admin |
| PATCH | `/users/:id` | Update user (status/role) | Admin |
| GET | `/links` | Daftar semua link | Admin |
| GET | `/links/export` | Export semua link | Admin |
| DELETE | `/links/:id` | Hapus link manapun | Admin |
| GET | `/bio` | Daftar semua bio pages | Admin |
| GET | `/analytics` | Global analytics | Admin |
| GET | `/audit-logs` | Audit logs | Admin |
| GET | `/audit-logs/export` | Export audit logs | Admin |

### 5.6 Public Routes

| Method | Path | Deskripsi | Auth |
|--------|------|-----------|------|
| GET | `/:code` | Redirect shortlink | Public |
| GET | `/:code/resolve` | Resolve link tanpa redirect | Public |
| POST | `/:code/verify` | Verifikasi password dan redirect | Public |
| GET | `/bio/:slug` | Bio page publik (frontend render) | Public |

---

## 6. Halaman Frontend

### 6.1 Publik

| Route | Deskripsi |
|-------|-----------|
| `/` | Landing page |
| `/(auth)/login` | Halaman login |
| `/[slug]` | Resolusi shortlink / bio page |
| `/not-found` | Link tidak ditemukan |
| `/link-expired` | Link sudah expired |
| `/link-inactive` | Link nonaktif |
| `/forbidden` | Akses ditolak |
| `/too-many-requests` | Rate limit exceeded |

### 6.2 Dashboard (Authenticated)

| Route | Deskripsi |
|-------|-----------|
| `/(dashboard)/dashboard` | Dashboard utama (overview) |
| `/(dashboard)/dashboard/links` | Manajemen shortlinks |
| `/(dashboard)/dashboard/links/new` | Buat shortlink baru |
| `/(dashboard)/dashboard/bio` | Manajemen bio page |
| `/(dashboard)/dashboard/analytics` | Analitik user |
| `/(dashboard)/dashboard/settings` | Pengaturan akun |

### 6.3 Admin Dashboard

| Route | Deskripsi |
|-------|-----------|
| `/(dashboard)/admin` | Admin overview |
| `/(dashboard)/admin/users` | Manajemen user |
| `/(dashboard)/admin/users/[id]` | Detail user |
| `/(dashboard)/admin/links` | Semua shortlinks |
| `/(dashboard)/admin/analytics` | Global analytics |
| `/(dashboard)/admin/logs` | Audit logs |

---

## 7. Konfigurasi Lingkungan

| Variable | Deskripsi | Default |
|----------|-----------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Port Express server | `3000` |
| `APP_URL` | Base URL aplikasi | `http://localhost:3000` |
| `SHORTLINK_DOMAIN` | Domain untuk shortlink | `http://localhost:3000` |
| `BIO_DOMAIN` | Domain untuk bio page | `http://localhost:3000/bio` |
| `DATABASE_URL` | Connection string PostgreSQL | — (required) |
| `REDIS_URL` | Connection string Redis | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key untuk JWT | — (harus diganti di production) |
| `JWT_EXPIRES_IN` | Masa berlaku access token | `24h` |
| `JWT_REFRESH_EXPIRES_IN` | Masa berlaku refresh token | `7d` |
| `LDAP_ENABLED` | Aktifkan autentikasi LDAP | `false` |
| `LDAP_URL` | URL LDAP server | `ldap://localhost:389` |
| `LDAP_BIND_DN` | Bind DN untuk LDAP | — |
| `LDAP_BIND_PASSWORD` | Bind password untuk LDAP | — |
| `LDAP_SEARCH_BASE` | Search base LDAP | — |
| `LDAP_SEARCH_FILTER` | Filter pencarian LDAP | `(sAMAccountName={{username}})` |
| `ADMIN_USERNAME` | Username admin default (seed) | `admin` |
| `ADMIN_EMAIL` | Email admin default (seed) | `admin@company.com` |
| `ADMIN_PASSWORD` | Password admin default (seed) | `changeme123` |

---

## 8. Seed Data

Saat menjalankan `npm run db:seed`, sistem membuat user admin default:
- Username: dari env `ADMIN_USERNAME`
- Email: dari env `ADMIN_EMAIL`
- Password: dari env `ADMIN_PASSWORD` (di-hash dengan bcrypt)
- Role: `ADMIN`

---

## 9. Caching Strategy

| Key Pattern | Data | TTL |
|-------------|------|-----|
| `link:{code}` | Data shortlink untuk redirect | 1 jam |
| `bio:{slug}` | Data bio page publik | 5 menit |
| `rate:api:{ip}` | Counter rate limit API | 1 menit |
| `rate:auth:{ip}` | Counter rate limit auth | 1 menit |
| `rate:create-link:{ip}` | Counter rate limit create link | 1 menit |
| `rate:redirect:{ip}` | Counter rate limit redirect | 1 menit |

Cache invalidation terjadi otomatis saat shortlink atau bio page diupdate/dihapus.

---

## 10. Batasan & Keterbatasan Saat Ini

| Area | Keterbatasan |
|------|-------------|
| GeoIP | Belum diimplementasi — field `country` dan `city` di ClickEvent selalu `null` |
| Password-protected link | Frontend belum memiliki halaman khusus untuk input password (saat ini return JSON 401) |
| File upload | Avatar upload disimpan lokal di `public/uploads/`, belum ada integrasi cloud storage |
| Self-registration | Tidak ada fitur self-register — user dibuat via seed, admin, atau auto-create dari LDAP |
| Testing | Struktur test folder sudah ada (`tests/unit/`, `tests/integration/`) tapi belum ada test case |
| Audit log export | Dibatasi maksimal 10.000 records per export |
