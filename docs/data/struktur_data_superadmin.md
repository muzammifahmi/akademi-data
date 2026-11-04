# Struktur Data: Modul Super Admin

Modul Super Admin bertanggung jawab atas pengelolaan arsitektur Multi-Tenant, termasuk konfigurasi institusi klien (sekolah) dan *environment* sandbox database global.

## 1. Entitas `Sekolah` (Tenant)
Merepresentasikan institusi yang berlangganan pada layanan AkademiData.
- **id** (UUID/String): Primary Key, Identifier unik tenant (`id_sekolah`).
- **nama_sekolah** (String): Nama resmi institusi sekolah (mis. "SMKN 1 Jakarta").
- **alamat** (Text): Alamat lengkap sekolah.
- **kontak_email** (String): Email representatif pihak sekolah.
- **kontak_telepon** (String): Nomor telepon representatif.
- **status_lisensi** (Enum: `Active`, `Suspended`, `Expired`): Status akses tenant ke sistem.
- **kuota_siswa** (Integer): Batas maksimal akun siswa yang bisa didaftarkan oleh sekolah ini.
- **created_at** (Timestamp): Waktu institusi didaftarkan.
- **updated_at** (Timestamp): Waktu data diperbarui.

## 2. Entitas `Database Sandbox Global`
Menyimpan konfigurasi server database terisolasi untuk eksekusi query *Auto-Grader*.
- **id** (UUID/String): Primary Key.
- **nama_server** (String): Alias dari server (mis. "Sandbox Node A").
- **host_db** (String): Alamat IP / Host server SQL.
- **port_db** (Integer): Port koneksi (mis. 3306 atau 5432).
- **username** (String): Kredensial username SQL.
- **password** (String): Kredensial password SQL (Enkripsi).
- **status_koneksi** (Enum: `Connected`, `Down`, `Maintenance`): Status kesehatan server.
- **current_load** (Decimal/Integer): Persentase beban komputasi/RAM (untuk load balancing).
- **created_at** (Timestamp).

## 3. Entitas `Audit_Log_Global` (Opsional)
Mencatat seluruh aksi kritikal dalam sistem untuk kebutuhan pelacakan dan keamanan (System Log).
- **id** (UUID/String): Primary Key.
- **aktor_id** (UUID/String): Mengacu pada `id` User (Super Admin).
- **aksi** (String): Nama aksi (mis. "SUSPEND_TENANT", "UPDATE_SANDBOX").
- **deskripsi** (Text): Detail rincian aksi.
- **timestamp** (Timestamp): Waktu kejadian log.
