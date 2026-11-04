import { NextRequest, NextResponse } from "next/server";
import { evaluateSQL } from "@/lib/sql-grader";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentQuery, answerKeyQuery, initSchemaSql } = body;

    if (!studentQuery || !answerKeyQuery) {
      return NextResponse.json(
        { success: false, message: "studentQuery dan answerKeyQuery wajib diisi." }, 
        { status: 400 }
      );
    }

    // Panggil fungsi auto-grader yang membandingkan eksekusi SQL
    const evaluationResult = evaluateSQL(studentQuery, answerKeyQuery, initSchemaSql);

    return NextResponse.json(evaluationResult);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan sistem: " + error.message }, 
      { status: 500 }
    );
  }
}
