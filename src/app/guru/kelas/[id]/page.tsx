"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Swal from 'sweetalert2';

export default function DetailKelas() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState('tugas');
  const [moduls, setModuls] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchSiswa, setSearchSiswa] = useState('');

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [modulsRes, studentsRes] = await Promise.all([
          fetch(`/api/modul?kelas_id=${params.id}`),
          fetch(`/api/kelas/${params.id}/siswa`)
        ]);

        const modulsData = await modulsRes.json();
        const studentsData = await studentsRes.json();

        if (modulsData.success) {
          setModuls(modulsData.data);
        }
        if (studentsData.success) {
          setStudents(studentsData.data);
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  // Data dummy, idealnya difetch berdasarkan params.id
  const classData = {
    id: params.id as string,
    name: "XII RPL 1",
    subject: "Basis Data Dasar",
    code: "DB1-X29A",
    studentsCount: students.length,
    modulesCount: moduls.length,
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchSiswa.toLowerCase()) || 
    (student.nisn_nip && student.nisn_nip.includes(searchSiswa))
  );

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
      
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-slate-500 mb-4">
          <Link href="/guru/kelas" className="hover:text-[#2196F3] transition-colors">Manajemen Kelas</Link>
          <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-slate-800 font-medium">{classData.name}</span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden">
          {/* Aksen Warna */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#2196F3]"></div>
          
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{classData.name}</h1>
            <p className="text-slate-500 font-medium mt-1">{classData.subject}</p>
          </div>
          
          <div className="flex items-center gap-4 text-sm bg-slate-50 p-3 rounded-sm border border-slate-100">
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">Kode Kelas</p>
              <code className="font-mono font-bold text-slate-700">{classData.code}</code>
            </div>
            <button className="p-2 text-slate-400 hover:text-[#2196F3] bg-white border border-slate-200 rounded-sm hover:border-[#2196F3] transition-colors" title="Salin Kode">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Utama */}
        <div className="lg:col-span-2">
          
          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-200 mb-6 gap-2">
            <button 
              onClick={() => setActiveTab('tugas')}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'tugas' ? 'border-[#2196F3] text-[#2196F3]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Tugas / Ujian
            </button>
            <button 
              onClick={() => setActiveTab('modul')}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'modul' ? 'border-[#2196F3] text-[#2196F3]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Modul
            </button>
            <button 
              onClick={() => setActiveTab('pengumuman')}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'pengumuman' ? 'border-[#2196F3] text-[#2196F3]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Pengumuman
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            
            {activeTab === 'tugas' && (
              <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#2196F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Tugas & Ujian Terbaru
                  </h2>
                  <button className="text-sm text-[#2196F3] hover:text-[#0D47A1] font-medium transition-colors">Lihat Semua</button>
                </div>
                
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 border border-slate-100 rounded-sm hover:border-slate-200 hover:bg-slate-50 transition-colors">
                      <div>
                        <h4 className="font-semibold text-slate-700">Tugas Harian {i}: ERD & Normalisasi</h4>
                        <p className="text-xs text-slate-500 mt-1">Tenggat: 24 Okt 2026, 23:59</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-600">Dikumpulkan: <span className="text-[#2196F3] font-bold">28/34</span></p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full py-2.5 border border-dashed border-slate-300 text-slate-500 rounded-sm font-medium hover:border-[#2196F3] hover:text-[#2196F3] transition-colors flex items-center justify-center gap-2 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Buat Tugas Baru
                </button>
              </div>
            )}

            {activeTab === 'modul' && (
              <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#2196F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    Modul Pembelajaran ({classData.modulesCount})
                  </h2>
                  <Link 
                    href={`/guru/kelas/${classData.id}/tambah-modul`}
                    className="p-2 bg-[#2196F3] text-white rounded-sm hover:bg-[#0D47A1] transition-colors flex items-center justify-center shadow-sm" title="Tambah Modul">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </Link>
                </div>
                
                <div className="overflow-x-auto border border-slate-200 rounded-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                        <th className="px-4 py-3 font-semibold text-slate-600 border border-slate-200 w-16">ID</th>
                        <th className="px-4 py-3 font-semibold text-slate-600 border border-slate-200">Judul Modul</th>
                        <th className="px-4 py-3 font-semibold text-slate-600 border border-slate-200">Status</th>
                        <th className="px-4 py-3 font-semibold text-slate-600 border border-slate-200">Tanggal Aktif</th>
                        <th className="px-4 py-3 font-semibold text-slate-600 text-center border border-slate-200 w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Memuat data...</td>
                        </tr>
                      ) : moduls.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Belum ada modul.</td>
                        </tr>
                      ) : moduls.map((modul, i) => (
                        <tr key={modul._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-b-0">
                          <td className="px-4 py-3 text-sm text-[#2196F3] font-bold border border-slate-200">M{i+1}</td>
                          <td className="px-4 py-3 border border-slate-200">
                            <div className="font-semibold text-slate-700 text-sm">{modul.judul}</div>
                          </td>
                          <td className="px-4 py-3 border border-slate-200">
                            {modul.status === 'Terbit' ? (
                               <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-sm font-semibold text-[11px] uppercase tracking-wider">Aktif</span>
                            ) : (
                               <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-sm font-semibold text-[11px] uppercase tracking-wider">Draft</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500 border border-slate-200">
                            {modul.status === 'Draft' ? '-' : new Date(modul.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-center border border-slate-200">
                            <div className="flex items-center justify-center gap-2">
                              <Link href={`/guru/kelas/${classData.id}/edit-modul/${modul._id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-sm transition-colors block" title="Edit Modul">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </Link>
                              <button 
                                onClick={async () => {
                                  const result = await Swal.fire({
                                    title: 'Hapus Modul?',
                                    text: "Anda tidak dapat mengembalikan modul yang telah dihapus!",
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonColor: '#F44336',
                                    cancelButtonColor: '#94a3b8',
                                    confirmButtonText: 'Ya, hapus!',
                                    cancelButtonText: 'Batal'
                                  });
                                  
                                  if (result.isConfirmed) {
                                    try {
                                      const res = await fetch(`/api/modul/${modul._id}`, { method: 'DELETE' });
                                      const data = await res.json();
                                      if (data.success) {
                                        setModuls(moduls.filter(m => m._id !== modul._id));
                                        Swal.fire({
                                          title: 'Terhapus!',
                                          text: 'Modul telah dihapus.',
                                          icon: 'success',
                                          timer: 1500,
                                          showConfirmButton: false
                                        });
                                      } else {
                                        Swal.fire('Gagal', data.error || 'Gagal menghapus modul', 'error');
                                      }
                                    } catch (err) {
                                      console.error(err);
                                      Swal.fire('Error', 'Terjadi kesalahan sistem', 'error');
                                    }
                                  }
                                }}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-sm transition-colors block" title="Hapus Modul">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'pengumuman' && (
              <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#2196F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                    Pengumuman Kelas
                  </h2>
                </div>
                
                <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-sm bg-slate-50">
                  <div className="w-16 h-16 bg-blue-100 text-[#2196F3] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Belum ada pengumuman</h3>
                  <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Sampaikan informasi penting ke seluruh siswa di kelas ini agar mereka tidak ketinggalan berita.</p>
                  <button className="px-5 py-2.5 bg-[#0D47A1] text-white rounded-sm text-sm font-medium hover:bg-[#0A367A] transition-colors inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Buat Pengumuman Baru
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Samping (Daftar Siswa) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#2196F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                Siswa ({classData.studentsCount})
              </h2>
              <button className="text-sm text-[#2196F3] hover:text-[#0D47A1] font-medium transition-colors">Lihat</button>
            </div>
            
            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="Cari siswa..." 
                value={searchSiswa}
                onChange={(e) => setSearchSiswa(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#2196F3] text-sm"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            
            <div className="max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {filteredStudents.length > 0 ? (
                <div className="border border-slate-200 rounded-sm overflow-hidden">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 text-xs text-slate-600 border-b border-slate-200">
                        <th className="px-3 py-2 font-semibold uppercase tracking-wider border-r border-slate-200">Siswa</th>
                        <th className="px-3 py-2 font-semibold uppercase tracking-wider">NIS</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {filteredStudents.map((siswa, idx) => (
                        <tr key={siswa._id || idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-b-0">
                          <td className="px-3 py-2 font-medium text-slate-700 flex items-center gap-2 border-r border-slate-200">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 uppercase">
                              {siswa.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                            </div>
                            <span className="truncate max-w-[120px]" title={siswa.name}>{siswa.name}</span>
                          </td>
                          <td className="px-3 py-2 text-slate-500 text-xs">{siswa.nisn_nip || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4 border border-slate-200 border-dashed rounded-sm">Tidak ada siswa ditemukan.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
