// app/auth/login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OtpLoginPage() {
  const router = useRouter();
  
  // استیت‌های لایه ناوبری و اتصالات OTP
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [portal, setPortal] = useState<'staff' | 'client'>('staff');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [timer, setTimer] = useState(180); // ۳ دقیقه تایمر معکوس اعتبار کد پترن ippanel

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  const BACKEND_BASE_URL = `http://${currentHost}:8000`;

  // هندل کردن معکوس تایمر ۳ دقیقه‌ای
  useEffect(() => {
    if (step === 'code' && timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const formatTimer = () => {
    const mins = Math.floor(timer / 60).toString().padStart(2, '0');
    const secs = (timer % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // ۱. مرحله اول: شلیک درخواست ارسال پیامک پترن به لاراول
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return setMessage({ text: '⚠️ لطفا شماره موبایل خود را وارد کنید.', type: 'error' });
    
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // 🎯 فیکس روت: تغییر مسیر به روت بومی بدون پیشوند اشتباه /api جهت مهار CORS
      const res = await fetch(`${BACKEND_BASE_URL}/api/next/auth/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ phone, portal })
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setMessage({ text: '🟢 کد تایید ۵ رقمی با موفقیت پیامک شد.', type: 'success' });
        setStep('code');
        setTimer(180); 
      } else {
        setMessage({ text: `❌ ${data.message || 'خطا در تایید شماره تلفن.'}`, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: '🚨 خطا در ارتباط با سرور اتصالات لاراول.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ۲. مرحله دوم: تایید قطعی کد OTP و دریافت توکن Sanctum
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return setMessage({ text: '⚠️ لطفا کد ۵ رقمی را وارد کنید.', type: 'error' });

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // 🎯 فیکس روت: تغییر مسیر به روت بومی بدون پیشوند اشتباه /api جهت مهار CORS
      const res = await fetch(`${BACKEND_BASE_URL}/api/next/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ phone, code, portal })
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setMessage({ text: '⚡ احراز هویت موفقیت‌آمیز بود! در حال انتقال...', type: 'success' });
        
        setTimeout(() => {
          if (portal === 'staff') {
            router.push('/dashboard/leads');
          } else {
            // 🎯 تراز کردن آدرس پرتال مشتری با آدرسی که خودت ساختی (/client/dashboard)
            router.push('/client/dashboard');
          }
        }, 1200);
      } else {
        setMessage({ text: `❌ ${data.message || 'کد وارد شده نامعتبر است.'}`, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: '🚨 خطا در پردازش نهایی توکن امنیتی.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-right font-sans p-4 relative overflow-hidden select-none" dir="rtl">
      
      {/* استایل‌های بک‌گراند لوکس نئونی متحرک */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>

      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-8 rounded-[32px] w-full max-w-md shadow-2xl space-y-6 z-10">
        
        {/* هدر پورتال ورود */}
        <div className="text-center space-y-2">
          <span className="text-2xl">🦾</span>
          <h1 className="text-base font-black text-white tracking-tight">سامانه متمرکز احراز هویت پیشگامان</h1>
          <p className="text-slate-400 text-[10px]">ورود امن کارشناسان و متقاضیان دپارتمان از طریق سامانه پیامکی هوشمند</p>
        </div>

        {/* باکس شلیک اعلان‌ها */}
        {message.text && (
          <div className={`p-3 rounded-xl text-center text-[11px] font-bold border ${
            message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            {message.text}
          </div>
        )}

        {step === 'phone' ? (
          /* ================= فرم مرحله اول: دریافت شماره تلفن و نقش ================= */
          <form onSubmit={handleRequestOtp} className="space-y-4 animate-fadeIn">
            
            {/* سوییچر نئونی انتخاب پورتال کلاینت یا پرسنل */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1 text-[10px] font-black">
              <button 
                type="button" 
                onClick={() => setPortal('staff')} 
                className={`flex-1 py-2 rounded-lg text-center transition-all ${portal === 'staff' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                🧑‍💼 کارتابل پرسنل و مشاوران
              </button>
              <button 
                type="button" 
                onClick={() => setPortal('client')} 
                className={`flex-1 py-2 rounded-lg text-center transition-all ${portal === 'client' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                👤 پرتال اختصاصی متقاضیان
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-300 font-bold">📱 شماره موبایل ثبت شده در CRM:</label>
              <input 
                type="text" 
                required 
                maxLength={11}
                placeholder="مثال: 09123456789" 
                className="w-full p-3 bg-slate-950 text-white border border-slate-800 rounded-xl outline-none focus:border-indigo-600 font-mono text-left tracking-widest text-sm transition-all"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-black text-xs transition-all tracking-wide shadow-lg shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
            >
              {loading ? '⏳ در حال تایید گارد شماره تلفن...' : '🚀 ارسال رمز یک‌بار مصرف پیامکی'}
            </button>
          </form>
        ) : (
          /* ================= فرم مرحله دوم: دریافت کد ۵ رقمی OTP ================= */
          <form onSubmit={handleVerifyOtp} className="space-y-4 animate-scaleIn">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-300 font-bold">🔢 کد تایید ۵ رقمی ارسال شده:</label>
              <input 
                type="text" 
                required 
                maxLength={5}
                placeholder="• • • • •" 
                className="w-full p-3 bg-slate-950 text-white border border-slate-800 rounded-xl outline-none focus:border-indigo-600 font-mono text-center tracking-widest text-lg font-black transition-all text-indigo-400"
                value={code}
                onChange={e => setCode(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* کنترلرهای تایمر معکوس مخابراتی */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 px-1 select-none font-bold">
              <span>⏱️ زمان اعتبار کد: <span className="text-indigo-400 font-mono">{formatTimer()}</span></span>
              {timer === 0 ? (
                <button 
                  type="button" 
                  onClick={() => { setStep('phone'); setMessage({ text: '', type: '' }); }} 
                  className="text-amber-500 hover:text-amber-400 font-black transition-colors"
                >
                  🔄 درخواست مجدد کد تایید
                </button>
              ) : (
                <span className="text-slate-600">درخواست مجدد قفل است</span>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="submit" 
                disabled={loading || timer === 0}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-3 rounded-xl font-black text-xs transition-all shadow-lg cursor-pointer disabled:opacity-40"
              >
                {loading ? '⏳ پلمب نهایی توکن...' : '🔒 ورود قطعی به سیستم پورتال'}
              </button>
              <button 
                type="button" 
                onClick={() => { setStep('phone'); setMessage({ text: '', type: '' }); }}
                className="px-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                اصلاح شماره
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}