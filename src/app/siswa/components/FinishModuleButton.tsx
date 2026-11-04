"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  modulId: string;
  subBabId: string;
  isLast: boolean;
  nextUrl: string;
  label: string;
}

export default function FinishModuleButton({ modulId, subBabId, isLast, nextUrl, label }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          modul_id: modulId,
          sub_bab_id: subBabId,
          is_last: isLast
        })
      });
      const data = await res.json();
      if (data.success) {
        router.push(nextUrl);
        router.refresh();
      } else {
        alert(data.error || "Gagal menyimpan progres");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleFinish}
      disabled={loading}
      className={`px-6 py-2 bg-[#2196F3] hover:bg-[#1E88E5] text-white font-semibold rounded-sm transition-colors text-sm shadow-sm flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {loading ? "Menyimpan..." : label}
      {!loading && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isLast ? "M5 13l4 4L19 7" : "M9 5l7 7-7 7"} /></svg>}
    </button>
  );
}
