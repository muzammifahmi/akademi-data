"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import VsCodeSqlEditor from "@/components/VsCodeSqlEditor";

export default function SiswaKerjakanUjianPage() {
  const params = useParams();
  const router = useRouter();
  const ujianId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [ujian, setUjian] = useState<any>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const [doubtful, setDoubtful] = useState<string[]>([]);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [violations, setViolations] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const hasAutoSubmittedRef = useRef(false);
  const answersRef = useRef(answers);
  const violationsRef = useRef(violations);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    violationsRef.current = violations;
  }, [violations]);

  useEffect(() => {
    if (!ujianId) return;
    fetch(`/api/siswa/ujian/${ujianId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.isScheduled) {
            setIsScheduled(true);
            setScheduledDate(data.jadwal || "");
            setUjian(data.data);
            return;
          }
          setUjian(data.data);
          if (data.submission) {
            setAnswers(data.submission.answers || {});
            setResults(data.submission.results || {});
            setSubmittedScore(data.submission.score);
            setViolations(data.submission.violations || 0);
            setSecondsLeft(0);
          } else {
            const durationSec = (data.data.durasi_menit || 60) * 60;
            const storageKey = `exam_start_${ujianId}`;
            const savedStart =
              typeof window !== "undefined"
                ? localStorage.getItem(storageKey)
                : null;
            if (savedStart) {
              const elapsed = Math.floor(
                (Date.now() - Number(savedStart)) / 1000
              );
              const remaining = Math.max(0, durationSec - elapsed);
              setSecondsLeft(remaining);
            } else {
              if (typeof window !== "undefined") {
                localStorage.setItem(storageKey, String(Date.now()));
              }
              setSecondsLeft(durationSec);
            }
          }
        } else {
          setErrorMessage(data.error || "Sesi ujian tidak ditemukan.");
        }
      })
      .catch((err) => {
        console.error("Gagal memuat ujian:", err);
        setErrorMessage("Gagal memuat sesi ujian.");
      })
      .finally(() => setLoading(false));
  }, [ujianId]);

  // Sinkronisasi navigasi soal dengan sidebar kiri (Menu.tsx)
  useEffect(() => {
    const handleNav = (e: any) => {
      setActiveIdx(e.detail);
    };
    window.addEventListener("exercise-nav-clicked", handleNav);
    return () => window.removeEventListener("exercise-nav-clicked", handleNav);
  }, []);

  useEffect(() => {
    const answeredIds = Object.keys(answers).filter(
      (k) => answers[k] !== undefined && answers[k].trim() !== ""
    );
    window.dispatchEvent(
      new CustomEvent("exercise-state-updated", {
        detail: {
          answeredIds,
          doubtfulIds: doubtful,
          activeIdx,
          results,
          isSubmitted: submittedScore !== null,
        },
      })
    );
  }, [answers, doubtful, activeIdx, ujian, results, submittedScore]);

  const executeSubmit = async (isAutoSubmit = false) => {
    if (
      !ujian?.questions?.length ||
      isSubmitting ||
      (isAutoSubmit && hasAutoSubmittedRef.current)
    )
      return;

    if (isAutoSubmit) {
      hasAutoSubmittedRef.current = true;
      Swal.fire({
        title: "Waktu Ujian Habis!",
        text: "Waktu pengerjaan telah selesai. Sistem sedang mengumpulkan seluruh jawaban Anda...",
        icon: "info",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    }

    setIsSubmitting(true);
    try {
      const currentAnswers = answersRef.current;
      const currentViolations = violationsRef.current;

      const res = await fetch(`/api/siswa/ujian/${ujianId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: currentAnswers,
          violations: currentViolations,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (typeof window !== "undefined") {
          localStorage.removeItem(`exam_start_${ujianId}`);
        }
        setSubmittedScore(data.score);
        setResults(data.results || data.submission?.results || {});
        await Swal.fire({
          icon: "success",
          title: isAutoSubmit
            ? "Waktu Habis - Ujian Selesai!"
            : "Ujian Selesai Dinilai!",
          html: `Jawaban Anda berhasil dievaluasi otomatis.<br/>Skor Akhir Ujian: <b style="font-size:22px;color:#0D47A1">${data.score} / 100</b><br/><span style="font-size:12px;color:#64748b">Status: <b>${data.score >= 70 ? "Lulus" : "Perlu Bimbingan"}</b></span>`,
          confirmButtonColor: "#2196F3",
        });
      } else {
        Swal.fire("Gagal", data.error || "Gagal mengumpulkan ujian", "error");
      }
    } catch {
      Swal.fire(
        "Error",
        "Terjadi kesalahan sistem saat mengumpulkan ujian",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Countdown timer jika belum dikumpulkan (Auto-submit saat waktu habis)
  useEffect(() => {
    if (submittedScore !== null || secondsLeft === null) return;

    if (secondsLeft <= 0) {
      if (!hasAutoSubmittedRef.current && !isSubmitting && ujian) {
        executeSubmit(true);
      }
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submittedScore, secondsLeft, isSubmitting, ujian]);

  // Deteksi pindah tab (Proctoring)
  useEffect(() => {
    if (!ujian?.proctoring || submittedScore !== null) return;
    const handleVisibility = () => {
      if (document.hidden) {
        setViolations((v) => v + 1);
        Swal.fire({
          icon: "warning",
          title: "Peringatan Proctoring!",
          text: "Anda terdeteksi meninggalkan halaman ujian. Aktivitas ini dicatat oleh sistem pengawas.",
          confirmButtonColor: "#2196F3",
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [ujian, submittedScore]);

  const formatTimer = (sec: number | null) => {
    if (sec === null) return "--:--";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const toggleDoubtful = (qId: string) => {
    setDoubtful((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handleSubmitExam = async () => {
    if (!ujian?.questions?.length || isSubmitting) return;

    const confirm = await Swal.fire({
      title: "Kumpulkan Jawaban Ujian?",
      text: "Pastikan seluruh butir soal telah Anda periksa sebelum dikumpulkan.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2196F3",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Ya, Kumpulkan",
      cancelButtonText: "Periksa Lagi",
    });

    if (!confirm.isConfirmed) return;
    executeSubmit(false);
  };

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
        <div className="bg-white border border-slate-200 rounded-sm p-12 text-center text-slate-500">
          Memuat soal ujian...
        </div>
      </main>
    );
  }

  if (isScheduled) {
    return (
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-sm p-8 text-center shadow-xs">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-sm text-xs font-bold inline-block mb-2">
            Status: Sesi Terjadwal
          </span>
          <h1 className="text-xl font-bold text-slate-800 mb-2">{ujian?.judul || "Ujian Terjadwal"}</h1>
          <p className="text-sm text-slate-500 mb-6">
            Ujian ini belum dapat dimulai. Soal ujian akan otomatis terbuka pada jadwal pelaksanaan berikut:
          </p>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm inline-block text-sm font-semibold text-slate-700 mb-6">
            📅 {scheduledDate ? new Date(scheduledDate).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" }) : "-"}
          </div>
          <div>
            <Link
              href="/siswa/riwayat"
              className="px-5 py-2.5 bg-[#2196F3] hover:bg-[#1976D2] text-white text-xs font-bold rounded-sm transition shadow-xs inline-flex items-center gap-2"
            >
              ← Kembali ke Riwayat Ujian
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!ujian) {
    return (
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-sm p-8 text-center shadow-xs">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-slate-700 font-semibold mb-4">{errorMessage || "Sesi ujian tidak ditemukan atau tidak tersedia."}</p>
          <Link
            href="/siswa/riwayat"
            className="px-4 py-2 bg-[#2196F3] text-white text-xs font-bold rounded-sm inline-block"
          >
            Kembali ke Riwayat Ujian
          </Link>
        </div>
      </main>
    );
  }

  const questions = ujian.questions || [];
  const safeIdx = Math.min(activeIdx, Math.max(0, questions.length - 1));
  const currentQ = questions[safeIdx];
  const isReadOnly = submittedScore !== null;

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC] space-y-6">
      {/* Header Ujian */}
      <div className="bg-[#0D47A1] text-white p-5 sm:p-6 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {ujian.proctoring && (
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-indigo-500/40 border border-indigo-300/40 rounded-sm text-[10px] font-bold uppercase">
                Proctoring Aktif
              </span>
            </div>
          )}
          <h1 className="text-xl font-bold">{ujian.judul}</h1>
          {ujian.deskripsi && (
            <p className="text-xs text-blue-100 mt-0.5">{ujian.deskripsi}</p>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {submittedScore !== null ? (
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 border border-emerald-300/40 px-4 py-2 rounded-sm text-right">
                <div className="text-[10px] font-bold uppercase text-emerald-200">
                  Nilai Ujian Anda ({submittedScore >= 70 ? "Lulus" : "Perlu Bimbingan"})
                </div>
                <div className="text-2xl font-extrabold text-white">
                  {submittedScore} / 100
                </div>
              </div>
              <Link
                href="/siswa/riwayat"
                className="px-4 py-2.5 bg-white text-[#0D47A1] hover:bg-blue-50 font-bold text-xs rounded-sm shadow-sm transition"
              >
                Kembali ke Riwayat
              </Link>
            </div>
          ) : (
            <div
              className={`border px-4 py-2 rounded-sm text-right transition-all duration-300 ${
                secondsLeft !== null && secondsLeft <= 60
                  ? "bg-rose-950/90 border-rose-500 text-rose-200 animate-pulse"
                  : "bg-blue-950/80 border-blue-700 text-white"
              }`}
            >
              <div
                className={`text-[10px] font-bold uppercase ${
                  secondsLeft !== null && secondsLeft <= 60
                    ? "text-rose-300 font-extrabold"
                    : "text-blue-200"
                }`}
              >
                {secondsLeft !== null && secondsLeft <= 60
                  ? "Sisa Waktu (Segera Habis)"
                  : "Sisa Waktu"}
              </div>
              <div
                className={`text-xl font-mono font-extrabold ${
                  secondsLeft !== null && secondsLeft <= 60
                    ? "text-rose-300"
                    : "text-white"
                }`}
              >
                {formatTimer(secondsLeft)}
              </div>
            </div>
          )}

          {!isReadOnly && (
            <button
              type="button"
              onClick={handleSubmitExam}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-sm shadow-sm transition cursor-pointer"
            >
              {isSubmitting ? "Mengumpulkan..." : "Selesai & Kumpulkan"}
            </button>
          )}
        </div>
      </div>

      {/* Konten Soal (Lebar Penuh, Navigasi di Sidebar Kiri) */}
      <div className="w-full">
        {currentQ ? (
          <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-xs space-y-5">
            {/* Banner Hasil Penilaian (Mode Review / Sudah Dikumpulkan) */}
            {isReadOnly && results[currentQ.id] && (
              <div
                className={`p-4 rounded-sm border flex items-center justify-between text-xs animate-in fade-in ${
                  results[currentQ.id].isCorrect
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                    : "bg-rose-50 border-rose-300 text-rose-950"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                      results[currentQ.id].isCorrect ? "bg-emerald-600" : "bg-rose-600"
                    }`}
                  >
                    {results[currentQ.id].isCorrect ? "✓" : "✕"}
                  </span>
                  <div>
                    <span className="font-bold text-sm block">
                      {results[currentQ.id].isCorrect
                        ? "Jawaban Anda Benar!"
                        : "Jawaban Kurang Tepat"}
                    </span>
                    <span className="opacity-90 block mt-0.5">
                      {results[currentQ.id].feedback ||
                        (results[currentQ.id].isCorrect
                          ? "Hasil pengerjaan sesuai dengan kunci jawaban."
                          : "Hasil pengerjaan belum sesuai dengan kunci jawaban.")}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span
                    className={`px-3 py-1 font-extrabold rounded-sm text-xs inline-block ${
                      results[currentQ.id].isCorrect
                        ? "bg-emerald-200 text-emerald-900 border border-emerald-300"
                        : "bg-rose-200 text-rose-900 border border-rose-300"
                    }`}
                  >
                    {results[currentQ.id].isCorrect
                      ? `+${results[currentQ.id].earnedScore || currentQ.scoreWeight} / ${currentQ.scoreWeight} Poin`
                      : `0 / ${currentQ.scoreWeight} Poin`}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-extrabold text-[#0D47A1]">
                  Soal {safeIdx + 1}
                </span>
                <span className="px-2.5 py-0.5 rounded-sm text-xs font-bold bg-blue-50 text-[#2196F3]">
                  {currentQ.type === "sql_query"
                    ? `Query SQL (${currentQ.queryType || "DQL"})`
                    : "Pilihan Ganda"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {!isReadOnly && (
                  <label className="flex items-center gap-1.5 text-xs font-bold text-amber-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={doubtful.includes(currentQ.id)}
                      onChange={() => toggleDoubtful(currentQ.id)}
                      className="w-4 h-4 accent-amber-500"
                    />
                    Ragu-ragu
                  </label>
                )}
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-sm text-xs font-bold">
                  Bobot: {currentQ.scoreWeight || 10} Poin
                </span>
              </div>
            </div>

            {/* Instruksi Soal */}
            <div
              className="prose prose-sm max-w-none text-slate-800"
              dangerouslySetInnerHTML={{
                __html: currentQ.instruction || "<p>Kerjakan soal berikut.</p>",
              }}
            />

            {/* Area Jawaban */}
            {currentQ.type === "sql_query" ? (
              <VsCodeSqlEditor
                key={currentQ.id}
                value={answers[currentQ.id] || ""}
                onChange={(val) =>
                  setAnswers((prev) => ({ ...prev, [currentQ.id]: val }))
                }
                disabled={isReadOnly}
                queryType={currentQ.queryType || "DQL"}
                tables={currentQ.tables || []}
                answerTables={currentQ.answerTables || []}
                sqlAnswerKey={currentQ.sqlAnswerKey || ""}
                fileName={`ujian_soal_${safeIdx + 1}.sql`}
              />
            ) : (
              <div className="space-y-2.5">
                {(currentQ.options || []).map((opt: any, oIdx: number) => {
                  const isSelected = answers[currentQ.id] === opt.id;
                  const isCorrectOpt =
                    opt.isCorrect ||
                    opt.id === results[currentQ.id]?.correctAnswer;

                  let borderBg = "border-slate-200 bg-white hover:border-blue-200";
                  if (isReadOnly) {
                    if (isCorrectOpt) {
                      borderBg = "border-emerald-500 bg-emerald-50/80 text-emerald-950 font-medium";
                    } else if (isSelected && !isCorrectOpt) {
                      borderBg = "border-rose-400 bg-rose-50/80 text-rose-950";
                    } else {
                      borderBg = "border-slate-200 bg-slate-50/40 opacity-70";
                    }
                  } else if (isSelected) {
                    borderBg = "border-[#2196F3] bg-blue-50/50";
                  }

                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center justify-between p-3.5 border rounded-sm transition ${
                        isReadOnly ? "cursor-default" : "cursor-pointer"
                      } ${borderBg}`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`q_${currentQ.id}`}
                          disabled={isReadOnly}
                          checked={isSelected}
                          onChange={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [currentQ.id]: opt.id,
                            }))
                          }
                          className="w-4 h-4 accent-[#2196F3]"
                        />
                        <span className="font-bold text-xs text-slate-500">
                          {String.fromCharCode(65 + oIdx)}.
                        </span>
                        <span className="text-sm text-slate-800">{opt.text}</span>
                      </div>

                      {isReadOnly && (
                        <div className="text-xs font-bold shrink-0 ml-2">
                          {isCorrectOpt && (
                            <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-sm">
                              ✓ Kunci Jawaban Benar
                            </span>
                          )}
                          {isSelected && !isCorrectOpt && (
                            <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded-sm">
                              ✕ Pilihan Anda (Salah)
                            </span>
                          )}
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            )}

            {/* Navigasi Bawah */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={safeIdx === 0}
                onClick={() => setActiveIdx(Math.max(0, safeIdx - 1))}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-sm disabled:opacity-40 cursor-pointer"
              >
                &larr; Soal Sebelumnya
              </button>

              <span className="text-xs font-bold text-slate-500">
                {safeIdx + 1} / {questions.length || 1}
              </span>

              {safeIdx < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setActiveIdx(Math.min(questions.length - 1, safeIdx + 1))
                  }
                  className="px-4 py-2 text-xs font-bold text-white bg-[#2196F3] hover:bg-blue-600 rounded-sm cursor-pointer"
                >
                  Soal Selanjutnya &rarr;
                </button>
              ) : isReadOnly ? (
                <button
                  type="button"
                  onClick={() => router.push("/siswa/riwayat")}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0D47A1] hover:bg-blue-900 rounded-sm cursor-pointer"
                >
                  Selesai Ulasan &rarr;
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitExam}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-sm cursor-pointer"
                >
                  {isSubmitting ? "Mengumpulkan..." : "Selesai & Kumpulkan"}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
