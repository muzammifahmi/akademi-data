import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Ujian from "@/models/Ujian";
import { evaluateSQL } from "@/lib/sql-grader";
import { generateInitSchemaSqlFromTables } from "@/components/VsCodeSqlEditor";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const { id } = await params;
    const ujian: any = await Ujian.findById(id).lean();
    if (!ujian) {
      return NextResponse.json(
        { success: false, error: "Ujian tidak ditemukan" },
        { status: 404 }
      );
    }

    // Status Draft: Baru masuk ke siswa jika dipindah menjadi aktif atau terjadwal
    if (ujian.status === "Draft") {
      return NextResponse.json(
        { success: false, error: "Ujian masih berstatus draft dan belum dipublikasikan oleh guru." },
        { status: 403 }
      );
    }

    const mySubmission = (ujian.submissions || []).find(
      (s: any) => String(s.user_id) === String(payload.id)
    );

    // Jika sudah pernah submit, pastikan data rincian hasil penilaian (results) selalu terisi
    if (mySubmission) {
      if (!mySubmission.results || Object.keys(mySubmission.results).length === 0) {
        const computedResults: Record<string, any> = {};
        for (const q of ujian.questions || []) {
          const weight = Number(q.scoreWeight) || 10;
          const ans = mySubmission.answers ? mySubmission.answers[q.id] : "";
          if (q.type === "multiple_choice") {
            const correctOpt = (q.options || []).find((o: any) => o.isCorrect);
            const isCorrect = Boolean(correctOpt && ans && ans === correctOpt.id);
            computedResults[q.id] = {
              isCorrect,
              earnedScore: isCorrect ? weight : 0,
              maxScore: weight,
              correctAnswer: correctOpt?.id || null,
              feedback: isCorrect ? "Jawaban Anda Benar!" : "Jawaban Anda Kurang Tepat.",
            };
          } else if (q.type === "sql_query") {
            if (!ans || typeof ans !== "string" || !ans.trim()) {
              computedResults[q.id] = {
                isCorrect: false,
                earnedScore: 0,
                maxScore: weight,
                feedback: "Soal tidak dijawab.",
              };
            } else {
              const initSchemaSql = generateInitSchemaSqlFromTables(q.tables || []);
              const evalRes = evaluateSQL(
                ans,
                q.sqlAnswerKey || "",
                initSchemaSql,
                q.answerTables || [],
                q.queryType || "DQL"
              );
              computedResults[q.id] = {
                isCorrect: Boolean(evalRes.isCorrect),
                earnedScore: evalRes.isCorrect ? weight : 0,
                maxScore: weight,
                feedback: evalRes.message,
              };
            }
          }
        }
        mySubmission.results = computedResults;
      }
    }

    // Status Terjadwal: Siswa hanya dapat melihat jadwal dan belum dapat melihat butir soal sampai waktu tiba
    if (ujian.status === "Terjadwal" && ujian.jadwal && !mySubmission) {
      const scheduledTime = new Date(ujian.jadwal).getTime();
      if (!isNaN(scheduledTime) && Date.now() < scheduledTime) {
        return NextResponse.json({
          success: true,
          isScheduled: true,
          jadwal: ujian.jadwal,
          data: {
            id: ujian._id.toString(),
            judul: ujian.judul,
            deskripsi: ujian.deskripsi || "",
            durasi_menit: ujian.durasi_menit || 60,
            jadwal: ujian.jadwal,
            proctoring: Boolean(ujian.proctoring),
            status: ujian.status,
            questions: [], // Sembunyikan soal sampai jadwal pelaksanaan tiba
          },
          submission: null,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: ujian._id.toString(),
        judul: ujian.judul,
        deskripsi: ujian.deskripsi || "",
        durasi_menit: ujian.durasi_menit || 60,
        jadwal: ujian.jadwal || "",
        proctoring: Boolean(ujian.proctoring),
        status: ujian.status || "Aktif",
        questions: ujian.questions || [],
      },
      submission: mySubmission || null,
    });
  } catch (error) {
    console.error("Failed to fetch siswa ujian:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const { id } = await params;
    const body = await req.json();
    const answers: Record<string, string> = body.answers || {};
    const violations: number = Number(body.violations) || 0;

    const ujian: any = await Ujian.findById(id);
    if (!ujian) {
      return NextResponse.json(
        { success: false, error: "Ujian tidak ditemukan" },
        { status: 404 }
      );
    }

    if (ujian.status === "Draft") {
      return NextResponse.json(
        { success: false, error: "Ujian masih berstatus draft dan belum dapat dikerjakan." },
        { status: 403 }
      );
    }

    if (ujian.status === "Terjadwal" && ujian.jadwal) {
      const scheduledTime = new Date(ujian.jadwal).getTime();
      if (!isNaN(scheduledTime) && Date.now() < scheduledTime) {
        return NextResponse.json(
          { success: false, error: "Waktu pelaksanaan ujian belum dimulai." },
          { status: 403 }
        );
      }
    }

    const questions = ujian.questions || [];
    let totalWeight = 0;
    let earnedWeight = 0;
    const results: Record<
      string,
      {
        isCorrect: boolean;
        earnedScore: number;
        maxScore: number;
        feedback?: string;
        correctAnswer?: any;
      }
    > = {};

    for (const q of questions) {
      const weight = Number(q.scoreWeight) || 10;
      totalWeight += weight;
      const ans = answers[q.id];

      if (q.type === "multiple_choice") {
        const correctOpt = (q.options || []).find((o: any) => o.isCorrect);
        const isCorrect = Boolean(correctOpt && ans && ans === correctOpt.id);
        const earned = isCorrect ? weight : 0;
        earnedWeight += earned;
        results[q.id] = {
          isCorrect,
          earnedScore: earned,
          maxScore: weight,
          correctAnswer: correctOpt?.id || null,
          feedback: isCorrect ? "Jawaban Anda Benar!" : "Jawaban Anda Kurang Tepat.",
        };
      } else if (q.type === "sql_query") {
        if (!ans || typeof ans !== "string" || !ans.trim()) {
          results[q.id] = {
            isCorrect: false,
            earnedScore: 0,
            maxScore: weight,
            feedback: "Soal tidak dijawab.",
          };
          continue;
        }

        const initSchemaSql = generateInitSchemaSqlFromTables(q.tables || []);
        const evalRes = evaluateSQL(
          ans,
          q.sqlAnswerKey || "",
          initSchemaSql,
          q.answerTables || [],
          q.queryType || "DQL"
        );
        const isCorrect = Boolean(evalRes.isCorrect);
        const earned = isCorrect ? weight : 0;
        earnedWeight += earned;
        results[q.id] = {
          isCorrect,
          earnedScore: earned,
          maxScore: weight,
          feedback: evalRes.message,
        };
      }
    }

    const finalScore =
      totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

    const existingIdx = (ujian.submissions || []).findIndex(
      (s: any) => String(s.user_id) === String(payload.id)
    );

    const submissionRecord = {
      user_id: payload.id,
      score: finalScore,
      answers,
      results,
      violations,
      submittedAt: new Date(),
    };

    if (existingIdx >= 0) {
      ujian.submissions[existingIdx] = submissionRecord;
    } else {
      ujian.submissions.push(submissionRecord);
    }

    await ujian.save();

    return NextResponse.json({
      success: true,
      score: finalScore,
      results,
      submission: submissionRecord,
    });
  } catch (error) {
    console.error("Failed to submit siswa ujian:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
