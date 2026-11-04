"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function DetailKelasAdmin({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const classId = resolvedParams.id;

  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [guruList, setGuruList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchSiswa, setSearchSiswa] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    nama_kelas: '',
    kode_kelas: '',
    guru_pengampu: '' // Assuming ID for select, but for now we might just have name or we need to fetch teachers
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/kelas/${classId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setClassData(data.data);
          setEditForm({
            nama_kelas: data.data.nama_kelas,
            kode_kelas: data.data.kode_kelas,
            guru_pengampu: typeof data.data.guru_pengampu === 'object' && data.data.guru_pengampu !== null 
              ? data.data.guru_pengampu._id 
              : data.data.guru_pengampu || ''
          });
        }
        
        // Fetch teachers
        const guruRes = await fetch('/api/pengguna').catch(() => null);
        if (guruRes) {
          const guruData = await guruRes.json();
          if (guruData.success && guruData.data) {
            setGuruList(guruData.data.filter((u: any) => u.role === 'Guru'));
          }
        }

        // Fetch students later if we have the endpoint
        const stuRes = await fetch(`/api/kelas/${classId}/siswa`).catch(() => null);
        if (stuRes) {
           const stuData = await stuRes.json();
           if (stuData.success) {
               setStudents(stuData.data || []);
           }
        }
      } catch (error) {
        console.error("Failed to fetch class detail:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [classId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/kelas/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Kelas berhasil diperbarui!',
          confirmButtonColor: '#2196F3'
        }).then(() => {
          setIsEditing(false);
          // Update local state
          setClassData({ ...classData, ...editForm, guru_pengampu: { ...classData.guru_pengampu, _id: editForm.guru_pengampu }}); // Simplified
          window.location.reload(); // Quick refresh to get populated data
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: data.error || "Gagal memperbarui kelas",
          confirmButtonColor: '#2196F3'
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error Jaringan',
        text: "Terjadi kesalahan sistem",
        confirmButtonColor: '#2196F3'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchSiswa.toLowerCase()) || 
    (student.nisn_nip && student.nisn_nip.includes(searchSiswa))
  );

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Memuat data kelas...</div>;
  }

  if (!classData) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-slate-700 mb-2">Kelas tidak ditemukan</h2>
        <Link href="/admin/kelas" className="text-[#2196F3] hover:underline">Kembali ke Daftar Kelas</Link>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
      
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-slate-500 mb-4">
          <Link href="/admin/kelas" className="hover:text-[#2196F3] transition-colors">Manajemen Kelas</Link>
          <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-slate-800 font-medium">{classData.nama_kelas}</span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden">
          {/* Aksen Warna */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#2196F3]"></div>
          
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{classData.nama_kelas}</h1>
            <p className="text-slate-500 font-medium mt-1">Wali/Pengampu: {classData.guru_pengampu?.name || '-'}</p>
          </div>
          
          <div className="flex items-center gap-4 text-sm bg-slate-50 p-3 rounded-sm border border-slate-100">
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">Kode Kelas</p>
              <code className="font-mono font-bold text-slate-700">{classData.kode_kelas}</code>
            </div>
            <button onClick={() => navigator.clipboard.writeText(classData.kode_kelas)} className="p-2 text-slate-400 hover:text-[#2196F3] bg-white border border-slate-200 rounded-sm hover:border-[#2196F3] transition-colors" title="Salin Kode">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri - Info & Edit Kelas */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">Detail Kelas</h2>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-[#2196F3] hover:text-[#0D47A1] transition-colors flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Kelas</label>
                  <input type="text" value={editForm.nama_kelas} onChange={e => setEditForm({...editForm, nama_kelas: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#2196F3] text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Kode Kelas</label>
                  <div className="w-full px-3 py-2 border border-slate-200 rounded-sm bg-slate-50 text-slate-500 text-sm font-mono cursor-not-allowed">
                    {classData.kode_kelas}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Kode kelas tidak dapat diubah setelah dibuat.</p>
                </div>
                <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-1">Wali / Pengampu</label>
                   <select 
                     value={editForm.guru_pengampu} 
                     onChange={e => setEditForm({...editForm, guru_pengampu: e.target.value})} 
                     className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#2196F3] text-sm bg-white" 
                     required
                   >
                     <option value="" disabled>-- Pilih Guru Pengampu --</option>
                     {guruList.map((guru) => (
                       <option key={guru.id} value={guru.id}>{guru.nama} ({guru.email})</option>
                     ))}
                   </select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-sm transition-colors">Batal</button>
                  <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-[#2196F3] hover:bg-[#1976D2] text-white text-sm font-bold rounded-sm transition-colors">
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Status</p>
                  <p className="text-sm font-bold text-emerald-600 mt-0.5">{classData.status || 'Aktif'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Wali / Guru Pengampu</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">{classData.guru_pengampu?.name || '-'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{classData.guru_pengampu?.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Total Siswa Terdaftar</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">{classData.jumlah_siswa || 0} Orang</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan - Daftar Siswa */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm flex flex-col h-full min-h-[500px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Daftar Siswa</h2>
                <p className="text-sm text-slate-500 mt-1">Siswa yang tergabung menggunakan kode kelas.</p>
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Cari siswa..." 
                  value={searchSiswa}
                  onChange={(e) => setSearchSiswa(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-[#2196F3]"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-600">
                    <th className="border border-slate-200 px-4 py-3 font-semibold uppercase tracking-wider">Nama Lengkap</th>
                    <th className="border border-slate-200 px-4 py-3 font-semibold uppercase tracking-wider">Email</th>
                    <th className="border border-slate-200 px-4 py-3 font-semibold uppercase tracking-wider">NISN</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((siswa, idx) => (
                      <tr key={siswa._id || idx} className="hover:bg-slate-50">
                        <td className="border border-slate-200 px-4 py-3 font-medium text-slate-800">{siswa.name}</td>
                        <td className="border border-slate-200 px-4 py-3 text-slate-600">{siswa.email || '-'}</td>
                        <td className="border border-slate-200 px-4 py-3 text-slate-600">{siswa.nisn_nip || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="border border-slate-200 px-4 py-12 text-center text-slate-500">
                        {searchSiswa ? 'Siswa tidak ditemukan.' : 'Belum ada siswa yang tergabung di kelas ini.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
