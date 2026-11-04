"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function KelolaKelas() {
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/kelas')
      .then(async (res) => {
        const text = await res.text();
        if (!text) {
          throw new Error(`Empty response from server (status: ${res.status})`);
        }
        try {
          const data = JSON.parse(text);
          return { res, data };
        } catch (e) {
          console.error("Failed to parse JSON. Response text:", text);
          throw new Error("Invalid JSON from server");
        }
      })
      .then(({ res, data }) => {
        if (data.success && data.data) {
          setClasses(data.data);
        } else {
          console.error("API Error:", data.error);
        }
      })
      .catch(err => {
        console.error("Fetch Kelas Error:", err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleCopy = (e: React.MouseEvent, kode: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(kode);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Kode kelas berhasil disalin!',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
      
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Kelas</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau perkembangan siswa dan kelola modul untuk kelas yang diampu.</p>
        </div>
      </div>

      {/* Filter / Pencarian */}
      <div className="bg-white p-4 rounded-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <input 
            type="text" 
            placeholder="Cari nama kelas atau mata pelajaran..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#2196F3]/50 focus:border-[#2196F3] text-sm"
          />
          <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select className="border border-slate-300 rounded-sm px-4 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#2196F3]/50 bg-white w-full sm:w-auto">
            <option>Semua Angkatan</option>
            <option>Kelas X</option>
            <option>Kelas XI</option>
            <option>Kelas XII</option>
          </select>
        </div>
      </div>

      {/* Grid Kelas */}
      {isLoading ? (
        <div className="text-center py-10 text-slate-500">Memuat data kelas...</div>
      ) : classes.length === 0 ? (
        <div className="text-center py-10 text-slate-500 bg-white border border-slate-200 rounded-sm">
          Belum ada kelas yang ditugaskan kepada Anda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <Link href={`/guru/kelas/${cls.id}`} key={cls.id} className="bg-white border border-slate-200 rounded-sm overflow-hidden hover:border-[#2196F3] transition-colors group flex flex-col cursor-pointer block">
              
              {/* Card Header (Warna Tema) */}
              <div className="h-2 w-full bg-[#2196F3]"></div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="overflow-hidden">
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#0D47A1] transition-colors truncate">{cls.nama}</h3>
                    <p className="text-sm font-medium text-slate-500 truncate">Mata Pelajaran Umum</p>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 p-1 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                  </button>
                </div>

                {/* Info Kelas (Siswa & Modul) */}
                <div className="grid grid-cols-2 gap-4 mb-5 bg-slate-50 p-3 rounded-sm border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Total Siswa</p>
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#2196F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      {cls.jumlahSiswa || 0} Siswa
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Modul Aktif</p>
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#2196F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      {cls.modulAktif || 0} Modul
                    </p>
                  </div>
                </div>

                {/* Kode Kelas */}
                <div className="mt-auto mb-5">
                  <p className="text-xs text-slate-500 font-medium mb-1.5">Kode Kelas (Bagikan ke siswa)</p>
                  <div className="flex items-center border border-slate-200 rounded-sm overflow-hidden bg-slate-100">
                    <code className="flex-1 text-slate-700 px-3 py-1.5 text-sm font-mono tracking-wider font-bold truncate">
                      {cls.kodeKelas}
                    </code>
                    <button 
                      onClick={(e) => handleCopy(e, cls.kodeKelas)}
                      className="bg-slate-200 hover:bg-slate-300 border-l border-slate-200 text-slate-600 px-3 py-2 transition-colors flex items-center justify-center" 
                      title="Salin Kode"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    </button>
                  </div>
                </div>

              </div>
              
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
