import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongoose';
import User from '@/models/User';
import { Sekolah } from '@/models/Sekolah';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi' },
        { status: 400 }
      );
    }

    await connectMongo();

    // 1. Cek apakah yang login adalah Pengguna/Superadmin
    const user = await User.findOne({ email, password });
    if (user) {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const token = await new SignJWT({
        id: user._id.toString(),
        email: user.email,
        role: user.role
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(secret);

      const response = NextResponse.json(
        { 
          message: 'Login berhasil', 
          user: { name: user.name, email: user.email, role: user.role } 
        },
        { status: 200 }
      );
      
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 1 hari
      });
      
      return response;
    }

    // 2. Cek apakah yang login adalah Admin Sekolah (dari registrasi awal)
    const sekolah = await Sekolah.findOne({ admin_email: email, admin_password: password });
    if (sekolah) {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const token = await new SignJWT({
        id: sekolah._id.toString(),
        email: sekolah.admin_email,
        role: 'admin',
        npsn: sekolah.npsn
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(secret);

      const response = NextResponse.json(
        { 
          message: 'Login berhasil', 
          user: { name: sekolah.admin_nama, email: sekolah.admin_email, role: 'admin' } 
        },
        { status: 200 }
      );
      
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 1 hari
      });
      
      return response;
    }

    return NextResponse.json(
      { error: 'Email atau password salah' },
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
