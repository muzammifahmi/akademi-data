"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DaftarPengguna() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"Guru" | "Siswa">("Guru");
  const [filterKelas, setFilterKelas] = useState("all");

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/pengguna');
        const text = await response.text();
        if (!text) throw new Error(`Empty response from server (status: ${response.status})`);
        
        const result = JSON.parse(text);
        if (result.success) {
          setUsers(result.data);
        } else {
          console.error("Failed to fetch users:", result.error);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const uniqueKelasList = Array.from(new Set(users.filter(u => u.role === 'Siswa' && u.kelas && u.kelas !== '-').map(u => u.kelas)));

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.nisn_nip.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = user.role === activeTab;
    const matchesKelas = activeTab !== 'Siswa' || filterKelas === "all" || user.kelas === filterKelas;
    return matchesSearch && matchesRole && matchesKelas;
  });

  const totalPengguna = users.length;
  const totalGuru = users.filter(u => u.role === 'Guru').length;
  const totalSiswa = users.filter(u => u.role === 'Siswa').length;
  const totalSuspended = users.filter(u => u.status === 'Suspended').length;

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full bg-[#F8FAFC]">
      <div className="w-full flex flex-col gap-1">
      
      {/* Breadcrumb */}
      <div className="mb-4 text-sm font-medium text-slate-500 flex items-center gap-2">
        <Link href="/admin/dashboard" className="hover:text-[#2196F3] transition-colors">
          Utama
        </Link>
        <span>&gt;</span>
        <span className="text-slate-800">Daftar Pengguna</span>
      </div>
      
      {/* Header Section (Tema Guru) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Aksen Warna Kiri */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2196F3]"></div>
        
        <div>
          <h1 className="text-xl font-bold text-slate-800">Manajemen Pengguna</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Kelola data Guru dan Siswa, unggah massal (bulk), dan reset password.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-all flex items-center gap-2 text-sm group">
            <svg className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Unduh Template
          </button>
          <button className="px-4 py-2.5 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-all flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Upload Excel
          </button>
          <Link href="/admin/pengguna/tambah" className="px-4 py-2.5 bg-[#2196F3] text-white font-medium rounded-lg hover:bg-[#1976D2] transition-all flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Tambah User
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-sm border border-slate-200/60 relative overflow-hidden group">
          <div className="absolute -right-2 -top-2 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <div className="text-sm font-semibold text-slate-500 mb-1">Total Pengguna</div>
          <div className="text-3xl font-bold text-slate-800">{totalPengguna}</div>
        </div>
        <div className="bg-white p-5 rounded-sm border border-slate-200/60 relative overflow-hidden group">
          <div className="absolute -right-2 -top-2 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <div className="text-sm font-semibold text-slate-500 mb-1">Total Guru</div>
          <div className="text-3xl font-bold text-slate-800">{totalGuru}</div>
        </div>
        <div className="bg-white p-5 rounded-sm border border-slate-200/60 relative overflow-hidden group">
          <div className="absolute -right-2 -top-2 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
          </div>
          <div className="text-sm font-semibold text-slate-500 mb-1">Total Siswa</div>
          <div className="text-3xl font-bold text-slate-800">{totalSiswa}</div>
        </div>
        <div className="bg-white p-5 rounded-sm border border-slate-200/60 relative overflow-hidden group">
          <div className="absolute -right-2 -top-2 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <svg className="w-16 h-16 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
          </div>
          <div className="text-sm font-semibold text-slate-500 mb-1">Akun Suspended</div>
          <div className="text-3xl font-bold text-rose-600">{totalSuspended}</div>
        </div>
      </div>

      {/* Main Content / Table */}
      <div className="bg-white border border-slate-200/60 rounded-sm overflow-hidden">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'Guru'
                ? 'border-[#2196F3] text-[#2196F3] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
            onClick={() => setActiveTab('Guru')}
          >
            Data Guru
          </button>
          <button
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'Siswa'
                ? 'border-[#2196F3] text-[#2196F3] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
            onClick={() => setActiveTab('Siswa')}
          >
            Data Siswa
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
              type="text" 
              placeholder="Cari NIP/NISN atau Nama Lengkap..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#2196F3] text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            {activeTab === 'Siswa' && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Kelas:</span>
                <div className="relative">
                  <select 
                    className="appearance-none border border-slate-200 rounded-lg pl-3 pr-8 py-2 bg-white text-sm focus:outline-none focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] transition-all cursor-pointer text-slate-600"
                    value={filterKelas}
                    onChange={(e) => setFilterKelas(e.target.value)}
                  >
                    <option value="all">Semua</option>
                    {uniqueKelasList.map((kelas, idx) => (
                      <option key={idx} value={kelas as string}>{kelas as string}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wider">
                <th className="px-5 py-3.5 font-semibold whitespace-nowrap border-r border-slate-200 w-12 text-center">No</th>
                <th className="px-5 py-3.5 font-semibold whitespace-nowrap border-r border-slate-200">{activeTab === 'Guru' ? 'NIP' : 'NISN'}</th>
                <th className="px-5 py-3.5 font-semibold whitespace-nowrap border-r border-slate-200">Nama Lengkap</th>
                <th className="px-5 py-3.5 font-semibold whitespace-nowrap border-r border-slate-200">Email</th>
                {activeTab === 'Siswa' && (
                  <th className="px-5 py-3.5 font-semibold whitespace-nowrap border-r border-slate-200">Kelas</th>
                )}
                <th className="px-5 py-3.5 font-semibold whitespace-nowrap text-center border-r border-slate-200">Status</th>
                <th className="px-5 py-3.5 font-semibold whitespace-nowrap text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'Siswa' ? 7 : 6} className="px-6 py-8 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-[#2196F3] border-t-transparent rounded-full animate-spin"></div>
                      Memuat data pengguna...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'Siswa' ? 7 : 6} className="px-6 py-8 text-center text-slate-500 font-medium">
                    Tidak ada data pengguna ditemukan.
                  </td>
                </tr>
              ) : filteredUsers.map((user, index) => (
                <tr key={index} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="px-5 py-4 border-b border-r border-slate-200 text-center text-slate-500">
                    {index + 1}
                  </td>
                  <td className="px-5 py-4 border-b border-r border-slate-200 font-medium text-slate-700">
                    <span className="text-slate-600">{user.nisn_nip}</span>
                  </td>
                  <td className="px-5 py-4 border-b border-r border-slate-200">
                    <div className="font-medium text-slate-800">{user.nama}</div>
                  </td>
                  <td className="px-5 py-4 border-b border-r border-slate-200 text-slate-600">
                    {user.email}
                  </td>
                  {activeTab === 'Siswa' && (
                    <td className="px-5 py-4 border-b border-r border-slate-200">
                      <span className="font-medium text-slate-600">{user.kelas}</span>
                    </td>
                  )}
                  <td className="px-5 py-4 border-b border-r border-slate-200 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' : 'bg-rose-50 text-rose-600 border border-rose-200/50'}`}>
                      {user.status === 'Active' ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
                      )}
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 border-b border-slate-200 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 text-slate-500 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors tooltip-trigger" title="Reset Password">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                      </button>
                      <button className="p-2 text-slate-500 hover:text-[#2196F3] hover:bg-blue-50 rounded-lg transition-colors tooltip-trigger" title="Edit Profil">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors tooltip-trigger" title="Nonaktifkan (Suspend)">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50/30">
          <div>Menampilkan {filteredUsers.length > 0 ? 1 : 0} hingga {filteredUsers.length} dari {filteredUsers.length} pengguna</div>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-50" disabled>Sebelumnnya</button>
            <button className="px-3 py-1.5 bg-[#2196F3] text-white rounded-md font-medium shadow-sm">1</button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-100 font-medium text-slate-600">2</button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-100 font-medium text-slate-600">3</button>
            <span className="px-2 py-1.5 text-slate-400">...</span>
            <button className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-100 font-medium text-slate-600">91</button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-100 font-medium text-slate-600">Selanjutnya</button>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
