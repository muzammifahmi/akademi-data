import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Kelas from '@/models/Kelas';
import User from '@/models/User';
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

    if (payload.role !== 'admin' && payload.role !== 'superadmin' && payload.role !== 'guru') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const query: any = {};
    if (payload.role === 'admin') {
      query.sekolah_id = payload.id;
    } else if (payload.role === 'guru') {
      query.guru_pengampu = payload.id;
    }

    // Populate the guru_pengampu to get the teacher's name
    const kelasList = await Kelas.find(query).populate('guru_pengampu', 'name').sort({ createdAt: -1 }).lean();

    // Pastikan import model Modul terlebih dahulu. Karena kita sudah punya mongoose di context, kita bisa require jika perlu, tapi lebih baik import di atas.
    const Modul = (await import('@/models/Modul')).default;

    const formattedKelas = await Promise.all(kelasList.map(async (k: any) => {
      // Hitung jumlah modul yang sudah diterbitkan
      const modulAktif = await Modul.countDocuments({ kelas_id: k._id, status: 'Terbit' });

      return {
        id: k._id.toString(),
        nama: k.nama_kelas,
        kodeKelas: k.kode_kelas,
        guruPengampu: k.guru_pengampu ? k.guru_pengampu.name : '-',
        jumlahSiswa: k.jumlah_siswa,
        status: k.status,
        modulAktif: modulAktif // <- Menambahkan data modul
      };
    }));

    return NextResponse.json({ success: true, data: formattedKelas });
  } catch (error) {
    console.error("Failed to fetch kelas:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch kelas' }, { status: 500 });
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

    if (payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { nama_kelas, kode_kelas, guru_pengampu } = body;

    if (!nama_kelas || !kode_kelas || !guru_pengampu) {
      return NextResponse.json({ success: false, error: 'Harap lengkapi semua field wajib' }, { status: 400 });
    }

    // Check if code exists
    const existingCode = await Kelas.findOne({ kode_kelas });
    if (existingCode) {
      return NextResponse.json({ success: false, error: 'Kode kelas sudah digunakan, silakan ubah sedikit.' }, { status: 400 });
    }

    const newKelas = new Kelas({
      nama_kelas,
      kode_kelas,
      guru_pengampu,
      sekolah_id: payload.id
    });

    await newKelas.save();

    return NextResponse.json({ success: true, message: 'Kelas berhasil ditambahkan', data: newKelas });
  } catch (error) {
    console.error("Failed to add kelas:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
