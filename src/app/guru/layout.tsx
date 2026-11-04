"use client";

import { useState, useEffect } from "react";
import Menu from "./components/Menu";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Otomatis membuka sidebar jika diakses melalui desktop
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden relative w-full">
      
      {/* Overlay Gelap untuk Mobile (Muncul jika sidebar terbuka) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#0D47A1]/20 backdrop-blur-sm z-20 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Dinamis (Off-canvas di mobile) */}
      <Menu isSidebarOpen={isSidebarOpen} />

      {/* Main Container (Header + Content + Footer) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        {children}
        <Footer />
      </div>
    </div>
  );
}
