"use client";

import React, { useEffect, useState } from "react";
const FileBarChart2 = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const Search = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const Download = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);
const Award = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);
const CheckCircle2 = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const AlertTriangle = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
const Users = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const BookOpen = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

interface DetailLatihan {
  subbab_id: string;
  judul_subbab: string;
  score: number;
}

interface RekapItem {
  id: string;
  siswa_id: string;
  nama_siswa: string;
  email_siswa: string;
  kelas_id: string;
  nama_kelas: string;
  modul_id: string;
  judul_modul: string;
  progress: number;
  completed_count: number;
  total_subbabs: number;
  status_modul: "Selesai" | "Sedang Dipelajari" | "Belum Mulai";
  rata_nilai: number | null;
  detail_latihan: DetailLatihan[];
  completedAt: string | null;
}

interface KelasOption {
  id: string;
  nama: string;
  kodeKelas: string;
}

interface ModulOption {
  id: string;
  judul: string;
  kelas_id: string;
  nama_kelas: string;
}

export default function GuruRekapNilaiPage() {
  const [rekapList, setRekapList] = useState<RekapItem[]>([]);
  const [classes, setClasses] = useState<KelasOption[]>([]);
  const [modules, setModules] = useState<ModulOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("ALL");
  const [selectedModul, setSelectedModul] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/guru/rekap");
        const data = await res.json();
        if (data.success) {
          setRekapList(data.rekapNilai || []);
          setClasses(data.classes || []);
          setModules(data.modules || []);
        }
      } catch (err) {
        console.error("Failed to fetch rekap nilai:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const availableModules =
    selectedKelas === "ALL"
      ? modules
      : modules.filter((m) => m.kelas_id === selectedKelas);

  const filteredRekap = rekapList.filter((item) => {
    const matchSearch =
      item.nama_siswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email_siswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.judul_modul.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKelas = selectedKelas === "ALL" || item.kelas_id === selectedKelas;
    const matchModul = selectedModul === "ALL" || item.modul_id === selectedModul;
    const matchStatus = selectedStatus === "ALL" || item.status_modul === selectedStatus;
    return matchSearch && matchKelas && matchModul && matchStatus;
  });

  // Statistik ringkas berdasarkan data yang difilter
  const scoredItems = filteredRekap.filter((r) => r.rata_nilai !== null);
  const avgClassScore =
    scoredItems.length > 0
      ? Math.round(
          scoredItems.reduce((acc, r) => acc + (r.rata_nilai || 0), 0) /
            scoredItems.length
        )
      : 0;
  const completedModulesCount = filteredRekap.filter(
    (r) => r.status_modul === "Selesai"
  ).length;
  const remedialCount = scoredItems.filter((r) => (r.rata_nilai || 0) < 70).length;

  const handleExportCSV = () => {
    if (filteredRekap.length === 0) return;

    const headers = [
      "Nama Siswa",
      "Email",
      "Kelas",
      "Modul",
      "Progres (%)",
      "Sub-Bab Selesai",
      "Status Modul",
      "Rata-rata Nilai Latihan",
    ];

    const rows = filteredRekap.map((item) => [
      `"${item.nama_siswa.replace(/"/g, '""')}"`,
      `"${item.email_siswa}"`,
      `"${item.nama_kelas}"`,
      `"${item.judul_modul.replace(/"/g, '""')}"`,
      item.progress,
      `"${item.completed_count}/${item.total_subbabs}"`,
      `"${item.status_modul}"`,
      item.rata_nilai !== null ? item.rata_nilai : "-",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `rekap_nilai_siswa_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC] space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#2196F3]"></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rekap Nilai &amp; Progres Siswa</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau capaian progres belajar dan nilai latihan kueri SQL seluruh siswa per kelas dan modul.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filteredRekap.length === 0}
          className="px-4 py-2.5 bg-[#2196F3] hover:bg-[#1976D2] disabled:opacity-50 text-white font-semibold rounded-sm transition-all shadow-sm inline-flex items-center gap-2 text-sm shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Unduh Rekap (CSV)
        </button>
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-sm border border-gray-100 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-blue-50 text-[#2196F3] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Data Rekap Siswa
            </p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">
              {loading ? "..." : filteredRekap.length}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-sm border border-gray-100 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Rata-Rata Nilai
            </p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">
              {loading ? "..." : scoredItems.length > 0 ? avgClassScore : "-"}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-sm border border-gray-100 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Modul Tuntas (100%)
            </p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">
              {loading ? "..." : completedModulesCount}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-sm border border-gray-100 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Perlu Remedial (&lt;70)
            </p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">
              {loading ? "..." : remedialCount}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="bg-white rounded-sm border border-gray-100 p-4 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama siswa, email, atau modul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-sm focus:outline-none focus:border-[#2196F3]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select
            value={selectedKelas}
            onChange={(e) => {
              setSelectedKelas(e.target.value);
              setSelectedModul("ALL");
            }}
            className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-[#2196F3]"
          >
            <option value="ALL">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nama}
              </option>
            ))}
          </select>

          <select
            value={selectedModul}
            onChange={(e) => setSelectedModul(e.target.value)}
            className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-[#2196F3]"
          >
            <option value="ALL">Semua Modul</option>
            {availableModules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.judul}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-[#2196F3]"
          >
            <option value="ALL">Semua Status</option>
            <option value="Selesai">Selesai</option>
            <option value="Sedang Dipelajari">Sedang Dipelajari</option>
            <option value="Belum Mulai">Belum Mulai</option>
          </select>
        </div>
      </div>

      {/* Tabel Rekap Nilai */}
      {loading ? (
        <div className="bg-white rounded-sm border border-gray-100 p-12 text-center text-gray-400 text-sm">
          Memuat data rekap nilai siswa...
        </div>
      ) : filteredRekap.length === 0 ? (
        <div className="bg-white rounded-sm border border-gray-100 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2196F3] flex items-center justify-center mx-auto mb-3">
            <FileBarChart2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-gray-800 mb-1">
            Belum Ada Data Rekap Nilai
          </h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Pastikan kelas Anda sudah memiliki siswa yang tergabung dan modul pembelajaran yang telah diterbitkan.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-sm border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Nama Siswa</th>
                  <th className="py-3.5 px-4">Kelas</th>
                  <th className="py-3.5 px-4">Modul</th>
                  <th className="py-3.5 px-4">Progres Materi</th>
                  <th className="py-3.5 px-4 text-center">Rincian Latihan</th>
                  <th className="py-3.5 px-4 text-center">Rata-Rata Nilai</th>
                  <th className="py-3.5 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredRekap.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-4 px-5">
                      <div className="font-bold text-gray-800">{item.nama_siswa}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{item.email_siswa}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-semibold bg-blue-50 text-[#0D47A1]">
                        {item.nama_kelas}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-gray-700 text-xs">
                        <BookOpen className="w-3.5 h-3.5 text-[#2196F3] shrink-0" />
                        <span>{item.judul_modul}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 min-w-[160px]">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500 font-medium">
                          {item.completed_count}/{item.total_subbabs} Sub-Bab
                        </span>
                        <span className="font-bold text-gray-800">{item.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.progress === 100 ? "bg-emerald-500" : "bg-[#2196F3]"
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {item.detail_latihan.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">Belum ada latihan</span>
                      ) : (
                        <div className="flex flex-wrap items-center justify-center gap-1 max-w-[220px] mx-auto">
                          {item.detail_latihan.map((dl, idx) => (
                            <span
                              key={idx}
                              title={`${dl.judul_subbab}: ${dl.score}`}
                              className={`px-2 py-0.5 rounded-sm text-[11px] font-bold border ${
                                dl.score >= 70
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              #{idx + 1}: {dl.score}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {item.rata_nilai !== null ? (
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-sm text-xs font-extrabold ${
                            item.rata_nilai >= 80
                              ? "bg-emerald-50 text-emerald-700"
                              : item.rata_nilai >= 70
                              ? "bg-blue-50 text-[#0D47A1]"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {item.rata_nilai}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 font-semibold">-</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[11px] font-bold ${
                          item.status_modul === "Selesai"
                            ? "bg-emerald-50 text-emerald-600"
                            : item.status_modul === "Sedang Dipelajari"
                            ? "bg-blue-50 text-[#2196F3]"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {item.status_modul}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
