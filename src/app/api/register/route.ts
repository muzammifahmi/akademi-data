import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';
import { Sekolah } from '@/models/Sekolah';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, email, password, role, token_sekolah, sekolah_id } = body;

    if (!nama || !email || !password) {
      return NextResponse.json(
        { error: 'Nama lengkap, email, dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const targetRole = role === 'guru' ? 'guru' : 'siswa';

    await connectToDatabase();

    // Pastikan Email belum terdaftar
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() }) || await User.findOne({ email: email.trim() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Alamat email tersebut sudah terdaftar. Silakan langsung masuk (Login).' },
        { status: 400 }
      );
    }

    let resolvedSekolahId: any = undefined;
    let namaSekolahTerdaftar = '';

    // Jika mendaftar sebagai Guru, wajib memvalidasi Token Sekolah
    if (targetRole === 'guru') {
      const cleanedToken = String(token_sekolah || '').trim().toUpperCase();
      if (!cleanedToken) {
        return NextResponse.json(
          { error: 'Token Sekolah wajib diisi untuk pendaftaran akun Guru.' },
          { status: 400 }
        );
      }

      const sekolahDoc = await Sekolah.findOne({ token_sekolah: cleanedToken });
      if (!sekolahDoc) {
        return NextResponse.json(
          { error: 'Token Sekolah tidak valid atau tidak ditemukan. Hubungi Admin untuk mendapatkan Token Sekolah yang benar.' },
          { status: 400 }
        );
      }

      if (sekolahDoc.status === 'Suspended') {
        return NextResponse.json(
          { error: 'Sekolah pemilik token ini sedang dinonaktifkan sementara.' },
          { status: 403 }
        );
      }

      resolvedSekolahId = sekolahDoc._id;
      namaSekolahTerdaftar = sekolahDoc.nama_sekolah;
    } else if (sekolah_id) {
      resolvedSekolahId = sekolah_id;
    }

    // Buat User baru (Guru atau Siswa)
    const newUser = await User.create({
      name: nama.trim(),
      email: email.trim(),
      password,
      role: targetRole,
      authProvider: 'local',
      sekolah_id: resolvedSekolahId,
      status: 'Active',
    });

    // Buat JWT Session agar pengguna (khususnya Siswa & Guru) langsung masuk ke dashboard masing-masing
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({
      id: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      sekolah_id: resolvedSekolahId ? resolvedSekolahId.toString() : undefined,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);

    const response = NextResponse.json(
      {
        success: true,
        message:
          targetRole === 'guru'
            ? `Pendaftaran Guru berhasil dan terhubung ke ${namaSekolahTerdaftar}!`
            : 'Pendaftaran Siswa berhasil! Mengarahkan ke Portal Siswa...',
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error('Gagal mendaftar:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat pendaftaran.' },
      { status: 500 }
    );
  }
}
