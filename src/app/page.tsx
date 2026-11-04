"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const [regNama, setRegNama] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSekolah, setRegSekolah] = useState('');
  const [sekolahOptions, setSekolahOptions] = useState<any[]>([]);
  const [searchSekolah, setSearchSekolah] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredSekolah = sekolahOptions.filter(s => 
    s.nama_sekolah?.toLowerCase().includes(searchSekolah.toLowerCase())
  );

  useEffect(() => {
    const fetchSekolah = async () => {
      try {
        const res = await fetch('/api/sekolah');
        const json = await res.json();
        if (json.success && json.data) {
          setSekolahOptions(json.data);
        }
      } catch (err) {
        console.error("Gagal memuat data sekolah", err);
      }
    };
    fetchSekolah();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        Swal.fire({ 
          icon: 'success', 
          title: 'Berhasil Masuk', 
          text: data.message, 
          timer: 1500, 
          showConfirmButton: false 
        }).then(() => {
          if (data.user.role === 'superadmin') {
            window.location.href = '/superadmin/sekolah';
          } else if (data.user.role === 'admin') {
            window.location.href = '/admin';
          } else if (data.user.role === 'guru') {
            window.location.href = '/guru';
          } else if (data.user.role === 'siswa') {
            window.location.href = '/siswa';
          } else {
            window.location.href = '/';
          }
        });
      } else {
        Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: data.error, confirmButtonColor: '#2196F3' });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Kesalahan', text: 'Terjadi kesalahan jaringan.', confirmButtonColor: '#2196F3' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const payload: any = {
        nama: regNama,
        email: regEmail,
        password: regPassword,
      };
      
      // Jika sekolah dipilih
      if (regSekolah) {
        payload.sekolah_id = regSekolah;
      }
      
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Pendaftaran Berhasil!',
          text: data.message || 'Email verifikasi telah dikirimkan ke alamat email Anda.',
          confirmButtonColor: '#2196F3'
        }).then(() => {
          setIsLoginView(true);
          setRegNama('');
          setRegEmail('');
          setRegPassword('');
          setRegSekolah('');
          setSearchSekolah('');
        });
      } else {
        Swal.fire({ 
          icon: 'error', 
          title: 'Gagal Mendaftar', 
          text: data.error || 'Terjadi kesalahan.', 
          confirmButtonColor: '#2196F3' 
        });
      }
    } catch (err) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Kesalahan', 
        text: 'Terjadi kesalahan jaringan.', 
        confirmButtonColor: '#2196F3' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans text-slate-800 bg-white">
      
      {/* Bagian Kiri: Informasi Sistem (Hanya tampil di Desktop, lebar 50%) */}
      <div className="hidden lg:flex w-1/2 bg-[#0D47A1] flex-col justify-between p-16">
        
        {/* Logo Institusi */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white flex items-center justify-center text-[#0D47A1] font-bold text-2xl rounded-sm">
            AD
          </div>
          <span className="font-bold text-2xl tracking-wide text-white">AkademiData</span>
        </div>

        {/* Gambar Utama (Ilustrasi Cloud) */}
        <div className="flex-1 flex flex-col justify-center items-center w-full max-w-full mx-auto px-4">
          <div className="relative w-full max-w-2xl aspect-square">
            <Image 
              src="/Cloud.svg" 
              alt="Ilustrasi AkademiData Cloud" 
              fill
              className="object-contain scale-125 sm:scale-150 drop-shadow-2xl"
              priority
            />
          </div>
        </div>

        {/* Footer Kiri */}
        <div className="text-[#90CAF9] text-sm">
          &copy; {new Date().getFullYear()} AkademiData. Hak Cipta Dilindungi.
        </div>
      </div>

      {/* Bagian Kanan: Formulir Login */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 bg-[#E3F2FD]">
        
        {/* Kotak Formulir */}
        <div className="w-full max-w-md bg-white p-10 shadow-sm border border-[#90CAF9]/40 rounded-sm">
          
          {/* Logo khusus tampilan Mobile */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#0D47A1] flex items-center justify-center text-white font-bold text-xl rounded-sm">
              AD
            </div>
            <span className="font-bold text-2xl tracking-wide text-[#0D47A1]">AkademiData</span>
          </div>

          {isLoginView ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-1.5">Masuk</h2>
                <p className="text-slate-500 text-sm">
                  Gunakan kredensial institusi Anda untuk mengakses sistem.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleLogin}>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Alamat Email
                  </label>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] text-slate-800 placeholder-slate-400 transition-colors"
                    placeholder="email@institusi.sch.id"
                    required
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Password</label>
                  </div>
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] text-slate-800 placeholder-slate-400 transition-colors"
                    placeholder="••••••••"
                    required
                    suppressHydrationWarning
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 bg-[#2196F3] text-white text-sm font-medium rounded-lg hover:bg-[#1976D2] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    suppressHydrationWarning
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Memproses...
                      </>
                    ) : (
                      "Masuk"
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-1.5">Daftar Akun Baru</h2>
                <p className="text-slate-500 text-sm">
                  Lengkapi data berikut untuk membuat akun siswa Anda.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleRegister}>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Lengkap <span className="text-rose-500">*</span></label>
                  <input 
                    type="text"
                    value={regNama}
                    onChange={(e) => setRegNama(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] text-slate-800 placeholder-slate-400 transition-colors"
                    placeholder="Masukkan nama"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Alamat Email <span className="text-rose-500">*</span></label>
                  <input 
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] text-slate-800 placeholder-slate-400 transition-colors"
                    placeholder="email@contoh.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password <span className="text-rose-500">*</span></label>
                  <input 
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] text-slate-800 placeholder-slate-400 transition-colors"
                    placeholder="Buat password baru"
                    required
                  />
                </div>
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Asal Sekolah <span className="text-slate-400 font-normal">(Opsional)</span></label>
                  <input 
                    type="text"
                    value={searchSekolah}
                    onChange={(e) => {
                      setSearchSekolah(e.target.value);
                      setIsDropdownOpen(true);
                      if (e.target.value === '') setRegSekolah('');
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onBlur={() => {
                      // Memberi jeda agar event onClick pada opsi sempat dieksekusi
                      setTimeout(() => setIsDropdownOpen(false), 200);
                    }}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] text-slate-800 placeholder-slate-400 transition-colors bg-white"
                    placeholder="Ketik untuk mencari sekolah..."
                    autoComplete="off"
                  />
                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredSekolah.length > 0 ? (
                        filteredSekolah.map((sekolah) => (
                          <div 
                            key={sekolah._id}
                            className="px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-[#2196F3] cursor-pointer transition-colors"
                            onMouseDown={(e) => e.preventDefault()} // Mencegah onBlur pada input terpicu sebelum diklik
                            onClick={() => {
                              setRegSekolah(sekolah._id);
                              setSearchSekolah(sekolah.nama_sekolah);
                              setIsDropdownOpen(false);
                            }}
                          >
                            {sekolah.nama_sekolah}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-sm text-slate-500 text-center italic">
                          Sekolah tidak ditemukan.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Foto Profil <span className="text-slate-400 font-normal">(Opsional)</span></label>
                  <input 
                    type="file"
                    accept="image/*"
                    className="w-full text-sm text-slate-700 file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#2196F3] hover:file:bg-blue-100 transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 bg-[#2196F3] text-white text-sm font-medium rounded-lg hover:bg-[#1976D2] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Mendaftar...
                      </>
                    ) : (
                      "Daftar Sekarang"
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
        
        {/* Teks Bantuan */}
        <div className="mt-8 text-center text-sm text-slate-500">
          {isLoginView ? (
            <>
              Belum punya akun Siswa? <button type="button" onClick={() => setIsLoginView(false)} className="text-[#2196F3] font-medium hover:underline">Daftar sekarang</button>
            </>
          ) : (
            <>
              Sudah memiliki akun? <button type="button" onClick={() => setIsLoginView(true)} className="text-[#2196F3] font-medium hover:underline">Masuk di sini</button>
            </>
          )}
        </div>
        
      </div>
      
    </div>
  );
}
