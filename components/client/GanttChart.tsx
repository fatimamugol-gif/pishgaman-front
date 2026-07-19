// components/client/GanttChart.tsx
'use client';


import React from 'react';
interface GanttChartProps {
  tasks: any[];
}

export default function GanttChart({ tasks }: GanttChartProps) {
  // شبیه‌ساز ماه‌های فرآیند اجرایی پرونده متقاضیان رسمی پیشگامان
  const timeAxis = ['ماه اول', 'ماه دوم', 'ماه سوم', 'ماه چهارم', 'ماه پنجم', 'ماه ششم'];

  return (
    <div className="bg-white dark:bg-slate-950 rounded-[24px] border p-5 shadow-2xs font-sans text-[11px] text-right" dir="rtl">
      <div className="border-b pb-3 mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-xs font-black text-slate-900">📊 بورد ماتریسی و گانت چارت پیشرفته پرونده</h3>
          <p className="text-[9px] text-slate-400 mt-0.5">نگاشت هوشمند خط زمان و نیازمندی‌های دپارتمانی</p>
        </div>
        <div className="flex gap-2 text-[9px] font-bold">
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span> تکمیل شده
          </span>
          <span className="flex items-center gap-1 text-indigo-600">
            <span className="w-2 h-2 rounded-full bg-indigo-600 block animate-pulse"></span> جاری
          </span>
        </div>
      </div>

      {/* 👑 ساختار شبکه گانت چارت ترلو استایل */}
      <div className="border rounded-2xl overflow-hidden bg-slate-50/40">
        
        {/* هدر محور زمان */}
        <div className="grid grid-cols-12 bg-slate-100 border-b text-[10px] font-black text-slate-500 py-2.5 text-center">
          <div className="col-span-3 border-l text-right pr-4">عنوان اقدام / تکلیف</div>
          {timeAxis.map((month, i) => (
            <div key={i} className="col-span-1.5 border-l last:border-0">{month}</div>
          ))}
        </div>

        {/* ردیف‌های کارت‌های گانت چارت */}
        <div className="divide-y">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-slate-400 font-bold">اقدامی جهت نمایش در گانت چارت یافت نشد.</div>
          ) : (
            tasks.map((task, idx) => {
              const isDone = task.status === 'done';
              // شیفت داینامیک باکس‌های زمانی روی محور افقی بر اساس ایندکس جهت ایجاد نمای پله‌ای واقعی گانت
              const startOffset = Math.min(idx * 1.5, 6); 
              
              return (
                <div key={task.id} className="grid grid-cols-12 items-center min-h-[48px] bg-white transition-colors hover:bg-slate-50/50">
                  {/* ستون ثابت عنوان */}
                  <div className="col-span-3 pr-4 border-l h-full flex flex-col justify-center py-2 shrink-0">
                    <span className="font-black text-slate-900 text-xs">🎯 {task.task_title}</span>
                    <span className="text-[8px] font-mono text-slate-400 mt-0.5">ددلاین: {task.due_date_shamsi || '---'}</span>
                  </div>

                  {/* ستون‌های گرید زمانی متحرک */}
                  <div className="col-span-9 h-full relative flex items-center px-2">
                    <div 
                      className={`h-7 rounded-xl flex items-center justify-center text-[9px] font-black text-white px-3 shadow-3xs transition-all duration-500 truncate ${isDone ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/10' : 'bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-md shadow-indigo-600/10 animate-pulse'}`}
                      style={{ 
                        width: isDone ? '100%' : '50%',
                        marginRight: isDone ? '0%' : `${startOffset * 12}%`
                      }}
                    >
                      {isDone ? '✓ تحویل و تایید شد' : `در دست اقدام کارشناس (${task.priority === 'high' ? 'فوری' : 'عادی'})`}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}