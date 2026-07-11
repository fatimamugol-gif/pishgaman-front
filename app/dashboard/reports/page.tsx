'use client';

import React, { useEffect, useState } from 'react';

export default function SupervisorReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAlertCall, setHasAlertCall] = useState(false); // استیت تشخیص تماس‌های معلق و بدون گزارش

  const fetchReports = async () => {
    setLoading(true);
    
    // 🎯 قفل پویا روی آی‌پی شبکه داخلی مهندس کیسکا جهت دسترسی بدون لکنت تمام دپارتمان‌ها
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : '192.168.1.245';
    const BACKEND_BASE_URL = `http://${currentHost}:8000`; 
    const token = localStorage.getItem('token');
    
    try {
      // ریکوئست دقیق به روت کنترلر شما همراه با پذیرش فرمت JSON خالص
      const res = await fetch(`${BACKEND_BASE_URL}/api/next/supervisor/reports`, { 
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Accept': 'application/json' 
        }
      });
      
      if (res.status === 403) {
        alert('🚫 دسترسی مخصوص ناظر ارشد سیستم است.');
        window.location.href = '/dashboard';
        return;
      }
      
      const data = await res.json();
      if (data.status === 'success') {
        setReportData(data);

        // 🚨 پایش اتمیک: بررسی اینکه آیا کارشناسی وجود دارد که تماس وضعیت‌سنجی نشده داشته باشد؟
        const hasUnreported = data.agent_performance?.some((agent: any) => agent.unreported_calls > 0);
        if (hasUnreported) {
          setHasAlertCall(true);
          // 🎵 پخش بوق هشدار یا زنگ تلفن مخصوص ناظر برای آگاهی از وضعیت بحرانی کارشناسان
          const alertAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
          alertAudio.play().catch(() => console.log("نیاز به تعامل اولیه کاربر با صفحه برای پخش صدای آلارم"));
        } else {
          setHasAlertCall(false);
        }
      }
    } catch (err) {
      console.error('🚨 [Fetch Reports Failed]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchReports(); 
  }, []);

  if (loading) return <div className="p-20 text-center text-xs text-slate-500 dark:text-slate-400 font-sans" dir="rtl">⏳ در حال تجمیع ماتریکس چهل‌گانه و رصد راندمان کارشناسان پیشگامان...</div>;

  if (!reportData) return <div className="p-20 text-center text-xs text-rose-500 font-bold font-sans" dir="rtl">داده‌ای از سرور دریافت نشد. لطفاً فایروال پورت ۸۰۰۰ لاراول یا اتصال شبکه را بررسی کنید.</div>;

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-right font-sans text-[11px] transition-colors duration-300" dir="rtl">
      
      {/* تزریق دینامیک انیمیشن لرزش لیدربورد بدون دستکاری فایل config سیستم */}
      <style>{`
        @keyframes callShake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-call-shake {
          animation: callShake 0.6s cubic-bezier(.36,.07,.19,.97) both infinite;
        }
      `}</style>
      
      {/* هدر بالایی پنل نظارت با لبه‌های فوق گرد Jaida UI */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm mb-6 flex justify-between items-center transition-colors duration-300">
        <div>
          <h1 className="text-lg font-black text-slate-800 dark:text-slate-100">📊 اتاق پایش، آنالیز و مانیتورینگ استراتژیک ناظر</h1>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">رصد زنده بار ترافیکی دپارتمان‌ها، تفکیک ۱۱ پرسونای روانشناختی و لیدربورد کارشناسان کال‌سنتر</p>
        </div>
        <button onClick={fetchReports} className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-[16px] text-xs hover:bg-indigo-700 transition-all cursor-pointer shadow-md shadow-indigo-600/20">🔄 به‌روزرسانی لایو آمار</button>
      </div>

      {/* بخش اول: پروگرس‌بارهای توزیع دپارتمان‌ها و وضعیت‌های بنفش */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        {/* ترافیک متقاضیان بر اساس دپارتمان‌ها */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-3 transition-colors duration-300">
          <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 border-b dark:border-slate-800 pb-2 flex items-center gap-1">🏢 ترافیک متقاضیان بر اساس دپارتمان‌ها</h3>
          <div className="space-y-3 pt-1">
            {reportData?.department_distribution?.map((dep: any, i: number) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>{dep.name}</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">{dep.total_leads} لید</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all" style={{ width: `${Math.min(dep.total_leads * 2, 100)}%` }}></div>
                </div>
              </div>
            ))}
            {(!reportData?.department_distribution || reportData.department_distribution.length === 0) && (
              <p className="text-slate-400 dark:text-slate-500 text-center py-2">داده‌ای برای نمایش وجود ندارد.</p>
            )}
          </div>
        </div>

        {/* مانیتورینگ وضعیت لیدها */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-3 transition-colors duration-300">
          <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 border-b dark:border-slate-800 pb-2 flex items-center gap-1">🎛️ مانیتورینگ وضعیت لیدها (مرحله پیگیری)</h3>
          <div className="space-y-3 pt-1">
            {reportData?.status_distribution?.map((st: any, i: number) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>{st.status || 'مشاوره جدید'}</span>
                  <span className="font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-800 text-[10px] font-black">{st.count} مورد</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 dark:bg-purple-500 h-full transition-all" style={{ width: `${Math.min(st.count * 4, 100)}%` }}></div>
                </div>
              </div>
            ))}
            {(!reportData?.status_distribution || reportData.status_distribution.length === 0) && (
              <p className="text-slate-400 dark:text-slate-500 text-center py-2">داده‌ای برای نمایش وجود ندارد.</p>
            )}
          </div>
        </div>

      </div>

      {/* 🏆 لیدربورد عملکرد کارشناسان (اگر تماس بدون گزارش داشته باشیم، کل این باکس مثل زنگ تلفن تکان می‌خورد) */}
      <div className={`bg-white dark:bg-slate-900 p-5 rounded-[24px] border shadow-sm transition-all duration-300 ${
        hasAlertCall 
          ? 'border-rose-500 dark:border-rose-600 animate-call-shake shadow-[0_0_25px_rgba(244,63,94,0.12)]' 
          : 'border-slate-100 dark:border-slate-800'
      }`}>
        <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3 mb-3">
          <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">🏆 کارنامه، راندمان و ظرفیت پایش کارشناسان فروش</h3>
          {hasAlertCall && (
            <span className="bg-rose-500 text-white font-bold px-2 py-0.5 rounded-lg text-[9px] animate-pulse">🚨 هشدار: تماس گزارش نشده در دپارتمان!</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold h-10 select-none transition-colors duration-300">
                <th className="p-3 rounded-r-xl">نام مشاور / کارشناس دپارتمان</th>
                <th className="p-3 text-center">تعداد لید منتسب شده</th>
                <th className="p-3 text-center">مشاوره‌های باقیمانده روز</th>
                <th className="p-3 text-center text-rose-600 dark:text-rose-400">🚨 تماس‌های وضعیت‌سنجی نشده</th>
                <th className="p-3 text-center">پیگیری‌های به سرانجام رسیده (Done)</th>
                <th className="p-3 text-center rounded-l-xl">شاخص راندمان تیمی (Progress)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
              {reportData?.agent_performance?.map((agent: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 h-12 transition-colors">
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">💼 {agent.name}</td>
                  <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{agent.total_leads} لید</td>
                  <td className="p-3 text-center font-mono text-amber-600 dark:text-amber-500 font-bold">{agent.pending_tasks} مشاورہ</td>
                  <td className={`p-3 text-center font-mono font-black ${agent.unreported_calls > 0 ? 'text-rose-600 bg-rose-50/40 dark:bg-rose-950/20' : 'text-emerald-600'}`}>
                    {agent.unreported_calls > 0 ? `🚨 ${agent.unreported_calls} مورد` : '🟢 0 مورد'}
                  </td>
                  <td className="p-3 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">{agent.done_tasks} تسک موفق</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="bg-indigo-600 dark:bg-indigo-500 text-white font-mono px-1.5 py-0.5 rounded font-bold text-[10px] min-w-[32px] text-center">%{agent.efficiency}</span>
                      <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden inline-block">
                        <div className="bg-indigo-600 dark:bg-indigo-500 h-full" style={{ width: `${agent.efficiency}%` }}></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!reportData?.agent_performance || reportData.agent_performance.length === 0) && (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500">دیتای کارشناسان یافت نشد.</div>
          )}
        </div>
      </div>

    </div>
  );
}