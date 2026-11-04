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
    mitra: true,
    konfigurasi: true,
    sistem: true,
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
            <span className="font-bold text-xl tracking-wide truncate">Portal Superadmin</span>
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
                <Link href="/superadmin/dashboard" className={getLinkClass("/superadmin/dashboard")}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  {isSidebarOpen && <span className="font-semibold text-sm whitespace-nowrap">Dashboard</span>}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Kategori 2: Manajemen Mitra */}
        <div className="mb-4">
          {isSidebarOpen ? (
            <button 
              onClick={() => toggleDropdown('mitra')}
              className="w-full flex items-center justify-between px-6 mb-2 text-[#90CAF9] hover:text-white transition-colors"
            >
              <span className="text-xs font-bold uppercase tracking-wider">Manajemen Mitra</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${openDropdowns.mitra ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
          ) : (
            <div className="w-8 h-px bg-[#2196F3]/50 mx-auto mb-2 mt-4"></div>
          )}
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen && !openDropdowns.mitra ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}>
            <ul className="space-y-1 px-3">
              <li>
                <Link href="/superadmin/sekolah" className={getLinkClass("/superadmin/sekolah")}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Daftar Sekolah</span>}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Kategori 3: Konfigurasi */}
        <div className="mb-4">
          {isSidebarOpen ? (
            <button 
              onClick={() => toggleDropdown('konfigurasi')}
              className="w-full flex items-center justify-between px-6 mb-2 text-[#90CAF9] hover:text-white transition-colors"
            >
              <span className="text-xs font-bold uppercase tracking-wider">Konfigurasi</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${openDropdowns.konfigurasi ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
          ) : (
            <div className="w-8 h-px bg-[#2196F3]/50 mx-auto mb-2 mt-4"></div>
          )}
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen && !openDropdowns.konfigurasi ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}>
            <ul className="space-y-1 px-3">
              <li>
                <Link href="/superadmin/sandbox" className={getLinkClass("/superadmin/sandbox")}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
                  {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Database Sandbox</span>}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Kategori 4: Sistem */}
        <div className="mb-4">
          {isSidebarOpen ? (
            <button 
              onClick={() => toggleDropdown('sistem')}
              className="w-full flex items-center justify-between px-6 mb-2 text-[#90CAF9] hover:text-white transition-colors"
            >
              <span className="text-xs font-bold uppercase tracking-wider">Sistem</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${openDropdowns.sistem ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
          ) : (
            <div className="w-8 h-px bg-[#2196F3]/50 mx-auto mb-2 mt-4"></div>
          )}
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen && !openDropdowns.sistem ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}>
            <ul className="space-y-1 px-3">
              <li>
                <Link href="/superadmin/audit-log" className={getLinkClass("/superadmin/audit-log")}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Audit Log</span>}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </aside>
  );
}
