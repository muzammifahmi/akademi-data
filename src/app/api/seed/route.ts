import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongoose';
import '@/models/Sekolah'; // Import agar diregistrasikan sebelum User
import User from '@/models/User';

export async function GET() {
  try {
    await connectMongo();
    
    const existing = await User.findOne({ email: 'superadmin@akademidata.com' });
    if (existing) {
      return NextResponse.json({ message: 'Superadmin sudah ada di database.' });
    }

    const superadmin = await User.create({
      name: 'Super Administrator',
      email: 'superadmin@akademidata.com',
      password: 'password123', // Hanya untuk demo (seharusnya di-hash di production)
      role: 'superadmin'
    });

    return NextResponse.json({ message: 'Akun Superadmin berhasil dibuat (Seed sukses).', user: superadmin });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal melakukan seed database', details: error.message }, { status: 500 });
  }
}
