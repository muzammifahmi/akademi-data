'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function ExerciseButton({
  href,
  existingScore
}: {
  href: string;
  existingScore?: number | null;
}) {
  const router = useRouter();

  const handleRedo = async (e: React.MouseEvent) => {
    e.preventDefault();
    const result = await Swal.fire({
      title: 'Kerjakan Ulang?',
      text: 'Jika Anda mengerjakan ulang, nilai saat ini akan diperbarui dengan nilai yang baru.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2196F3',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Kerjakan Ulang',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      router.push(href + '&redo=1');
    }
  };

  if (existingScore !== undefined && existingScore !== null) {
    return (
      <button 
        onClick={handleRedo}
        className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-sm hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
      >
        Kerjakan Ulang
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
      </button>
    );
  }

  return (
    <Link 
      href={href}
      className="px-6 py-2.5 bg-[#FF9800] text-white font-bold text-sm rounded-sm hover:bg-[#F57C00] transition-colors shadow-sm flex items-center gap-2"
    >
      Kerjakan Latihan
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
    </Link>
  );
}
