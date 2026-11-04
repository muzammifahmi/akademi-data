# Struktur Data: Modul Guru

Modul Guru memfokuskan relasi data yang berhubungan langsung dengan Kegiatan Belajar Mengajar (KBM), pembuatan modul SQL, serta penjadwalan ujian.

## 1. Entitas `Guru` (Tenaga Pendidik)
Menyimpan kredensial dan data detail guru/pengajar.
- **id** (UUID/String): Primary Key.
- **id_sekolah** (UUID/String): Foreign Key ke `Sekolah.id`. Sangat kritikal untuk *Data Isolation*.
- **nip** (String): Nomor Induk Pegawai. Digunakan sebagai default username jika email kosong.
- **email** (String): Alamat email (Wajib untuk login dan notifikasi).
- **password_hash** (String): Kata sandi terenkripsi.
- **nama_lengkap** (String): Nama asli beserta gelar.
- **status_aktif** (Boolean): Kondisi aktif/non-aktif akun.
- **created_at** (Timestamp).

## 2. Entitas `Kelas`
Ruang lingkup pertemuan antara Guru pengampu dengan kumpulan Siswa.
- **id** (UUID/String): Primary Key.
- **id_sekolah** (UUID/String): Foreign Key untuk validasi keanggotaan.
- **id_guru** (UUID/String): Foreign Key ke `Guru.id` (Pengajar kelas).
- **id_tahun_ajaran** (UUID/String): Foreign Key referensi periode akademik.
- **nama_kelas** (String): Identitas kelas (mis. "XI RPL 1 - Basis Data").
- **kode_gabung** (String): Kode alfanumerik unik (generate string 6-8 digit) yang dibagikan agar siswa bisa bergabung sendiri (Join Class).
- **deskripsi** (Text): Informasi singkat / silabus kelas.
- **created_at** (Timestamp).

## 3. Entitas `Anggota_Kelas` (Enrollment)
Menjembatani hubungan relasional (Many-to-Many) antara Siswa dan Kelas.
- **id** (UUID/String): Primary Key.
- **id_kelas** (UUID/String): Foreign Key.
- **id_siswa** (UUID/String): Foreign Key ke `Siswa.id`.
- **tanggal_gabung** (Timestamp): Merekam kapan siswa memasukkan kode kelas.

## 4. Entitas `Modul_Tugas` (Bank Soal)
Tempat Guru menyimpan kumpulan studi kasus SQL yang diujikan.
- **id** (UUID/String): Primary Key.
- **id_guru** (UUID/String): Foreign Key pencipta soal.
- **id_sekolah** (UUID/String): Foreign Key isolasi tenant.
- **judul_soal** (String): Konteks tugas (mis. "Join Table Penjualan").
- **deskripsi_kasus** (Text): Cerita latar belakang dari studi kasus.
- **skema_db_referensi** (Text): Keterangan nama/script tabel sandbox yang menjadi target soal.
- **kunci_jawaban_sql** (Text): Query DML/DDL valid yang dipakai Auto-Grader untuk memvalidasi *output* siswa.
- **bobot_nilai** (Integer): Nilai maksimum jika query tepat (Contoh: 10, 20, 100).

## 5. Entitas `Sesi_Ujian`
Distribusi soal/modul dari Guru kepada siswa dalam lingkup Kelas secara berbatas waktu.
- **id** (UUID/String): Primary Key.
- **id_kelas** (UUID/String): Foreign Key distribusi.
- **id_modul** (UUID/String): Foreign Key soal yang dipakai.
- **judul_sesi** (String): Judul ujian (mis. "Kuis Tengah Semester 1").
- **waktu_mulai** (Datetime): Kapan soal boleh diakses (terjadwal).
- **waktu_selesai** (Datetime): Kapan soal ditutup (otomatis).
- **proctoring_aktif** (Boolean): Mengatur apakah mode anti-cheat browser diaktifkan atau tidak.
