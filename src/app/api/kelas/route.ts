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
    if (payload.role === 'guru') {
      query.guru_pengampu = payload.id;
    } else if (payload.role === 'admin' && payload.npsn) {
      query.sekolah_id = payload.id;
    }

    const kelasList = await Kelas.find(query)
      .populate('guru_pengampu', 'name')
      .populate('sekolah_id', 'nama_sekolah')
      .sort({ createdAt: -1 })
      .lean();

    const Modul = (await import('@/models/Modul')).default;

    const formattedKelas = await Promise.all(
      kelasList.map(async (k: any) => {
        const [modulAktif, realSiswaCount] = await Promise.all([
          Modul.countDocuments({ kelas_id: k._id, status: 'Terbit' }),
          User.countDocuments({ role: 'siswa', kelas: k._id.toString() }),
        ]);

        return {
          id: k._id.toString(),
          nama: k.nama_kelas,
          kodeKelas: k.kode_kelas,
          guruPengampu: k.guru_pengampu ? k.guru_pengampu.name : '-',
          namaSekolah: k.sekolah_id?.nama_sekolah || '-',
          jumlahSiswa: realSiswaCount || k.jumlah_siswa || 0,
          status: k.status,
          modulAktif,
        };
      })
    );

    return NextResponse.json({ success: true, data: formattedKelas });
  } catch (error) {
    console.error('Failed to fetch kelas:', error);
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

    if (payload.role !== 'admin' && payload.role !== 'superadmin' && payload.role !== 'guru') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    let { nama_kelas, kode_kelas, guru_pengampu, sekolah_id } = body;

    if (payload.role === 'guru') {
      guru_pengampu = payload.id as string;
      const guruUser = await User.findById(payload.id);
      if (guruUser?.sekolah_id) {
        sekolah_id = guruUser.sekolah_id.toString();
      }
    } else if (!sekolah_id && guru_pengampu) {
      const guruUser = await User.findById(guru_pengampu);
      if (guruUser?.sekolah_id) {
        sekolah_id = guruUser.sekolah_id.toString();
      } else if (payload.npsn) {
        sekolah_id = payload.id as string;
      }
    }

    if (!nama_kelas || !kode_kelas || !guru_pengampu) {
      return NextResponse.json({ success: false, error: 'Harap lengkapi semua field wajib' }, { status: 400 });
    }

    // Jika sekolah_id masih kosong, ambil sekolah pertama yang ada
    if (!sekolah_id) {
      const { Sekolah } = await import('@/models/Sekolah');
      const firstSekolah = await Sekolah.findOne({});
      if (firstSekolah) {
        sekolah_id = firstSekolah._id.toString();
      }
    }

    const existingCode = await Kelas.findOne({ kode_kelas });
    if (existingCode) {
      return NextResponse.json({ success: false, error: 'Kode kelas sudah digunakan, silakan ubah sedikit.' }, { status: 400 });
    }

    const newKelas = new Kelas({
      nama_kelas,
      kode_kelas,
      guru_pengampu,
      sekolah_id,
    });

    await newKelas.save();

    return NextResponse.json({ success: true, message: 'Kelas berhasil ditambahkan', data: newKelas });
  } catch (error) {
    console.error('Failed to add kelas:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
