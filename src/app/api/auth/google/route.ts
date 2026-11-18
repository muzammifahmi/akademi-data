import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import connectMongo from '@/lib/mongoose';
import User from '@/models/User';
import { Sekolah } from '@/models/Sekolah';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let {
      action,
      email,
      name,
      googleId,
      avatar,
      credential,
      accessToken,
      role,
      token_sekolah,
    } = body;

    // 1. Cek jika ada cookie google_pending_profile hasil redirect OAuth resmi Google
    const cookieStore = await cookies();
    const pendingCookie = cookieStore.get('google_pending_profile')?.value;
    if (pendingCookie && !email && !accessToken && !credential) {
      try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(pendingCookie, secret);
        email = payload.email as string;
        name = name || (payload.name as string);
        googleId = payload.googleId as string;
        avatar = payload.avatar as string;
      } catch {
        // Cookie kadaluarsa atau tidak valid
      }
    }

    // 2. Jika menggunakan Google OAuth2 Access Token dari Google Identity Services (GSI)
    if (accessToken && !email) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!userInfoRes.ok) {
          return NextResponse.json(
            { error: 'Gagal memverifikasi token akun Google.' },
            { status: 400 }
          );
        }
        const profile = await userInfoRes.json();
        email = profile.email;
        name = profile.name || profile.email?.split('@')[0];
        googleId = profile.sub;
        avatar = profile.picture;
      } catch {
        return NextResponse.json(
          { error: 'Gagal menghubungi server Google OAuth.' },
          { status: 400 }
        );
      }
    }

    // 3. Jika menggunakan Google ID Token (JWT credential dari GSI)
    if (credential && !email) {
      try {
        const tokenInfoRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
        );
        if (tokenInfoRes.ok) {
          const decoded = await tokenInfoRes.json();
          email = decoded.email;
          name = decoded.name || decoded.email?.split('@')[0];
          googleId = decoded.sub;
          avatar = decoded.picture;
        }
      } catch {
        return NextResponse.json(
          { error: 'Token Google tidak valid.' },
          { status: 400 }
        );
      }
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Sesi Google tidak ditemukan. Silakan ulangi Masuk dengan Google.' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const defaultDisplayName = normalizedEmail
      .split('@')[0]
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    const displayName = String(name || defaultDisplayName).trim();

    await connectMongo();

    // 4. Verifikasi apakah email tersebut sudah tersimpan menjadi user di database
    const existingUser =
      (await User.findOne({ email: normalizedEmail })) ||
      (await User.findOne({ email: String(email).trim() }));

    if (existingUser) {
      if (existingUser.status === 'Suspended') {
        return NextResponse.json(
          { error: 'Akun Anda sedang dinonaktifkan sementara.' },
          { status: 403 }
        );
      }

      const effectiveRole =
        (existingUser.role as string) === 'superadmin' ? 'admin' : existingUser.role;

      if ((existingUser.role as string) === 'superadmin') {
        existingUser.role = 'admin';
      }
      if (googleId && !existingUser.googleId) {
        existingUser.googleId = googleId;
      }
      if (avatar && !existingUser.avatar) {
        existingUser.avatar = avatar;
      }
      await existingUser.save();

      const secret = new TextEncoder().encode(JWT_SECRET);
      const token = await new SignJWT({
        id: existingUser._id.toString(),
        email: existingUser.email,
        role: effectiveRole,
        sekolah_id: existingUser.sekolah_id
          ? existingUser.sekolah_id.toString()
          : undefined,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(secret);

      const response = NextResponse.json({
        success: true,
        isRegistered: true,
        isNewUser: false,
        message: `Selamat datang kembali, ${existingUser.name}!`,
        user: {
          id: existingUser._id.toString(),
          name: existingUser.name,
          email: existingUser.email,
          role: effectiveRole,
        },
      });

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });
      response.cookies.delete('google_pending_profile');

      return response;
    }

    // 5. Jika email BELUM tersimpan menjadi user & masih tahap pengecekan:
    if (action === 'check' || !role) {
      return NextResponse.json({
        success: true,
        isRegistered: false,
        requiresRoleSelection: true,
        email: normalizedEmail,
        name: displayName,
        googleId: googleId || '',
        avatar: avatar || '',
        message: 'Email belum terdaftar. Silakan pilih peran sebagai Siswa atau Guru.',
      });
    }

    // 6. Buat user baru sesuai Role yang dipilih (Siswa atau Guru)
    const targetRole = role === 'guru' ? 'guru' : 'siswa';
    let resolvedSekolahId: any = undefined;
    let namaSekolahTerdaftar = '';

    if (targetRole === 'guru') {
      const cleanedToken = String(token_sekolah || '').trim().toUpperCase();
      if (!cleanedToken) {
        return NextResponse.json(
          {
            error: 'Harap masukkan Token Sekolah yang diberikan oleh Admin untuk mendaftar sebagai Guru.',
            requiresToken: true,
          },
          { status: 400 }
        );
      }

      const sekolahDoc = await Sekolah.findOne({ token_sekolah: cleanedToken });
      if (!sekolahDoc) {
        return NextResponse.json(
          {
            error: 'Token Sekolah tidak valid atau tidak ditemukan. Pastikan kode token dari Admin sudah benar.',
          },
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
    }

    const newUser = await User.create({
      name: displayName,
      email: normalizedEmail,
      password: '',
      role: targetRole,
      authProvider: 'google',
      googleId: googleId || `google_${Date.now()}`,
      avatar: avatar || '',
      sekolah_id: resolvedSekolahId,
      status: 'Active',
    });

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
        isRegistered: true,
        isNewUser: true,
        message:
          targetRole === 'guru'
            ? `Akun Guru berhasil dibuat dan terhubung ke ${namaSekolahTerdaftar}!`
            : 'Akun Siswa berhasil dibuat! Mengarahkan langsung ke Portal Siswa...',
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
    response.cookies.delete('google_pending_profile');

    return response;
  } catch (error) {
    console.error('Google Auth Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat autentikasi Google.' },
      { status: 500 }
    );
  }
}
