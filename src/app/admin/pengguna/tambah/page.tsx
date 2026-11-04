"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function TambahPengguna() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nomorInduk: "",
    nama: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        nomorInduk: formData.nomorInduk,
        nama: formData.nama,
        email: formData.email,
      };

      const res = await fetch('/api/pengguna/tambah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: data.message || 'Data Guru berhasil ditambahkan. Kredensial telah dikirim via email.',
          confirmButtonColor: '#2196F3'
        }).then(() => {
          router.push("/admin/pengguna");
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: data.error || 'Terjadi kesalahan.',
          confirmButtonColor: '#2196F3'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Kesalahan',
        text: 'Gagal menghubungi server.',
        confirmButtonColor: '#2196F3'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full bg-[#F8FAFC]">
      <div className="w-full flex flex-col gap-1">
        
        {/* Breadcrumb */}
        <div className="mb-4 text-sm font-medium text-slate-500 flex items-center gap-2">
          <Link href="/admin/pengguna" className="hover:text-[#2196F3] transition-colors">
            Manajemen Pengguna
          </Link>
          <span>&gt;</span>
          <span className="text-slate-800">Tambah Guru Baru</span>
        </div>

        {/* Header Card */}
        <div className="mb-6 bg-white p-5 rounded-sm border border-slate-200 border-l-4 border-l-[#2196F3] shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Tambah Guru Baru</h1>
          <p className="text-slate-500 mt-1.5 text-[15px]">Tambahkan data guru atau tenaga pendidik secara manual ke dalam sistem.</p>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-slate-200/60 rounded-sm shadow-sm">
          
          <form onSubmit={handleSubmit}>
            <div className="p-5 md:p-6 space-y-6">
              
              {/* Seksi Peran Pengguna (Dihapus karena khusus Guru) */}

              {/* Seksi Data Diri */}
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">Data Identitas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Nomor Induk */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      NIP (Nomor Induk Pegawai) <span className="text-slate-400 font-normal ml-1">(Opsional)</span>
                    </label>
                    <input 
                      type="text" 
                      value={formData.nomorInduk}
                      onChange={(e) => setFormData({ ...formData, nomorInduk: e.target.value })}
                      placeholder="Misal: 198801122010011003"
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] transition-colors"
                    />
                  </div>

                  {/* Nama Lengkap */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Lengkap <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      placeholder="Nama lengkap beserta gelar (jika ada)"
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] transition-colors"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Alamat Email <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@sekolah.sch.id"
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] transition-colors"
                      required
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Wajib diisi sebagai username alternatif atau keperluan reset password.
                    </p>
                  </div>

                </div>
              </div>

              {/* Alert Info Auto-Password */}
              <div className="bg-blue-50 border border-blue-100 rounded-md p-3 flex items-start gap-3 mt-4">
                <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div className="text-sm text-blue-800">
                  <span className="font-semibold">Informasi Password:</span> Sistem akan men-generate password secara otomatis untuk keamanan. Kredensial login akan dikirimkan dengan aman ke alamat email guru yang didaftarkan.
                </div>
              </div>

            </div>

            {/* Form Actions / Footer */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-sm">
              <Link 
                href="/admin/pengguna"
                className="py-1.5 px-4 text-sm bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-all shadow-sm"
              >
                Batal
              </Link>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="py-1.5 px-4 text-sm bg-[#2196F3] text-white font-medium rounded-lg hover:bg-[#1976D2] transition-all shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Simpan Data
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
