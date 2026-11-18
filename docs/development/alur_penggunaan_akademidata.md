# Dokumentasi Alur Kerja & Daftar Fitur AkademiData (3 Role)

Platform AkademiData dirancang dengan arsitektur **3 Peran Utama (3 Roles)**: **Admin**, **Guru**, dan **Siswa**.

---

## 1. Modul Admin (`admin`)
Berperan sebagai pengelola utama platform, pendaftar institusi sekolah, dan pengelola pengguna.

### Daftar Fitur Spesifik:
1. **Dashboard Portal Admin (`/admin/dashboard`)**
   - Menampilkan ringkasan statistik: Total Sekolah Terdaftar, Total Guru Terdaftar, dan Total Siswa Aktif.
   - Menampilkan daftar **Token Sekolah** terbaru dengan tombol salin cepat (*1-click copy*).
2. **Manajemen Sekolah & Generate Token Sekolah Unik (`/admin/sekolah`)**
   - Mendaftarkan sekolah baru (`/admin/sekolah/tambah`) menggunakan pencarian otomatis NPSN Dapodik atau input manual.
   - **Auto-Generate Token Sekolah Unik**: Setiap sekolah yang didaftarkan langsung mendapatkan `token_sekolah` unik berformat `SCH-<NPSN4>-<6_KODE_ACAK>` yang dijamin tidak mungkin sama dengan sekolah lain (`unique: true` di database + CSPRNG check).
   - Menyalin Token Sekolah, me-*regenerate* Token Sekolah baru kapan saja, serta mengatur status sekolah (`Active` / `Suspended`).
3. **Manajemen Pengguna & Kelas (`/admin/pengguna` & `/admin/kelas`)**
   - Melihat daftar seluruh Guru (beserta asal sekolahnya) dan Siswa.
   - Menambahkan Guru secara manual dan memantau daftar kelas yang ada.

---

## 2. Modul Guru (`guru`)
Guru terhubung ke sekolah tertentu menggunakan **Token Sekolah** yang diberikan oleh Admin saat registrasi.

### Daftar Fitur Spesifik:
1. **Registrasi dengan Token Sekolah & Login (Email / Google)**
   - Saat mendaftar sebagai Guru di halaman `/`, Guru wajib memasukkan **Token Sekolah** dari Admin.
   - Dapat login menggunakan Email & Kata Sandi atau akun Google.
2. **Manajemen Kelas**
   - Membuat & mengelola kelas yang diampu.
   - Meng-generate **Kode Kelas** unik agar siswa dapat bergabung ke kelas.
3. **Manajemen Modul & Bank Soal SQL (DDL, DML, DQL)**
   - Menyusun materi pembelajaran per Bab dan Sub-Bab.
   - Membuat soal Pilihan Ganda dan soal **Query SQL** (DDL, DML, DQL) lengkap dengan panduan interaktif dan pembangun tabel kunci jawaban (*Answer Table Builder*) + preview query SQL otomatis.
4. **Monitoring & Rekap Nilai**
   - Memantau progres belajar dan hasil nilai latihan/ujian siswa.

---

## 3. Modul Siswa (`siswa`)
Siswa adalah peserta didik yang mempelajari modul basis data dan mengerjakan latihan/ujian SQL secara interaktif.

### Daftar Fitur Spesifik:
1. **Registrasi Langsung Masuk & Login (Email / Google)**
   - Siswa dapat mendaftar melalui form Email & Sandi atau menggunakan Google.
   - Begitu selesai mendaftar sebagai Siswa, sistem **langsung mengarahkan siswa masuk ke bagian `/siswa`** tanpa perlu Token Sekolah.
2. **Dashboard Siswa & Gabung Kelas**
   - Mengakses daftar modul pembelajaran dan bergabung ke kelas menggunakan Kode Kelas dari Guru.
3. **Lingkungan Latihan SQL Bergaya VS Code (`/siswa/modul/[id]`)**
   - Tampilan terbagi dua (Kiri: Instruksi Soal & Skema Tabel Referensi, Kanan: **VS Code SQL Editor** + **Terminal Output** di bagian bawah).
   - Siswa dapat menekan tombol **Jalankan Query (`Ctrl+Enter`)** untuk menguji query SQL mereka di *sandbox* SQLite secara *real-time* dan melihat tabel hasil eksekusinya di Terminal sebelum mengumpulkan jawaban.
