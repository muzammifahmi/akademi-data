import Database from 'better-sqlite3';

export function evaluateSQL(studentQuery: string, answerKeyQuery: string, initSchemaSql: string = "") {
  try {
    // Deteksi apakah ini query SELECT atau DML/DDL
    const isSelect = studentQuery.trim().toLowerCase().startsWith('select') && 
                     answerKeyQuery.trim().toLowerCase().startsWith('select');

    if (isSelect) {
      // UNTUK QUERY SELECT (DQL)
      // Kita bisa menggunakan satu database in-memory
      const db = new Database(':memory:');
      
      // 1. Eksekusi skema awal jika ada (misal: buat tabel dan insert data dummy)
      if (initSchemaSql) {
        db.exec(initSchemaSql);
      }
      
      // 2. Ambil hasil dari Kunci Jawaban (Guru)
      const expectedResult = db.prepare(answerKeyQuery).all();
      
      // 3. Ambil hasil dari Jawaban Siswa
      const studentResult = db.prepare(studentQuery).all();
      
      // 4. Komparasi Eksekusi
      // Membandingkan JSON string untuk mengecek kesamaan baris, kolom, dan nilainya
      const isCorrect = JSON.stringify(expectedResult) === JSON.stringify(studentResult);
      
      db.close();

      return {
        success: true,
        isCorrect,
        expectedResult,
        studentResult,
        message: isCorrect ? "Jawaban Benar! Hasil query identik." : "Hasil query tidak sama dengan kunci jawaban."
      };
    } else {
      // UNTUK QUERY DML (INSERT/UPDATE/DELETE) atau DDL (CREATE)
      // Kita harus mengeksekusinya di 2 database bayangan (sandbox) terpisah 
      // dan membandingkan *state* (isi) dari database tersebut setelah query dijalankan.
      
      // Sandbox 1: Untuk Kunci Jawaban
      const dbKey = new Database(':memory:');
      if (initSchemaSql) dbKey.exec(initSchemaSql);
      dbKey.exec(answerKeyQuery); // Jalankan query guru
      
      // Ambil seluruh tabel dan isinya dari Sandbox 1
      const tablesKey = dbKey.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      const stateKey: Record<string, any[]> = {};
      for (const table of tablesKey as any[]) {
        stateKey[table.name] = dbKey.prepare(`SELECT * FROM ${table.name}`).all();
      }
      dbKey.close();

      // Sandbox 2: Untuk Jawaban Siswa
      const dbStudent = new Database(':memory:');
      if (initSchemaSql) dbStudent.exec(initSchemaSql);
      dbStudent.exec(studentQuery); // Jalankan query siswa
      
      // Ambil seluruh tabel dan isinya dari Sandbox 2
      const tablesStudent = dbStudent.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      const stateStudent: Record<string, any[]> = {};
      for (const table of tablesStudent as any[]) {
        stateStudent[table.name] = dbStudent.prepare(`SELECT * FROM ${table.name}`).all();
      }
      dbStudent.close();

      // Komparasi State akhir dari kedua Sandbox
      const isCorrect = JSON.stringify(stateKey) === JSON.stringify(stateStudent);

      return {
        success: true,
        isCorrect,
        expectedResult: stateKey,
        studentResult: stateStudent,
        message: isCorrect ? "Jawaban Benar! Hasil manipulasi database sesuai." : "Struktur atau isi database tidak sama dengan kunci jawaban."
      };
    }

  } catch (error: any) {
    // Menangkap SQL Syntax Error
    return {
      success: false,
      isCorrect: false,
      message: `Error Database: ${error.message}` // Feedback error asli untuk siswa
    };
  }
}
