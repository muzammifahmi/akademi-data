import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;

  const clientId =
    process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  if (
    !clientId ||
    clientId === 'MASUKKAN_GOOGLE_CLIENT_ID_DISINI' ||
    clientId.includes('YOUR_GOOGLE_CLIENT_ID')
  ) {
    return NextResponse.redirect(
      new URL('/?google_error=missing_config', origin)
    );
  }

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  // prompt=select_account memastikan Google selalu menampilkan halaman "Pilih akun" dari akun yang tersimpan di Chrome
  googleAuthUrl.searchParams.set('prompt', 'select_account');
  googleAuthUrl.searchParams.set('access_type', 'online');

  return NextResponse.redirect(googleAuthUrl.toString());
}
