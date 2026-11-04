import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Progress from '@/models/Progress';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';

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
      return NextResponse.json({ success: false, error: 'Hanya siswa yang dapat menandai progres' }, { status: 403 });
    }

    const body = await req.json();
    const { modul_id, sub_bab_id, is_last } = body;

    const userId = payload.id as string;

    if (!modul_id || !mongoose.Types.ObjectId.isValid(modul_id)) {
      return NextResponse.json({ success: false, error: 'ID modul tidak valid' }, { status: 400 });
    }
    if (!sub_bab_id) {
      return NextResponse.json({ success: false, error: 'Sub Bab ID diperlukan' }, { status: 400 });
    }

    // Find existing progress or create new
    let progress: any = await Progress.findOne({ user_id: userId, modul_id });
    
    if (!progress) {
      progress = new Progress({
        user_id: userId,
        modul_id: modul_id,
        completed_subbabs: [],
        status: 'Sedang Dipelajari'
      });
    }

    // Add sub_bab_id to array if not already there
    if (!progress.completed_subbabs) {
      progress.completed_subbabs = [];
    }
    
    if (!progress.completed_subbabs.includes(sub_bab_id)) {
      progress.completed_subbabs.push(sub_bab_id);
    }

    if (is_last) {
      progress.status = 'Selesai';
      progress.completedAt = new Date();
    }

    await progress.save();

    return NextResponse.json({ success: true, message: 'Progres diperbarui' });
  } catch (error: any) {
    console.error("Gagal menyimpan progres:", error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
