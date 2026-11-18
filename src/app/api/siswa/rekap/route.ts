import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Kelas from "@/models/Kelas";
import Modul from "@/models/Modul";
import Ujian from "@/models/Ujian";
import Progress from "@/models/Progress";
import { syncStudentProgressWithModul } from "@/lib/progress-sync";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only";

export async function GET() {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const user: any = await User.findById(payload.id).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (!user.kelas) {
      return NextResponse.json({
        success: true,
        hasClass: false,
        kelas: null,
        rekapModul: [],
        daftarUjian: [],
        daftarLatihan: [],
        riwayatNilai: [],
      });
    }

    const kelasDoc: any = await Kelas.findById(user.kelas).lean();
    const modules: any[] = await Modul.find({
      kelas_id: user.kelas,
      status: "Terbit",
    })
      .sort({ createdAt: 1 })
      .lean();

    const ujians: any[] = await Ujian.find({
      kelas_id: user.kelas,
      status: { $in: ["Aktif", "Terjadwal", "Selesai"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    const progressDocs: any[] = await Progress.find({
      user_id: user._id,
      modul_id: { $in: modules.map((m) => m._id) },
    }).lean();

    const daftarUjian: any[] = ujians.map((u: any) => {
      const questions = u.questions || [];
      const sqlCount = questions.filter((q: any) => q.type === "sql_query").length;
      const pgCount = questions.filter((q: any) => q.type === "multiple_choice").length;
      const totalBobot = questions.reduce(
        (acc: number, q: any) => acc + (Number(q.scoreWeight) || 0),
        0
      );

      const mySubmission = (u.submissions || []).find(
        (sub: any) => String(sub.user_id) === String(user._id)
      );
      const hasSubmitted = Boolean(mySubmission);
      const scoreVal = hasSubmitted ? Number(mySubmission.score) : null;

      return {
        id: u._id.toString(),
        judul: u.judul,
        deskripsi: u.deskripsi || "",
        durasi_menit: u.durasi_menit || 60,
        jadwal: u.jadwal || "",
        proctoring: Boolean(u.proctoring),
        status_sesi: u.status || "Aktif",
        jumlah_soal: questions.length,
        jumlah_sql: sqlCount,
        jumlah_pg: pgCount,
        total_bobot: totalBobot,
        sudah_dikerjakan: hasSubmitted,
        skor: scoreVal,
        status_lulus: hasSubmitted
          ? (scoreVal || 0) >= 70
            ? "Lulus"
            : "Perlu Perbaikan"
          : "Belum Dikerjakan",
        waktu_submit: mySubmission?.submittedAt || null,
        href: `/siswa/ujian/${u._id.toString()}`,
      };
    });

    const rekapModul: any[] = [];
    const daftarLatihan: any[] = [];
    const riwayatNilai: any[] = [];

    let prevModuleCompleted = true;

    for (let mIdx = 0; mIdx < modules.length; mIdx++) {
      const mod = modules[mIdx];
      const modId = mod._id.toString();
      const progDoc = progressDocs.find((p) => p.modul_id.toString() === modId);
      const synced = await syncStudentProgressWithModul(mod, progDoc);

      const isModuleLocked = mIdx > 0 && !prevModuleCompleted;
      prevModuleCompleted = synced.isCompleted;

      const scores = synced.exerciseScores || [];
      const scoreMap = new Map<string, any>();
      for (const sc of scores) {
        scoreMap.set(String(sc.subbab_id), sc);
      }

      const avgScore =
        scores.length > 0
          ? Math.round(
              scores.reduce((acc: number, s: any) => acc + (Number(s.score) || 0), 0) /
                scores.length
            )
          : null;

      let totalQuestionsInModul = 0;
      let totalLatihanSubBabs = 0;
      let completedLatihanSubBabs = 0;

      const babs = mod.babs || [];
      for (let bIdx = 0; bIdx < babs.length; bIdx++) {
        const bab = babs[bIdx];
        const subBabs = bab.subBabs || [];
        for (let sIdx = 0; sIdx < subBabs.length; sIdx++) {
          const sub = subBabs[sIdx];
          const subId = sub._id?.toString() || "";
          const questions = sub.questions || [];

          let isSubLocked = isModuleLocked;
          if (!isSubLocked && (bIdx !== 0 || sIdx !== 0)) {
            let prevSubId: string | null = null;
            if (sIdx > 0) {
              prevSubId = subBabs[sIdx - 1]?._id?.toString() || null;
            } else {
              const prevBab = babs[bIdx - 1];
              if (prevBab?.subBabs?.length > 0) {
                prevSubId =
                  prevBab.subBabs[prevBab.subBabs.length - 1]?._id?.toString() || null;
              }
            }
            if (prevSubId && !synced.completedSubBabIds.includes(prevSubId)) {
              isSubLocked = true;
            }
          }

          if (questions.length > 0) {
            totalLatihanSubBabs++;
            totalQuestionsInModul += questions.length;
            const scObj = scoreMap.get(subId);
            const hasScore = scObj !== undefined;
            if (hasScore) {
              completedLatihanSubBabs++;
            }

            const sqlCount = questions.filter(
              (q: any) => q.type === "sql_query" || q.type === "sql"
            ).length;
            const mcCount = questions.filter(
              (q: any) => q.type !== "sql_query" && q.type !== "sql"
            ).length;

            const latihanItem = {
              id: `${modId}_${subId}`,
              modul_id: modId,
              judul_modul: mod.judul,
              bab_idx: bIdx,
              judul_bab: bab.title,
              sub_idx: sIdx,
              subbab_id: subId,
              judul_subbab: sub.title,
              jumlah_soal: questions.length,
              jumlah_sql: sqlCount,
              jumlah_pg: mcCount,
              sudah_dikerjakan: hasScore,
              skor: hasScore ? Number(scObj.score) : null,
              status_lulus: hasScore
                ? Number(scObj.score) >= 70
                  ? "Lulus"
                  : "Perlu Perbaikan"
                : "Belum Dikerjakan",
              is_locked: isSubLocked,
              href: `/siswa/modul/${modId}?bab=${bIdx}&sub=${sIdx}&latihan=1`,
              waktu: progDoc?.completedAt || mod.updatedAt || mod.createdAt,
            };

            daftarLatihan.push(latihanItem);

            if (hasScore) {
              riwayatNilai.push({
                ...latihanItem,
                tipe: "Latihan Sub-Bab",
              });
            }
          }
        }
      }

      rekapModul.push({
        modul_id: modId,
        urutan: mIdx + 1,
        judul_modul: mod.judul,
        tujuan: mod.tujuan || "",
        progress: synced.moduleProgress,
        completed_count: synced.completedCount,
        total_subbabs: synced.totalSubBabs,
        total_latihan: totalLatihanSubBabs,
        completed_latihan: completedLatihanSubBabs,
        total_soal: totalQuestionsInModul,
        rata_nilai: avgScore,
        is_completed: synced.isCompleted,
        is_locked: isModuleLocked,
        status_modul: synced.isCompleted
          ? "Selesai"
          : synced.completedCount > 0
          ? "Sedang Dipelajari"
          : "Belum Mulai",
        completedAt: progDoc?.completedAt || null,
      });
    }

    return NextResponse.json({
      success: true,
      hasClass: true,
      kelas: kelasDoc
        ? {
            id: kelasDoc._id.toString(),
            nama_kelas: kelasDoc.nama_kelas,
            kode_kelas: kelasDoc.kode_kelas,
          }
        : null,
      rekapModul,
      daftarUjian,
      daftarLatihan,
      riwayatNilai,
    });
  } catch (error) {
    console.error("Failed to fetch siswa rekap:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
