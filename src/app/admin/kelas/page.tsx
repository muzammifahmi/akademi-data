"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DaftarKelas() {
  const [kelasData, setKelasData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/kelas')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setKelasData(res.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kelas "${nama}"?`)) return;
    try {
      const res = await fetch(`/api/kelas/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setKelasData(prev => prev.filter(k => k.id !== id));
      } else {
        alert(data.error || 'Gagal menghapus kelas');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan sistem');
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full bg-[#F8FAFC]">
      <div className="w-full flex flex-col gap-1">
        
        {/* Breadcrumb */}
        <div className="mb-4 text-sm font-medium text-slate-500 flex items-center gap-2">
          <Link href="/admin/dashboard" className="hover:text-[#2196F3] transition-colors">
            Utama
          </Link>
          <span>&gt;</span>
          <span className="text-slate-800">Daftar Kelas</span>
        </div>

        {/* Header Card (Tanpa Bayangan) */}
        <div className="mb-6 bg-white p-5 rounded-sm border border-slate-200 border-l-4 border-l-[#2196F3] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Daftar Kelas</h1>
            <p className="text-slate-500 mt-1.5 text-[15px]">
              Kelola daftar kelas, guru pengampu, serta kode unik pendaftaran siswa.
            </p>
          </div>
          <div>
            <Link 
              href="/admin/kelas/tambah"
              className="px-4 py-2.5 bg-[#2196F3] text-white font-medium rounded-lg hover:bg-[#1976D2] transition-all flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Tambah Kelas Baru
            </Link>
          </div>
        </div>

        {/* Table & Search Container (Satu Kesatuan, Tanpa Bayangan) */}
        <div className="bg-white border border-slate-200 rounded-sm w-full overflow-hidden flex flex-col">
          
          {/* Action Bar (Search & Filter) */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <input 
                type="text" 
                placeholder="Cari nama kelas atau kode..."
                className="w-full border border-slate-200 rounded-lg bg-slate-50 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:bg-white transition-all"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-600">
                  <th className="border-b border-r border-slate-200 px-5 py-3.5 font-semibold uppercase tracking-wider w-[20%]">Nama Kelas</th>
                  <th className="border-b border-r border-slate-200 px-5 py-3.5 font-semibold uppercase tracking-wider w-[15%] text-center">Kode Kelas</th>
                  <th className="border-b border-r border-slate-200 px-5 py-3.5 font-semibold uppercase tracking-wider w-[25%]">Wali / Pengampu</th>
                  <th className="border-b border-r border-slate-200 px-5 py-3.5 font-semibold uppercase tracking-wider w-[15%] text-center">Jml Siswa</th>
                  <th className="border-b border-r border-slate-200 px-5 py-3.5 font-semibold uppercase tracking-wider w-[10%] text-center">Status</th>
                  <th className="border-b border-slate-200 px-5 py-3.5 font-semibold uppercase tracking-wider w-[15%] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="border-b border-slate-200 px-5 py-8 text-center text-slate-500">
                      Memuat data kelas...
                    </td>
                  </tr>
                ) : kelasData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border-b border-slate-200 px-5 py-8 text-center text-slate-500">
                      Belum ada data kelas yang ditambahkan.
                    </td>
                  </tr>
                ) : (
                  kelasData.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="border-b border-r border-slate-200 px-5 py-4 font-semibold text-slate-800">
                        {item.nama}
                      </td>
                      <td className="border-b border-r border-slate-200 px-5 py-4 text-center">
                        <span className="font-mono bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-sm text-xs font-bold tracking-widest cursor-copy" title="Salin Kode Kelas">
                          {item.kodeKelas}
                        </span>
                      </td>
                      <td className="border-b border-r border-slate-200 px-5 py-4 text-slate-600 font-medium">
                        {item.guruPengampu}
                      </td>
                      <td className="border-b border-r border-slate-200 px-5 py-4 text-center">
                        <span className="font-bold text-slate-800">{item.jumlahSiswa}</span> <span className="text-slate-400">/ 40</span>
                      </td>
                      <td className="border-b border-r border-slate-200 px-5 py-4 text-center">
                        <span className="text-emerald-700 font-semibold text-xs bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          {item.status || "Aktif"}
                        </span>
                      </td>
                      <td className="border-b border-slate-200 px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/admin/kelas/${item.id}`} className="p-2 text-slate-400 hover:text-[#2196F3] hover:bg-blue-50 rounded-md transition-colors inline-block" title="Lihat Kelas">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                          </Link>
                          <button onClick={() => handleDelete(item.id, item.nama)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors" title="Hapus Kelas">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer Tabel */}
          <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
            <span>Menampilkan {kelasData.length} kelas</span>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-slate-200 rounded-sm bg-white text-slate-400 cursor-not-allowed">Sebelumnya</button>
              <button className="px-3 py-1 border border-[#2196F3] rounded-sm bg-[#2196F3] text-white">1</button>
              <button className="px-3 py-1 border border-slate-200 rounded-sm bg-white hover:bg-slate-50 cursor-not-allowed">Selanjutnya</button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
