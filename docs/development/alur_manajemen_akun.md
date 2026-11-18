# Dokumentasi Alur Manajemen Akun & Autentikasi (3 Role)

Sistem AkademiData menggunakan arsitektur **3 Peran (3 Roles)** yang terintegrasi:
1. **Admin (`admin`)** — Pengelola platform & pendaftar institusi sekolah.
2. **Guru (`guru`)** — Tenaga pendidik yang terhubung ke sekolah melalui **Token Sekolah**.
3. **Siswa (`siswa`)** — Peserta didik yang mendaftar mandiri dan langsung masuk ke Portal Siswa.

Dokumen ini menjelaskan alur siklus hidup akun, pendaftaran sekolah & token unik oleh Admin, registrasi mandiri Guru & Siswa, serta proses Login (Email/Sandi & Google).

---

## 1. Alur Pendaftaran Sekolah & Pembuatan Akun

### A. Akun Admin (`admin`)
- Dibuat melalui *seeder* database (`/api/seed`) atau manajemen sistem.
- Memiliki wewenang penuh di Portal Admin (`/admin/dashboard`, `/admin/sekolah`, `/admin/pengguna`, `/admin/kelas`).
- **Fitur Utama Admin — Registrasi Sekolah & Generate Token Sekolah Unik**:
  1. Admin mendaftarkan sekolah baru di menu `/admin/sekolah/tambah` (mendukung tarik data otomatis dari NPSN Dapodik atau input manual).
  2. Saat sekolah disimpan (`POST /api/sekolah`), sistem **langsung meng-generate `token_sekolah` unik** dengan algoritma CSPRNG (`crypto.randomBytes`) berformat `SCH-<4_DIGIT_NPSN>-<6_KARAKTER_ACAK>` yang diverifikasi keunikannya terhadap koleksi database (`unique: true`), sehingga **tidak mungkin sama dengan sekolah lain**.
  3. Admin menyerahkan **Token Sekolah** tersebut kepada Guru di sekolah bersangkutan (tersedia fitur *Salin Token* 1-klik dan *Generate Ulang Token* di `/admin/sekolah`).

### B. Akun Guru (`guru`)
- **Registrasi Mandiri dengan Token Sekolah**:
  1. Pada halaman utama (`/`), calon Guru memilih tab **Daftar** lalu memilih peran **Guru**.
  2. Guru wajib memasukkan **Token Sekolah** unik yang diberikan oleh Admin (contoh: `SCH-4198-9K4P7W`), beserta Nama Lengkap, Email, dan Kata Sandi (atau mendaftar menggunakan **Google** setelah mengisi Token Sekolah).
  3. Sistem memvalidasi bahwa `token_sekolah` terdaftar dan berstatus `Active`, lalu mengikat akun Guru tersebut ke `sekolah_id` milik sekolah terkait.
  4. Setelah registrasi berhasil, sesi JWT (`auth_token`) langsung dibuat dan Guru diarahkan ke `/guru`.
- **Penambahan Manual oleh Admin**:
  - Admin juga dapat menambahkan akun Guru secara manual melalui `/admin/pengguna/tambah`.

### C. Akun Siswa (`siswa`)
- **Registrasi Mandiri Langsung Masuk Portal Siswa**:
  1. Pada halaman utama (`/`), Siswa memilih tab **Daftar** lalu memilih peran **Siswa**.
  2. Siswa mengisi Nama Lengkap, Email, dan Kata Sandi (atau menekan tombol **Daftar Cepat dengan Google**).
  3. Siswa **tidak memerlukan Token Sekolah** saat registrasi.
  4. Begitu pendaftaran selesai (`POST /api/register` atau `POST /api/auth/google`), sistem langsung menerbitkan cookie sesi JWT (`auth_token`) dan **langsung mengarahkan siswa masuk ke halaman `/siswa`**.
  5. Di dalam `/siswa`, siswa dapat bergabung ke kelas menggunakan **Kode Kelas** yang diberikan oleh Guru.

---

## 2. Alur Login & Autentikasi (Email/Sandi & Google)

AkademiData menggunakan **Satu Pintu Autentikasi** di halaman utama (`src/app/page.tsx`) yang menyediakan 2 metode masuk:

### Metode 1: Login dengan Email & Kata Sandi (`/api/login`)
1. Pengguna mengetikkan **Email** dan **Kata Sandi** sendiri.
2. Backend memverifikasi kecocokan email dan *hash* kata sandi (`bcryptjs`) pada koleksi `User`.
3. Sistem menerbitkan HttpOnly Cookie `auth_token` berisi payload JWT (`userId`, `role`, `nama`, `sekolah_id`).

### Metode 2: Login / Daftar Menggunakan Google (`/api/auth/google`)
1. Pengguna memilih tombol **Masuk dengan Google** (mendukung *Google Identity Services ID Token* maupun pemilihan akun Google).
2. Jika email Google sudah terdaftar di database, pengguna langsung masuk sesuai `role`-nya (`admin`, `guru`, atau `siswa`).
3. Jika email Google belum terdaftar:
   - Apabila memilih peran **Siswa**, akun Siswa otomatis dibuat dan langsung masuk ke `/siswa`.
   - Apabila memilih peran **Guru**, sistem memvalidasi **Token Sekolah** terlebih dahulu sebelum membuat akun Guru dan mengarahkannya ke `/guru`.

### Auto-Redirect Berdasarkan 3 Role:
- `admin` ➔ diarahkan ke `/admin/dashboard`
- `guru` ➔ diarahkan ke `/guru`
- `siswa` ➔ diarahkan ke `/siswa`
