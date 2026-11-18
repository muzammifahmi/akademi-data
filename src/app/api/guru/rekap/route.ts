import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Kelas from '@/models/Kelas';
import Modul from '@/models/Modul';
import User from '@/models/User';
import Progress from '@/models/Progress';
import { syncStudentProgressWithModul } from '@/lib/progress-sync';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export async function GET() {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== 'guru' && payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const kelasQuery: any = payload.role === 'guru' ? { guru_pengampu: String(payload.id) } : {};
    const classes = await Kelas.find(kelasQuery).sort({ createdAt: -1 }).lean();
    const classIds = classes.map((c: any) => c._id.toString());
    const classMap = new Map(classes.map((c: any) => [c._id.toString(), c]));

    const modules = await Modul.find({ kelas_id: { $in: classes.map((c: any) => c._id) } })
      .sort({ createdAt: 1 })
      .lean();
    const moduleMap = new Map(modules.map((m: any) => [m._id.toString(), m]));

    // Petakan nama sub-bab dari setiap modul
    const subBabTitleMap = new Map<string, string>();
    for (const m of modules as any[]) {
      for (const b of m.babs || []) {
        for (const s of b.subBabs || []) {
          if (s._id) {
            subBabTitleMap.set(s._id.toString(), `${b.title} - ${s.title}`);
          }
        }
      }
    }

    const students = await User.find({
      role: 'siswa',
      kelas: { $in: classIds },
    })
      .select('_id name email nisn_nip kelas')
      .sort({ name: 1 })
      .lean();

    const studentIds = students.map((s: any) => s._id);
    const progressDocs = await Progress.find({
      user_id: { $in: studentIds },
      modul_id: { $in: modules.map((m: any) => m._id) },
    }).lean();

    // Sinkronkan progres dengan struktur modul terkini
    const syncedMap = new Map<string, any>();
    for (const p of progressDocs as any[]) {
      const m = moduleMap.get(p.modul_id.toString());
      if (m) {
        const synced = await syncStudentProgressWithModul(m, p);
        syncedMap.set(`${p.user_id.toString()}_${p.modul_id.toString()}`, {
          ...synced,
          completedAt: p.completedAt || null,
        });
      }
    }

    // Bangun daftar rekap nilai per siswa per modul
    const rekapNilai: any[] = [];
    const riwayatList: any[] = [];

    for (const stu of students as any[]) {
      const stuClassId = String(stu.kelas || '');
      const cls: any = classMap.get(stuClassId);
      const classModules = modules.filter((m: any) => m.kelas_id.toString() === stuClassId);

      for (const mod of classModules as any[]) {
        const key = `${stu._id.toString()}_${mod._id.toString()}`;
        const synced = syncedMap.get(key);
        const scores = synced?.exerciseScores || [];
        const avgScore =
          scores.length > 0
            ? Math.round(scores.reduce((acc: number, s: any) => acc + (Number(s.score) || 0), 0) / scores.length)
            : null;

        rekapNilai.push({
          id: key,
          siswa_id: stu._id.toString(),
          nama_siswa: stu.name,
          email_siswa: stu.email,
          kelas_id: stuClassId,
          nama_kelas: cls?.nama_kelas || '-',
          modul_id: mod._id.toString(),
          judul_modul: mod.judul,
          progress: synced?.moduleProgress || 0,
          completed_count: synced?.completedCount || 0,
          total_subbabs: synced?.totalSubBabs || 0,
          status_modul: synced?.isCompleted
            ? 'Selesai'
            : (synced?.completedCount || 0) > 0
            ? 'Sedang Dipelajari'
            : 'Belum Mulai',
          rata_nilai: avgScore,
          detail_latihan: scores.map((sc: any) => ({
            subbab_id: sc.subbab_id,
            judul_subbab: subBabTitleMap.get(String(sc.subbab_id)) || 'Latihan Sub-Bab',
            score: sc.score,
          })),
          completedAt: synced?.completedAt || null,
        });

        // Tambahkan ke riwayat aktivitas jika sudah ada progres atau latihan yang dikerjakan
        if (synced && (synced.completedCount > 0 || scores.length > 0)) {
          for (const sc of scores) {
            riwayatList.push({
              id: `ex_${key}_${sc.subbab_id}`,
              tipe: 'Latihan Soal',
              nama_siswa: stu.name,
              email_siswa: stu.email,
              kelas_id: stuClassId,
              nama_kelas: cls?.nama_kelas || '-',
              modul_id: mod._id.toString(),
              judul_modul: mod.judul,
              aktivitas: `Menyelesaikan ${subBabTitleMap.get(String(sc.subbab_id)) || 'Latihan Soal'}`,
              nilai: sc.score,
              status: sc.score >= 70 ? 'Lulus' : 'Perlu Perbaikan',
              waktu: synced.completedAt || mod.updatedAt || mod.createdAt,
            });
          }

          if (synced.isCompleted) {
            riwayatList.push({
              id: `mod_${key}`,
              tipe: 'Penyelesaian Modul',
              nama_siswa: stu.name,
              email_siswa: stu.email,
              kelas_id: stuClassId,
              nama_kelas: cls?.nama_kelas || '-',
              modul_id: mod._id.toString(),
              judul_modul: mod.judul,
              aktivitas: `Menyelesaikan seluruh materi modul "${mod.judul}" (100%)`,
              nilai: avgScore,
              status: 'Selesai',
              waktu: synced.completedAt || mod.updatedAt || mod.createdAt,
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      classes: classes.map((c: any) => ({
        id: c._id.toString(),
        nama: c.nama_kelas,
        kodeKelas: c.kode_kelas,
      })),
      modules: modules.map((m: any) => ({
        id: m._id.toString(),
        judul: m.judul,
        status: m.status,
        kelas_id: m.kelas_id.toString(),
        nama_kelas: (classMap.get(m.kelas_id.toString()) as any)?.nama_kelas || '-',
        jumlah_bab: m.babs?.length || 0,
        jumlah_subbab: (m.babs || []).reduce((acc: number, b: any) => acc + (b.subBabs?.length || 0), 0),
        jumlah_soal: (m.babs || []).reduce(
          (acc: number, b: any) =>
            acc +
            (b.subBabs || []).reduce((sAcc: number, s: any) => sAcc + (s.questions?.length || 0), 0),
          0
        ),
      })),
      rekapNilai,
      riwayat: riwayatList,
    });
  } catch (error) {
    console.error('Failed to fetch guru rekap:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
