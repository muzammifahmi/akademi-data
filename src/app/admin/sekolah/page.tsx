"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

export default function DaftarSekolahAdmin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sekolahs, setSekolahs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  const fetchSekolah = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/sekolah");
      const data = await res.json();
      if (res.ok) {
        setSekolahs(data.data || []);
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: data.error || "Gagal mengambil data sekolah" });
      }
    } catch {
      Swal.fire({ icon: "error", title: "Kesalahan", text: "Gagal menghubungi server" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSekolah();
  }, []);

  const handleCopyToken = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  const handleRegenerateToken = async (npsn: string, namaSekolah: string) => {
    const confirm = await Swal.fire({
      title: "Generate Token Sekolah Baru?",
      html: `Token lama untuk <b>${namaSekolah}</b> tidak akan berlaku lagi untuk registrasi guru baru.<br/><span class="text-xs text-slate-500">Guru yang sudah terdaftar tetap aktif dan tidak terdampak.</span>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2196F3",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Ya, Generate Token Baru",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/sekolah/${npsn}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate_token" }),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Token Baru Dibuat!",
          html: `Token baru untuk <b>${namaSekolah}</b>:<br/><div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md font-mono text-lg font-bold text-[#0D47A1] tracking-wider">${data.data.token_sekolah}</div>`,
          confirmButtonColor: "#2196F3",
        });
        fetchSekolah();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: data.error || "Gagal membuat token baru" });
      }
    } catch {
      Swal.fire({ icon: "error", title: "Kesalahan", text: "Gagal menghubungi server" });
    }
  };

  const filteredSekolah = sekolahs.filter((s) => {
    const matchSearch =
      s.nama_sekolah?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.npsn?.includes(searchTerm) ||
      s.token_sekolah?.toLowerCase().includes(searchTerm.toLowerCase());
    const currentStatus = (s.status || "Active").toLowerCase();
    const matchStatus = statusFilter === "all" || currentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full bg-[#F8FAFC]">
      <div className="w-full flex flex-col gap-1">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm font-medium text-slate-500 flex items-center gap-2">
          <Link href="/admin/dashboard" className="hover:text-[#2196F3] transition-colors">
            Dashboard
          </Link>
          <span>&gt;</span>
          <span className="text-slate-800">Sekolah &amp; Token</span>
        </div>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2196F3]"></div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Manajemen Sekolah &amp; Token</h1>
            <p className="text-slate-500 font-medium mt-1 text-sm">
              Kelola data sekolah dan generate Token Sekolah unik untuk registrasi Guru.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/sekolah/tambah"
              className="px-4 py-2.5 bg-[#2196F3] text-white font-semibold rounded-sm hover:bg-[#1976D2] transition-all shadow-sm flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Daftarkan Sekolah Baru
            </Link>
          </div>
        </div>

        {/* Main Content / Table */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Cari NPSN, Nama Sekolah, atau Token Sekolah..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#2196F3] text-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="font-medium text-slate-700">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-sm px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#2196F3]"
              >
                <option value="all">Semua Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">NPSN</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Institusi Sekolah</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Token Sekolah (Registrasi Guru)</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Guru &amp; Siswa</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Status</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <svg className="animate-spin h-8 w-8 text-[#2196F3]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Memuat data sekolah...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSekolah.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800">Belum Ada Sekolah Terdaftar</h3>
                        <p className="text-slate-500 text-sm mt-1 mb-4 max-w-sm">
                          Daftarkan sekolah baru untuk meng-generate Token Sekolah unik bagi Guru.
                        </p>
                        <Link
                          href="/admin/sekolah/tambah"
                          className="px-4 py-2 bg-[#2196F3] text-white font-semibold rounded-sm hover:bg-[#1976D2] transition-colors shadow-sm"
                        >
                          + Daftarkan Sekolah
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSekolah.map((sekolah, index) => (
                    <tr key={sekolah._id || index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-sm border border-slate-200 font-mono text-xs">
                          {sekolah.npsn}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-sm">{sekolah.nama_sekolah}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{sekolah.email_sekolah}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1.5 bg-blue-50 text-[#0D47A1] border border-blue-200 rounded-sm font-mono text-xs font-bold tracking-wider select-all">
                            {sekolah.token_sekolah || "-"}
                          </span>
                          {sekolah.token_sekolah && (
                            <button
                              type="button"
                              onClick={() => handleCopyToken(sekolah.token_sekolah, sekolah.npsn)}
                              className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 hover:border-[#2196F3] hover:text-[#2196F3] text-slate-600 rounded-sm transition-colors flex items-center gap-1 cursor-pointer"
                              title="Salin Token Sekolah"
                            >
                              {copiedTokenId === sekolah.npsn ? (
                                <>
                                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="text-emerald-600">Tersalin</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  <span>Salin</span>
                                </>
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRegenerateToken(sekolah.npsn, sekolah.nama_sekolah)}
                            className="p-1.5 text-slate-400 hover:text-[#2196F3] hover:bg-blue-50 rounded-sm transition-colors cursor-pointer"
                            title="Generate Token Baru"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-sm bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
                            {sekolah.jumlah_guru || 0} Guru
                          </span>
                          <span className="px-2.5 py-1 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                            {sekolah.jumlah_siswa || 0} Siswa
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            (sekolah.status || "Active") === "Active"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200/50"
                              : "bg-rose-50 text-rose-600 border border-rose-200/50"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              (sekolah.status || "Active") === "Active" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                            }`}
                          ></span>
                          {sekolah.status || "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/sekolah/detail/${sekolah.npsn}`}
                            className="px-3 py-1.5 text-xs font-semibold text-[#2196F3] bg-blue-50 hover:bg-[#2196F3] hover:text-white border border-blue-200 rounded-sm transition-colors inline-flex items-center gap-1.5"
                            title="Edit & Lihat Detail Sekolah"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit / Detail
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
