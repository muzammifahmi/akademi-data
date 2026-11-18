"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  SqlInlineGuide,
  SqlTutorialModal,
  AnswerTableBuilder,
  SqlTemplatePayload,
} from "../components/SqlTutorialHelper";
import VsCodeSqlEditor from "@/components/VsCodeSqlEditor";
import JoditEditor from "@/components/SafeJoditEditor";

export default function ExamBuilder({ ujianId }: { ujianId?: string }) {
  const router = useRouter();
  const isEditMode = Boolean(ujianId);

  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pengaturan Sesi Ujian
  const [currentStep, setCurrentStep] = useState(isEditMode ? 2 : 1);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [durasiMenit, setDurasiMenit] = useState<number>(60);
  const [jadwal, setJadwal] = useState("");
  const [proctoring, setProctoring] = useState(true);
  const [status, setStatus] = useState<"Draft" | "Terjadwal" | "Aktif">("Aktif");

  // Daftar Butir Soal Ujian
  const [questions, setQuestions] = useState<any[]>([
    {
      id: `q_${Date.now()}`,
      type: "sql_query",
      instruction: "",
      sqlAnswerKey: "",
      queryType: "DQL",
      targetTable: "",
      tables: [],
      answerTables: [],
      scoreWeight: 20,
      options: [],
    },
  ]);

  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [activeMode, setActiveMode] = useState<"editor" | "preview">("editor");
  const [studentPreviewSql, setStudentPreviewSql] = useState("");
  const [studentPreviewOption, setStudentPreviewOption] = useState("");

  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [tutorialInitialTab, setTutorialInitialTab] = useState<
    "alur" | "DQL" | "DML" | "DDL"
  >("alur");

  const questionEditorConfig = React.useMemo(
    () => ({
      readonly: false,
      placeholder: "Tuliskan pertanyaan atau instruksi soal di sini...",
      minHeight: 150,
      toolbarAdaptive: false,
      addNewLine: false,
      addNewLineOnDBLClick: false,
      controls: {
        ol: {
          list: {
            default: "1, 2, 3...",
            "lower-alpha": "a, b, c...",
            "lower-greek": "α, β, γ...",
            "lower-roman": "i, ii, iii...",
            "upper-alpha": "A, B, C...",
            "upper-roman": "I, II, III...",
          },
        },
        ul: {
          list: {
            default: "●  ●  ●",
            circle: "○  ○  ○",
            square: "■  ■  ■",
          },
        },
      },
      uploader: {
        url: "/api/upload",
        format: "json",
        isSuccess: (resp: any) => resp.success,
        process: (resp: any) => ({
          files: resp.data.files || [],
          path: resp.data.path,
          baseurl: resp.data.baseurl,
          isImages: resp.data.isImages,
          error: resp.error ? 1 : 0,
          message: resp.error || "",
        }),
        defaultHandlerSuccess: function (data: any) {
          if (data.files && data.files.length) {
            for (let i = 0; i < data.files.length; i++) {
              const fileUrl = data.baseurl + data.files[i];
              const isImage = data.isImages && data.isImages[i];
              if (isImage) {
                (this as any).s.insertImage(fileUrl);
              } else {
                const videoTag = `<video style="max-width: 100%; width: 600px; height: auto;" controls><source src="${fileUrl}" type="video/mp4">Your browser does not support the video tag.</video><p><br></p>`;
                (this as any).s.insertHTML(videoTag);
              }
            }
          }
        },
      },
      buttons: [
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "ul",
        "ol",
        "|",
        "font",
        "fontsize",
        "brush",
        "paragraph",
        "|",
        "image",
        "video",
        "table",
        "link",
        "|",
        "align",
        "undo",
        "redo",
        "|",
        "hr",
        "eraser",
        "fullsize",
      ],
    }),
    []
  );

  useEffect(() => {
    const loadInitial = async () => {
      setIsLoading(true);
      try {
        const resClasses = await fetch("/api/ujian");
        const dataClasses = await resClasses.json();
        if (dataClasses.success) {
          setClasses(dataClasses.classes || []);
          if (!isEditMode && dataClasses.classes?.length > 0) {
            setKelasId(dataClasses.classes[0].id);
          }
        }

        if (ujianId) {
          const resDetail = await fetch(`/api/ujian/${ujianId}`);
          const dataDetail = await resDetail.json();
          if (dataDetail.success && dataDetail.data) {
            const u = dataDetail.data;
            setJudul(u.judul || "");
            setDeskripsi(u.deskripsi || "");
            setKelasId(u.kelas_id?.toString() || "");
            setDurasiMenit(u.durasi_menit || 60);
            setJadwal(u.jadwal || "");
            setProctoring(Boolean(u.proctoring));
            setStatus(u.status || "Aktif");
            if (Array.isArray(u.questions) && u.questions.length > 0) {
              setQuestions(u.questions);
            }
            setCurrentStep(2);
          }
        }
      } catch (err) {
        console.error("Gagal memuat data ujian:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitial();
  }, [ujianId, isEditMode]);

  const generateInitSchemaPreview = (tables: any[]) => {
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
            !["DATE", "DATETIME", "BOOLEAN", "TEXT"].includes(c.type)
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
                const val = row[c.id];
                if (val === undefined || val === "") return "NULL";
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
  };

  const mutateQuestions = (updater: (draft: any[]) => void) => {
    setQuestions((prev) => {
      const cloned = JSON.parse(JSON.stringify(prev));
      updater(cloned);
      return cloned;
    });
  };

  const addQuestion = (type: "sql_query" | "multiple_choice") => {
    const newQ =
      type === "sql_query"
        ? {
            id: `q_${Date.now()}`,
            type: "sql_query",
            instruction: "",
            sqlAnswerKey: "",
            queryType: "DQL",
            targetTable: "",
            tables: [],
            answerTables: [],
            scoreWeight: 20,
            options: [],
          }
        : {
            id: `q_${Date.now()}`,
            type: "multiple_choice",
            instruction: "",
            sqlAnswerKey: "",
            queryType: "DQL",
            targetTable: "",
            tables: [],
            answerTables: [],
            scoreWeight: 10,
            options: [
              { id: `opt_${Date.now()}_1`, text: "", isCorrect: true },
              { id: `opt_${Date.now()}_2`, text: "", isCorrect: false },
              { id: `opt_${Date.now()}_3`, text: "", isCorrect: false },
              { id: `opt_${Date.now()}_4`, text: "", isCorrect: false },
            ],
          };

    setQuestions((prev) => {
      const next = [...prev, newQ];
      setActiveQuestionIdx(next.length - 1);
      return next;
    });
    setActiveMode("editor");
  };

  const deleteQuestion = (qId: string) => {
    if (questions.length <= 1) {
      Swal.fire(
        "Perhatian",
        "Ujian harus memiliki minimal 1 butir soal.",
        "warning"
      );
      return;
    }
    setQuestions((prev) => {
      const next = prev.filter((q) => q.id !== qId);
      setActiveQuestionIdx((idx) => Math.max(0, Math.min(idx, next.length - 1)));
      return next;
    });
  };

  const updateQuestion = (qId: string, field: string, value: any) => {
    mutateQuestions((draft) => {
      const q = draft.find((x) => x.id === qId);
      if (q) q[field] = value;
    });
  };

  const addOption = (qId: string) => {
    mutateQuestions((draft) => {
      const q = draft.find((x) => x.id === qId);
      if (q) {
        if (!q.options) q.options = [];
        q.options.push({
          id: `opt_${Date.now()}`,
          text: "",
          isCorrect: q.options.length === 0,
        });
      }
    });
  };

  const updateOption = (qId: string, optId: string, text: string) => {
    mutateQuestions((draft) => {
      const q = draft.find((x) => x.id === qId);
      const opt = q?.options?.find((o: any) => o.id === optId);
      if (opt) opt.text = text;
    });
  };

  const setCorrectOption = (qId: string, optId: string) => {
    mutateQuestions((draft) => {
      const q = draft.find((x) => x.id === qId);
      q?.options?.forEach((o: any) => {
        o.isCorrect = o.id === optId;
      });
    });
  };

  const deleteOption = (qId: string, optId: string) => {
    mutateQuestions((draft) => {
      const q = draft.find((x) => x.id === qId);
      if (q && q.options && q.options.length > 2) {
        q.options = q.options.filter((o: any) => o.id !== optId);
        if (!q.options.some((o: any) => o.isCorrect)) {
          q.options[0].isCorrect = true;
        }
      }
    });
  };

  const handleSaveExam = async () => {
    if (!judul.trim()) {
      Swal.fire("Perhatian", "Judul sesi ujian wajib diisi.", "warning");
      return;
    }
    if (!kelasId) {
      Swal.fire("Perhatian", "Pilih kelas tujuan ujian terlebih dahulu.", "warning");
      return;
    }
    if (questions.length === 0) {
      Swal.fire(
        "Perhatian",
        "Tambahkan minimal 1 butir soal ke dalam ujian.",
        "warning"
      );
      return;
    }
    if (status === "Terjadwal" && !jadwal) {
      Swal.fire({
        icon: "warning",
        title: "Jadwal Belum Ditentukan",
        text: "Untuk sesi ujian berstatus Terjadwal, silakan tentukan tanggal dan jam Jadwal Pelaksanaan terlebih dahulu.",
        confirmButtonColor: "#2196F3",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        judul,
        deskripsi,
        kelas_id: kelasId,
        durasi_menit: Number(durasiMenit) || 60,
        jadwal,
        proctoring,
        status,
        questions,
      };

      const res = await fetch(
        isEditMode ? `/api/ujian/${ujianId}` : "/api/ujian",
        {
          method: isEditMode ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();

      if (data.success) {
        await Swal.fire({
          icon: "success",
          title: isEditMode
            ? "Ujian & Soal Diperbarui!"
            : "Sesi & Soal Ujian Diterbitkan!",
          text: `Ujian "${judul}" dengan ${questions.length} butir soal berhasil disimpan.`,
          confirmButtonColor: "#2196F3",
        });
        router.push("/guru/ujian");
      } else {
        Swal.fire("Gagal", data.error || "Gagal menyimpan ujian", "error");
      }
    } catch {
      Swal.fire("Error", "Terjadi kesalahan sistem saat menyimpan ujian", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeIdx = Math.min(activeQuestionIdx, Math.max(0, questions.length - 1));
  const activeQuestion = questions[safeIdx];
  const totalBobot = questions.reduce(
    (acc, q) => acc + (Number(q.scoreWeight) || 0),
    0
  );

  const handleDistributeWeights = () => {
    if (questions.length === 0) return;
    const baseWeight = Math.floor(100 / questions.length);
    const remainder = 100 % questions.length;
    setQuestions((prev) =>
      prev.map((q, idx) => ({
        ...q,
        scoreWeight: idx < remainder ? baseWeight + 1 : baseWeight,
      }))
    );
    Swal.fire({
      icon: "success",
      title: "Bobot Dibagi Rata!",
      text: `Total bobot ${questions.length} butir soal berhasil dibagi rata menjadi 100 poin.`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
        <div className="bg-white border border-slate-200 rounded-sm p-12 text-center text-slate-500">
          Memuat editor sesi &amp; soal ujian...
        </div>
      </main>
    );
  }

  const currentClass = classes.find((c) => String(c.id) === String(kelasId));
  const currentClassName = currentClass
    ? `${currentClass.nama} (${currentClass.kodeKelas})`
    : "Belum Ditentukan";

  // Langkah Awal: Wajib input judul ujian & catatan (opsional) sebelum membuat butir soal
  if (currentStep === 1 && !isEditMode) {
    return (
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
        <div className="mb-6">
          <div className="flex items-center text-sm text-slate-500 mb-4">
            <Link
              href="/guru/ujian"
              className="hover:text-[#2196F3] transition-colors"
            >
              Kelola Ujian
            </Link>
            <svg
              className="w-4 h-4 mx-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="text-slate-800 font-medium">Buat Sesi Ujian Baru</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#2196F3]"></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Buat Sesi &amp; Soal Ujian
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                Lengkapi identitas dasar sesi ujian sebelum menyusun butir-butir soal.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/guru/ujian")}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-sm transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Batal &amp; Kembali
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri: Form Kerangka Dasar Ujian */}
          <div className="lg:col-span-2 flex flex-col space-y-6">
            <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">
                  1. Kerangka Dasar Ujian
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Lengkapi identitas dasar ujian sebelum menyusun butir-butir soal.
                </p>
              </div>

              <div className="p-6 flex-1 flex flex-col space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Judul Sesi Ujian <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    type="text"
                    placeholder="Contoh: UTS Praktikum Basis Data SQL Semester Ganjil"
                    className="w-full px-4 py-3 border border-slate-200 rounded-sm focus:outline-none focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] transition-all text-slate-700"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Kelas Peserta <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={kelasId}
                      onChange={(e) => setKelasId(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-sm bg-white focus:outline-none focus:border-[#2196F3] text-slate-700"
                    >
                      <option value="">-- Pilih Kelas Peserta --</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nama} ({c.kodeKelas})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Status Sesi <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-sm bg-white focus:outline-none focus:border-[#2196F3] text-slate-700"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Terjadwal">Terjadwal</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>

                {/* Inputan Jadwal Pelaksanaan HANYA muncul jika status Terjadwal */}
                {status === "Terjadwal" && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-sm animate-in fade-in">
                    <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                      Jadwal Pelaksanaan Ujian <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={jadwal}
                      onChange={(e) => setJadwal(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border border-amber-300 rounded-sm bg-white focus:outline-none focus:border-[#2196F3]"
                    />
                    <p className="text-xs text-amber-700 mt-1.5">
                      Siswa di kelas peserta hanya dapat melihat jadwal dan baru dapat mengerjakan lembar ujian pada waktu yang ditentukan di atas.
                    </p>
                  </div>
                )}

                {status === "Aktif" && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm text-xs text-emerald-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span><b>Aktif:</b> Jika terbit langsung bisa dikerjakan dengan durasi yang sudah ditentukan ({durasiMenit} menit).</span>
                  </div>
                )}

                {status === "Draft" && (
                  <div className="p-3 bg-slate-100 border border-slate-300 rounded-sm text-xs text-slate-700 flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span><b>Draft:</b> Baru masuk ke siswa jika dipindah menjadi aktif atau terjadwal.</span>
                  </div>
                )}

                <div className="flex-1 flex flex-col">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Catatan / Deskripsi Ujian{" "}
                    <span className="text-slate-400 text-xs font-normal">
                      (Opsional)
                    </span>
                  </label>
                  <textarea
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    placeholder="Tuliskan catatan atau instruksi pengerjaan ujian untuk siswa..."
                    className="flex-1 w-full px-4 py-3 border border-slate-200 rounded-sm focus:outline-none focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] resize-none transition-all text-slate-700 min-h-[140px]"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 bg-slate-50 p-6 flex justify-end mt-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (!judul.trim()) {
                      Swal.fire({
                        icon: "warning",
                        title: "Judul Ujian Wajib Diisi",
                        text: "Silakan masukkan judul ujian terlebih dahulu sebelum menyusun butir soal.",
                        confirmButtonColor: "#2196F3",
                      });
                      return;
                    }
                    if (!kelasId) {
                      Swal.fire({
                        icon: "warning",
                        title: "Pilih Kelas",
                        text: "Silakan pilih kelas peserta terlebih dahulu.",
                        confirmButtonColor: "#2196F3",
                      });
                      return;
                    }
                    if (status === "Terjadwal" && !jadwal) {
                      Swal.fire({
                        icon: "warning",
                        title: "Jadwal Belum Ditentukan",
                        text: "Untuk sesi ujian berstatus Terjadwal, silakan tentukan tanggal dan jam Jadwal Pelaksanaan terlebih dahulu.",
                        confirmButtonColor: "#2196F3",
                      });
                      return;
                    }
                    setCurrentStep(2);
                  }}
                  className="px-8 py-2.5 text-sm font-semibold text-white bg-[#0D47A1] hover:bg-[#0A367A] rounded-sm transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  Selanjutnya: Susun Butir Soal
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Proses Pembuatan (seperti kelola modul) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#2196F3]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Proses Pembuatan
              </h3>
              <div className="space-y-6 relative">
                <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-100 -z-10"></div>

                <div className="flex gap-4 relative">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 bg-[#2196F3] border-[#2196F3] text-white shadow-sm z-10 text-xs font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-800">
                      Kerangka Ujian
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Judul, Kelas &amp; Catatan
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 relative opacity-50">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 bg-white border-slate-300 text-slate-400 z-10 text-xs font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-500">
                      Penyusunan Butir Soal
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Soal Pilihan Ganda &amp; Query SQL
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 rounded-sm p-5 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <svg
                  className="w-4 h-4 text-[#2196F3]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Pengaturan Sesi Lanjutan</span>
              </div>
              <p>
                Durasi waktu pengerjaan, jadwal ujian, status, dan proteksi pengawasan (Proctoring) dapat Anda ubah melalui tombol icon pengaturan ⚙️ di tahap berikutnya.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC] space-y-6">
      <SqlTutorialModal
        isOpen={isTutorialModalOpen}
        onClose={() => setIsTutorialModalOpen(false)}
        initialTab={tutorialInitialTab}
        onApplyTemplate={(tpl: SqlTemplatePayload) => {
          if (!activeQuestion) return;
          mutateQuestions((draft) => {
            const qTarget = draft.find((x) => x.id === activeQuestion.id);
            if (qTarget) {
              qTarget.type = "sql_query";
              qTarget.queryType = tpl.queryType;
              qTarget.instruction = tpl.instruction;
              qTarget.targetTable = tpl.targetTable;
              qTarget.tables = tpl.tables;
              qTarget.answerTables = tpl.answerTables;
              qTarget.sqlAnswerKey = tpl.sqlAnswerKey;
            }
          });
        }}
      />

      {/* Modal Pengaturan Sesi & Keamanan Ujian */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-sm shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 bg-[#0D47A1] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-sm bg-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold">Pengaturan Sesi &amp; Keamanan Ujian</h3>
                  <p className="text-xs text-blue-200">
                    Ubah judul, catatan, kelas peserta, durasi, dan proteksi kecurangan ujian.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-white/70 hover:text-white p-1 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Judul Sesi Ujian <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: UTS Praktikum Basis Data SQL"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-sm focus:outline-none focus:border-[#2196F3]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan / Deskripsi Ujian (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Contoh: Kerjakan seluruh soal kueri DDL dan DQL secara mandiri."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-sm focus:outline-none focus:border-[#2196F3]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kelas Peserta <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={kelasId}
                    onChange={(e) => setKelasId(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-sm bg-white focus:outline-none focus:border-[#2196F3]"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama} ({c.kodeKelas})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Durasi (Menit) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={240}
                    value={durasiMenit}
                    onChange={(e) => setDurasiMenit(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-sm focus:outline-none focus:border-[#2196F3]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className={status === "Terjadwal" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : ""}>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Status Sesi <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-sm bg-white focus:outline-none focus:border-[#2196F3]"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Terjadwal">Terjadwal</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>

                  {status === "Terjadwal" && (
                    <div className="animate-in fade-in">
                      <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                        Jadwal Pelaksanaan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={jadwal}
                        onChange={(e) => setJadwal(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm border border-amber-300 rounded-sm bg-white focus:outline-none focus:border-[#2196F3]"
                      />
                    </div>
                  )}
                </div>

                {/* Helper info status */}
                {status === "Aktif" && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm text-xs text-emerald-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span><b>Aktif:</b> Jika terbit langsung bisa dikerjakan dengan durasi yang sudah ditentukan ({durasiMenit} menit).</span>
                  </div>
                )}

                {status === "Terjadwal" && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span><b>Terjadwal:</b> Muncul inputan jadwal pelaksanaan. Siswa baru dapat mengakses lembar ujian pada waktu yang ditentukan.</span>
                  </div>
                )}

                {status === "Draft" && (
                  <div className="p-3 bg-slate-100 border border-slate-300 rounded-sm text-xs text-slate-700 flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span><b>Draft:</b> Baru masuk ke siswa jika dipindah menjadi aktif atau terjadwal.</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <label className="w-full flex items-center gap-3 p-3.5 bg-blue-50/70 border border-blue-200 rounded-sm cursor-pointer hover:bg-blue-50">
                  <input
                    type="checkbox"
                    checked={proctoring}
                    onChange={(e) => setProctoring(e.target.checked)}
                    className="w-4 h-4 accent-[#2196F3]"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Aktifkan Proctoring (Anti Copy-Paste &amp; Deteksi Pindah Tab)
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Sistem akan mencatat dan memperingatkan siswa jika terdeteksi berpindah tab browser.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (status === "Terjadwal" && !jadwal) {
                    Swal.fire({
                      icon: "warning",
                      title: "Jadwal Belum Ditentukan",
                      text: "Untuk sesi ujian berstatus Terjadwal, silakan tentukan tanggal dan jam Jadwal Pelaksanaan terlebih dahulu.",
                      confirmButtonColor: "#2196F3",
                    });
                    return;
                  }
                  setIsSettingsModalOpen(false);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-[#2196F3] hover:bg-[#1976D2] rounded-sm transition cursor-pointer shadow-xs"
              >
                Selesai &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Halaman & Tombol Icon Pengaturan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#2196F3]"></div>
        <div className="pl-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/guru/ujian" className="hover:text-[#2196F3]">
              Kelola Ujian
            </Link>
            <span>/</span>
            <span className="text-slate-600">
              {isEditMode ? "Edit Sesi & Soal Ujian" : "Penyusunan Butir Soal"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {judul || (isEditMode ? "Edit Sesi & Soal Ujian" : "Sesi Ujian Baru")}
          </h1>
          {deskripsi && (
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">{deskripsi}</p>
          )}

          {/* Badge Ringkasan Sesi */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
            <span className="px-2.5 py-0.5 bg-blue-50 text-[#0D47A1] border border-blue-200 rounded-sm font-medium">
              Kelas: <b>{currentClassName}</b>
            </span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-sm font-medium">
              Durasi: <b>{durasiMenit} Menit</b>
            </span>
            <span
              className={`px-2.5 py-0.5 border rounded-sm font-medium ${
                status === "Aktif"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : status === "Terjadwal"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              Status: <b>{status}</b>
            </span>
            {proctoring && (
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-sm font-bold flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Proctoring Aktif
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Tombol Icon Pengaturan */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-3.5 py-2.5 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 hover:border-[#2196F3] rounded-sm transition flex items-center gap-2 cursor-pointer shadow-xs"
            title="Buka Pengaturan Sesi & Keamanan Ujian"
          >
            <svg
              className="w-5 h-5 text-slate-600 hover:text-[#2196F3]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Pengaturan</span>
          </button>

          <Link
            href="/guru/ujian"
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-sm transition"
          >
            Kembali
          </Link>
          <button
            type="button"
            onClick={handleSaveExam}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-bold text-white bg-[#2196F3] hover:bg-[#1976D2] disabled:opacity-50 rounded-sm shadow-sm transition cursor-pointer"
          >
            {isSubmitting
              ? "Menyimpan..."
              : isEditMode
              ? "Simpan Perubahan Ujian"
              : "Simpan & Terbitkan Ujian"}
          </button>
        </div>
      </div>

      {/* PEMBUAT BUTIR SOAL UJIAN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel Kiri/Utama: Editor Butir Soal */}
        <div className="lg:col-span-9 space-y-4">
          {/* Toolbar Tambah Soal & Switch Mode */}
          <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Daftar &amp; Editor Butir Soal Ujian
              </h2>
              <p className="text-xs text-slate-500">
                Tambahkan soal praktikum Query SQL (Auto-Grader) maupun soal Pilihan Ganda.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTutorialInitialTab("alur");
                  setIsTutorialModalOpen(true);
                }}
                className="px-3 py-1.5 bg-[#0D47A1] text-white hover:bg-[#0A367A] text-xs font-semibold rounded-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                Panduan Soal SQL
              </button>
              <button
                type="button"
                onClick={() => addQuestion("multiple_choice")}
                className="px-3 py-1.5 bg-white border border-[#2196F3] text-[#2196F3] hover:bg-blue-50 text-xs font-semibold rounded-sm transition flex items-center gap-1 cursor-pointer"
              >
                + Soal Pilihan Ganda
              </button>
              <button
                type="button"
                onClick={() => addQuestion("sql_query")}
                className="px-3 py-1.5 bg-white border border-[#4CAF50] text-[#4CAF50] hover:bg-green-50 text-xs font-semibold rounded-sm transition flex items-center gap-1 cursor-pointer"
              >
                + Soal Query SQL
              </button>
            </div>
          </div>

          {activeQuestion && (
            <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm">
              {/* Header Soal Aktif */}
              <div className="mb-4 pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 border-b-2 border-[#2196F3] pb-0.5 text-sm">
                    Soal {safeIdx + 1}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-sm ${
                      activeQuestion.type === "sql_query"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-blue-50 text-[#0D47A1] border border-blue-200"
                    }`}
                  >
                    {activeQuestion.type === "sql_query"
                      ? `Query SQL (${activeQuestion.queryType || "DQL"})`
                      : "Pilihan Ganda"}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({safeIdx + 1} dari {questions.length} soal)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safeIdx === 0}
                    onClick={() => setActiveQuestionIdx(Math.max(0, safeIdx - 1))}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-sm disabled:opacity-40 cursor-pointer"
                  >
                    &larr; Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={safeIdx >= questions.length - 1}
                    onClick={() =>
                      setActiveQuestionIdx(
                        Math.min(questions.length - 1, safeIdx + 1)
                      )
                    }
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-sm disabled:opacity-40 cursor-pointer"
                  >
                    Selanjutnya &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStudentPreviewSql("");
                      setActiveMode(activeMode === "editor" ? "preview" : "editor");
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-[#2196F3] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-sm transition cursor-pointer"
                  >
                    {activeMode === "editor" ? "Preview Soal" : "Kembali ke Editor"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteQuestion(activeQuestion.id)}
                    className="text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 p-1.5 rounded-sm border border-slate-200 cursor-pointer"
                    title="Hapus Soal Ini"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {activeMode === "preview" ? (
                /* === SIMULASI TAMPILAN SOAL DI LAYAR SISWA === */
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-sm flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0D47A1]">
                      Simulasi Tampilan Layar Ujian Siswa — Soal {safeIdx + 1} (Bobot:{" "}
                      {activeQuestion.scoreWeight} Poin)
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveMode("editor")}
                      className="text-xs font-bold text-[#2196F3] hover:underline cursor-pointer"
                    >
                      Tutup Preview
                    </button>
                  </div>

                  <div
                    className="p-4 bg-slate-50 border border-slate-200 rounded-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html:
                        activeQuestion.instruction ||
                        "<p><i>Instruksi soal belum diisi.</i></p>",
                    }}
                  />

                  {activeQuestion.type === "sql_query" ? (
                    <VsCodeSqlEditor
                      value={studentPreviewSql}
                      onChange={setStudentPreviewSql}
                      queryType={activeQuestion.queryType || "DQL"}
                      tables={activeQuestion.tables || []}
                      answerTables={activeQuestion.answerTables || []}
                      sqlAnswerKey={activeQuestion.sqlAnswerKey || ""}
                      fileName={`ujian_soal_${safeIdx + 1}.sql`}
                    />
                  ) : (
                    <div className="space-y-2">
                      {(activeQuestion.options || []).map((opt: any, oIdx: number) => (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-3 p-3 border rounded-sm cursor-pointer ${
                            studentPreviewOption === opt.id
                              ? "border-[#2196F3] bg-blue-50/40"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="preview_mc"
                            checked={studentPreviewOption === opt.id}
                            onChange={() => setStudentPreviewOption(opt.id)}
                          />
                          <span className="font-bold text-xs text-slate-600">
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          <span className="text-sm text-slate-800">
                            {opt.text || `Opsi ${String.fromCharCode(65 + oIdx)}`}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* === MODE EDITOR SOAL UJIAN === */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Teks Instruksi / Pertanyaan
                    </label>
                    <div className="border border-slate-200 rounded-sm overflow-hidden prose prose-sm max-w-none prose-slate bg-white">
                      <JoditEditor
                        key={`exam_q_editor_${activeQuestion.id}`}
                        value={activeQuestion.instruction}
                        config={questionEditorConfig}
                        onBlur={(newContent) =>
                          updateQuestion(
                            activeQuestion.id,
                            "instruction",
                            newContent
                          )
                        }
                      />
                    </div>
                  </div>

                  {activeQuestion.type === "sql_query" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Tipe Query SQL
                          </label>
                          <select
                            value={activeQuestion.queryType || "DQL"}
                            onChange={(e) =>
                              updateQuestion(
                                activeQuestion.id,
                                "queryType",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-[#2196F3]"
                          >
                            <option value="DQL">DQL (SELECT)</option>
                            <option value="DML">DML (INSERT/UPDATE/DELETE)</option>
                            <option value="DDL">DDL (CREATE/ALTER)</option>
                          </select>
                        </div>

                        {activeQuestion.queryType === "DML" ? (
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Tabel Target (Opsional)
                            </label>
                            <input
                              type="text"
                              value={activeQuestion.targetTable || ""}
                              onChange={(e) =>
                                updateQuestion(
                                  activeQuestion.id,
                                  "targetTable",
                                  e.target.value
                                )
                              }
                              placeholder="Contoh: mahasiswa"
                              className="w-full px-3 py-2 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-[#2196F3]"
                            />
                          </div>
                        ) : (
                          <div className="md:col-span-2" />
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Bobot Nilai
                          </label>
                          <input
                            type="number"
                            value={activeQuestion.scoreWeight}
                            onChange={(e) =>
                              updateQuestion(
                                activeQuestion.id,
                                "scoreWeight",
                                Number(e.target.value)
                              )
                            }
                            className="w-full px-3 py-2 border border-slate-200 rounded-sm text-base font-bold text-[#2196F3] text-center focus:outline-none focus:border-[#2196F3]"
                          />
                        </div>
                      </div>

                      <SqlInlineGuide
                        queryType={activeQuestion.queryType || "DQL"}
                        onApplyTemplate={(tpl: SqlTemplatePayload) => {
                          mutateQuestions((draft) => {
                            const qTarget = draft.find(
                              (x) => x.id === activeQuestion.id
                            );
                            if (qTarget) {
                              qTarget.queryType = tpl.queryType;
                              qTarget.instruction = tpl.instruction;
                              qTarget.targetTable = tpl.targetTable;
                              qTarget.tables = tpl.tables;
                              qTarget.answerTables = tpl.answerTables;
                              qTarget.sqlAnswerKey = tpl.sqlAnswerKey;
                            }
                          });
                        }}
                        onOpenModal={(tabInit) => {
                          setTutorialInitialTab(tabInit || "alur");
                          setIsTutorialModalOpen(true);
                        }}
                      />

                      {/* INLINE TABLE BUILDER (SKEMA AWAL) */}
                      <div className="border border-slate-300 rounded-sm p-4 bg-slate-50">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-slate-700 text-sm">
                              Skema Database Awal Soal
                            </h4>
                            <p className="text-xs text-slate-500">
                              Tabel yang otomatis tersedia saat siswa mengerjakan soal ini (kosongkan jika soal meminta siswa membuat tabel baru dari nol).
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              mutateQuestions((draft) => {
                                const qTarget = draft.find(
                                  (x) => x.id === activeQuestion.id
                                );
                                if (qTarget) {
                                  if (!qTarget.tables) qTarget.tables = [];
                                  qTarget.tables.push({
                                    id: `tbl_${Date.now()}`,
                                    name: "",
                                    columns: [],
                                    rows: [],
                                  });
                                }
                              });
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs font-bold text-blue-600 hover:bg-slate-100 shadow-xs cursor-pointer shrink-0"
                          >
                            + Tambah Tabel Awal
                          </button>
                        </div>

                        {activeQuestion.tables &&
                        activeQuestion.tables.length > 0 ? (
                          <div className="space-y-4">
                            {activeQuestion.tables.map(
                              (tbl: any, tIdx: number) => (
                                <div
                                  key={tbl.id || tIdx}
                                  className="border border-slate-300 bg-white rounded-sm overflow-hidden shadow-xs"
                                >
                                  <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-300 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs font-semibold text-slate-700">
                                        Nama Tabel:
                                      </span>
                                      <input
                                        type="text"
                                        value={tbl.name}
                                        onChange={(e) => {
                                          mutateQuestions((draft) => {
                                            const qTarget = draft.find(
                                              (x) => x.id === activeQuestion.id
                                            );
                                            qTarget.tables[tIdx].name =
                                              e.target.value;
                                          });
                                        }}
                                        placeholder="Contoh: siswa"
                                        className="border border-slate-300 px-3 py-1 text-xs rounded-sm w-56 bg-white focus:outline-none focus:border-blue-500"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        mutateQuestions((draft) => {
                                          const qTarget = draft.find(
                                            (x) => x.id === activeQuestion.id
                                          );
                                          qTarget.tables.splice(tIdx, 1);
                                        });
                                      }}
                                      className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                                    >
                                      ✕
                                    </button>
                                  </div>

                                  <div className="overflow-x-auto p-4">
                                    <table className="w-full text-left text-xs whitespace-nowrap">
                                      <thead className="bg-slate-50 border-b border-slate-300 text-slate-600">
                                        <tr>
                                          <th className="px-3 py-2 font-semibold">
                                            Nama Kolom
                                          </th>
                                          <th className="px-3 py-2 font-semibold border-l border-slate-300">
                                            Tipe Data
                                          </th>
                                          <th className="px-3 py-2 font-semibold border-l border-slate-300">
                                            Panjang
                                          </th>
                                          <th className="px-3 py-2 font-semibold border-l border-slate-300 text-center">
                                            A_I
                                          </th>
                                          <th className="px-3 py-2 font-semibold border-l border-slate-300 text-center">
                                            Primary Key
                                          </th>
                                          <th className="px-3 py-2 font-semibold border-l border-slate-300"></th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-200">
                                        {(tbl.columns || []).map(
                                          (col: any, cIdx: number) => (
                                            <tr key={col.id || cIdx}>
                                              <td className="px-2 py-1.5">
                                                <input
                                                  type="text"
                                                  value={col.name}
                                                  onChange={(e) => {
                                                    mutateQuestions((draft) => {
                                                      const qTarget = draft.find(
                                                        (x) =>
                                                          x.id ===
                                                          activeQuestion.id
                                                      );
                                                      qTarget.tables[
                                                        tIdx
                                                      ].columns[cIdx].name =
                                                        e.target.value;
                                                    });
                                                  }}
                                                  className="w-36 px-2 py-1 border border-slate-300 rounded-sm text-xs"
                                                />
                                              </td>
                                              <td className="px-2 py-1.5 border-l border-slate-200">
                                                <select
                                                  value={col.type || "VARCHAR"}
                                                  onChange={(e) => {
                                                    mutateQuestions((draft) => {
                                                      const qTarget = draft.find(
                                                        (x) =>
                                                          x.id ===
                                                          activeQuestion.id
                                                      );
                                                      qTarget.tables[
                                                        tIdx
                                                      ].columns[cIdx].type =
                                                        e.target.value;
                                                    });
                                                  }}
                                                  className="w-28 px-1 py-1 border border-slate-300 rounded-sm text-xs bg-white"
                                                >
                                                  <option value="INT">INT</option>
                                                  <option value="VARCHAR">
                                                    VARCHAR
                                                  </option>
                                                  <option value="TEXT">TEXT</option>
                                                  <option value="DATE">DATE</option>
                                                  <option value="DATETIME">
                                                    DATETIME
                                                  </option>
                                                  <option value="BOOLEAN">
                                                    BOOLEAN
                                                  </option>
                                                </select>
                                              </td>
                                              <td className="px-2 py-1.5 border-l border-slate-200">
                                                <input
                                                  type="text"
                                                  value={col.length}
                                                  onChange={(e) => {
                                                    mutateQuestions((draft) => {
                                                      const qTarget = draft.find(
                                                        (x) =>
                                                          x.id ===
                                                          activeQuestion.id
                                                      );
                                                      qTarget.tables[
                                                        tIdx
                                                      ].columns[cIdx].length =
                                                        e.target.value;
                                                    });
                                                  }}
                                                  className="w-20 px-2 py-1 border border-slate-300 rounded-sm text-xs"
                                                  placeholder="100"
                                                />
                                              </td>
                                              <td className="px-2 py-1.5 border-l border-slate-200 text-center">
                                                <input
                                                  type="checkbox"
                                                  checked={Boolean(col.ai)}
                                                  onChange={(e) => {
                                                    mutateQuestions((draft) => {
                                                      const qTarget = draft.find(
                                                        (x) =>
                                                          x.id ===
                                                          activeQuestion.id
                                                      );
                                                      qTarget.tables[
                                                        tIdx
                                                      ].columns[cIdx].ai =
                                                        e.target.checked;
                                                    });
                                                  }}
                                                />
                                              </td>
                                              <td className="px-2 py-1.5 border-l border-slate-200 text-center">
                                                <input
                                                  type="checkbox"
                                                  checked={Boolean(col.pk)}
                                                  onChange={(e) => {
                                                    mutateQuestions((draft) => {
                                                      const qTarget = draft.find(
                                                        (x) =>
                                                          x.id ===
                                                          activeQuestion.id
                                                      );
                                                      qTarget.tables[
                                                        tIdx
                                                      ].columns[cIdx].pk =
                                                        e.target.checked;
                                                    });
                                                  }}
                                                />
                                              </td>
                                              <td className="px-2 py-1.5 border-l border-slate-200 text-center">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    mutateQuestions((draft) => {
                                                      const qTarget = draft.find(
                                                        (x) =>
                                                          x.id ===
                                                          activeQuestion.id
                                                      );
                                                      qTarget.tables[
                                                        tIdx
                                                      ].columns.splice(cIdx, 1);
                                                    });
                                                  }}
                                                  className="text-red-500 hover:text-red-700 cursor-pointer"
                                                >
                                                  ✕
                                                </button>
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        mutateQuestions((draft) => {
                                          const qTarget = draft.find(
                                            (x) => x.id === activeQuestion.id
                                          );
                                          if (!qTarget.tables[tIdx].columns)
                                            qTarget.tables[tIdx].columns = [];
                                          qTarget.tables[tIdx].columns.push({
                                            id: `col_${Date.now()}`,
                                            name: "",
                                            type: "VARCHAR",
                                            length: "100",
                                            pk: false,
                                            ai: false,
                                          });
                                        });
                                      }}
                                      className="mt-3 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-sm cursor-pointer"
                                    >
                                      + Tambah Kolom
                                    </button>
                                  </div>

                                  {/* BARIS DATA AWAL */}
                                  <div className="bg-slate-50 border-t border-slate-200 p-4">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-xs font-bold text-slate-700">
                                        Isi Data Awal Tabel (Opsional)
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          mutateQuestions((draft) => {
                                            const qTarget = draft.find(
                                              (x) => x.id === activeQuestion.id
                                            );
                                            if (!qTarget.tables[tIdx].rows)
                                              qTarget.tables[tIdx].rows = [];
                                            qTarget.tables[tIdx].rows.push({});
                                          });
                                        }}
                                        className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-sm hover:bg-blue-100 cursor-pointer"
                                      >
                                        + Tambah Baris Data
                                      </button>
                                    </div>

                                    {tbl.rows && tbl.rows.length > 0 ? (
                                      <div className="overflow-x-auto border border-slate-200 rounded-sm">
                                        <table className="w-full text-left text-xs whitespace-nowrap bg-white">
                                          <thead className="bg-slate-100 border-b border-slate-200 text-slate-600">
                                            <tr>
                                              <th className="px-2 py-1 w-8 text-center border-r border-slate-200">
                                                #
                                              </th>
                                              {(tbl.columns || []).map(
                                                (c: any) => (
                                                  <th
                                                    key={c.id}
                                                    className="px-2 py-1 font-semibold border-r border-slate-200"
                                                  >
                                                    {c.name || "..."}
                                                  </th>
                                                )
                                              )}
                                              <th className="px-2 py-1 w-8"></th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                            {tbl.rows.map(
                                              (row: any, rIdx: number) => (
                                                <tr key={rIdx}>
                                                  <td className="px-2 py-1 border-r border-slate-200 text-center text-slate-400">
                                                    {rIdx + 1}
                                                  </td>
                                                  {(tbl.columns || []).map(
                                                    (c: any) => (
                                                      <td
                                                        key={c.id}
                                                        className="px-1 py-1 border-r border-slate-200"
                                                      >
                                                        <input
                                                          type="text"
                                                          value={row[c.id] || ""}
                                                          onChange={(e) => {
                                                            mutateQuestions(
                                                              (draft) => {
                                                                const qTarget =
                                                                  draft.find(
                                                                    (x) =>
                                                                      x.id ===
                                                                      activeQuestion.id
                                                                  );
                                                                qTarget.tables[
                                                                  tIdx
                                                                ].rows[rIdx][
                                                                  c.id
                                                                ] = e.target.value;
                                                              }
                                                            );
                                                          }}
                                                          placeholder={`Isi ${
                                                            c.name || "nilai"
                                                          }`}
                                                          className="w-full px-2 py-0.5 bg-slate-50 focus:bg-white border border-transparent focus:border-blue-300 rounded-sm text-xs outline-none"
                                                        />
                                                      </td>
                                                    )
                                                  )}
                                                  <td className="px-2 py-1 text-center">
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        mutateQuestions(
                                                          (draft) => {
                                                            const qTarget =
                                                              draft.find(
                                                                (x) =>
                                                                  x.id ===
                                                                  activeQuestion.id
                                                              );
                                                            qTarget.tables[
                                                              tIdx
                                                            ].rows.splice(
                                                              rIdx,
                                                              1
                                                            );
                                                          }
                                                        );
                                                      }}
                                                      className="text-red-400 hover:text-red-600 cursor-pointer"
                                                    >
                                                      ✕
                                                    </button>
                                                  </td>
                                                </tr>
                                              )
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <p className="text-[11px] text-slate-400 italic">
                                        Belum ada baris data awal.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-5 bg-white border border-slate-200 rounded-sm text-xs text-slate-500">
                            Tidak ada tabel awal (Cocok untuk soal DDL pembuatan tabel baru). Klik <b>+ Tambah Tabel Awal</b> jika soal membutuhkan tabel awal.
                          </div>
                        )}
                      </div>

                      {/* PEMBUAT TABEL KUNCI JAWABAN */}
                      <AnswerTableBuilder
                        question={activeQuestion}
                        initSchemaSql={generateInitSchemaPreview(
                          activeQuestion.tables
                        )}
                        onMutateQuestion={(updater) => {
                          mutateQuestions((draft) => {
                            const qTarget = draft.find(
                              (x) => x.id === activeQuestion.id
                            );
                            if (qTarget) updater(qTarget);
                          });
                        }}
                      />
                    </div>
                  )}

                  {activeQuestion.type === "multiple_choice" && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Opsi Jawaban Pilihan Ganda (Pilih Kunci Jawaban yang Benar)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {(activeQuestion.options || []).map(
                            (opt: any, oIdx: number) => (
                              <div
                                key={opt.id}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="radio"
                                  name={`correct_${activeQuestion.id}`}
                                  checked={Boolean(opt.isCorrect)}
                                  onChange={() =>
                                    setCorrectOption(activeQuestion.id, opt.id)
                                  }
                                  className="w-4 h-4 accent-[#2196F3]"
                                />
                                <div className="flex-1 flex items-center border border-slate-200 rounded-sm bg-slate-50 focus-within:bg-white focus-within:border-[#2196F3]">
                                  <span className="px-3 text-xs font-bold text-slate-500 border-r border-slate-200">
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <input
                                    type="text"
                                    value={opt.text}
                                    onChange={(e) =>
                                      updateOption(
                                        activeQuestion.id,
                                        opt.id,
                                        e.target.value
                                      )
                                    }
                                    placeholder={`Opsi ${String.fromCharCode(
                                      65 + oIdx
                                    )}`}
                                    className="w-full px-3 py-1.5 text-sm bg-transparent focus:outline-none"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteOption(activeQuestion.id, opt.id)
                                  }
                                  disabled={
                                    (activeQuestion.options || []).length <= 2
                                  }
                                  className="text-slate-400 hover:text-red-500 disabled:opacity-30 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            )
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => addOption(activeQuestion.id)}
                          className="text-xs font-bold text-[#2196F3] hover:text-[#0D47A1] mt-3 block cursor-pointer"
                        >
                          + Tambah Opsi Jawaban
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Bobot Nilai
                        </label>
                        <input
                          type="number"
                          value={activeQuestion.scoreWeight}
                          onChange={(e) =>
                            updateQuestion(
                              activeQuestion.id,
                              "scoreWeight",
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-200 rounded-sm text-base font-bold text-[#2196F3] text-center focus:outline-none focus:border-[#2196F3]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel Kanan: Navigasi Nomor Soal & Ringkasan Bobot */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Navigasi Butir Soal
            </h3>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {questions.map((q, idx) => {
                const isSelected = idx === safeIdx;
                const isSql = q.type === "sql_query";
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setActiveQuestionIdx(idx)}
                    className={`py-2 px-1 rounded-sm border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? "bg-[#2196F3] text-white border-[#2196F3] shadow-xs"
                        : "bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span className="text-xs font-extrabold">{idx + 1}</span>
                    <span
                      className={`text-[9px] font-bold uppercase ${
                        isSelected
                          ? "text-blue-100"
                          : isSql
                          ? "text-emerald-600"
                          : "text-[#0D47A1]"
                      }`}
                    >
                      {isSql ? "SQL" : "PG"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Butir Soal:</span>
                <span className="font-bold text-slate-800">
                  {questions.length} Soal
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Soal Query SQL:</span>
                <span className="font-bold text-emerald-600">
                  {questions.filter((q) => q.type === "sql_query").length} Soal
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Soal Pilihan Ganda:</span>
                <span className="font-bold text-[#0D47A1]">
                  {questions.filter((q) => q.type === "multiple_choice").length}{" "}
                  Soal
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-800 pt-2 border-t border-slate-100 font-bold">
                <span>Total Bobot Nilai:</span>
                <span
                  className={`px-2 py-0.5 rounded-sm text-xs font-extrabold ${
                    totalBobot === 100
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {totalBobot} / 100 Poin
                </span>
              </div>
              {totalBobot !== 100 && (
                <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-sm border border-amber-200">
                  Idealnya total bobot seluruh soal adalah 100 poin (saat ini {totalBobot} poin).
                </div>
              )}
              <button
                type="button"
                onClick={handleDistributeWeights}
                className="w-full mt-1.5 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-[#0D47A1] text-xs font-bold rounded-sm border border-blue-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                title="Bagi rata total bobot seluruh soal agar pas 100 poin"
              >
                ⚖️ Bagi Rata Bobot ke 100
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
