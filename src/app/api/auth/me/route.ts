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
    let nama_sekolah = '';
    let npsn_sekolah = (payload.npsn as string) || '';
    const effectiveRole = payload.role === 'superadmin' ? 'admin' : payload.role;

    if (effectiveRole === 'admin' && payload.npsn) {
      const sekolah = await Sekolah.findById(payload.id);
      if (sekolah) {
        name = sekolah.admin_nama || 'Administrator';
        subtitle = `Administrator (${sekolah.nama_sekolah})`;
        sekolah_id = sekolah._id.toString();
        nama_sekolah = sekolah.nama_sekolah;
        npsn_sekolah = sekolah.npsn;
      }
    } else {
      const user = await User.findById(payload.id);
      if (user) {
        name = user.name;
        nisn_nip = user.nisn_nip || '';
        kelas = user.kelas || '';
        sekolah_id = user.sekolah_id ? user.sekolah_id.toString() : null;

        if (sekolah_id) {
          try {
            const sekDoc = await Sekolah.findById(sekolah_id);
            if (sekDoc) {
              nama_sekolah = sekDoc.nama_sekolah;
              npsn_sekolah = sekDoc.npsn;
            }
          } catch (e) {
            // ignore
          }
        }

        if (effectiveRole === 'admin') {
          subtitle = 'Administrator Sistem';
        } else if (effectiveRole === 'guru') {
          subtitle = nama_sekolah ? `Guru (${nama_sekolah})` : 'Pengajar / Guru';
        } else if (effectiveRole === 'siswa') {
          subtitle = nama_sekolah ? `Siswa (${nama_sekolah})` : 'Siswa Aktif';
        }

        if (kelas && kelas.length === 24) {
          try {
            const Kelas = (await import('@/models/Kelas')).default;
            const kelasDoc = await Kelas.findById(kelas);
            if (kelasDoc) {
              kelas = kelasDoc.nama_kelas;
            }
          } catch (err) {
            console.error('Gagal mengambil nama kelas', err);
          }
        }
      }
    }

    if (!name) {
      const response = NextResponse.json({ error: 'User not found' }, { status: 401 });
      response.cookies.delete('auth_token');
      return response;
    }

    const initials = name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return NextResponse.json({
      id: payload.id,
      name,
      email: payload.email,
      role: effectiveRole,
      initials,
      subtitle,
      nisn_nip,
      kelas,
      sekolah_id,
      nama_sekolah,
      npsn: npsn_sekolah || null,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to authenticate' }, { status: 401 });
  }
}
