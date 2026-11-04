"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function TambahKelas() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kodeSekolah, setKodeSekolah] = useState("");
  const [guruList, setGuruList] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nama_kelas: "",
    guru_pengampu: "",
    kode_kelas: ""
  });

  useEffect(() => {
    // Ambil data admin
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.error && data.npsn) {
          setKodeSekolah(data.npsn);
        }
      });

    // Ambil daftar guru
    fetch('/api/pengguna')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          const guru = res.data.filter((u: any) => u.role === 'Guru');
          setGuruList(guru);
        }
      })
      .catch(err => console.error("Gagal mengambil data guru", err));
  }, []);

  useEffect(() => {
    if (formData.nama_kelas) {
      const formattedNama = formData.nama_kelas.replace(/\s+/g, '').toUpperCase();
      // Only generate unique code if it doesn't already exist or if we want it strictly tied
      // Let's preserve the kodeUnik if possible so it doesn't change on every keystroke, 
      // or we can generate it once and store it.
      // But for simplicity, let's keep a stable random part or generate it on first type.
      setFormData(prev => {
        const existingUnique = prev.kode_kelas.split('-').pop();
        const kodeUnik = (existingUnique && existingUnique.length === 4) ? existingUnique : Math.random().toString(36).substring(2, 6).toUpperCase();
        const finalKode = `${formattedNama}-${kodeSekolah || 'XXXX'}-${kodeUnik}`;
        return { ...prev, kode_kelas: finalKode };
      });
    } else {
      setFormData(prev => ({ ...prev, kode_kelas: "" }));
    }
  }, [formData.nama_kelas, kodeSekolah]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/kelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        Swal.fire({
          title: 'Berhasil!',
          text: 'Data kelas baru berhasil ditambahkan.',
          icon: 'success',
          confirmButtonColor: '#2196F3',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          router.push('/admin/kelas');
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: data.error || 'Terjadi kesalahan saat menyimpan data.',
          confirmButtonColor: '#2196F3'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error Server',
        text: 'Tidak dapat menghubungi server.',
        confirmButtonColor: '#2196F3'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full bg-[#F8FAFC]">
      <div className="w-full flex flex-col gap-1">
        
        {/* Breadcrumb */}
        <div className="mb-4 text-sm font-medium text-slate-500 flex items-center gap-2">
          <Link href="/admin/dashboard" className="hover:text-[#2196F3] transition-colors">Utama</Link>
          <span>&gt;</span>
          <Link href="/admin/kelas" className="hover:text-[#2196F3] transition-colors">Daftar Kelas</Link>
          <span>&gt;</span>
          <span className="text-slate-800">Tambah Baru</span>
        </div>

        {/* Header Sesuai PRD */}
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden mb-6">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2196F3]"></div>
          <h1 className="text-xl font-bold text-slate-800 ml-2">Tambah Kelas Baru</h1>
        </div>

        {/* Form Card Compact Sesuai PRD (Full Width) */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm w-full">
          <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-6">
            
            {/* Bagian 1: Informasi Kelas */}
            <div>
              <h2 className="text-base font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">Informasi Kelas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Kelas *</label>
                  <input 
                    type="text" 
                    value={formData.nama_kelas}
                    onChange={(e) => setFormData({...formData, nama_kelas: e.target.value})}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] transition-colors" 
                    placeholder="Contoh: XII RPL 1" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Wali Kelas / Guru Pengampu *</label>
                  <select 
                    value={formData.guru_pengampu}
                    onChange={(e) => setFormData({...formData, guru_pengampu: e.target.value})}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] transition-colors bg-white"
                    required
                  >
                    <option value="" disabled>Pilih Guru</option>
                    {guruList.map(guru => (
                      <option key={guru.id} value={guru.id}>
                        {guru.nama} {guru.nisn_nip && guru.nisn_nip !== "-" ? `(${guru.nisn_nip})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            </div>
            
            {/* Bagian 2: Kode Pendaftaran */}
            <div>
              <h2 className="text-base font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">Sistem Pendaftaran</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kode Kelas (Bagikan ke Siswa) *</label>
                  <input 
                    type="text" 
                    value={formData.kode_kelas}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-slate-100 text-slate-500 cursor-not-allowed font-mono uppercase tracking-widest font-bold" 
                    placeholder="Kode akan otomatis terisi..." 
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-start gap-1">
                <svg className="w-4 h-4 text-[#2196F3] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Kode kelas ini di-generate secara otomatis berdasarkan Nama Kelas, NPSN Sekolah, dan Kode Unik. Siswa akan menggunakan kode ini untuk bergabung ke kelas secara mandiri.
              </p>
            </div>

            {/* Tombol Aksi di dalam tag <form> untuk memicu onsubmit tapi secara visual seperti footer */}
            <div className="!mt-8 -mx-5 -mb-5 md:-mx-6 md:-mb-6 px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-sm">
              <Link 
                href="/admin/kelas" 
                className="py-1.5 px-4 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 transition-all shadow-sm"
              >
                Batal
              </Link>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="py-1.5 px-4 text-sm font-medium bg-[#2196F3] text-white rounded-md hover:bg-[#1976D2] transition-all shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Simpan Kelas Baru
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
