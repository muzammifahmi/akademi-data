import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongoose';
import '@/models/Sekolah';
import User from '@/models/User';

export async function GET() {
  try {
    await connectMongo();

    // Migrasikan akun superadmin lama (jika ada) menjadi admin
    await User.updateMany({ role: 'superadmin' as any }, { $set: { role: 'admin' } });

    const existingAdmin = await User.findOne({ email: 'admin@akademidata.com' });
    if (existingAdmin) {
      return NextResponse.json({
        message: 'Akun Admin sudah tersedia di database.',
        credentials: { email: 'admin@akademidata.com', password: 'password123', role: 'admin' },
      });
    }

    const admin = await User.create({
      name: 'Administrator AkademiData',
      email: 'admin@akademidata.com',
      password: 'password123',
      role: 'admin',
      authProvider: 'local',
      status: 'Active',
    });

    return NextResponse.json({
      message: 'Akun Admin berhasil dibuat (Seed sukses).',
      credentials: { email: 'admin@akademidata.com', password: 'password123', role: 'admin' },
      user: admin,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Gagal melakukan seed database', details: error.message },
      { status: 500 }
    );
  }
}
