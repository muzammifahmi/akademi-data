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
    const { kodeKelas } = body;

    if (!kodeKelas || !String(kodeKelas).trim()) {
      return NextResponse.json({ success: false, error: 'Kode kelas wajib diisi.' }, { status: 400 });
    }

    const normalizedCode = String(kodeKelas).trim().toUpperCase();

    // Cari kelas berdasarkan kode_kelas yang aktif
    const kelasDoc = await Kelas.findOne({ kode_kelas: normalizedCode, status: 'Aktif' });

    if (!kelasDoc) {
      return NextResponse.json(
        { success: false, error: 'Kode kelas tidak ditemukan atau kelas sudah tidak aktif.' },
        { status: 404 }
      );
    }

    // Update data user: hubungkan ke kelas dan sekolah dari kelas tersebut
    const updatedUser = await User.findByIdAndUpdate(
      payload.id,
      {
        kelas: kelasDoc._id.toString(),
        sekolah_id: kelasDoc.sekolah_id,
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'Gagal memperbarui data kelas siswa.' }, { status: 500 });
    }

    // Sinkronkan jumlah siswa di kelas tersebut
    const studentCount = await User.countDocuments({ role: 'siswa', kelas: kelasDoc._id.toString() });
    await Kelas.findByIdAndUpdate(kelasDoc._id, {
      $set: { jumlah_siswa: studentCount },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil bergabung ke kelas ${kelasDoc.nama_kelas}!`,
    });
  } catch (error) {
    console.error('Failed to join class:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
