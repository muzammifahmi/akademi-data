"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export default function DetailSekolah({ params }: { params: Promise<{ npsn: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [sekolah, setSekolah] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/sekolah/${resolvedParams.npsn}`);
        const data = await res.json();
        
        if (res.ok) {
          setSekolah(data.data);
        } else {
          Swal.fire({ icon: 'error', title: 'Data Tidak Ditemukan', text: data.error, confirmButtonColor: '#2196F3' }).then(() => {
            router.push('/superadmin/sekolah');
          });
        }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Kesalahan', text: 'Gagal menghubungi server.', confirmButtonColor: '#2196F3' });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDetail();
  }, [resolvedParams.npsn, router]);

  const handleDelete = () => {
    Swal.fire({
      title: 'Hapus Institusi?',
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/sekolah/${resolvedParams.npsn}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok) {
            Swal.fire({ icon: 'success', title: 'Terhapus!', text: data.message, showConfirmButton: false, timer: 1500 }).then(() => {
              router.push('/superadmin/sekolah');
            });
          } else {
            Swal.fire({ icon: 'error', title: 'Gagal', text: data.error, confirmButtonColor: '#2196F3' });
          }
        } catch (error) {
          Swal.fire({ icon: 'error', title: 'Kesalahan', text: 'Gagal menghubungi server.', confirmButtonColor: '#2196F3' });
        }
      }
    });
  };

  const handleSuspend = () => {
    Swal.fire({
      title: 'Suspend Institusi?',
      text: "Akses admin sekolah ini akan dibekukan sementara.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2196F3',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Suspend!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/sekolah/${resolvedParams.npsn}`, { method: 'PATCH' });
          const data = await res.json();
          if (res.ok) {
            Swal.fire({ icon: 'success', title: 'Berhasil!', text: data.message, confirmButtonColor: '#2196F3' });
          } else {
            Swal.fire({ icon: 'error', title: 'Gagal', text: data.error, confirmButtonColor: '#2196F3' });
          }
        } catch (error) {
          Swal.fire({ icon: 'error', title: 'Kesalahan', text: 'Gagal menghubungi server.', confirmButtonColor: '#2196F3' });
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC]">
        <svg className="animate-spin h-10 w-10 text-[#2196F3]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
    );
  }

  if (!sekolah) return null;

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6 w-full bg-[#F8FAFC]">
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2196F3]"></div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/superadmin/sekolah" className="text-slate-400 hover:text-[#2196F3] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </Link>
              <h1 className="text-xl font-bold text-slate-800">Detail Institusi</h1>
            </div>
            <p className="text-slate-500 font-medium text-sm ml-7">Informasi baca-saja (read-only) untuk tenant sekolah terdaftar.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={handleSuspend} className="px-4 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 font-medium rounded-lg hover:bg-amber-100 transition-all flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
              Suspend
            </button>
            <button onClick={handleDelete} className="px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 font-medium rounded-lg hover:bg-rose-100 transition-all flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Hapus
            </button>
          </div>
        </div>

        {/* Form Read-Only */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 space-y-6">
            
            <div className="border-b border-slate-100 pb-2 mb-3">
              <h2 className="text-base font-bold text-slate-800">Identitas Sekolah</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">NPSN (Nomor Pokok Sekolah Nasional)</label>
                <div className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-md text-slate-600 font-medium cursor-not-allowed">
                  {sekolah.npsn}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Institusi / Sekolah</label>
                <div className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-md text-slate-600 font-medium cursor-not-allowed">
                  {sekolah.nama_sekolah}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Alamat Lengkap</label>
                <div className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-md text-slate-600 font-medium cursor-not-allowed min-h-[80px]">
                  {sekolah.alamat}
                </div>
              </div>
            </div>

            <div className="border-b border-slate-100 pb-2 mb-3 pt-4">
              <h2 className="text-base font-bold text-slate-800">Kontak & Admin Utama</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Resmi Sekolah</label>
                <div className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-md text-slate-600 font-medium cursor-not-allowed">
                  {sekolah.email_sekolah}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nomor Telepon</label>
                <div className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-md text-slate-600 font-medium cursor-not-allowed">
                  {sekolah.telepon || "-"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Administrator Utama</label>
                <div className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-md text-slate-600 font-medium cursor-not-allowed">
                  {sekolah.admin_nama}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Administrator (Login)</label>
                <div className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-md text-slate-600 font-medium cursor-not-allowed">
                  {sekolah.admin_email}
                </div>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </main>
  );
}
