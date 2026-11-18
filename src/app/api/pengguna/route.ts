import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { Sekolah } from '@/models/Sekolah';
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

    if (payload.role !== 'admin' && payload.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filterSekolahId = searchParams.get('sekolah_id');

    const query: any = { role: { $in: ['guru', 'siswa'] } };
    if (filterSekolahId) {
      query.sekolah_id = filterSekolahId;
    } else if (payload.npsn) {
      query.sekolah_id = payload.id;
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();

    const Kelas = (await import('@/models/Kelas')).default;
    const kelasList = await Kelas.find({}).lean();
    const kelasMap = new Map();
    kelasList.forEach((k: any) => {
      kelasMap.set(k._id.toString(), k.nama_kelas);
    });

    const sekolahList = await Sekolah.find({}).lean();
    const sekolahMap = new Map();
    sekolahList.forEach((s: any) => {
      sekolahMap.set(s._id.toString(), s.nama_sekolah);
    });

    const formattedUsers = users.map((user: any) => {
      let namaKelas = user.kelas || '-';
      if (user.kelas && String(user.kelas).length === 24) {
        namaKelas = kelasMap.get(String(user.kelas)) || user.kelas;
      }

      const namaSekolah = user.sekolah_id
        ? sekolahMap.get(String(user.sekolah_id)) || '-'
        : '-';

      return {
        id: user._id.toString(),
        nisn_nip: user.nisn_nip || '-',
        nama: user.name,
        email: user.email || '-',
        role: user.role === 'guru' ? 'Guru' : user.role === 'siswa' ? 'Siswa' : 'Admin',
        kelas: namaKelas,
        sekolah: namaSekolah,
        sekolah_id: user.sekolah_id ? String(user.sekolah_id) : null,
        status: user.status || 'Active',
      };
    });

    return NextResponse.json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error('Failed to fetch pengguna:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}
