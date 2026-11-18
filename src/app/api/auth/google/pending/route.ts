import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const pendingCookie = cookieStore.get('google_pending_profile')?.value;

    if (!pendingCookie) {
      return NextResponse.json({ pending: false }, { status: 404 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(pendingCookie, secret);

    return NextResponse.json({
      pending: true,
      profile: {
        email: payload.email as string,
        name: payload.name as string,
        googleId: payload.googleId as string,
        avatar: payload.avatar as string,
      },
    });
  } catch {
    return NextResponse.json({ pending: false }, { status: 401 });
  }
}
