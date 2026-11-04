# Struktur Data: Modul Admin Sekolah

Modul Admin Sekolah mengurus pengaturan master data di dalam lingkup internal institusinya (Tenant-Level). Semua entitas di sini wajib merujuk ke `id_sekolah`.


## 1. Entitas `Tahun_Ajaran`
Mengelompokkan data (siswa, kelas, nilai) ke dalam periode tertentu untuk keperluan *history*.
- **id** (UUID/String): Primary Key.
- **id_sekolah** (UUID/String): Foreign Key.
- **nama_periode** (String): Contoh "Ganjil 2026/2027".
- **tanggal_mulai** (Date): Tanggal mulai periode aktif.
- **tanggal_selesai** (Date): Tanggal berakhir periode.
- **is_active** (Boolean): Hanya boleh ada 1 tahun ajaran yang aktif secara bersamaan per sekolah.

## 2. Entitas `Jurusan` (Program Studi)
Daftar departemen keahlian atau program studi di sekolah.
- **id** (UUID/String): Primary Key.
- **id_sekolah** (UUID/String): Foreign Key.
- **kode_jurusan** (String): Kode inisial (mis. "TKJ", "RPL", "SIJA").
- **nama_jurusan** (String): Nama lengkap program keahlian.
- **deskripsi** (Text): Informasi mengenai jurusan tersebut.
