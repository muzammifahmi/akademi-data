import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import JoinClassForm from './JoinClassForm';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export default async function TampilanUtama() {
  await dbConnect();
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  let userData: any = null;

  if (token) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const user = await User.findById(payload.id).lean();
      if (user) {
        userData = user;
        
        if (userData.kelas && userData.kelas.toString().length === 24) {
           try {
             const Kelas = (await import('@/models/Kelas')).default;
             const kelasDoc = await Kelas.findById(userData.kelas).lean();
             if (kelasDoc) {
               userData.kelas = (kelasDoc as any).nama_kelas;
             }
           } catch (err) {
             console.error("Gagal mengambil nama kelas di dashboard", err);
           }
        }
      }
    } catch (e) {
      console.error("Invalid token", e);
    }
  }

  // Extract initials
  const nameParts = userData?.name ? userData.name.split(' ') : ['Siswa'];
  let initials = nameParts[0].charAt(0).toUpperCase();
  if (nameParts.length > 1) {
    initials += nameParts[1].charAt(0).toUpperCase();
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6 w-full bg-[#F8FAFC] flex flex-col gap-6">
      
      {/* Baris Pertama: Banner Selamat Datang (Selalu Tampil) */}
      <div className="bg-[#0D47A1] rounded-sm p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-white">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-sm flex items-center justify-center text-[#0D47A1] font-bold text-2xl shadow-sm flex-shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Selamat Datang, {userData?.name || 'Siswa'}!</h1>
            <p className="text-blue-100 text-sm font-medium">
              NISN: {userData?.nisn_nip || 'Belum diisi'} • Kelas: {userData?.kelas || 'Belum bergabung'}
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right hidden md:block">
          <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Tahun Ajaran</p>
          <p className="text-white font-bold text-sm">2025/2026 - Ganjil</p>
        </div>
      </div>

      {/* Tampilan Khusus jika Siswa Belum Bergabung ke Kelas */}
      {!userData?.kelas || userData.kelas === 'Belum bergabung' ? (
        <JoinClassForm 
          userName={userData?.name || 'Siswa'} 
          defaultSekolahId={userData?.sekolah_id?.toString() || ""} 
        />
      ) : (
        <>
      {/* Baris Kedua: Ringkasan Seluruh Data Siswa (Grid Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Card 1 */}
        <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rata-rata Nilai</p>
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <p className="text-3xl font-bold text-slate-800">88.5</p>
          <p className="text-xs font-medium text-emerald-600 mt-1">↑ 2.5 dari rata-rata kelas</p>
        </div>
        
        {/* Card 2 */}
        <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tugas Selesai</p>
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <p className="text-3xl font-bold text-slate-800">10 <span className="text-lg text-slate-400 font-medium">/ 12</span></p>
          <p className="text-xs font-medium text-slate-500 mt-1">Total tugas ditugaskan</p>
        </div>

        {/* Card 3 (Tertunda) */}
        <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tugas Tertunda</p>
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-3xl font-bold text-rose-600">2</p>
          <p className="text-xs font-medium text-slate-500 mt-1">Segera kerjakan ujian aktif!</p>
        </div>

        {/* Card 4 (Integritas) */}
        <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Skor Integritas</p>
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <p className="text-3xl font-bold text-slate-800">95%</p>
          <p className="text-xs font-medium text-rose-600 mt-1">1 Pelanggaran Proctoring</p>
        </div>
      </div>

      {/* Layout 2 Kolom (Bawah) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full mb-4">
        
        {/* Kolom Kiri (Makan 2 Bagian): Tabel Ujian & Riwayat */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Tabel Ujian Aktif */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col w-full">
            <div className="px-5 py-4 border-b border-slate-200 bg-white">
              <h2 className="text-base font-bold text-slate-800">Tugas & Ujian Aktif</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                    <th className="px-5 py-3 font-semibold uppercase tracking-wider">Judul Evaluasi</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wider">Materi</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wider">Batas Waktu</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-800">Ujian Tengah Semester (Praktik SQL)</td>
                    <td className="px-5 py-4 text-slate-600">DML & DDL Dasar</td>
                    <td className="px-5 py-4 text-slate-600">25 Sep 2026, 12:00 WIB</td>
                    <td className="px-5 py-4 text-right">
                      <button className="bg-[#2196F3] hover:bg-[#1976D2] text-white px-4 py-2 font-medium rounded-lg transition-colors text-xs shadow-sm inline-flex items-center gap-1">
                        MULAI UJIAN
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                    <td className="px-5 py-4 font-semibold text-slate-800">Tugas Mandiri 3: Fungsi Agregasi</td>
                    <td className="px-5 py-4 text-slate-600">GROUP BY, HAVING</td>
                    <td className="px-5 py-4 text-slate-600">30 Sep 2026, 23:59 WIB</td>
                    <td className="px-5 py-4 text-right">
                      <button className="bg-[#2196F3] hover:bg-[#1976D2] text-white px-4 py-2 font-medium rounded-lg transition-colors text-xs shadow-sm inline-flex items-center gap-1">
                        KERJAKAN
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabel Riwayat Nilai */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col w-full">
            <div className="px-5 py-4 border-b border-slate-200 bg-white">
              <h2 className="text-base font-bold text-slate-800">Riwayat Evaluasi (Selesai)</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                    <th className="px-5 py-3 font-semibold uppercase tracking-wider">Judul Evaluasi</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wider">Tanggal Selesai</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wider">Peringatan Proctoring</th>
                    <th className="px-5 py-3 font-semibold uppercase tracking-wider text-right">Skor (Auto-Grader)</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-800">Tugas Mandiri 2: Joins (Inner, Left, Right)</td>
                    <td className="px-5 py-4 text-slate-600">18 Sep 2026</td>
                    <td className="px-5 py-4">
                      <span className="text-emerald-700 font-semibold text-xs bg-emerald-50 px-2.5 py-1 rounded-sm border border-emerald-200">
                        Bersih (0 Pelanggaran)
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-bold text-base text-slate-800">90</span> <span className="text-slate-500 font-medium">/ 100</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-800">Tugas Mandiri 1: Pembuatan Tabel & Relasi</td>
                    <td className="px-5 py-4 text-slate-600">10 Sep 2026</td>
                    <td className="px-5 py-4">
                      <span className="text-rose-700 font-semibold text-xs bg-rose-50 px-2.5 py-1 rounded-sm border border-rose-200">
                        1x Keluar Fullscreen
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-bold text-base text-slate-800">85</span> <span className="text-slate-500 font-medium">/ 100</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Kolom Kanan (Makan 1 Bagian): Pengumuman */}
        <div className="xl:col-span-1 flex flex-col">
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col h-full">
            <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">Pengumuman Kelas</h2>
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </div>
            <div className="p-0 flex-1 overflow-y-auto">
              
              {/* Item Pengumuman 1 */}
              <div className="p-5 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <p className="text-xs font-semibold text-[#2196F3] uppercase tracking-wider mb-1">Penting • Hari Ini</p>
                <h3 className="font-semibold text-slate-800 mb-1">Jadwal Ujian Tengah Semester</h3>
                <p className="text-sm text-slate-600">Harap persiapkan diri Anda untuk UTS besok. Pastikan laptop dan webcam berfungsi dengan baik karena sistem proctoring akan diaktifkan.</p>
              </div>
              
              {/* Item Pengumuman 2 */}
              <div className="p-5 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">20 Sep 2026</p>
                <h3 className="font-semibold text-slate-800 mb-1">Modul Praktik Baru Ditambahkan</h3>
                <p className="text-sm text-slate-600">Modul mengenai Fungsi Agregasi SQL (GROUP BY, HAVING) sudah dapat diakses di menu Modul Pembelajaran. Silakan dipelajari.</p>
              </div>
              
              {/* Item Pengumuman 3 */}
              <div className="p-5 hover:bg-slate-50 transition-colors">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">15 Sep 2026</p>
                <h3 className="font-semibold text-slate-800 mb-1">Maintenance Auto-Grader</h3>
                <p className="text-sm text-slate-600">Sistem penilaian otomatis (Auto-Grader) akan mengalami perbaikan pada hari Sabtu malam selama kurang lebih 2 jam. Hindari mengerjakan tugas pada jam tersebut.</p>
              </div>

            </div>
          </div>
        </div>

        </div>
        </>
      )}

    </main>
  );
}
