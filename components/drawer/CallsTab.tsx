// components/drawer/CallsTab.tsx
'use client';

import React from 'react';

interface CallsTabProps {
  leadCallLogs: any[];
  callsLoading: boolean;
  refreshCallLogs: () => void;
}

export default function CallsTab({ leadCallLogs, callsLoading, refreshCallLogs }: CallsTabProps) {
  return (
    <div className="space-y-4 pb-10 animate-fadeIn">
      <div className="flex justify-between items-center border-b pb-2 dark:border-slate-800">
        <h4 className="font-black text-slate-800 dark:text-slate-200 text-xs">📋 تاریخچه خطوط مرکز تلفن استریسک</h4>
        <button type="button" onClick={refreshCallLogs} disabled={callsLoading} className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg font-bold">{callsLoading ? '⏳...' : '🔄 رفرش لاگ'}</button>
      </div>
      <div className="space-y-2.5">
        {leadCallLogs.length === 0 ? (
          <div className="text-center text-slate-400 py-10 font-bold">هیچ سابقه تماسی ثبت نشده است.</div>
        ) : (
          leadCallLogs.map((log: any, idx: number) => (
            <div key={idx} className="p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl flex justify-between items-center shadow-2xs">
              <div>
                <div className="font-black text-xs text-slate-800 dark:text-slate-200">{log.call_type === 'outbound' ? '↗️ تماس خروجی' : '↙️ تماس ورودی'} - داخلی {log.agent_extension}</div>
                <div className="text-[9px] text-slate-400 font-mono mt-1">🕒 {log.created_at}</div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[9px] font-black ${log.disposition === 'ANSWERED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{log.disposition === 'ANSWERED' ? '🟢 موفق' : '🔴 بی‌پاسخ'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}