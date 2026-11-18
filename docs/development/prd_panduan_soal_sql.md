# Product Requirements Document (PRD) & Panduan: Pembuatan Materi dan Soal Praktikum Basis Data (DDL, DML, DQL)

## 1. Ikhtisar (Overview)
- **Nama Fitur**: Panduan & Builder Soal Praktikum SQL (DDL, DML, DQL) beserta In-App Tutorial Guru
- **Modul Terkait**: Portal Guru (`/guru/kelas/[id]/tambah-modul` & `/guru/kelas/[id]/edit-modul/[modulId]`) dan Mesin Evaluasi SQL (`/api/latihan-soal/evaluate`, `src/lib/sql-grader.ts`)
- **Aktor Utama**: Guru (Pengajar Basis Data) & Siswa (Peserta Didik)
- **Tujuan**:
  1. Menyediakan standar penyusunan materi pembelajaran dan latihan soal praktikum SQL yang mencakup tiga pilar utama bahasa SQL: **DDL (Data Definition Language)**, **DML (Data Manipulation Language)**, dan **DQL (Data Query Language)**.
  2. Menyediakan fitur **Tutorial & Panduan Interaktif di dalam aplikasi (In-App Tutorial)** serta **Template Contoh Soal** agar guru dapat membuat soal query SQL beserta skema database dan kunci jawabannya tanpa mengalami kesulitan teknis.

---

## 2. Klasifikasi Materi & Soal Query SQL yang Didukung

Platform AkademiData mendukung pembuatan materi per Sub-Bab yang diakhiri dengan latihan soal praktik SQL menggunakan mesin **Auto-Grader berbasis SQLite In-Memory Sandbox**. Guru dapat memilih 3 kategori tipe query sesuai kompetensi dasar yang diajarkan:

| Kategori | Kepanjangan | Perintah SQL Utama | Tujuan Kompetensi Siswa | Fokus Evaluasi Auto-Grader |
| :--- | :--- | :--- | :--- | :--- |
| **DQL** | *Data Query Language* | `SELECT`, `WHERE`, `ORDER BY`, `GROUP BY`, `JOIN` | Mengambil, memfilter, mengurutkan, dan mengolah laporan data dari tabel. | Membandingkan **Result Set** (baris, kolom, dan urutan data) antara query siswa dan kunci jawaban guru. |
| **DML** | *Data Manipulation Language* | `INSERT INTO`, `UPDATE`, `DELETE FROM` | Menambahkan baris baru, memperbarui nilai kolom, atau menghapus baris tertentu. | Membandingkan **kondisi akhir isi tabel (State Data)** di database sandbox setelah query dijalankan. |
| **DDL** | *Data Definition Language* | `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE` | Merancang struktur tabel, menentukan tipe data, *Primary Key*, mengubah kolom, atau menghapus tabel. | Membandingkan **struktur skema tabel (nama tabel, kolom, tipe data, PK)** pada database sandbox setelah query dijalankan. |

---

## 3. Panduan Teknis Pembuatan Soal SQL untuk Guru

Setiap butir soal bertipe **Tulis Query SQL** terdiri dari 4 komponen utama yang disusun oleh guru:
1. **Teks Instruksi / Pertanyaan**: Skenario kasus dan perintah spesifik yang harus dikerjakan siswa (menggunakan Rich Text Editor).
2. **Tipe Query & Bobot Nilai**: Pemilihan kategori (`DQL`, `DML`, atau `DDL`) dan bobot skor soal.
3. **Skema Database (Kondisi Awal / *Pre-Condition*)**: Visual Table Builder untuk menyiapkan tabel dan baris data awal sebelum query siswa dijalankan.
4. **Tabel Kunci Jawaban (Hasil yang Diharapkan) & Preview Query SQL Kunci Jawaban (Auto-Generated)**:
   - Guru tidak perlu mengetik query kunci secara manual; cukup menyusun **Tabel Kunci Jawaban** (bisa menyalin 1-klik dari Skema Awal lalu menyisakan kolom/baris yang diharapkan).
   - Di bawahnya, sistem secara otomatis menghasilkan **Preview Query SQL Kunci Jawaban (Auto-Generated)** beserta tombol **Test Run Kunci Jawaban**.
   - Auto-Grader mencocokkan langsung *output* dari eksekusi query siswa terhadap **Tabel Kunci Jawaban** guru.

Berikut adalah aturan penyusunan untuk masing-masing tipe query:

### 3.1. Panduan Membuat Soal DQL (`SELECT`)
Digunakan ketika siswa diminta menampilkan data dari satu atau beberapa tabel.

- **Langkah 1 — Pilih Tipe Query**: Pilih `DQL (SELECT)`.
- **Langkah 2 — Susun Skema Database (WAJIB ADA TABEL & ISI DATA)**:
  - Klik **+ Tambah Tabel Baru**, beri nama tabel (contoh: `mahasiswa`).
  - Tambahkan kolom-kolomnya (contoh: `nim` VARCHAR(15) PK, `nama` VARCHAR(100), `jurusan` VARCHAR(50), `ipk` INT/TEXT).
  - Klik **+ Tambah Baris Data** dan masukkan minimal 3–5 baris data sampel yang bervariasi (agar klausa `WHERE` atau `ORDER BY` benar-benar teruji).
- **Langkah 3 — Tulis Instruksi Soal**:
  - Sebutkan dengan jelas kolom apa saja yang harus ditampilkan dan kondisi filternya.
  - *Contoh*: *"Tampilkan kolom `nama`, `jurusan`, dan `ipk` dari tabel `mahasiswa` khusus untuk mahasiswa jurusan `'Informatika'`."*
- **Langkah 4 — Susun Tabel Kunci Jawaban & Cek Preview Query SQL**:
  - Klik tombol **Salin dari Skema Awal** pada bagian **Tabel Kunci Jawaban**, lalu hapus kolom atau baris yang tidak termasuk dalam hasil `SELECT` yang diharapkan.
  - Periksa kotak **Preview Query SQL Kunci Jawaban (Auto-Generated)** di bawahnya (misal: `SELECT nama, jurusan, ipk FROM mahasiswa WHERE jurusan = 'Informatika';`) dan klik **Test Run Kunci Jawaban** untuk memverifikasi hasil tabel.

---

### 3.2. Panduan Membuat Soal DML (`INSERT`, `UPDATE`, `DELETE`)
Digunakan ketika siswa diminta memanipulasi isi data di dalam tabel yang sudah ada.

- **Langkah 1 — Pilih Tipe Query**: Pilih `DML (INSERT/UPDATE/DELETE)` dan isi nama **Tabel Target** (opsional, contoh: `produk`).
- **Langkah 2 — Susun Skema Database**:
  - **Untuk Soal `INSERT`**: Buat struktur tabel beserta kolom-kolomnya pada **Skema Database**. Baris data awal bersifat opsional (boleh dikosongkan atau diisi beberapa data awal).
  - **Untuk Soal `UPDATE` & `DELETE`**: Buat struktur tabel beserta kolom-kolomnya, dan **WAJIB mengisi Baris Data Awal** yang nantinya akan diubah (`UPDATE`) atau dihapus (`DELETE`) oleh query siswa.
- **Langkah 3 — Tulis Instruksi Soal**:
  - Sebutkan nilai spesifik untuk setiap kolom yang ingin dimasukkan, diubah, atau dihapus.
  - *Contoh (`INSERT`)*: *"Tambahkan 1 baris data baru ke dalam tabel `produk` dengan `id_produk` = 3, `nama_produk` = `'Mouse Wireless'`, dan `harga` = 150000."*
  - *Contoh (`UPDATE`)*: *"Ubah `harga` menjadi `175000` pada tabel `produk` untuk data yang memiliki `id_produk` = 2."*
- **Langkah 4 — Susun Tabel Kunci Jawaban & Cek Preview Query SQL**:
  - Klik **Salin dari Skema Awal** pada bagian **Tabel Kunci Jawaban**, lalu sesuaikan baris datanya menjadi kondisi akhir tabel setelah perintah `INSERT`/`UPDATE`/`DELETE` dijalankan.
  - Di bawahnya akan tampil **Preview Query SQL Kunci Jawaban (Auto-Generated)** (misal: `INSERT INTO produk ...`). Klik **Test Run Kunci Jawaban** untuk memverifikasi kondisi akhir tabel di database sandbox.

---

### 3.3. Panduan Membuat Soal DDL (`CREATE`, `ALTER`, `DROP`)
Digunakan ketika siswa diminta mendefinisikan, memodifikasi, atau menghapus struktur tabel database.

- **Langkah 1 — Pilih Tipe Query**: Pilih `DDL (CREATE/ALTER)`.
- **Langkah 2 — Atur Skema Database (Perhatikan Perbedaan `CREATE` vs `ALTER/DROP`)**:
  - **Kasus A — Soal `CREATE TABLE` (Membuat Tabel Baru)**:
    - **KOSONGKAN Skema Database** (hapus tabel pada builder skema awal).
    - *Alasan*: Jika tabel sudah dibuat di Skema Database awal, maka saat siswa menjalankan `CREATE TABLE nama_tabel`, database akan menolak dengan pesan `table already exists`.
  - **Kasus B — Soal `ALTER TABLE` atau `DROP TABLE`**:
    - **BUAT Tabel Awal di Skema Database** terlebih dahulu agar tabel yang akan diubah (`ALTER`) atau dihapus (`DROP`) oleh siswa sudah tersedia di dalam sandbox.
- **Langkah 3 — Tulis Instruksi Soal**:
  - Sebutkan dengan rinci nama tabel, nama setiap kolom, tipe data, serta kolom mana yang menjadi `PRIMARY KEY`.
  - *Contoh (`CREATE TABLE`)*: *"Buatlah sebuah tabel baru bernama `dosen` dengan ketentuan kolom: `nidn` bertipe `INT` sebagai `PRIMARY KEY`, `nama_dosen` bertipe `VARCHAR(100)`, dan `bidang_keahlian` bertipe `VARCHAR(50)`."*
- **Langkah 4 — Susun Tabel Kunci Jawaban & Cek Preview Query SQL**:
  - Pada bagian **Tabel Kunci Jawaban**, buat struktur tabel akhir beserta kolom, tipe data, panjang, dan Primary Key yang diharapkan dibuat oleh siswa.
  - Periksa kotak **Preview Query SQL Kunci Jawaban (Auto-Generated)** di bawahnya (berisi perintah `CREATE TABLE ...`) dan klik **Test Run Kunci Jawaban** untuk memverifikasi bahwa struktur tabel berhasil terbentuk di sandbox tanpa error sintaks.

---

## 4. Spesifikasi Fitur Tutorial & Bantuan Guru di Dalam Aplikasi (`/guru`)

Agar guru tidak mengalami kebingungan saat menyusun soal SQL di halaman Buat Modul (`/guru/kelas/[id]/tambah-modul`) maupun Edit Modul (`/guru/kelas/[id]/edit-modul/[modulId]`), aplikasi wajib menyediakan 3 komponen bantuan terintegrasi:

### 4.1. Panduan Kontekstual Otomatis (*Contextual Inline Guide*)
- Terletak tepat di bawah pemilihan **Tipe Query** pada setiap kartu soal SQL.
- Isi panduan berubah secara otomatis mengikuti tipe query yang sedang dipilih guru:
  - Saat memilih **DQL**: Menampilkan instruksi singkat pembuatan tabel + pengisian baris data sampel + contoh `SELECT`.
  - Saat memilih **DML**: Menampilkan pengingat pembuatan tabel target + kewajiban isi baris data awal untuk `UPDATE`/`DELETE` + contoh `INSERT/UPDATE/DELETE`.
  - Saat memilih **DDL**: Menampilkan peringatan penting agar mengosongkan Skema Database untuk soal `CREATE TABLE` (atau mengisi tabel awal untuk `ALTER/DROP`) + contoh `CREATE TABLE`.

### 4.2. Tombol "Gunakan Contoh Soal (Auto-Fill Template)"
- Tersedia untuk masing-masing tipe (`Contoh DQL`, `Contoh DML`, `Contoh DDL`).
- Saat diklik oleh guru, sistem secara otomatis mengisi form soal yang sedang aktif dengan:
  1. Teks instruksi soal studi kasus yang rapi.
  2. Skema tabel dan baris data sampel yang sesuai (atau mengosongkan tabel untuk contoh `CREATE TABLE`).
  3. Query Kunci Jawaban SQL yang valid dan siap diuji dengan tombol **Test Run**.
- Memudahkan guru pemula untuk langsung mempelajari pola soal dan tinggal mengubah nama tabel/kolom sesuai kebutuhan kelasnya.

### 4.3. Modal Tutorial Interaktif ("Panduan Buat Soal SQL")
- Dapat dibuka kapan saja melalui tombol **"Panduan Buat Soal SQL"** pada bar Mode Latihan Aktif maupun dari dalam kartu soal SQL.
- Memiliki navigasi *tab* terstruktur:
  1. **Alur Dasar & Cara Kerja Auto-Grader**: Penjelasan 4 langkah mudah membuat soal dan bagaimana sistem menilai jawaban siswa.
  2. **Tutorial DQL (`SELECT`)**: Panduan lengkap beserta studi kasus dan tombol terapkan template.
  3. **Tutorial DML (`INSERT / UPDATE / DELETE`)**: Panduan lengkap beserta perbedaan pengaturan skema awal dan tombol terapkan template.
  4. **Tutorial DDL (`CREATE / ALTER / DROP`)**: Panduan lengkap mengenai kapan skema dikosongkan vs diisi beserta tombol terapkan template.

---

## 5. Kriteria Penerimaan (Acceptance Criteria)
1. Guru dapat membuat dan menguji (*Test Run*) soal bertipe **DQL**, **DML**, dan **DDL** pada halaman Tambah Modul maupun Edit Modul.
2. Mesin Auto-Grader (`src/lib/sql-grader.ts`) mampu memvalidasi baik isi baris data (untuk DQL & DML) maupun struktur kolom dan tipe data tabel melalui `PRAGMA table_info` (untuk DDL).
3. Tombol **Test Run** menampilkan pratinjau hasil eksekusi baik untuk query `SELECT` (berupa tabel hasil query) maupun untuk query `DML`/`DDL` (berupa struktur kolom dan isi tabel di database bayangan setelah query dieksekusi).
4. Guru dapat mengakses **Panduan Kontekstual**, **Modal Tutorial Lengkap**, dan **Template Contoh Soal** langsung di dalam antarmuka pembuat modul tanpa harus meninggalkan halaman.

