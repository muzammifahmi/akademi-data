# Product Requirements Document (PRD) - Modul Super Admin

## 1. Ikhtisar (Overview)
**Nama Modul**: Portal Super Admin AkademiData
**Aktor**: Pemilik Platform / Sistem (Platform Owner)
**Tujuan**: Modul ini dirancang untuk memberikan kendali penuh atas sistem Multi-Tenant (SaaS). Super Admin bertanggung jawab dalam melakukan *onboarding* klien sekolah (Tenant) baru, mengelola konfigurasi infrastruktur global, dan memonitor kesehatan ekosistem sistem.

---

## 2. Fitur Utama & User Stories (Epics)

### Epic 1: Manajemen Mitra Sekolah (Tenant Management)
Super Admin perlu menambahkan dan memanajemen sekolah-sekolah yang mendaftar ke layanan AkademiData.
- **User Story 1.1**: Sebagai Super Admin, saya ingin mendaftarkan institusi sekolah baru, sehingga sistem dapat men-generate `id_sekolah` (Tenant ID) unik untuk mereka.
- **User Story 1.2**: Sebagai Super Admin, saya ingin membuatkan satu akun "Admin Sekolah" utama yang langsung terikat ke `id_sekolah` baru tersebut.
- **User Story 1.3**: Sebagai Super Admin, saya ingin menonaktifkan (*suspend*) akses suatu sekolah jika masa berlangganannya telah habis.
- **User Story 1.4**: Sebagai Super Admin, saya ingin mengatur *limit* kuota pendaftaran siswa per sekolah.

### Epic 2: Konfigurasi Sandbox Database Global
Karena platform ini menjalankan SQL (Auto-Grader), diperlukan *Sandbox Server* yang aman.
- **User Story 2.1**: Sebagai Super Admin, saya ingin dapat mengatur kredensial koneksi (Host, Port, User, Password) ke Server Database Sandbox secara global.
- **User Story 2.2**: Sebagai Super Admin, saya ingin melakukan *Test Connection* ke server sandbox melalui UI untuk memastikan layanan *Auto-Grader* tidak *down*.
- **User Story 2.3**: Sebagai Super Admin, saya ingin dapat memicu perintah *Rollback* manual untuk membersihkan database sandbox jika memori server penuh.

### Epic 3: Dashboard & Analytics Global
- **User Story 3.1**: Sebagai Super Admin, saya ingin melihat statistik metrik (Total Sekolah, Total Pengguna, Jumlah Eksekusi Query hari ini) dalam bentuk *Chart*.
- **User Story 3.2**: Sebagai Super Admin, saya ingin melihat log aktivitas *Error* (Audit Log) dari seluruh sistem.

---

## 3. Kriteria Penerimaan (Acceptance Criteria)
- Dashboard Super Admin hanya dapat diakses oleh peran (`role = SuperAdmin`).
- Semua *API Route* dalam scope `/api/superadmin/*` dilindungi oleh *middleware* ketat.
- Pembuatan tenant otomatis membuatkan satu baris data di entitas `Sekolah` dan merelasikannya dengan pembuataan satu data di entitas `User` ber-role `AdminSekolah`.

## 4. Batasan & Out of Scope (Tahap Ini)
- Fitur *Billing* & *Payment Gateway* untuk pembayaran langganan SaaS (Belum dikembangkan pada versi 1.0).
