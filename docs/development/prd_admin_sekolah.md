# Product Requirements Document (PRD) - Modul Portal Admin (`admin`)

## 1. Ikhtisar (Overview)
- **Nama Modul**: Portal Admin (`/admin`)
- **Aktor**: Administrator AkademiData (`role: 'admin'`)
- **Tujuan**: Mengelola pendaftaran institusi sekolah beserta pembuatan **Token Sekolah unik** (yang digunakan Guru saat mendaftar akun), serta mengelola data pengguna (Guru & Siswa) dan kelas.

---

## 2. Fitur Utama & User Stories

### Epic 1: Pendaftaran Sekolah & Generate Token Sekolah Unik (`/admin/sekolah`)
- **User Story 1.1**: Sebagai Admin, saya ingin mendaftarkan sekolah baru dengan menarik data dari NPSN Dapodik atau mengisi form secara manual (`/admin/sekolah/tambah`).
- **User Story 1.2**: Sebagai Admin, begitu sekolah didaftarkan, saya ingin sistem **langsung meng-generate Token Sekolah unik** (`token_sekolah`) yang dijamin tidak mungkin sama dengan sekolah lain.
- **User Story 1.3**: Sebagai Admin, saya ingin melihat daftar seluruh sekolah beserta Token Sekolah masing-masing, menyalin token dengan 1 klik, atau men-generate ulang (*regenerate*) token baru jika diperlukan (`/admin/sekolah` & `/admin/sekolah/detail/[npsn]`).
- **User Story 1.4**: Sebagai Admin, saya ingin dapat men-*suspend* atau mengaktifkan kembali status sekolah sehingga token sekolah yang di-*suspend* tidak dapat dipakai untuk registrasi Guru baru.

### Epic 2: Mekanisme Keunikan Token Sekolah (`token_sekolah`)
- Format token: `SCH-<4_DIGIT_NPSN>-<6_KARAKTER_CSPRNG>` (menggunakan `crypto.randomBytes` dengan alfabet tanpa karakter ambigu `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`).
- Sebelum disimpan ke MongoDB, generator melakukan pengecekan `Sekolah.exists({ token_sekolah })` dalam *loop* ditambah indeks `unique: true` pada skema Mongoose `Sekolah`, sehingga **mustahil ada dua sekolah dengan token yang sama**.

### Epic 3: Manajemen Pengguna & Kelas (`/admin/pengguna` & `/admin/kelas`)
- **User Story 3.1**: Sebagai Admin, saya ingin melihat daftar seluruh Guru (lengkap dengan informasi asal sekolahnya) dan Siswa di `/admin/pengguna`.
- **User Story 3.2**: Sebagai Admin, saya ingin dapat menambahkan akun Guru secara manual dan mengaitkannya ke sekolah tertentu di `/admin/pengguna/tambah`.
