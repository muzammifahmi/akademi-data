import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

function generateRandomPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== 'admin' && payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    await connectToDatabase();

    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar di sistem.' },
        { status: 400 }
      );
    }

    const generatedPassword = body.password || generateRandomPassword();
    const targetSekolahId = body.sekolah_id || (payload.npsn ? payload.id : undefined);

    const newUser = await User.create({
      name: body.nama,
      email: body.email,
      password: generatedPassword,
      role: body.role === 'siswa' ? 'siswa' : 'guru',
      sekolah_id: targetSekolahId,
      nisn_nip: body.nomorInduk || null,
      status: 'Active',
    });

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const nodemailer = require('nodemailer');
        const emailUser = process.env.EMAIL_USER.replace(/"/g, '');
        const emailPass = process.env.EMAIL_PASS.replace(/"/g, '');

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });

        await transporter.sendMail({
          from: `"AkademiData" <${emailUser}>`,
          to: body.email,
          subject: 'Kredensial Login Guru - AkademiData',
          html: `<p>Halo ${body.nama}, akun Anda telah terdaftar di AkademiData. Email: <b>${body.email}</b>, Password: <b>${generatedPassword}</b></p>`,
        });
      } catch (emailError) {
        console.error('Nodemailer Error:', emailError);
      }
    }

    return NextResponse.json(
      {
        message: 'Pengguna berhasil ditambahkan.',
        data: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Gagal menambah pengguna:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat menambah pengguna.' },
      { status: 500 }
    );
  }
}
