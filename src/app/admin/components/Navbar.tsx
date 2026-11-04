import Image from "next/image";
import { useState, useEffect } from "react";

interface NavbarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
}

export default function Navbar({ isSidebarOpen, setIsSidebarOpen }: NavbarProps) {
  const [userProfile, setUserProfile] = useState({ name: 'Memuat...', subtitle: '...', initials: '?' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data);
        } else {
          // Token tidak valid atau user sudah dihapus
          window.location.href = '/';
        }
      } catch (error) {
        console.error("Failed to fetch user profile", error);
        window.location.href = '/';
      }
    };
    fetchProfile();
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Toggle Sidebar Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-sm text-slate-500 hover:bg-slate-100 hover:text-[#2196F3] transition-colors focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {/* Judul Halaman */}
        <h1 className="text-lg font-bold text-slate-700 hidden sm:block">
          Portal Admin
        </h1>
      </div>

      {/* Area Profil & Notifikasi */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Notifikasi */}
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>

        {/* Pemisah */}
        <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>

        {/* Profil Mini */}
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-700 leading-tight">{userProfile.name}</p>
            <p className="text-xs text-slate-500 font-medium">{userProfile.subtitle}</p>
          </div>
          <div className="w-10 h-10 rounded-sm bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0D47A1] font-bold shadow-sm overflow-hidden">
            {userProfile.initials}
          </div>
        </div>
      </div>
    </header>
  );
}
