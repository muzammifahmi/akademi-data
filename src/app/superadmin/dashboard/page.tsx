"use client";

export default function DashboardSuperadmin() {
  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 bg-[#F8FAFC]">
      
      {/* Header Dashboard */}
      <div className="bg-[#0D47A1] rounded-sm p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 transform rotate-45 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-10 w-32 h-32 bg-white opacity-5 transform rotate-12 translate-y-1/2"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">Dashboard Global Super Admin</h1>
          <p className="text-blue-100 text-sm font-medium">
            Pantau metrik utama platform AkademiData dan analitik tenant secara real-time.
          </p>
        </div>
      </div>

      {/* Stats Cards (PRD: Total Sekolah, Total Pengguna, Eksekusi Query) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2196F3] flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tenant Sekolah</p>
            <p className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
              124
              <span className="text-xs font-medium text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-sm">+5</span>
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengguna Global</p>
            <p className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
              45.2K
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Eksekusi SQL (Hari Ini)</p>
            <p className="text-2xl font-extrabold text-slate-800">
              12,450
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Placeholder */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col h-96">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Statistik Aktivitas Eksekusi Sandbox</h2>
            <select className="border border-slate-200 text-sm rounded-sm px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3]/50">
              <option>7 Hari Terakhir</option>
              <option>30 Hari Terakhir</option>
            </select>
          </div>
          <div className="flex-1 p-4 flex items-center justify-center bg-slate-50/50 m-4 rounded-sm border border-dashed border-slate-200 relative overflow-hidden">
             {/* Simple Bar Chart Mockup */}
             <div className="absolute inset-0 flex items-end justify-between px-8 pt-12 pb-4">
                {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                  <div key={i} className="w-12 bg-blue-100 rounded-t-sm hover:bg-blue-200 transition-colors relative group">
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-xs py-1 px-2 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      {h}K
                    </div>
                    <div className="w-full bg-[#2196F3] rounded-t-sm" style={{ height: `${h}%` }}></div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Audit Log (Error Log) */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col h-96">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              Audit Log (Error)
            </h2>
            <button className="text-xs text-[#2196F3] hover:underline font-medium">Lihat Semua</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {[
              { time: "10:24", tenant: "TEN-003", error: "Connection Timeout Sandbox A" },
              { time: "09:12", tenant: "TEN-042", error: "Max Connection Reached" },
              { time: "08:45", tenant: "TEN-001", error: "Invalid Schema Sync" },
              { time: "Kemarin", tenant: "TEN-110", error: "OOM Killed Sandbox C" },
              { time: "Kemarin", tenant: "SYSTEM", error: "Failed to backup DB" },
            ].map((log, i) => (
              <div key={i} className="p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex flex-col gap-1 last:border-0 rounded-sm">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">{log.tenant}</span>
                  <span className="text-slate-400">{log.time}</span>
                </div>
                <div className="text-sm text-rose-600 font-medium">
                  {log.error}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
