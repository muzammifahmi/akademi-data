import { NextRequest, NextResponse } from "next/server";
import { evaluateSQL } from "@/lib/sql-grader";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentQuery, answerKeyQuery, initSchemaSql, answerTables, queryType } = body;

    if (!studentQuery && (!answerTables || answerTables.length === 0) && !answerKeyQuery) {
      return NextResponse.json(
        { success: false, message: "Data query atau Tabel Kunci Jawaban belum diisi." },
        { status: 400 }
      );
    }

    const evaluationResult = evaluateSQL(
      studentQuery || answerKeyQuery || "",
      answerKeyQuery || "",
      initSchemaSql || "",
      answerTables || [],
      queryType || "DQL"
    );

    return NextResponse.json(evaluationResult);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan sistem: " + error.message },
      { status: 500 }
    );
  }
}
