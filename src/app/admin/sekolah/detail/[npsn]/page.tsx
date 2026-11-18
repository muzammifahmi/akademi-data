"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export default function DetailDanEditSekolahAdmin({ params }: { params: Promise<{ npsn: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [sekolah, setSekolah] = useState<any>(null);
  const [formData, setFormData] = useState({
    npsn: "",
    nama_sekolah: "",
    email_sekolah: "",
    telepon: "",
    alamat: "",
    status: "Active",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/sekolah/${resolvedParams.npsn}`);
      const data = await res.json();

      if (res.ok && data.data) {
        setSekolah(data.data);
        setFormData({
          npsn: data.data.npsn || "",
          nama_sekolah: data.data.nama_sekolah || "",
          email_sekolah: data.data.email_sekolah || "",
          telepon: data.data.telepon || "",
          alamat: data.data.alamat || "",
          status: data.data.status || "Active",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Data Tidak Ditemukan",
          text: data.error,
          confirmButtonColor: "#2196F3",
        }).then(() => {
          router.push("/admin/sekolah");
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Kesalahan",
        text: "Gagal menghubungi server.",
        confirmButtonColor: "#2196F3",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [resolvedParams.npsn]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/sekolah/${resolvedParams.npsn}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "Perubahan Disimpan!",
          text: data.message || "Data sekolah berhasil diperbarui.",
          confirmButtonColor: "#2196F3",
        });
        if (formData.npsn !== resolvedParams.npsn) {
          router.push(`/admin/sekolah/detail/${formData.npsn}`);
        } else {
          fetchDetail();
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal Menyimpan",
          text: data.error || "Gagal memperbarui data sekolah.",
          confirmButtonColor: "#2196F3",
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Kesalahan",
        text: "Gagal menghubungi server.",
        confirmButtonColor: "#2196F3",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyToken = () => {
    if (!sekolah?.token_sekolah) return;
    navigator.clipboard.writeText(sekolah.token_sekolah);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateToken = async () => {
    const confirm = await Swal.fire({
      title: "Generate Token Sekolah Baru?",
      text: "Token lama tidak akan berlaku lagi untuk registrasi Guru baru.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2196F3",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Ya, Generate Baru",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/sekolah/${resolvedParams.npsn}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate_token" }),
      });
      const data = await res.json();
      if (res.ok) {
        setSekolah((prev: any) => ({ ...prev, token_sekolah: data.data.token_sekolah }));
        Swal.fire({
          icon: "success",
          title: "Token Baru Berhasil Dibuat!",
          text: `Token baru: ${data.data.token_sekolah}`,
          confirmButtonColor: "#2196F3",
        });
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: data.error, confirmButtonColor: "#2196F3" });
      }
    } catch {
      Swal.fire({ icon: "error", title: "Kesalahan", text: "Gagal menghubungi server.", confirmButtonColor: "#2196F3" });
    }
  };

  const handleToggleStatus = () => {
    const isCurrentlySuspended = sekolah?.status === "Suspended";
    Swal.fire({
      title: isCurrentlySuspended ? "Aktifkan Kembali Sekolah?" : "Suspend Institusi?",
      text: isCurrentlySuspended
        ? "Token sekolah ini akan dapat digunakan kembali untuk registrasi Guru."
        : "Registrasi Guru baru menggunakan token sekolah ini akan dibekukan sementara.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2196F3",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: isCurrentlySuspended ? "Ya, Aktifkan!" : "Ya, Suspend!",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/sekolah/${resolvedParams.npsn}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "toggle_status" }),
          });
          const data = await res.json();
          if (res.ok) {
            fetchDetail();
            Swal.fire({ icon: "success", title: "Berhasil!", text: data.message, confirmButtonColor: "#2196F3" });
          } else {
            Swal.fire({ icon: "error", title: "Gagal", text: data.error, confirmButtonColor: "#2196F3" });
          }
        } catch {
          Swal.fire({ icon: "error", title: "Kesalahan", text: "Gagal menghubungi server.", confirmButtonColor: "#2196F3" });
        }
      }
    });
  };

  const handleDelete = () => {
    Swal.fire({
      title: "Hapus Institusi?",
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/sekolah/${resolvedParams.npsn}`, { method: "DELETE" });
          const data = await res.json();
          if (res.ok) {
            Swal.fire({ icon: "success", title: "Terhapus!", text: data.message, showConfirmButton: false, timer: 1500 }).then(() => {
              router.push("/admin/sekolah");
            });
          } else {
            Swal.fire({ icon: "error", title: "Gagal", text: data.error, confirmButtonColor: "#2196F3" });
          }
        } catch {
          Swal.fire({ icon: "error", title: "Kesalahan", text: "Gagal menghubungi server.", confirmButtonColor: "#2196F3" });
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC]">
        <svg className="animate-spin h-10 w-10 text-[#2196F3]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!sekolah) return null;

  const inputClass =
    "w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] transition-colors";

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6 w-full bg-[#F8FAFC]">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2196F3]"></div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/admin/sekolah" className="text-slate-400 hover:text-[#2196F3] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-slate-800">Edit Data Sekolah, Token &amp; Analitik</h1>
            </div>
            <p className="text-slate-500 font-medium text-sm ml-7">
              Perbarui informasi institusi sekolah, kelola Token Sekolah, dan lihat analitik jumlah Guru serta Siswa.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleStatus}
              className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-200 font-medium rounded-sm hover:bg-amber-100 transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              {sekolah.status === "Suspended" ? "Aktifkan Sekolah" : "Suspend Sekolah"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 font-medium rounded-sm hover:bg-rose-100 transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Hapus Sekolah
            </button>
          </div>
        </div>

        {/* Analitik Guru & Siswa di Sekolah Ini + Token Sekolah */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Token Sekolah Card */}
          <div className="lg:col-span-2 bg-[#0D47A1] text-white p-6 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Token Sekolah Unik (Khusus Registrasi Guru)
              </span>
              <div className="text-2xl font-mono font-extrabold tracking-widest mt-1 select-all">
                {sekolah.token_sekolah || "-"}
              </div>
              <p className="text-xs text-blue-100 mt-1">
                Berikan token ini kepada Guru di <b>{sekolah.nama_sekolah}</b> untuk dimasukkan saat mendaftar akun Guru.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleCopyToken}
                className="px-4 py-2 bg-white text-[#0D47A1] font-bold text-sm rounded-sm hover:bg-blue-50 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copied ? "Token Tersalin!" : "Salin Token"}
              </button>
              <button
                type="button"
                onClick={handleRegenerateToken}
                className="px-4 py-2 bg-[#2196F3] text-white font-semibold text-sm rounded-sm hover:bg-[#1976D2] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Generate Ulang
              </button>
            </div>
          </div>

          {/* Kartu Analitik Guru & Siswa di Sekolah Ini */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 flex flex-col justify-between">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Analitik Pengguna Sekolah Ini
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-sm">
                <div className="text-xs font-semibold text-indigo-800">Jumlah Guru</div>
                <div className="text-2xl font-extrabold text-indigo-700 mt-0.5">
                  {sekolah.jumlah_guru || 0}
                </div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-sm">
                <div className="text-xs font-semibold text-emerald-800">Jumlah Siswa</div>
                <div className="text-2xl font-extrabold text-emerald-700 mt-0.5">
                  {sekolah.jumlah_siswa || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Edit Data Sekolah */}
        <form onSubmit={handleSaveChanges} className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Form Edit Data Sekolah</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Admin dapat mengubah informasi identitas dan kontak sekolah secara langsung di bawah ini.
                </p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  (formData.status || "Active") === "Active"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-rose-50 text-rose-600 border border-rose-200"
                }`}
              >
                {formData.status || "Active"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  NPSN (Nomor Pokok Sekolah Nasional) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.npsn}
                  onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                  required
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Institusi / Sekolah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama_sekolah}
                  onChange={(e) => setFormData({ ...formData, nama_sekolah: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Resmi Sekolah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email_sekolah}
                  onChange={(e) => setFormData({ ...formData, email_sekolah: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  value={formData.telepon}
                  onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                  placeholder="Contoh: 021-1234567"
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alamat Lengkap <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
            <Link
              href="/admin/sekolah"
              className="px-4 py-2 text-sm text-slate-600 font-medium hover:bg-slate-200 rounded-sm transition-colors"
            >
              Kembali
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#2196F3] text-white text-sm font-semibold rounded-sm hover:bg-[#1976D2] transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {isSaving ? "Menyimpan..." : "Simpan Perubahan Data Sekolah"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
