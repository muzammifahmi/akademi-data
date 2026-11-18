"use client";

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import VsCodeSqlEditor from "@/components/VsCodeSqlEditor";

const STORAGE_TABLES_KEY = "akademidata_siswa_sandbox_tables";
const STORAGE_DRAFT_SQL_KEY = "akademidata_siswa_sandbox_draft_sql";

interface SavedColumn {
  id: string;
  name: string;
  type: string;
  length: string;
  pk: boolean;
  ai: boolean;
}

interface SavedTable {
  name: string;
  columns: SavedColumn[];
  rows: Record<string, any>[];
}

export default function SiswaLatihanIdePage() {
  const [savedTables, setSavedTables] = useState<SavedTable[]>([]);
  const [sqlCode, setSqlCode] = useState<string>("");
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  const persistTables = async (nextTables: SavedTable[]) => {
    setSavedTables(nextTables);
    try {
      localStorage.setItem(STORAGE_TABLES_KEY, JSON.stringify(nextTables));
    } catch {
      // ignore storage quota errors
    }

    try {
      await fetch("/api/siswa/sandbox", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables: nextTables }),
      });
    } catch (err) {
      console.error("Gagal menyinkronkan tabel sandbox ke server:", err);
    }
  };

  useEffect(() => {
    // 1. Muat cepat dari localStorage agar tidak hilang saat berpindah menu
    let localTables: SavedTable[] = [];
    try {
      const rawTables = localStorage.getItem(STORAGE_TABLES_KEY);
      if (rawTables) {
        const parsed = JSON.parse(rawTables);
        if (Array.isArray(parsed)) {
          localTables = parsed;
          setSavedTables(parsed);
        }
      }
      const rawDraft = localStorage.getItem(STORAGE_DRAFT_SQL_KEY);
      if (rawDraft) {
        setSqlCode(rawDraft);
      }
    } catch {
      // ignore parse errors
    }

    // 2. Sinkronkan dengan database server (/api/siswa/sandbox)
    fetch("/api/siswa/sandbox")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.tables)) {
          if (data.tables.length > 0) {
            setSavedTables(data.tables);
            try {
              localStorage.setItem(STORAGE_TABLES_KEY, JSON.stringify(data.tables));
            } catch {
              // ignore
            }
          } else if (localTables.length > 0) {
            // Jika di local ada namun di server belum tersimpan, sinkronkan ke server
            fetch("/api/siswa/sandbox", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tables: localTables }),
            }).catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSqlCodeChange = (nextCode: string) => {
    setSqlCode(nextCode);
    try {
      if (nextCode) {
        localStorage.setItem(STORAGE_DRAFT_SQL_KEY, nextCode);
      } else {
        localStorage.removeItem(STORAGE_DRAFT_SQL_KEY);
      }
    } catch {
      // ignore
    }
  };

  const handleSaveTables = (nextTables: SavedTable[]) => {
    persistTables(nextTables);
    try {
      localStorage.removeItem(STORAGE_DRAFT_SQL_KEY);
    } catch {
      // ignore
    }
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Tabel berhasil disimpan ke Sandbox!",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  };

  const handleDeleteTable = async (tableName: string) => {
    const confirm = await Swal.fire({
      title: `Hapus Tabel "${tableName}"?`,
      text: "Tabel beserta isinya akan dihapus dari daftar Sandbox di sisi kiri.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#F44336",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;
    const nextTables = savedTables.filter((t) => t.name !== tableName);
    persistTables(nextTables);
    if (expandedTable === tableName) {
      setExpandedTable(null);
    }
  };

  const handleResetAllTables = async () => {
    const confirm = await Swal.fire({
      title: "Reset Seluruh Tabel Sandbox?",
      text: "Semua tabel yang telah Anda simpan di sisi kiri akan dikosongkan kembali.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#F44336",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Ya, Kosongkan",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;
    persistTables([]);
    setExpandedTable(null);
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 bg-[#F8FAFC]">
      {/* Header Banner Tanpa Tab */}
      <div className="bg-[#0D47A1] rounded-sm p-6 sm:p-8 shadow-sm relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 transform rotate-45 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-10 w-32 h-32 bg-white opacity-5 transform rotate-12 translate-y-1/2"></div>

        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1.5">
            Laboratorium &amp; Latihan IDE SQL
          </h1>
          <p className="text-blue-100 text-sm font-medium max-w-3xl leading-relaxed">
            Lingkungan Sandbox SQL murni. Mulailah dengan membuat tabel baru melalui editor di sebelah kanan, kemudian klik tombol <strong>Simpan</strong> agar struktur dan data tabel Anda tersimpan di sisi kiri.
          </p>
        </div>
      </div>

      {/* Konten Utama: Panel Kiri (Tabel Tersimpan) & Panel Kanan (Editor SQL Murni) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sisi Kiri: Daftar Tabel Tersimpan */}
        <div className="lg:col-span-4 bg-white rounded-sm border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Daftar Tabel Tersimpan
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Skema aktif di dalam Sandbox Anda
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-sm text-xs font-bold bg-blue-50 text-[#2196F3]">
                {savedTables.length} Tabel
              </span>
              {savedTables.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetAllTables}
                  className="text-[11px] font-bold text-red-500 hover:text-red-700 cursor-pointer"
                  title="Kosongkan semua tabel"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {savedTables.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-sm text-center">
              <div className="w-11 h-11 rounded-full bg-blue-50 text-[#2196F3] flex items-center justify-center mx-auto mb-3">
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
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                Database Sandbox Masih Kosong
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mulailah dengan membuat tabel baru pada editor SQL di sebelah kanan, lalu klik tombol{" "}
                <strong className="text-[#0D47A1]">Simpan</strong> untuk menyimpan tabel ke sisi kiri ini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedTables.map((t, idx) => {
                const isExpanded = expandedTable === t.name;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-sm overflow-hidden bg-white"
                  >
                    <div className="bg-slate-50 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-xs text-[#0D47A1] truncate">
                          {t.name}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                          ({t.rows?.length || 0} Baris)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {t.rows && t.rows.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTable(isExpanded ? null : t.name)
                            }
                            className="text-[10px] font-bold text-[#2196F3] hover:underline cursor-pointer"
                          >
                            {isExpanded ? "Tutup Data" : "Lihat Data"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteTable(t.name)}
                          className="text-slate-400 hover:text-red-600 transition cursor-pointer"
                          title={`Hapus tabel ${t.name}`}
                        >
                          <svg
                            className="w-3.5 h-3.5"
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
                    </div>

                    {/* Daftar Kolom */}
                    <div className="p-2.5 divide-y divide-slate-100 text-xs">
                      {t.columns.map((c) => (
                        <div
                          key={c.id}
                          className="py-1.5 px-1 flex items-center justify-between font-mono"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-700">
                              {c.name}
                            </span>
                            {c.pk && (
                              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-extrabold rounded-sm">
                                PK
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {c.type}
                            {c.length ? `(${c.length})` : ""}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Pratinjau Isi Baris Data (Jika Dibuka) */}
                    {isExpanded && t.rows && t.rows.length > 0 && (
                      <div className="border-t border-slate-200 bg-slate-50 p-2 overflow-x-auto">
                        <table className="w-full text-left font-mono text-[11px] border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              {t.columns.map((col) => (
                                <th key={col.id} className="py-1 px-2 font-bold">
                                  {col.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/60 text-slate-700">
                            {t.rows.map((r, rIdx) => (
                              <tr key={rIdx}>
                                {t.columns.map((col) => (
                                  <td key={col.id} className="py-1 px-2">
                                    {r[col.name] !== undefined && r[col.name] !== null
                                      ? String(r[col.name])
                                      : "NULL"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sisi Kanan: Editor Kode SQL & Terminal Output (100% Sandbox) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Instruksi Sandbox */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-sm p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-sm bg-[#2196F3] text-white flex items-center justify-center shrink-0 mt-0.5">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-xs text-slate-700 leading-relaxed">
              <p className="font-bold text-[#0D47A1] mb-0.5">
                Instruksi Penggunaan Sandbox SQL
              </p>
              <p>
                1. Mulailah dengan menuliskan query pembuatan tabel baru pada editor di bawah.<br />
                2. Klik tombol <strong>Jalankan Query</strong> untuk menguji query di terminal, atau klik tombol <strong>Simpan</strong> agar tabel baru maupun perubahan data tersimpan ke daftar tabel di sebelah kiri.
              </p>
            </div>
          </div>

          {/* Editor SQL */}
          <div className="bg-white rounded-sm border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Editor Kode SQL &amp; Terminal Output
                </h3>
                <p className="text-xs text-slate-500">
                  Gunakan tombol <strong>Jalankan Query</strong> untuk melihat hasil eksekusi dan tombol <strong>Simpan</strong> untuk menyimpan tabel ke sisi kiri.
                </p>
              </div>
            </div>

            <VsCodeSqlEditor
              value={sqlCode}
              onChange={handleSqlCodeChange}
              queryType="SQL"
              tables={savedTables}
              fileName="sandbox.sql"
              hideQuickSnippets={true}
              onSaveTables={handleSaveTables}
              placeholder="-- Database masih kosong. Mulailah dengan menuliskan perintah pembuatan tabel baru di sini, lalu klik Simpan..."
            />
          </div>
        </div>
      </div>
    </main>
  );
}
