import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongoose';
import { Sekolah } from '@/models/Sekolah';
import User from '@/models/User';

// Menghasilkan Token Sekolah unik berbasis NPSN + CSPRNG (crypto.randomBytes) + verifikasi database
export async function generateUniqueSchoolToken(npsn: string): Promise<string> {
  const cleanNpsn = String(npsn || '')
    .replace(/[^A-Z0-9]/gi, '')
    .slice(-4)
    .toUpperCase()
    .padStart(4, '0');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  for (let attempt = 0; attempt < 25; attempt++) {
    const bytes = crypto.randomBytes(6);
    let randPart = '';
    for (let i = 0; i < 6; i++) {
      randPart += alphabet[bytes[i] % alphabet.length];
    }
    const candidate = `SCH-${cleanNpsn}-${randPart}`;
    const exists = await Sekolah.exists({ token_sekolah: candidate });
    if (!exists) {
      return candidate;
    }
  }

  return `SCH-${cleanNpsn}-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectToDatabase();

    if (!body.npsn || !body.nama_sekolah || !body.email_sekolah || !body.alamat) {
      return NextResponse.json(
        { error: 'NPSN, Nama Sekolah, Email Sekolah, dan Alamat wajib diisi.' },
        { status: 400 }
      );
    }

    // Pastikan NPSN belum terdaftar
    const existingSekolah = await Sekolah.findOne({ npsn: body.npsn });
    if (existingSekolah) {
      return NextResponse.json(
        { error: 'NPSN sekolah tersebut sudah terdaftar di sistem.' },
        { status: 400 }
      );
    }

    // Generate Token Sekolah yang dijamin unik
    const tokenSekolah = await generateUniqueSchoolToken(body.npsn);

    const newSekolah = await Sekolah.create({
      npsn: body.npsn,
      nama_sekolah: body.nama_sekolah,
      email_sekolah: body.email_sekolah,
      telepon: body.telepon || '',
      alamat: body.alamat,
      token_sekolah: tokenSekolah,
      status: 'Active',
    });

    // Kirim email notifikasi Token Sekolah ke email sekolah jika konfigurasi SMTP tersedia
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && body.email_sekolah) {
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
          to: body.email_sekolah,
          subject: 'Token Registrasi Guru Sekolah - AkademiData',
          html: `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
  <div style="background-color: #0D47A1; padding: 28px 20px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">AkademiData</h1>
  </div>
  <div style="padding: 32px; color: #334155; line-height: 1.6;">
    <h2 style="color: #0D47A1; font-size: 20px; margin-top: 0;">Sekolah Berhasil Terdaftar</h2>
    <p>Institusi <strong>${body.nama_sekolah}</strong> (NPSN: ${body.npsn}) telah terdaftar di platform AkademiData.</p>
    <div style="background-color: #F8FAFC; border-left: 4px solid #2196F3; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748B;">Token Registrasi Guru Sekolah:</p>
      <code style="font-size: 20px; font-weight: bold; color: #0D47A1; letter-spacing: 1.5px;">${tokenSekolah}</code>
    </div>
    <p style="font-size: 14px; color: #475569;">Bagikan <strong>Token Sekolah</strong> di atas kepada Guru di sekolah Anda agar mereka dapat mendaftar sebagai Guru di AkademiData.</p>
  </div>
</div>
          `,
        });
      } catch (emailError) {
        console.error('[EMAIL ERROR] Gagal mengirim token sekolah via email:', emailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Sekolah berhasil didaftarkan dan Token Sekolah berhasil dibuat.',
        data: newSekolah,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Gagal mendaftarkan sekolah:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat mendaftarkan sekolah.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();

    const sekolahList = await Sekolah.find({}).sort({ createdAt: -1 });

    // Pastikan sekolah lama yang belum memiliki token_sekolah otomatis dibuatkan token unik
    for (const sek of sekolahList) {
      if (!sek.token_sekolah) {
        sek.token_sekolah = await generateUniqueSchoolToken(sek.npsn);
        await sek.save();
      }
    }

    // Hitung jumlah guru dan siswa untuk masing-masing sekolah (Analitik Sekolah)
    const allUsers = await User.find({ role: { $in: ['guru', 'siswa'] } })
      .select('role sekolah_id')
      .lean();

    const guruCountBySekolah: Record<string, number> = {};
    const siswaCountBySekolah: Record<string, number> = {};
    let totalGuruAll = 0;
    let totalSiswaAll = 0;

    for (const u of allUsers as any[]) {
      if (u.role === 'guru') {
        totalGuruAll++;
        if (u.sekolah_id) {
          const sid = u.sekolah_id.toString();
          guruCountBySekolah[sid] = (guruCountBySekolah[sid] || 0) + 1;
        }
      } else if (u.role === 'siswa') {
        totalSiswaAll++;
        if (u.sekolah_id) {
          const sid = u.sekolah_id.toString();
          siswaCountBySekolah[sid] = (siswaCountBySekolah[sid] || 0) + 1;
        }
      }
    }

    const enrichedData = sekolahList.map((sek) => {
      const obj = sek.toObject();
      const sid = sek._id.toString();
      return {
        ...obj,
        jumlah_guru: guruCountBySekolah[sid] || 0,
        jumlah_siswa: siswaCountBySekolah[sid] || 0,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: enrichedData,
        analytics: {
          total_sekolah: sekolahList.length,
          total_guru: totalGuruAll,
          total_siswa: totalSiswaAll,
          total_pengguna: totalGuruAll + totalSiswaAll,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Gagal mengambil data sekolah:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data sekolah', details: error.message },
      { status: 500 }
    );
  }
}
