"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Swal from "sweetalert2";

export default function KelolaKelas() {
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");

  const fetchClasses = () => {
    setIsLoading(true);
    fetch("/api/kelas")
      .then(async (res) => {
        const text = await res.text();
        if (!text) {
          throw new Error(`Empty response from server (status: ${res.status})`);
        }
        return JSON.parse(text);
      })
      .then((data) => {
        if (data.success && data.data) {
          setClasses(data.data);
        }
      })
      .catch((err) => {
        console.error("Fetch Kelas Error:", err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCopy = (e: React.MouseEvent, kode: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(kode);
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Kode kelas berhasil disalin!",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  };

  const handleDeleteKelas = async (e: React.MouseEvent, id: string, nama: string) => {
    e.preventDefault();
    e.stopPropagation();

    const confirm = await Swal.fire({
      title: "Hapus Kelas?",
      html: `Apakah Anda yakin ingin menghapus kelas <b>${nama}</b>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#F44336",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Ya, Hapus Kelas",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/kelas/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setClasses((prev) => prev.filter((c) => c.id !== id));
        Swal.fire({
          icon: "success",
          title: "Terhapus!",
          text: `Kelas ${nama} berhasil dihapus.`,
          timer: 1800,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Gagal", data.error || "Gagal menghapus kelas", "error");
      }
    } catch {
      Swal.fire("Error", "Terjadi kesalahan sistem saat menghapus kelas", "error");
    }
  };

  const filteredClasses = classes.filter((cls) => {
    const matchSearch =
      cls.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.kodeKelas?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    if (gradeFilter === "all") return true;
    const upperName = (cls.nama || "").toUpperCase();
    if (gradeFilter === "XII") return upperName.includes("XII") || upperName.includes("12");
    if (gradeFilter === "XI") return (upperName.includes("XI") && !upperName.includes("XII")) || upperName.includes("11");
    if (gradeFilter === "X") return (upperName.includes("X") && !upperName.includes("XI")) || upperName.includes("10");
    return true;
  });

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#2196F3]"></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Kelas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Buat kelas baru, bagikan kode kelas ke siswa, dan kelola modul pembelajaran di setiap kelas.
          </p>
        </div>
        <div className="shrink-0">
          <Link
            href="/guru/kelas/tambah"
            className="px-4 py-2.5 bg-[#2196F3] hover:bg-[#1976D2] text-white font-semibold rounded-sm transition-all shadow-sm inline-flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Buat Kelas Baru
          </Link>
        </div>
      </div>

      {/* Filter / Pencarian */}
      <div className="bg-white p-4 rounded-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kelas atau kode kelas..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#2196F3]/50 focus:border-[#2196F3] text-sm"
          />
          <svg
            className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="border border-slate-300 rounded-sm px-4 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#2196F3]/50 bg-white w-full sm:w-auto"
          >
            <option value="all">Semua Tingkat Kelas</option>
            <option value="X">Kelas X</option>
            <option value="XI">Kelas XI</option>
            <option value="XII">Kelas XII</option>
          </select>
        </div>
      </div>

      {/* Grid Kelas */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500 bg-white border border-slate-200 rounded-sm">
          Memuat data kelas...
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center py-12 px-4 text-slate-500 bg-white border border-slate-200 rounded-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 text-[#2196F3] rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {classes.length === 0 ? "Belum Ada Kelas yang Dibuat" : "Kelas Tidak Ditemukan"}
          </h3>
          <p className="text-sm text-slate-500 mt-1 mb-5 max-w-md">
            {classes.length === 0
              ? "Buat kelas baru untuk mulai mengelola modul pembelajaran SQL dan membagikan kode kelas kepada siswa Anda."
              : "Coba gunakan kata kunci pencarian atau filter tingkat kelas yang berbeda."}
          </p>
          {classes.length === 0 && (
            <Link
              href="/guru/kelas/tambah"
              className="px-4 py-2 bg-[#2196F3] hover:bg-[#1976D2] text-white font-semibold rounded-sm transition-colors shadow-sm text-sm inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Buat Kelas Pertama
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <Link
              href={`/guru/kelas/${cls.id}`}
              key={cls.id}
              className="bg-white border border-slate-200 rounded-sm overflow-hidden hover:border-[#2196F3] transition-colors group flex flex-col cursor-pointer"
            >
              {/* Card Header (Warna Tema) */}
              <div className="h-2 w-full bg-[#2196F3]"></div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4 gap-2">
                  <div className="overflow-hidden">
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#0D47A1] transition-colors truncate">
                      {cls.nama}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                      {cls.namaSekolah && cls.namaSekolah !== "-" ? cls.namaSekolah : "Kelas Pembelajaran SQL"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteKelas(e, cls.id, cls.nama)}
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-sm transition-colors flex-shrink-0"
                    title="Hapus Kelas"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                {/* Info Kelas (Siswa & Modul) */}
                <div className="grid grid-cols-2 gap-4 mb-5 bg-slate-50 p-3 rounded-sm border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Total Siswa</p>
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#2196F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      {cls.jumlahSiswa || 0} Siswa
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Modul Aktif</p>
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#2196F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                      {cls.modulAktif || 0} Modul
                    </p>
                  </div>
                </div>

                {/* Kode Kelas */}
                <div className="mt-auto">
                  <p className="text-xs text-slate-500 font-medium mb-1.5">Kode Kelas (Bagikan ke siswa)</p>
                  <div className="flex items-center border border-slate-200 rounded-sm overflow-hidden bg-slate-100">
                    <code className="flex-1 text-slate-700 px-3 py-1.5 text-sm font-mono tracking-wider font-bold truncate">
                      {cls.kodeKelas}
                    </code>
                    <button
                      type="button"
                      onClick={(e) => handleCopy(e, cls.kodeKelas)}
                      className="bg-slate-200 hover:bg-slate-300 border-l border-slate-200 text-slate-600 px-3 py-2 transition-colors flex items-center justify-center"
                      title="Salin Kode"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                        />
                      </svg>
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
