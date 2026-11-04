# Product Requirements Document (PRD) - Modul Admin Sekolah

## 1. Ikhtisar (Overview)
**Nama Modul**: Portal Admin Sekolah
**Aktor**: Staf Tata Usaha / Kepala Program / Koordinator IT Sekolah
**Tujuan**: Admin Sekolah bertugas sebagai administrator lokal (*Tenant Admin*). Mereka tidak mengurusi teknis ujian, melainkan berfokus pada administrasi data (Master Data) institusinya sendiri, seperti pengisian data guru, murid, dan jurusan. Semua yang mereka lakukan bersifat terisolasi hanya untuk sekolahnya.

---

## 2. Fitur Utama & User Stories (Epics)

### Epic 1: Manajemen Master Data Internal
Data dasar yang menopang kegiatan kelas.
- **User Story 1.1**: Sebagai Admin Sekolah, saya ingin mendaftarkan daftar Jurusan / Program Studi yang ada di sekolah (Misal: TKJ, RPL) agar siswa dapat dikelompokkan dengan rapi.
- **User Story 1.2**: Sebagai Admin Sekolah, saya ingin mengatur Tahun Ajaran / Semester aktif agar riwayat data terstruktur per periode.

### Epic 2: Manajemen Akun Pengguna (Guru)
Pembuatan akun massal (*Bulk Generation*) adalah inti fitur dari aktor ini khusus untuk tenaga pendidik.
- **User Story 2.1**: Sebagai Admin Sekolah, saya ingin mengunduh template format Excel/CSV dari sistem.
- **User Story 2.2**: Sebagai Admin Sekolah, saya ingin **mengunggah file Excel** yang berisi daftar guru sekaligus, sehingga sistem otomatis membuatkan akun untuk mereka tanpa saya harus *input* satu-satu.
- **User Story 2.3**: Sebagai Admin Sekolah, saya ingin sistem otomatis mem-parsing NIP dan tanggal lahir menjadi *Username*. Untuk keamanan, password akan di-generate secara acak oleh sistem dan dikirim langsung ke email guru masing-masing.
- **User Story 2.4**: Sebagai Admin Sekolah, saya ingin melihat, mencari (search), mengedit profil dasar, atau menonaktifkan/menghapus akun guru spesifik.

### Epic 3: Dukungan Lupa Kata Sandi (Helpdesk Internal)
- **User Story 3.1**: Sebagai Admin Sekolah, jika ada siswa atau guru yang lupa kata sandinya, saya ingin dapat menekan tombol "Reset Password" di dashboard saya untuk mereset kata sandi mereka kembali ke *default*.

### Epic 4: Dashboard Sekolah Lokal
- **User Story 4.1**: Sebagai Admin Sekolah, saya ingin melihat statistik lokal sekolah saya: total guru terdaftar, total siswa aktif, total jurusan.

---

## 3. Kriteria Penerimaan (Acceptance Criteria)
- Seluruh *query* database yang dijalankan oleh Admin Sekolah secara otomatis divalidasi dengan `WHERE id_sekolah = [Session.id_sekolah]`.
- Sistem tidak mengizinkan ukuran *upload* Excel melebihi batasan (misal: max 2MB atau 1000 baris per eksekusi).
- Sistem memberikan respon *success* / *failed logs* jika dalam upload massal terdapat data duplikat (misal NISN sudah dipakai).

## 4. Batasan & Out of Scope (Tahap Ini)
- Admin Sekolah **tidak** memiliki fitur untuk membuat soal ujian, melihat jawaban soal, ataupun mengurus rekap nilai SQL. Itu murni wewenang Guru.
