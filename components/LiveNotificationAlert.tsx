//LiveNotificationAlert.tsx

'use client';



import React, { useEffect, useState } from 'react';



export default function LiveNotificationAlert() {

  const [activeAlert, setActiveAlert] = useState<any>(null);



  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';

  const BACKEND_BASE_URL = `http://${currentHost}:8000`; // خودکار آی‌پی سیستم شما را پورت ۸۰۰۰ جفت می‌کند



  const checkReminders = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `${BACKEND_BASE_URL}/next/reminders/check-now`, // 🎯 فیکس باگ: حذف پیشوند اشتباه /api
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
          }
        }
      );

      const data = await res.json();
      if (data.status === 'success' && data.reminder) {
        setActiveAlert(data.reminder);
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
        audio.play().catch(() => {});
      }
    } catch (err) {
      console.log("لوپ پایش زنده فعال است");
    }
  };



  useEffect(() => {

    checkReminders();

    const interval = setInterval(checkReminders, 30000); // هر ۳۰ ثانیه چک اتمیک زمان سرور

    return () => clearInterval(interval);

  }, []);



  if (!activeAlert) return null;



  return (

    <div className="fixed bottom-5 left-5 bg-white border-2 border-indigo-600 shadow-2xl rounded-2xl p-5 w-80 z-50 animate-bounce text-xs text-right font-sans" dir="rtl">

      <div className="flex justify-between items-start mb-2 border-b pb-2">

        <h5 className="font-black text-indigo-600 text-sm flex items-center gap-1">🔔 هشدار پیگیری </h5>

        <button onClick={() => setActiveAlert(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">×</button>

      </div>

      

      <p className="font-bold text-slate-800 text-sm">{activeAlert.title}</p>

      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{activeAlert.description || 'نیاز به اقدام و پیگیری فوری کارشناس دپارتمان فروش.'}</p>

      

{/* 🦾 دکمه‌های اکشن وضعیت متصل به کنترلر لاراول مجهز به گارد توکن */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button onClick={async () => {
          const token = localStorage.getItem('token'); // 🎯 دریافت توکن برای دکمه
          const res = await fetch(`${BACKEND_BASE_URL}/next/reminders/status/${activeAlert.id}`, { // 🎯 اصلاح روت بدون api
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`, // 🎯 پلمب توکن سانکتوم
              'Accept': 'application/json'
            },
            body: JSON.stringify({ status: 'success' })
          });
          if (res.ok) {
            setActiveAlert(null);
          }
        }} className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl font-bold transition-all text-center cursor-pointer">
          ✅ انجام شد
        </button>

        <button onClick={async () => {
          const token = localStorage.getItem('token'); // 🎯 دریافت توکن برای دکمه
          const res = await fetch(`${BACKEND_BASE_URL}/next/reminders/status/${activeAlert.id}`, { // 🎯 اصلاح روت بدون api
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`, // 🎯 پلمب توکن سانکتوم
              'Accept': 'application/json'
            },
            body: JSON.stringify({ status: 'failed' })
          });
          if (res.ok) {
            setActiveAlert(null);
          }
        }} className="bg-rose-500 hover:bg-rose-600 text-white py-2 rounded-xl font-bold transition-all text-center cursor-pointer">
          ❌ انجام نشد
        </button>
      </div>

    </div>

  );

}