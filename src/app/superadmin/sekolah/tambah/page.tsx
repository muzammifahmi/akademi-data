"use client";

import Link from "next/link";
import { useState } from "react";
import Swal from "sweetalert2";

export default function TambahSekolah() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingNpsn, setIsFetchingNpsn] = useState(false);
  const [searchNpsn, setSearchNpsn] = useState("");

  const [formData, setFormData] = useState({
    npsn: "",
    nama_sekolah: "",
    email_sekolah: "",
    telepon: "",
    alamat: "",
    admin_nama: "",
    admin_email: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const cekNpsn = async () => {
    if (!searchNpsn) {
      Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Harap inputkan NPSN terlebih dahulu.', confirmButtonColor: '#2196F3' });
      return;
    }
    setIsFetchingNpsn(true);
    try {
      // Memanggil Internal API Route sesuai panduan arsitektur Next.js
      const res = await fetch(`/api/sekolah/npsn?npsn=${searchNpsn}`);
      const result = await res.json();
      
      if (result && result.data && result.data.length > 0) {
        const sekolah = result.data[0];
        setFormData((prev) => ({
          ...prev,
          npsn: searchNpsn, // Isi npsn manual di form
          nama_sekolah: sekolah.nama || "",
          alamat: sekolah.alamat?.jalan || "",
          telepon: sekolah.kontak?.nomor_telepon || "",
          email_sekolah: sekolah.kontak?.email || ""
        }));
        
        Swal.fire({
          icon: 'success',
          title: 'Data Ditemukan',
          text: `Data sekolah ${sekolah.nama || searchNpsn} berhasil disalin ke form.`,
          confirmButtonColor: '#2196F3',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({ icon: 'error', title: 'Tidak Ditemukan', text: 'NPSN tidak ditemukan di database Dapodik.', confirmButtonColor: '#2196F3' });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengambil data dari API.', confirmButtonColor: '#2196F3' });
    } finally {
      setIsFetchingNpsn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/sekolah", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Registrasi Berhasil', text: 'Data institusi telah disimpan. Kredensial akses telah dikirimkan dengan aman ke alamat email administrator.', confirmButtonColor: '#2196F3' }).then(() => {
          window.location.href = "/superadmin/sekolah";
        });
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal Mendaftar', text: data.error || "Gagal mendaftarkan sekolah.", confirmButtonColor: '#2196F3' });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Kesalahan Jaringan', text: 'Terjadi kesalahan jaringan.', confirmButtonColor: '#2196F3' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Class utilitas untuk input agar ringkas
  const inputClass = "w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] transition-colors";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5";

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full bg-[#F8FAFC]">
      <div className="w-full flex flex-col gap-4">
        
        {/* Breadcrumb & Header (Lebih Ringkas) */}
        <div>
          <div className="flex items-center text-xs text-slate-500 mb-2">
            <Link href="/superadmin/sekolah" className="hover:text-[#2196F3] transition-colors">Manajemen Mitra Sekolah</Link>
            <svg className="w-3 h-3 mx-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-slate-800 font-medium">Tambah Sekolah</span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2196F3]"></div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Registrasi Mitra Sekolah Baru</h1>
              <p className="text-slate-500 text-sm mt-0.5">Lengkapi form berikut untuk mendaftarkan institusi sekolah baru.</p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 shadow-sm rounded-sm">
          <div className="p-5 md:p-6 space-y-6">
            
            {/* Section 1: Informasi Sekolah */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-50 text-[#2196F3] flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  Informasi Institusi
                </h2>
                
                {/* Search NPSN Top Right */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input 
                    type="text" 
                    value={searchNpsn}
                    onChange={(e) => setSearchNpsn(e.target.value)}
                    placeholder="Ketik NPSN..." 
                    className="w-full sm:w-48 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2196F3] transition-colors" 
                  />
                  <button 
                    type="button" 
                    onClick={cekNpsn}
                    disabled={isFetchingNpsn}
                    className="px-3 py-1.5 bg-[#2196F3] text-white text-sm font-medium rounded-md hover:bg-[#1976D2] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm shadow-blue-500/20"
                  >
                    {isFetchingNpsn ? (
                      <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    )}
                    Tarik Data
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="md:col-span-2">
                  <label className={labelClass}>Nomor Pokok Sekolah Nasional (NPSN) <span className="text-rose-500">*</span></label>
                  <input type="text" name="npsn" value={formData.npsn} onChange={handleChange} required placeholder="Masukkan NPSN, misal: 20584198" className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Nama Sekolah <span className="text-rose-500">*</span></label>
                  <input type="text" name="nama_sekolah" value={formData.nama_sekolah} onChange={handleChange} required placeholder="Contoh: SMKN 1 Jakarta" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email Sekolah <span className="text-rose-500">*</span></label>
                  <input type="email" name="email_sekolah" value={formData.email_sekolah} onChange={handleChange} required placeholder="Contoh: info@sekolah.sch.id" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nomor Telepon</label>
                  <input type="tel" name="telepon" value={formData.telepon} onChange={handleChange} placeholder="Contoh: 021-1234567" className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Alamat Lengkap Sekolah <span className="text-rose-500">*</span></label>
                  <textarea name="alamat" value={formData.alamat} onChange={handleChange} required rows={2} placeholder="Alamat detail institusi" className={inputClass}></textarea>
                </div>
              </div>
            </div>

            {/* Section 2: Akun Admin Utama */}
            <div>
              <h2 className="text-base font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                Akun Admin Sekolah
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                  <label className={labelClass}>Nama Admin <span className="text-rose-500">*</span></label>
                  <input type="text" name="admin_nama" value={formData.admin_nama} onChange={handleChange} required placeholder="Contoh: Budi Santoso" className={inputClass} />
                </div>
                <div className="md:col-span-1">
                  <label className={labelClass}>Email Login <span className="text-rose-500">*</span></label>
                  <input type="email" name="admin_email" value={formData.admin_email} onChange={handleChange} required placeholder="admin@sekolah.sch.id" className={inputClass} />
                </div>
              </div>
            </div>

          </div>

          {/* Form Actions Footer */}
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-sm">
            <Link href="/superadmin/sekolah" className="px-4 py-1.5 text-sm text-slate-600 font-medium hover:bg-slate-200 rounded-md transition-colors">
              Batal
            </Link>
            <button type="submit" disabled={isSubmitting} className="px-5 py-1.5 bg-[#2196F3] text-white text-sm font-medium rounded-md hover:bg-[#1976D2] transition-colors shadow-sm shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2">
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Menyimpan...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Simpan Data
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </main>
  );
}
