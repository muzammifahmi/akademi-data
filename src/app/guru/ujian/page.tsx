"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Swal from "sweetalert2";

interface ExamSessionItem {
  id: string;
  judul: string;
  deskripsi: string;
  kelas_id: string;
  nama_kelas: string;
  durasi_menit: number;
  jadwal: string;
  proctoring: boolean;
  status: "Draft" | "Terjadwal" | "Aktif" | "Selesai";
  jumlah_soal: number;
  jumlah_sql: number;
  jumlah_pg: number;
  total_bobot: number;
}

export default function KelolaUjianGuru() {
  const [sessions, setSessions] = useState<ExamSessionItem[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedKelas, setSelectedKelas] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchExams = () => {
    setIsLoading(true);
    fetch("/api/ujian")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSessions(data.data || []);
          setClasses(data.classes || []);
        }
      })
      .catch((err) => console.error("Gagal memuat daftar ujian:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleToggleProctoring = async (ses: ExamSessionItem) => {
    const nextVal = !ses.proctoring;
    setSessions((prev) =>
      prev.map((s) => (s.id === ses.id ? { ...s, proctoring: nextVal } : s))
    );
    try {
      await fetch(`/api/ujian/${ses.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proctoring: nextVal }),
      });
    } catch {
      // revert on error
      fetchExams();
    }
  };

  const handleToggleStatus = async (ses: ExamSessionItem) => {
    const nextStatus = ses.status === "Aktif" ? "Draft" : "Aktif";
    setSessions((prev) =>
      prev.map((s) => (s.id === ses.id ? { ...s, status: nextStatus } : s))
    );
    try {
      await fetch(`/api/ujian/${ses.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {
      fetchExams();
    }
  };

  const handleDeleteExam = async (ses: ExamSessionItem) => {
    const confirm = await Swal.fire({
      title: "Hapus Sesi & Soal Ujian?",
      html: `Apakah Anda yakin ingin menghapus ujian <b>${ses.judul}</b> beserta <b>${ses.jumlah_soal} butir soal</b> di dalamnya?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#F44336",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Ya, Hapus Ujian",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/ujian/${ses.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => prev.filter((s) => s.id !== ses.id));
        Swal.fire({
          icon: "success",
          title: "Terhapus!",
          text: "Sesi dan soal ujian berhasil dihapus.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch {
      Swal.fire("Error", "Gagal menghapus sesi ujian", "error");
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchSearch =
      s.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nama_kelas.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKelas = selectedKelas === "ALL" || s.kelas_id === selectedKelas;
    return matchSearch && matchKelas;
  });

  const totalSoalUjian = sessions.reduce((acc, s) => acc + (s.jumlah_soal || 0), 0);

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#2196F3]"></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Kelola Sesi &amp; Soal Ujian
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Buat sesi evaluasi ujian, susun butir soal Pilihan Ganda maupun Query SQL di dalamnya, dan atur keamanan Proctoring.
          </p>
        </div>
        <Link
          href="/guru/ujian/tambah"
          className="px-4 py-2.5 bg-[#2196F3] hover:bg-[#1976D2] text-white font-semibold rounded-sm transition-all shadow-sm inline-flex items-center gap-2 text-sm shrink-0"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Buat Sesi &amp; Soal Ujian Baru
        </Link>
      </div>

      {/* Ringkasan Kartu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-blue-50 text-[#2196F3] flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Sesi Ujian
            </p>
            <p className="text-2xl font-extrabold text-slate-800">
              {sessions.length}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ujian Aktif
            </p>
            <p className="text-2xl font-extrabold text-emerald-600">
              {sessions.filter((s) => s.status === "Aktif").length}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Butir Soal Ujian
            </p>
            <p className="text-2xl font-extrabold text-indigo-700">
              {totalSoalUjian}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Proctoring Aktif
            </p>
            <p className="text-2xl font-extrabold text-slate-800">
              {sessions.filter((s) => s.proctoring).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 mb-6 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <input
          type="text"
          placeholder="Cari judul sesi ujian atau nama kelas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-80 px-3.5 py-2 text-sm border border-slate-200 rounded-sm focus:outline-none focus:border-[#2196F3]"
        />
        <select
          value={selectedKelas}
          onChange={(e) => setSelectedKelas(e.target.value)}
          className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-sm focus:outline-none focus:border-[#2196F3]"
        >
          <option value="ALL">Semua Kelas</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nama}
            </option>
          ))}
        </select>
      </div>

      {/* Tabel Sesi & Soal Ujian */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wider">
                <th className="px-5 py-3.5 font-semibold">Judul Sesi Ujian</th>
                <th className="px-4 py-3.5 font-semibold">Kelas</th>
                <th className="px-4 py-3.5 font-semibold text-center">
                  Komposisi Soal &amp; Bobot
                </th>
                <th className="px-4 py-3.5 font-semibold text-center">Durasi</th>
                <th className="px-4 py-3.5 font-semibold text-center">
                  Keamanan Proctoring
                </th>
                <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">
                  Kelola Soal &amp; Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    Memuat data sesi dan soal ujian...
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Belum ada sesi ujian yang dibuat. Klik{" "}
                    <b>Buat Sesi &amp; Soal Ujian Baru</b> di kanan atas untuk membuat sesi ujian beserta soal-soalnya.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((ses) => (
                  <tr
                    key={ses.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-800">{ses.judul}</div>
                      {ses.deskripsi && (
                        <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {ses.deskripsi}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-sm bg-blue-50 text-[#0D47A1] border border-blue-200 text-xs font-bold">
                        {ses.nama_kelas}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="font-bold text-slate-800 text-xs">
                        {ses.jumlah_soal} Butir Soal ({ses.total_bobot} Poin)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {ses.jumlah_sql} Query SQL • {ses.jumlah_pg} Pilihan Ganda
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-slate-700 text-xs">
                      {ses.durasi_menit} Menit
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleProctoring(ses)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                          ses.proctoring
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {ses.proctoring ? "Aktif (Terkunci)" : "Nonaktif"}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span
                          className={`px-2.5 py-1 rounded-sm text-xs font-bold border ${
                            ses.status === "Aktif"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : ses.status === "Terjadwal"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {ses.status}
                        </span>
                        {ses.status === "Terjadwal" && ses.jadwal && (
                          <div className="text-[11px] text-amber-700 font-medium whitespace-nowrap">
                            📅 {new Date(ses.jadwal).toLocaleString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/guru/ujian/${ses.id}`}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-[#2196F3] hover:bg-[#1976D2] rounded-sm transition"
                        >
                          Kelola Soal ({ses.jumlah_soal})
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(ses)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-sm transition cursor-pointer"
                        >
                          {ses.status === "Aktif" ? "Jadikan Draft" : "Aktifkan"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExam(ses)}
                          className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 rounded-sm transition cursor-pointer"
                          title="Hapus Ujian"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
