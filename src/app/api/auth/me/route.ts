import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectMongo from '@/lib/mongoose';
import User from '@/models/User';
import { Sekolah } from '@/models/Sekolah';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    await connectMongo();

    let name = '';
    let subtitle = '';
    let nisn_nip = '';
    let kelas = '';
    let sekolah_id: string | null = null;

    if (payload.role === 'admin' && payload.npsn) {
      const sekolah = await Sekolah.findById(payload.id);
      if (sekolah) {
        name = sekolah.admin_nama;
        subtitle = `Admin Sekolah (${sekolah.nama_sekolah})`;
      }
    } else {
      const user = await User.findById(payload.id);
      if (user) {
        name = user.name;
        if (user.role === 'superadmin') subtitle = 'Super Admin Global';
        else if (user.role === 'guru') subtitle = 'Pengajar / Guru';
        else if (user.role === 'siswa') subtitle = 'Siswa Aktif';
        else if (user.role === 'admin') subtitle = 'Administrator';
        
        nisn_nip = user.nisn_nip || '';
        kelas = user.kelas || '';

        // Jika kelas adalah string ObjectId, coba ambil nama kelasnya
        if (kelas && kelas.length === 24) {
           try {
             const Kelas = (await import('@/models/Kelas')).default;
             const kelasDoc = await Kelas.findById(kelas);
             if (kelasDoc) {
               kelas = kelasDoc.nama_kelas;
             }
           } catch (err) {
             console.error("Gagal mengambil nama kelas", err);
           }
        }

        sekolah_id = user.sekolah_id ? user.sekolah_id.toString() : null;
      }
    }

    if (!name) {
      // User is not found in the database (deleted or invalid)
      const response = NextResponse.json({ error: 'User not found' }, { status: 401 });
      response.cookies.delete('auth_token');
      return response;
    }

    const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

    return NextResponse.json({
      name,
      email: payload.email,
      role: payload.role,
      initials,
      subtitle,
      nisn_nip,
      kelas,
      sekolah_id,
      npsn: payload.npsn || null
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to authenticate' }, { status: 401 });
  }
}
