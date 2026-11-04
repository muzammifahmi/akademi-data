# Dokumentasi Alur Manajemen Akun & Autentikasi

Sistem AkademiData mengadopsi arsitektur *Multi-Tenant* (SaaS) hybrid. Pendaftaran mandiri (registrasi publik) hanya dibuka eksklusif untuk aktor Siswa. Sementara itu, pembuatan akun tingkat institusi (Guru, Admin Sekolah, Super Admin) diatur secara ketat berjenjang dari atas ke bawah (Top-Down).

Dokumen ini menjelaskan alur siklus hidup akun, mulai dari cara dibuat hingga proses login.

---

## 1. Alur Pembuatan Akun (Account Creation Flow)

Proses penciptaan akun dilakukan secara berantai dari tingkat wewenang tertinggi hingga terendah.

### A. Akun Super Admin
- Dibuat secara manual di level *database* (biasanya melalui *seeder script* atau input manual oleh developer) saat sistem pertama kali di-*deploy*.
- Memiliki otoritas absolut dan tidak terikat pada `id_sekolah` manapun.

### B. Akun Admin Sekolah (Pemilik Tenant)
- Dibuat secara eksklusif oleh **Super Admin** saat mendaftarkan (onboarding) sekolah mitra baru ke dalam platform.
- **Alur:**
  1. Super Admin mendaftarkan institusi/sekolah baru ke sistem (mendapatkan `id_sekolah`).
  2. Super Admin mendaftarkan satu akun Admin Sekolah (Staf TU/Kaprog) dan mengikatnya secara permanen dengan `id_sekolah` yang baru dibuat.
  3. Kredensial (Email & Password *default*) diserahkan ke pihak sekolah secara langsung/offline.

### C. Akun Guru
- Dibuat secara internal oleh **Admin Sekolah** untuk institusinya masing-masing.
- Ada dua metode pembuatan:
  - **Single Create**: Admin Sekolah menginput manual satu per satu via form web.
  - **Bulk Upload / Import Massal**: Admin mengunggah file Excel berisi data puluhan guru.
- **Keamanan Kredensial**: Sistem akan otomatis membuatkan password acak untuk setiap guru baru, yang kemudian dikirimkan secara langsung ke alamat email masing-masing guru (menyamai alur pendaftaran Admin Sekolah).

### D. Akun Siswa
- **Pendaftaran Mandiri (Sign Up)**: Siswa membuat akun mereka sendiri di halaman awal platform.
- Meskipun mendaftar secara publik, siswa pada awalnya belum terikat pada `id_sekolah` atau tenant manapun.
- Siswa baru terikat ke sebuah sekolah ketika mereka menekan tombol "Gabung Kelas" dan memasukkan **Kode Kelas** valid yang diterbitkan oleh Guru. Sistem akan otomatis menyelaraskan `id_sekolah` siswa mengikuti kelas tersebut.

---

## 2. Alur Login & Autentikasi (Authentication Flow)

AkademiData menggunakan **Satu Pintu Login (Universal Login Page)** yang terletak di halaman muka (`src/app/page.tsx`). Pengguna tidak perlu repot mencari portal login yang berbeda.

### Alur Proses Login:
1. **Input Kredensial**
   - Pengguna (Role apa pun) memasukkan Email/Identifier dan Password.
2. **Validasi & Verifikasi (Backend API)**
   - API mengecek ketersediaan email di database.
   - API melakukan komparasi/pencocokan *hash password* (contoh: menggunakan *Bcrypt*).
3. **Session Generation & Role Routing**
   - Jika cocok, sistem men-generate sesi yang aman (misalnya JSON Web Token / JWT) dan menyimpannya di *Cookies browser*. Token ini memuat informasi rahasia seperti `role` dan `id_sekolah`.
   - **Router Otomatis:** Sistem mendeteksi `role` dari pengguna dan langsung me-redirect (*lempar*) pengguna ke portal yang tepat:
     - Jika `SuperAdmin` ➔ diarahkan ke `/superadmin/dashboard`
     - Jika `AdminSekolah` ➔ diarahkan ke `/admin/dashboard`
     - Jika `Guru` ➔ diarahkan ke `/guru/dashboard`
     - Jika `Siswa` ➔ diarahkan ke `/siswa/dashboard`

---

## 3. Keamanan Tingkat Sesi (Tenant Isolation)
Setelah pengguna berhasil masuk, Middleware Next.js / Token JWT secara aktif menjaga keamanan:
- Setiap kali **Guru** atau **Siswa** meminta data dari *backend* (contoh: Guru mengambil daftar siswa), API secara otomatis dan diam-diam menyisipkan perintah `WHERE id_sekolah = ?` berdasarkan data dari JWT.
- Siswa dari "SMKN 1" **mustahil** bisa melihat soal ujian milik "SMKN 2" secara sistematis.

---

## 4. Manajemen Lupa Kata Sandi (Password Recovery)
Karena sistem bergantung pada arsitektur tertutup (dan kemungkinan belum terhubung dengan server email SMTP (*Sendgrid/Nodemailer*) pada fase awal pengembangan), maka pemulihan kata sandi dilakukan secara berjenjang:
- Jika **Siswa / Guru** lupa kata sandi ➔ Mereka wajib melapor ke **Admin Sekolah** ➔ Admin Sekolah menekan tombol "Reset Password Default" di dashboard admin.
- Jika **Admin Sekolah** lupa kata sandi ➔ Wajib melapor ke **Super Admin**.
- Sangat dianjurkan bagi seluruh pengguna yang akunnya dibuatkan via *Bulk Upload* untuk segera **Mengubah Kata Sandi** mereka melalui menu *Profil/Pengaturan* ketika mereka pertama kali berhasil Login.
