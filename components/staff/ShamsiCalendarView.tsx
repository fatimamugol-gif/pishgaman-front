// components/staff/ShamsiCalendarView.tsx
'use client';

import React, { useState } from 'react';

export default function ShamsiCalendarView({ holidaysList }: { holidaysList: any[] }) {
  const [currentMonthIdx, setCurrentMonthIdx] = useState(3); // پیش‌فرض: ماه تیر
  const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

  // فیلتر کردن رویدادها و مناسبت‌های ثبت شده این ماه
  const currentMonthHolidays = (holidaysList || []).filter((h: any) => {
    if (!h.holiday_date_shamsi) return false;
    const parts = h.holiday_date_shamsi.split('/');
    return parts[1] === (currentMonthIdx + 1).toString().padStart(2, '0');
  });

  return (
    <div className="flex flex-col md:flex-row gap-6 bg-[#f4f6fa] p-4 rounded-[28px] border border-slate-200/50 shadow-inner text-right" dir="rtl">
      
      {/* 📜 ستون سمت راست: لیست مناسبت‌های ماه */}
      <div className="w-full md:w-1/2 bg-white p-5 rounded-[22px] border border-slate-100 shadow-xs space-y-3">
        <div className="border-b pb-2">
          <h3 className="font-black text-slate-800 text-xs">📋 مناسبت‌های ماه {months[currentMonthIdx]}</h3>
          <p className="text-[9px] text-slate-400">رویدادها و مناسبت‌های تقویمی ثبت شده در سیستم</p>
        </div>
        <div className="space-y-2 text-[10px] font-bold text-slate-600 h-[220px] overflow-y-auto pr-1">
          {currentMonthHolidays.length > 0 ? currentMonthHolidays.map((h: any, i: number) => (
            <div key={i} className="flex gap-2 border-b border-dashed border-slate-100 pb-1.5 items-center">
              <span className="font-mono font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">
                {h.holiday_date_shamsi.split('/')[2]}
              </span>
              <span>{h.title}</span>
            </div>
          )) : <p className="text-slate-400 font-medium py-8 text-center text-[9px]">هیچ مناسبتی برای این ماه قید نشده است.</p>}
        </div>
      </div>

      {/* 📅 ستون سمت چپ: بدنه اصلی تقویم گرافیکی شیک شما */}
      <div className="w-full md:w-1/2 bg-white p-5 rounded-[22px] border border-slate-100 shadow-xs flex flex-col justify-between">
        <div className="flex justify-between items-center mb-3 bg-slate-50 p-1.5 rounded-xl border">
          <button type="button" onClick={() => setCurrentMonthIdx(p => p > 0 ? p - 1 : 11)} className="font-black text-slate-500 hover:text-slate-900 bg-white border px-2 py-0.5 rounded-lg text-[9px] cursor-pointer">ماه قبل</button>
          <span className="font-black text-slate-800 text-xs">{months[currentMonthIdx]} ۱۴۰۵</span>
          <button type="button" onClick={() => setCurrentMonthIdx(p => p < 11 ? p + 1 : 0)} className="font-black text-slate-500 hover:text-slate-900 bg-white border px-2 py-0.5 rounded-lg text-[9px] cursor-pointer">ماه بعد</button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-slate-400 mb-1">
          {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(d => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
            const formattedDay = day.toString().padStart(2, '0');
            const formattedMonth = (currentMonthIdx + 1).toString().padStart(2, '0');
            const fullDateStr = `1405/${formattedMonth}/${formattedDay}`;
            const hasHoliday = (holidaysList || []).some((h: any) => h.holiday_date_shamsi === fullDateStr);
            const isToday = (currentMonthIdx === 3 && day === 13); // هایلایت ۱۳ تیر

            return (
              <div 
                key={day} 
                className={`h-8 flex items-center justify-center rounded-lg border font-mono font-black text-[10px] relative transition-all ${
                  isToday 
                    ? 'bg-indigo-600 border-indigo-700 text-white shadow-md' 
                    : hasHoliday
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {day}
                {hasHoliday && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-rose-500"></span>}
              </div>
            );
          })}
        </div>

        <button type="button" onClick={() => setCurrentMonthIdx(3)} className="w-full mt-3 bg-amber-500 text-slate-950 font-black py-1.5 rounded-xl text-center text-[10px] cursor-pointer">
          برو به امروز (۱۳ تیر)
        </button>
      </div>

    </div>
  );
}