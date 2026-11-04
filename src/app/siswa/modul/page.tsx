import Link from "next/link";
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Modul from '@/models/Modul';
import Progress from '@/models/Progress';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export default async function ModulPembelajaran() {
  await dbConnect();
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  let modules: any[] = [];
  let user: any = null;
  let progressRecords: any[] = [];
  let completedModuleIds = new Set<string>();

  if (token) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      user = await User.findById(payload.id).lean();
      
      if (user && user.kelas) {
        modules = await Modul.find({ 
          kelas_id: user.kelas,
          status: 'Terbit'
        }).sort({ createdAt: 1 }).lean();

        // Fetch user progress
        progressRecords = await Progress.find({ user_id: user._id }).lean();
        progressRecords.forEach((p: any) => {
          if (p.status === 'Selesai') {
            completedModuleIds.add(p.modul_id.toString());
          }
        });
      }
    } catch (e) {
      console.error("Invalid token or fetch error", e);
    }
  }

  const totalModules = modules.length;
  let sumProgress = 0;

  if (totalModules > 0) {
    modules.forEach((modul) => {
      let totalSubBabs = 0;
      modul.babs?.forEach((bab: any) => {
        totalSubBabs += bab.subBabs?.length || 0;
      });

      const progressRecord = progressRecords.find((p: any) => p.modul_id.toString() === modul._id.toString());
      const completedSubBabsCount = progressRecord?.completed_subbabs?.length || 0;
      const isCompleted = progressRecord?.status === 'Selesai';
      
      const modProgress = isCompleted ? 100 : (totalSubBabs > 0 ? Math.round((completedSubBabsCount / totalSubBabs) * 100) : 0);
      sumProgress += modProgress;
    });
  }

  const progressPercentage = totalModules > 0 ? Math.round(sumProgress / totalModules) : 0;

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 bg-[#F8FAFC]">
      
      {/* Header Modul */}
      <div className="bg-[#0D47A1] rounded-sm p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden text-white">
        {/* Dekorasi Minimalis */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 transform rotate-45 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-10 w-32 h-32 bg-white opacity-5 transform rotate-12 translate-y-1/2"></div>
        
        <div className="relative z-10 flex-1">
          <h1 className="text-2xl font-bold mb-2">Modul Pembelajaran</h1>
          <p className="text-blue-100 text-sm font-medium max-w-2xl leading-relaxed">
            Selesaikan modul secara berurutan. Setiap modul berisi materi dan tugas latihan yang harus diselesaikan untuk membuka modul berikutnya.
          </p>
        </div>
        
        <div className="relative z-10 sm:text-right border-t sm:border-t-0 sm:border-l border-blue-800 pt-4 sm:pt-0 sm:pl-6 min-w-[200px]">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide mb-2">Total Penyelesaian</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-blue-900 rounded-sm overflow-hidden">
              <div className="h-full bg-white transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <span className="font-bold text-lg">{progressPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Grid Modul */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        
        {!user?.kelas ? (
          <div className="col-span-full p-8 bg-white text-center rounded-sm border border-slate-200 text-slate-500">
            Anda belum tergabung ke dalam kelas apapun. Silakan bergabung terlebih dahulu.
          </div>
        ) : modules.length === 0 ? (
          <div className="col-span-full p-8 bg-white text-center rounded-sm border border-slate-200 text-slate-500">
            Belum ada modul yang diterbitkan untuk kelas Anda.
          </div>
        ) : (
          modules.map((modul, index) => {
            let totalSubBabs = 0;
            modul.babs?.forEach((bab: any) => {
              totalSubBabs += bab.subBabs?.length || 0;
            });

            const progressRecord = progressRecords.find((p: any) => p.modul_id.toString() === modul._id.toString());
            const completedSubBabsCount = progressRecord?.completed_subbabs?.length || 0;
            const isCompleted = progressRecord?.status === 'Selesai';
            
            const moduleProgress = isCompleted ? 100 : (totalSubBabs > 0 ? Math.round((completedSubBabsCount / totalSubBabs) * 100) : 0);

            // Active if it is the first module, OR if the previous module is completed and this one is not yet completed
            const isPreviousCompleted = index === 0 || completedModuleIds.has(modules[index - 1]._id.toString());
            const isActive = !isCompleted && isPreviousCompleted;
            const isLocked = !isActive && !isCompleted;
            
            return (
              <div key={modul._id.toString()} className={`rounded-sm p-6 flex flex-col shadow-sm transition-all ${isLocked ? 'bg-slate-50/50 border border-slate-200 opacity-80' : isActive ? 'bg-white border-l-4 border-l-[#2196F3] border-t border-r border-b border-slate-200' : 'bg-white border border-slate-200'}`}>
                <div className="flex justify-between items-start mb-4 gap-2">
                  <h2 className={`text-lg font-bold leading-tight ${isActive ? 'text-[#0D47A1]' : isLocked ? 'text-slate-500 font-semibold' : 'text-slate-800'}`}>
                    {index + 1}. {modul.judul}
                  </h2>
                  
                  {isCompleted && (
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-sm border border-green-200 flex-shrink-0 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      Selesai
                    </span>
                  )}
                  {isActive && (
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-sm border border-blue-200 flex-shrink-0 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                      Aktif
                    </span>
                  )}
                  {isLocked && (
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-1 rounded-sm border border-slate-200 flex-shrink-0 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      Terkunci
                    </span>
                  )}
                </div>
                
                <p className={`text-sm flex-1 mb-6 leading-relaxed line-clamp-3 ${isLocked ? 'text-slate-500' : 'text-slate-600'}`}>
                  {modul.tujuan || 'Tidak ada deskripsi tujuan.'}
                </p>
                
                <div>
                  <div className={`flex justify-between text-xs font-semibold mb-1.5 ${isLocked ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span>Progress</span>
                    <span className={isActive || isCompleted ? 'text-slate-800' : ''}>{moduleProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-sm mb-4 overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : isActive ? 'bg-[#2196F3]' : 'bg-slate-200'}`} style={{ width: `${moduleProgress}%` }}></div>
                  </div>
                  
                  {isLocked ? (
                    <button disabled className="w-full bg-slate-100 text-slate-400 py-2 font-semibold rounded-sm cursor-not-allowed text-sm">
                      Terkunci
                    </button>
                  ) : (
                    <Link href={`/siswa/modul/${modul._id.toString()}`} className={`w-full block text-center py-2 font-semibold rounded-sm transition-colors text-sm ${isActive ? 'bg-[#2196F3] hover:bg-[#1E88E5] text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'}`}>
                      {isCompleted ? 'Ulas Materi' : 'Mulai Belajar'}
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}

      </div>
    </main>
  );
}
