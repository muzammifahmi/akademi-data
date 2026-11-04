import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Kelas from '@/models/Kelas';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

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

    if (payload.role !== 'siswa') {
      return NextResponse.json({ success: false, error: 'Hanya siswa yang dapat bergabung ke kelas.' }, { status: 403 });
    }

    const body = await req.json();
    const { kodeKelas, nisn, sekolah_id } = body;

    if (!kodeKelas || !nisn || !sekolah_id) {
      return NextResponse.json({ success: false, error: 'Kode kelas, NISN, dan Sekolah wajib diisi.' }, { status: 400 });
    }

    // Cari kelas berdasarkan kode_kelas dan pastikan dari sekolah yang dipilih
    const kelasDoc = await Kelas.findOne({ kode_kelas: kodeKelas, status: 'Aktif', sekolah_id: sekolah_id });

    if (!kelasDoc) {
      return NextResponse.json({ success: false, error: 'Kode kelas tidak valid, kelas tidak aktif, atau tidak berasal dari sekolah yang dipilih.' }, { status: 404 });
    }

    // Update data user
    const updatedUser = await User.findByIdAndUpdate(
      payload.id,
      {
        nisn_nip: nisn,
        kelas: kelasDoc._id,
        sekolah_id: kelasDoc.sekolah_id
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'Gagal memperbarui data profil siswa.' }, { status: 500 });
    }

    // Increment jumlah siswa di kelas tersebut
    await Kelas.findByIdAndUpdate(kelasDoc._id, {
      $inc: { jumlah_siswa: 1 }
    });

    return NextResponse.json({ success: true, message: 'Berhasil bergabung dengan kelas!' });
  } catch (error) {
    console.error("Failed to join class:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
