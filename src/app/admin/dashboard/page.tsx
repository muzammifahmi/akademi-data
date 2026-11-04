"use client";

export default function DashboardAdmin() {
  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 bg-[#F8FAFC]">
      
      {/* Header Dashboard */}
      <div className="bg-[#0D47A1] rounded-sm p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 transform rotate-45 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-10 w-32 h-32 bg-white opacity-5 transform rotate-12 translate-y-1/2"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">Dashboard Admin Sekolah</h1>
          <p className="text-blue-100 text-sm font-medium">
            Kelola data master internal, pengguna, dan pengaturan institusi Anda di sini.
          </p>
        </div>
      </div>

      {/* Stats Cards (PRD: Total Guru, Total Siswa, Total Jurusan) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Guru</p>
            <p className="text-2xl font-extrabold text-slate-800">
              45
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Siswa Aktif</p>
            <p className="text-2xl font-extrabold text-slate-800">
              407
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Jurusan</p>
            <p className="text-2xl font-extrabold text-slate-800">
              4
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quick Actions */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-sm hover:bg-blue-50 hover:border-blue-200 transition-colors group">
              <div className="w-10 h-10 bg-blue-100 text-[#2196F3] rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </div>
              <span className="text-sm font-semibold text-slate-700">Tambah Pengguna</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-sm hover:bg-emerald-50 hover:border-emerald-200 transition-colors group">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              </div>
              <span className="text-sm font-semibold text-slate-700">Unggah Massal</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-sm hover:bg-amber-50 hover:border-amber-200 transition-colors group">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              </div>
              <span className="text-sm font-semibold text-slate-700">Reset Password</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-sm hover:bg-indigo-50 hover:border-indigo-200 transition-colors group">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <span className="text-sm font-semibold text-slate-700">Pengaturan Jurusan</span>
            </button>
          </div>
        </div>

        {/* Informasi Sistem */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col h-full">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">Informasi Institusi</h2>
          </div>
          <div className="p-6 flex flex-col gap-4 flex-1">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <span className="text-sm text-slate-500 font-medium">Tahun Ajaran Aktif</span>
              <span className="text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-sm">Ganjil 2026/2027</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <span className="text-sm text-slate-500 font-medium">Kuota Siswa (Sisa)</span>
              <span className="text-sm font-bold text-slate-800">93 dari 500</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 font-medium">Status Lisensi Tenant</span>
              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active
              </span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
