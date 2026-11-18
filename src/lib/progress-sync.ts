import Progress from '@/models/Progress';

export function extractModulSubBabIds(modul: any): string[] {
  const ids: string[] = [];
  if (!modul || !Array.isArray(modul.babs)) return ids;
  for (const bab of modul.babs) {
    if (Array.isArray(bab?.subBabs)) {
      for (const sub of bab.subBabs) {
        if (sub?._id) {
          ids.push(sub._id.toString());
        }
      }
    }
  }
  return ids;
}

export async function syncStudentProgressWithModul(modul: any, progressDoc: any) {
  const currentSubBabIds = extractModulSubBabIds(modul);
  const totalSubBabs = currentSubBabIds.length;

  if (!progressDoc) {
    return {
      completedSubBabIds: [] as string[],
      completedCount: 0,
      totalSubBabs,
      moduleProgress: 0,
      isCompleted: false,
      status: 'Sedang Dipelajari' as const,
      exerciseScores: [] as any[],
    };
  }

  const rawCompleted: string[] = Array.isArray(progressDoc.completed_subbabs)
    ? progressDoc.completed_subbabs.map((id: any) => String(id))
    : [];
  const rawScores: any[] = Array.isArray(progressDoc.exercise_scores)
    ? progressDoc.exercise_scores.map((s: any) => ({ ...s, subbab_id: String(s.subbab_id) }))
    : [];

  const currentIdSet = new Set(currentSubBabIds);

  // Pisahkan ID yang masih cocok langsung vs ID lama (akibat revisi modul yang mengganti _id sub-bab)
  const matchedIds = rawCompleted.filter((id) => currentIdSet.has(id));
  const unmatchedOldIds = rawCompleted.filter((id) => !currentIdSet.has(id));

  let needsDbUpdate = false;
  let reconciledCompleted = [...matchedIds];
  const reconciledScores = [...rawScores];

  // Jika ada ID sub-bab lama sebelum _id dipertahankan saat edit modul, petakan secara berurutan ke sub-bab awal yang belum masuk daftar
  if (unmatchedOldIds.length > 0 && currentSubBabIds.length > 0) {
    needsDbUpdate = true;
    for (let i = 0; i < unmatchedOldIds.length; i++) {
      const oldId = unmatchedOldIds[i];
      const candidateNewId = currentSubBabIds[i];
      if (candidateNewId && !reconciledCompleted.includes(candidateNewId)) {
        reconciledCompleted.push(candidateNewId);
        // Perbarui juga referensi subbab_id pada exercise_scores jika menggunakan oldId
        for (const scoreItem of reconciledScores) {
          if (scoreItem.subbab_id === oldId) {
            scoreItem.subbab_id = candidateNewId;
          }
        }
      }
    }
  }

  // Pastikan hanya ID yang benar-benar ada di modul saat ini dan unik yang dihitung
  reconciledCompleted = currentSubBabIds.filter((id) => reconciledCompleted.includes(id));

  if (JSON.stringify(reconciledCompleted) !== JSON.stringify(rawCompleted)) {
    needsDbUpdate = true;
  }

  const completedCount = reconciledCompleted.length;
  const isCompleted = totalSubBabs > 0 && completedCount === totalSubBabs;
  const expectedStatus = isCompleted ? 'Selesai' : 'Sedang Dipelajari';

  if (progressDoc.status !== expectedStatus) {
    needsDbUpdate = true;
  }

  if (needsDbUpdate && progressDoc._id) {
    try {
      await Progress.findByIdAndUpdate(progressDoc._id, {
        $set: {
          completed_subbabs: reconciledCompleted,
          exercise_scores: reconciledScores,
          status: expectedStatus,
        },
      });
    } catch (err) {
      console.error('Gagal menyinkronkan dokumen progres siswa:', err);
    }
  }

  const moduleProgress =
    totalSubBabs > 0 ? Math.round((completedCount / totalSubBabs) * 100) : 0;

  return {
    completedSubBabIds: reconciledCompleted,
    completedCount,
    totalSubBabs,
    moduleProgress,
    isCompleted,
    status: expectedStatus,
    exerciseScores: reconciledScores,
  };
}
