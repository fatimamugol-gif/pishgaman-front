// components/staff/ConsultationTracker.tsx
'use client';

import React from 'react';

export default function ConsultationTracker({ trackingData }: { trackingData: any }) {
  const summary = trackingData || { total_call_minutes: 0, total_ticket_minutes: 0, active_consultants: [] };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-2xs space-y-4 text-right animate-fadeIn" dir="rtl">
      
      {/* هدر بخش پایش راندمان */}
      <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-2.5">
        <div>
          <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            📊 دایره شفافیت و گزارش زمانی پرونده شما
          </h3>
          <p className="text-slate-400 text-[9px] mt-0.5">ثبت زنده زمان صرف شده توسط مشاوران ارشد برای پیشبرد اهداف مهاجرتی پرونده شما</p>
        </div>
        <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 text-[9px] font-black px-2.5 py-1 rounded-xl">🛠️ در حال پردازش</span>
      </div>

      {/* باکس‌های نئونی نمایش مجموع کارکرد مشاوران */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="p-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl relative overflow-hidden border border-indigo-900">
          <div className="text-[10px] text-slate-400 font-bold">⏱️ مجموع جلسات و ارتباطات تلفنی:</div>
          <div className="text-xl font-mono font-black text-emerald-400 mt-1">{summary.total_call_minutes} <span className="text-[10px] font-sans text-white">دقیقه گفتگو</span></div>
          <span className="absolute left-4 bottom-3 text-2xl opacity-20">📞</span>
        </div>

        <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl relative overflow-hidden border border-slate-800">
          <div className="text-[10px] text-slate-400 font-bold">🎫 زمان بررسی تیکت‌ها و مکاتبات اداری:</div>
          <div className="text-xl font-mono font-black text-sky-400 mt-1">{summary.total_ticket_minutes} <span className="text-[10px] font-sans text-white">دقیقه بررسی</span></div>
          <span className="absolute left-4 bottom-3 text-2xl opacity-20">📝</span>
        </div>

      </div>

      {/* لیست مشاوران اختصاصی که روی این پرونده کار کرده‌اند */}
      <div className="pt-2">
        <span className="text-[10px] font-black text-slate-500 block mb-2">🧑‍💼 کارشناسان ارشد تخصیص‌یافته به پرونده شما:</span>
        <div className="flex flex-wrap gap-2">
          {summary.active_consultants?.length > 0 ? (
            summary.active_consultants.map((agent: any, i: number) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-center font-black leading-6 text-[10px]">
                  {agent.name.charAt(0)}
                </div>
                <div>
                  <div className="font-black text-slate-800 dark:text-slate-200">{agent.name}</div>
                  <div className="text-[8px] text-slate-400 font-bold">{agent.role || 'مشاور مهاجرت'} (داخلی {agent.agent_extension})</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-[9px] text-slate-400 font-medium">پرونده تحت نظارت مستقیم شورای مرکزی پیشگامان قرار دارد. ✨</div>
          )}
        </div>
      </div>

    </div>
  );
}