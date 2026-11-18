"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function DashboardGuru() {
  const [userName, setUserName] = useState("Memuat...");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUserName(data.name);
        }
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      }
    };
    fetchProfile();
  }, []);

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 bg-[#F8FAFC]">
      
      {/* Header Dashboard */}
      <div className="bg-[#0D47A1] rounded-sm p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 transform rotate-45 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-10 w-32 h-32 bg-white opacity-5 transform rotate-12 translate-y-1/2"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">Selamat Datang, {userName}!</h1>
          <p className="text-blue-200 text-sm font-medium">
            Pantau perkembangan belajar siswa dan kelola modul pembelajaran dari dashboard ini.
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <Link
            href="/guru/kelas/tambah"
            className="px-4 py-2.5 bg-[#2196F3] hover:bg-[#1976D2] text-white font-bold text-sm rounded-sm shadow-sm transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Buat Kelas Baru
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2196F3] flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Siswa</p>
            <p className="text-2xl font-extrabold text-slate-800">124</p>
          </div>
        </div>
        {/* Stat 2 */}
        <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lulus Ujian</p>
            <p className="text-2xl font-extrabold text-slate-800">45</p>
          </div>
        </div>
        {/* Stat 3 */}
        <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modul Aktif</p>
            <p className="text-2xl font-extrabold text-slate-800">4</p>
          </div>
        </div>
        {/* Stat 4 */}
        <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perlu Penilaian</p>
            <p className="text-2xl font-extrabold text-slate-800">12</p>
          </div>
        </div>
      </div>

    </main>
  );
}
