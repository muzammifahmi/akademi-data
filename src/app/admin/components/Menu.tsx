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
    masterData: true,
    pengguna: true,
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
            <span className="font-bold text-xl tracking-wide truncate">Portal Admin</span>
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
                <Link href="/admin/dashboard" className={getLinkClass("/admin/dashboard")}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  {isSidebarOpen && <span className="font-semibold text-sm whitespace-nowrap">Dashboard</span>}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Kategori 2: Master Data */}
        <div className="mb-4">
          {isSidebarOpen ? (
            <button 
              onClick={() => toggleDropdown('masterData')}
              className="w-full flex items-center justify-between px-6 mb-2 text-[#90CAF9] hover:text-white transition-colors"
            >
              <span className="text-xs font-bold uppercase tracking-wider">Master Data</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${openDropdowns.masterData ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
          ) : (
            <div className="w-8 h-px bg-[#2196F3]/50 mx-auto mb-2 mt-4"></div>
          )}
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen && !openDropdowns.masterData ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}>
            <ul className="space-y-1 px-3">
              <li>
                <Link href="/admin/tahun-ajaran" className={getLinkClass("/admin/tahun-ajaran")}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Tahun Ajaran</span>}
                </Link>
              </li>
              <li>
                <Link href="/admin/kelas" className={getLinkClass("/admin/kelas")}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Daftar Kelas</span>}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Kategori 3: Manajemen Pengguna */}
        <div className="mb-4">
          {isSidebarOpen ? (
            <button 
              onClick={() => toggleDropdown('pengguna')}
              className="w-full flex items-center justify-between px-6 mb-2 text-[#90CAF9] hover:text-white transition-colors"
            >
              <span className="text-xs font-bold uppercase tracking-wider">Manajemen Pengguna</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${openDropdowns.pengguna ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
          ) : (
            <div className="w-8 h-px bg-[#2196F3]/50 mx-auto mb-2 mt-4"></div>
          )}
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen && !openDropdowns.pengguna ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}>
            <ul className="space-y-1 px-3">
              <li>
                <Link href="/admin/pengguna" className={getLinkClass("/admin/pengguna")}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Daftar Pengguna</span>}
                </Link>
              </li>
              <li>
                <Link href="/admin/reset-password" className={getLinkClass("/admin/reset-password")}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                  {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Reset Password</span>}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </aside>
  );
}
