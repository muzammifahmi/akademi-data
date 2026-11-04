import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function GET() {
  await dbConnect();
  return NextResponse.json({ message: 'Hello API' });
}
