# Portal Guru - AkademiData

Direktori ini berisi antarmuka dan logika (Frontend) khusus untuk modul **Guru (Pengajar)** pada platform AkademiData. Portal ini dirancang untuk memudahkan pengajar dalam manajemen pembelajaran, khususnya untuk praktikum Basis Data (SQL).

---

## 🎯 Fokus Modul
Portal Guru memungkinkan pengajar untuk:
1. **Manajemen Kelas**: Mengawasi siswa dan mendapatkan Kode Kelas.
2. **Bank Soal & Modul**: Menulis materi dan kunci jawaban SQL (sebagai parameter untuk fitur *Auto Grader*).
3. **Manajemen Ujian**: Menyelenggarakan ujian dan mengaktifkan fitur keamanan ujian (*Client-Side Proctoring*).
4. **Monitoring & Evaluasi**: Melihat hasil otomatis ujian (nilai) dan *log* pelanggaran kecurangan siswa.

---

## 📂 Struktur Direktori

Berikut adalah penjelasan fungsi masing-masing folder/file di dalam `/src/app/guru/`:

- **`/components/`**
  Berisi komponen *User Interface* (UI) yang dapat digunakan ulang khusus untuk halaman guru (Misal: `Navbar.tsx`, `Menu.tsx`/Sidebar, `Footer.tsx`).

- **`/dashboard/`**
  Berisi rute (`page.tsx`) untuk Halaman Utama Guru. Berisi ringkasan, metrik (jumlah siswa/kelas), dan notifikasi ujian.

- **`/kelas/`**
  Berisi rute (`page.tsx`) untuk halaman Manajemen Kelas. Di sini guru dapat melihat daftar kelas, modul aktif, dan membagikan *Kode Kelas*.

- **`layout.tsx`**
  Merupakan fondasi tata letak (layout) utama untuk seluruh halaman guru. File ini mengatur agar `Navbar` (atas) dan `Menu/Sidebar` (kiri) tetap persisten (tidak ikut ter-reload) ketika berpindah-pindah antar halaman di dalam `/guru`.

- **`page.tsx`**
  Halaman default (pintu masuk) `/guru`. Biasanya me-*redirect* otomatis ke `/guru/dashboard` jika guru sudah login.

*(Catatan: Rute tambahan seperti `/modul`, `/ujian`, `/nilai`, dan `/riwayat` akan ditambahkan di dalam direktori ini sesuai dengan alur yang telah disepakati).*

---

## 🔗 Referensi Dokumentasi
Untuk memahami secara teknis bagaimana data mengalir di Modul Guru ini, silakan merujuk pada:
1. [Alur Kerja (Workflow)](../../../docs/alur_penggunaan_akademidata.md) - Penjelasan navigasi menu Guru.
2. [Struktur Data (Models)](../../../docs/struktur_data_akademidata.md) - Penjelasan objek entitas (seperti Struktur Data Kelas, Soal, dll).
