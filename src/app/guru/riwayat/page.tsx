"use client";

import React, { useEffect, useState } from "react";
const History = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const Search = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const CheckCircle2 = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const Code2 = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);
const BookOpenCheck = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);
const Clock = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const AlertCircle = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface RiwayatItem {
  id: string;
  tipe: "Latihan Soal" | "Penyelesaian Modul";
  nama_siswa: string;
  email_siswa: string;
  kelas_id: string;
  nama_kelas: string;
  modul_id: string;
  judul_modul: string;
  aktivitas: string;
  nilai: number | null;
  status: string;
  waktu: string;
}

interface KelasOption {
  id: string;
  nama: string;
  kodeKelas: string;
}

export default function GuruRiwayatPage() {
  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([]);
  const [classes, setClasses] = useState<KelasOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("ALL");
  const [selectedTipe, setSelectedTipe] = useState("ALL");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/guru/rekap");
        const data = await res.json();
        if (data.success) {
          const sorted = (data.riwayat || []).sort(
            (a: RiwayatItem, b: RiwayatItem) =>
              new Date(b.waktu).getTime() - new Date(a.waktu).getTime()
          );
          setRiwayat(sorted);
          setClasses(data.classes || []);
        }
      } catch (err) {
        console.error("Failed to fetch riwayat:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredRiwayat = riwayat.filter((item) => {
    const matchSearch =
      item.nama_siswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.aktivitas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.judul_modul.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKelas = selectedKelas === "ALL" || item.kelas_id === selectedKelas;
    const matchTipe = selectedTipe === "ALL" || item.tipe === selectedTipe;
    return matchSearch && matchKelas && matchTipe;
  });

  const totalLatihan = riwayat.filter((r) => r.tipe === "Latihan Soal").length;
  const totalModulSelesai = riwayat.filter(
    (r) => r.tipe === "Penyelesaian Modul"
  ).length;
  const totalLulus = riwayat.filter(
    (r) => r.status === "Lulus" || r.status === "Selesai"
  ).length;

  const formatTanggal = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC] space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#2196F3]"></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Riwayat Aktivitas Siswa (History)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Log kronologis penyelesaian latihan kueri SQL dan ketuntasan modul oleh siswa di kelas Anda.
          </p>
        </div>
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-sm border border-gray-100 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-blue-50 text-[#2196F3] flex items-center justify-center shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Total Log Aktivitas
            </p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">
              {loading ? "..." : riwayat.length}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-sm border border-gray-100 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Submisi Latihan SQL
            </p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">
              {loading ? "..." : totalLatihan}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-sm border border-gray-100 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <BookOpenCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Ketuntasan Modul ({totalLulus} Lulus)
            </p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">
              {loading ? "..." : totalModulSelesai}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="bg-white rounded-sm border border-gray-100 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama siswa, modul, atau aktivitas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-sm focus:outline-none focus:border-[#2196F3]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
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
            value={selectedTipe}
            onChange={(e) => setSelectedTipe(e.target.value)}
            className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-[#2196F3]"
          >
            <option value="ALL">Semua Tipe Aktivitas</option>
            <option value="Latihan Soal">Latihan Soal</option>
            <option value="Penyelesaian Modul">Penyelesaian Modul</option>
          </select>
        </div>
      </div>

      {/* Daftar Riwayat */}
      {loading ? (
        <div className="bg-white rounded-sm border border-gray-100 p-12 text-center text-gray-400 text-sm">
          Memuat riwayat aktivitas siswa...
        </div>
      ) : filteredRiwayat.length === 0 ? (
        <div className="bg-white rounded-sm border border-gray-100 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2196F3] flex items-center justify-center mx-auto mb-3">
            <History className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-gray-800 mb-1">
            Belum Ada Riwayat Aktivitas
          </h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Aktivitas pengerjaan soal latihan SQL dan penyelesaian modul oleh siswa akan tercatat secara otomatis di halaman ini.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-sm border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Waktu Tercatat</th>
                  <th className="py-3.5 px-4">Nama Siswa</th>
                  <th className="py-3.5 px-4">Kelas</th>
                  <th className="py-3.5 px-4">Tipe</th>
                  <th className="py-3.5 px-4">Detail Aktivitas</th>
                  <th className="py-3.5 px-4 text-center">Skor</th>
                  <th className="py-3.5 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredRiwayat.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {formatTanggal(item.waktu)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-gray-800">{item.nama_siswa}</div>
                      <div className="text-xs text-gray-400">{item.email_siswa}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-semibold bg-blue-50 text-[#0D47A1]">
                        {item.nama_kelas}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-bold ${
                          item.tipe === "Penyelesaian Modul"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-indigo-50 text-indigo-700"
                        }`}
                      >
                        {item.tipe === "Penyelesaian Modul" ? (
                          <BookOpenCheck className="w-3.5 h-3.5" />
                        ) : (
                          <Code2 className="w-3.5 h-3.5" />
                        )}
                        {item.tipe}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-gray-800 text-xs">
                        {item.aktivitas}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Modul: {item.judul_modul}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {item.nilai !== null ? (
                        <span className="font-extrabold text-gray-800 text-xs">
                          {item.nilai}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[11px] font-bold ${
                          item.status === "Lulus" || item.status === "Selesai"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {item.status === "Lulus" || item.status === "Selesai" ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        {item.status}
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
