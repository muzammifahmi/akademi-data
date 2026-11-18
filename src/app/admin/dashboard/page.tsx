"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardAdmin() {
  const [sekolahs, setSekolahs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    total_sekolah: 0,
    total_guru: 0,
    total_siswa: 0,
    total_pengguna: 0,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sekolah")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setSekolahs(d.data);
        if (d.analytics) setAnalytics(d.analytics);
      })
      .catch(() => {});
  }, []);

  const totalSekolah = analytics.total_sekolah || sekolahs.length;
  const totalGuru = analytics.total_guru || 0;
  const totalSiswa = analytics.total_siswa || 0;
  const totalPengguna = analytics.total_pengguna ?? totalGuru + totalSiswa;

  const copyToken = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 bg-[#F8FAFC]">
      {/* Header Dashboard */}
      <div className="bg-[#0D47A1] rounded-sm p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 transform rotate-45 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-10 w-32 h-32 bg-white opacity-5 transform rotate-12 translate-y-1/2"></div>

        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">Dashboard Portal Admin</h1>
          <p className="text-blue-100 text-sm font-medium">
            Pantau analitik jumlah sekolah, guru, siswa, dan total pengguna, serta kelola Token Sekolah.
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <Link
            href="/admin/sekolah/tambah"
            className="px-4 py-2.5 bg-[#2196F3] hover:bg-[#1976D2] text-white font-bold text-sm rounded-sm shadow-sm transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Daftarkan Sekolah &amp; Buat Token
          </Link>
        </div>
      </div>

      {/* Analitik Cards: Jumlah Sekolah, Guru, Siswa, dan Total Pengguna */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Jumlah Sekolah */}
        <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2196F3] flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah Sekolah</p>
            <p className="text-2xl font-extrabold text-slate-800">{totalSekolah}</p>
          </div>
        </div>

        {/* 2. Jumlah Guru */}
        <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah Guru</p>
            <p className="text-2xl font-extrabold text-slate-800">{totalGuru}</p>
          </div>
        </div>

        {/* 3. Jumlah Siswa */}
        <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah Siswa</p>
            <p className="text-2xl font-extrabold text-slate-800">{totalSiswa}</p>
          </div>
        </div>

        {/* 4. Total Pengguna */}
        <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengguna</p>
            <p className="text-2xl font-extrabold text-slate-800">{totalPengguna}</p>
          </div>
        </div>
      </div>

      {/* Daftar Sekolah & Token Registrasi Guru */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Daftar Sekolah &amp; Token Registrasi Guru
            </h2>
            <p className="text-xs text-slate-500">
              Ringkasan jumlah Guru &amp; Siswa serta Token Sekolah unik untuk setiap institusi terdaftar.
            </p>
          </div>
          <Link href="/admin/sekolah" className="text-xs font-bold text-[#2196F3] hover:underline">
            Kelola Semua Sekolah &rarr;
          </Link>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {sekolahs.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8 text-slate-500 text-sm">
              <p>Belum ada sekolah yang terdaftar.</p>
              <Link
                href="/admin/sekolah/tambah"
                className="mt-2 px-3 py-1.5 bg-[#2196F3] text-white text-xs font-semibold rounded-sm hover:bg-[#1976D2]"
              >
                + Daftarkan Sekolah Pertama
              </Link>
            </div>
          ) : (
            sekolahs.slice(0, 6).map((s) => (
              <div
                key={s._id || s.npsn}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-sm border border-slate-200/80 bg-slate-50/60"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/sekolah/detail/${s.npsn}`}
                    className="text-sm font-bold text-slate-800 hover:text-[#2196F3] transition-colors truncate block"
                  >
                    {s.nama_sekolah}
                  </Link>
                  <div className="text-xs text-slate-500">NPSN: {s.npsn}</div>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <span className="px-2.5 py-1 rounded-sm bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
                    {s.jumlah_guru || 0} Guru
                  </span>
                  <span className="px-2.5 py-1 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                    {s.jumlah_siswa || 0} Siswa
                  </span>
                  <span className="px-2.5 py-1 bg-blue-50 text-[#0D47A1] border border-blue-200 rounded-sm font-mono text-xs font-bold tracking-wider select-all">
                    {s.token_sekolah}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToken(s.token_sekolah, s.npsn)}
                    className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 hover:border-[#2196F3] text-slate-600 hover:text-[#2196F3] rounded-sm transition-colors cursor-pointer"
                  >
                    {copiedId === s.npsn ? "Tersalin" : "Salin Token"}
                  </button>
                  <Link
                    href={`/admin/sekolah/detail/${s.npsn}`}
                    className="px-2.5 py-1 text-xs font-semibold bg-[#2196F3] text-white hover:bg-[#1976D2] rounded-sm transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
