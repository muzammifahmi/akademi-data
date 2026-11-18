"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function TambahKelasGuru() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guruInfo, setGuruInfo] = useState({
    name: "",
    nama_sekolah: "",
    npsn: "",
  });
  const [uniqueSuffix, setUniqueSuffix] = useState(() =>
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );
  const [formData, setFormData] = useState({
    nama_kelas: "",
    kode_kelas: "",
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setGuruInfo({
            name: data.name || "Guru Pengampu",
            nama_sekolah: data.nama_sekolah || "-",
            npsn: data.npsn || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (formData.nama_kelas.trim()) {
      const formattedNama = formData.nama_kelas
        .replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase()
        .slice(0, 8);
      const npsnPart = (guruInfo.npsn || "SCH").slice(-4).toUpperCase();
      setFormData((prev) => ({
        ...prev,
        kode_kelas: `${formattedNama}-${npsnPart}-${uniqueSuffix}`,
      }));
    } else {
      setFormData((prev) => ({ ...prev, kode_kelas: "" }));
    }
  }, [formData.nama_kelas, guruInfo.npsn, uniqueSuffix]);

  const regenerateSuffix = () => {
    setUniqueSuffix(Math.random().toString(36).substring(2, 6).toUpperCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/kelas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          title: "Kelas Berhasil Dibuat!",
          html: `Kelas <b>${formData.nama_kelas}</b> telah ditambahkan.<br/>Bagikan Kode Kelas <b class="font-mono text-[#0D47A1]">${formData.kode_kelas}</b> kepada siswa Anda.`,
          icon: "success",
          confirmButtonColor: "#2196F3",
        }).then(() => {
          router.push("/guru/kelas");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal Membuat Kelas",
          text: data.error || "Terjadi kesalahan saat menyimpan data kelas.",
          confirmButtonColor: "#2196F3",
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error Server",
        text: "Tidak dapat menghubungi server.",
        confirmButtonColor: "#2196F3",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full bg-[#F8FAFC]">
      <div className="w-full flex flex-col gap-1">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm font-medium text-slate-500 flex items-center gap-2">
          <Link href="/guru/dashboard" className="hover:text-[#2196F3] transition-colors">
            Dashboard
          </Link>
          <span>&gt;</span>
          <Link href="/guru/kelas" className="hover:text-[#2196F3] transition-colors">
            Manajemen Kelas
          </Link>
          <span>&gt;</span>
          <span className="text-slate-800">Buat Kelas Baru</span>
        </div>

        {/* Header */}
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden mb-6">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#2196F3]"></div>
          <h1 className="text-xl font-bold text-slate-800 ml-2">Buat Kelas Baru</h1>
          <p className="text-sm text-slate-500 mt-1 ml-2">
            Buat kelas pembelajaran SQL baru dan bagikan Kode Kelas otomatis kepada siswa Anda.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm w-full">
          <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                Informasi Kelas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Kelas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nama_kelas}
                    onChange={(e) => setFormData({ ...formData, nama_kelas: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] transition-colors"
                    placeholder="Contoh: XII RPL 1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Guru Pengampu &amp; Institusi
                  </label>
                  <input
                    type="text"
                    value={
                      guruInfo.nama_sekolah && guruInfo.nama_sekolah !== "-"
                        ? `${guruInfo.name} (${guruInfo.nama_sekolah})`
                        : guruInfo.name || "Memuat..."
                    }
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-sm bg-slate-100 text-slate-600 cursor-not-allowed font-medium"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                Kode Pendaftaran Siswa
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kode Kelas (Otomatis) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.kode_kelas}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-sm bg-blue-50/60 text-[#0D47A1] cursor-not-allowed font-mono uppercase tracking-widest font-bold"
                    placeholder="Ketik Nama Kelas untuk meng-generate kode..."
                  />
                  <button
                    type="button"
                    onClick={regenerateSuffix}
                    disabled={!formData.nama_kelas.trim()}
                    className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 hover:border-[#2196F3] hover:text-[#2196F3] text-slate-600 rounded-sm transition-colors disabled:opacity-50 cursor-pointer"
                    title="Acak Ulang Kode Unik"
                  >
                    Acak Kode
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-start gap-1.5">
                  <svg
                    className="w-4 h-4 text-[#2196F3] shrink-0 mt-0.5"
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
                  Siswa dapat bergabung ke kelas ini secara mandiri dengan memasukkan Kode Kelas di atas pada Portal Siswa.
                </p>
              </div>
            </div>

            <div className="!mt-8 -mx-5 -mb-5 md:-mx-6 md:-mb-6 px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-sm">
              <Link
                href="/guru/kelas"
                className="py-2 px-4 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-sm hover:bg-slate-50 transition-all shadow-sm"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || !formData.nama_kelas.trim()}
                className="py-2 px-5 text-sm font-bold bg-[#2196F3] text-white rounded-sm hover:bg-[#1976D2] transition-all shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan & Buat Kelas"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
