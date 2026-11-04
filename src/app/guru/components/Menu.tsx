"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface MenuProps {
  isSidebarOpen: boolean;
}

export default function Menu({ isSidebarOpen }: MenuProps) {
  const pathname = usePathname();

  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    utama: true,
    pembelajaran: true,
    manajemen: true,
    laporan: true,
  });

  const toggleDropdown = (key: string) => {
    if (!isSidebarOpen) return; // Nonaktifkan klik dropdown jika sidebar sedang ditutup
    setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isActive = (path: string) => {
    return pathname?.startsWith(path);
  };

  const activeClass = "bg-[#2196F3] text-white shadow-sm";
  const inactiveClass = "text-white/80 hover:bg-[#2196F3]/30 hover:text-white";

  const getLinkClass = (path: string) => {
    return `flex items-center p-3 rounded-sm transition-colors ${
      isSidebarOpen ? "gap-4 justify-start" : "justify-center"
    } ${isActive(path) ? activeClass : inactiveClass}`;
  };

  return (
    <aside className={`absolute lg:relative z-30 h-full bg-[#0D47A1] text-white flex flex-col transition-all duration-300 ease-in-out shadow-xl ${isSidebarOpen ? 'translate-x-0 w-64 lg:w-72' : '-translate-x-full lg:translate-x-0 lg:w-20'}`}>
        
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center border-b border-[#2196F3]/40 bg-[#0D47A1] flex-shrink-0">
        {isSidebarOpen ? (
          <div className="flex items-center gap-3 w-full px-6">
            <div className="w-8 h-8 bg-white flex-shrink-0 flex items-center justify-center text-[#0D47A1] font-bold text-lg rounded-sm shadow-sm">
              AD
            </div>
            <span className="font-bold text-xl tracking-wide truncate">Portal Guru</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-white flex-shrink-0 flex items-center justify-center text-[#0D47A1] font-bold text-lg rounded-sm shadow-sm">
            AD
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-[#2196F3] scrollbar-track-transparent">
        
        {/* Kategori 1: Utama */}
        <div className="mb-4">
          {isSidebarOpen ? (
            <button 
              onClick={() => toggleDropdown('utama')}
              className="w-full flex items-center justify-between px-6 mb-2 text-[#90CAF9] hover:text-white transition-colors"
            >
              <span className="text-xs font-bold uppercase tracking-wider">Utama</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${openDropdowns.utama ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
          ) : (
            <div className="w-8 h-px bg-[#2196F3]/50 mx-auto mb-2 mt-4"></div>
          )}
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen && !openDropdowns.utama ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}>
            <ul className="space-y-1 px-3">
              <li>
                <Link href="/guru/dashboard" className={getLinkClass("/guru/dashboard")}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  {isSidebarOpen && <span className="font-semibold text-sm whitespace-nowrap">Dashboard</span>}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Kategori 2: Pembelajaran */}
        <div className="mb-4">
          {isSidebarOpen ? (
            <button 
              onClick={() => toggleDropdown('pembelajaran')}
              className="w-full flex items-center justify-between px-6 mb-2 text-[#90CAF9] hover:text-white transition-colors"
            >
              <span className="text-xs font-bold uppercase tracking-wider">Pembelajaran</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${openDropdowns.pembelajaran ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
          ) : (
            <div className="w-8 h-px bg-[#2196F3]/50 mx-auto mb-2 mt-4"></div>
          )}
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen && !openDropdowns.pembelajaran ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}>
            <ul className="space-y-1 px-3">
              <li>
                <Link href="/guru/modul" className={getLinkClass("/guru/modul")}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Kelola Modul</span>}
                </Link>
              </li>
              <li>
                <Link href="/guru/ujian" className={getLinkClass("/guru/ujian")}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Kelola Ujian</span>}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Kategori 3: Manajemen Kelas */}
        <div className="mb-4">
          {isSidebarOpen ? (
            <button 
              onClick={() => toggleDropdown('manajemen')}
              className="w-full flex items-center justify-between px-6 mb-2 text-[#90CAF9] hover:text-white transition-colors"
            >
              <span className="text-xs font-bold uppercase tracking-wider">Manajemen</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${openDropdowns.manajemen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
          ) : (
            <div className="w-8 h-px bg-[#2196F3]/50 mx-auto mb-2 mt-4"></div>
          )}
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen && !openDropdowns.manajemen ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}>
            <ul className="space-y-1 px-3">
              <li>
                <Link href="/guru/kelas" className={getLinkClass("/guru/kelas")}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Kelola Kelas</span>}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Kategori 4: Laporan & Evaluasi */}
        <div className="mb-4">
          {isSidebarOpen ? (
            <button 
              onClick={() => toggleDropdown('laporan')}
              className="w-full flex items-center justify-between px-6 mb-2 text-[#90CAF9] hover:text-white transition-colors"
            >
              <span className="text-xs font-bold uppercase tracking-wider">Laporan</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${openDropdowns.laporan ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
          ) : (
            <div className="w-8 h-px bg-[#2196F3]/50 mx-auto mb-2 mt-4"></div>
          )}
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen && !openDropdowns.laporan ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}>
            <ul className="space-y-1 px-3">
              <li>
                <Link href="/guru/nilai" className={getLinkClass("/guru/nilai")}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Rekap Nilai</span>}
                </Link>
              </li>
              <li>
                <Link href="/guru/riwayat" className={getLinkClass("/guru/riwayat")}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Riwayat (History)</span>}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </aside>
  );
}
