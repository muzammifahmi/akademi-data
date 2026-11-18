import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Sekolah } from '@/models/Sekolah';
import User from '@/models/User';
import { generateUniqueSchoolToken } from '../route';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ npsn: string }> }
) {
  try {
    const { npsn } = await params;
    await connectToDatabase();
    const sekolah = await Sekolah.findOne({ npsn });

    if (!sekolah) {
      return NextResponse.json({ error: 'Data institusi tidak ditemukan' }, { status: 404 });
    }

    if (!sekolah.token_sekolah) {
      sekolah.token_sekolah = await generateUniqueSchoolToken(sekolah.npsn);
      await sekolah.save();
    }

    // Ambil analitik jumlah guru dan siswa di sekolah ini
    const [jumlahGuru, jumlahSiswa, daftarGuru, daftarSiswa] = await Promise.all([
      User.countDocuments({ role: 'guru', sekolah_id: sekolah._id }),
      User.countDocuments({ role: 'siswa', sekolah_id: sekolah._id }),
      User.find({ role: 'guru', sekolah_id: sekolah._id })
        .select('name email status createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      User.find({ role: 'siswa', sekolah_id: sekolah._id })
        .select('name email nisn_nip status createdAt')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...sekolah.toObject(),
          jumlah_guru: jumlahGuru,
          jumlah_siswa: jumlahSiswa,
          daftar_guru: daftarGuru,
          daftar_siswa: daftarSiswa,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ npsn: string }> }
) {
  try {
    const { npsn } = await params;
    const body = await request.json();
    await connectToDatabase();

    const sekolah = await Sekolah.findOne({ npsn });
    if (!sekolah) {
      return NextResponse.json({ error: 'Data institusi tidak ditemukan' }, { status: 404 });
    }

    if (!body.nama_sekolah || !body.email_sekolah || !body.alamat) {
      return NextResponse.json(
        { error: 'Nama Sekolah, Email Sekolah, dan Alamat Lengkap wajib diisi.' },
        { status: 400 }
      );
    }

    // Jika NPSN ikut diubah, pastikan NPSN baru belum dipakai sekolah lain
    if (body.npsn && body.npsn !== npsn) {
      const duplicate = await Sekolah.findOne({ npsn: body.npsn });
      if (duplicate) {
        return NextResponse.json(
          { error: 'NPSN baru tersebut sudah digunakan oleh sekolah lain.' },
          { status: 400 }
        );
      }
      sekolah.npsn = body.npsn;
    }

    sekolah.nama_sekolah = body.nama_sekolah;
    sekolah.email_sekolah = body.email_sekolah;
    sekolah.telepon = body.telepon || '';
    sekolah.alamat = body.alamat;
    if (body.status === 'Active' || body.status === 'Suspended') {
      sekolah.status = body.status;
    }

    await sekolah.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Data sekolah berhasil diperbarui.',
        data: sekolah,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: 'Gagal memperbarui data sekolah' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ npsn: string }> }
) {
  try {
    const { npsn } = await params;
    await connectToDatabase();
    const deleted = await Sekolah.findOneAndDelete({ npsn });

    if (!deleted) {
      return NextResponse.json({ error: 'Data institusi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: 'Institusi berhasil dihapus' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ npsn: string }> }
) {
  try {
    const { npsn } = await params;
    const body = await request.json().catch(() => ({}));
    await connectToDatabase();

    const sekolah = await Sekolah.findOne({ npsn });
    if (!sekolah) {
      return NextResponse.json({ error: 'Data institusi tidak ditemukan' }, { status: 404 });
    }

    if (body.action === 'regenerate_token') {
      sekolah.token_sekolah = await generateUniqueSchoolToken(sekolah.npsn);
      await sekolah.save();
      return NextResponse.json({
        success: true,
        message: 'Token sekolah baru berhasil di-generate!',
        data: sekolah,
      });
    }

    if (body.action === 'update') {
      if (body.nama_sekolah) sekolah.nama_sekolah = body.nama_sekolah;
      if (body.email_sekolah) sekolah.email_sekolah = body.email_sekolah;
      if (body.telepon !== undefined) sekolah.telepon = body.telepon;
      if (body.alamat) sekolah.alamat = body.alamat;
      if (body.status === 'Active' || body.status === 'Suspended') {
        sekolah.status = body.status;
      }
      await sekolah.save();
      return NextResponse.json({
        success: true,
        message: 'Data sekolah berhasil diperbarui!',
        data: sekolah,
      });
    }

    sekolah.status = sekolah.status === 'Suspended' ? 'Active' : 'Suspended';
    await sekolah.save();

    return NextResponse.json(
      {
        success: true,
        message: `Status institusi berhasil diubah menjadi ${sekolah.status}`,
        data: sekolah,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: 'Gagal memperbarui data sekolah' }, { status: 500 });
  }
}
