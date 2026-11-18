import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Ujian from "@/models/Ujian";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const ujian = await Ujian.findById(id).lean();
    if (!ujian) {
      return NextResponse.json(
        { success: false, error: "Ujian tidak ditemukan" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: ujian });
  } catch (error) {
    console.error("Failed to fetch ujian detail:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    if (payload.role !== "guru" && payload.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updateFields: Record<string, any> = {};
    if (body.judul !== undefined) updateFields.judul = body.judul;
    if (body.deskripsi !== undefined) updateFields.deskripsi = body.deskripsi;
    if (body.kelas_id !== undefined) updateFields.kelas_id = body.kelas_id;
    if (body.durasi_menit !== undefined)
      updateFields.durasi_menit = Number(body.durasi_menit);
    if (body.jadwal !== undefined) updateFields.jadwal = body.jadwal;
    if (body.proctoring !== undefined)
      updateFields.proctoring = Boolean(body.proctoring);
    if (body.status !== undefined) updateFields.status = body.status;
    if (body.questions !== undefined) updateFields.questions = body.questions;

    const updated = await Ujian.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Ujian tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update ujian:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    if (payload.role !== "guru" && payload.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await Ujian.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete ujian:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
