import Link from "next/link";
import { useState, useEffect } from "react";

interface NavbarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export default function Navbar({ isSidebarOpen, setIsSidebarOpen }: NavbarProps) {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) {
          window.location.href = '/';
          throw new Error("Session invalid");
        }
        return res.json();
      })
      .then(data => {
        if (!data.error) setUserData(data);
      })
      .catch(err => {
        console.error("Gagal memuat profil", err);
        window.location.href = '/';
      });
  }, []);

  const displayName = userData?.name || "Memuat...";
  const displayClass = userData?.kelas || "-";
  const displayNisn = userData?.nisn_nip || "-";
  const displayInitials = userData?.initials || "AD";

  return (
    <header className="h-16 bg-white border-b border-[#90CAF9]/60 flex items-center justify-between px-4 sm:px-6 shadow-sm z-10 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="p-2 text-[#0D47A1] hover:bg-[#E3F2FD] rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-[#0D47A1] hidden sm:block">Portal Siswa</h2>
      </div>
      
      {/* Profil & Pengaturan (Hover Dropdown) */}
      <div className="flex items-center gap-4 relative group cursor-pointer py-2">
        <div className="text-right hidden sm:block">
          <p className="font-bold text-[#0D47A1] text-sm">{displayName}</p>
          <p className="text-[#0D47A1]/70 text-xs font-semibold">
            {displayClass} • NISN: {displayNisn}
          </p>
        </div>
        <div className="w-10 h-10 bg-[#0D47A1] rounded-full flex items-center justify-center text-white font-bold border-2 border-[#90CAF9] shadow-sm group-hover:ring-2 group-hover:ring-[#2196F3] transition-all">
          {displayInitials}
        </div>

        {/* Dropdown Menu (Muncul saat Hover di area profil) */}
        <div className="absolute top-full right-0 mt-2 bg-white rounded-sm shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-[#90CAF9] w-48">
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-sm text-[#0D47A1] hover:bg-[#E3F2FD] font-bold transition-colors border-b border-[#90CAF9]/40">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Pengaturan Akun
          </Link>
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-bold transition-colors">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Keluar Aplikasi
          </Link>
        </div>
      </div>
    </header>
  );
}
