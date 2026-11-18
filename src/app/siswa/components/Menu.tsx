"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface MenuProps {
  isSidebarOpen: boolean;
}

export default function Menu({ isSidebarOpen }: MenuProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLocked, setIsLocked] = useState(true);
  const [moduleData, setModuleData] = useState<any>(null);
  const [ujianData, setUjianData] = useState<any>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);
  const [doubtfulQuestions, setDoubtfulQuestions] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setAnsweredQuestions(e.detail.answeredIds || []);
      setDoubtfulQuestions(e.detail.doubtfulIds || []);
      setActiveQuestionIdx(e.detail.activeIdx || 0);
      setResults(e.detail.results || {});
      setIsSubmitted(Boolean(e.detail.isSubmitted));
    };
    window.addEventListener('exercise-state-updated', handleUpdate);
    return () => window.removeEventListener('exercise-state-updated', handleUpdate);
  }, []);

  // Cek apakah sedang berada di dalam sebuah modul pembelajaran atau ujian
  const pathParts = pathname?.split("/") || [];
  const isInsideModule = pathParts.length > 3 && pathParts[2] === "modul";
  const currentModuleId = isInsideModule ? pathParts[3] : "";
  const isInsideUjian = pathParts.length > 3 && pathParts[2] === "ujian";
  const currentUjianId = isInsideUjian ? pathParts[3] : "";

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.error && data.kelas) {
          setIsLocked(false);
        }
      })
      .catch(err => console.error("Gagal mengecek status kelas", err));
  }, []);

  useEffect(() => {
    if (isInsideModule && currentModuleId) {
      fetch(`/api/modul/${currentModuleId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
             setModuleData(data.data);
          }
        })
        .catch(err => console.error("Gagal mengambil detail modul", err));
    }
  }, [isInsideModule, currentModuleId]);

  useEffect(() => {
    if (isInsideUjian && currentUjianId) {
      fetch(`/api/siswa/ujian/${currentUjianId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setUjianData(data.data);
          }
        })
        .catch(err => console.error("Gagal mengambil detail ujian", err));
    }
  }, [isInsideUjian, currentUjianId]);

  // Helper untuk menentukan apakah link sedang aktif
  const isActive = (path: string) => {
    return pathname?.startsWith(path);
  };

  // Class CSS untuk link aktif dan tidak aktif
  const activeClass = "bg-[#2196F3] text-white shadow-sm";
  const inactiveClass = "text-white/80 hover:bg-[#2196F3]/30 hover:text-white";

  return (
    <aside className={`absolute lg:relative z-30 h-full bg-[#0D47A1] text-white flex flex-col transition-all duration-300 ease-in-out shadow-xl ${isSidebarOpen ? 'translate-x-0 w-64 lg:w-72' : '-translate-x-full lg:translate-x-0 lg:w-20'}`}>
        
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center border-b border-[#2196F3]/40 bg-[#0D47A1] flex-shrink-0">
        {isSidebarOpen ? (
          <div className="flex items-center gap-3 w-full px-6">
            <div className="w-8 h-8 bg-white flex-shrink-0 flex items-center justify-center text-[#0D47A1] font-bold text-lg rounded-sm shadow-sm">
              AD
            </div>
            <span className="font-bold text-xl tracking-wide truncate">AkademiData</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-white flex-shrink-0 flex items-center justify-center text-[#0D47A1] font-bold text-lg rounded-sm shadow-sm">
            AD
          </div>
        )}
      </div>

      {/* Konten Sidebar Bergantung Konteks */}
      {isInsideModule ? (
        
        /* === TAMPILAN JIKA SEDANG DI DALAM MATERI / LATIHAN === */
        <nav className="flex-1 overflow-y-auto py-6 px-4 scrollbar-thin scrollbar-thumb-[#2196F3] scrollbar-track-transparent">
          
          <Link href="/siswa/modul" className={`flex items-center text-white/70 hover:text-white text-sm mb-8 font-semibold transition-colors ${isSidebarOpen ? 'gap-2' : 'justify-center'}`}>
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            {isSidebarOpen && <span>Kembali ke Daftar Modul</span>}
          </Link>
          
          {searchParams.get('latihan') === '1' ? (
            /* === NAVIGASI SOAL LATIHAN === */
            <div className="space-y-6">
              {isSidebarOpen && (
                <div>
                   <h2 className="text-xs font-bold text-[#90CAF9] mb-1 uppercase tracking-wider">Navigasi Soal</h2>
                   <p className="text-sm font-bold text-white">Latihan: {moduleData?.babs?.[parseInt(searchParams.get('bab') || '0')]?.subBabs?.[parseInt(searchParams.get('sub') || '0')]?.title || "Memuat..."}</p>
                </div>
              )}
              
              <div className={`grid gap-2 ${isSidebarOpen ? 'grid-cols-5' : 'grid-cols-1'}`}>
                {moduleData?.babs?.[parseInt(searchParams.get('bab') || '0')]?.subBabs?.[parseInt(searchParams.get('sub') || '0')]?.questions?.map((q: any, idx: number) => {
                  const isAnswered = answeredQuestions.includes(q.id);
                  const isDoubtful = doubtfulQuestions.includes(q.id);
                  const isActive = idx === activeQuestionIdx;
                  
                  let bgClass = 'bg-white/10 text-white/70 border border-white/20 hover:border-[#2196F3]';
                  if (isSubmitted) {
                    const res = results[q.id];
                    if (res?.isCorrect) {
                      bgClass = isActive
                        ? 'bg-emerald-500 text-white border-2 border-white shadow-lg'
                        : 'bg-emerald-600 text-white border border-emerald-500';
                    } else {
                      bgClass = isActive
                        ? 'bg-rose-500 text-white border-2 border-white shadow-lg'
                        : 'bg-rose-600 text-white border border-rose-500';
                    }
                  } else if (isActive) {
                    bgClass = 'bg-white text-[#0D47A1] border border-white shadow-md shadow-white/20'; // Soal yang dibuka
                  } else if (isDoubtful) {
                    bgClass = 'bg-orange-500 text-white border border-orange-500 shadow-sm'; // Ragu-ragu
                  } else if (isAnswered) {
                    bgClass = 'bg-[#2196F3] text-white border border-[#2196F3]'; // Sudah dijawab
                  }

                  return (
                    <button 
                      key={q.id}
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('exercise-nav-clicked', { detail: idx }));
                      }}
                      className={`aspect-square flex items-center justify-center rounded-sm font-bold text-sm transition-all cursor-pointer ${bgClass}`}
                      title={`Soal ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {isSidebarOpen && (
                <div className="mt-8 space-y-3">
                  {isSubmitted ? (
                    <>
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <div className="w-4 h-4 bg-emerald-600 border border-emerald-400 rounded-sm shrink-0 flex items-center justify-center font-bold text-[9px] text-white">✓</div>
                        Jawaban Benar
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <div className="w-4 h-4 bg-rose-600 border border-rose-400 rounded-sm shrink-0 flex items-center justify-center font-bold text-[9px] text-white">✕</div>
                        Jawaban Salah
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <div className="w-4 h-4 bg-white text-[#0D47A1] border border-white rounded-sm shrink-0 shadow-md shadow-white/20 flex items-center justify-center font-bold text-[8px]">!</div>
                        Sedang Dibuka
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <div className="w-4 h-4 bg-white/10 border border-white/20 rounded-sm shrink-0"></div>
                        Belum Dijawab
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <div className="w-4 h-4 bg-[#2196F3] border border-[#2196F3] rounded-sm shrink-0"></div>
                        Sudah Dijawab
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <div className="w-4 h-4 bg-orange-500 border border-orange-500 rounded-sm shrink-0"></div>
                        Ragu-ragu
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* === DAFTAR ISI MODUL === */
            <div className="space-y-6">
              {isSidebarOpen && (
                <div className="mb-6">
                   <h2 className="text-xs font-bold text-[#90CAF9] mb-1 uppercase tracking-wider">Daftar Isi</h2>
                   <p className="text-sm font-bold text-white">Modul: {moduleData?.judul || "Memuat..."}</p>
                </div>
              )}
              {moduleData?.babs?.map((bab: any, babIdx: number) => (
                 <div key={`bab-${babIdx}`}>
                   {isSidebarOpen && <p className="text-[11px] font-bold text-blue-200/80 mb-3 px-2 uppercase tracking-wider">{bab.title}</p>}
                   <div className="space-y-1">
                     {bab.subBabs?.map((subBab: any, subIdx: number) => {
                       const currentBabParam = searchParams.get('bab') || '0';
                       const currentSubParam = searchParams.get('sub') || '0';
                       const isActiveTopic = currentBabParam === babIdx.toString() && currentSubParam === subIdx.toString();
                       
                       const isCompleted = moduleData.completed_subbabs?.includes(subBab._id);
                       
                       let isLocked = false;
                       if (babIdx !== 0 || subIdx !== 0) {
                          let prevSubBabId = null;
                          if (subIdx > 0) {
                             prevSubBabId = moduleData.babs[babIdx].subBabs[subIdx - 1]._id;
                          } else {
                             const prevBab = moduleData.babs[babIdx - 1];
                             if (prevBab && prevBab.subBabs && prevBab.subBabs.length > 0) {
                                prevSubBabId = prevBab.subBabs[prevBab.subBabs.length - 1]._id;
                             }
                          }
                          if (prevSubBabId && !moduleData.completed_subbabs?.includes(prevSubBabId)) {
                             isLocked = true;
                          }
                       }
  
                       const Wrapper = isLocked ? "div" : Link;
                       const wrapperProps: any = {
                          className: `group flex items-center gap-3 relative rounded-md transition-all ${isSidebarOpen ? 'px-3 py-2.5' : 'p-2 justify-center'} ${
                             isActiveTopic 
                                ? 'bg-white/10' 
                                : isLocked 
                                   ? 'opacity-50 cursor-not-allowed' 
                                   : 'hover:bg-white/5 cursor-pointer'
                          }`
                       };
  
                       if (!isLocked) {
                          wrapperProps.href = `/siswa/modul/${currentModuleId}?bab=${babIdx}&sub=${subIdx}`;
                       }
                       
                       return (
                          <Wrapper key={`sub-${babIdx}-${subIdx}`} {...wrapperProps}>
                            {isActiveTopic && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#42A5F5] rounded-l-md"></div>
                            )}
                            
                            {/* Simple Icon / Number */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                               isCompleted && !isActiveTopic ? 'bg-green-500 text-white shadow-md' :
                               isActiveTopic ? 'bg-[#42A5F5] text-white shadow-md' : 
                               'bg-white/10 text-white/50 group-hover:bg-white/20 group-hover:text-white/80'
                            }`}>
                              {isCompleted && !isActiveTopic ? (
                                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                              ) : subIdx + 1}
                            </div>
                            
                            {isSidebarOpen && (
                              <div className="flex-1 overflow-hidden">
                                <p className={`text-sm truncate ${
                                   isActiveTopic ? 'font-bold text-white' : 
                                   isLocked ? 'font-medium text-white/40' : 
                                   'font-medium text-white/70 group-hover:text-white'
                                }`}>
                                  {subBab.title}
                                </p>
                                {isActiveTopic ? (
                                  <p className="text-[10px] text-blue-300 font-semibold mt-0.5 uppercase tracking-wide">
                                    Sedang Dipelajari
                                  </p>
                                ) : isLocked ? (
                                  <div className="flex items-center gap-1 mt-0.5 text-white/40">
                                     <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                     <p className="text-[10px] font-semibold uppercase tracking-wide">Terkunci</p>
                                  </div>
                                ) : isCompleted ? (
                                  <p className="text-[10px] text-green-400 font-semibold mt-0.5 uppercase tracking-wide">
                                    Selesai
                                  </p>
                                ) : null}
                              </div>
                            )}
                          </Wrapper>
                        );
                     })}
                   </div>
                 </div>
              ))}
            </div>
          )}
        </nav>

      ) : isInsideUjian ? (

        /* === TAMPILAN JIKA SEDANG DI DALAM UJIAN (NAVIGASI SOAL UJIAN) === */
        <nav className="flex-1 overflow-y-auto py-6 px-4 scrollbar-thin scrollbar-thumb-[#2196F3] scrollbar-track-transparent">
          <div className="space-y-6">
            {isSidebarOpen && (
              <div>
                <h2 className="text-xs font-bold text-[#90CAF9] mb-1 uppercase tracking-wider">Navigasi Soal</h2>
                <p className="text-sm font-bold text-white">Ujian: {ujianData?.judul || "Memuat..."}</p>
              </div>
            )}

            <div className={`grid gap-2 ${isSidebarOpen ? 'grid-cols-5' : 'grid-cols-1'}`}>
              {ujianData?.questions?.map((q: any, idx: number) => {
                const isAnswered = answeredQuestions.includes(q.id);
                const isDoubtful = doubtfulQuestions.includes(q.id);
                const isActive = idx === activeQuestionIdx;

                let bgClass = 'bg-white/10 text-white/70 border border-white/20 hover:border-[#2196F3]';
                if (isSubmitted) {
                  const res = results[q.id];
                  if (res?.isCorrect) {
                    bgClass = isActive
                      ? 'bg-emerald-500 text-white border-2 border-white shadow-lg'
                      : 'bg-emerald-600 text-white border border-emerald-500';
                  } else {
                    bgClass = isActive
                      ? 'bg-rose-500 text-white border-2 border-white shadow-lg'
                      : 'bg-rose-600 text-white border border-rose-500';
                  }
                } else if (isActive) {
                  bgClass = 'bg-white text-[#0D47A1] border border-white shadow-md shadow-white/20';
                } else if (isDoubtful) {
                  bgClass = 'bg-orange-500 text-white border border-orange-500 shadow-sm';
                } else if (isAnswered) {
                  bgClass = 'bg-[#2196F3] text-white border border-[#2196F3]';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('exercise-nav-clicked', { detail: idx }));
                    }}
                    className={`aspect-square flex items-center justify-center rounded-sm font-bold text-sm transition-all cursor-pointer ${bgClass}`}
                    title={`Soal ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {isSidebarOpen && (
              <div className="mt-8 space-y-3">
                {isSubmitted ? (
                  <>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <div className="w-4 h-4 bg-emerald-600 border border-emerald-400 rounded-sm shrink-0 flex items-center justify-center font-bold text-[9px] text-white">✓</div>
                      Jawaban Benar
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <div className="w-4 h-4 bg-rose-600 border border-rose-400 rounded-sm shrink-0 flex items-center justify-center font-bold text-[9px] text-white">✕</div>
                      Jawaban Salah
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <div className="w-4 h-4 bg-white text-[#0D47A1] border border-white rounded-sm shrink-0 shadow-md shadow-white/20 flex items-center justify-center font-bold text-[8px]">!</div>
                      Sedang Dibuka
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <div className="w-4 h-4 bg-white/10 border border-white/20 rounded-sm shrink-0"></div>
                      Belum Dijawab
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <div className="w-4 h-4 bg-[#2196F3] border border-[#2196F3] rounded-sm shrink-0"></div>
                      Sudah Dijawab
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <div className="w-4 h-4 bg-orange-500 border border-orange-500 rounded-sm shrink-0"></div>
                      Ragu-ragu
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>

      ) : (

        /* === TAMPILAN GLOBAL (MENU UTAMA) === */
        <nav className="flex-1 overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-[#2196F3] scrollbar-track-transparent">
          
          {/* BAB 1: UTAMA */}
          <div className="mb-6">
            {isSidebarOpen && <p className="px-6 text-xs font-bold text-[#90CAF9] uppercase tracking-wider mb-2">Utama</p>}
            {!isSidebarOpen && <div className="w-8 h-px bg-[#2196F3]/50 mx-auto mb-2"></div>}
            <ul className="space-y-1 px-3">
              <li>
                <Link href="/siswa/dashboard" className={`flex items-center gap-4 p-3 rounded-sm transition-colors ${isActive("/siswa/dashboard") ? activeClass : inactiveClass}`}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  {isSidebarOpen && <span className="font-semibold text-sm whitespace-nowrap">Dashboard Siswa</span>}
                </Link>
              </li>
            </ul>
          </div>

          {/* BAB 2: AKADEMIK & EVALUASI */}
          <div className="mb-6">
            {isSidebarOpen && <p className="px-6 text-xs font-bold text-[#90CAF9] uppercase tracking-wider mb-2">Akademik & Evaluasi</p>}
            {!isSidebarOpen && <div className="w-8 h-px bg-[#2196F3]/50 mx-auto mb-2"></div>}
            <ul className="space-y-1 px-3">
              <li>
                {isLocked ? (
                  <div className="flex items-center gap-4 p-3 rounded-sm text-white/40 cursor-not-allowed group relative" title="Bergabunglah dengan kelas terlebih dahulu">
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Modul Pembelajaran</span>}
                  </div>
                ) : (
                  <Link href="/siswa/modul" className={`flex items-center gap-4 p-3 rounded-sm transition-colors ${isActive("/siswa/modul") && !isInsideModule ? activeClass : inactiveClass}`}>
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Modul Pembelajaran</span>}
                  </Link>
                )}
              </li>
              <li>
                {isLocked ? (
                  <div className="flex items-center gap-4 p-3 rounded-sm text-white/40 cursor-not-allowed group relative" title="Bergabunglah dengan kelas terlebih dahulu">
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Latihan (IDE SQL)</span>}
                  </div>
                ) : (
                  <Link href="/siswa/latihan" className={`flex items-center gap-4 p-3 rounded-sm transition-colors ${isActive("/siswa/latihan") ? activeClass : inactiveClass}`}>
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Latihan (IDE SQL)</span>}
                  </Link>
                )}
              </li>
              <li>
                {isLocked ? (
                  <div className="flex items-center gap-4 p-3 rounded-sm text-white/40 cursor-not-allowed group relative" title="Bergabunglah dengan kelas terlebih dahulu">
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Riwayat Ujian & Nilai</span>}
                  </div>
                ) : (
                  <Link href="/siswa/riwayat" className={`flex items-center gap-4 p-3 rounded-sm transition-colors ${isActive("/siswa/riwayat") ? activeClass : inactiveClass}`}>
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Riwayat Ujian & Nilai</span>}
                  </Link>
                )}
              </li>
            </ul>
          </div>
        </nav>
      )}
    </aside>
  );
}
