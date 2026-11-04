import Link from "next/link";
import dbConnect from "@/lib/mongoose";
import Modul from "@/models/Modul";
import Progress from "@/models/Progress";
import { notFound, redirect } from "next/navigation";
import FinishModuleButton from "../../components/FinishModuleButton";
import ExerciseView from "./ExerciseView";
import ExerciseButton from "./ExerciseButton";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export default async function IsiMateri({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await dbConnect();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  let moduleData: any = null;

  try {
    const fetchedModul = await Modul.findById(resolvedParams.id).lean();
    if (!fetchedModul) {
      return notFound();
    }
    moduleData = fetchedModul;
  } catch (err) {
    return notFound();
  }
  
  let completedSubBabs: string[] = [];
  let existingExerciseData = null;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (token) {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      if (payload.role === 'siswa') {
        const progress = await Progress.findOne({ user_id: payload.id as string, modul_id: resolvedParams.id }).lean();
        if (progress) {
          completedSubBabs = (progress as any).completed_subbabs || [];
          const allScores = (progress as any).exercise_scores || [];
          const currentSubId = moduleData.babs?.[parseInt(resolvedSearchParams.bab as string || "0")]?.subBabs?.[parseInt(resolvedSearchParams.sub as string || "0")]?._id?.toString();
          if (currentSubId) {
             existingExerciseData = allScores.find((s: any) => s.subbab_id === currentSubId) || null;
          }
        }
      }
    }
  } catch (e) {
    // ignore auth errors here, just proceed with no completed subbabs
  }

  // Redirect to first uncompleted subbab if bab/sub are not specified in URL
  if (resolvedSearchParams.bab === undefined && resolvedSearchParams.sub === undefined) {
    let targetBabIdx = 0;
    let targetSubIdx = 0;
    let foundUncompleted = false;

    if (moduleData.babs) {
      for (let bIdx = 0; bIdx < moduleData.babs.length; bIdx++) {
        const b = moduleData.babs[bIdx];
        if (b.subBabs) {
          for (let sIdx = 0; sIdx < b.subBabs.length; sIdx++) {
            const s = b.subBabs[sIdx];
            if (!completedSubBabs.includes(s._id.toString())) {
              targetBabIdx = bIdx;
              targetSubIdx = sIdx;
              foundUncompleted = true;
              break;
            }
          }
        }
        if (foundUncompleted) break;
      }
    }
    
    redirect(`/siswa/modul/${resolvedParams.id}?bab=${targetBabIdx}&sub=${targetSubIdx}`);
  }

  // Parse current indices from URL, default to 0
  const currentBabIdx = parseInt(resolvedSearchParams.bab as string || "0");
  const currentSubIdx = parseInt(resolvedSearchParams.sub as string || "0");
  
  const bab = moduleData.babs?.[currentBabIdx];
  const subBab = bab?.subBabs?.[currentSubIdx];
  const title = subBab?.title || "Judul Topik";
  const content = subBab?.content || "<p>Belum ada materi untuk modul ini.</p>";
  
  // Calculate Next Topic logic
  let nextBabIdx = currentBabIdx;
  let nextSubIdx = currentSubIdx + 1;
  let hasNext = true;

  if (bab && nextSubIdx >= (bab.subBabs?.length || 0)) {
    nextBabIdx = currentBabIdx + 1;
    nextSubIdx = 0;
    if (nextBabIdx >= (moduleData.babs?.length || 0)) {
      hasNext = false;
    }
  }

  // Construct next URL
  const nextUrl = hasNext 
    ? `/siswa/modul/${resolvedParams.id}?bab=${nextBabIdx}&sub=${nextSubIdx}`
    : `/siswa/modul`;
  
  const buttonLabel = hasNext ? "Tandai Selesai & Lanjut" : "Selesaikan Modul";
  
  const isExerciseMode = resolvedSearchParams.latihan === '1';
  
  return (
    <main className="flex-1 overflow-hidden flex flex-col bg-white">
      
      <div className="flex flex-col h-full w-full overflow-y-auto">
        
        {isExerciseMode && subBab?.hasExercise ? (
          <ExerciseView 
            modulId={resolvedParams.id}
            subBab={JSON.parse(JSON.stringify(subBab))}
            currentBabIdx={currentBabIdx}
            currentSubIdx={currentSubIdx}
            hasNext={hasNext}
            nextUrl={nextUrl}
            buttonLabel={buttonLabel}
            existingData={resolvedSearchParams.redo === '1' ? null : existingExerciseData ? JSON.parse(JSON.stringify(existingExerciseData)) : null}
          />
        ) : (
          <div className="flex-1 w-full bg-white flex flex-col animate-in fade-in duration-300">
            
            {/* Header Konten */}
            <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-sm border border-blue-200">
                  Topik Aktif
                </span>
                {subBab?.hasExercise && (
                  <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-sm border border-orange-200">
                    Ada Latihan Soal
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                {title}
              </h1>
              <p className="text-slate-600">
                Modul: {moduleData.judul}
              </p>
            </div>

            {/* Isi Teks / Video */}
            <div className="p-6 sm:p-8 flex-1">
              <div 
                className="prose prose-slate max-w-none" 
                dangerouslySetInnerHTML={{ __html: content }} 
              />
            </div>

            {/* Footer Action */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end mt-auto gap-4">
              {subBab?.hasExercise ? (
                existingExerciseData ? (
                  <>
                    <div className="mr-auto text-sm font-bold text-slate-700">
                      Nilai Latihan: <span className={existingExerciseData.score >= 70 ? 'text-green-600' : 'text-red-500'}>{existingExerciseData.score}</span> / 100
                    </div>
                    <ExerciseButton 
                      href={`/siswa/modul/${resolvedParams.id}?bab=${currentBabIdx}&sub=${currentSubIdx}&latihan=1`}
                      existingScore={existingExerciseData.score}
                    />
                    <FinishModuleButton 
                      modulId={resolvedParams.id} 
                      subBabId={subBab?._id?.toString() || `${currentBabIdx}-${currentSubIdx}`}
                      isLast={!hasNext}
                      nextUrl={nextUrl}
                      label={buttonLabel}
                    />
                  </>
                ) : (
                  <ExerciseButton 
                    href={`/siswa/modul/${resolvedParams.id}?bab=${currentBabIdx}&sub=${currentSubIdx}&latihan=1`}
                  />
                )
              ) : (
                <FinishModuleButton 
                  modulId={resolvedParams.id} 
                  subBabId={subBab?._id?.toString() || `${currentBabIdx}-${currentSubIdx}`}
                  isLast={!hasNext}
                  nextUrl={nextUrl}
                  label={buttonLabel}
                />
              )}
            </div>

          </div>
        )}
        
      </div>
    </main>
  );
}
