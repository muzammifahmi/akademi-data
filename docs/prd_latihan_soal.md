# Product Requirements Document (PRD): Modul Latihan Soal (Query & Pilihan Ganda)

## 1. Pendahuluan
Dokumen ini menguraikan kebutuhan produk dan alur kerja (flow) untuk fitur **Pembuatan Latihan Soal** oleh Guru pada platform AkademiData. Fitur ini memungkinkan guru untuk menyematkan kuis atau latihan praktik tepat di bawah materi Sub-Bab. Terdapat dua jenis soal yang didukung:
1. **Query SQL Langsung** (Praktik auto-grader)
2. **Pilihan Ganda** (Teori)

## 2. Tujuan (Objectives)
- Memberikan fleksibilitas bagi guru untuk menguji pemahaman siswa secara teori (Pilihan Ganda) maupun praktik langsung (Query SQL).
- Mengotomatiskan proses penilaian (Auto-Grader) untuk mengurangi beban kerja guru dalam mengoreksi tugas SQL.
- Memberikan umpan balik instan bagi siswa saat menjawab latihan.

## 3. Alur Pengguna (User Flow): Guru (Pembuat Soal)

### 3.1. Mengaktifkan Mode Latihan Soal
1. Guru berada di halaman pembuatan/pengeditan materi Sub-Bab.
2. Di bagian bawah editor teks (Jodit Editor), terdapat sebuah *toggle switch* bertuliskan **"Latihan Soal Sub-Bab"**.
3. Jika diaktifkan (*on*), antarmuka pembuat soal (Question Builder) akan muncul.

### 3.2. Menambahkan dan Mengelola Soal
1. Guru menekan tombol **"+ Tambah Soal"**.
2. Guru memilih tipe soal dari *dropdown*: 
   - `Tulis Query SQL`
   - `Pilihan Ganda`
3. Guru dapat menambahkan banyak soal dalam satu Sub-Bab.
4. Guru dapat mengatur urutan soal (geser atas/bawah) atau menghapus soal menggunakan ikon *Trash* (tempat sampah).

### 3.3. Tipe Soal 1: Tulis Query SQL
Desain ini disesuaikan dengan *screenshot* referensi studi kasus SQL.
- **Teks Instruksi / Pertanyaan:** *Textarea* bagi guru untuk mendeskripsikan soal (contoh: "Buatlah tabel Dosen dengan kolom id dan nama...").
- **Kunci Jawaban (Auto-Grader):** Editor kode khusus (seperti Monaco Editor / CodeMirror) dengan sintaks *highlight* SQL, di mana guru menuliskan *query* jawaban yang benar dan ideal.
- **Tombol "Test Run" (Validasi):** Guru dapat menekan tombol ini untuk menjalankan *query* kunci jawaban terhadap skema *database* percobaan guna memastikan *query* tidak *error* dan menghasilkan keluaran yang benar.
- **Bobot Nilai:** *Input* angka untuk menentukan berapa poin yang didapat siswa jika menjawab soal ini dengan benar (contoh: 10, 20, 50).

### 3.4. Tipe Soal 2: Pilihan Ganda
- **Teks Pertanyaan:** *Textarea* atau *Rich Text Editor* sederhana untuk menulis pertanyaan teori.
- **Opsi Jawaban:** Terdapat tombol **"+ Tambah Opsi"** untuk membuat daftar pilihan ganda (A, B, C, D).
  - Setiap baris opsi memiliki *input* teks untuk isi jawaban.
  - Setiap baris opsi memiliki *Radio Button* (tombol bulat) di sebelah kirinya untuk menandai **Mana Opsi yang Benar (Kunci Jawaban)**. Hanya satu opsi yang bisa diset sebagai kunci.
  - Ikon hapus (silang) untuk menghapus opsi yang tidak perlu.
- **Bobot Nilai:** *Input* angka untuk poin soal.

---

## 4. Mekanisme Penilaian Otomatis (Auto-Grader Mechanism)

Sistem harus bisa mengoreksi jawaban siswa secara otomatis berdasarkan "Kunci Jawaban" yang sudah dibuat guru.

### 4.1. Validasi Pilihan Ganda
Penilaian dilakukan secara statis dan langsung. Sistem akan mencocokkan `ID Opsi` yang dipilih siswa dengan `ID Opsi` kunci jawaban.
- **Benar:** Poin siswa bertambah sesuai "Bobot Nilai".
- **Salah:** Poin = 0.

### 4.2. Validasi Query SQL (The Auto-Grader)
Karena SQL memiliki banyak cara untuk mencapai hasil yang sama (misal: `SELECT nama, id` vs `SELECT id, nama`), *string matching* biasa tidak akan efektif. Berikut mekanisme yang dirancang:

1. **Execution Comparison (Komparasi Eksekusi):**
   - Saat siswa melakukan *Submit* jawaban, sistem (di server/backend) mengeksekusi **Query Jawaban Siswa** dan **Query Kunci Jawaban (Guru)** secara bersamaan pada *sandbox database* (database percobaan terisolasi).
   - Sistem membandingkan hasil keluaran (*Result Set*) dari kedua *query* tersebut.
   - Jika tabel hasil, kolom, dan jumlah barisnya identik, maka jawaban dianggap **Benar**.
2. **Error Handling & Feedback:**
   - Jika *query* siswa menghasilkan *Syntax Error* atau kolom tidak ditemukan, sistem langsung menolak dan menampilkan pesan *error database* asli kepada siswa (sebagai pembelajaran).
3. **Keyword Validation (Pendekatan Alternatif Terbatas):**
   - Jika sistem tidak sanggup membuat *sandbox execution*, alternatif ringannya adalah memvalidasi struktur SQL menggunakan regex atau *parser* untuk mencocokkan komponen klausa (misal: "Harus ada kata `CREATE TABLE Dosen` dan `nama VARCHAR`"), namun ini memiliki akurasi yang lebih rendah.

---

## 5. Struktur Data (JSON Model Representation)

Untuk mempermudah *developer* saat menyimpan data ke *database*, berikut struktur dokumen soal (*Schema*):

```json
{
  "subBabId": "651a2b3...",
  "hasExercise": true,
  "questions": [
    {
      "id": "q1",
      "type": "sql_query",
      "instruction": "Buatlah tabel Dosen dengan kolom id dan nama...",
      "sqlAnswerKey": "CREATE TABLE Dosen (id INT, nama VARCHAR(255));",
      "scoreWeight": 10
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "instruction": "Klausa apa yang digunakan untuk mengurutkan data dari besar ke kecil?",
      "options": [
        { "id": "opt1", "text": "ORDER BY ASC", "isCorrect": false },
        { "id": "opt2", "text": "ORDER BY DESC", "isCorrect": true },
        { "id": "opt3", "text": "SORT BY", "isCorrect": false }
      ],
      "scoreWeight": 5
    }
  ]
}
```

## 6. Antarmuka Siswa (Student Facing)
- Setelah membaca materi Sub-Bab, area kuis akan terkunci atau muncul di paling bawah halaman.
- Soal SQL: Menampilkan terminal interaktif/editor untuk mengetik *query*.
- Soal Pilihan Ganda: Menampilkan *radio button* yang rapi.
- Setelah *Submit*, sistem memunculkan pop-up / laporan nilai instan (misal: "Selamat! Anda mendapat skor 90/100").

## 7. Hal yang perlu diperhatikan (Edge Cases)
- **Keamanan Sandbox SQL:** Mengingat siswa bisa mengeksekusi perintah SQL (terutama `DROP TABLE`, `DELETE`), *backend* harus menjalankan *query* siswa di dalam *environment* yang bersifat *transaction-rollback* atau menggunakan replika statis, sehingga *database* utama tidak hancur.
- **Validasi Total Bobot:** Idealnya (opsional) sistem memberikan peringatan jika total bobot soal dalam 1 latihan tidak berjumlah kelipatan logis (misal 100 poin).
