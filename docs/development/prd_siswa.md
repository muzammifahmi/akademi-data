# Product Requirements Document (PRD) - Modul Siswa

## 1. Ikhtisar (Overview)
**Nama Modul**: Portal Peserta (Siswa)
**Aktor**: Siswa
**Tujuan**: Modul Siswa merupakan antarmuka akhir (*End-User Interface*) yang sangat difokuskan pada pengalaman (UX) penulisan *code* dan keamanan ujian (*Proctoring*). Modul ini sengaja didesain minimalis agar siswa tidak terdistraksi dan mematuhi aturan pelaksanaan evaluasi praktikum.

---

## 2. Fitur Utama & User Stories (Epics)

### Epic 1: Autentikasi & Gabung Kelas (Join Class)
Siswa mendaftarkan diri secara mandiri di awal, lalu bergantung pada kode kelas untuk masuk ke lingkungan tenant sekolahnya.
- **User Story 1.1a**: Sebagai Siswa, saya ingin mendaftarkan akun (Sign Up) secara mandiri dari halaman depan dengan memasukkan data identitas pribadi (NISN, Nama, Email, dan membuat Password sendiri).
- **User Story 1.1b**: Sebagai Siswa, saya ingin login menggunakan NISN/Email dan Password yang telah saya buat.
- **User Story 1.2**: Sebagai Siswa baru, saya ingin melihat tombol "Gabung Kelas", memasukkan **Kode Kelas** yang diberikan Guru, agar saya bisa otomatis terdaftar ke dalam kelas tersebut dan melihat tugas-tugasnya.
- **User Story 1.3**: Sebagai Siswa, saya ingin melihat halaman *Dashboard To-Do*, yang menyajikan daftar "Ujian yang belum dikerjakan" dan "Tugas yang sedang berlangsung".

### Epic 2: Keamanan Ujian (Client-Side Proctoring)
Fitur proctoring berjalan otomatis begitu siswa memulai ujian.
- **User Story 2.1**: Sebagai Siswa, ketika saya menekan tombol "Mulai Ujian", saya ingin browser meminta saya menyetujui izin untuk masuk mode Layar Penuh (*Fullscreen*). Ujian tidak terbuka sebelum saya masuk *Fullscreen*.
- **User Story 2.2**: Sebagai Siswa (User Nakal), ketika saya mencoba menekan **Klik Kanan** untuk *inspect element* atau *Copy-Paste* jawaban dari luar, saya ingin browser menolaknya dan memblokir aksi saya.
- **User Story 2.3**: Sebagai Siswa (User Nakal), ketika saya menekan *Alt+Tab* atau memencet tombol Windows untuk *googling*, saya ingin sistem memunculkan Layar Peringatan Merah (*Warning Overlay*) yang menutupi ujian, dan sistem mencatat pelanggaran saya.

### Epic 3: Pengalaman Eksekusi Kode (IDE Environment)
- **User Story 3.1**: Sebagai Siswa, saya ingin antarmuka layar ujian terbagi dua (Kiri: Teks Soal & Struktur Tabel; Kanan: Editor Kode SQL ber-tema gelap (*Dark Mode*) seperti VS Code).
- **User Story 3.2**: Sebagai Siswa, saya ingin mengetikkan *query* jawaban saya (misal: `SELECT * FROM tb_buku;`).
- **User Story 3.3**: Sebagai Siswa, saya ingin bisa menekan tombol **"Jalankan (Run)"** untuk melihat *output* hasil tabel *query* saya di panel bawah (*Console/Output*) sebagai ajang simulasi sebelum diserahkan final.
- **User Story 3.4**: Sebagai Siswa, saya ingin menekan tombol **"Submit Final"** untuk mengirim jawaban saya secara definitif ke *Auto-Grader* di *backend*.

### Epic 4: Riwayat Evaluasi (Progress Tracking)
- **User Story 4.1**: Sebagai Siswa, setelah waktu ujian habis atau saya mensubmit ujian, saya ingin langsung dialihkan (*redirect*) ke luar ujian.
- **User Story 4.2**: Sebagai Siswa, jika guru mengizinkan *Review* nilai dirilis langsung, saya ingin bisa melihat nilai akhir yang saya dapatkan di halaman Riwayat Nilai.

---

## 3. Kriteria Penerimaan (Acceptance Criteria)
- Editor kode (*SQL Editor*) harus mendukung penyorotan sintaks (*syntax highlighting*) khusus SQL untuk memudahkan siswa membaca kodenya sendiri.
- API pendaftaran kelas harus menolak jika Kode Kelas salah atau kelas dari *Tenant/Sekolah* yang berbeda.
- Timer (Penghitung mundur ujian) tidak boleh mengandalkan jam lokal PC siswa (karena bisa dimanipulasi dengan mengubah jam Windows). Timer harus tervalidasi menggunakan jam server (*Server Timestamp*).

## 4. Batasan & Out of Scope (Tahap Ini)
- Server *Sandbox* membatasi akses hak (*permissions*). *Query* siswa berjenis DROP DATABASE atau serangan *SQL Injection* akan ditolak/dimentahkan (*sandboxed*) agar tidak merusak *database* master sekolah.
