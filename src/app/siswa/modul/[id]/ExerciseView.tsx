"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import FinishModuleButton from '../../components/FinishModuleButton';
import VsCodeSqlEditor from '@/components/VsCodeSqlEditor';

export default function ExerciseView({ 
  modulId, 
  subBab, 
  currentBabIdx, 
  currentSubIdx, 
  hasNext, 
  nextUrl, 
  buttonLabel,
  existingData
}: { 
  modulId: string, 
  subBab: any, 
  currentBabIdx: number, 
  currentSubIdx: number, 
  hasNext: boolean, 
  nextUrl: string,
  buttonLabel: string,
  existingData?: any
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(existingData?.answers || {});
  const [results, setResults] = useState<Record<string, any>>(existingData?.results || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState<number | null>(existingData?.score !== undefined ? existingData.score : null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [doubtful, setDoubtful] = useState<string[]>([]);

  React.useEffect(() => {
    const handleNav = (e: any) => {
      setActiveIdx(e.detail);
    };
    window.addEventListener('exercise-nav-clicked', handleNav);
    return () => window.removeEventListener('exercise-nav-clicked', handleNav);
  }, []);

  React.useEffect(() => {
    const answeredIds = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k].trim() !== '');
    window.dispatchEvent(new CustomEvent('exercise-state-updated', { 
      detail: {
        answeredIds,
        doubtfulIds: doubtful,
        activeIdx,
        results,
        isSubmitted: score !== null,
      }
    }));
  }, [answers, doubtful, activeIdx, results, score]);

  const handleOptionChange = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSqlChange = (questionId: string, query: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: query }));
  };

  const toggleDoubtful = (questionId: string) => {
    setDoubtful(prev => 
      prev.includes(questionId) ? prev.filter(id => id !== questionId) : [...prev, questionId]
    );
  };

  const handleSubmit = async () => {
    if (!subBab.questions || subBab.questions.length === 0) {
      Swal.fire('Info', 'Tidak ada soal pada latihan ini.', 'info');
      return;
    }

    const unansweredNumbers: number[] = [];
    subBab.questions.forEach((q: any, index: number) => {
      if (!answers[q.id] || typeof answers[q.id] !== 'string' || answers[q.id].trim() === '') {
        unansweredNumbers.push(index + 1);
      }
    });

    let alertText = 'Apakah Anda yakin ingin mengumpulkan jawaban ini? Anda tidak dapat mengubahnya lagi setelah dikumpulkan.';
    if (unansweredNumbers.length > 0) {
      alertText = `Ada soal yang BELUM dijawab (Nomor: ${unansweredNumbers.join(', ')}).\n\n${alertText}`;
    }

    const confirm = await Swal.fire({
      title: 'Kumpulkan Jawaban?',
      text: alertText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2196F3',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Kumpulkan',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) {
      return;
    }

    setIsSubmitting(true);
    let totalScore = 0;
    let maxScore = 0;

    const generateInitSchema = (tables: any[]) => {
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
            if (c.length && !['DATE', 'DATETIME', 'BOOLEAN', 'TEXT'].includes(c.type)) {
              def += `(${c.length})`;
            }
            if (c.pk) def += ' PRIMARY KEY';
            return def;
          });
          schema += `CREATE TABLE ${t.name} (${colDefs.join(', ')});\n`;
          if (t.rows && t.rows.length > 0) {
            t.rows.forEach((row: any) => {
              const colNames = validCols.map((c: any) => c.name).join(', ');
              const vals = validCols.map((c: any) => {
                const val = row[c.id];
                if (val === undefined || val === '') return 'NULL';
                if (c.type.includes('INT') || c.type.includes('BOOLEAN')) return val;
                return `'${String(val).replace(/'/g, "''")}'`;
              }).join(', ');
              schema += `INSERT INTO ${t.name} (${colNames}) VALUES (${vals});\n`;
            });
          }
          schema += '\n';
        });
      }
      return schema;
    };

    const normalizeSqlString = (sql: string) =>
      (sql || '')
        .trim()
        .toLowerCase()
        .replace(/;\s*$/g, '')
        .replace(/\s*([,=<>!()+-])\s*/g, '$1')
        .replace(/\s+/g, ' ');

    const evaluationResults: Record<string, any> = {};

    for (const q of subBab.questions) {
      const weight = Number(q.scoreWeight) || 10;
      maxScore += weight;
      const userAnswer = answers[q.id];

      if (q.type === 'multiple_choice') {
        const correctOption = q.options?.find((o: any) => o.isCorrect);
        const isCorrect = Boolean(correctOption && userAnswer && userAnswer === correctOption.id);
        const earned = isCorrect ? weight : 0;
        totalScore += earned;
        evaluationResults[q.id] = {
          isCorrect,
          earnedScore: earned,
          maxScore: weight,
          correctAnswer: correctOption?.id || null,
          feedback: isCorrect ? "Jawaban Anda Benar!" : "Jawaban Anda Kurang Tepat.",
        };
      } else if (q.type === 'sql_query') {
        if (!userAnswer || !userAnswer.trim()) {
          evaluationResults[q.id] = {
            isCorrect: false,
            earnedScore: 0,
            maxScore: weight,
            feedback: "Soal tidak dijawab.",
          };
          continue;
        }

        let isCorrect = false;
        let feedbackMsg = "Hasil kueri SQL belum sesuai dengan kunci jawaban.";
        try {
          const initSchemaSql = generateInitSchema(q.tables || []);
          const evalRes = await fetch('/api/latihan-soal/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentQuery: userAnswer,
              answerKeyQuery: q.sqlAnswerKey,
              initSchemaSql,
              answerTables: q.answerTables || [],
              queryType: q.queryType || 'DQL',
            })
          });
          const evalData = await evalRes.json();
          if (evalData.isCorrect) {
            isCorrect = true;
          }
          if (evalData.message) {
            feedbackMsg = evalData.message;
          }
        } catch (err) {
          // Fallback ke normalisasi string SQL jika request ke evaluator gagal
        }

        if (!isCorrect && normalizeSqlString(userAnswer) === normalizeSqlString(q.sqlAnswerKey)) {
          isCorrect = true;
          feedbackMsg = "Jawaban Benar! Query SQL identik dengan kunci jawaban.";
        }

        const earned = isCorrect ? weight : 0;
        totalScore += earned;
        evaluationResults[q.id] = {
          isCorrect,
          earnedScore: earned,
          maxScore: weight,
          feedback: feedbackMsg,
        };
      }
    }

    const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    
    // Save to database
    try {
      const res = await fetch('/api/progress/exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modul_id: modulId,
          sub_bab_id: subBab._id?.toString() || `${currentBabIdx}-${currentSubIdx}`,
          score: finalScore,
          answers,
          results: evaluationResults,
        })
      });
      const data = await res.json();
      if (data.success) {
        setScore(finalScore);
        setResults(evaluationResults);
        await Swal.fire({
          title: 'Latihan Selesai!',
          html: `Jawaban Anda berhasil dinilai otomatis.<br/>Nilai Akhir: <b style="font-size:22px;color:#0D47A1">${finalScore} / 100</b><br/><span style="font-size:12px;color:#64748b">Status: <b>${finalScore >= 70 ? "Lulus" : "Perlu Perbaikan"}</b></span>`,
          icon: finalScore >= 70 ? 'success' : 'warning',
          confirmButtonColor: '#2196F3'
        });
      } else {
        Swal.fire('Error', data.error || 'Gagal menyimpan nilai', 'error');
      }
    } catch (e) {
      Swal.fire('Error', 'Terjadi kesalahan jaringan', 'error');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col min-h-full bg-white animate-in fade-in duration-300">
      <div className="px-6 py-4 sm:px-8 sm:py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-0.5 rounded-sm border border-orange-200">
              Latihan Soal
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            {subBab.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Kerjakan soal-soal di bawah ini dengan benar.</p>
        </div>
        <button 
          onClick={() => router.push(`/siswa/modul/${modulId}?bab=${currentBabIdx}&sub=${currentSubIdx}`)}
          className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-sm transition-colors shadow-sm shrink-0"
        >
          Kembali ke Materi
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Konten Soal */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col gap-6">
          {(!subBab.questions || subBab.questions.length === 0) ? (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-sm border border-slate-200">
              Tidak ada soal yang tersedia untuk latihan ini.
            </div>
          ) : (
            (() => {
              const q = subBab.questions[activeIdx];
              const index = activeIdx;
              if (!q) return null;
              return (
                <div id={`question-${index}`} key={q.id} className="bg-white border border-slate-200 rounded-sm shadow-sm shrink-0 scroll-mt-6">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-800">Soal {index + 1}</span>
                  <div className="flex items-center gap-4">
                    {score === null && (
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-orange-600">
                        <input 
                          type="checkbox" 
                          checked={doubtful.includes(q.id)}
                          onChange={() => toggleDoubtful(q.id)}
                          className="w-4 h-4 text-orange-500 rounded-sm border-slate-300 focus:ring-orange-500"
                        />
                        Ragu-ragu
                      </label>
                    )}
                    <span className="text-xs font-semibold px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-sm">
                      Bobot: {q.scoreWeight || 10} Poin
                    </span>
                  </div>
                </div>

                {/* Banner Penilaian Hasil Latihan */}
                {score !== null && results[q.id] && (
                  <div
                    className={`mx-6 mt-4 p-3.5 rounded-sm border flex items-center justify-between text-xs animate-in fade-in ${
                      results[q.id].isCorrect
                        ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                        : "bg-rose-50 border-rose-300 text-rose-950"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                          results[q.id].isCorrect ? "bg-emerald-600" : "bg-rose-600"
                        }`}
                      >
                        {results[q.id].isCorrect ? "✓" : "✕"}
                      </span>
                      <div>
                        <span className="font-bold text-sm block">
                          {results[q.id].isCorrect ? "Jawaban Anda Benar!" : "Jawaban Kurang Tepat"}
                        </span>
                        <span className="opacity-90 block mt-0.5">
                          {results[q.id].feedback || (results[q.id].isCorrect ? "Hasil query sesuai dengan kunci jawaban." : "Hasil query belum sesuai dengan kunci jawaban.")}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 font-extrabold rounded-sm text-xs shrink-0 ${
                        results[q.id].isCorrect
                          ? "bg-emerald-200 text-emerald-900 border border-emerald-300"
                          : "bg-rose-200 text-rose-900 border border-rose-300"
                      }`}
                    >
                      {results[q.id].isCorrect
                        ? `+${results[q.id].earnedScore || q.scoreWeight || 10} Poin`
                        : `0 / ${q.scoreWeight || 10} Poin`}
                    </span>
                  </div>
                )}

                {q.type === 'multiple_choice' ? (
                  <div className="p-6">
                    <div 
                      className="prose prose-sm max-w-none mb-6" 
                      dangerouslySetInnerHTML={{ __html: q.instruction }} 
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options?.map((opt: any, oIdx: number) => {
                        const isSelected = answers[q.id] === opt.id;
                        const isCorrectOpt = opt.isCorrect || opt.id === results[q.id]?.correctAnswer;
                        let optStyle = "border-slate-200 hover:bg-slate-50";
                        if (score !== null) {
                          if (isCorrectOpt) {
                            optStyle = "border-emerald-500 bg-emerald-50/80 text-emerald-950 font-medium";
                          } else if (isSelected && !isCorrectOpt) {
                            optStyle = "border-rose-400 bg-rose-50/80 text-rose-950";
                          } else {
                            optStyle = "border-slate-200 bg-slate-50/40 opacity-70";
                          }
                        } else if (isSelected) {
                          optStyle = "border-[#2196F3] bg-blue-50/50";
                        }

                        return (
                          <label 
                            key={opt.id} 
                            className={`flex items-start justify-between gap-3 p-3 border rounded-sm transition-colors ${score !== null ? 'cursor-default' : 'cursor-pointer'} ${optStyle}`}
                          >
                            <div className="flex items-start gap-3">
                              <input 
                                type="radio" 
                                name={`question_${q.id}`} 
                                value={opt.id}
                                checked={isSelected}
                                onChange={() => handleOptionChange(q.id, opt.id)}
                                className="mt-1 w-4 h-4 text-[#2196F3] shrink-0"
                                disabled={score !== null}
                              />
                              <div className="flex-1 text-sm text-slate-700">
                                <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                                {opt.text}
                              </div>
                            </div>
                            {score !== null && (
                              <div className="text-[11px] font-bold shrink-0 ml-2 mt-0.5">
                                {isCorrectOpt && (
                                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-sm">
                                    ✓ Kunci Benar
                                  </span>
                                )}
                                {isSelected && !isCorrectOpt && (
                                  <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded-sm">
                                    ✕ Pilihan Anda
                                  </span>
                                )}
                              </div>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    {/* BAGIAN KIRI: SOAL & SKEMA TABEL REFERENSI */}
                    <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/30 flex flex-col gap-5">
                      <div>
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D47A1] bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200">
                            Instruksi Soal
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            Tipe: {q.queryType || 'DQL'}
                          </span>
                        </div>
                        <div 
                          className="prose prose-sm max-w-none text-slate-800" 
                          dangerouslySetInnerHTML={{ __html: q.instruction }} 
                        />
                      </div>

                      {q.tables && q.tables.filter((t: any) => t.name && t.columns?.some((c: any) => c.name)).length > 0 && (
                        <div className="space-y-3 pt-3 border-t border-slate-200">
                          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Skema & Data Tabel Referensi</h4>
                          <div className="grid grid-cols-1 gap-3">
                            {q.tables.filter((t: any) => t.name && t.columns?.some((c: any) => c.name)).map((tbl: any, tIdx: number) => {
                              const validCols = (tbl.columns || []).filter((c: any) => c.name);
                              return (
                                <div key={tbl.id || tIdx} className="border border-slate-200 rounded-sm overflow-hidden bg-white shadow-xs">
                                  <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-800 font-mono">Tabel: {tbl.name}</span>
                                    <span className="text-[11px] text-slate-500">{validCols.length} Kolom</span>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs whitespace-nowrap bg-white">
                                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                                        <tr>
                                          {validCols.map((c: any) => (
                                            <th key={c.id} className="px-3 py-2 font-semibold border-r border-slate-200 last:border-r-0">
                                              <div className="flex items-center gap-1.5">
                                                <span className="font-mono">{c.name}</span>
                                                <span className="text-[10px] font-normal text-slate-400">
                                                  ({c.type}{c.length && !['DATE', 'DATETIME', 'BOOLEAN', 'TEXT'].includes(c.type) ? `(${c.length})` : ''})
                                                </span>
                                                {c.pk && <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-semibold">PK</span>}
                                              </div>
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      {tbl.rows && tbl.rows.length > 0 ? (
                                        <tbody className="divide-y divide-slate-100">
                                          {tbl.rows.map((row: any, rIdx: number) => (
                                            <tr key={rIdx} className="hover:bg-slate-50">
                                              {validCols.map((c: any) => (
                                                <td key={c.id} className="px-3 py-1.5 border-r border-slate-100 last:border-r-0 font-mono text-slate-600">
                                                  {row[c.id] !== undefined && row[c.id] !== '' ? row[c.id] : <span className="text-slate-300 italic">NULL</span>}
                                                </td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      ) : (
                                        <tbody>
                                          <tr>
                                            <td colSpan={validCols.length} className="px-3 py-2 text-center text-slate-400 italic text-[11px]">
                                              Tabel kosong (belum ada baris data awal)
                                            </td>
                                          </tr>
                                        </tbody>
                                      )}
                                    </table>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BAGIAN KANAN: EDITOR KODE SQL (ATAS) & TERMINAL HASIL JAWABAN (BAWAH) */}
                    <div className="lg:col-span-7 p-5 sm:p-6 bg-white flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Editor Kode SQL &amp; Terminal Output
                        </label>
                        <span className="text-[11px] text-slate-500">
                          Klik <strong>▶ Jalankan Query</strong> untuk melihat hasil di Terminal bawah
                        </span>
                      </div>
                      <VsCodeSqlEditor
                        value={answers[q.id] || ''}
                        onChange={(val) => handleSqlChange(q.id, val)}
                        disabled={score !== null}
                        queryType={q.queryType || 'DQL'}
                        tables={q.tables || []}
                        answerTables={q.answerTables || []}
                        sqlAnswerKey={q.sqlAnswerKey || ''}
                        fileName={`soal_${index + 1}.sql`}
                      />
                    </div>
                  </div>
                )}
                </div>
              );
            })()
          )}

        </div>
      </div>

      <div className="p-6 border-t border-slate-200 bg-slate-50 mt-auto">
        <div className="flex items-center justify-between w-full">
          <div className="w-1/3 flex justify-start items-center gap-4">
             {activeIdx > 0 ? (
               <button
                  onClick={() => setActiveIdx(activeIdx - 1)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-600 font-bold text-sm rounded-sm hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-2"
               >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Soal Sebelumnya
               </button>
             ) : (
               <div /> /* Spacer */
             )}
             {score !== null && (
               <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                 <span>Nilai:</span>
                 <span className={`px-2.5 py-1 rounded-sm text-xs font-extrabold ${score >= 70 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                   {score} / 100 ({score >= 70 ? 'Lulus' : 'Perlu Bimbingan'})
                 </span>
               </div>
             )}
          </div>
          
          <div className="w-1/3 flex justify-center text-sm font-bold text-slate-500">
             {activeIdx + 1} / {subBab.questions?.length || 1}
          </div>
          
          <div className="w-1/3 flex justify-end">
             {score !== null ? (
               <div className="flex gap-4 items-center">
                 {activeIdx < (subBab.questions?.length || 1) - 1 && (
                   <button
                      onClick={() => setActiveIdx(activeIdx + 1)}
                      className="px-6 py-2.5 border border-slate-300 text-slate-600 font-bold text-sm rounded-sm hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-2"
                   >
                      Soal Selanjutnya
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                   </button>
                 )}
                 <FinishModuleButton 
                   modulId={modulId} 
                   subBabId={subBab._id?.toString() || `${currentBabIdx}-${currentSubIdx}`}
                   isLast={!hasNext}
                   nextUrl={nextUrl}
                   label={buttonLabel}
                 />
               </div>
             ) : (
               activeIdx === (subBab.questions?.length || 1) - 1 ? (
                 <button 
                   onClick={handleSubmit}
                   disabled={isSubmitting || !subBab.questions || subBab.questions.length === 0}
                   className="px-6 py-2.5 bg-[#2196F3] text-white font-bold text-sm rounded-sm hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50"
                 >
                   {isSubmitting ? 'Menyimpan...' : 'Kumpulkan Jawaban'}
                 </button>
               ) : (
                 <button
                    onClick={() => setActiveIdx(activeIdx + 1)}
                    className="px-6 py-2.5 border border-slate-300 text-slate-600 font-bold text-sm rounded-sm hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-2"
                 >
                    Soal Selanjutnya
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                 </button>
               )
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
