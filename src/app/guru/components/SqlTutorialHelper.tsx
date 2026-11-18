"use client";

import React, { useState } from 'react';
import Swal from 'sweetalert2';

export type SqlQueryCategory = 'DQL' | 'DML' | 'DDL';

export interface SqlTemplatePayload {
  queryType: SqlQueryCategory;
  instruction: string;
  targetTable: string;
  tables: any[];
  answerTables: any[];
  sqlAnswerKey: string;
}

export function generateAnswerKeySqlPreview(q: any): string {
  if (!q) return '-- Belum ada kunci jawaban --';
  const queryType: SqlQueryCategory =
    q.queryType === 'DML' ? 'DML' : q.queryType === 'DDL' ? 'DDL' : 'DQL';
  const initTables = (q.tables || []).filter(
    (t: any) => t && t.name && (t.columns || []).some((c: any) => c.name)
  );
  const ansTables = (q.answerTables || []).filter(
    (t: any) => t && (t.name || (t.columns || []).some((c: any) => c.name))
  );

  if (ansTables.length === 0) {
    return q.sqlAnswerKey || '-- Belum ada Tabel Kunci Jawaban --';
  }

  const formatSqlVal = (val: any, colType: string = 'VARCHAR') => {
    if (val === undefined || val === null || val === '') return 'NULL';
    const upperType = (colType || '').toUpperCase();
    if (
      (upperType.includes('INT') || upperType.includes('BOOLEAN')) &&
      !isNaN(Number(val))
    ) {
      return String(val);
    }
    return `'${String(val).replace(/'/g, "''")}'`;
  };

  // 1. KATEGORI DDL (CREATE TABLE)
  if (queryType === 'DDL') {
    let ddlSql = '';
    ansTables.forEach((t: any) => {
      const tName = t.name || q.targetTable || 'nama_tabel';
      const validCols = (t.columns || []).filter((c: any) => c.name);
      if (validCols.length === 0) return;

      const colDefs = validCols.map((c: any) => {
        if (c.ai) {
          return `${c.name} INTEGER PRIMARY KEY AUTOINCREMENT`;
        }
        let def = `${c.name} ${c.type || 'VARCHAR'}`;
        if (
          c.length &&
          !['DATE', 'DATETIME', 'BOOLEAN', 'TEXT'].includes(c.type)
        ) {
          def += `(${c.length})`;
        }
        if (c.pk) def += ' PRIMARY KEY';
        return def;
      });
      ddlSql += `CREATE TABLE ${tName} (${colDefs.join(', ')});\n`;
    });
    return ddlSql.trim() || '-- Lengkapi nama tabel dan kolom pada Tabel Kunci Jawaban --';
  }

  // 2. KATEGORI DQL (SELECT)
  if (queryType === 'DQL') {
    const ansTbl = ansTables[0];
    const initTbl = initTables[0];
    const tableName = ansTbl?.name || initTbl?.name || q.targetTable || 'nama_tabel';
    const validAnsCols = (ansTbl?.columns || []).filter((c: any) => c.name);
    if (validAnsCols.length === 0) {
      return '-- Tambahkan minimal 1 kolom pada Tabel Kunci Jawaban --';
    }

    const colNames = validAnsCols.map((c: any) => c.name).join(', ');
    let whereClause = '';

    // Deteksi otomatis klausa WHERE jika ada tabel awal dan baris hasil merupakan subset
    const initRows = initTbl?.rows || [];
    const ansRows = ansTbl?.rows || [];
    const validInitCols = (initTbl?.columns || []).filter((c: any) => c.name);

    if (initRows.length > 0 && ansRows.length > 0 && ansRows.length < initRows.length) {
      // Cari apakah semua baris di ansRows memiliki nilai yang sama pada salah satu kolom
      for (const ansCol of validAnsCols) {
        const firstVal = ansRows[0][ansCol.id];
        if (firstVal === undefined || firstVal === '') continue;
        const allSameInAns = ansRows.every(
          (r: any) => String(r[ansCol.id]).trim() === String(firstVal).trim()
        );
        if (allSameInAns) {
          const initCol = validInitCols.find(
            (ic: any) => ic.name.toLowerCase() === ansCol.name.toLowerCase()
          );
          if (initCol) {
            const matchingInitCount = initRows.filter(
              (ir: any) => String(ir[initCol.id]).trim() === String(firstVal).trim()
            ).length;
            if (matchingInitCount === ansRows.length) {
              whereClause = ` WHERE ${ansCol.name} = ${formatSqlVal(firstVal, ansCol.type)}`;
              break;
            }
          }
        }
      }
    }

    return `SELECT ${colNames} FROM ${tableName}${whereClause};`;
  }

  // 3. KATEGORI DML (INSERT / UPDATE / DELETE)
  const ansTbl = ansTables[0];
  const initTbl = initTables.find(
    (t: any) => t.name && ansTbl?.name && t.name.toLowerCase() === ansTbl.name.toLowerCase()
  ) || initTables[0];

  const tableName = ansTbl?.name || initTbl?.name || q.targetTable || 'nama_tabel';
  const validAnsCols = (ansTbl?.columns || []).filter((c: any) => c.name);
  if (validAnsCols.length === 0) {
    return '-- Tambahkan kolom dan baris hasil pada Tabel Kunci Jawaban --';
  }

  const initRows = initTbl?.rows || [];
  const ansRows = ansTbl?.rows || [];
  const validInitCols = (initTbl?.columns || []).filter((c: any) => c.name);

  const rowToNameMap = (row: any, cols: any[]) => {
    const obj: Record<string, { val: any; type: string }> = {};
    cols.forEach((c: any) => {
      obj[c.name] = { val: row[c.id], type: c.type || 'VARCHAR' };
    });
    return obj;
  };

  const initMapped = initRows.map((r: any) => rowToNameMap(r, validInitCols.length ? validInitCols : validAnsCols));
  const ansMapped = ansRows.map((r: any) => rowToNameMap(r, validAnsCols));

  const serializeRow = (m: Record<string, { val: any; type: string }>) =>
    JSON.stringify(
      Object.keys(m).reduce((acc: any, k) => {
        acc[k.toLowerCase()] = String(m[k]?.val ?? '').trim();
        return acc;
      }, {})
    );

  // Kasus INSERT: baris di Tabel Kunci Jawaban lebih banyak dari Skema Awal
  if (ansMapped.length > initMapped.length) {
    const initSet = new Set(initMapped.map(serializeRow));
    const newRows = ansMapped.filter((m: any) => !initSet.has(serializeRow(m)));
    const targetRows = newRows.length > 0 ? newRows : [ansMapped[ansMapped.length - 1]];
    const statements = targetRows.map((m: any) => {
      const colNames = validAnsCols.map((c: any) => c.name).join(', ');
      const vals = validAnsCols
        .map((c: any) => formatSqlVal(m[c.name]?.val, c.type))
        .join(', ');
      return `INSERT INTO ${tableName} (${colNames}) VALUES (${vals});`;
    });
    return statements.join('\n');
  }

  // Kasus DELETE: baris di Tabel Kunci Jawaban lebih sedikit dari Skema Awal
  if (ansMapped.length < initMapped.length && initMapped.length > 0) {
    const ansSet = new Set(ansMapped.map(serializeRow));
    const deletedRows = initMapped.filter((m: any) => !ansSet.has(serializeRow(m)));
    const pkCol =
      validAnsCols.find((c: any) => c.pk) || validAnsCols[0];
    if (deletedRows.length > 0 && pkCol) {
      return deletedRows
        .map(
          (m: any) =>
            `DELETE FROM ${tableName} WHERE ${pkCol.name} = ${formatSqlVal(m[pkCol.name]?.val, pkCol.type)};`
        )
        .join('\n');
    }
    return `DELETE FROM ${tableName};`;
  }

  // Kasus UPDATE: jumlah baris sama tapi ada nilai sel yang berubah
  if (ansMapped.length === initMapped.length && ansMapped.length > 0) {
    const pkCol = validAnsCols.find((c: any) => c.pk) || validAnsCols[0];
    const updates: string[] = [];
    for (let i = 0; i < ansMapped.length; i++) {
      const initR = initMapped[i];
      const ansR = ansMapped[i];
      const changedCols = validAnsCols.filter(
        (c: any) => String(initR[c.name]?.val ?? '') !== String(ansR[c.name]?.val ?? '')
      );
      if (changedCols.length > 0 && pkCol) {
        const setPart = changedCols
          .map((c: any) => `${c.name} = ${formatSqlVal(ansR[c.name]?.val, c.type)}`)
          .join(', ');
        const whereVal = formatSqlVal(initR[pkCol.name]?.val ?? ansR[pkCol.name]?.val, pkCol.type);
        updates.push(`UPDATE ${tableName} SET ${setPart} WHERE ${pkCol.name} = ${whereVal};`);
      }
    }
    if (updates.length > 0) {
      return updates.join('\n');
    }
  }

  // Default DML jika belum ada perubahan dibanding tabel awal
  if (ansMapped.length > 0) {
    const lastRow = ansMapped[ansMapped.length - 1];
    const colNames = validAnsCols.map((c: any) => c.name).join(', ');
    const vals = validAnsCols
      .map((c: any) => formatSqlVal(lastRow[c.name]?.val, c.type))
      .join(', ');
    return `INSERT INTO ${tableName} (${colNames}) VALUES (${vals});`;
  }

  return '-- Lengkapi baris data pada Tabel Kunci Jawaban --';
}

export const SQL_QUESTION_TEMPLATES: Record<SqlQueryCategory, SqlTemplatePayload> = {
  DQL: {
    queryType: 'DQL',
    instruction:
      '<p>Tampilkan kolom <strong>nama</strong>, <strong>jurusan</strong>, dan <strong>ipk</strong> dari tabel <code>mahasiswa</code> khusus untuk mahasiswa yang berasal dari jurusan <strong>\'Informatika\'</strong>.</p>',
    targetTable: 'mahasiswa',
    tables: [
      {
        id: 'tbl_tpl_dql_init',
        name: 'mahasiswa',
        columns: [
          { id: 'c_nim', name: 'nim', type: 'VARCHAR', length: '15', pk: true, ai: false },
          { id: 'c_nama', name: 'nama', type: 'VARCHAR', length: '100', pk: false, ai: false },
          { id: 'c_jurusan', name: 'jurusan', type: 'VARCHAR', length: '50', pk: false, ai: false },
          { id: 'c_ipk', name: 'ipk', type: 'TEXT', length: '', pk: false, ai: false },
        ],
        rows: [
          { c_nim: '202401', c_nama: 'Budi Santoso', c_jurusan: 'Informatika', c_ipk: '3.75' },
          { c_nim: '202402', c_nama: 'Siti Aminah', c_jurusan: 'Sistem Informasi', c_ipk: '3.60' },
          { c_nim: '202403', c_nama: 'Rizky Pratama', c_jurusan: 'Informatika', c_ipk: '3.85' },
        ],
      },
    ],
    answerTables: [
      {
        id: 'tbl_tpl_dql_ans',
        name: 'mahasiswa',
        columns: [
          { id: 'c_nama', name: 'nama', type: 'VARCHAR', length: '100', pk: false, ai: false },
          { id: 'c_jurusan', name: 'jurusan', type: 'VARCHAR', length: '50', pk: false, ai: false },
          { id: 'c_ipk', name: 'ipk', type: 'TEXT', length: '', pk: false, ai: false },
        ],
        rows: [
          { c_nama: 'Budi Santoso', c_jurusan: 'Informatika', c_ipk: '3.75' },
          { c_nama: 'Rizky Pratama', c_jurusan: 'Informatika', c_ipk: '3.85' },
        ],
      },
    ],
    sqlAnswerKey: "SELECT nama, jurusan, ipk FROM mahasiswa WHERE jurusan = 'Informatika';",
  },
  DML: {
    queryType: 'DML',
    instruction:
      '<p>Tambahkan 1 baris data baru ke dalam tabel <code>produk</code> dengan ketentuan nilai:</p><ul><li><code>id_produk</code>: <strong>3</strong></li><li><code>nama_produk</code>: <strong>\'Mouse Wireless\'</strong></li><li><code>harga</code>: <strong>150000</strong></li></ul>',
    targetTable: 'produk',
    tables: [
      {
        id: 'tbl_tpl_dml_init',
        name: 'produk',
        columns: [
          { id: 'c_id', name: 'id_produk', type: 'INT', length: '11', pk: true, ai: false },
          { id: 'c_nama', name: 'nama_produk', type: 'VARCHAR', length: '100', pk: false, ai: false },
          { id: 'c_harga', name: 'harga', type: 'INT', length: '11', pk: false, ai: false },
        ],
        rows: [
          { c_id: '1', c_nama: 'Keyboard Mekanik', c_harga: '350000' },
          { c_id: '2', c_nama: 'Monitor 24 Inch', c_harga: '1850000' },
        ],
      },
    ],
    answerTables: [
      {
        id: 'tbl_tpl_dml_ans',
        name: 'produk',
        columns: [
          { id: 'c_id', name: 'id_produk', type: 'INT', length: '11', pk: true, ai: false },
          { id: 'c_nama', name: 'nama_produk', type: 'VARCHAR', length: '100', pk: false, ai: false },
          { id: 'c_harga', name: 'harga', type: 'INT', length: '11', pk: false, ai: false },
        ],
        rows: [
          { c_id: '1', c_nama: 'Keyboard Mekanik', c_harga: '350000' },
          { c_id: '2', c_nama: 'Monitor 24 Inch', c_harga: '1850000' },
          { c_id: '3', c_nama: 'Mouse Wireless', c_harga: '150000' },
        ],
      },
    ],
    sqlAnswerKey: "INSERT INTO produk (id_produk, nama_produk, harga) VALUES (3, 'Mouse Wireless', 150000);",
  },
  DDL: {
    queryType: 'DDL',
    instruction:
      '<p>Buatlah sebuah tabel baru bernama <code>dosen</code> dengan struktur kolom berikut:</p><ul><li><code>nidn</code> bertipe <strong>INT</strong> sebagai <strong>PRIMARY KEY</strong></li><li><code>nama_dosen</code> bertipe <strong>VARCHAR(100)</strong></li><li><code>bidang_keahlian</code> bertipe <strong>VARCHAR(50)</strong></li></ul>',
    targetTable: 'dosen',
    tables: [],
    answerTables: [
      {
        id: 'tbl_tpl_ddl_ans',
        name: 'dosen',
        columns: [
          { id: 'c_nidn', name: 'nidn', type: 'INT', length: '11', pk: true, ai: false },
          { id: 'c_nama', name: 'nama_dosen', type: 'VARCHAR', length: '100', pk: false, ai: false },
          { id: 'c_bidang', name: 'bidang_keahlian', type: 'VARCHAR', length: '50', pk: false, ai: false },
        ],
        rows: [],
      },
    ],
    sqlAnswerKey: 'CREATE TABLE dosen (nidn INT(11) PRIMARY KEY, nama_dosen VARCHAR(100), bidang_keahlian VARCHAR(50));',
  },
};

export function formatTestRunResultHtml(expectedResult: any): string {
  let resultHtml = '<div class="bg-slate-900 text-green-400 p-4 rounded-sm text-left font-mono text-xs overflow-x-auto mt-3 space-y-4">';

  if (Array.isArray(expectedResult)) {
    if (expectedResult.length > 0) {
      const cols = Object.keys(expectedResult[0]);
      resultHtml += '<div class="text-[11px] text-slate-400 mb-2">Tabel Hasil Kunci Jawaban (' + expectedResult.length + ' baris):</div>';
      resultHtml += '<table class="w-full text-left border-collapse"><thead><tr>';
      cols.forEach((c) => (resultHtml += `<th class="border-b border-slate-700 pb-2 pr-4 text-blue-300">${c}</th>`));
      resultHtml += '</tr></thead><tbody>';
      expectedResult.forEach((row: any) => {
        resultHtml += '<tr>';
        cols.forEach((c) => (resultHtml += `<td class="py-1 pr-4 whitespace-nowrap border-b border-slate-800/60">${row[c] !== null ? row[c] : 'NULL'}</td>`));
        resultHtml += '</tr>';
      });
      resultHtml += '</tbody></table>';
    } else {
      resultHtml += '<div>Empty set (0 rows returned)</div>';
    }
  } else if (expectedResult && typeof expectedResult === 'object') {
    const tableNames = Object.keys(expectedResult);
    if (tableNames.length === 0) {
      resultHtml += '<div>Tidak ada tabel di dalam database setelah eksekusi (0 tabel).</div>';
    } else {
      resultHtml += `<div class="text-[11px] text-slate-400 mb-2">Status Akhir Database Kunci Jawaban (${tableNames.length} tabel):</div>`;
      tableNames.forEach((tName) => {
        const tData = expectedResult[tName];
        const cols = tData?.columns || [];
        const rows = tData?.rows || [];
        resultHtml += `<div class="border border-slate-700 rounded-sm p-3 mb-3 bg-slate-950/60">`;
        resultHtml += `<div class="font-bold text-blue-300 mb-1.5">Tabel: ${tName}</div>`;
        if (cols.length > 0) {
          const colSummary = cols
            .map((c: any) => `${c.name} <span class="text-slate-400">(${c.type}${c.pk ? ', PK' : ''})</span>`)
            .join(', ');
          resultHtml += `<div class="text-[11px] text-slate-300 mb-2">Kolom: ${colSummary}</div>`;
        }
        if (rows.length > 0) {
          const rowCols = Object.keys(rows[0]);
          resultHtml += '<table class="w-full text-left border-collapse mt-1"><thead><tr>';
          rowCols.forEach((rc) => (resultHtml += `<th class="border-b border-slate-700 pb-1 pr-3 text-slate-300">${rc}</th>`));
          resultHtml += '</tr></thead><tbody>';
          rows.forEach((r: any) => {
            resultHtml += '<tr>';
            rowCols.forEach((rc) => (resultHtml += `<td class="py-1 pr-3 whitespace-nowrap">${r[rc] !== null ? r[rc] : 'NULL'}</td>`));
            resultHtml += '</tr>';
          });
          resultHtml += '</tbody></table>';
        } else {
          resultHtml += `<div class="text-[11px] text-slate-500 italic">Isi data: 0 baris (hanya struktur tabel)</div>`;
        }
        resultHtml += `</div>`;
      });
    }
  }

  resultHtml += '</div>';
  return resultHtml;
}

export function AnswerTableBuilder({
  question,
  initSchemaSql,
  onMutateQuestion,
}: {
  question: any;
  initSchemaSql: string;
  onMutateQuestion: (updater: (qTarget: any) => void) => void;
}) {
  const answerTables: any[] = question.answerTables || [];
  const previewSql = generateAnswerKeySqlPreview(question);

  const syncAnswerKey = (qTarget: any) => {
    qTarget.sqlAnswerKey = generateAnswerKeySqlPreview(qTarget);
  };

  const copyFromInitialSchema = () => {
    if (!question.tables || question.tables.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Skema Awal Kosong',
        text: 'Belum ada tabel di Skema Database Awal untuk disalin.',
        confirmButtonColor: '#2196F3',
      });
      return;
    }
    onMutateQuestion((qTarget) => {
      qTarget.answerTables = JSON.parse(JSON.stringify(qTarget.tables || []));
      syncAnswerKey(qTarget);
    });
  };

  const handleTestRun = async () => {
    const generatedSql = generateAnswerKeySqlPreview(question);
    if (!answerTables || answerTables.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Tabel Kunci Jawaban Kosong',
        text: 'Silakan buat atau salin tabel pada bagian Tabel Kunci Jawaban terlebih dahulu.',
        confirmButtonColor: '#2196F3',
      });
      return;
    }

    Swal.fire({
      title: 'Memvalidasi Tabel Kunci Jawaban...',
      text: 'Mengeksekusi di database bayangan...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch('/api/latihan-soal/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentQuery: generatedSql,
          answerKeyQuery: generatedSql,
          initSchemaSql,
          answerTables,
          queryType: question.queryType || 'DQL',
        }),
      });
      const data = await res.json();
      if (data.success) {
        const resultHtml = formatTestRunResultHtml(data.expectedResult);
        Swal.fire({
          title: 'Pratinjau Tabel Kunci Jawaban',
          html: resultHtml,
          width: '640px',
          confirmButtonColor: '#2196F3',
          confirmButtonText: 'Tutup',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Validasi Error',
          text: data.error || data.message,
          confirmButtonColor: '#F44336',
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: err.message,
        confirmButtonColor: '#F44336',
      });
    }
  };

  return (
    <div className="mt-6 border-t border-slate-200 pt-6 space-y-4">
      <div className="border border-blue-200 rounded-md p-4 bg-blue-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              Tabel Kunci Jawaban (Hasil yang Diharapkan)
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-100 text-[#0D47A1] rounded-sm">
                Acuan Auto-Grader
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Susun bentuk tabel &amp; isi baris data hasil akhir yang benar. Sistem akan mencocokkan hasil eksekusi query siswa dengan tabel ini.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {question.tables && question.tables.length > 0 && (
              <button
                type="button"
                onClick={copyFromInitialSchema}
                className="px-3 py-1.5 bg-white border border-blue-300 rounded text-xs font-semibold text-[#2196F3] hover:bg-blue-50 flex items-center gap-1.5 shadow-sm transition-colors"
                title="Salin struktur & isi dari Skema Database Awal lalu sesuaikan hasilnya"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Salin dari Skema Awal
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onMutateQuestion((qTarget) => {
                  if (!qTarget.answerTables) qTarget.answerTables = [];
                  qTarget.answerTables.push({
                    id: `ans_tbl_${Date.now()}`,
                    name: qTarget.targetTable || qTarget.tables?.[0]?.name || '',
                    columns: [
                      {
                        id: `ans_col_${Date.now()}`,
                        name: '',
                        type: 'VARCHAR',
                        length: '255',
                        pk: false,
                        ai: false,
                      },
                    ],
                    rows: [],
                  });
                  syncAnswerKey(qTarget);
                });
              }}
              className="px-3 py-1.5 bg-[#2196F3] text-white rounded text-xs font-semibold hover:bg-[#1976D2] flex items-center gap-1 shadow-sm transition-colors"
            >
              + Tambah Tabel Kunci
            </button>
          </div>
        </div>

        {answerTables.length > 0 ? (
          <div className="space-y-4">
            {answerTables.map((tbl: any, tIdx: number) => (
              <div
                key={tbl.id || tIdx}
                className="border border-slate-300 bg-white rounded-md overflow-hidden shadow-sm"
              >
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-300 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-700">Nama Tabel Hasil:</span>
                    <input
                      type="text"
                      value={tbl.name || ''}
                      onChange={(e) => {
                        onMutateQuestion((qTarget) => {
                          qTarget.answerTables[tIdx].name = e.target.value;
                          syncAnswerKey(qTarget);
                        });
                      }}
                      className="border border-slate-300 px-3 py-1 text-sm rounded w-60 focus:outline-none focus:border-blue-500 bg-white"
                      placeholder="e.g. mahasiswa"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onMutateQuestion((qTarget) => {
                        qTarget.answerTables.splice(tIdx, 1);
                        syncAnswerKey(qTarget);
                      });
                    }}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Hapus Tabel Kunci Ini"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Kolom Tabel Kunci Jawaban */}
                <div className="overflow-x-auto p-4">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-300 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Nama Kolom Hasil</th>
                        <th className="px-3 py-2 font-semibold border-l border-slate-300">Jenis (Type)</th>
                        <th className="px-3 py-2 font-semibold border-l border-slate-300">Panjang/Nilai</th>
                        <th className="px-3 py-2 font-semibold border-l border-slate-300 text-center">A_I</th>
                        <th className="px-3 py-2 font-semibold border-l border-slate-300 text-center">Primary</th>
                        <th className="px-3 py-2 font-semibold border-l border-slate-300"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {tbl.columns &&
                        tbl.columns.map((col: any, cIdx: number) => (
                          <tr key={col.id || cIdx} className="hover:bg-slate-50">
                            <td className="px-2 py-1.5">
                              <input
                                type="text"
                                value={col.name || ''}
                                onChange={(e) => {
                                  onMutateQuestion((qTarget) => {
                                    qTarget.answerTables[tIdx].columns[cIdx].name = e.target.value;
                                    syncAnswerKey(qTarget);
                                  });
                                }}
                                placeholder="Nama kolom..."
                                className="w-36 px-2 py-1 border border-slate-300 rounded-sm text-xs"
                              />
                            </td>
                            <td className="px-2 py-1.5 border-l border-slate-200">
                              <select
                                value={col.type || 'VARCHAR'}
                                onChange={(e) => {
                                  onMutateQuestion((qTarget) => {
                                    qTarget.answerTables[tIdx].columns[cIdx].type = e.target.value;
                                    syncAnswerKey(qTarget);
                                  });
                                }}
                                className="w-28 px-1 py-1 border border-slate-300 rounded-sm text-xs bg-white"
                              >
                                <option value="INT">INT</option>
                                <option value="VARCHAR">VARCHAR</option>
                                <option value="TEXT">TEXT</option>
                                <option value="DATE">DATE</option>
                                <option value="DATETIME">DATETIME</option>
                                <option value="BOOLEAN">BOOLEAN</option>
                              </select>
                            </td>
                            <td className="px-2 py-1.5 border-l border-slate-200">
                              <input
                                type="text"
                                value={col.length || ''}
                                onChange={(e) => {
                                  onMutateQuestion((qTarget) => {
                                    qTarget.answerTables[tIdx].columns[cIdx].length = e.target.value;
                                    syncAnswerKey(qTarget);
                                  });
                                }}
                                className="w-20 px-2 py-1 border border-slate-300 rounded-sm text-xs"
                                placeholder="e.g. 100"
                              />
                            </td>
                            <td className="px-2 py-1.5 border-l border-slate-200 text-center">
                              <input
                                type="checkbox"
                                checked={Boolean(col.ai)}
                                onChange={(e) => {
                                  onMutateQuestion((qTarget) => {
                                    qTarget.answerTables[tIdx].columns[cIdx].ai = e.target.checked;
                                    syncAnswerKey(qTarget);
                                  });
                                }}
                                className="w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="px-2 py-1.5 border-l border-slate-200 text-center">
                              <input
                                type="checkbox"
                                checked={Boolean(col.pk)}
                                onChange={(e) => {
                                  onMutateQuestion((qTarget) => {
                                    qTarget.answerTables[tIdx].columns[cIdx].pk = e.target.checked;
                                    syncAnswerKey(qTarget);
                                  });
                                }}
                                className="w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="px-2 py-1.5 border-l border-slate-200 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  onMutateQuestion((qTarget) => {
                                    qTarget.answerTables[tIdx].columns.splice(cIdx, 1);
                                    syncAnswerKey(qTarget);
                                  });
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Hapus Kolom Hasil Ini"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  <button
                    type="button"
                    onClick={() => {
                      onMutateQuestion((qTarget) => {
                        if (!qTarget.answerTables[tIdx].columns) qTarget.answerTables[tIdx].columns = [];
                        qTarget.answerTables[tIdx].columns.push({
                          id: `ans_col_${Date.now()}`,
                          name: '',
                          type: 'VARCHAR',
                          length: '255',
                          pk: false,
                          ai: false,
                        });
                        syncAnswerKey(qTarget);
                      });
                    }}
                    className="mt-3 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-sm flex items-center gap-1 transition-colors"
                  >
                    + Tambah Kolom Hasil
                  </button>
                </div>

                {/* Baris Data Hasil yang Diharapkan */}
                <div className="bg-slate-50 border-t border-slate-200 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-700">
                      Isi Baris Data Hasil Kunci Jawaban {question.queryType === 'DDL' ? '(Opsional untuk DDL)' : '(Wajib untuk DQL/DML)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onMutateQuestion((qTarget) => {
                          if (!qTarget.answerTables[tIdx].rows) qTarget.answerTables[tIdx].rows = [];
                          qTarget.answerTables[tIdx].rows.push({});
                          syncAnswerKey(qTarget);
                        });
                      }}
                      className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-sm hover:bg-blue-100 transition-colors"
                    >
                      + Tambah Baris Hasil
                    </button>
                  </div>

                  {tbl.rows && tbl.rows.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-200 rounded-sm">
                      <table className="w-full text-left text-xs whitespace-nowrap bg-white">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-600">
                          <tr>
                            <th className="px-2 py-1.5 w-8 text-center border-r border-slate-200">#</th>
                            {tbl.columns &&
                              tbl.columns.map((c: any) => (
                                <th key={c.id} className="px-2.5 py-1.5 font-semibold border-r border-slate-200">
                                  {c.name || '...'}
                                </th>
                              ))}
                            <th className="px-2 py-1.5 w-8 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tbl.rows.map((row: any, rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-slate-50">
                              <td className="px-2 py-1 border-r border-slate-200 text-center text-slate-400">
                                {rIdx + 1}
                              </td>
                              {tbl.columns &&
                                tbl.columns.map((c: any) => (
                                  <td key={c.id} className="px-1.5 py-1 border-r border-slate-200">
                                    <input
                                      type="text"
                                      value={row[c.id] || ''}
                                      onChange={(e) => {
                                        onMutateQuestion((qTarget) => {
                                          qTarget.answerTables[tIdx].rows[rIdx][c.id] = e.target.value;
                                          syncAnswerKey(qTarget);
                                        });
                                      }}
                                      className="w-full px-2 py-1 border border-transparent focus:border-blue-300 focus:bg-white bg-slate-50 rounded-sm text-xs outline-none"
                                      placeholder={`Nilai ${c.name || 'kolom'}`}
                                    />
                                  </td>
                                ))}
                              <td className="px-2 py-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onMutateQuestion((qTarget) => {
                                      qTarget.answerTables[tIdx].rows.splice(rIdx, 1);
                                      syncAnswerKey(qTarget);
                                    });
                                  }}
                                  className="text-red-400 hover:text-red-600"
                                  title="Hapus Baris Hasil Ini"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Belum ada baris data hasil. Klik &quot;+ Tambah Baris Hasil&quot; atau &quot;Salin dari Skema Awal&quot;.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-white border border-slate-200 rounded-md shadow-sm">
            <p className="text-sm text-slate-600 font-medium">Belum ada Tabel Kunci Jawaban.</p>
            <p className="text-xs text-slate-400 mt-1">
              Klik tombol <strong>&quot;Salin dari Skema Awal&quot;</strong> atau <strong>&quot;+ Tambah Tabel Kunci&quot;</strong> di atas untuk menentukan tabel hasil yang benar.
            </p>
          </div>
        )}
      </div>

      {/* PREVIEW QUERY SQL KUNCI JAWABAN (AUTO-GENERATED) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div>
            <label className="block text-xs font-bold text-slate-800">
              Preview Query SQL Kunci Jawaban (Auto-Generated)
            </label>
            <p className="text-[11px] text-slate-500">
              Query SQL di bawah ini di-generate otomatis dari perbandingan Skema Awal dan Tabel Kunci Jawaban di atas.
            </p>
          </div>
          <button
            type="button"
            onClick={handleTestRun}
            className="text-xs font-semibold text-white bg-[#4CAF50] hover:bg-[#388E3C] px-3 py-1.5 rounded-sm transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Test Run Kunci Jawaban
          </button>
        </div>
        <pre className="w-full px-4 py-3 border border-slate-700 rounded-sm font-mono text-xs bg-slate-900 text-green-400 overflow-x-auto whitespace-pre-wrap">
          {previewSql}
        </pre>
      </div>
    </div>
  );
}

export function SqlInlineGuide({
  queryType,
  onApplyTemplate,
  onOpenModal,
}: {
  queryType: string;
  onApplyTemplate: (template: SqlTemplatePayload) => void;
  onOpenModal: (initialTab?: 'alur' | 'DQL' | 'DML' | 'DDL') => void;
}) {
  const category: SqlQueryCategory =
    queryType === 'DML' ? 'DML' : queryType === 'DDL' ? 'DDL' : 'DQL';

  const handleApply = async () => {
    const confirm = await Swal.fire({
      title: `Terapkan Contoh Soal ${category}?`,
      text: 'Instruksi pertanyaan, skema tabel awal, dan Tabel Kunci Jawaban akan diisi otomatis dengan contoh ' + category + '.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2196F3',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Isi Contoh',
      cancelButtonText: 'Batal',
    });
    if (confirm.isConfirmed) {
      onApplyTemplate(JSON.parse(JSON.stringify(SQL_QUESTION_TEMPLATES[category])));
    }
  };

  return (
    <div className="bg-blue-50/60 border border-blue-200 rounded-sm p-3.5 text-xs text-slate-700 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-[#0D47A1] text-white font-semibold rounded-sm text-[11px]">
            Panduan Cepat {category}
          </span>
          <span className="font-semibold text-slate-800">
            {category === 'DQL' && 'Cara Menyusun Tabel Kunci Jawaban DQL (SELECT)'}
            {category === 'DML' && 'Cara Menyusun Tabel Kunci Jawaban DML (INSERT / UPDATE / DELETE)'}
            {category === 'DDL' && 'Cara Menyusun Tabel Kunci Jawaban DDL (CREATE / ALTER)'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleApply}
            className="px-2.5 py-1 bg-white hover:bg-blue-50 text-[#2196F3] border border-blue-300 rounded-sm font-semibold text-[11px] transition-colors shadow-sm"
          >
            Isi Contoh Soal {category}
          </button>
          <button
            type="button"
            onClick={() => onOpenModal(category)}
            className="px-2.5 py-1 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-sm font-semibold text-[11px] transition-colors shadow-sm flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Tutorial Lengkap
          </button>
        </div>
      </div>

      {category === 'DQL' && (
        <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed">
          <li>
            <strong>Skema Database Awal:</strong> Buat tabel referensi beserta seluruh kolom dan baris data awalnya.
          </li>
          <li>
            <strong>Tabel Kunci Jawaban:</strong> Klik tombol <strong>&quot;Salin dari Skema Awal&quot;</strong>, lalu sisakan hanya kolom dan baris data yang seharusnya tampil dari hasil <code>SELECT</code> siswa. Query SQL di bawahnya akan terbentuk otomatis!
          </li>
        </ol>
      )}

      {category === 'DML' && (
        <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed">
          <li>
            <strong>Skema Database Awal:</strong> Buat tabel target beserta baris data awal sebelum dimanipulasi.
          </li>
          <li>
            <strong>Tabel Kunci Jawaban:</strong> Klik <strong>&quot;Salin dari Skema Awal&quot;</strong>, lalu tambahkan baris baru (untuk <code>INSERT</code>), ubah nilai sel (untuk <code>UPDATE</code>), atau hapus baris (untuk <code>DELETE</code>). Query SQL di bawahnya akan ter-generate otomatis!
          </li>
        </ol>
      )}

      {category === 'DDL' && (
        <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed">
          <li>
            <strong>Skema Database Awal:</strong> Kosongkan (hapus tabel) jika tugas siswa adalah membuat tabel baru (<code>CREATE TABLE</code>).
          </li>
          <li>
            <strong>Tabel Kunci Jawaban:</strong> Buat struktur tabel yang harus dibuat siswa (nama tabel, nama kolom, tipe data, dan Primary Key). Query <code>CREATE TABLE</code> di bawahnya akan ter-generate otomatis!
          </li>
        </ol>
      )}
    </div>
  );
}

export function SqlTutorialModal({
  isOpen,
  initialTab = 'alur',
  onClose,
  onApplyTemplate,
}: {
  isOpen: boolean;
  initialTab?: 'alur' | 'DQL' | 'DML' | 'DDL';
  onClose: () => void;
  onApplyTemplate?: (template: SqlTemplatePayload) => void;
}) {
  const [tab, setTab] = useState<'alur' | 'DQL' | 'DML' | 'DDL'>(initialTab);

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleUseTemplate = (cat: SqlQueryCategory) => {
    if (!onApplyTemplate) return;
    onApplyTemplate(JSON.parse(JSON.stringify(SQL_QUESTION_TEMPLATES[cat])));
    onClose();
    Swal.fire({
      icon: 'success',
      title: `Template ${cat} Diterapkan`,
      text: 'Contoh soal, Skema Awal, dan Tabel Kunci Jawaban berhasil diisi otomatis.',
      confirmButtonColor: '#2196F3',
      timer: 2000,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-sm border border-slate-200 shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#0D47A1] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold">Panduan &amp; Tutorial Pembuatan Soal Query SQL (DQL, DML, DDL)</h3>
            <p className="text-xs text-blue-200 mt-0.5">
              Guru cukup menyusun Tabel Kunci Jawaban (tanpa perlu menulis query manual)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-sm hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('alur')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              tab === 'alur' ? 'border-[#2196F3] text-[#2196F3] bg-white' : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            1. Konsep Tabel Kunci Jawaban
          </button>
          <button
            type="button"
            onClick={() => setTab('DQL')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              tab === 'DQL' ? 'border-[#2196F3] text-[#2196F3] bg-white' : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            2. Soal DQL (SELECT)
          </button>
          <button
            type="button"
            onClick={() => setTab('DML')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              tab === 'DML' ? 'border-[#2196F3] text-[#2196F3] bg-white' : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            3. Soal DML (INSERT / UPDATE / DELETE)
          </button>
          <button
            type="button"
            onClick={() => setTab('DDL')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              tab === 'DDL' ? 'border-[#2196F3] text-[#2196F3] bg-white' : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            4. Soal DDL (CREATE / ALTER)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-sm text-slate-700">
          {tab === 'alur' && (
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-sm p-4">
                <h4 className="font-semibold text-slate-800 mb-1">Mengapa Kunci Jawaban Berupa Tabel?</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Guru tidak perlu direpotkan menulis sintaks SQL kunci jawaban secara manual. Guru cukup menentukan <strong>Tabel Kunci Jawaban (Hasil yang Diharapkan)</strong>, dan sistem secara otomatis men-generate <strong>Preview Query SQL Kunci Jawaban</strong> di bawahnya serta menilai apakah hasil query siswa cocok dengan tabel kunci tersebut.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-sm p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#2196F3] text-white text-xs font-bold flex items-center justify-center">1</span>
                    <h5 className="font-semibold text-slate-800 text-sm">Buat Skema Database Awal</h5>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Susun tabel dan isi data awal yang menjadi soal referensi bagi siswa (khusus soal <code>CREATE TABLE</code> baru, biarkan Skema Awal kosong).
                  </p>
                </div>

                <div className="border border-slate-200 rounded-sm p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#2196F3] text-white text-xs font-bold flex items-center justify-center">2</span>
                    <h5 className="font-semibold text-slate-800 text-sm">Klik &quot;Salin dari Skema Awal&quot;</h5>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Pada bagian <strong>Tabel Kunci Jawaban</strong>, klik tombol <em>Salin dari Skema Awal</em> untuk menduplikasi tabel awal dengan 1 klik.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-sm p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#2196F3] text-white text-xs font-bold flex items-center justify-center">3</span>
                    <h5 className="font-semibold text-slate-800 text-sm">Sesuaikan Tabel Hasil Kunci</h5>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Hapus kolom/baris yang tidak termasuk hasil <code>SELECT</code> (untuk DQL), atau tambah/ubah/hapus baris (untuk DML).
                  </p>
                </div>

                <div className="border border-slate-200 rounded-sm p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#2196F3] text-white text-xs font-bold flex items-center justify-center">4</span>
                    <h5 className="font-semibold text-slate-800 text-sm">Preview Query SQL Otomatis</h5>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Kotak <strong>Preview Query SQL Kunci Jawaban</strong> di bawah tabel akan langsung menampilkan query SQL-nya secara otomatis!
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === 'DQL' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-[#0D47A1] rounded-sm">Kategori DQL</span>
                  <h4 className="font-bold text-slate-800 text-base mt-1">Cara Membuat Soal DQL (SELECT) dengan Tabel Kunci</h4>
                </div>
                {onApplyTemplate && (
                  <button
                    type="button"
                    onClick={() => handleUseTemplate('DQL')}
                    className="px-3.5 py-2 bg-[#2196F3] hover:bg-[#1976D2] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
                  >
                    Gunakan Contoh Soal DQL Ini
                  </button>
                )}
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <ol className="list-decimal list-inside space-y-2 bg-slate-50 p-4 border border-slate-200 rounded-sm">
                  <li>
                    Pada <strong>Skema Database Awal</strong>, buat tabel <code>mahasiswa</code> dengan 4 kolom (<code>nim</code>, <code>nama</code>, <code>jurusan</code>, <code>ipk</code>) dan 3 baris data (2 mahasiswa Informatika, 1 Sistem Informasi).
                  </li>
                  <li>
                    Pada <strong>Tabel Kunci Jawaban</strong>, klik tombol <strong>&quot;Salin dari Skema Awal&quot;</strong>.
                  </li>
                  <li>
                    Karena soal hanya meminta kolom <code>nama</code>, <code>jurusan</code>, <code>ipk</code> untuk jurusan <code>Informatika</code>, hapus kolom <code>nim</code> dan hapus baris mahasiswa <code>Sistem Informasi</code> pada <strong>Tabel Kunci Jawaban</strong>.
                  </li>
                  <li>
                    Kotak <strong>Preview Query SQL</strong> di bawahnya akan otomatis menghasilkan:
                    <pre className="mt-2 bg-slate-900 text-green-400 p-2.5 rounded-sm font-mono">
                      SELECT nama, jurusan, ipk FROM mahasiswa WHERE jurusan = &apos;Informatika&apos;;
                    </pre>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {tab === 'DML' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-sm">Kategori DML</span>
                  <h4 className="font-bold text-slate-800 text-base mt-1">Cara Membuat Soal DML (INSERT / UPDATE / DELETE) dengan Tabel Kunci</h4>
                </div>
                {onApplyTemplate && (
                  <button
                    type="button"
                    onClick={() => handleUseTemplate('DML')}
                    className="px-3.5 py-2 bg-[#2196F3] hover:bg-[#1976D2] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
                  >
                    Gunakan Contoh Soal DML Ini
                  </button>
                )}
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <ol className="list-decimal list-inside space-y-2 bg-slate-50 p-4 border border-slate-200 rounded-sm">
                  <li>
                    Pada <strong>Skema Database Awal</strong>, buat tabel <code>produk</code> dengan 2 baris data awal (ID 1 dan ID 2).
                  </li>
                  <li>
                    Pada <strong>Tabel Kunci Jawaban</strong>, klik tombol <strong>&quot;Salin dari Skema Awal&quot;</strong>.
                  </li>
                  <li>
                    Sesuaikan isi baris pada <strong>Tabel Kunci Jawaban</strong>:
                    <ul className="list-disc list-inside pl-5 mt-1 space-y-1">
                      <li><strong>Untuk Soal INSERT:</strong> Klik <code>+ Tambah Baris Hasil</code> lalu isi baris ke-3 (<code>3, Mouse Wireless, 150000</code>).</li>
                      <li><strong>Untuk Soal UPDATE:</strong> Ubah langsung nilai sel pada baris yang ingin di-update.</li>
                      <li><strong>Untuk Soal DELETE:</strong> Hapus baris yang diminta untuk dihapus pada Tabel Kunci Jawaban.</li>
                    </ul>
                  </li>
                  <li>
                    Kotak <strong>Preview Query SQL</strong> akan otomatis menampilkan query <code>INSERT</code>, <code>UPDATE</code>, atau <code>DELETE</code> sesuai perubahan tabel yang Anda buat!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {tab === 'DDL' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-sm">Kategori DDL</span>
                  <h4 className="font-bold text-slate-800 text-base mt-1">Cara Membuat Soal DDL (CREATE TABLE) dengan Tabel Kunci</h4>
                </div>
                {onApplyTemplate && (
                  <button
                    type="button"
                    onClick={() => handleUseTemplate('DDL')}
                    className="px-3.5 py-2 bg-[#2196F3] hover:bg-[#1976D2] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
                  >
                    Gunakan Contoh Soal DDL Ini
                  </button>
                )}
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <ol className="list-decimal list-inside space-y-2 bg-slate-50 p-4 border border-slate-200 rounded-sm">
                  <li>
                    Kosongkan <strong>Skema Database Awal</strong> (karena tabel belum ada sebelum dibuat oleh siswa).
                  </li>
                  <li>
                    Pada bagian <strong>Tabel Kunci Jawaban</strong>, klik <strong>&quot;+ Tambah Tabel Kunci&quot;</strong>, beri nama <code>dosen</code>, dan tambahkan kolom <code>nidn</code> (INT, Primary), <code>nama_dosen</code> (VARCHAR 100), serta <code>bidang_keahlian</code> (VARCHAR 50).
                  </li>
                  <li>
                    Kotak <strong>Preview Query SQL</strong> di bawahnya akan otomatis men-generate perintah <code>CREATE TABLE dosen (...)</code>!
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Tips: Klik tombol <strong>Isi Contoh Soal</strong> untuk langsung mencoba simulasi lengkapnya.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
}
