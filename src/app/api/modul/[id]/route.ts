import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Modul from '@/models/Modul';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Modul ID required' }, { status: 400 });
    }

    const modul = await Modul.findById(id).lean();
    
    if (!modul) {
      return NextResponse.json({ success: false, error: 'Modul not found' }, { status: 404 });
    }

    let completedSubBabs: string[] = [];
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (token) {
      try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        if (payload.role === 'siswa') {
          const Progress = (await import('@/models/Progress')).default;
          const progress = await Progress.findOne({ user_id: payload.id as string, modul_id: id }).lean();
          if (progress) {
             completedSubBabs = (progress as any).completed_subbabs || [];
          }
        }
      } catch (e) {
         // ignore
      }
    }

    return NextResponse.json({ success: true, data: { ...modul, completed_subbabs: completedSubBabs } });
  } catch (error) {
    console.error("Failed to fetch modul:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== 'admin' && payload.role !== 'guru') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Modul ID required' }, { status: 400 });
    }

    const deletedModul = await Modul.findByIdAndDelete(id);

    if (!deletedModul) {
      return NextResponse.json({ success: false, error: 'Modul not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Modul berhasil dihapus' });
  } catch (error) {
    console.error("Failed to delete modul:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== 'admin' && payload.role !== 'guru') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Modul ID required' }, { status: 400 });
    }

    const { judul, tujuan, babs, status } = body;
    
    const updatedModul = await Modul.findByIdAndUpdate(
      id,
      { judul, tujuan, babs, status },
      { new: true }
    );

    if (!updatedModul) {
      return NextResponse.json({ success: false, error: 'Modul not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedModul, message: 'Modul berhasil diperbarui' });
  } catch (error) {
    console.error("Failed to update modul:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
