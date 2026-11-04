# PRD Keamanan Login & Otorisasi Berbasis Peran (Role-Based Access Control)

Dokumen ini mendefinisikan persyaratan dan alur kerja (workflow) untuk sistem keamanan login pada platform AkademiData. Tujuannya adalah memastikan bahwa pengguna diarahkan (redirect) dan hanya dapat mengakses halaman yang sesuai dengan **Peran (Role)** mereka berdasarkan kredensial email yang divalidasi.

## 1. Konsep Utama
Aplikasi menggunakan satu halaman login terpusat (`/`) untuk semua entitas (Superadmin, Admin Sekolah, Guru, Siswa). Sistem secara dinamis memverifikasi identitas dan menentukan peran pengguna di sisi backend (API), lalu mendistribusikan pengguna ke dasbor (dashboard) yang tepat.

## 2. Alur Autentikasi (Authentication Flow)

### A. Pengenalan Peran (Role Discovery) dari Email
Saat pengguna memasukkan email dan password, *endpoint* `/api/login` akan melakukan pencarian berjenjang (Waterfall Lookup) ke *database* untuk menentukan identitas pengguna:

1. **Cek Superadmin:** Cari di koleksi `users` (dengan peran `superadmin`).
   - Jika ditemukan & password cocok -> Role ditetapkan sebagai `superadmin`.
2. **Cek Admin Sekolah:** Cari di koleksi `sekolahs` pada field `admin_email`.
   - Jika ditemukan & password cocok -> Role ditetapkan sebagai `admin`.
3. **Cek Guru:** Cari di koleksi `gurus` pada field `email` (Tahap Pengembangan Selanjutnya).
   - Jika ditemukan & password cocok -> Role ditetapkan sebagai `guru`.
4. **Cek Siswa:** Cari di koleksi `siswas` pada field `email` (Tahap Pengembangan Selanjutnya).
   - Jika ditemukan & password cocok -> Role ditetapkan sebagai `siswa`.

*(Jika email tidak ditemukan di seluruh koleksi atau password salah, tolak login dengan pesan "Kredensial tidak valid").*

### B. Pembuatan Sesi (Session & Token)
Setelah pengguna divalidasi, sistem wajib menerbitkan **JSON Web Token (JWT)** atau **Encrypted Session Cookie** yang berisi struktur *payload* minimal sebagai berikut:
```json
{
  "id": "ObjectID_Pengguna",
  "email": "email_pengguna@domain.com",
  "role": "superadmin | admin | guru | siswa",
  "npsn": "Khusus Admin Sekolah/Guru/Siswa untuk mengetahui tenant mereka"
}
```
- Token ini **wajib** disimpan dalam HttpOnly Cookie (contoh: `auth_token`) agar aman dari serangan XSS. Dilarang menyimpan token sensitif murni di `localStorage`.

### C. Pengalihan Otomatis (Auto-Redirect)
Setelah sisi klien (Frontend) menerima respon sukses dari `/api/login`, frontend memeriksa `role` dari respon API, dan langsung mengarahkan pengguna:
- `superadmin` -> `/superadmin/sekolah`
- `admin` -> `/admin`
- `guru` -> `/guru`
- `siswa` -> `/siswa`

---

## 3. Alur Otorisasi (Route Protection & Middleware)

Untuk memastikan pengguna tidak "melompat" ke *route* peran lain melalui URL browser secara paksa, aplikasi WAJIB mengimplementasikan **Next.js Middleware (`middleware.ts`)**.

### Aturan Middleware:
1. **Pemotongan Jalur (Path Interception)**:
   - Jika *path* URL diawali `/superadmin`, maka token dalam cookie wajib dibongkar. Jika `role !== 'superadmin'`, lemparkan pengguna kembali ke `/` (Login).
   - Jika *path* URL diawali `/admin`, verifikasi bahwa `role === 'admin'`.
   - Hal yang sama berlaku untuk `/guru` dan `/siswa`.
   
2. **Perlindungan Halaman Login**:
   - Jika pengguna sudah memiliki sesi/token aktif dan mencoba membuka halaman `/` (Login), arahkan pengguna langsung ke dasbor sesuai peran mereka. (Bypass Login).

## 4. Keamanan Lanjutan (Advanced Security)

- **Rate Limiting**: Lindungi `/api/login` dari upaya *Brute Force*.
- **Password Hashing**: Semua password dalam database (baik Superadmin, Admin Sekolah, dll) WAJIB disimpan dalam bentuk *hash* (menggunakan `bcryptjs` atau `argon2`). Jangan pernah menyimpan plain text. (Di MVP saat pengiriman email, password plain text dibuat otomatis, tapi sebelum disimpan ke Mongo harus di-hash).
- **Tenant Isolation**: Bagi `admin_sekolah`, `guru`, dan `siswa`, setiap permintaan data (GET/POST) ke API wajib menyertakan atau memvalidasi `npsn` dari sesi login mereka agar mereka tidak bisa membaca/mengubah data sekolah (tenant) lain.
