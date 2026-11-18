"use client";

import React, { useState, useRef, useEffect } from "react";

interface VsCodeSqlEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  disabled?: boolean;
  placeholder?: string;
  queryType?: string;
  tables?: any[];
  answerTables?: any[];
  sqlAnswerKey?: string;
  fileName?: string;
  hideQuickSnippets?: boolean;
  onSaveTables?: (savedTables: any[]) => void;
}

const TOKEN_REGEX =
  /(--[^\n]*|\/\*[\s\S]*?\*\/)|('[^']*'|"[^"]*")|\b(SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|PRIMARY|KEY|FOREIGN|REFERENCES|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|ON|GROUP|BY|ORDER|ASC|DESC|LIMIT|OFFSET|AND|OR|NOT|IN|IS|NULL|AS|DISTINCT|HAVING|LIKE|BETWEEN|EXISTS|UNION|ALL|ADD|COLUMN|MODIFY|RENAME|TO|DEFAULT|UNIQUE|CHECK|INDEX|VIEW|DATABASE|IF|AUTOINCREMENT|AUTO_INCREMENT)\b|\b(INT|INTEGER|VARCHAR|CHAR|TEXT|DATE|DATETIME|TIMESTAMP|TIME|YEAR|BOOLEAN|BOOL|FLOAT|DOUBLE|DECIMAL|NUMERIC|REAL|BLOB|BIGINT|SMALLINT|TINYINT)\b|\b(COUNT|SUM|AVG|MIN|MAX|ROUND|UPPER|LOWER|LENGTH|TRIM|COALESCE|NOW|CURDATE)\b|\b(\d+(?:\.\d+)?)\b|([();,*=<>!+-])/gi;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightSqlToHtml(code: string): string {
  if (!code) return "";
  let result = "";
  let lastIndex = 0;

  TOKEN_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN_REGEX.exec(code)) !== null) {
    if (match.index > lastIndex) {
      result += escapeHtml(code.slice(lastIndex, match.index));
    }

    const fullMatch = match[0];
    const [
      ,
      commentGroup,
      stringGroup,
      keywordGroup,
      typeGroup,
      funcGroup,
      numberGroup,
      punctGroup,
    ] = match;

    const escaped = escapeHtml(fullMatch);

    if (commentGroup !== undefined) {
      result += `<span style="color:#6A9955;font-style:italic">${escaped}</span>`;
    } else if (stringGroup !== undefined) {
      result += `<span style="color:#CE9178">${escaped}</span>`;
    } else if (keywordGroup !== undefined) {
      result += `<span style="color:#569CD6;font-weight:600">${escaped}</span>`;
    } else if (typeGroup !== undefined) {
      result += `<span style="color:#4EC9B0">${escaped}</span>`;
    } else if (funcGroup !== undefined) {
      result += `<span style="color:#DCDCAA">${escaped}</span>`;
    } else if (numberGroup !== undefined) {
      result += `<span style="color:#B5CEA8">${escaped}</span>`;
    } else if (punctGroup !== undefined) {
      if (fullMatch === "(" || fullMatch === ")") {
        result += `<span style="color:#FFD700">${escaped}</span>`;
      } else if (fullMatch === ";") {
        result += `<span style="color:#C586C0;font-weight:600">${escaped}</span>`;
      } else {
        result += `<span style="color:#D4D4D4">${escaped}</span>`;
      }
    } else {
      result += escaped;
    }

    lastIndex = TOKEN_REGEX.lastIndex;
  }

  if (lastIndex < code.length) {
    result += escapeHtml(code.slice(lastIndex));
  }

  if (code.endsWith("\n")) {
    result += " ";
  }

  return result;
}

export function generateInitSchemaSqlFromTables(tables: any[]): string {
  let schema = "";
  if (tables && tables.length > 0) {
    tables.forEach((t: any) => {
      if (!t.name) return;
      const validCols = (t.columns || []).filter((c: any) => c.name);
      if (validCols.length === 0) return;

      const colDefs = validCols.map((c: any) => {
        if (c.ai) {
          return `${c.name} INTEGER PRIMARY KEY AUTOINCREMENT`;
        }
        let def = `${c.name} ${c.type}`;
        if (
          c.length &&
          !["DATE", "DATETIME", "BOOLEAN", "TEXT"].includes(c.type) &&
          !String(c.type).includes("(")
        ) {
          def += `(${c.length})`;
        }
        if (c.pk) def += " PRIMARY KEY";
        return def;
      });
      schema += `CREATE TABLE ${t.name} (${colDefs.join(", ")});\n`;
      if (t.rows && t.rows.length > 0) {
        t.rows.forEach((row: any) => {
          const colNames = validCols.map((c: any) => c.name).join(", ");
          const vals = validCols
            .map((c: any) => {
              const val = row[c.id] !== undefined ? row[c.id] : row[c.name];
              if (val === undefined || val === null || val === "") return "NULL";
              if (c.type.includes("INT") || c.type.includes("BOOLEAN"))
                return val;
              return `'${String(val).replace(/'/g, "''")}'`;
            })
            .join(", ");
          schema += `INSERT INTO ${t.name} (${colNames}) VALUES (${vals});\n`;
        });
      }
      schema += "\n";
    });
  }
  return schema;
}

export default function VsCodeSqlEditor({
  value,
  onChange,
  disabled = false,
  queryType = "DQL",
  tables = [],
  answerTables = [],
  sqlAnswerKey = "",
  fileName = "jawaban_siswa.sql",
  hideQuickSnippets = false,
  onSaveTables,
}: VsCodeSqlEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<"output" | "schema">(
    "output"
  );
  const [runResult, setRunResult] = useState<{
    success: boolean;
    resultType?: "rows" | "schema";
    studentResult?: any;
    message?: string;
    executionTimeMs?: number;
  } | null>(null);

  // Reset hasil terminal saat berpindah soal
  useEffect(() => {
    setRunResult(null);
    setActiveBottomTab("output");
  }, [fileName]);

  const lines = (value || "").split("\n");
  const lineCount = Math.max(lines.length, 5);

  const updateCursorMetrics = (el: HTMLTextAreaElement) => {
    const selectionStart = el.selectionStart || 0;
    const textUpToCursor = el.value.slice(0, selectionStart);
    const splitLines = textUpToCursor.split("\n");
    setCursorPos({
      line: splitLines.length,
      col: splitLines[splitLines.length - 1].length + 1,
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRunQuery();
      return;
    }

    if (e.key === "Tab" && !disabled) {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const nextVal = value.substring(0, start) + "  " + value.substring(end);
      onChange(nextVal);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart =
            textareaRef.current.selectionEnd = start + 2;
          updateCursorMetrics(textareaRef.current);
        }
      });
    }
  };

  const handleRunQuery = async () => {
    const trimmed = (value || "").trim();
    setActiveBottomTab("output");

    if (!trimmed) {
      setRunResult({
        success: false,
        message:
          "Query SQL masih kosong. Tuliskan perintah SQL Anda pada editor di atas sebelum menjalankan query.",
      });
      return;
    }

    setIsRunning(true);
    try {
      const initSchemaSql = generateInitSchemaSqlFromTables(tables);
      const res = await fetch("/api/latihan-soal/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentQuery: trimmed,
          answerKeyQuery: sqlAnswerKey || "",
          initSchemaSql,
          answerTables: answerTables || [],
          queryType: queryType || "DQL",
        }),
      });
      const data = await res.json();
      setRunResult({
        success: Boolean(data.success),
        resultType: data.resultType,
        studentResult: data.studentResult,
        message: data.message || data.error,
        executionTimeMs: data.executionTimeMs || 1,
      });
    } catch (err: any) {
      setRunResult({
        success: false,
        message:
          "Gagal menghubungi server eksekusi SQL: " +
          (err?.message || "Network error"),
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveToSandbox = async () => {
    if (!onSaveTables) return;
    const trimmed = (value || "").trim();
    setActiveBottomTab("output");

    if (!trimmed) {
      setRunResult({
        success: false,
        message:
          "Editor SQL masih kosong. Tuliskan perintah pembuatan tabel (CREATE TABLE) atau manipulasi data terlebih dahulu sebelum klik Simpan.",
      });
      return;
    }

    if (trimmed.toLowerCase().startsWith("select")) {
      setRunResult({
        success: false,
        message:
          "Perintah SELECT hanya untuk menampilkan data. Gunakan perintah CREATE TABLE, ALTER TABLE, INSERT, UPDATE, atau DELETE untuk menyimpan tabel/data ke sisi kiri.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const initSchemaSql = generateInitSchemaSqlFromTables(tables);
      const res = await fetch("/api/latihan-soal/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentQuery: trimmed,
          answerKeyQuery: "",
          initSchemaSql,
          answerTables: [],
          queryType: "DDL",
        }),
      });
      const data = await res.json();
      setRunResult({
        success: Boolean(data.success),
        resultType: data.resultType,
        studentResult: data.studentResult,
        message: data.message || data.error,
        executionTimeMs: data.executionTimeMs || 1,
      });

      if (data.success && data.studentResult && typeof data.studentResult === "object") {
        const stateObj = data.studentResult;
        const nextTables = Object.keys(stateObj).map((tName) => {
          const tbl = stateObj[tName];
          return {
            name: tName,
            columns: (tbl.columns || []).map((c: any) => ({
              id: c.name,
              name: c.name,
              type: c.type || "TEXT",
              length: "",
              pk: Boolean(c.pk),
              ai: false,
            })),
            rows: tbl.rows || [],
          };
        });
        onSaveTables(nextTables);
        onChange("");
        setCursorPos({ line: 1, col: 1 });
      }
    } catch (err: any) {
      setRunResult({
        success: false,
        message:
          "Gagal menyimpan ke database sandbox: " +
          (err?.message || "Network error"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const initSchemaPreview = generateInitSchemaSqlFromTables(tables);

  return (
    <div className="rounded-sm overflow-hidden border border-[#333333] bg-[#1E1E1E] shadow-md select-none flex flex-col">
      {/* 1. VS CODE TOP TITLE & TAB BAR */}
      <div className="bg-[#252526] border-b border-[#1E1E1E] flex flex-wrap items-center justify-between px-2 pt-1.5 gap-2">
        <div className="flex items-center gap-2">
          {/* Window Controls */}
          <div className="flex items-center gap-1.5 px-2 pb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] inline-block" />
          </div>

          {/* Active File Tab */}
          <div className="bg-[#1E1E1E] text-[#D4D4D4] px-3 py-1.5 text-xs font-mono flex items-center gap-2 border-t-2 border-t-[#007ACC] rounded-t-sm">
            <svg
              className="w-3.5 h-3.5 text-[#569CD6] shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
              />
            </svg>
            <span>{fileName}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#007ACC]/20 text-[#569CD6] border border-[#007ACC]/40 font-sans font-semibold">
              {queryType || "SQL"}
            </span>
          </div>
        </div>

        {/* Right Actions: Run Query & Reset */}
        <div className="flex items-center gap-2 pb-1.5 pr-1">
          <span className="hidden xl:inline-block text-[10px] font-mono text-[#858585]">
            <kbd className="px-1 py-0.5 bg-[#333333] text-[#CCCCCC] rounded text-[10px]">
              Ctrl+Enter
            </kbd>
          </span>

          {!disabled && value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setCursorPos({ line: 1, col: 1 });
              }}
              className="px-2 py-1 text-[11px] font-medium text-[#CCCCCC] hover:text-white bg-[#333333] hover:bg-[#3E3E42] rounded-sm transition-colors"
              title="Bersihkan kode di editor"
            >
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={handleRunQuery}
            disabled={isRunning}
            className="px-3 py-1 text-xs font-semibold text-white bg-[#2EA043] hover:bg-[#238636] active:bg-[#196C2E] disabled:opacity-60 rounded-sm transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Jalankan query di SQLite Sandbox (Ctrl + Enter)"
          >
            {isRunning ? (
              <>
                <svg
                  className="w-3.5 h-3.5 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Menjalankan...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                <span>Jalankan Query</span>
              </>
            )}
          </button>

          {onSaveTables && !disabled && (
            <button
              type="button"
              onClick={handleSaveToSandbox}
              disabled={isSaving || isRunning}
              className="px-3 py-1 text-xs font-semibold text-white bg-[#2196F3] hover:bg-[#1976D2] active:bg-[#0D47A1] disabled:opacity-60 rounded-sm transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Simpan tabel baru atau perubahan ke panel daftar tabel di sisi kiri"
            >
              {isSaving ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                  <span>Simpan</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. VS CODE EDITOR WORKSPACE (TOP RIGHT: CODE EDITOR) */}
      <div className="relative flex min-h-[130px] max-h-[220px] bg-[#1E1E1E]">
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="w-11 py-3 bg-[#1E1E1E] border-r border-[#2B2B2B] text-right pr-3 font-mono text-[13px] leading-[22px] text-[#858585] overflow-hidden shrink-0 select-none"
        >
          {Array.from({ length: lineCount }).map((_, idx) => {
            const lineNum = idx + 1;
            const isCurrent = lineNum === cursorPos.line;
            return (
              <div
                key={lineNum}
                className={
                  isCurrent ? "text-[#C6C6C6] font-semibold" : "text-[#6E7681]"
                }
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Code Area Container */}
        <div className="relative flex-1 overflow-hidden">
          {/* Syntax Highlighted Backdrop */}
          <pre
            ref={preRef}
            aria-hidden="true"
            className="m-0 py-3 px-4 font-mono text-[13.5px] leading-[22px] whitespace-pre overflow-auto pointer-events-none text-[#D4D4D4] min-h-[130px] max-h-[220px] w-full"
            style={{ tabSize: 2 }}
          >
            {value ? (
              <code
                dangerouslySetInnerHTML={{ __html: highlightSqlToHtml(value) }}
              />
            ) : (
              <span className="text-[#6A9955] italic"></span>
            )}
          </pre>

          {/* Transparent Interactive Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            disabled={disabled}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            onChange={(e) => {
              onChange(e.target.value);
              updateCursorMetrics(e.target);
            }}
            onClick={(e) => updateCursorMetrics(e.currentTarget)}
            onKeyUp={(e) => updateCursorMetrics(e.currentTarget)}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            className="absolute inset-0 w-full h-full m-0 py-3 px-4 font-mono text-[13.5px] leading-[22px] bg-transparent text-transparent caret-white resize-none focus:outline-none overflow-auto selection:bg-[#264F78]/70 disabled:cursor-not-allowed"
            style={{ tabSize: 2 }}
          />
        </div>
      </div>

      {/* 4. INTEGRATED VS CODE TERMINAL / OUTPUT PANEL (ALWAYS VISIBLE BELOW EDITOR) */}
      <div className="border-t-2 border-[#333333] bg-[#181818] text-[#CCCCCC] flex flex-col">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#2B2B2B]">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveBottomTab("output")}
              className={`text-[11px] font-semibold uppercase tracking-wider py-0.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeBottomTab === "output"
                  ? "text-white border-[#007ACC]"
                  : "text-[#858585] border-transparent hover:text-[#CCCCCC]"
              }`}
            >
              <svg
                className="w-3.5 h-3.5 text-[#4EC9B0]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Terminal • Hasil Jawaban
            </button>
            <button
              type="button"
              onClick={() => setActiveBottomTab("schema")}
              className={`text-[11px] font-semibold uppercase tracking-wider py-0.5 border-b-2 transition-colors ${
                activeBottomTab === "schema"
                  ? "text-white border-[#007ACC]"
                  : "text-[#858585] border-transparent hover:text-[#CCCCCC]"
              }`}
            >
              DDL Skema Awal
            </button>
          </div>

          <div className="flex items-center gap-2">
            {runResult && !isRunning && (
              <>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-sm ${
                    runResult.success
                      ? "bg-[#16825D]/30 text-[#4EC9B0] border border-[#16825D]"
                      : "bg-red-950/60 text-[#F48771] border border-red-800"
                  }`}
                >
                  {runResult.success
                    ? `✓ Dieksekusi (${runResult.executionTimeMs || 1} ms)`
                    : "✕ Error SQL"}
                </span>
                <button
                  type="button"
                  onClick={() => setRunResult(null)}
                  className="text-[10px] font-mono text-[#858585] hover:text-white px-1.5 py-0.5 rounded hover:bg-[#333333] transition-colors"
                  title="Bersihkan Terminal"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* Terminal Body Content */}
        <div className="p-3 min-h-[150px] max-h-[340px] overflow-y-auto select-text">
          {activeBottomTab === "schema" ? (
            <div>
              <p className="text-[11px] text-[#858585] mb-1.5 font-mono">
                -- Perintah SQL pembentuk skema awal di database sandbox:
              </p>
              <pre className="p-2.5 bg-[#1E1E1E] border border-[#2B2B2B] rounded-sm font-mono text-xs text-[#9CDCFE] whitespace-pre-wrap">
                {initSchemaPreview ||
                  "-- Tidak ada tabel awal (Database Kosong) --"}
              </pre>
            </div>
          ) : isRunning ? (
            <div className="flex items-center gap-2 py-8 justify-center text-xs text-[#858585] font-mono">
              <svg
                className="w-4 h-4 animate-spin text-[#007ACC]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Mengeksekusi query di SQLite In-Memory Sandbox...
            </div>
          ) : !runResult ? (
            <div className="font-mono text-xs text-[#858585] space-y-1.5 py-2">
              <div className="flex items-center gap-2 text-[#6A9955]">
                <span>sqlite3&gt;</span>
                <span>Menunggu eksekusi query...</span>
              </div>
              <p className="text-[11px] text-[#6E7681]">
                Ketik kode SQL Anda pada editor di atas, lalu klik tombol{" "}
                <span className="text-[#4EC9B0] font-semibold">
                  ▶ Jalankan Query
                </span>{" "}
                (atau tekan <span className="text-[#CCCCCC]">Ctrl+Enter</span>)
                untuk menampilkan tabel hasil jawaban Anda di sini sebelum
                dikumpulkan.
              </p>
            </div>
          ) : !runResult.success ? (
            <div className="p-3 bg-red-950/30 border border-red-800/60 rounded-sm font-mono text-xs text-[#F48771] flex items-start gap-2.5">
              <svg
                className="w-4 h-4 text-[#F48771] shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <div className="font-bold text-red-300 mb-0.5">
                  sqlite3&gt; Eksekusi Query Gagal
                </div>
                <div className="whitespace-pre-wrap">{runResult.message}</div>
              </div>
            </div>
          ) : runResult.resultType === "rows" ? (
            (() => {
              const rows = Array.isArray(runResult.studentResult)
                ? runResult.studentResult
                : [];
              if (rows.length === 0) {
                return (
                  <div className="p-3 bg-[#1E1E1E] border border-[#2B2B2B] rounded-sm text-xs font-mono text-[#CCCCCC]">
                    <span className="text-[#6A9955]">sqlite3&gt;</span> Query{" "}
                    <span className="text-[#569CD6]">SELECT</span> berhasil
                    dijalankan, namun menghasilkan{" "}
                    <span className="text-[#CE9178] font-bold">
                      0 baris data
                    </span>{" "}
                    (tabel kosong atau tidak ada baris yang memenuhi kondisi
                    filter).
                  </div>
                );
              }
              const cols = Object.keys(rows[0]);
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#858585] font-mono">
                    <span>
                      <span className="text-[#6A9955]">sqlite3&gt;</span>{" "}
                      Menampilkan{" "}
                      <strong className="text-[#4EC9B0]">{rows.length}</strong>{" "}
                      baris hasil query:
                    </span>
                    <span>{cols.length} kolom</span>
                  </div>
                  <div className="overflow-x-auto border border-[#333333] rounded-sm">
                    <table className="w-full text-left text-xs font-mono whitespace-nowrap">
                      <thead className="bg-[#252526] text-[#9CDCFE] border-b border-[#333333]">
                        <tr>
                          <th className="px-2.5 py-1.5 w-8 text-center text-[#858585] border-r border-[#333333]">
                            #
                          </th>
                          {cols.map((col) => (
                            <th
                              key={col}
                              className="px-3 py-1.5 font-semibold border-r border-[#333333] last:border-r-0"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2B2B2B] bg-[#1E1E1E]">
                        {rows.map((row: any, rIdx: number) => (
                          <tr
                            key={rIdx}
                            className="hover:bg-[#2A2D2E] transition-colors"
                          >
                            <td className="px-2.5 py-1 text-center text-[#858585] border-r border-[#2B2B2B]">
                              {rIdx + 1}
                            </td>
                            {cols.map((col) => (
                              <td
                                key={col}
                                className="px-3 py-1 text-[#D4D4D4] border-r border-[#2B2B2B] last:border-r-0"
                              >
                                {row[col] === null || row[col] === undefined ? (
                                  <span className="text-[#858585] italic">
                                    NULL
                                  </span>
                                ) : (
                                  String(row[col])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()
          ) : (
            (() => {
              const stateObj = runResult.studentResult || {};
              const tableNames = Object.keys(stateObj);
              if (tableNames.length === 0) {
                return (
                  <div className="p-3 bg-[#1E1E1E] border border-[#2B2B2B] rounded-sm text-xs font-mono text-[#CCCCCC]">
                    <span className="text-[#6A9955]">sqlite3&gt;</span> Perintah
                    SQL berhasil dijalankan. Saat ini tidak ada tabel tersisa di
                    dalam database sandbox.
                  </div>
                );
              }
              return (
                <div className="space-y-3">
                  <div className="text-[11px] text-[#858585] font-mono">
                    <span className="text-[#6A9955]">sqlite3&gt;</span> Kondisi
                    tabel di database sandbox setelah query Anda dijalankan:
                  </div>
                  {tableNames.map((tName) => {
                    const tbl = stateObj[tName];
                    const columns = tbl?.columns || [];
                    const rows = tbl?.rows || [];
                    return (
                      <div
                        key={tName}
                        className="border border-[#333333] rounded-sm overflow-hidden bg-[#1E1E1E]"
                      >
                        <div className="bg-[#252526] px-3 py-1.5 border-b border-[#333333] flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-[#4EC9B0]">
                            Tabel: {tName}
                          </span>
                          <span className="text-[10px] font-mono text-[#858585]">
                            {columns.length} Kolom • {rows.length} Baris Data
                          </span>
                        </div>

                        {/* Struktur Kolom */}
                        <div className="p-2.5 border-b border-[#2B2B2B] bg-[#1B1B1C]">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#858585] mb-1.5">
                            Struktur Kolom:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {columns.map((c: any) => (
                              <span
                                key={c.name}
                                className="px-2 py-0.5 bg-[#252526] border border-[#3C3C3C] rounded-sm font-mono text-[11px] text-[#D4D4D4] flex items-center gap-1.5"
                              >
                                <span className="text-[#9CDCFE]">{c.name}</span>
                                <span className="text-[#4EC9B0] text-[10px]">
                                  {c.type || "TEXT"}
                                </span>
                                {Boolean(c.pk) && (
                                  <span className="px-1 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[9px] font-bold">
                                    PK
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Isi Baris Tabel */}
                        {rows.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-mono whitespace-nowrap">
                              <thead className="bg-[#252526] text-[#9CDCFE] border-b border-[#333333]">
                                <tr>
                                  <th className="px-2.5 py-1 w-8 text-center text-[#858585] border-r border-[#333333]">
                                    #
                                  </th>
                                  {columns.map((c: any) => (
                                    <th
                                      key={c.name}
                                      className="px-3 py-1 font-semibold border-r border-[#333333] last:border-r-0"
                                    >
                                      {c.name}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#2B2B2B]">
                                {rows.map((r: any, rIdx: number) => (
                                  <tr
                                    key={rIdx}
                                    className="hover:bg-[#2A2D2E]"
                                  >
                                    <td className="px-2.5 py-1 text-center text-[#858585] border-r border-[#2B2B2B]">
                                      {rIdx + 1}
                                    </td>
                                    {columns.map((c: any) => {
                                      const matchKey = Object.keys(r).find(
                                        (k) =>
                                          k.toLowerCase() ===
                                          c.name.toLowerCase()
                                      );
                                      const val = matchKey
                                        ? r[matchKey]
                                        : undefined;
                                      return (
                                        <td
                                          key={c.name}
                                          className="px-3 py-1 text-[#D4D4D4] border-r border-[#2B2B2B] last:border-r-0"
                                        >
                                          {val === null || val === undefined ? (
                                            <span className="text-[#858585] italic">
                                              NULL
                                            </span>
                                          ) : (
                                            String(val)
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="px-3 py-2 text-[11px] font-mono text-[#858585] italic">
                            Tabel berhasil terbentuk (0 baris data).
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* 5. VS CODE BOTTOM STATUS BAR */}
      <div className="bg-[#007ACC] text-white px-3 py-1 text-[11px] font-mono flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-semibold">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            SQLite 3 Sandbox
          </span>
          <span className="hidden sm:inline text-white/80">
            {disabled ? "Mode Baca Saja (Terkumpul)" : "Siap Dieksekusi"}
          </span>
        </div>
        <div className="flex items-center gap-4 text-white/90">
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className="hidden sm:inline">Spaces: 2</span>
          <span className="hidden sm:inline">UTF-8</span>
          <span className="font-semibold">SQL ({queryType || "DQL"})</span>
        </div>
      </div>
    </div>
  );
}
