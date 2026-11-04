"use client";

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Dekorasi Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl opacity-50 transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-100 rounded-full blur-3xl opacity-50 transform -translate-x-1/4 translate-y-1/4 pointer-events-none"></div>

      <div className="text-center max-w-md relative z-10">
        
        {/* Ikon 404 */}
        <div className="flex justify-center mb-6 text-[#0D47A1]">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center border-8 border-white shadow-sm">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        
        {/* Teks 404 */}
        <h1 className="text-7xl font-extrabold text-[#0D47A1] tracking-tight mb-2">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Halaman Tidak Ditemukan</h2>
        
        <p className="text-slate-500 mb-8 leading-relaxed">
          Maaf, halaman yang Anda cari mungkin telah dihapus, namanya diubah, atau tidak pernah ada di dalam sistem.
        </p>
        
        {/* Tombol Aksi */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            href="/siswa/dashboard" 
            className="px-6 py-3 bg-[#0D47A1] hover:bg-[#1565C0] text-white font-semibold rounded-sm transition-colors shadow-sm"
          >
            Ke Dashboard
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold rounded-sm transition-colors shadow-sm"
          >
            Kembali
          </button>
        </div>
      </div>
      
      {/* Footer Text */}
      <div className="absolute bottom-6 text-center text-xs text-slate-400 font-medium w-full pointer-events-none">
        &copy; {new Date().getFullYear()} AkademiData - Sistem Auto Grader SQL
      </div>
      
    </div>
  );
}
