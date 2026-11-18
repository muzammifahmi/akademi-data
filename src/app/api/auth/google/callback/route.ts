import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import connectMongo from '@/lib/mongoose';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get('code');
  const oauthError = url.searchParams.get('error');

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/?google_error=${encodeURIComponent(oauthError)}`, origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?google_error=missing_code', origin));
  }

  const clientId =
    process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;

  if (!clientId || !clientSecret || clientSecret === 'MASUKKAN_GOOGLE_CLIENT_SECRET_DISINI') {
    return NextResponse.redirect(new URL('/?google_error=missing_config', origin));
  }

  try {
    // 1. Tukarkan authorization code dengan access_token & id_token ke API resmi Google
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google Token Exchange Error:', tokenData);
      return NextResponse.redirect(new URL('/?google_error=token_exchange_failed', origin));
    }

    // 2. Ambil profil akun Google asli dari Google UserInfo API
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(new URL('/?google_error=userinfo_failed', origin));
    }

    const profile = await userInfoRes.json();
    const normalizedEmail = String(profile.email || '').trim().toLowerCase();
    const displayName = String(profile.name || normalizedEmail.split('@')[0]).trim();
    const googleId = String(profile.sub || '');
    const avatar = String(profile.picture || '');

    if (!normalizedEmail) {
      return NextResponse.redirect(new URL('/?google_error=no_email', origin));
    }

    await connectMongo();

    // 3. Verifikasi apakah email dari akun Google tersebut sudah tersimpan menjadi user di database
    const existingUser =
      (await User.findOne({ email: normalizedEmail })) ||
      (await User.findOne({ email: String(profile.email).trim() }));

    const secret = new TextEncoder().encode(JWT_SECRET);

    if (existingUser) {
      if (existingUser.status === 'Suspended') {
        return NextResponse.redirect(new URL('/?google_error=suspended', origin));
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

      // Buat JWT auth_token dan langsung arahkan ke dashboard sesuai role
      const authToken = await new SignJWT({
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

      const targetPath =
        effectiveRole === 'admin'
          ? '/admin/dashboard'
          : effectiveRole === 'guru'
          ? '/guru'
          : '/siswa';

      const response = NextResponse.redirect(new URL(targetPath, origin));
      response.cookies.set('auth_token', authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });

      return response;
    }

    // 4. Jika email BELUM tersimpan menjadi user di database:
    // Simpan profil Google yang sudah terverifikasi ke dalam cookie sementara (15 menit),
    // lalu arahkan kembali ke halaman login dengan ?google_new_user=1 untuk memilih role (Siswa / Guru).
    const pendingToken = await new SignJWT({
      email: normalizedEmail,
      name: displayName,
      googleId,
      avatar,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('15m')
      .sign(secret);

    const response = NextResponse.redirect(new URL('/?google_new_user=1', origin));
    response.cookies.set('google_pending_profile', pendingToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15,
    });

    return response;
  } catch (err) {
    console.error('Google OAuth Callback Error:', err);
    return NextResponse.redirect(new URL('/?google_error=server_error', origin));
  }
}
