"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function LoginPage() {
  // State Login Manual (Email & Kata Sandi)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);

  // State Register Manual (2 Pilihan Role: 'siswa' | 'guru')
  const [regRole, setRegRole] = useState<'siswa' | 'guru'>('siswa');
  const [regNama, setRegNama] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regTokenSekolah, setRegTokenSekolah] = useState('');

  // State Penyelesaian Pendaftaran Akun Baru Setelah Verifikasi Google OAuth Resmi
  // (Hanya muncul apabila email dari Google belum terdaftar menjadi user di database)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleId, setGoogleId] = useState('');
  const [googleAvatar, setGoogleAvatar] = useState('');
  const [googleRole, setGoogleRole] = useState<'siswa' | 'guru'>('siswa');
  const [googleTokenSekolah, setGoogleTokenSekolah] = useState('');
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const redirectByRole = (role: string) => {
    if (role === 'admin' || role === 'superadmin') {
      window.location.href = '/admin/dashboard';
    } else if (role === 'guru') {
      window.location.href = '/guru';
    } else if (role === 'siswa') {
      window.location.href = '/siswa';
    } else {
      window.location.href = '/';
    }
  };

  // Cek query params setelah kembali dari halaman Google OAuth2 resmi (accounts.google.com)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isGoogleNewUser = params.get('google_new_user');
    const googleError = params.get('google_error');

    if (isGoogleNewUser === '1') {
      // Ambil profil Google asli yang baru saja diverifikasi oleh /api/auth/google/callback
      fetch('/api/auth/google/pending')
        .then((res) => res.json())
        .then((data) => {
          if (data.pending && data.profile) {
            setGoogleEmail(data.profile.email || '');
            setGoogleName(data.profile.name || '');
            setGoogleId(data.profile.googleId || '');
            setGoogleAvatar(data.profile.avatar || '');
            setGoogleRole('siswa');
            setGoogleTokenSekolah('');
            setIsRoleModalOpen(true);
            window.history.replaceState({}, '', '/');
          }
        })
        .catch(() => {});
    } else if (googleError) {
      window.history.replaceState({}, '', '/');
      if (googleError === 'missing_config') {
        Swal.fire({
          icon: 'info',
          title: 'Konfigurasi Google OAuth 2.0 Diperlukan',
          html: `
            <div class="text-left text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>Agar tombol <b>Masuk dengan Google</b> membuka halaman resmi <code>accounts.google.com</code> (yang menampilkan akun Google yang tersimpan di Chrome), isi kredensial OAuth pada file <code>.env</code>:</p>
              <ol class="list-decimal pl-4 space-y-1">
                <li>Buka <a href="https://console.cloud.google.com/apis/credentials" target="_blank" class="text-[#2196F3] font-bold underline">Google Cloud Console &rarr; Credentials</a>.</li>
                <li>Buat <b>OAuth 2.0 Client ID</b> (tipe <i>Web application</i>).</li>
                <li>Tambahkan <b>Authorized redirect URI</b>:<br/><code class="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px] select-all">http://localhost:3000/api/auth/google/callback</code></li>
                <li>Salin <b>Client ID</b> dan <b>Client Secret</b> ke dalam file <code>.env</code> lalu restart server.</li>
              </ol>
            </div>
          `,
          confirmButtonColor: '#2196F3',
        });
      } else if (googleError === 'suspended') {
        Swal.fire({
          icon: 'error',
          title: 'Akun Dinonaktifkan',
          text: 'Akun Anda sedang dinonaktifkan sementara.',
          confirmButtonColor: '#2196F3',
        });
      } else if (googleError !== 'access_denied') {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Masuk dengan Google',
          text: `Terjadi kesalahan saat verifikasi OAuth Google (${googleError}).`,
          confirmButtonColor: '#2196F3',
        });
      }
    }
  }, []);

  // Arahkan langsung ke endpoint OAuth 2.0 resmi Google (accounts.google.com)
  const handleStartGoogleLogin = () => {
    window.location.href = '/api/auth/google/login';
  };

  // Simpan pilihan Role (Siswa / Guru) untuk email Google yang belum terdaftar di database
  const handleCompleteGoogleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) return;

    if (googleRole === 'guru' && !googleTokenSekolah.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Token Sekolah Diperlukan',
        text: 'Masukkan Token Sekolah dari Admin untuk mendaftar sebagai Guru.',
        confirmButtonColor: '#2196F3',
      });
      return;
    }

    setIsGoogleSubmitting(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: googleEmail.trim(),
          name: googleName.trim(),
          googleId,
          avatar: googleAvatar,
          role: googleRole,
          token_sekolah: googleRole === 'guru' ? googleTokenSekolah.trim().toUpperCase() : '',
        }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        setIsRoleModalOpen(false);
        await Swal.fire({
          icon: 'success',
          title: 'Pendaftaran Berhasil!',
          text: data.message,
          timer: 1300,
          showConfirmButton: false,
        });
        redirectByRole(data.user.role);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menyelesaikan Pendaftaran',
          text: data.error || 'Terjadi kesalahan saat menyimpan akun.',
          confirmButtonColor: '#2196F3',
        });
      }
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Kesalahan',
        text: 'Gagal menghubungi server autentikasi.',
        confirmButtonColor: '#2196F3',
      });
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Masuk',
          text: data.message,
          timer: 1200,
          showConfirmButton: false,
        }).then(() => {
          redirectByRole(data.user.role);
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Akses Ditolak',
          text: data.error,
          confirmButtonColor: '#2196F3',
        });
      }
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Kesalahan',
        text: 'Terjadi kesalahan jaringan.',
        confirmButtonColor: '#2196F3',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (regRole === 'guru' && !regTokenSekolah.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Token Sekolah Wajib Diisi',
        text: 'Silakan masukkan Token Sekolah yang diberikan oleh Admin.',
        confirmButtonColor: '#2196F3',
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        nama: regNama,
        email: regEmail,
        password: regPassword,
        role: regRole,
      };

      if (regRole === 'guru') {
        payload.token_sekolah = regTokenSekolah.trim().toUpperCase();
      }

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Pendaftaran Berhasil!',
          text:
            regRole === 'siswa'
              ? 'Akun Siswa berhasil dibuat. Anda akan langsung diarahkan ke Portal Siswa.'
              : data.message || 'Akun Guru berhasil dibuat dan terhubung dengan sekolah Anda.',
          timer: 1500,
          showConfirmButton: false,
        });

        if (data.user?.role) {
          redirectByRole(data.user.role);
        } else {
          redirectByRole(regRole);
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Mendaftar',
          text: data.error || 'Terjadi kesalahan saat pendaftaran.',
          confirmButtonColor: '#2196F3',
        });
      }
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Kesalahan',
        text: 'Terjadi kesalahan jaringan.',
        confirmButtonColor: '#2196F3',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans text-slate-800 bg-white">
      {/* Bagian Kiri: Informasi Sistem */}
      <div className="hidden lg:flex w-1/2 bg-[#0D47A1] flex-col justify-between p-16">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white flex items-center justify-center text-[#0D47A1] font-bold text-2xl rounded-sm">
            AD
          </div>
          <span className="font-bold text-2xl tracking-wide text-white">AkademiData</span>
        </div>

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

        <div className="text-[#90CAF9] text-sm">
          &copy; {new Date().getFullYear()} AkademiData. Hak Cipta Dilindungi.
        </div>
      </div>

      {/* Bagian Kanan: Formulir Login / Register */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16 bg-[#E3F2FD]">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 shadow-sm border border-[#90CAF9]/40 rounded-sm">
          {/* Logo khusus tampilan Mobile */}
          <div className="flex lg:hidden items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#0D47A1] flex items-center justify-center text-white font-bold text-xl rounded-sm">
              AD
            </div>
            <span className="font-bold text-2xl tracking-wide text-[#0D47A1]">AkademiData</span>
          </div>

          {isLoginView ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Masuk ke AkademiData</h2>
                <p className="text-slate-500 text-sm">
                  Masuk menggunakan email dan kata sandi Anda atau melalui akun Google.
                </p>
              </div>

              {/* Tombol Masuk dengan Google (Langsung ke OAuth Resmi Google accounts.google.com) */}
              <button
                type="button"
                onClick={handleStartGoogleLogin}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-sm transition-colors shadow-xs flex items-center justify-center gap-3 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 21.4 7.4 24 12 24z"
                  />
                </svg>
                Masuk dengan Google
              </button>

              <div className="relative my-5 flex items-center justify-center">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 shrink-0">
                  atau ketik email &amp; sandi
                </span>
                <div className="border-t border-slate-200 w-full"></div>
              </div>

              <form className="space-y-4" onSubmit={handleLogin}>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] text-slate-800 placeholder-slate-400 transition-colors"
                    placeholder="nama@email.com"
                    required
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Kata Sandi
                    </label>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] text-slate-800 placeholder-slate-400 transition-colors"
                    placeholder="••••••••"
                    required
                    suppressHydrationWarning
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 bg-[#2196F3] text-white text-sm font-semibold rounded-sm hover:bg-[#1976D2] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    suppressHydrationWarning
                  >
                    {isLoading ? 'Memproses...' : 'Masuk'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Daftar Akun Baru</h2>
                <p className="text-slate-500 text-sm">
                  Pilih peran Anda sebagai <strong>Siswa</strong> atau <strong>Guru</strong>.
                </p>
              </div>

              {/* Pilihan Role: Siswa atau Guru */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Daftar Sebagai <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegRole('siswa')}
                    className={`p-3 border rounded-sm text-left transition-all flex items-center gap-3 cursor-pointer ${
                      regRole === 'siswa'
                        ? 'border-[#2196F3] bg-blue-50/70 ring-1 ring-[#2196F3]'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-sm flex items-center justify-center shrink-0 ${
                        regRole === 'siswa'
                          ? 'bg-[#2196F3] text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">Siswa</div>
                      <div className="text-[11px] text-slate-500">Peserta Didik</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('guru')}
                    className={`p-3 border rounded-sm text-left transition-all flex items-center gap-3 cursor-pointer ${
                      regRole === 'guru'
                        ? 'border-[#2196F3] bg-blue-50/70 ring-1 ring-[#2196F3]'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-sm flex items-center justify-center shrink-0 ${
                        regRole === 'guru'
                          ? 'bg-[#0D47A1] text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">Guru</div>
                      <div className="text-[11px] text-slate-500">Pakai Token Sekolah</div>
                    </div>
                  </button>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleRegister}>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={regNama}
                    onChange={(e) => setRegNama(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] text-slate-800 placeholder-slate-400 transition-colors"
                    placeholder={regRole === 'guru' ? 'Nama lengkap beserta gelar' : 'Masukkan nama lengkap Anda'}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Alamat Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] text-slate-800 placeholder-slate-400 transition-colors"
                    placeholder="email@contoh.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Kata Sandi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] text-slate-800 placeholder-slate-400 transition-colors"
                    placeholder="Buat kata sandi baru"
                    required
                  />
                </div>

                {regRole === 'guru' && (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-sm space-y-1.5">
                    <label className="block text-xs font-bold text-amber-900">
                      Token Sekolah (Dari Admin) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={regTokenSekolah}
                      onChange={(e) => setRegTokenSekolah(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-sm font-mono font-bold tracking-wider uppercase border border-amber-300 bg-white rounded-sm focus:outline-none focus:ring-1 focus:ring-[#2196F3] focus:border-[#2196F3] text-slate-800 placeholder-slate-400"
                      placeholder="Contoh: SCH-2053-9K4X7M"
                      required
                    />
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Masukkan kode <strong>Token Sekolah</strong> unik yang digenerate oleh Admin saat mendaftarkan sekolah Anda.
                    </p>
                  </div>
                )}

                {regRole === 'siswa' && (
                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-sm text-xs text-slate-600">
                    Setelah mendaftar, Anda akan <strong>langsung masuk ke Portal Siswa</strong>.
                  </div>
                )}

                <div className="pt-1 space-y-2.5">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 bg-[#2196F3] text-white text-sm font-semibold rounded-sm hover:bg-[#1976D2] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading
                      ? 'Memproses...'
                      : regRole === 'guru'
                      ? 'Daftar sebagai Guru'
                      : 'Daftar & Masuk sebagai Siswa'}
                  </button>

                  <button
                    type="button"
                    onClick={handleStartGoogleLogin}
                    className="w-full px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 21.4 7.4 24 12 24z"
                      />
                    </svg>
                    Lanjutkan dengan Google
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Toggle Login / Register */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              {isLoginView ? 'Belum memiliki akun?' : 'Sudah memiliki akun?'}{' '}
              <button
                type="button"
                onClick={() => setIsLoginView(!isLoginView)}
                className="text-[#2196F3] font-bold hover:underline ml-1 cursor-pointer"
                suppressHydrationWarning
              >
                {isLoginView ? 'Daftar Sekarang' : 'Masuk di sini'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* MODAL PILIH PERAN (Hanya muncul setelah balik dari OAuth Resmi Google jika email belum tersimpan menjadi user) */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-sm shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 21.4 7.4 24 12 24z"
                  />
                </svg>
                <h3 className="font-bold text-slate-800 text-base">
                  Pilih Peran Akun Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCompleteGoogleRegistration} className="p-6 space-y-4">
              {/* Info Akun Google Terverifikasi */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-sm">
                {googleAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={googleAvatar}
                    alt={googleName}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#0D47A1] text-white font-bold text-sm flex items-center justify-center shrink-0 uppercase">
                    {googleEmail.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-800 truncate">{googleName}</div>
                  <div className="text-xs text-slate-500 truncate">{googleEmail}</div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Akun Google Anda belum terdaftar di AkademiData. Silakan pilih peran Anda sebagai <strong>Siswa</strong> atau <strong>Guru</strong> untuk melanjutkan.
              </p>

              {/* Pilihan Role: Siswa atau Guru */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Pilih Peran <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGoogleRole('siswa')}
                    className={`p-3 border rounded-sm text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      googleRole === 'siswa'
                        ? 'border-[#2196F3] bg-blue-50/80 ring-1 ring-[#2196F3]'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${
                        googleRole === 'siswa'
                          ? 'bg-[#2196F3] text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Siswa</div>
                      <div className="text-[10px] text-slate-500">Langsung Masuk</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGoogleRole('guru')}
                    className={`p-3 border rounded-sm text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      googleRole === 'guru'
                        ? 'border-[#2196F3] bg-blue-50/80 ring-1 ring-[#2196F3]'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${
                        googleRole === 'guru'
                          ? 'bg-[#0D47A1] text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Guru</div>
                      <div className="text-[10px] text-slate-500">Pakai Token Sekolah</div>
                    </div>
                  </button>
                </div>
              </div>

              {googleRole === 'guru' && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-sm space-y-1">
                  <label className="block text-xs font-bold text-amber-900">
                    Token Sekolah (Dari Admin) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={googleTokenSekolah}
                    onChange={(e) => setGoogleTokenSekolah(e.target.value.toUpperCase())}
                    placeholder="Contoh: SCH-2053-9K4X7M"
                    className="w-full px-3 py-2 text-sm font-mono font-bold tracking-wider uppercase border border-amber-300 bg-white rounded-sm focus:outline-none focus:border-[#2196F3]"
                    required
                  />
                  <p className="text-[11px] text-amber-800">
                    Masukkan Token Sekolah unik yang diberikan oleh Admin.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-sm transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isGoogleSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#2196F3] hover:bg-[#1976D2] rounded-sm transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {isGoogleSubmitting
                    ? 'Menyimpan...'
                    : googleRole === 'guru'
                    ? 'Daftar & Masuk sebagai Guru'
                    : 'Masuk sebagai Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
