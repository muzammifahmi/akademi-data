import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    await connectToDatabase();

    // Pastikan Email belum terdaftar
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar.' },
        { status: 400 }
      );
    }

    // Buat User (Siswa)
    const newUser = await User.create({
      name: body.nama,
      email: body.email,
      password: body.password,
      role: 'siswa',
      sekolah_id: body.sekolah_id ? body.sekolah_id : undefined,
    });

    // Menggunakan Nodemailer untuk pengiriman email verifikasi (atau selamat datang)
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

        const mailOptions = {
          from: `"AkademiData" <${emailUser}>`,
          to: body.email,
          subject: 'Verifikasi Akun Siswa - AkademiData',
          html: `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
  <!-- Header -->
  <div style="background-color: #0D47A1; padding: 32px 20px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 26px; letter-spacing: 1px;">AkademiData</h1>
  </div>
  
  <!-- Body -->
  <div style="padding: 40px 32px; color: #334155; line-height: 1.6;">
    <h2 style="color: #0D47A1; font-size: 22px; margin-top: 0; margin-bottom: 24px;">Selamat Datang!</h2>
    <p style="margin: 0 0 16px 0; font-size: 16px;">Halo ${body.nama},</p>
    <p style="margin: 0 0 28px 0; font-size: 16px;">Akun Siswa Anda di sistem AkademiData telah berhasil dibuat dan diverifikasi.</p>
    
    <!-- Info Box -->
    <div style="background-color: #F8FAFC; border-left: 4px solid #2196F3; padding: 24px; margin-bottom: 28px; border-radius: 0 6px 6px 0;">
      <p style="margin: 0 0 16px 0; font-weight: bold; color: #0F172A; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Informasi Akun Anda:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; width: 140px; color: #64748B; font-size: 15px;">Email Login</td>
          <td style="padding: 8px 0; font-weight: bold; font-size: 15px;"><a href="mailto:${body.email}" style="color: #0D47A1; text-decoration: underline;">${body.email}</a></td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 36px 0;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}" style="background-color: #2196F3; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);">Masuk ke Portal</a>
    </div>
    
    <p style="margin: 0 0 6px 0; font-size: 16px;">Salam hangat,</p>
    <p style="margin: 0; font-weight: bold; color: #0D47A1; font-size: 16px;">Tim AkademiData</p>
  </div>
  
  <!-- Footer -->
  <div style="background-color: #F8FAFC; padding: 24px; text-align: center; border-top: 1px solid #E2E8F0;">
    <p style="margin: 0; font-size: 13px; color: #64748B; line-height: 1.5;">
      Pesan ini dikirim secara otomatis oleh sistem AkademiData.<br>Mohon tidak membalas email ini secara langsung.
    </p>
    <p style="margin: 12px 0 0 0; font-size: 13px; color: #94A3B8;">
      &copy; ${new Date().getFullYear()} AkademiData. Hak Cipta Dilindungi.
    </p>
  </div>
</div>
          `,
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Sukses mengirim email registrasi siswa ke ${body.email}`);
      } catch (emailError) {
        console.error("[EMAIL ERROR] Gagal mengirim via Nodemailer:", emailError);
      }
    } else {
      console.log(`[EMAIL MOCK] Mengirim email selamat datang ke ${body.email}...`);
    }

    return NextResponse.json(
      { message: 'Pendaftaran berhasil. Silakan cek email Anda.' },
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Gagal mendaftar:", error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat pendaftaran.' },
      { status: 500 }
    );
  }
}
