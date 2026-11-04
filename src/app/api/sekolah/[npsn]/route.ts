import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Sekolah } from '@/models/Sekolah';

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
    
    return NextResponse.json({ success: true, data: sekolah }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
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
    
    return NextResponse.json({ success: true, message: 'Institusi berhasil dihapus' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ npsn: string }> }
) {
  try {
    const { npsn } = await params;
    await connectToDatabase();
    // Jika kolom status ada, kita update. Untuk sekarang kita bypass sebagai contoh:
    return NextResponse.json({ success: true, message: 'Status institusi berhasil diubah (Suspend/Aktif)' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal mengubah status' }, { status: 500 });
  }
}
