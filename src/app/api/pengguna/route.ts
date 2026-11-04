import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
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

    if (payload.role !== 'admin' && payload.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // If admin, filter by their sekolah_id. If superadmin, they might see all or filter by query.
    // For this integration, let's just get the users for the admin's sekolah.
    const query: any = { role: { $in: ['guru', 'siswa'] } };
    
    // Admin HANYA bisa melihat guru dan siswa yang terdaftar di sekolahnya
    if (payload.role === 'admin') {
      query.sekolah_id = payload.id;
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();

    const Kelas = (await import('@/models/Kelas')).default;
    const kelasList = await Kelas.find({ sekolah_id: payload.id as string }).lean();
    const kelasMap = new Map();
    kelasList.forEach((k: any) => {
      kelasMap.set(k._id.toString(), k.nama_kelas);
    });

    // Format for the frontend
    const formattedUsers = users.map((user: any) => {
      let namaKelas = user.kelas || "-";
      if (user.kelas && user.kelas.length === 24) {
        namaKelas = kelasMap.get(user.kelas) || user.kelas;
      }

      return {
        id: user._id.toString(),
        nisn_nip: user.nisn_nip || "-",
        nama: user.name,
        email: user.email || "-",
        role: user.role === 'guru' ? 'Guru' : user.role === 'siswa' ? 'Siswa' : 'Admin',
        kelas: namaKelas,
        status: user.status || "Active",
      };
    });

    return NextResponse.json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error("Failed to fetch pengguna:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}
