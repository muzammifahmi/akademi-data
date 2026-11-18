import Database from 'better-sqlite3';

function normalizeRowObjects(rows: any[]): Record<string, string>[] {
  return (rows || []).map((row) => {
    const normalized: Record<string, string> = {};
    Object.keys(row || {}).forEach((k) => {
      const val = row[k];
      normalized[k.trim().toLowerCase()] =
        val === null || val === undefined || val === '' ? 'NULL' : String(val).trim();
    });
    return normalized;
  });
}

function parseSqlType(rawType: string): { baseType: string; length: string } {
  const cleaned = String(rawType || '')
    .trim()
    .toUpperCase();
  const match = cleaned.match(/^([A-Z0-9_]+)\s*(?:\(\s*([^)]+)\s*\))?/);
  if (!match) {
    return { baseType: cleaned, length: '' };
  }
  let baseType = match[1];
  const length = match[2] ? match[2].trim() : '';
  if (baseType === 'INTEGER') {
    baseType = 'INT';
  }
  return { baseType, length };
}

function isDdlColumnTypeMatch(studentType: string, keyType: string): boolean {
  const st = parseSqlType(studentType);
  const key = parseSqlType(keyType);

  if (st.baseType !== key.baseType) {
    return false;
  }

  // Untuk INT/INTEGER: default builder mengisikan panjang 11 meskipun soal hanya menulis INT
  if (key.baseType === 'INT') {
    if (!key.length || key.length === '11') {
      return st.length === '' || st.length === '11';
    }
    return st.length === key.length;
  }

  // Untuk tipe lain seperti VARCHAR(100), VARCHAR(50), CHAR(10), dll: panjang kolom harus sama persis
  if (key.length) {
    return st.length === key.length;
  }

  return true;
}

function buildExpectedRowsFromTable(ansTable: any): Record<string, any>[] {
  if (!ansTable) return [];
  const validCols = (ansTable.columns || []).filter((c: any) => c.name);
  if (validCols.length === 0) return [];
  return (ansTable.rows || []).map((row: any) => {
    const obj: Record<string, any> = {};
    validCols.forEach((c: any) => {
      const val = row[c.id];
      obj[c.name] = val === undefined || val === '' ? null : val;
    });
    return obj;
  });
}

export function evaluateSQL(
  studentQuery: string,
  answerKeyQuery: string = '',
  initSchemaSql: string = '',
  answerTables: any[] = [],
  queryType: string = 'DQL'
) {
  const startTime = Date.now();
  try {
    if (!studentQuery || !studentQuery.trim()) {
      return {
        success: false,
        isCorrect: false,
        executionTimeMs: 0,
        message: 'Query SQL masih kosong. Tuliskan perintah SQL terlebih dahulu.',
      };
    }

    const validAnswerTables = (answerTables || []).filter(
      (t: any) => t && (t.name || (t.columns && t.columns.some((c: any) => c.name)))
    );

    const isSelectStudent = studentQuery.trim().toLowerCase().startsWith('select');

    // JIKA MENGGUNAKAN TABEL KUNCI JAWABAN (answerTables)
    if (validAnswerTables.length > 0) {
      if (queryType === 'DQL' || isSelectStudent) {
        const db = new Database(':memory:');
        if (initSchemaSql) {
          db.exec(initSchemaSql);
        }
        const studentResult = db.prepare(studentQuery).all();
        db.close();

        const expectedResult = buildExpectedRowsFromTable(validAnswerTables[0]);
        const normStudent = normalizeRowObjects(studentResult);
        const normExpected = normalizeRowObjects(expectedResult);

        const isCorrect = JSON.stringify(normExpected) === JSON.stringify(normStudent);

        return {
          success: true,
          isCorrect,
          resultType: 'rows',
          executionTimeMs: Math.max(1, Date.now() - startTime),
          expectedResult,
          studentResult,
          message: isCorrect
            ? 'Jawaban Benar! Tabel hasil query sesuai dengan Tabel Kunci Jawaban.'
            : 'Tabel hasil query belum sesuai dengan Tabel Kunci Jawaban.',
        };
      } else {
        // DML atau DDL dengan Tabel Kunci Jawaban
        const dbStudent = new Database(':memory:');
        if (initSchemaSql) dbStudent.exec(initSchemaSql);
        dbStudent.exec(studentQuery);

        const tablesStudent = dbStudent
          .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
          .all();
        const stateStudent: Record<string, { columns: any[]; rows: any[] }> = {};
        for (const table of tablesStudent as any[]) {
          const columns = dbStudent
            .prepare(`PRAGMA table_info(${table.name})`)
            .all()
            .map((c: any) => ({
              name: String(c.name).toLowerCase(),
              type: String(c.type || '').toUpperCase(),
              pk: Boolean(c.pk),
            }));
          const rows = dbStudent.prepare(`SELECT * FROM ${table.name}`).all();
          stateStudent[String(table.name).toLowerCase()] = { columns, rows };
        }
        dbStudent.close();

        // Bentuk stateKey dari answerTables
        const stateKey: Record<string, { columns: any[]; rows: any[] }> = {};
        for (const tbl of validAnswerTables) {
          if (!tbl.name) continue;
          const validCols = (tbl.columns || []).filter((c: any) => c.name);
          const columns = validCols.map((c: any) => {
            let fullType = String(c.type || 'VARCHAR').toUpperCase();
            if (c.ai) {
              fullType = 'INTEGER';
            } else if (c.length && !['DATE', 'DATETIME', 'BOOLEAN', 'TEXT', 'INT', 'INTEGER'].includes(fullType)) {
              fullType += `(${c.length})`;
            } else if (c.length && fullType === 'INT') {
              fullType += `(${c.length})`;
            }
            return {
              name: String(c.name).toLowerCase(),
              type: fullType,
              pk: Boolean(c.pk || c.ai),
            };
          });
          const rows = buildExpectedRowsFromTable(tbl);
          stateKey[String(tbl.name).toLowerCase()] = { columns, rows };
        }

        // Komparasi untuk DML vs DDL
        let isCorrect = true;
        let mismatchDetail = '';

        for (const tName of Object.keys(stateKey)) {
          const stTbl = stateStudent[tName];
          const keyTbl = stateKey[tName];
          if (!stTbl) {
            isCorrect = false;
            mismatchDetail = `Tabel '${tName}' belum ditemukan.`;
            break;
          }

          // Cek jumlah & nama kolom
          const stColNames = stTbl.columns.map((c) => c.name);
          const keyColNames = keyTbl.columns.map((c) => c.name);
          if (JSON.stringify(stColNames) !== JSON.stringify(keyColNames)) {
            isCorrect = false;
            mismatchDetail = `Nama atau urutan kolom pada tabel '${tName}' belum sesuai.`;
            break;
          }

          const isDdlQuery =
            queryType === 'DDL' ||
            /^(create|alter|drop)\s+/i.test(studentQuery.trim()) ||
            /^(create|alter|drop)\s+/i.test(answerKeyQuery.trim());

          // Khusus DDL: wajib validasi tipe data, panjang kolom (misal VARCHAR(100) vs VARCHAR(50)), dan PRIMARY KEY
          if (isDdlQuery) {
            for (let i = 0; i < keyTbl.columns.length; i++) {
              const keyCol = keyTbl.columns[i];
              const stCol = stTbl.columns[i];

              if (!isDdlColumnTypeMatch(stCol.type, keyCol.type)) {
                isCorrect = false;
                mismatchDetail = `Tipe data kolom '${keyCol.name}' (${stCol.type || 'kosong'}) tidak sesuai dengan kunci jawaban (${keyCol.type}).`;
                break;
              }

              if (Boolean(stCol.pk) !== Boolean(keyCol.pk)) {
                isCorrect = false;
                mismatchDetail = keyCol.pk
                  ? `Kolom '${keyCol.name}' harus ditetapkan sebagai PRIMARY KEY.`
                  : `Kolom '${keyCol.name}' seharusnya bukan PRIMARY KEY.`;
                break;
              }
            }
            if (!isCorrect) break;
          }

          // Jika DML atau jika Tabel Kunci memiliki baris data, cocokkan isi barisnya
          if (queryType === 'DML' || keyTbl.rows.length > 0) {
            const normStRows = normalizeRowObjects(stTbl.rows);
            const normKeyRows = normalizeRowObjects(keyTbl.rows);
            if (JSON.stringify(normStRows) !== JSON.stringify(normKeyRows)) {
              isCorrect = false;
              mismatchDetail = `Isi baris data pada tabel '${tName}' belum sesuai dengan Tabel Kunci Jawaban.`;
              break;
            }
          }
        }

        return {
          success: true,
          isCorrect,
          resultType: 'schema',
          executionTimeMs: Math.max(1, Date.now() - startTime),
          expectedResult: stateKey,
          studentResult: stateStudent,
          message: isCorrect
            ? 'Jawaban Benar! Struktur dan isi tabel sesuai dengan Tabel Kunci Jawaban.'
            : mismatchDetail || 'Struktur atau isi tabel belum sesuai dengan Tabel Kunci Jawaban.',
        };
      }
    }

    // FALLBACK: Komparasi menggunakan answerKeyQuery (atau eksekusi langsung jika answerKeyQuery kosong)
    if (isSelectStudent) {
      const db = new Database(':memory:');
      if (initSchemaSql) {
        db.exec(initSchemaSql);
      }
      const studentResult = db.prepare(studentQuery).all();
      let expectedResult: any[] = [];
      let isCorrect = false;
      if (answerKeyQuery && answerKeyQuery.trim().toLowerCase().startsWith('select')) {
        expectedResult = db.prepare(answerKeyQuery).all();
        isCorrect =
          JSON.stringify(normalizeRowObjects(expectedResult)) ===
          JSON.stringify(normalizeRowObjects(studentResult));
      }
      db.close();

      return {
        success: true,
        isCorrect,
        resultType: 'rows',
        executionTimeMs: Math.max(1, Date.now() - startTime),
        expectedResult,
        studentResult,
        message: isCorrect
          ? 'Jawaban Benar! Hasil query identik.'
          : 'Hasil query tidak sama dengan kunci jawaban.',
      };
    } else {
      const stateKey: Record<string, { columns: any[]; rows: any[] }> = {};
      if (answerKeyQuery && answerKeyQuery.trim()) {
        const dbKey = new Database(':memory:');
        if (initSchemaSql) dbKey.exec(initSchemaSql);
        dbKey.exec(answerKeyQuery);

        const tablesKey = dbKey
          .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
          .all();
        for (const table of tablesKey as any[]) {
          const columns = dbKey
            .prepare(`PRAGMA table_info(${table.name})`)
            .all()
            .map((c: any) => ({
              name: String(c.name).toLowerCase(),
              type: String(c.type || '').toUpperCase(),
              pk: Boolean(c.pk),
            }));
          const rows = dbKey.prepare(`SELECT * FROM ${table.name}`).all();
          stateKey[String(table.name).toLowerCase()] = { columns, rows };
        }
        dbKey.close();
      }

      const dbStudent = new Database(':memory:');
      if (initSchemaSql) dbStudent.exec(initSchemaSql);
      dbStudent.exec(studentQuery);

      const tablesStudent = dbStudent
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        .all();
      const stateStudent: Record<string, { columns: any[]; rows: any[] }> = {};
      for (const table of tablesStudent as any[]) {
        const columns = dbStudent
          .prepare(`PRAGMA table_info(${table.name})`)
          .all()
          .map((c: any) => ({
            name: String(c.name).toLowerCase(),
            type: String(c.type || '').toUpperCase(),
            pk: Boolean(c.pk),
          }));
        const rows = dbStudent.prepare(`SELECT * FROM ${table.name}`).all();
        stateStudent[String(table.name).toLowerCase()] = { columns, rows };
      }
      dbStudent.close();

      let isCorrect = Object.keys(stateKey).length > 0;
      for (const tName of Object.keys(stateKey)) {
        const stTbl = stateStudent[tName];
        const keyTbl = stateKey[tName];
        if (!stTbl || stTbl.columns.length !== keyTbl.columns.length) {
          isCorrect = false;
          break;
        }
        for (let i = 0; i < keyTbl.columns.length; i++) {
          const kc = keyTbl.columns[i];
          const sc = stTbl.columns[i];
          if (
            sc.name !== kc.name ||
            !isDdlColumnTypeMatch(sc.type, kc.type) ||
            Boolean(sc.pk) !== Boolean(kc.pk)
          ) {
            isCorrect = false;
            break;
          }
        }
        if (!isCorrect) break;
        if (
          JSON.stringify(normalizeRowObjects(stTbl.rows)) !==
          JSON.stringify(normalizeRowObjects(keyTbl.rows))
        ) {
          isCorrect = false;
          break;
        }
      }

      return {
        success: true,
        isCorrect,
        resultType: 'schema',
        executionTimeMs: Math.max(1, Date.now() - startTime),
        expectedResult: stateKey,
        studentResult: stateStudent,
        message: isCorrect
          ? 'Jawaban Benar! Hasil manipulasi database sesuai.'
          : 'Struktur atau isi database tidak sama dengan kunci jawaban.',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      isCorrect: false,
      executionTimeMs: Math.max(1, Date.now() - startTime),
      message: `Error Database: ${error.message}`,
    };
  }
}
