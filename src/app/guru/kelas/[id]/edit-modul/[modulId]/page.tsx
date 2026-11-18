"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Swal from 'sweetalert2';
import {
  SqlInlineGuide,
  SqlTutorialModal,
  AnswerTableBuilder,
  SqlTemplatePayload,
} from '@/app/guru/components/SqlTutorialHelper';
import VsCodeSqlEditor from '@/components/VsCodeSqlEditor';
import JoditEditor from '@/components/SafeJoditEditor';

export default function EditModul() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const modulId = params.modulId as string;
  const [currentStep, setCurrentStep] = useState(1); // 1 = Kerangka, 2 = Kurikulum/Builder
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Data dummy, idealnya difetch berdasarkan params.id
  const classData = {
    id: classId,
    name: "XII RPL 1",
  };

  // State untuk Kerangka
  const [judul, setJudul] = useState("");
  const [tujuan, setTujuan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateInitSchemaPreview = (tables: any[]) => {
    let schema = "";
    if (tables && tables.length > 0) {
      tables.forEach((t: any) => {
        if(!t.name) return;
        const validCols = (t.columns || []).filter((c:any) => c.name);
        if(validCols.length === 0) return;
        const colDefs = validCols.map((c:any) => {
          // SQLite requires exact "INTEGER PRIMARY KEY AUTOINCREMENT" syntax (no length)
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
            const colNames = validCols.map((c:any) => c.name).join(', ');
            const vals = validCols.map((c:any) => {
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

  const [editorConfig] = useState({
    readonly: false,
    placeholder: 'Ketikkan isi materi pembelajaran di sini...',
    toolbarAdaptive: false,
    addNewLine: false,
    addNewLineOnDBLClick: false,
    controls: {
      ol: {
        list: {
          default: '1, 2, 3...',
          'lower-alpha': 'a, b, c...',
          'lower-greek': 'α, β, γ...',
          'lower-roman': 'i, ii, iii...',
          'upper-alpha': 'A, B, C...',
          'upper-roman': 'I, II, III...'
        }
      },
      ul: {
        list: {
          default: '●  ●  ●',
          circle: '○  ○  ○',
          square: '■  ■  ■'
        }
      }
    },
    uploader: {
      url: '/api/upload',
      format: 'json',
      isSuccess: (resp: any) => resp.success,
      process: (resp: any) => ({
        files: resp.data.files || [],
        path: resp.data.path,
        baseurl: resp.data.baseurl,
        isImages: resp.data.isImages,
        error: resp.error ? 1 : 0,
        message: resp.error || ''
      }),
      defaultHandlerSuccess: function (data: any) {
        if (data.files && data.files.length) {
          for (let i = 0; i < data.files.length; i++) {
            const fileUrl = data.baseurl + data.files[i];
            const isImage = data.isImages && data.isImages[i];
            if (isImage) {
              (this as any).s.insertImage(fileUrl);
            } else {
              // Jika video, masukkan tag HTML video
              const videoTag = `<video style="max-width: 100%; width: 600px; height: auto;" controls><source src="${fileUrl}" type="video/mp4">Your browser does not support the video tag.</video><p><br></p>`;
              (this as any).s.insertHTML(videoTag);
            }
          }
        }
      },
    },
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'video', 'table', 'link', '|',
      'align', 'undo', 'redo', '|', 'hr', 'eraser', 'fullsize'
    ]
  });

  const questionEditorConfig = React.useMemo(() => ({
    ...editorConfig,
    placeholder: 'Tuliskan pertanyaan Anda di sini...',
    minHeight: 150
  }), [editorConfig]);

  // State untuk kurikulum (Bab dan Sub-Bab)
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [activeSubBabId, setActiveSubBabId] = useState<number | null>(101);
  const [activeTab, setActiveTab] = useState<'materi' | 'latihan' | 'preview'>('materi');
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState<'materi' | 'latihan'>('materi');
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, string>>({});
  const [previewDoubtful, setPreviewDoubtful] = useState<string[]>([]);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [tutorialInitialTab, setTutorialInitialTab] = useState<'alur' | 'DQL' | 'DML' | 'DDL'>('alur');

  const activeSubBab = curriculum.flatMap(b => b.subBabs).find(s => s.id === activeSubBabId);

  // Fetch initial data
  React.useEffect(() => {
    fetch(`/api/modul/${modulId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const mod = data.data;
          setJudul(mod.judul);
          setTujuan(mod.tujuan);
          
          if (mod.babs && mod.babs.length > 0) {
             const mappedBabs = mod.babs.map((b: any) => ({
                _id: b._id,
                id: b._id || Date.now() + Math.random(),
                title: b.title,
                subBabs: b.subBabs.map((s: any) => ({
                   _id: s._id,
                   id: s._id || Date.now() + Math.random(),
                   title: s.title,
                   content: s.content,
                   hasExercise: s.hasExercise,
                   exerciseInstruction: s.exerciseInstruction,
                   exerciseQuery: s.exerciseQuery,
                   exerciseScore: s.exerciseScore,
                   questions: s.questions || []
                }))
             }));
             setCurriculum(mappedBabs);
             setActiveSubBabId(mappedBabs[0].subBabs[0]?.id || null);
          }
        }
        setIsLoadingData(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingData(false);
      });
  }, [modulId]);

  // Reset tab saat pindah sub-bab
  React.useEffect(() => {
    setActiveTab('materi');
    setActiveQuestionIdx(0);
    setPreviewMode('materi');
  }, [activeSubBabId]);

  const addBab = () => {
    const newId = curriculum.length + 1;
    setCurriculum([...curriculum, { id: newId, title: `Bab ${newId}`, subBabs: [] }]);
  };

  const addSubBab = (babId: number) => {
    const babIndex = curriculum.findIndex(b => b.id === babId);
    if (babIndex === -1) return;
    
    const newCurriculum = [...curriculum];
    const newSubId = Date.now();
    const subCount = newCurriculum[babIndex].subBabs.length + 1;
    newCurriculum[babIndex].subBabs.push({
      id: newSubId,
      title: `Sub-Bab ${babIndex + 1}.${subCount}`,
      content: "",
      hasExercise: false,
      questions: []
    });
    setCurriculum(newCurriculum);
    setActiveSubBabId(newSubId); // otomatis aktifkan yang baru
  };

  const deleteSubBab = (babId: number, subId: number) => {
    Swal.fire({
      title: 'Hapus Sub-Bab?',
      text: "Materi dan latihan soal di dalamnya akan terhapus!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F44336',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        const newCurriculum = [...curriculum];
        const babIndex = newCurriculum.findIndex(b => b.id === babId);
        if (babIndex > -1) {
          newCurriculum[babIndex].subBabs = newCurriculum[babIndex].subBabs.filter((s: any) => s.id !== subId);
          setCurriculum(newCurriculum);
          if (activeSubBabId === subId) {
            setActiveSubBabId(null);
          }
        }
      }
    });
  };

  const deleteBab = (babId: number) => {
    if (curriculum.length <= 1) return; // Sisakan 1 bab
    Swal.fire({
      title: 'Hapus Bab?',
      text: "Seluruh sub-bab, materi, dan latihan soal di dalamnya akan ikut terhapus!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F44336',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        const newCurriculum = curriculum.filter(b => b.id !== babId);
        setCurriculum(newCurriculum);
        
        // Hapus active subbab jika ada di dalam bab ini
        const babToDelete = curriculum.find(b => b.id === babId);
        if (babToDelete && activeSubBabId) {
          const isSubBabInBab = babToDelete.subBabs.some((s: any) => s.id === activeSubBabId);
          if (isSubBabInBab) {
            setActiveSubBabId(null);
          }
        }
      }
    });
  };

  const toggleExercise = () => {
    if (!activeSubBabId) return;
    const newCurriculum = [...curriculum];
    for (const bab of newCurriculum) {
      const sub = bab.subBabs.find((s: any) => s.id === activeSubBabId);
      if (sub) {
        sub.hasExercise = !sub.hasExercise;
        break;
      }
    }
    setCurriculum(newCurriculum);
  };

  const handleContentChange = (content: string) => {
    if (!activeSubBabId) return;
    const newCurriculum = [...curriculum];
    for (const bab of newCurriculum) {
      const sub = bab.subBabs.find((s: any) => s.id === activeSubBabId);
      if (sub) {
        sub.content = content;
        break;
      }
    }
    setCurriculum(newCurriculum);
  };

  // --- Question Helpers ---
  const mutateActiveSubBab = (mutator: (sub: any) => void) => {
    if (!activeSubBabId) return;
    const newCurriculum = [...curriculum];
    for (const bab of newCurriculum) {
      const sub = bab.subBabs.find((s: any) => s.id === activeSubBabId);
      if (sub) {
        mutator(sub);
        break;
      }
    }
    setCurriculum(newCurriculum);
  };

  const addQuestion = (type: 'sql_query' | 'multiple_choice') => {
    let nextIdx = 0;
    mutateActiveSubBab((sub) => {
      if (!sub.hasExercise) sub.hasExercise = true;
      if (!sub.questions) sub.questions = [];
      const newQuestion: any = {
        id: `q_${Date.now()}`,
        type,
        instruction: "",
        scoreWeight: 10
      };
      if (type === 'sql_query') {
        newQuestion.sqlAnswerKey = "";
        newQuestion.queryType = "DQL";
        newQuestion.targetTable = "";
        newQuestion.tables = [{ id: `tbl_${Date.now()}`, name: '', columns: [], rows: [] }];
        newQuestion.answerTables = [{ id: `ans_tbl_${Date.now()}`, name: '', columns: [], rows: [] }];
      } else {
        newQuestion.options = [
          { id: `opt_${Date.now()}_1`, text: "", isCorrect: true },
          { id: `opt_${Date.now()}_2`, text: "", isCorrect: false }
        ];
      }
      sub.questions.push(newQuestion);
      nextIdx = sub.questions.length - 1;
    });
    setActiveQuestionIdx(nextIdx);
    setActiveTab('latihan');
  };

  const updateQuestion = (qId: string, field: string, value: any) => {
    mutateActiveSubBab((sub) => {
      const q = sub.questions.find((x: any) => x.id === qId);
      if (q) q[field] = value;
    });
  };

  const deleteQuestion = (qId: string) => {
    let nextLen = 0;
    mutateActiveSubBab((sub) => {
      sub.questions = sub.questions.filter((x: any) => x.id !== qId);
      nextLen = sub.questions.length;
    });
    setActiveQuestionIdx((prev) => Math.max(0, Math.min(prev, nextLen - 1)));
  };

  const handleDistributeSubBabWeights = () => {
    if (!activeSubBab?.questions || activeSubBab.questions.length === 0) return;
    const n = activeSubBab.questions.length;
    const baseWeight = Math.floor(100 / n);
    const remainder = 100 % n;
    mutateActiveSubBab((sub) => {
      sub.questions.forEach((q: any, idx: number) => {
        q.scoreWeight = idx < remainder ? baseWeight + 1 : baseWeight;
      });
    });
    Swal.fire({
      icon: "success",
      title: "Bobot Dibagi Rata!",
      text: `Total bobot ${n} butir soal latihan berhasil disesuaikan menjadi 100 poin.`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const addOption = (qId: string) => {
    mutateActiveSubBab((sub) => {
      const q = sub.questions.find((x: any) => x.id === qId);
      if (q && q.type === 'multiple_choice') {
        q.options.push({ id: `opt_${Date.now()}`, text: "", isCorrect: false });
      }
    });
  };

  const updateOption = (qId: string, optId: string, text: string) => {
    mutateActiveSubBab((sub) => {
      const q = sub.questions.find((x: any) => x.id === qId);
      if (q && q.type === 'multiple_choice') {
        const opt = q.options.find((o: any) => o.id === optId);
        if (opt) opt.text = text;
      }
    });
  };

  const setCorrectOption = (qId: string, optId: string) => {
    mutateActiveSubBab((sub) => {
      const q = sub.questions.find((x: any) => x.id === qId);
      if (q && q.type === 'multiple_choice') {
        q.options.forEach((o: any) => {
          o.isCorrect = o.id === optId;
        });
      }
    });
  };

  const deleteOption = (qId: string, optId: string) => {
    mutateActiveSubBab((sub) => {
      const q = sub.questions.find((x: any) => x.id === qId);
      if (q && q.type === 'multiple_choice' && q.options.length > 2) {
        q.options = q.options.filter((o: any) => o.id !== optId);
      }
    });
  };

  const handleSimpanModul = async (status: 'Draft' | 'Terbit') => {
    if (!judul || !tujuan) {
      Swal.fire({
        icon: 'warning',
        title: 'Form Belum Lengkap',
        text: 'Harap isi judul dan tujuan pembelajaran',
        confirmButtonColor: '#2196F3'
      });
      setCurrentStep(1);
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/modul/${modulId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul,
          tujuan,
          kelas_id: classId,
          babs: curriculum,
          status
        })
      });
      const data = await res.json();
      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: `Modul berhasil diperbarui dan ${status === 'Terbit' ? 'diterbitkan' : 'disimpan sebagai draft'}`,
          confirmButtonColor: '#2196F3',
          timer: 1500
        });
        router.push(`/guru/kelas/${classId}`);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: data.error || "Gagal menyimpan modul",
          confirmButtonColor: '#F44336'
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Terjadi kesalahan sistem',
        confirmButtonColor: '#F44336'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
      
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-slate-500 mb-4">
          <Link href="/guru/kelas" className="hover:text-[#2196F3] transition-colors">Manajemen Kelas</Link>
          <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <Link href={`/guru/kelas/${classId}`} className="hover:text-[#2196F3] transition-colors">{classData.name}</Link>
          <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-slate-800 font-medium">Edit Modul</span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden">
          {/* Aksen Warna */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#2196F3]"></div>
          
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Edit Modul Pembelajaran</h1>
            <p className="text-slate-500 font-medium mt-1">Susun materi dan latihan soal secara hierarkis (Bab & Sub-Bab).</p>
          </div>
          
          <button onClick={() => router.back()} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-sm transition-colors shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Batal & Kembali
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {isLoadingData ? (
          <div className="lg:col-span-3 text-center py-12 text-slate-500">Memuat data modul...</div>
        ) : currentStep === 1 && (
          <>
            <div className="lg:col-span-2 flex flex-col space-y-6">
              <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800">1. Kerangka Dasar Modul</h2>
                  <p className="text-sm text-slate-500 mt-1">Lengkapi identitas dasar modul sebelum menyusun kurikulum materi.</p>
                </div>
                
                <div className="p-6 flex-1 flex flex-col space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Judul Modul</label>
                    <input value={judul} onChange={(e) => setJudul(e.target.value)} type="text" placeholder="Contoh: Modul 4 - Normalisasi Database" className="w-full px-4 py-3 border border-slate-200 rounded-sm focus:outline-none focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] transition-all text-slate-700" />
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Tujuan Pembelajaran</label>
                    <textarea value={tujuan} onChange={(e) => setTujuan(e.target.value)} placeholder="Tuliskan tujuan pembelajaran untuk modul ini..." className="flex-1 w-full px-4 py-3 border border-slate-200 rounded-sm focus:outline-none focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] resize-none transition-all text-slate-700 min-h-[150px]"></textarea>
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50 p-6 flex justify-end mt-auto">
                  <button onClick={() => setCurrentStep(2)} type="button" className="px-8 py-2.5 text-sm font-semibold text-white bg-[#0D47A1] hover:bg-[#0A367A] rounded-sm transition-colors flex items-center gap-2 shadow-sm">
                    Selanjutnya: Susun Kurikulum
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#2196F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  Proses Pembuatan
                </h3>
                <div className="space-y-6 relative">
                  <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-100 -z-10"></div>
                  
                  <div className="flex gap-4 relative">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 bg-[#2196F3] border-[#2196F3] text-white shadow-sm z-10 text-xs font-bold">1</div>
                    <div>
                      <p className="font-semibold text-sm text-slate-800">Kerangka Modul</p>
                      <p className="text-xs text-slate-400 mt-0.5">Identitas & Tujuan</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 relative opacity-50">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 bg-white border-slate-300 text-slate-400 z-10 text-xs font-bold">2</div>
                    <div>
                      <p className="font-semibold text-sm text-slate-500">Penyusunan Kurikulum</p>
                      <p className="text-xs text-slate-400 mt-0.5">Bab, Sub-Bab, & Soal Latihan</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}


        {/* === STEP 2: BUILDER (Kurikulum / Hierarki) === */}
        {currentStep === 2 && (
          <>
            {/* Kolom Kiri (2/3): EDITOR UNTUK SUB-BAB YANG AKTIF */}
            <div className="lg:col-span-2 flex flex-col space-y-6">
              {!activeSubBabId ? (
                <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center text-slate-500">
                  <svg className="w-12 h-12 mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                  <p className="font-medium text-slate-700">Pilih atau buat Sub-Bab terlebih dahulu</p>
                  <p className="text-sm mt-1">Gunakan panel Kurikulum di sebelah kanan.</p>
                </div>
              ) : (
                <div className="bg-white rounded-sm border border-slate-200 shadow-sm flex flex-col animate-in fade-in zoom-in-95 duration-200">
                  
                  {/* Bagian Materi Sub-Bab */}
                  <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <input type="text" value={activeSubBab?.title || ''} onChange={(e) => {
                        const newCurriculum = [...curriculum];
                        for(const bab of newCurriculum){
                          const sub = bab.subBabs.find((s:any)=>s.id === activeSubBabId);
                          if(sub){ sub.title = e.target.value; break; }
                        }
                        setCurriculum(newCurriculum);
                      }} className="text-xl font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 w-full placeholder-slate-300" placeholder="Judul Sub-Bab..." />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'preview') {
                          setActiveTab(previewMode === 'latihan' ? 'latihan' : 'materi');
                        } else {
                          setPreviewMode(activeTab === 'latihan' ? 'latihan' : 'materi');
                          setActiveTab('preview');
                        }
                      }}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border shadow-sm shrink-0 ${
                        activeTab === 'preview'
                          ? 'bg-[#0D47A1] text-white border-[#0D47A1]'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-[#2196F3] hover:text-[#2196F3]'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {activeTab === 'preview' ? 'Tutup Preview Siswa' : 'Preview Tampilan Siswa'}
                    </button>
                  </div>
                  
                  {/* Tab Navigation */}
                  <div className="flex border-b border-slate-200 bg-slate-50">
                    <button 
                      onClick={() => setActiveTab('materi')}
                      className={`flex-1 py-3 px-4 text-sm font-semibold text-center border-b-2 transition-colors ${activeTab === 'materi' ? 'border-[#2196F3] text-[#2196F3] bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                    >
                      Materi Pembelajaran
                    </button>
                    <button 
                      onClick={() => setActiveTab('latihan')}
                      className={`flex-1 py-3 px-4 text-sm font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'latihan' ? 'border-[#2196F3] text-[#2196F3] bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                    >
                      Latihan Soal
                      {activeSubBab?.hasExercise && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-700">
                          {activeSubBab?.questions?.length || 0}
                        </span>
                      )}
                    </button>
                    <button 
                      onClick={() => {
                        if (activeTab !== 'preview') {
                          setPreviewMode(activeTab === 'latihan' && activeSubBab?.hasExercise ? 'latihan' : 'materi');
                        }
                        setActiveTab('preview');
                      }}
                      className={`flex-1 py-3 px-4 text-sm font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'preview' ? 'border-[#2196F3] text-[#2196F3] bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Preview Siswa
                    </button>
                  </div>
                  
                  <div className="p-6 flex flex-col">
                    {/* MATERI TAB */}
                    {activeTab === 'materi' && (
                      <div className="flex flex-col border border-slate-200 rounded-sm overflow-hidden prose prose-sm max-w-none prose-slate bg-white animate-in fade-in duration-200">
                        <JoditEditor
                          key={`materi_${activeSubBabId}`}
                          value={activeSubBab?.content || ''}
                          config={editorConfig}
                          onBlur={(newContent) => handleContentChange(newContent)}
                        />
                      </div>
                    )}

                    {/* LATIHAN TAB */}
                    {activeTab === 'latihan' && (
                      <div className="animate-in fade-in duration-200">
                        {!activeSubBab?.hasExercise ? (
                          <div className="border border-slate-200 rounded-sm p-8 flex flex-col items-center justify-center text-center bg-slate-50">
                            <svg className="w-12 h-12 mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            <h4 className="font-bold text-slate-800 text-lg mb-2">Latihan Soal Sub-Bab</h4>
                            <p className="text-sm text-slate-500 mb-6 max-w-md">Siswa akan diminta menjawab latihan soal ini setelah membaca materi. Anda dapat menambahkan soal Query SQL maupun Pilihan Ganda.</p>
                            <button onClick={toggleExercise} className="px-6 py-2.5 bg-[#2196F3] text-white font-bold text-sm rounded-sm hover:bg-[#1976D2] transition-colors shadow-sm">
                              Aktifkan Latihan Soal
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-5">
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-4 rounded-sm">
                              <div>
                                <h4 className="font-bold text-slate-800 text-sm">Mode Latihan Aktif</h4>
                                <p className="text-xs text-slate-500">Pilih nomor soal di panel kanan untuk berpindah soal tanpa perlu scroll panjang.</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-sm text-xs font-bold text-slate-700">
                                  <span>Total Bobot:</span>
                                  <span className={(activeSubBab?.questions || []).reduce((acc: number, item: any) => acc + (Number(item.scoreWeight) || 0), 0) === 100 ? "text-emerald-600" : "text-amber-600"}>
                                    {(activeSubBab?.questions || []).reduce((acc: number, item: any) => acc + (Number(item.scoreWeight) || 0), 0)} / 100 Poin
                                  </span>
                                </div>
                                {(activeSubBab?.questions?.length || 0) > 0 && (
                                  <button
                                    type="button"
                                    onClick={handleDistributeSubBabWeights}
                                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0D47A1] text-xs font-semibold rounded-sm transition-colors border border-blue-200 flex items-center gap-1 shadow-xs cursor-pointer"
                                    title="Bagi rata total bobot seluruh soal latihan di sub-bab ini ke 100 poin"
                                  >
                                    ⚖️ Bagi Rata 100
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTutorialInitialTab('alur');
                                    setIsTutorialModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 bg-[#0D47A1] text-white hover:bg-[#0A367A] text-xs font-semibold rounded-sm transition-colors flex items-center gap-1.5 shadow-sm"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                  Panduan Soal SQL
                                </button>
                                <button type="button" onClick={() => addQuestion('multiple_choice')} className="px-3 py-1.5 bg-white border border-[#2196F3] text-[#2196F3] hover:bg-blue-50 text-xs font-semibold rounded-sm transition-colors flex items-center gap-1.5 shadow-sm">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                  Soal Pilihan Ganda
                                </button>
                                <button type="button" onClick={() => addQuestion('sql_query')} className="px-3 py-1.5 bg-white border border-[#4CAF50] text-[#4CAF50] hover:bg-green-50 text-xs font-semibold rounded-sm transition-colors flex items-center gap-1.5 shadow-sm">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                  Soal Query SQL
                                </button>
                                <button onClick={toggleExercise} className="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-sm transition-colors border border-red-100">
                                  Matikan Latihan
                                </button>
                              </div>
                            </div>

                            {(!activeSubBab.questions || activeSubBab.questions.length === 0) ? (
                              <div className="border border-dashed border-slate-300 rounded-sm p-8 text-center bg-slate-50/50">
                                <p className="text-sm font-medium text-slate-600 mb-1">Belum ada butir soal pada sub-bab ini.</p>
                                <p className="text-xs text-slate-400 mb-4">Gunakan tombol &quot;+ Soal Pilihan Ganda&quot; atau &quot;+ Soal Query SQL&quot; untuk menambahkan soal pertama.</p>
                                <div className="flex items-center justify-center gap-3">
                                  <button type="button" onClick={() => addQuestion('multiple_choice')} className="px-4 py-2 border border-dashed border-[#2196F3] text-[#2196F3] hover:bg-blue-50 text-xs font-semibold rounded-sm transition-colors flex items-center gap-1.5 bg-white">
                                    + Soal Pilihan Ganda
                                  </button>
                                  <button type="button" onClick={() => addQuestion('sql_query')} className="px-4 py-2 border border-dashed border-[#4CAF50] text-[#4CAF50] hover:bg-green-50 text-xs font-semibold rounded-sm transition-colors flex items-center gap-1.5 bg-white">
                                    + Soal Query SQL
                                  </button>
                                </div>
                              </div>
                            ) : (() => {
                              const safeIdx = Math.min(activeQuestionIdx, activeSubBab.questions.length - 1);
                              const q = activeSubBab.questions[safeIdx];
                              const index = safeIdx;
                              if (!q) return null;
                              return (
                        <div key={q.id} className="border border-slate-200 rounded-sm p-5 bg-white shadow-sm relative">
                          <div className="mb-4 pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 border-b-2 border-[#2196F3] pb-0.5 text-sm">Soal {index + 1}</span>
                              <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-sm">
                                {q.type === 'sql_query' ? 'Tulis Query SQL' : 'Pilihan Ganda'}
                              </span>
                              <span className="text-xs text-slate-400">
                                ({index + 1} dari {activeSubBab.questions.length} soal)
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => setActiveQuestionIdx(Math.max(0, index - 1))}
                                className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                title="Soal Sebelumnya"
                              >
                                &larr; Sebelumnya
                              </button>
                              <button
                                type="button"
                                disabled={index >= activeSubBab.questions.length - 1}
                                onClick={() => setActiveQuestionIdx(Math.min(activeSubBab.questions.length - 1, index + 1))}
                                className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                title="Soal Selanjutnya"
                              >
                                Selanjutnya &rarr;
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewMode('latihan');
                                  setActiveTab('preview');
                                }}
                                className="px-2.5 py-1 text-xs font-medium text-[#2196F3] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-sm transition-colors flex items-center gap-1"
                                title="Lihat tampilan soal ini di layar siswa"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Preview Soal
                              </button>
                              <button type="button" onClick={() => deleteQuestion(q.id)} className="text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 p-1.5 rounded-sm transition-colors border border-slate-200" title="Hapus Soal Ini">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-4 mt-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-2">Teks Instruksi / Pertanyaan</label>
                              <div className="border border-slate-200 rounded-sm overflow-hidden prose prose-sm max-w-none prose-slate bg-white">
                                <JoditEditor
                                  key={`q_editor_${q.id}`}
                                  value={q.instruction}
                                  config={questionEditorConfig}
                                  onBlur={(newContent) => updateQuestion(q.id, 'instruction', newContent)}
                                />
                              </div>
                            </div>
                            
                            {q.type === 'sql_query' && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div className="md:col-span-1">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Query</label>
                                    <select value={q.queryType || 'DQL'} onChange={e => updateQuestion(q.id, 'queryType', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#2196F3] text-sm">
                                      <option value="DQL">DQL (SELECT)</option>
                                      <option value="DML">DML (INSERT/UPDATE/DELETE)</option>
                                      <option value="DDL">DDL (CREATE/ALTER)</option>
                                    </select>
                                  </div>
                                  {q.queryType === 'DML' ? (
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-semibold text-slate-700 mb-1">Tabel Target (Opsional)</label>
                                      <input type="text" value={q.targetTable || ''} onChange={e => updateQuestion(q.id, 'targetTable', e.target.value)} placeholder="Contoh: mahasiswa" className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#2196F3] text-sm" />
                                    </div>
                                  ) : (
                                    <div className="md:col-span-2" />
                                  )}
                                  <div className="md:col-span-1 ml-auto w-full">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bobot Nilai</label>
                                    <input type="number" value={q.scoreWeight} onChange={e => updateQuestion(q.id, 'scoreWeight', Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#2196F3] text-base font-bold text-[#2196F3] text-center" />
                                  </div>
                                </div>

                                <SqlInlineGuide
                                  queryType={q.queryType || 'DQL'}
                                  onApplyTemplate={(tpl: SqlTemplatePayload) => {
                                    mutateActiveSubBab((sub) => {
                                      const qTarget = sub.questions.find((x: any) => x.id === q.id);
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
                                    setTutorialInitialTab(tabInit || 'alur');
                                    setIsTutorialModalOpen(true);
                                  }}
                                />

                                <div>
                                  {/* INLINE TABLE BUILDER */}
                                  <div className="mt-4 border border-slate-300 rounded-md p-4 bg-slate-50">
                                    <div className="flex items-center justify-between mb-4">
                                      <h4 className="font-bold text-slate-700">Skema Database</h4>
                                      <button type="button" onClick={() => {
                                        mutateActiveSubBab((sub) => {
                                          const qTarget = sub.questions.find((x:any) => x.id === q.id);
                                          if(qTarget) {
                                            if(!qTarget.tables) qTarget.tables = [];
                                            qTarget.tables.push({ id: `tbl_${Date.now()}`, name: '', columns: [] });
                                          }
                                        });
                                      }} className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-blue-600 hover:bg-slate-100 flex items-center gap-1 shadow-sm transition-colors">
                                        + Tambah Tabel Baru
                                      </button>
                                    </div>
                                    
                                    {q.tables && q.tables.length > 0 ? (
                                      <div className="space-y-4">
                                        {q.tables.map((tbl: any, tIdx: number) => (
                                          <div key={tbl.id || tIdx} className="border border-slate-300 bg-white rounded-md overflow-hidden shadow-sm">
                                            <div className="bg-slate-100 px-4 py-3 border-b border-slate-300 flex justify-between items-center">
                                              <div className="flex items-center gap-3">
                                                <span className="text-sm font-semibold text-slate-700">Nama tabel:</span>
                                                <input type="text" value={tbl.name} onChange={e => {
                                                  mutateActiveSubBab((sub) => {
                                                    const qTarget = sub.questions.find((x:any) => x.id === q.id);
                                                    qTarget.tables[tIdx].name = e.target.value;
                                                  });
                                                }} className="border border-slate-300 px-3 py-1.5 text-sm rounded w-64 focus:outline-none focus:border-blue-500" placeholder="e.g. mahasiswa" />
                                              </div>
                                              <button type="button" onClick={() => {
                                                mutateActiveSubBab((sub) => {
                                                  const qTarget = sub.questions.find((x:any) => x.id === q.id);
                                                  qTarget.tables.splice(tIdx, 1);
                                                });
                                              }} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Hapus Tabel ini">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                              </button>
                                            </div>
                                            
                                            <div className="overflow-x-auto p-4">
                                              <table className="w-full text-left text-sm whitespace-nowrap">
                                                <thead className="bg-slate-50 border-b border-slate-300 text-slate-600">
                                                  <tr>
                                                    <th className="px-3 py-2 font-semibold">Nama Kolom</th>
                                                    <th className="px-3 py-2 font-semibold border-l border-slate-300">Jenis (Type)</th>
                                                    <th className="px-3 py-2 font-semibold border-l border-slate-300">Panjang/Nilai</th>
                                                    <th className="px-3 py-2 font-semibold border-l border-slate-300 text-center">Bawaan (Default)</th>
                                                    <th className="px-3 py-2 font-semibold border-l border-slate-300 text-center">A_I</th>
                                                    <th className="px-3 py-2 font-semibold border-l border-slate-300 text-center">Primary</th>
                                                    <th className="px-3 py-2 font-semibold border-l border-slate-300"></th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                  {tbl.columns && tbl.columns.map((col: any, cIdx: number) => (
                                                    <tr key={col.id || cIdx} className="hover:bg-slate-50">
                                                      <td className="px-2 py-1.5">
                                                        <input type="text" value={col.name} onChange={e => {
                                                          mutateActiveSubBab((sub) => {
                                                            const qTarget = sub.questions.find((x:any) => x.id === q.id);
                                                            qTarget.tables[tIdx].columns[cIdx].name = e.target.value;
                                                          });
                                                        }} className="w-32 px-2 py-1 border border-slate-300 rounded-sm text-sm" />
                                                      </td>
                                                      <td className="px-2 py-1.5 border-l border-slate-200">
                                                        <select value={col.type || 'VARCHAR'} onChange={e => {
                                                          mutateActiveSubBab((sub) => {
                                                            const qTarget = sub.questions.find((x:any) => x.id === q.id);
                                                            qTarget.tables[tIdx].columns[cIdx].type = e.target.value;
                                                          });
                                                        }} className="w-28 px-1 py-1 border border-slate-300 rounded-sm text-sm bg-white">
                                                          <option value="INT">INT</option>
                                                          <option value="VARCHAR">VARCHAR</option>
                                                          <option value="TEXT">TEXT</option>
                                                          <option value="DATE">DATE</option>
                                                          <option value="DATETIME">DATETIME</option>
                                                          <option value="BOOLEAN">BOOLEAN</option>
                                                        </select>
                                                      </td>
                                                      <td className="px-2 py-1.5 border-l border-slate-200">
                                                        <input type="text" value={col.length} onChange={e => {
                                                          mutateActiveSubBab((sub) => {
                                                            const qTarget = sub.questions.find((x:any) => x.id === q.id);
                                                            qTarget.tables[tIdx].columns[cIdx].length = e.target.value;
                                                          });
                                                        }} className="w-20 px-2 py-1 border border-slate-300 rounded-sm text-sm" placeholder="e.g. 255" />
                                                      </td>
                                                      <td className="px-2 py-1.5 border-l border-slate-200 text-center">
                                                        <select className="w-24 px-1 py-1 border border-slate-300 rounded-sm text-sm bg-white text-slate-500">
                                                          <option>None</option>
                                                          <option>NULL</option>
                                                          <option>CURRENT_TIMESTAMP</option>
                                                        </select>
                                                      </td>
                                                      <td className="px-2 py-1.5 border-l border-slate-200 text-center">
                                                        <input type="checkbox" checked={col.ai} onChange={e => {
                                                          mutateActiveSubBab((sub) => {
                                                            const qTarget = sub.questions.find((x:any) => x.id === q.id);
                                                            qTarget.tables[tIdx].columns[cIdx].ai = e.target.checked;
                                                          });
                                                        }} className="w-4 h-4 cursor-pointer" title="Auto Increment" />
                                                      </td>
                                                      <td className="px-2 py-1.5 border-l border-slate-200 text-center">
                                                        <input type="radio" name={`pk_${q.id}_${tIdx}`} checked={col.pk} onChange={e => {
                                                          mutateActiveSubBab((sub) => {
                                                            const qTarget = sub.questions.find((x:any) => x.id === q.id);
                                                            qTarget.tables[tIdx].columns.forEach((c:any) => c.pk = false);
                                                            qTarget.tables[tIdx].columns[cIdx].pk = true;
                                                          });
                                                        }} className="w-4 h-4 cursor-pointer" title="Primary Key" />
                                                      </td>
                                                      <td className="px-2 py-1.5 border-l border-slate-200 text-center">
                                                        <button type="button" onClick={() => {
                                                          mutateActiveSubBab((sub) => {
                                                            const qTarget = sub.questions.find((x:any) => x.id === q.id);
                                                            qTarget.tables[tIdx].columns.splice(cIdx, 1);
                                                          });
                                                        }} className="text-red-500 hover:text-red-700 p-1">
                                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                              
                                              <button type="button" onClick={() => {
                                                mutateActiveSubBab((sub) => {
                                                  const qTarget = sub.questions.find((x:any) => x.id === q.id);
                                                  if(!qTarget.tables[tIdx].columns) qTarget.tables[tIdx].columns = [];
                                                  qTarget.tables[tIdx].columns.push({ id: Date.now().toString(), name: '', type: 'VARCHAR', length: '255', pk: false, ai: false });
                                                });
                                              }} className="mt-3 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-sm flex items-center gap-1 transition-colors">
                                                + Tambah Kolom
                                              </button>
                                            </div>

                                            {/* ROWS BUILDER */}
                                            <div className="bg-slate-50 border-t border-slate-200 p-4">
                                              <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-slate-700">Isi Data Tabel (Opsional)</span>
                                                <button type="button" onClick={() => {
                                                  mutateActiveSubBab((sub) => {
                                                    const qTarget = sub.questions.find((x:any) => x.id === q.id);
                                                    if(!qTarget.tables[tIdx].rows) qTarget.tables[tIdx].rows = [];
                                                    qTarget.tables[tIdx].rows.push({});
                                                  });
                                                }} className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded-sm hover:bg-blue-100 transition-colors">+ Tambah Baris Data</button>
                                              </div>
                                              
                                              {tbl.rows && tbl.rows.length > 0 ? (
                                                <div className="overflow-x-auto border border-slate-200 rounded-sm">
                                                  <table className="w-full text-left text-[10px] whitespace-nowrap bg-white">
                                                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-600">
                                                      <tr>
                                                        <th className="px-2 py-1 w-8 text-center border-r border-slate-200">#</th>
                                                        {tbl.columns && tbl.columns.map((c:any) => (
                                                          <th key={c.id} className="px-2 py-1 font-semibold border-r border-slate-200">{c.name || '...'}</th>
                                                        ))}
                                                        <th className="px-2 py-1 w-8 text-center"></th>
                                                      </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                      {tbl.rows.map((row:any, rIdx:number) => (
                                                        <tr key={rIdx} className="hover:bg-slate-50">
                                                          <td className="px-2 py-1 border-r border-slate-200 text-center text-slate-400">{rIdx + 1}</td>
                                                          {tbl.columns && tbl.columns.map((c:any) => (
                                                            <td key={c.id} className="px-1 py-1 border-r border-slate-200">
                                                              <input type="text" value={row[c.id] || ''} onChange={e => {
                                                                mutateActiveSubBab((sub) => {
                                                                  const qTarget = sub.questions.find((x:any) => x.id === q.id);
                                                                  qTarget.tables[tIdx].rows[rIdx][c.id] = e.target.value;
                                                                });
                                                              }} className="w-full px-1 py-0.5 border border-transparent focus:border-blue-300 focus:bg-white bg-slate-50 rounded-sm text-[10px] outline-none" placeholder={`Isi ${c.name || 'nilai'}`} />
                                                            </td>
                                                          ))}
                                                          <td className="px-2 py-1 text-center">
                                                            <button type="button" onClick={() => {
                                                              mutateActiveSubBab((sub) => {
                                                                const qTarget = sub.questions.find((x:any) => x.id === q.id);
                                                                qTarget.tables[tIdx].rows.splice(rIdx, 1);
                                                              });
                                                            }} className="text-red-400 hover:text-red-600">
                                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                          </td>
                                                        </tr>
                                                      ))}
                                                    </tbody>
                                                  </table>
                                                </div>
                                              ) : (
                                                <p className="text-[10px] text-slate-400 italic">Tidak ada baris data. Tabel akan di-generate kosong.</p>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-6 bg-white border border-slate-200 rounded-md shadow-sm">
                                        <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                                        <p className="text-sm text-slate-500 font-medium">Belum ada tabel di skema ini.</p>
                                        <p className="text-xs text-slate-400 mt-1">Klik tombol "+ Tambah Tabel Baru" di atas untuk mulai membuat skema.</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* PREVIEW SKEMA SQL */}
                                  <div className="mt-4">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Preview Query Skema & Data (Auto-Generated)</label>
                                    <pre className="w-full px-3 py-2 border border-slate-300 rounded-sm bg-slate-100 text-slate-600 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap">{generateInitSchemaPreview(q.tables) || '-- Belum ada skema --'}</pre>
                                  </div>

                                  <AnswerTableBuilder
                                    question={q}
                                    initSchemaSql={generateInitSchemaPreview(q.tables)}
                                    onMutateQuestion={(updater) => {
                                      mutateActiveSubBab((sub) => {
                                        const qTarget = sub.questions.find((x: any) => x.id === q.id);
                                        if (qTarget) updater(qTarget);
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {q.type === 'multiple_choice' && (
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-3">
                                  <label className="block text-xs font-semibold text-slate-700 mb-2">Opsi Jawaban (Pilih Kunci yang Benar)</label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {q.options?.map((opt: any, oIdx: number) => (
                                      <div key={opt.id} className="flex items-center gap-2">
                                        <input type="radio" name={`correct_${q.id}`} checked={opt.isCorrect} onChange={() => setCorrectOption(q.id, opt.id)} className="w-4 h-4 text-[#2196F3]" />
                                        <div className="flex-1 flex items-center border border-slate-200 rounded-sm bg-slate-50 focus-within:bg-white focus-within:border-[#2196F3]">
                                          <span className="px-3 text-xs font-bold text-slate-500 border-r border-slate-200">{String.fromCharCode(65 + oIdx)}</span>
                                          <input type="text" value={opt.text} onChange={e => updateOption(q.id, opt.id, e.target.value)} placeholder={`Opsi ${String.fromCharCode(65 + oIdx)}`} className="w-full px-3 py-1.5 text-sm bg-transparent border-none focus:outline-none focus:ring-0" />
                                        </div>
                                        <button type="button" onClick={() => deleteOption(q.id, opt.id)} className="text-slate-400 hover:text-red-500" disabled={q.options.length <= 2}>
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <button type="button" onClick={() => addOption(q.id)} className="text-xs font-bold text-[#2196F3] hover:text-[#0D47A1] mt-3 block">+ Tambah Opsi</button>
                                </div>
                                <div className="md:col-span-1">
                                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bobot Nilai</label>
                                  <input type="number" value={q.scoreWeight} onChange={e => updateQuestion(q.id, 'scoreWeight', Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#2196F3] text-base font-bold text-[#2196F3] text-center" />
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                              );
                            })()}

                          </div>
                        )}
                      </div>
                    )}

                    {/* PREVIEW TAMPILAN SISWA TAB */}
                    {activeTab === 'preview' && (
                      <div className="animate-in fade-in duration-200 space-y-4">
                        {/* Banner Info & Switcher Mode Preview */}
                        <div className="bg-[#0D47A1] text-white p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-sm bg-white/10 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-[#90CAF9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#90CAF9] uppercase tracking-wider">Mode Preview Siswa</p>
                              <p className="text-xs text-white/80">Simulasi tampilan yang dilihat oleh siswa pada sub-bab ini.</p>
                            </div>
                          </div>
                          <div className="flex items-center bg-white/10 p-1 rounded-sm gap-1 self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={() => setPreviewMode('materi')}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
                                previewMode === 'materi'
                                  ? 'bg-white text-[#0D47A1] shadow-sm'
                                  : 'text-white/80 hover:text-white'
                              }`}
                            >
                              Tampilan Materi
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewMode('latihan')}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors flex items-center gap-1.5 ${
                                previewMode === 'latihan'
                                  ? 'bg-white text-[#0D47A1] shadow-sm'
                                  : 'text-white/80 hover:text-white'
                              }`}
                            >
                              Tampilan Latihan Soal
                              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${previewMode === 'latihan' ? 'bg-blue-100 text-[#0D47A1]' : 'bg-white/20 text-white'}`}>
                                {activeSubBab?.questions?.length || 0}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Frame Simulasi Layar Siswa */}
                        <div className="border border-slate-200 rounded-sm overflow-hidden bg-white shadow-sm">
                          {previewMode === 'materi' ? (
                            /* === PREVIEW MATERI PEMBELAJARAN SISWA === */
                            <div className="flex flex-col bg-white">
                              <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50">
                                <div className="flex items-center gap-3 mb-3">
                                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-sm border border-blue-200">
                                    Topik Aktif
                                  </span>
                                  {activeSubBab?.hasExercise && (
                                    <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-sm border border-orange-200">
                                      Ada Latihan Soal
                                    </span>
                                  )}
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                                  {activeSubBab?.title || 'Judul Topik'}
                                </h1>
                                <p className="text-slate-600 text-sm">
                                  Modul: {judul || 'Judul Modul (Belum diisi)'}
                                </p>
                              </div>

                              <div className="p-6 sm:p-8 min-h-[260px]">
                                {activeSubBab?.content ? (
                                  <div
                                    className="prose prose-slate max-w-none"
                                    dangerouslySetInnerHTML={{ __html: activeSubBab.content }}
                                  />
                                ) : (
                                  <p className="text-slate-400 italic text-sm">Belum ada isi materi pembelajaran untuk sub-bab ini.</p>
                                )}
                              </div>

                              <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-4">
                                {activeSubBab?.hasExercise ? (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewMode('latihan')}
                                    className="px-6 py-2.5 bg-[#FF9800] text-white font-bold text-sm rounded-sm hover:bg-[#F57C00] transition-colors shadow-sm flex items-center gap-2"
                                  >
                                    Kerjakan Latihan
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="px-6 py-2.5 bg-[#2196F3] text-white font-bold text-sm rounded-sm hover:bg-blue-600 transition-colors shadow-sm flex items-center gap-2"
                                  >
                                    Tandai Selesai &amp; Lanjut
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* === PREVIEW LATIHAN SOAL SISWA === */
                            <div className="flex flex-col bg-white">
                              <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-3 mb-3">
                                    <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-sm border border-orange-200">
                                      Latihan Soal
                                    </span>
                                  </div>
                                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                                    {activeSubBab?.title || 'Judul Sub-Bab'}
                                  </h1>
                                  <p className="text-slate-600 text-sm">Kerjakan soal-soal di bawah ini dengan benar.</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setPreviewMode('materi')}
                                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-sm transition-colors shadow-sm self-start sm:self-auto"
                                >
                                  Kembali ke Materi
                                </button>
                              </div>

                              <div className="p-6 sm:p-8">
                                {!activeSubBab?.hasExercise || !activeSubBab?.questions || activeSubBab.questions.length === 0 ? (
                                  <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-sm border border-slate-200 text-sm">
                                    Tidak ada soal yang tersedia untuk latihan ini.
                                  </div>
                                ) : (() => {
                                  const safeIdx = Math.min(activeQuestionIdx, activeSubBab.questions.length - 1);
                                  const q = activeSubBab.questions[safeIdx];
                                  if (!q) return null;
                                  const validTables = (q.tables || []).filter((t: any) => t.name && t.columns?.some((c: any) => c.name));

                                  return (
                                    <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                        <span className="font-bold text-slate-800">Soal {safeIdx + 1}</span>
                                        <div className="flex items-center gap-4">
                                          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-orange-600">
                                            <input
                                              type="checkbox"
                                              checked={previewDoubtful.includes(q.id)}
                                              onChange={() => {
                                                setPreviewDoubtful(prev =>
                                                  prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id]
                                                );
                                              }}
                                              className="w-4 h-4 text-orange-500 rounded-sm border-slate-300 focus:ring-orange-500"
                                            />
                                            Ragu-ragu
                                          </label>
                                          <span className="text-xs font-semibold px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-sm">
                                            Bobot: {q.scoreWeight || 10}
                                          </span>
                                        </div>
                                      </div>

                                      {q.type === 'multiple_choice' ? (
                                        <div className="p-6 space-y-6">
                                          {q.instruction ? (
                                            <div
                                              className="prose prose-sm max-w-none"
                                              dangerouslySetInnerHTML={{ __html: q.instruction }}
                                            />
                                          ) : (
                                            <p className="text-slate-400 italic text-sm">Teks pertanyaan belum diisi oleh guru...</p>
                                          )}

                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {q.options?.map((opt: any, oIdx: number) => (
                                              <label
                                                key={opt.id}
                                                className={`flex items-start gap-3 p-3 border rounded-sm cursor-pointer transition-colors ${
                                                  previewAnswers[q.id] === opt.id
                                                    ? 'border-[#2196F3] bg-blue-50/50'
                                                    : 'border-slate-200 hover:bg-slate-50'
                                                }`}
                                              >
                                                <input
                                                  type="radio"
                                                  name={`preview_q_${q.id}`}
                                                  value={opt.id}
                                                  checked={previewAnswers[q.id] === opt.id}
                                                  onChange={() => setPreviewAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                                                  className="mt-1 w-4 h-4 text-[#2196F3] shrink-0"
                                                />
                                                <div className="flex-1 text-sm text-slate-700">
                                                  <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                                                  {opt.text || <span className="text-slate-400 italic">Opsi kosong</span>}
                                                </div>
                                              </label>
                                            ))}
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
                                              {q.instruction ? (
                                                <div
                                                  className="prose prose-sm max-w-none text-slate-800"
                                                  dangerouslySetInnerHTML={{ __html: q.instruction }}
                                                />
                                              ) : (
                                                <p className="text-slate-400 italic text-sm">Teks pertanyaan belum diisi oleh guru...</p>
                                              )}
                                            </div>

                                            {validTables.length > 0 && (
                                              <div className="space-y-3 pt-3 border-t border-slate-200">
                                                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Skema &amp; Data Tabel Referensi</h4>
                                                <div className="grid grid-cols-1 gap-3">
                                                  {validTables.map((tbl: any, tIdx: number) => {
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
                                                Klik <strong>▶ Jalankan Query</strong> untuk menguji hasil
                                              </span>
                                            </div>
                                            <VsCodeSqlEditor
                                              value={previewAnswers[q.id] || ''}
                                              onChange={(val) => setPreviewAnswers(prev => ({ ...prev, [q.id]: val }))}
                                              queryType={q.queryType || 'DQL'}
                                              tables={q.tables || []}
                                              answerTables={q.answerTables || []}
                                              sqlAnswerKey={q.sqlAnswerKey || ''}
                                              fileName={`soal_${safeIdx + 1}.sql`}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>

                              {activeSubBab?.hasExercise && activeSubBab?.questions && activeSubBab.questions.length > 0 && (() => {
                                const safeIdx = Math.min(activeQuestionIdx, activeSubBab.questions.length - 1);
                                return (
                                  <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                                    <div className="w-1/3 flex justify-start">
                                      {safeIdx > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => setActiveQuestionIdx(safeIdx - 1)}
                                          className="px-5 py-2 border border-slate-300 text-slate-600 font-bold text-sm rounded-sm hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-2 bg-white"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                          Soal Sebelumnya
                                        </button>
                                      )}
                                    </div>
                                    <div className="w-1/3 flex justify-center text-sm font-bold text-slate-500">
                                      {safeIdx + 1} / {activeSubBab.questions.length}
                                    </div>
                                    <div className="w-1/3 flex justify-end">
                                      {safeIdx < activeSubBab.questions.length - 1 ? (
                                        <button
                                          type="button"
                                          onClick={() => setActiveQuestionIdx(safeIdx + 1)}
                                          className="px-5 py-2 border border-slate-300 text-slate-600 font-bold text-sm rounded-sm hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-2 bg-white"
                                        >
                                          Soal Selanjutnya
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            Swal.fire({
                                              icon: 'info',
                                              title: 'Mode Preview Siswa',
                                              text: 'Ini adalah simulasi tombol Kumpulkan Jawaban yang dilihat oleh siswa pada soal terakhir.',
                                              confirmButtonColor: '#2196F3'
                                            });
                                          }}
                                          className="px-6 py-2.5 bg-[#2196F3] text-white font-bold text-sm rounded-sm hover:bg-blue-600 transition-colors shadow-sm"
                                        >
                                          Kumpulkan Jawaban
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Kolom Kanan (1/3): KURIKULUM TREE & NOMOR SOAL */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-white rounded-sm border border-slate-200 shadow-sm flex flex-col max-h-[calc(100vh-80px)] sticky top-6">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm">Struktur Kurikulum</h3>
                  <button onClick={() => setCurrentStep(1)} type="button" className="text-xs text-slate-500 hover:text-[#2196F3] font-medium transition-colors">Edit Kerangka</button>
                </div>
                
                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                  
                  {curriculum.map((bab, index) => (
                    <div key={bab.id} className="space-y-2">
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bab {index + 1}</span>
                          <input type="text" defaultValue={bab.title} className="text-sm font-bold text-slate-700 border-none bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-slate-200 rounded px-1 py-0.5 w-32 outline-none transition-colors" />
                        </div>
                        {curriculum.length > 1 && (
                          <button 
                            onClick={() => deleteBab(bab.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                            title="Hapus Bab"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                      
                      {/* Sub Babs */}
                      <div className="pl-2 ml-2 border-l-2 border-slate-100 space-y-1">
                        {bab.subBabs.map((sub: any, sIndex: number) => (
                          <div 
                            key={sub.id} 
                            onClick={() => setActiveSubBabId(sub.id)}
                            className={`px-3 py-2 text-sm rounded-sm cursor-pointer transition-colors flex items-center justify-between group ${activeSubBabId === sub.id ? 'bg-blue-50 text-[#2196F3] font-semibold border border-blue-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
                          >
                            <span className="truncate pr-2">{sub.title}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              {sub.hasExercise && (
                                <svg className="w-3.5 h-3.5 opacity-70" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                              )}
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteSubBab(bab.id, sub.id); }}
                                className="w-5 h-5 flex items-center justify-center rounded-sm text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Hapus Sub-Bab"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => addSubBab(bab.id)} className="text-xs font-semibold text-slate-400 hover:text-[#2196F3] mt-2 flex items-center gap-1 px-3 py-1 transition-colors">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                          Tambah Sub-Bab
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button onClick={addBab} className="w-full mt-4 py-2 text-xs font-bold text-slate-500 border border-dashed border-slate-300 hover:border-slate-400 hover:text-slate-700 rounded-sm transition-colors flex items-center justify-center gap-1.5 bg-slate-50/50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Tambah Bab Baru
                  </button>

                </div>

                {/* Daftar Nomor Soal di Sub-Bab yang Dipilih */}
                {activeSubBab && (
                  <div className="border-t border-slate-200 bg-white">
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="font-bold text-slate-800 text-xs shrink-0">Daftar Soal</h4>
                        <span className="text-[11px] text-slate-400 truncate">({activeSubBab.title})</span>
                      </div>
                      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-sm bg-blue-50 text-[#2196F3] border border-blue-100 shrink-0">
                        {activeSubBab.questions?.length || 0} Soal
                      </span>
                    </div>
                    <div className="p-3">
                      {!activeSubBab.hasExercise ? (
                        <div className="text-center py-1">
                          <p className="text-[11px] text-slate-400 mb-1.5">Latihan soal belum aktif di sub-bab ini.</p>
                          <button
                            type="button"
                            onClick={() => {
                              toggleExercise();
                              setActiveTab('latihan');
                            }}
                            className="text-xs font-semibold text-[#2196F3] hover:underline"
                          >
                            + Aktifkan Latihan Soal
                          </button>
                        </div>
                      ) : (!activeSubBab.questions || activeSubBab.questions.length === 0) ? (
                        <div className="text-center py-1 space-y-1.5">
                          <p className="text-[11px] text-slate-400">Belum ada soal yang dibuat.</p>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => addQuestion('multiple_choice')}
                              className="px-2 py-1 text-[11px] font-semibold text-[#2196F3] bg-blue-50 hover:bg-blue-100 rounded-sm border border-blue-200 transition-colors"
                            >
                              + PG
                            </button>
                            <button
                              type="button"
                              onClick={() => addQuestion('sql_query')}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-sm border border-emerald-200 transition-colors"
                            >
                              + SQL
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap gap-1.5">
                            {activeSubBab.questions.map((qItem: any, qIdx: number) => {
                              const isCurrentQuestion =
                                Math.min(activeQuestionIdx, activeSubBab.questions.length - 1) === qIdx &&
                                (activeTab === 'latihan' || (activeTab === 'preview' && previewMode === 'latihan'));
                              return (
                                <button
                                  key={qItem.id || qIdx}
                                  type="button"
                                  onClick={() => {
                                    setActiveQuestionIdx(qIdx);
                                    if (activeTab === 'preview') {
                                      setPreviewMode('latihan');
                                    } else {
                                      setActiveTab('latihan');
                                    }
                                  }}
                                  title={`Soal ${qIdx + 1} (${qItem.type === 'sql_query' ? 'Query SQL' : 'Pilihan Ganda'})`}
                                  className={`w-8 h-8 flex items-center justify-center rounded-sm font-semibold text-xs border transition-all ${
                                    isCurrentQuestion
                                      ? 'bg-[#2196F3] text-white border-[#2196F3] shadow-sm'
                                      : 'bg-white text-slate-700 border-slate-200 hover:border-[#2196F3] hover:text-[#2196F3] hover:bg-blue-50/40'
                                  }`}
                                >
                                  {qIdx + 1}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => addQuestion('multiple_choice')}
                              className="flex-1 py-1 text-[11px] font-semibold text-[#2196F3] bg-blue-50/70 hover:bg-blue-100 rounded-sm border border-dashed border-blue-300 transition-colors"
                            >
                              + Pilihan Ganda
                            </button>
                            <button
                              type="button"
                              onClick={() => addQuestion('sql_query')}
                              className="flex-1 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 rounded-sm border border-dashed border-emerald-300 transition-colors"
                            >
                              + Query SQL
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Final Actions */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-2">
                  <button onClick={() => handleSimpanModul('Terbit')} disabled={isSubmitting} type="button" className="w-full py-2.5 text-sm font-bold text-white bg-[#2196F3] hover:bg-blue-600 rounded-sm transition-colors shadow-sm shadow-blue-500/20 disabled:opacity-50">
                    {isSubmitting ? 'Menyimpan...' : 'Simpan & Terbitkan Modul'}
                  </button>
                  <button onClick={() => handleSimpanModul('Draft')} disabled={isSubmitting} type="button" className="w-full py-2.5 text-sm font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-sm transition-colors disabled:opacity-50">
                    Simpan sebagai Draft
                  </button>
                </div>
              </div>

            </div>
          </>
        )}
        
      </div>

      <SqlTutorialModal
        isOpen={isTutorialModalOpen}
        initialTab={tutorialInitialTab}
        onClose={() => setIsTutorialModalOpen(false)}
        onApplyTemplate={(tpl: SqlTemplatePayload) => {
          let targetIndex = activeQuestionIdx;
          mutateActiveSubBab((sub) => {
            if (!sub.hasExercise) sub.hasExercise = true;
            if (!sub.questions) sub.questions = [];
            const currentQ = sub.questions[activeQuestionIdx];
            if (currentQ && currentQ.type === 'sql_query') {
              currentQ.queryType = tpl.queryType;
              currentQ.instruction = tpl.instruction;
              currentQ.targetTable = tpl.targetTable;
              currentQ.tables = tpl.tables;
              currentQ.answerTables = tpl.answerTables;
              currentQ.sqlAnswerKey = tpl.sqlAnswerKey;
            } else {
              sub.questions.push({
                id: `q_${Date.now()}`,
                type: 'sql_query',
                queryType: tpl.queryType,
                instruction: tpl.instruction,
                targetTable: tpl.targetTable,
                tables: tpl.tables,
                answerTables: tpl.answerTables,
                sqlAnswerKey: tpl.sqlAnswerKey,
                scoreWeight: 10,
              });
              targetIndex = sub.questions.length - 1;
            }
          });
          setActiveQuestionIdx(targetIndex);
          setActiveTab('latihan');
        }}
      />
    </main>
  );
}
