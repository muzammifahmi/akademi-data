import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Ujian from "@/models/Ujian";
import Kelas from "@/models/Kelas";
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

    const kelasQuery: any =
      payload.role === "guru" ? { guru_pengampu: String(payload.id) } : {};
    const classes = await Kelas.find(kelasQuery).sort({ createdAt: -1 }).lean();
    const classMap = new Map(classes.map((c: any) => [c._id.toString(), c]));
    const classIds = classes.map((c: any) => c._id);

    const ujians = await Ujian.find({ kelas_id: { $in: classIds } })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = ujians.map((u: any) => {
      const cls: any = classMap.get(u.kelas_id?.toString()) || {};
      const questions = u.questions || [];
      const sqlCount = questions.filter((q: any) => q.type === "sql_query").length;
      const pgCount = questions.filter((q: any) => q.type === "multiple_choice").length;
      const totalBobot = questions.reduce(
        (acc: number, q: any) => acc + (Number(q.scoreWeight) || 0),
        0
      );

      return {
        id: u._id.toString(),
        judul: u.judul,
        deskripsi: u.deskripsi || "",
        kelas_id: u.kelas_id?.toString() || "",
        nama_kelas: cls.nama_kelas || "-",
        durasi_menit: u.durasi_menit || 60,
        jadwal: u.jadwal || "",
        proctoring: Boolean(u.proctoring),
        status: u.status || "Aktif",
        jumlah_soal: questions.length,
        jumlah_sql: sqlCount,
        jumlah_pg: pgCount,
        total_bobot: totalBobot,
        createdAt: u.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      classes: classes.map((c: any) => ({
        id: c._id.toString(),
        nama: c.nama_kelas,
        kodeKelas: c.kode_kelas,
      })),
      data: formatted,
    });
  } catch (error) {
    console.error("Failed to fetch ujian:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "guru" && payload.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      judul,
      deskripsi,
      kelas_id,
      durasi_menit,
      jadwal,
      proctoring,
      status,
      questions,
    } = body;

    if (!judul || !kelas_id) {
      return NextResponse.json(
        { success: false, error: "Judul ujian dan kelas wajib diisi." },
        { status: 400 }
      );
    }

    const created = await Ujian.create({
      judul,
      deskripsi: deskripsi || "",
      kelas_id,
      durasi_menit: Number(durasi_menit) || 60,
      jadwal: jadwal || "",
      proctoring: proctoring !== undefined ? Boolean(proctoring) : true,
      status: status || "Aktif",
      questions: Array.isArray(questions) ? questions : [],
    });

    return NextResponse.json({
      success: true,
      data: created,
    });
  } catch (error) {
    console.error("Failed to create ujian:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
