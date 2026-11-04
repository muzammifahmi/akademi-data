import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const npsn = searchParams.get('npsn');

  if (!npsn) {
    return NextResponse.json(
      { error: 'NPSN harus diisi' },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`https://sekolah.devapi.id/sekolah?npsn=${npsn}`, {
      // Menambahkan header standar atau API key jika dibutuhkan di masa depan
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal mengambil data dari server Dapodik' },
      { status: 500 }
    );
  }
}
