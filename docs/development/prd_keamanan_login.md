# PRD Keamanan Login, Registrasi & Otorisasi 3 Role (RBAC)

Dokumen ini mendefinisikan spesifikasi keamanan autentikasi (Login & Register) dan otorisasi berbasis peran pada platform AkademiData dengan **3 Role**: `admin`, `guru`, dan `siswa`.

---

## 1. Konsep Utama
Aplikasi menggunakan halaman autentikasi terpusat (`/`) yang melayani:
1. **Login**: Pilihan mengetikkan **Email dan Kata Sandi sendiri** ATAU **Login menggunakan Google**.
2. **Register**: Pilihan 2 peran (**Siswa** atau **Guru**):
   - Jika memilih **Guru**: Wajib memasukkan **Token Sekolah** unik yang digenerate oleh Admin.
   - Jika memilih **Siswa**: Tidak memerlukan token sekolah; setelah registrasi selesai, siswa langsung otomatis login dan masuk ke bagian `/siswa`.

---

## 2. Alur Autentikasi (Authentication Flow)

### A. Login Manual (Email & Kata Sandi) — `POST /api/login`
1. Pengguna memasukkan `email` dan `password`.
2. Sistem mencari pengguna di koleksi `users` dan memverifikasi *hash* password menggunakan `bcryptjs`.
3. Jika valid, sistem menerbitkan JWT di dalam HttpOnly Cookie `auth_token` dan mengembalikan `role` (`admin`, `guru`, atau `siswa`).

### B. Login & Register Menggunakan Google — `POST /api/auth/google`
1. Pengguna menekan tombol **Masuk dengan Google** atau **Daftar dengan Google**.
2. Backend memverifikasi identitas Google (`email`, `nama`, `googleId`, `avatar`).
3. Apabila akun sudah terdaftar di koleksi `users`, sistem langsung membuat sesi JWT sesuai `role` pengguna.
4. Apabila akun belum terdaftar:
   - Untuk **Siswa**: Akun baru dibuat dengan `role: 'siswa'` dan langsung masuk ke `/siswa`.
   - Untuk **Guru**: Sistem memvalidasi `token_sekolah` terlebih dahulu terhadap koleksi `sekolahs`. Jika valid, akun baru dibuat dengan `role: 'guru'` dan `sekolah_id` terikat ke sekolah tersebut, lalu masuk ke `/guru`.

### C. Registrasi Mandiri (Guru & Siswa) — `POST /api/register`
1. Pengguna memilih role: `siswa` atau `guru`.
2. **Khusus Role `guru`**:
   - Wajib menyertakan `token_sekolah`.
   - Backend mencari sekolah dengan `token_sekolah` tersebut di koleksi `sekolahs`.
   - Jika token tidak ditemukan atau sekolah berstatus `Suspended`, registrasi ditolak.
   - Jika valid, akun Guru disimpan beserta `sekolah_id` sekolah tersebut.
3. **Khusus Role `siswa`**:
   - Akun Siswa langsung disimpan dengan `role: 'siswa'`.
4. Backend langsung meng-set HttpOnly Cookie `auth_token` sehingga baik Siswa maupun Guru langsung masuk ke portal masing-masing (`/siswa` atau `/guru`) tanpa perlu login ulang.

### D. Struktur Payload JWT (`auth_token`)
```json
{
  "userId": "ObjectID_Pengguna",
  "email": "pengguna@domain.com",
  "nama": "Nama Lengkap",
  "role": "admin | guru | siswa",
  "sekolah_id": "ObjectID_Sekolah (untuk Guru)"
}
```

---

## 3. Proteksi Route & Auto-Redirect (`src/proxy.ts`)

| Role | Akses Route yang Diizinkan | Tujuan Auto-Redirect Default |
| :--- | :--- | :--- |
| `admin` | `/admin/*` | `/admin/dashboard` |
| `guru` | `/guru/*` | `/guru` |
| `siswa` | `/siswa/*` | `/siswa` |

- Pengguna yang mencoba mengakses route milik role lain akan otomatis diarahkan kembali ke halaman beranda role mereka.
- Route lama `/superadmin/*` otomatis diarahkan (*redirect*) ke `/admin/sekolah`.
