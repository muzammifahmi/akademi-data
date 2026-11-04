import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const path = request.nextUrl.pathname;

  // 1. Jika pengguna mencoba mengakses halaman login ('/')
  if (path === '/') {
    if (token) {
      try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        
        // Auto-redirect jika token valid
        if (payload.role === 'superadmin') return NextResponse.redirect(new URL('/superadmin/sekolah', request.url));
        if (payload.role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
        if (payload.role === 'guru') return NextResponse.redirect(new URL('/guru', request.url));
        if (payload.role === 'siswa') return NextResponse.redirect(new URL('/siswa', request.url));
      } catch (error) {
        // Token tidak valid/expired, hapus cookie dan biarkan akses halaman login
        const response = NextResponse.next();
        response.cookies.delete('auth_token');
        return response;
      }
    }
    return NextResponse.next(); // Biarkan masuk halaman login jika belum login
  }

  // 2. Proteksi Halaman Berdasarkan Peran (Role-Based Route Protection)
  
  // Fungsi utilitas untuk verifikasi peran
  const requireRole = async (requiredRole: string) => {
    if (!token) return NextResponse.redirect(new URL('/', request.url));
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      if (payload.role !== requiredRole) {
        // Jika rolenya berbeda dari yang diharuskan, tolak
        return NextResponse.redirect(new URL('/', request.url));
      }
      return null; // OK
    } catch (error) {
      // Token tidak valid
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  };

  if (path.startsWith('/superadmin')) {
    const errorResponse = await requireRole('superadmin');
    if (errorResponse) return errorResponse;
  }

  if (path.startsWith('/admin')) {
    const errorResponse = await requireRole('admin');
    if (errorResponse) return errorResponse;
  }

  if (path.startsWith('/guru')) {
    const errorResponse = await requireRole('guru');
    if (errorResponse) return errorResponse;
  }

  if (path.startsWith('/siswa')) {
    const errorResponse = await requireRole('siswa');
    if (errorResponse) return errorResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/', 
    '/superadmin/:path*', 
    '/admin/:path*', 
    '/guru/:path*', 
    '/siswa/:path*'
  ],
};
