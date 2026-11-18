import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Kelas from '@/models/Kelas';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID Kelas tidak ditemukan' }, { status: 400 });
    }

    const existing = await Kelas.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    if (payload.role === 'guru' && existing.guru_pengampu && existing.guru_pengampu.toString() !== payload.id) {
      return NextResponse.json({ success: false, error: 'Anda tidak memiliki akses menghapus kelas ini' }, { status: 403 });
    }

    await Kelas.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Kelas berhasil dihapus' });
  } catch (error) {
    console.error('Failed to delete kelas:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    await jwtVerify(token, secret);

    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID Kelas tidak ditemukan' }, { status: 400 });
    }

    const kelas = await Kelas.findById(id)
      .populate('guru_pengampu', 'name email')
      .populate('sekolah_id', 'nama_sekolah npsn');

    if (!kelas) {
      return NextResponse.json({ success: false, error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: kelas });
  } catch (error) {
    console.error('Failed to fetch kelas detail:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID Kelas tidak ditemukan' }, { status: 400 });
    }

    const existing = await Kelas.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    if (payload.role === 'guru' && existing.guru_pengampu && existing.guru_pengampu.toString() !== payload.id) {
      return NextResponse.json({ success: false, error: 'Anda tidak memiliki akses mengubah kelas ini' }, { status: 403 });
    }

    const body = await req.json();
    const { nama_kelas, kode_kelas, guru_pengampu, status } = body;

    if (kode_kelas) {
      const existingCode = await Kelas.findOne({ kode_kelas, _id: { $ne: id } });
      if (existingCode) {
        return NextResponse.json({ success: false, error: 'Kode kelas sudah digunakan oleh kelas lain.' }, { status: 400 });
      }
    }

    const updateFields: Record<string, any> = {};
    if (nama_kelas !== undefined) updateFields.nama_kelas = nama_kelas;
    if (kode_kelas !== undefined) updateFields.kode_kelas = kode_kelas;
    if (guru_pengampu !== undefined && payload.role !== 'guru') updateFields.guru_pengampu = guru_pengampu;
    if (status !== undefined) updateFields.status = status;

    const updatedKelas = await Kelas.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('guru_pengampu', 'name email');

    return NextResponse.json({ success: true, message: 'Kelas berhasil diperbarui', data: updatedKelas });
  } catch (error) {
    console.error('Failed to update kelas:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
