'use client';

import React, { useEffect } from 'react';

interface IncomingCallAlertProps {
  callerName?: string;
  callerNumber: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallAlert({ callerName = 'متقاضی جدید', callerNumber, onAccept, onDecline }: IncomingCallAlertProps) {
  useEffect(() => {
    // 🎵 پخش لوپ صدای زنگ تلفن قدیمی سیستمی
    const ringtone = new Audio('https://assets.mixkit.co/active_storage/sfx/1344/1344-500.wav');
    ringtone.loop = true;
    
    ringtone.play().catch(() => {
      console.log("مرورگر برای پخش صدا به تعامل اولیه کاربر نیاز دارد.");
    });

    // 🧼 قطع فوری صدا به محض کلیک روی دکمه‌ها یا قطع تماس
    return () => {
      ringtone.pause();
      ringtone.currentTime = 0;
    };
  }, []);

  return (
    <div 
      // 🎯 فیکس در سمت راست - لبه‌های فوق گرد Jaida UI - اجرای انیمیشن لرزش مداوم
      className="fixed bottom-6 right-6 w-80 bg-white dark:bg-slate-900 border-2 border-emerald-500 dark:border-emerald-600 shadow-[0_15px_50px_-10px_rgba(16,185,129,0.4)] rounded-[24px] p-5 z- animate-call-shake text-right font-sans transition-all duration-300"
      dir="rtl"
    >
      {/* هدر هشدار */}
      <div className="flex justify-between items-center mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
        <h5 className="font-black text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5">
          <span className="inline-block animate-bounce">📞</span> تماس ورودی از آستریسک
        </h5>
        <button onClick={onDecline} className="text-slate-400 hover:text-rose-500 font-bold text-sm cursor-pointer">×</button>
      </div>
      
      {/* اطلاعات لید */}
      <div className="space-y-1 py-1">
        <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{callerName}</p>
        <p className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400 tracking-wider">{callerNumber}</p>
      </div>

      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
        مرکز تلفن در حال هدایت تماس به داخلی شماست...
      </p>
      
      {/* اکشن‌ها */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button 
          onClick={onAccept}
          className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold transition-all text-center cursor-pointer text-xs shadow-md shadow-emerald-600/20"
        >
          ✅ پاسخگویی
        </button>

        <button 
          onClick={onDecline}
          className="bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 dark:hover:bg-rose-600 hover:text-white text-slate-700 dark:text-slate-300 py-2.5 rounded-xl font-bold transition-all text-center cursor-pointer text-xs"
        >
          ❌ رد تماس
        </button>
      </div>
    </div>
  );
}