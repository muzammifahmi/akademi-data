import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    
    // Ambil semua file yang dikirim oleh Jodit (baik files[0], files[], files, dll)
    let files: File[] = [];
    for (const [, val] of data.entries()) {
      if (typeof val === 'object' && val && 'arrayBuffer' in val && (val as File).size > 0) {
        files.push(val as File);
      }
    }

    if (files.length === 0) {
      const fallbackFiles = data.getAll('files[0]');
      if (fallbackFiles && fallbackFiles.length > 0) {
        files = fallbackFiles as File[];
      }
    }
    
    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files uploaded' }, { status: 400 });
    }

    const uploadedFiles: string[] = [];

    for (const file of files) {
      if (typeof file === 'object' && 'arrayBuffer' in file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Buat nama file unik
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.name);
        const filename = uniqueSuffix + ext;
        const filepath = path.join(process.cwd(), 'public/uploads', filename);
        
        await writeFile(filepath, buffer);
        uploadedFiles.push(filename);
      }
    }

    // Format response yang diharapkan Jodit:
    // { success: true, data: { baseurl: '...', files: ['file1.jpg'] } }
    // atau jika error: { success: false, message: '...' }
    return NextResponse.json({
      success: true,
      data: {
        baseurl: '/uploads/',
        files: uploadedFiles,
        path: '/uploads/',
        isImages: uploadedFiles.map(f => f.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null)
      }
    });

  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, error: 'Upload Failed' }, { status: 500 });
  }
}
