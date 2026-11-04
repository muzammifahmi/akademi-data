# Dokumentasi Alur Kerja & Daftar Fitur (Multi-Sekolah / SaaS)

Platform AkademiData dirancang dengan arsitektur **Multi-Tenant (SaaS - Software as a Service)**, sehingga sistem ini dapat digunakan oleh ratusan sekolah secara bersamaan dalam satu database terpusat, dengan jaminan bahwa data antar-sekolah (tenant) terisolasi secara ketat dan aman.

Dokumen ini membedah secara rinci Alur Kerja (User Flow) dan Fitur bagi empat aktor utama: **Super Admin**, **Admin Sekolah**, **Guru**, dan **Siswa**.

---

## 1. Modul Super Admin (Pemilik Platform / Sistem)
Berperan sebagai pengelola utama aplikasi secara keseluruhan. Hanya Super Admin yang bisa menambahkan klien sekolah baru.

### Daftar Fitur Spesifik:
1. **Autentikasi Super Admin**
   - Akses penuh dan absolut ke level tertinggi sistem (Master Database).
2. **Dashboard Global**
   - Visualisasi statistik platform: Total Sekolah Terdaftar, Total Pengguna Aktif Seluruh Indonesia, Total Beban Eksekusi *Sandbox Server*.
3. **Manajemen Tenant (Mitra Sekolah)**
   - Mendaftarkan Institusi / Sekolah baru (Generate *Tenant ID* / `id_sekolah`).
   - Manajemen Lisensi Berlangganan (Menonaktifkan akses sekolah tertentu jika masa berlangganan / MoU habis).
   - Pengaturan batasan / Kuota (Misal: maksimal batas 1.000 siswa per sekolah).
4. **Manajemen Server Sandbox Global**
   - Mengatur *Connection String* ke klaster server sandbox (lingkungan isolasi tempat SQL dieksekusi) yang digunakan bersama oleh seluruh sekolah.
5. **Audit Sistem Global**
   - Memantau *error log* dan memori server secara keseluruhan.

---

## 2. Modul Admin Sekolah (Tenant Admin)
Admin khusus yang ditunjuk oleh setiap sekolah (biasanya Staff TU / Kaprog / Kepala Lab). Ruang lingkup aksesnya hanya dibatasi murni pada data di institusinya sendiri.

### Daftar Fitur Spesifik:
1. **Autentikasi Admin Sekolah**
   - Login menggunakan kredensial khusus. Sistem mendeteksi `id_sekolah` admin dan memfilter semua *query* yang muncul.
2. **Dashboard Sekolah**
   - Statistik internal sekolah: Jumlah Guru, Jumlah Siswa, Jumlah Ujian Aktif hari ini.
3. **Manajemen Pengguna Internal**
   - CRUD (Tambah, Edit, Hapus) Data Guru & Siswa **hanya untuk sekolahnya**.
   - **Fitur Import Massal (Bulk Upload)**: Mengunggah file Excel/CSV (berisi ratusan nama siswa), lalu sistem otomatis membuatkan *username* dan *password default*.
   - Fitur Reset Kata Sandi jika guru/siswa di sekolahnya lupa password.
4. **Manajemen Master Data Internal**
   - Membuat referensi Jurusan / Program Studi internal sekolah (Contoh: "RPL", "TKJ", "SIJA").
   - Manajemen Tahun Ajaran dan Semester aktif sekolah.

---

## 3. Modul Guru (Pengajar)
Hak akses Guru terikat pada Admin Sekolah yang membuatnya. Guru hanya bisa melihat data siswanya sendiri.

### Daftar Fitur Spesifik:
1. **Autentikasi & Profil**
   - Login menggunakan kredensial (Email & Password).
2. **Manajemen Kelas**
   - Membuat & melihat daftar kelas yang diampu.
   - **Generate & Salin Kode Kelas**: Sistem membuat kode token unik yang tidak akan pernah bentrok dengan sekolah lain, meminimalisir salah masuk kelas.
3. **Manajemen Modul & Bank Soal SQL**
   - Membuat materi modul, menyusun deskripsi studi kasus SQL.
   - Memasukkan *Query SQL Kunci Jawaban* (parameter utama bagi *Auto Grader* untuk mengecek jawaban siswa).
   - Mengatur Poin/Bobot Nilai tiap soal.
4. **Manajemen Sesi Ujian & Keamanan**
   - Menjadwalkan ujian (Durasi, Waktu mulai/selesai).
   - Menugaskan (Assign) ujian ke kelas.
   - **Konfigurasi Proctoring**: Toggle Switch (On/Off) untuk menyalakan fitur paksa *Fullscreen*, deteksi *Pindah Tab*, dan pelarangan *Copy-Paste*.
5. **Monitoring & Rekap Nilai**
   - Memantau ujian *Live* dan menerima notifikasi kecurangan (*Proctoring Alert*) secara seketika.
   - Melihat rekap hasil eksekusi *Auto Grader* dan mendownload nilai akhir kelas dalam format Excel/CSV.

---

## 4. Modul Siswa (Peserta)
Siswa adalah pengguna akhir (End-User) yang hanya terfokus pada antarmuka *Code Editor* yang aman dan terisolasi.

### Daftar Fitur Spesifik:
1. **Autentikasi Siswa**
   - Login aman menggunakan NISM/NISN atau Email Institusi.
2. **Dashboard & Manajemen Kelas**
   - Menampilkan *To-Do List* (Ujian/Tugas yang harus dikerjakan).
   - Fitur **Redeem Kode Kelas**: Menggabungkan diri ke dalam kelas milik guru dengan kode unik.
3. **Pengalaman Ujian (IDE Environment)**
   - Halaman terbagi menjadi dua panel (Soal & IDE Editor).
   - **SQL Code Editor**: Mengetik *query* SQL terintegrasi langsung di web.
   - Tombol "Submit Jawaban" yang memicu evaluasi instan.
4. **Keamanan Ujian Client-Side (Proctoring)**
   - Blokir Menu Klik Kanan (*Context Menu*) dan fitur *Copy, Cut, Paste*.
   - Syarat paksa *Fullscreen* sebelum soal terbuka.
   - Detektor Aktivitas: Sensor *Blur Window* yang menangkap basah jika siswa membuka Tab baru, membelah layar (*Split Screen*), atau membuka kalkulator/aplikasi lain.
   - Muncul overlay teguran keras jika melanggar.
5. **Riwayat Nilai**
   - Melihat log capaian nilai historis mereka sendiri setelah ujian ditutup.
