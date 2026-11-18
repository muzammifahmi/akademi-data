import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Modul from '@/models/Modul';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== 'admin' && payload.role !== 'superadmin' && payload.role !== 'guru' && payload.role !== 'siswa') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const kelas_id = searchParams.get('kelas_id');

    if (!kelas_id) {
      if (payload.role === 'guru') {
        const Kelas = (await import('@/models/Kelas')).default;
        const guruKelas = await Kelas.find({ guru_pengampu: String(payload.id) } as any).select('_id nama_kelas kode_kelas').lean();
        const kelasIds = guruKelas.map((k: any) => k._id);
        const kelasMap = new Map(guruKelas.map((k: any) => [k._id.toString(), k]));
        const moduls = await Modul.find({ kelas_id: { $in: kelasIds } }).sort({ createdAt: -1 }).lean();
        const enriched = moduls.map((m: any) => {
          const kInfo: any = kelasMap.get(m.kelas_id?.toString()) || {};
          return {
            ...m,
            nama_kelas: kInfo.nama_kelas || '-',
            kode_kelas: kInfo.kode_kelas || '-',
          };
        });
        return NextResponse.json({ success: true, data: enriched, classes: guruKelas });
      }
      return NextResponse.json({ success: false, error: 'kelas_id required' }, { status: 400 });
    }

    const moduls = await Modul.find({ kelas_id }).sort({ createdAt: 1 }).lean();

    return NextResponse.json({ success: true, data: moduls });
  } catch (error) {
    console.error("Failed to fetch moduls:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch moduls' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== 'guru' && payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { judul, tujuan, kelas_id, babs, status } = body;

    if (!judul || !tujuan || !kelas_id) {
      return NextResponse.json({ success: false, error: 'Harap lengkapi field wajib (judul, tujuan, kelas_id)' }, { status: 400 });
    }

    const newModul = new Modul({
      judul,
      tujuan,
      kelas_id,
      babs: babs || [],
      status: status || 'Draft'
    });

    await newModul.save();

    return NextResponse.json({ success: true, message: 'Modul berhasil ditambahkan', data: newModul });
  } catch (error) {
    console.error("Failed to add modul:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
