import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const path = request.nextUrl.pathname;

  // Redirect legacy /superadmin routes ke /admin/sekolah
  if (path.startsWith('/superadmin')) {
    return NextResponse.redirect(new URL('/admin/sekolah', request.url));
  }

  // 1. Jika pengguna mencoba mengakses halaman login ('/')
  if (path === '/') {
    if (token) {
      try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        
        // Auto-redirect berdasarkan 3 role utama (admin, guru, siswa)
        if (payload.role === 'admin' || payload.role === 'superadmin') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
        if (payload.role === 'guru') {
          return NextResponse.redirect(new URL('/guru', request.url));
        }
        if (payload.role === 'siswa') {
          return NextResponse.redirect(new URL('/siswa', request.url));
        }
      } catch (error) {
        const response = NextResponse.next();
        response.cookies.delete('auth_token');
        return response;
      }
    }
    return NextResponse.next();
  }

  // 2. Proteksi Halaman Berdasarkan 3 Peran (Admin, Guru, Siswa)
  const requireRole = async (allowedRoles: string[]) => {
    if (!token) return NextResponse.redirect(new URL('/', request.url));
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      if (!allowedRoles.includes(String(payload.role))) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      return null;
    } catch (error) {
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  };

  if (path.startsWith('/admin')) {
    const errorResponse = await requireRole(['admin', 'superadmin']);
    if (errorResponse) return errorResponse;
  }

  if (path.startsWith('/guru')) {
    const errorResponse = await requireRole(['guru']);
    if (errorResponse) return errorResponse;
  }

  if (path.startsWith('/siswa')) {
    const errorResponse = await requireRole(['siswa']);
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
