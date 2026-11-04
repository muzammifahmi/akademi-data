"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

export default function DaftarSekolah() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sekolahs, setSekolahs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSekolah = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/sekolah');
      const data = await res.json();
      if (res.ok) {
        setSekolahs(data.data);
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data.error || 'Gagal mengambil data' });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Kesalahan', text: 'Gagal menghubungi server' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSekolah();
  }, []);

  // Filter pencarian
  const filteredSekolah = sekolahs.filter(s => 
    s.nama_sekolah.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.npsn.includes(searchTerm)
  );

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full bg-[#F8FAFC]">
      <div className="w-full flex flex-col gap-1">
      
      {/* Header Section (Tema Guru) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Aksen Warna Kiri */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2196F3]"></div>
        
        <div>
          <h1 className="text-xl font-bold text-slate-800">Manajemen Mitra Sekolah</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Kelola daftar institusi, status lisensi, dan kuota siswa.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export CSV
          </button>
          <Link href="/superadmin/sekolah/tambah" className="px-4 py-2.5 bg-[#2196F3] text-white font-medium rounded-lg hover:bg-[#1976D2] transition-all shadow-sm shadow-blue-500/20 flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Tambah Sekolah
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-sm border border-slate-200/60 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div className="text-sm font-semibold text-slate-500 mb-1">Total Sekolah Aktif</div>
          <div className="text-3xl font-bold text-slate-800">124</div>
          <div className="text-xs text-emerald-500 mt-2 font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            +12 bulan ini
          </div>
        </div>
        <div className="bg-white p-6 rounded-sm border border-slate-200/60 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div className="text-sm font-semibold text-slate-500 mb-1">Total Pengguna (Global)</div>
          <div className="text-3xl font-bold text-slate-800">45,210</div>
          <div className="text-xs text-emerald-500 mt-2 font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            +1,200 bulan ini
          </div>
        </div>
        <div className="bg-white p-6 rounded-sm border border-slate-200/60 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div className="text-sm font-semibold text-slate-500 mb-1">Sekolah Suspended</div>
          <div className="text-3xl font-bold text-slate-800">3</div>
          <div className="text-xs text-rose-500 mt-2 font-medium flex items-center gap-1">
            Perlu tindak lanjut langganan
          </div>
        </div>
      </div>

      {/* Main Content / Table */}
      <div className="bg-white border border-slate-200/60 rounded-sm shadow-sm overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
              type="text" 
              placeholder="Cari ID atau Nama Sekolah..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#2196F3] text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-700">Filter:</span>
            <select className="border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3]/50">
              <option value="all">Semua Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                <th className="px-6 py-4 font-semibold text-slate-600 whitespace-nowrap">Tenant ID</th>
                <th className="px-6 py-4 font-semibold text-slate-600 whitespace-nowrap">Institusi Sekolah</th>
                <th className="px-6 py-4 font-semibold text-slate-600 whitespace-nowrap">Admin Utama</th>
                <th className="px-6 py-4 font-semibold text-slate-600 whitespace-nowrap text-center">Status Lisensi</th>
                <th className="px-6 py-4 font-semibold text-slate-600 whitespace-nowrap text-center">Kuota (Terpakai/Total)</th>
                <th className="px-6 py-4 font-semibold text-slate-600 whitespace-nowrap text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <svg className="animate-spin h-8 w-8 text-[#2196F3]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span>Memuat data sekolah...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSekolah.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">Belum Ada Institusi Terdaftar</h3>
                      <p className="text-slate-500 text-sm mt-1 mb-4 max-w-sm">Tambahkan tenant sekolah baru untuk membuatkan mereka id_sekolah dan akun admin utama.</p>
                      <Link href="/superadmin/sekolah/tambah" className="px-4 py-2 bg-[#2196F3] text-white font-medium rounded-lg hover:bg-[#1976D2] transition-colors shadow-sm">
                        + Daftarkan Sekolah
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSekolah.map((sekolah, index) => (
                <tr key={index} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">
                    <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200/60 font-mono text-xs" title={sekolah.npsn}>NPSN-{sekolah.npsn}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{sekolah.nama_sekolah}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-500 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      {sekolah.admin_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="text-xs font-medium text-slate-600">Tidak Terbatas</div>
                      <div className="w-24 h-1.5 bg-emerald-100 rounded-full overflow-hidden border border-emerald-200/50">
                        <div 
                          className="h-full rounded-full bg-emerald-500" 
                          style={{ width: '100%' }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/superadmin/sekolah/detail/${sekolah.npsn}`} className="p-2 text-slate-500 hover:text-[#2196F3] hover:bg-blue-50 rounded-lg transition-colors tooltip-trigger" title="Lihat Detail">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
          
          {/* Note: Empty state is now handled inside the tbody above */}
        </div>
        
        {/* Pagination Placeholder */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50/30">
          <div>Menampilkan {filteredSekolah.length > 0 ? 1 : 0} hingga {filteredSekolah.length} dari {sekolahs.length} institusi</div>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-50" disabled>Sebelumnnya</button>
            <button className="px-3 py-1.5 bg-[#2196F3] text-white rounded-md">1</button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-100">2</button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-100">3</button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-100">Selanjutnya</button>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
