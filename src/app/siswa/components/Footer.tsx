export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#90CAF9]/60 p-4 text-center text-xs font-bold text-[#0D47A1]/60 flex-shrink-0">
      &copy; {new Date().getFullYear()} AkademiData - Sistem Auto Grader SQL. Dibuat untuk Keperluan Ujian Sekolah.
    </footer>
  );
}
