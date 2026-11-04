# AkademiData - Design System & UI Guidelines

Dokumen ini berfungsi sebagai **Pakem Utama (Single Source of Truth)** untuk aturan tata letak, warna, dan komponen visual pada platform AkademiData (Portal Guru, Siswa, Admin Sekolah, dan Superadmin). **Seluruh AI Assistant atau Developer yang akan memodifikasi/menambahkan halaman baru WAJIB mengikuti panduan desain ini agar tampilan tidak melenceng dari desain dasar awal.**

---

## 1. Palet Warna (Color Palette)

Aplikasi ini menggunakan warna-warna bersih dan profesional yang berfokus pada warna biru gelap (Navy/Dark Blue) untuk elemen utama.

- **Primary Brand Color (Biru Gelap/Navy)**: `bg-[#0D47A1]`
  - Digunakan untuk: *Banner Header* utama di atas dashboard, *Sidebar* (jika ada), dan elemen kontras tinggi.
- **Secondary Action Color (Biru Terang)**: `bg-[#2196F3]`
  - Digunakan untuk: Tombol utama (Primary Button), *Active State* (seperti tab aktif), tulisan tautan, aksen logo.
  - *Hover State*: `hover:bg-[#1976D2]`.

- **Background & Surface (Latar Belakang)**:
  - **Body Background**: `bg-[#F8FAFC]` (Slate 50) atau `bg-white` - Latar belakang utama halaman aplikasi.
  - **Card/Container Background**: `bg-white` (`#FFFFFF`) - Latar untuk kotak konten statistik, tabel, navbar, dll.

- **Typography & Teks (Grayscale)**:
  - **Heading / Teks Utama**: `text-slate-800` (Warna hitam keabu-abuan).
  - **Sub-heading / Teks Deskripsi**: `text-slate-500` atau `text-slate-600`.
  - **Teks Muted / Placeholder**: `text-slate-400`.

- **Border (Garis Tepi)**:
  - **Default Border**: `border-slate-200` (Sangat tipis dan subtle).

- **Status Colors (Semantic)**:
  - **Success (Aktif/Sukses)**: `text-emerald-600` / `bg-emerald-50` / `bg-emerald-500`.
  - **Danger (Suspend/Hapus/Error)**: `text-rose-600` / `bg-rose-50` / `bg-rose-500`.
  - **Warning (Pending/Reset)**: `text-amber-500` / `bg-amber-50`.

---

## 2. Tipografi (Typography)

Sistem font harus menggunakan font modern *sans-serif* bawaan Next.js (seperti Geist/Inter).
Untuk menjaga konsistensi, **WAJIB menggunakan pakem ketebalan font (Font Weight) berikut**:
- **`font-normal` (400)**: Untuk teks reguler, isi sel tabel biasa, nilai input, dan paragraf deskripsi pendek.
- **`font-medium` (500)**: Untuk teks yang butuh sedikit *highlight* (contoh: ID/Kode, Nama Pengguna di tabel, nilai pada lencana/badge, teks pada tombol).
- **`font-semibold` (600)**: Untuk penekanan terstruktur (contoh: Header Tabel `<th>`, Judul dalam Card, Label input form).
- **`font-bold` (700)**: **HANYA BOLEH** digunakan untuk Judul Halaman (H1/H2) dan Angka Statistik Besar. **Dilarang keras** menggunakan `font-bold` di dalam isi tabel atau teks deskripsi.

- **Ukuran Teks**:
  - Seluruh isi tabel dan *card* umum wajib menggunakan `text-sm`.
  - Teks deskripsi pembantu wajib menggunakan `text-xs`.

---

## 3. Komponen UI (UI Components)

### A. Layout Halaman & Kontainer Utama
- **Lebar Penuh (Full Width)**: Kontainer utama (di luar sidebar) wajib membentang penuh mengisi tinggi dan lebar sisa layar. Gunakan tag `<main className="flex-1 overflow-y-auto p-4 lg:p-6 w-full bg-[#F8FAFC]">`. **JANGAN** menggunakan pembatas lebar ke tengah seperti `max-w-7xl mx-auto`. Hal ini bertujuan menghilangkan ruang abu-abu berlebih di sisi kiri, kanan, maupun bawah layar.
- **Header Halaman (Tema Guru)**: Untuk halaman selain dashboard (seperti halaman daftar data atau halaman Tambah form), judul halaman wajib menggunakan kotak putih dengan aksen biru tegak di kiri. `bg-white p-4 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden`. Garis aksen biru: `<div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2196F3]"></div>`.

### B. Card & Border Radius (Bentuk Kotak)
- **Pakem Wajib**: Gunakan **`rounded-sm`** untuk kotak/kontainer konten utama agar terlihat elegan dan bersiku rapi, sesuai dengan desain awal aplikasi.
- **Style Card Utama**: `bg-white border border-slate-200 p-5 atau p-6 rounded-sm shadow-sm`.
- **Layout Card Statistik**: Ikon dapat berada di sebelah kiri atau belakang (watermark) menyesuaikan jenis halamannya.

### B. Header Banner (Selamat Datang)
- **Style Wajib**: `bg-[#0D47A1] rounded-sm p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-white`.
- Header harus menggunakan biru gelap (`#0D47A1`).

### C. Tombol (Buttons)
1. **Primary Button**: `px-4 py-2.5 bg-[#2196F3] text-white font-medium rounded-lg hover:bg-[#1976D2] transition-all shadow-sm flex items-center gap-2 text-sm`.
2. **Secondary/Outline Button**: `px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 text-sm`.
- **State Disabled**: Setiap tombol yang dalam status `disabled` HANYA BOLEH menggunakan ketebalan warna (opacity) 70% dengan `disabled:opacity-70 disabled:cursor-not-allowed`. Dilarang menggunakan nilai opacity yang lebih rendah (misal: 50%) agar tombol tidak terlihat terlampau pudar dan warna birunya tetap identik (konsisten).

### D. Tabel Data
- Tabel harus memiliki garis horizontal antar baris (`border-b border-slate-100`).
- Header tabel (`<thead>`) tipis `bg-slate-50 border-b border-slate-200`.
- **Tombol Aksi (Tabel)**: Tombol-tombol aksi seperti Edit/Hapus/Suspend di setiap baris tabel **WAJIB terlihat jelas secara bawaan** tanpa perlu di-*hover*. Dilarang menyembunyikan tombol (hindari class seperti `opacity-0`). Pastikan ukuran klik area cukup luas dengan padding `p-2` dan ukuran ikon minimal `w-5 h-5`.

### F. Form Layout & Inputs (Tampilan Ringkas / Compact)
Guna menjaga form tetap terlihat efisien dan tidak panjang, seluruh form masukan data (CRUD) WAJIB menggunakan struktur yang ringkas (*compact*):
- **Form Wrapper (Kontainer Utama)**: Gunakan padding dan gap yang lebih kecil, contoh: `p-5 md:p-6 space-y-6`. JANGAN gunakan *spacing* berlebihan seperti `space-y-10` atau `p-8`.
- **Form Groups (Grid)**: Gunakan jarak kolom yang rapat: `gap-4` alih-alih `gap-6`.
- **Form Labels**: Label input harus kecil dan tipis untuk menghemat ruang. Gunakan `block text-xs font-semibold text-slate-700 mb-1.5`.
- **Standard Inputs (Input Teks/Dropdown)**: Gunakan tinggi kotak (padding) yang pipih dan font kecil: `w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] transition-colors`. Perhatikan wajib pakai `py-1.5` dan `rounded-md`.
- **Form Section Heading**: Pembatas per seksi form gunakan ukuran font moderat `text-base font-bold text-slate-800 mb-3 pb-2` alih-alih `text-lg`.
- **Form Actions (Footer Tombol)**: Tempatkan tombol Batal dan Simpan di bagian bawah form dengan *background* rata (abu-abu terang): `px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-sm`. Tombol dalam form (Submit/Cancel) juga mengikuti ukuran lebih kecil (`py-1.5 px-4 text-sm`).
- **Search Input (Khusus Filter Tabel)**: `border border-slate-200 rounded-lg bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2196F3] transition-all`.

### G. Kebijakan Keamanan Akun (Account Security Rules)
- **Registrasi Pengguna/Sekolah**: **DILARANG KERAS** menyediakan kolom input Password untuk diisi secara manual oleh Superadmin/Admin saat menambahkan entitas akun pengguna baru.
- Sistem harus meng-*generate* *random password* secara otomatis dan rahasia, lalu kredensial tersebut dikirimkan ke email tujuan akun yang didaftarkan. Hal ini menjamin privasi akun dari pihak pendaftar (admin).

### H. Notifikasi & Alert (SweetAlert2)
- **Wajib Menggunakan SweetAlert2**: Dilarang keras menggunakan fungsi `alert()` bawaan browser. Seluruh interaksi sukses, peringatan, atau error harus menggunakan `Swal.fire()`.
- **Warna Tombol Aksi**: Di dalam popup modal SweetAlert, tombol konfirmasi wajib menggunakan warna biru primer dengan properti `confirmButtonColor: '#2196F3'`.
- **Auto-Close**: Untuk pesan sukses yang tidak memerlukan persetujuan fatal (misal: "Data NPSN Ditemukan"), tambahkan properti `timer: 2000` dan `showConfirmButton: false` agar popup menutup sendiri dengan halus.

### F. Tabs Navigation
- Gaya *Tab* untuk menu atas.
- **Tab Aktif**: Memiliki garis batas bawah tebal (warna biru). `text-[#2196F3] border-b-2 border-[#2196F3] font-semibold`.
- **Tab Inaktif**: Teks pudar tanpa garis biru. `text-slate-500 hover:text-slate-700 border-b-2 border-transparent transition-colors`.

---

## 4. Pesan Untuk AI (MANDATORY INSTRUCTION)
1. **Penting**: Desain utama harus menggunakan lengkungan yang soft/elegan seperti **`rounded-sm`** pada kontainer, dan `rounded-lg` pada tombol.
2. **Penting**: Banner atas atau elemen solid besar harus berwarna biru gelap **`bg-[#0D47A1]`**.
3. Tiru struktur ini di seluruh halaman dan role user (Admin, Superadmin, Guru, Siswa).
