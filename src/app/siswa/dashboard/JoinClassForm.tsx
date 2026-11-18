"use client";

import { useState } from "react";
import Swal from "sweetalert2";

export default function JoinClassForm({
  userName,
  defaultSekolahId = "",
}: {
  userName?: string;
  defaultSekolahId?: string;
}) {
  const [kodeKelas, setKodeKelas] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!kodeKelas.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Kode Kelas Kosong",
        text: "Silakan masukkan Kode Kelas terlebih dahulu.",
        confirmButtonColor: "#2196F3",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/siswa/join-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kodeKelas: kodeKelas.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: data.message || "Anda berhasil bergabung ke kelas.",
          confirmButtonColor: "#2196F3",
        }).then(() => {
          window.location.reload();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal Bergabung",
          text: data.error || "Terjadi kesalahan saat validasi kode kelas.",
          confirmButtonColor: "#2196F3",
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error Jaringan",
        text: "Gagal menghubungi server.",
        confirmButtonColor: "#2196F3",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row animate-in fade-in zoom-in-95 duration-500">
      {/* Kolom Kiri - Info / Welcome */}
      <div className="w-full lg:w-5/12 bg-slate-50 p-8 lg:p-12 flex flex-col justify-center items-center text-center border-b lg:border-b-0 lg:border-r border-slate-200 relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#2196F3]"></div>
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <svg className="w-12 h-12 text-[#2196F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Langkah Terakhir!</h2>
        <p className="text-slate-600 text-[15px] leading-relaxed max-w-sm">
          Akun Anda telah berhasil dibuat, namun belum terhubung ke kelas manapun. Masukkan Kode Kelas dari Guru Anda untuk mulai mengakses modul dan latihan.
        </p>
      </div>

      {/* Kolom Kanan - Form Input Kode Kelas Saja */}
      <div className="w-full lg:w-7/12 p-8 lg:p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <h3 className="text-xl font-bold text-slate-800 mb-6 pb-3 border-b border-slate-100">
            Bergabung ke Kelas
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Kode Kelas
              </label>
              <input
                type="text"
                value={kodeKelas}
                onChange={(e) => setKodeKelas(e.target.value.toUpperCase())}
                placeholder="MASUKKAN KODE KELAS"
                className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2196F3]/20 focus:border-[#2196F3] transition-all text-center font-bold text-slate-800 tracking-[0.25em] text-lg uppercase"
                required
              />
              <div className="mt-3 flex items-start gap-2 bg-blue-50 p-3 rounded-md border border-blue-100">
                <svg
                  className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"
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
                <p className="text-xs text-blue-800 leading-relaxed font-medium">
                  Kode kelas berupa kombinasi huruf dan angka unik. Mintalah kode ini kepada Guru mata pelajaran Anda.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 mt-2 bg-[#2196F3] text-white font-semibold rounded-lg hover:bg-[#1976D2] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                "Bergabung ke Kelas"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
