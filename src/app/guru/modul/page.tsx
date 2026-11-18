"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function KelolaModulGuru() {
  const router = useRouter();
  const [moduls, setModuls] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/modul");
      const data = await res.json();
      if (data.success) {
        setModuls(data.data || []);
        setClasses(data.classes || []);
      }
    } catch (err) {
      console.error("Failed to fetch moduls:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateModul = async () => {
    if (classes.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Belum Ada Kelas",
        text: "Silakan buat kelas terlebih dahulu sebelum menambahkan modul pembelajaran.",
        confirmButtonText: "Buat Kelas Baru",
        confirmButtonColor: "#2196F3",
      }).then((res) => {
        if (res.isConfirmed) router.push("/guru/kelas/tambah");
      });
      return;
    }

    if (classes.length === 1) {
      router.push(`/guru/kelas/${classes[0]._id}/tambah-modul`);
      return;
    }

    const inputOptions: Record<string, string> = {};
    classes.forEach((c: any) => {
      inputOptions[c._id] = `${c.nama_kelas} (${c.kode_kelas})`;
    });

    const { value: chosenClassId } = await Swal.fire({
      title: "Pilih Kelas Tujuan",
      text: "Pilih kelas tempat modul baru akan ditambahkan:",
      input: "select",
      inputOptions,
      inputPlaceholder: "-- Pilih Kelas --",
      showCancelButton: true,
      confirmButtonColor: "#2196F3",
      confirmButtonText: "Lanjut Buat Modul",
      cancelButtonText: "Batal",
      inputValidator: (val) => (!val ? "Silakan pilih kelas terlebih dahulu" : null),
    });

    if (chosenClassId) {
      router.push(`/guru/kelas/${chosenClassId}/tambah-modul`);
    }
  };

  const handleDeleteModul = async (id: string, judul: string) => {
    const confirm = await Swal.fire({
      title: "Hapus Modul?",
      html: `Apakah Anda yakin ingin menghapus modul <b>${judul}</b>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#F44336",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/modul/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setModuls((prev) => prev.filter((m) => m._id !== id));
        Swal.fire({
          icon: "success",
          title: "Terhapus!",
          text: "Modul berhasil dihapus.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Gagal", data.error || "Gagal menghapus modul", "error");
      }
    } catch {
      Swal.fire("Error", "Terjadi kesalahan sistem", "error");
    }
  };

  const filteredModuls = moduls.filter((m) => {
    const matchSearch =
      m.judul?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tujuan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nama_kelas?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchClass = selectedClass === "all" || m.kelas_id?.toString() === selectedClass;
    const matchStatus = selectedStatus === "all" || m.status === selectedStatus;
    return matchSearch && matchClass && matchStatus;
  });

  const totalModul = moduls.length;
  const totalTerbit = moduls.filter((m) => m.status === "Terbit").length;
  const totalDraft = moduls.filter((m) => m.status !== "Terbit").length;
  const totalSoal = moduls.reduce(
    (acc, m) =>
      acc +
      (m.babs || []).reduce(
        (bAcc: number, b: any) =>
          bAcc + (b.subBabs || []).reduce((sAcc: number, s: any) => sAcc + (s.questions?.length || 0), 0),
        0
      ),
    0
  );

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#2196F3]"></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kelola Modul Pembelajaran</h1>
          <p className="text-sm text-slate-500 mt-1">
            Daftar seluruh modul materi dan latihan soal SQL di semua kelas yang Anda ampu.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateModul}
          className="px-4 py-2.5 bg-[#2196F3] hover:bg-[#1976D2] text-white font-semibold rounded-sm transition-all shadow-sm inline-flex items-center gap-2 text-sm shrink-0 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Modul Baru
        </button>
      </div>

      {/* Ringkasan Modul */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-blue-50 text-[#2196F3] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Modul</p>
            <p className="text-2xl font-extrabold text-slate-800">{totalModul}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modul Terbit</p>
            <p className="text-2xl font-extrabold text-emerald-600">{totalTerbit}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modul Draft</p>
            <p className="text-2xl font-extrabold text-amber-600">{totalDraft}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Soal Latihan</p>
            <p className="text-2xl font-extrabold text-indigo-700">{totalSoal}</p>
          </div>
        </div>
      </div>

      {/* Filter & Tabel Modul */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul modul atau kelas..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#2196F3] text-sm"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="border border-slate-200 rounded-sm px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2196F3]"
            >
              <option value="all">Semua Kelas</option>
              {classes.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.nama_kelas}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-slate-200 rounded-sm px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2196F3]"
            >
              <option value="all">Semua Status</option>
              <option value="Terbit">Terbit (Aktif)</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wider">
                <th className="px-5 py-3.5 font-semibold">Judul Modul</th>
                <th className="px-5 py-3.5 font-semibold">Kelas</th>
                <th className="px-5 py-3.5 font-semibold text-center">Struktur Materi</th>
                <th className="px-5 py-3.5 font-semibold text-center">Status</th>
                <th className="px-5 py-3.5 font-semibold text-center">Terakhir Diperbarui</th>
                <th className="px-5 py-3.5 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    Memuat daftar modul...
                  </td>
                </tr>
              ) : filteredModuls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    Belum ada modul yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredModuls.map((modul) => {
                  const babCount = modul.babs?.length || 0;
                  const subBabCount = (modul.babs || []).reduce(
                    (acc: number, b: any) => acc + (b.subBabs?.length || 0),
                    0
                  );
                  const soalCount = (modul.babs || []).reduce(
                    (acc: number, b: any) =>
                      acc +
                      (b.subBabs || []).reduce((sAcc: number, s: any) => sAcc + (s.questions?.length || 0), 0),
                    0
                  );

                  return (
                    <tr key={modul._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800">{modul.judul}</div>
                        <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{modul.tujuan || "-"}</div>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/guru/kelas/${modul.kelas_id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-blue-50 text-[#0D47A1] border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors"
                        >
                          {modul.nama_kelas}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 flex-wrap justify-center">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-sm text-xs font-semibold">
                            {babCount} Bab
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-sm text-xs font-semibold">
                            {subBabCount} Sub-Bab
                          </span>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-sm text-xs font-semibold">
                            {soalCount} Soal
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {modul.status === "Terbit" ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-sm font-bold text-xs">
                            Terbit
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-sm font-bold text-xs">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center text-xs text-slate-500">
                        {new Date(modul.updatedAt || modul.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/guru/kelas/${modul.kelas_id}/edit-modul/${modul._id}`}
                            className="px-3 py-1.5 text-xs font-semibold text-[#2196F3] bg-blue-50 hover:bg-[#2196F3] hover:text-white border border-blue-200 rounded-sm transition-colors inline-flex items-center gap-1"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteModul(modul._id, modul.judul)}
                            className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 rounded-sm transition-colors cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
