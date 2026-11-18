"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface RekapModulItem {
  modul_id: string;
  urutan: number;
  judul_modul: string;
  tujuan: string;
  progress: number;
  completed_count: number;
  total_subbabs: number;
  total_latihan: number;
  completed_latihan: number;
  total_soal: number;
  rata_nilai: number | null;
  is_completed: boolean;
  is_locked: boolean;
  status_modul: "Selesai" | "Sedang Dipelajari" | "Belum Mulai";
  completedAt: string | null;
}

interface UjianItem {
  id: string;
  judul: string;
  deskripsi: string;
  durasi_menit: number;
  jadwal: string;
  proctoring: boolean;
  status_sesi: "Draft" | "Terjadwal" | "Aktif" | "Selesai";
  jumlah_soal: number;
  jumlah_sql: number;
  jumlah_pg: number;
  total_bobot: number;
  sudah_dikerjakan: boolean;
  skor: number | null;
  status_lulus: "Lulus" | "Perlu Perbaikan" | "Belum Dikerjakan";
  waktu_submit: string | null;
  href: string;
}

interface LatihanItem {
  id: string;
  modul_id: string;
  judul_modul: string;
  bab_idx: number;
  judul_bab: string;
  sub_idx: number;
  subbab_id: string;
  judul_subbab: string;
  jumlah_soal: number;
  jumlah_sql: number;
  jumlah_pg: number;
  sudah_dikerjakan: boolean;
  skor: number | null;
  status_lulus: "Lulus" | "Perlu Perbaikan" | "Belum Dikerjakan";
  is_locked: boolean;
  href: string;
  waktu: string;
}

export default function SiswaRiwayatNilaiPage() {
  const [loading, setLoading] = useState(true);
  const [kelasInfo, setKelasInfo] = useState<{
    id: string;
    nama_kelas: string;
    kode_kelas: string;
  } | null>(null);
  const [rekapModul, setRekapModul] = useState<RekapModulItem[]>([]);
  const [daftarUjian, setDaftarUjian] = useState<UjianItem[]>([]);
  const [daftarLatihan, setDaftarLatihan] = useState<LatihanItem[]>([]);

  const [selectedModulId, setSelectedModulId] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/siswa/rekap")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setKelasInfo(data.kelas || null);
          setRekapModul(data.rekapModul || []);
          setDaftarUjian(data.daftarUjian || []);
          setDaftarLatihan(data.daftarLatihan || []);
        }
      })
      .catch((err) => console.error("Gagal memuat riwayat nilai:", err))
      .finally(() => setLoading(false));
  }, []);

  const completedUjian = daftarUjian.filter((u) => u.sudah_dikerjakan);
  const completedExercises = daftarLatihan.filter((d) => d.sudah_dikerjakan);

  const allScores: number[] = [
    ...completedUjian.map((u) => Number(u.skor) || 0),
    ...completedExercises.map((d) => Number(d.skor) || 0),
  ];

  const overallAvg =
    allScores.length > 0
      ? Math.round(allScores.reduce((acc, s) => acc + s, 0) / allScores.length)
      : null;

  const getPredikat = (avg: number | null) => {
    if (avg === null)
      return { label: "Belum Ada Nilai", color: "text-slate-500" };
    if (avg >= 85)
      return { label: "Sangat Baik (A)", color: "text-emerald-600" };
    if (avg >= 75) return { label: "Baik (B)", color: "text-[#2196F3]" };
    if (avg >= 65) return { label: "Cukup (C)", color: "text-amber-600" };
    return { label: "Perlu Bimbingan (D)", color: "text-red-600" };
  };

  const predikat = getPredikat(overallAvg);

  const filteredLatihan = daftarLatihan.filter((item) => {
    const matchSearch =
      item.judul_modul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.judul_bab.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.judul_subbab.toLowerCase().includes(searchQuery.toLowerCase());
    const matchModul =
      selectedModulId === "ALL" || item.modul_id === selectedModulId;
    const matchStatus =
      selectedStatus === "ALL" || item.status_lulus === selectedStatus;
    return matchSearch && matchModul && matchStatus;
  });

  const formatTanggal = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatJadwal = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    const hasTime =
      dateStr.includes("T") || d.getHours() !== 0 || d.getMinutes() !== 0;
    if (hasTime) {
      return d.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 bg-[#F8FAFC]">
      {/* Header Banner */}
      <div className="bg-[#0D47A1] rounded-sm p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 transform rotate-45 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-10 w-32 h-32 bg-white opacity-5 transform rotate-12 translate-y-1/2"></div>

        <div className="relative z-10 flex-1">
          <h1 className="text-2xl font-bold mb-2">
            Riwayat Ujian &amp; Rekap Nilai
          </h1>
          <p className="text-blue-100 text-sm font-medium max-w-2xl leading-relaxed">
            Kerjakan sesi ujian yang dijadwalkan oleh Guru serta pantau transkrip nilai evaluasi ujian dan latihan soal modul SQL Anda.
          </p>
        </div>

        {kelasInfo && (
          <div className="relative z-10 sm:text-right border-t sm:border-t-0 sm:border-l border-blue-800 pt-4 sm:pt-0 sm:pl-6 shrink-0">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide mb-1">
              Kelas Terdaftar
            </p>
            <p className="font-bold text-lg text-white">
              {kelasInfo.nama_kelas}
            </p>
            <p className="text-xs text-blue-200 font-mono">
              Kode: {kelasInfo.kode_kelas}
            </p>
          </div>
        )}
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-sm border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-blue-50 text-[#2196F3] flex items-center justify-center shrink-0">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Rata-Rata Nilai
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {loading ? "..." : overallAvg !== null ? overallAvg : "-"}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-sm border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <svg
              className="w-6 h-6"
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
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ujian Diselesaikan
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {loading
                ? "..."
                : `${completedUjian.length} / ${daftarUjian.length}`}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-sm border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg
              className="w-6 h-6"
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
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Latihan Modul Selesai
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {loading
                ? "..."
                : `${completedExercises.length} / ${daftarLatihan.length}`}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-sm border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Predikat Akademik
            </p>
            <h3 className={`text-lg font-extrabold mt-0.5 ${predikat.color}`}>
              {loading ? "..." : predikat.label}
            </h3>
          </div>
        </div>
      </div>

      {/* Bagian 1: Sesi Ujian & Riwayat Nilai Ujian Kelas */}
      <div className="bg-white rounded-sm border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              1. Daftar Sesi Ujian &amp; Riwayat Nilai Ujian
            </h2>
            <p className="text-xs text-slate-500">
              Daftar evaluasi ujian praktikum SQL dan pilihan ganda yang diterbitkan oleh Guru untuk kelas Anda.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-sm bg-blue-50 text-[#0D47A1] text-xs font-bold">
            {daftarUjian.length} Sesi Ujian
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Memuat daftar sesi ujian...
          </div>
        ) : daftarUjian.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Belum ada sesi ujian yang dijadwalkan untuk kelas Anda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Judul Sesi Ujian</th>
                  <th className="py-3.5 px-4 text-center">Durasi &amp; Keamanan</th>
                  <th className="py-3.5 px-4 text-center">Tanggal Submit</th>
                  <th className="py-3.5 px-4 text-center">Nilai Ujian</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {daftarUjian.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-800">{u.judul}</div>
                      {u.deskripsi && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          {u.deskripsi}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="text-xs font-semibold text-slate-700">
                        {u.durasi_menit} Menit
                      </div>
                      {u.proctoring && (
                        <span className="inline-block mt-0.5 px-2 py-0.2 bg-indigo-50 text-indigo-700 rounded-sm text-[10px] font-bold">
                          Proctoring Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-xs text-slate-500">
                      {u.sudah_dikerjakan ? formatTanggal(u.waktu_submit) : "-"}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {u.skor !== null ? (
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-sm text-xs font-extrabold ${
                            u.skor >= 80
                              ? "bg-emerald-50 text-emerald-700"
                              : u.skor >= 70
                              ? "bg-blue-50 text-[#0D47A1]"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {u.skor}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">
                          -
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[11px] font-bold ${
                            u.sudah_dikerjakan
                              ? u.status_lulus === "Lulus"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-amber-50 text-amber-600"
                              : u.status_sesi === "Aktif"
                              ? "bg-blue-50 text-[#2196F3]"
                              : u.status_sesi === "Terjadwal"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {u.sudah_dikerjakan
                            ? `${u.status_lulus} (Selesai)`
                            : u.status_sesi === "Aktif"
                            ? "Tersedia"
                            : u.status_sesi === "Terjadwal"
                            ? u.jadwal && new Date(u.jadwal).getTime() <= Date.now()
                              ? "Sedang Berlangsung"
                              : "Terjadwal"
                            : u.status_sesi}
                        </span>
                        {u.status_sesi === "Terjadwal" && u.jadwal && (
                          <div className="text-[11px] text-amber-700 font-medium flex items-center justify-center gap-1 whitespace-nowrap">
                            <span>📅 Jadwal: {formatJadwal(u.jadwal)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right">
                      {u.status_sesi === "Terjadwal" && !u.sudah_dikerjakan && u.jadwal && new Date(u.jadwal).getTime() > Date.now() ? (
                        <span className="text-xs text-slate-400 italic">
                          Belum Dimulai
                        </span>
                      ) : (
                        <Link
                          href={u.href}
                          className={`inline-flex items-center px-3.5 py-1.5 rounded-sm text-xs font-bold transition ${
                            u.sudah_dikerjakan
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              : "bg-[#2196F3] hover:bg-blue-600 text-white shadow-xs"
                          }`}
                        >
                          {u.sudah_dikerjakan
                            ? "Lihat Hasil Ujian"
                            : "Kerjakan Ujian"}
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bagian 2: Tabel Riwayat Nilai Latihan Modul Pembelajaran */}
      <div className="bg-white rounded-sm border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              2. Riwayat Nilai Latihan Soal Modul Pembelajaran
            </h2>
            <p className="text-xs text-slate-500">
              Rincian skor setiap latihan soal pada masing-masing Sub-Bab materi modul.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Cari sub-bab atau modul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-[#2196F3] w-full sm:w-56"
            />

            <select
              value={selectedModulId}
              onChange={(e) => setSelectedModulId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-sm focus:outline-none focus:border-[#2196F3]"
            >
              <option value="ALL">Semua Modul</option>
              {rekapModul.map((m) => (
                <option key={m.modul_id} value={m.modul_id}>
                  {m.judul_modul}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-sm focus:outline-none focus:border-[#2196F3]"
            >
              <option value="ALL">Semua Status</option>
              <option value="Lulus">Lulus (&ge;70)</option>
              <option value="Perlu Perbaikan">Perlu Perbaikan (&lt;70)</option>
              <option value="Belum Dikerjakan">Belum Dikerjakan</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">
            Memuat rincian riwayat nilai latihan...
          </div>
        ) : filteredLatihan.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Belum ada data latihan modul yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Modul Pembelajaran</th>
                  <th className="py-3.5 px-4">Bab &amp; Sub-Bab Latihan</th>
                  <th className="py-3.5 px-4 text-center">Komposisi Soal</th>
                  <th className="py-3.5 px-4 text-center">Tanggal</th>
                  <th className="py-3.5 px-4 text-center">Skor Nilai</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredLatihan.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-bold bg-blue-50 text-[#0D47A1]">
                        {item.judul_modul}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800 text-xs">
                        {item.judul_subbab}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.judul_bab}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-xs font-semibold text-slate-600">
                        {item.jumlah_soal} Soal
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {item.jumlah_sql} SQL • {item.jumlah_pg} PG
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-xs text-slate-500">
                      {item.sudah_dikerjakan ? formatTanggal(item.waktu) : "-"}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {item.skor !== null ? (
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-sm text-xs font-extrabold ${
                            item.skor >= 80
                              ? "bg-emerald-50 text-emerald-700"
                              : item.skor >= 70
                              ? "bg-blue-50 text-[#0D47A1]"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {item.skor}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">
                          -
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[11px] font-bold ${
                          item.status_lulus === "Lulus"
                            ? "bg-emerald-50 text-emerald-600"
                            : item.status_lulus === "Perlu Perbaikan"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.status_lulus}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      {item.is_locked ? (
                        <span className="text-xs text-slate-400 italic">
                          Terkunci
                        </span>
                      ) : (
                        <Link
                          href={item.href}
                          className="inline-flex items-center px-3 py-1.5 rounded-sm text-xs font-bold bg-[#2196F3] hover:bg-blue-600 text-white transition"
                        >
                          {item.sudah_dikerjakan ? "Ulas Jawaban" : "Kerjakan"}
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
