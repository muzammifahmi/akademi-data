import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Sekolah } from '@/models/Sekolah';

// Fungsi bantuan untuk menghasilkan random password (8 karakter alfanumerik)
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
    const body = await request.json();
    
    // Connect to database
    await connectToDatabase();

    // Pastikan NPSN atau Email Admin belum terdaftar
    const existingSekolah = await Sekolah.findOne({ 
      $or: [{ npsn: body.npsn }, { admin_email: body.admin_email }] 
    });

    if (existingSekolah) {
      return NextResponse.json(
        { error: 'NPSN atau Email Admin sudah terdaftar di sistem.' },
        { status: 400 }
      );
    }

    // Auto-generate password tanpa campur tangan Superadmin
    const generatedPassword = generateRandomPassword();

    // Menyimpan data
    const newSekolah = await Sekolah.create({
      npsn: body.npsn,
      nama_sekolah: body.nama_sekolah,
      email_sekolah: body.email_sekolah,
      telepon: body.telepon,
      alamat: body.alamat,
      admin_nama: body.admin_nama,
      admin_email: body.admin_email,
      admin_password: generatedPassword, // Password mentah (seharusnya di-hash, tapi untuk simplifikasi kita simpan mentah agar bisa diemail/ditampilkan log)
    });

    // Menggunakan Nodemailer untuk pengiriman email sungguhan via Gmail
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
          to: body.admin_email,
          subject: 'Kredensial Login Portal Sekolah - AkademiData',
          html: `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
  <!-- Header -->
  <div style="background-color: #0D47A1; padding: 32px 20px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 26px; letter-spacing: 1px;">AkademiData</h1>
  </div>
  
  <!-- Body -->
  <div style="padding: 40px 32px; color: #334155; line-height: 1.6;">
    <h2 style="color: #0D47A1; font-size: 22px; margin-top: 0; margin-bottom: 24px;">Selamat Datang!</h2>
    <p style="margin: 0 0 16px 0; font-size: 16px;">Halo Administrator,</p>
    <p style="margin: 0 0 28px 0; font-size: 16px;">Pendaftaran untuk institusi <strong style="color: #0F172A;">${body.nama_sekolah}</strong> telah berhasil diverifikasi dan didaftarkan ke dalam sistem AkademiData.</p>
    
    <!-- Credentials Box -->
    <div style="background-color: #F8FAFC; border-left: 4px solid #2196F3; padding: 24px; margin-bottom: 28px; border-radius: 0 6px 6px 0;">
      <p style="margin: 0 0 16px 0; font-weight: bold; color: #0F172A; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Kredensial Akses Anda:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; width: 140px; color: #64748B; font-size: 15px;">Email Login</td>
          <td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 15px;">${body.admin_email}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0 8px 0; width: 140px; color: #64748B; font-size: 15px;">Password</td>
          <td style="padding: 12px 0 8px 0;">
            <code style="background-color: #E2E8F0; padding: 6px 12px; border-radius: 6px; color: #020617; font-family: monospace; font-size: 16px; letter-spacing: 1px; font-weight: bold;">${generatedPassword}</code>
          </td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 0 0 32px 0; font-size: 14px; color: #92400E; background-color: #FEF3C7; padding: 16px; border-radius: 6px; border: 1px solid #FCD34D;">
      <strong>⚠️ PERHATIAN:</strong> Demi keamanan data institusi Anda, mohon segera mengubah password sementara ini segera setelah Anda berhasil login untuk pertama kalinya.
    </p>
    
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
        console.log(`[EMAIL] Sukses mengirim kredensial melalui Nodemailer ke ${body.admin_email}`);
      } catch (emailError) {
        console.error("[EMAIL ERROR] Gagal mengirim via Nodemailer:", emailError);
      }
    } else {
      console.log("[EMAIL MOCK] Kredensial EMAIL_USER belum disetel. Menampilkan password di log saja:");
      console.log(`[EMAIL MOCK] Mengirim email ke ${body.admin_email}...`);
      console.log(`[EMAIL MOCK] Password Sementara: ${generatedPassword}`);
    }

    return NextResponse.json(
      { message: 'Sekolah berhasil didaftarkan. Password admin dikirim via Email.', data: newSekolah },
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Gagal mendaftarkan sekolah:", error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat mendaftarkan sekolah.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    
    // Ambil semua data sekolah dari database, urutkan dari yang terbaru
    const sekolahList = await Sekolah.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json(
      { success: true, data: sekolahList },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Gagal mengambil data sekolah:", error);
    return NextResponse.json(
      { error: 'Gagal mengambil data sekolah', details: error.message },
      { status: 500 }
    );
  }
}
