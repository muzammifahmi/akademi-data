import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongoose';
import User from '@/models/User';
import { Sekolah } from '@/models/Sekolah';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email harus diisi' },
        { status: 400 }
      );
    }

    await connectMongo();

    // 1. Cek pengguna di koleksi User (admin, guru, siswa)
    // Mendukung login langsung menggunakan email (passwordless / Google OAuth di mana password tidak tersimpan)
    let user;
    if (password) {
      user = await User.findOne({ email: email.trim(), password });
      if (!user) {
        // Fallback untuk akun tanpa password (misal akun Google/OAuth/langsung email)
        user = await User.findOne({
          email: email.trim(),
          $or: [{ password: '' }, { password: { $exists: false } }, { authProvider: 'google' }],
        });
      }
    } else {
      // Login langsung menggunakan email tanpa password
      user = await User.findOne({ email: email.trim() });
    }
    if (user) {
      if (user.status === 'Suspended') {
        return NextResponse.json(
          { error: 'Akun Anda sedang dinonaktifkan sementara. Hubungi Administrator.' },
          { status: 403 }
        );
      }

      // Normalisasi 4 role lama ke 3 role baru (superadmin -> admin)
      const effectiveRole = (user.role as string) === 'superadmin' ? 'admin' : user.role;
      if ((user.role as string) === 'superadmin') {
        user.role = 'admin';
        await user.save();
      }

      const secret = new TextEncoder().encode(JWT_SECRET);
      const token = await new SignJWT({
        id: user._id.toString(),
        email: user.email,
        role: effectiveRole,
        sekolah_id: user.sekolah_id ? user.sekolah_id.toString() : undefined,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(secret);

      const response = NextResponse.json(
        {
          message: 'Login berhasil',
          user: { name: user.name, email: user.email, role: effectiveRole },
        },
        { status: 200 }
      );

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });

      return response;
    }

    // 2. Fallback kompatibilitas akun admin sekolah lama
    const sekolah = await Sekolah.findOne({ admin_email: email.trim(), admin_password: password });
    if (sekolah) {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const token = await new SignJWT({
        id: sekolah._id.toString(),
        email: sekolah.admin_email,
        role: 'admin',
        npsn: sekolah.npsn,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(secret);

      const response = NextResponse.json(
        {
          message: 'Login berhasil',
          user: { name: sekolah.admin_nama || 'Administrator', email: sekolah.admin_email, role: 'admin' },
        },
        { status: 200 }
      );

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Email atau kata sandi salah' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
