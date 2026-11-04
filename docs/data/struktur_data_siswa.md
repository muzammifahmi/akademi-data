# Struktur Data: Modul Siswa

Modul Siswa berpusat pada entitas hasil transaksi (submission), jejak nilai (grades), dan pemantauan kejujuran (proctoring log) selama pengerjaan evaluasi SQL.

## 1. Entitas `Siswa` (Peserta Didik)
Menyimpan kredensial dan data diri siswa secara mendetail.
- **id** (UUID/String): Primary Key.
- **id_sekolah** (UUID/String): Foreign Key ke `Sekolah.id`.
- **nisn** (String): Nomor Induk Siswa Nasional (Wajib, sebagai username alternatif).
- **email** (String): Alamat email (Opsional).
- **password_hash** (String): Kata sandi terenkripsi.
- **nama_lengkap** (String): Nama asli siswa.
- **status_aktif** (Boolean): Kondisi aktif/non-aktif akun.
- **created_at** (Timestamp).

> **Catatan Penting Kelas**: Entitas Siswa **TIDAK** memiliki `id_kelas` atau `id_jurusan` langsung secara permanen di struktur tabel utama. Siswa nantinya akan secara mandiri bergabung ke dalam kelas melalui sistem input "Kode Kelas" yang membentuk tabel relasional.

## 2. Entitas `Pekerjaan_Siswa` (Submission / Hasil Ujian)
Merekam history penyerahan script SQL siswa terhadap sebuah sesi ujian/tugas.
- **id** (UUID/String): Primary Key.
- **id_siswa** (UUID/String): Foreign Key ke `Siswa.id`.
- **id_sesi_ujian** (UUID/String): Foreign Key ke jadwal sesi ujian.
- **jawaban_sql** (Text): *Source code* murni SQL yang dieksekusi atau dikirim (submit) oleh siswa.
- **status_kebenaran** (Boolean): Status lolos evaluasi atau tidak (`TRUE` = Output sesuai dengan instruktur, `FALSE` = Output berbeda/Error).
- **pesan_error** (Text): Log error dari server (Contoh: "Syntax error near..."), opsional jika query bermasalah.
- **waktu_eksekusi_ms** (Integer): Lama berjalannya query (untuk keperluan benchmarking ringan, opsional).
- **poin_didapat** (Integer): Skor yang diberikan dari Auto-Grader (bergantung bobot di Modul).
- **submitted_at** (Timestamp): Waktu siswa menekan tombol serahkan.

## 3. Entitas `Log_Proctoring` (Catatan Kejujuran Ujian)
Apabila `proctoring_aktif` = True pada entitas `Sesi_Ujian`, sistem browser otomatis merekam pergerakan mencurigakan milik siswa.
- **id** (UUID/String): Primary Key.
- **id_siswa** (UUID/String): Foreign Key ke `Siswa.id`.
- **id_sesi_ujian** (UUID/String): Foreign Key (Sesi apa pelanggaran terjadi).
- **jenis_pelanggaran** (Enum: `TAB_SWITCH`, `EXIT_FULLSCREEN`, `COPY_PASTE`, `WINDOW_BLUR`): Kategori sistem peringatan browser.
- **deskripsi** (Text): Tambahan konteks keterangan (mis. "Berpindah tab ke Google.com").
- **waktu_kejadian** (Timestamp): Detik presisi saat trigger kecurangan terdeteksi.
