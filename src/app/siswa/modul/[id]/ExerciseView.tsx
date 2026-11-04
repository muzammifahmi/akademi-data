"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import FinishModuleButton from '../../components/FinishModuleButton';

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
      detail: { answeredIds, doubtfulIds: doubtful, activeIdx }
    }));
  }, [answers, doubtful, activeIdx]);

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
    // Basic client-side grading (In a real app, this should be done on the server)
    let totalScore = 0;
    let maxScore = 0;

    subBab.questions.forEach((q: any) => {
      maxScore += q.scoreWeight || 10;
      const userAnswer = answers[q.id];

      if (q.type === 'multiple_choice') {
        const correctOption = q.options.find((o: any) => o.isCorrect);
        if (correctOption && userAnswer === correctOption.id) {
          totalScore += q.scoreWeight || 10;
        }
      } else if (q.type === 'sql_query') {
        // Simple string matching for SQL query
        const normalizedAnswer = (userAnswer || '').trim().toLowerCase().replace(/\s+/g, ' ');
        const normalizedKey = (q.sqlAnswerKey || '').trim().toLowerCase().replace(/\s+/g, ' ');
        
        if (normalizedAnswer === normalizedKey) {
          totalScore += q.scoreWeight || 10;
        }
      }
    });

    const finalScore = Math.round((totalScore / maxScore) * 100);
    
    // Save to database
    try {
      const res = await fetch('/api/progress/exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modul_id: modulId,
          sub_bab_id: subBab._id?.toString() || `${currentBabIdx}-${currentSubIdx}`,
          score: finalScore,
          answers
        })
      });
      const data = await res.json();
      if (data.success) {
        setScore(finalScore);
        await Swal.fire({
          title: 'Latihan Selesai!',
          text: `Nilai Anda: ${finalScore}`,
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
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
      <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-sm border border-orange-200">
              Latihan Soal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
            {subBab.title}
          </h1>
          <p className="text-slate-600">Kerjakan soal-soal di bawah ini dengan benar.</p>
        </div>
        <button 
          onClick={() => router.push(`/siswa/modul/${modulId}?bab=${currentBabIdx}&sub=${currentSubIdx}`)}
          className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-sm transition-colors shadow-sm"
        >
          Kembali ke Materi
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Konten Soal */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col gap-10 scroll-smooth">
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
                <div id={`question-${index}`} key={q.id} className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden scroll-mt-6">
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
                      Bobot: {q.scoreWeight || 10}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div 
                    className="prose prose-sm max-w-none mb-6" 
                    dangerouslySetInnerHTML={{ __html: q.instruction }} 
                  />
                  
                  {q.type === 'multiple_choice' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options?.map((opt: any, oIdx: number) => (
                        <label 
                          key={opt.id} 
                          className={`flex items-start gap-3 p-3 border rounded-sm cursor-pointer transition-colors ${
                            answers[q.id] === opt.id 
                              ? 'border-[#2196F3] bg-blue-50/50' 
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name={`question_${q.id}`} 
                            value={opt.id}
                            checked={answers[q.id] === opt.id}
                            onChange={() => handleOptionChange(q.id, opt.id)}
                            className="mt-1 w-4 h-4 text-[#2196F3] shrink-0"
                            disabled={score !== null}
                          />
                          <div className="flex-1 text-sm text-slate-700">
                            <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                            {opt.text}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'sql_query' && (
                    <div className="space-y-4">
                      {q.tables && q.tables.filter((t: any) => t.name && t.columns?.some((c: any) => c.name)).length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Skema & Data Tabel Referensi</h4>
                          <div className="grid grid-cols-1 gap-3">
                            {q.tables.filter((t: any) => t.name && t.columns?.some((c: any) => c.name)).map((tbl: any, tIdx: number) => {
                              const validCols = (tbl.columns || []).filter((c: any) => c.name);
                              return (
                                <div key={tbl.id || tIdx} className="border border-slate-200 rounded-sm overflow-hidden bg-slate-50/50">
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
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jawaban Query SQL</label>
                        <textarea 
                          rows={5}
                          placeholder="Tuliskan query SQL Anda di sini..."
                          value={answers[q.id] || ''}
                          onChange={(e) => handleSqlChange(q.id, e.target.value)}
                          disabled={score !== null}
                          className="w-full px-4 py-3 border border-slate-700 rounded-sm focus:outline-none focus:border-[#2196F3] font-mono text-sm bg-slate-900 text-green-400 disabled:opacity-75"
                        />
                      </div>
                    </div>
                  )}
                </div>
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
               <div className="text-sm font-bold text-slate-800">
                 Nilai: <span className={score >= 70 ? 'text-green-600' : 'text-red-500'}>{score}</span>/100
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
