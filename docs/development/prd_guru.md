# Product Requirements Document (PRD) - Modul Guru

## 1. Ikhtisar (Overview)
**Nama Modul**: Portal Guru / Pengajar
**Aktor**: Guru (Pengajar Praktikum / Basis Data)
**Tujuan**: Modul Guru merupakan inti operasional KBM (Kegiatan Belajar Mengajar) dalam aplikasi. Aktor ini bertanggung jawab mendesain kelas, menyusun logis soal SQL (termasuk kuncinya), serta mengawasi keamanan berjalannya evaluasi ujian menggunakan fitur proctoring.

---

## 2. Fitur Utama & User Stories (Epics)

### Epic 1: Manajemen Kelas & Pendaftaran
- **User Story 1.1**: Sebagai Guru, saya ingin membuat sebuah Kelas virtual baru dengan memberi nama (misal: "X RPL 1") dan subjek mata pelajaran.
- **User Story 1.2**: Sebagai Guru, setelah kelas dibuat, saya ingin sistem memunculkan **Kode Kelas** unik yang bisa saya salin (copy) dan bagikan ke grup WhatsApp siswa.
- **User Story 1.3**: Sebagai Guru, saya ingin melihat *list* (daftar) siswa mana saja yang sudah berhasil masuk (join) ke kelas saya menggunakan kode tersebut.
- **User Story 1.4**: Sebagai Guru, saya ingin bisa mengeluarkan (*kick*) siswa yang tidak dikenal (salah masuk kelas).

### Epic 2: Pembuatan Modul, Materi, & Bank Soal (Hierarki Bab & Sub-Bab)
Proses pembuatan modul dilakukan dengan menyusun hierarki: Modul -> Bab -> Sub-Bab.
- **User Story 2.1 (Kerangka Modul)**: Sebagai Guru, saya ingin membuat informasi dasar modul (Judul, Tujuan Pembelajaran) terlebih dahulu sebagai wadah materi.
- **User Story 2.2 (Struktur Bab & Sub-Bab)**: Sebagai Guru, saya ingin menyusun kurikulum modul dengan menambahkan beberapa "Bab" dan "Sub-Bab" di dalamnya secara dinamis.
- **User Story 2.3 (Penyusunan Materi Per Sub-Bab)**: Sebagai Guru, saya ingin mengetikkan isi materi (Rich Text / Markdown Code Block) secara terpisah di setiap Sub-Bab yang saya buat.
- **User Story 2.4 (Opsi Latihan Soal Per Sub-Bab)**: Sebagai Guru, saya ingin memiliki opsi untuk melampirkan butir soal latihan / kasus SQL (Auto-Grader) pada bagian akhir materi di setiap Sub-Bab. 
- **User Story 2.5 (Kunci Jawaban & Test Run)**: Sebagai Guru, saat membuat latihan soal di Sub-Bab, saya wajib menginputkan **Query SQL Kunci Jawaban** dan bisa melakukan *Test Run* terhadap query tersebut.
- **User Story 2.6 (Bobot Penilaian)**: Sebagai Guru, saya ingin menetapkan bobot nilai (contoh: 20 poin) untuk masing-masing soal latihan di setiap Sub-Bab.

### Epic 3: Manajemen Sesi Ujian & Proctoring
- **User Story 3.1**: Sebagai Guru, saya ingin menerbitkan (*publish*) sebuah modul bank soal menjadi "Sesi Ujian" yang ditugaskan (*assign*) ke kelas X RPL 1.
- **User Story 3.2**: Sebagai Guru, saya ingin mengatur durasi mundur (contoh: 60 menit) dan waktu ujian dimulai.
- **User Story 3.3**: Sebagai Guru, saya ingin menyalakan fitur **Keamanan Proctoring** (*Toggle Switch*) sebelum menerbitkan ujian, sehingga browser siswa akan terkunci.

### Epic 4: Monitoring Ujian Live & Evaluasi (Reporting)
- **User Story 4.1**: Sebagai Guru, saya ingin melihat halaman *Dashboard Live Ujian* yang menampilkan siswa mana yang masih mengerjakan dan siswa mana yang sudah kumpul.
- **User Story 4.2**: Sebagai Guru, saya ingin menerima notifikasi (*Alert*) secara *real-time* jika ada siswa yang ketahuan pindah tab atau keluar dari *Fullscreen*.
- **User Story 4.3**: Sebagai Guru, saya tidak perlu mengoreksi manual. Saya hanya ingin menekan tombol "Download Rekapitulasi" untuk mendapatkan nilai akhir (Excel/CSV) hasil eksekusi Auto-Grader.

---

## 3. Kriteria Penerimaan (Acceptance Criteria)
- Kelas yang dibuat dan Modul yang dibuat hanya bisa dilihat oleh Guru pembuatnya (Kecuali ada fitur "Berbagi Modul antar Guru" kelak).
- Kunci Jawaban SQL **harus** di-*encrypt* atau tidak bocor dalam *Payload API Endpoint* mana pun saat diakses di sisi *Client* (Siswa).
- Hasil akhir komparasi Auto-Grader dikalkulasi di level backend server, bukan di frontend.

## 4. Batasan & Out of Scope (Tahap Ini)
- Tidak ada fitur ujian Essay panjang manual, platform hanya difokuskan pada pengujian praktikum baris kode (SQL).
