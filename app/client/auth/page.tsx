// app/client/auth/page.tsx

"use client";

import React, { useState } from 'react';

export default function ClientAuthPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  const BACKEND_BASE_URL = `http://${currentHost}:8000`;

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return alert('لطفاً شماره همراه و رمز عبور را وارد کنید.');

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/next/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          username: username, // شماره همراه یا ایمیل ثبت شده کلاینت
          password: password, // ۶ رقم آخر شماره همراه کلاینت (رمز پیش‌فرض پس از عقد قرارداد)
          portal: 'client'    // گیت پرتال مشتری
        })
      });

      const data = await res.json();

      if (data.status === 'success' && data.token) {
        // 🧠 ذخیره‌سازی توکن اتمیک کلاینت در حافظه فرانت‌آند
        localStorage.setItem('token', data.token);
        localStorage.setItem('user_id', data.user.id.toString());
        
        alert(`✨ خوش‌آمدید مخاطب گرامی، ${data.user.name}`);
        // هدایت مستقیم و خودکار به دشبورد پورتال کلاینت
        window.location.href = '/client/dashboard';
      } else {
        alert('⚠️ خطا: ' + (data.message || 'مشخصات ورود اشتباه است.'));
      }
    } catch (err) {
      console.error(err);
      alert('🚨 خطای شبکه در اتصال به هسته احراز هویت لاراول.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 md:p-8 rounded-[24px] w-full max-w-sm shadow-2xl text-right space-y-5">
        
        <div className="text-center space-y-1">
          <h2 className="text-base font-black text-slate-800 dark:text-white">🔐 ورود به پرتال متقاضیان پیشگامان</h2>
          <p className="text-slate-400 text-[10px]">برای مشاهده وضعیت پرونده، شماره همراه و رمز خود را وارد کنید.</p>
        </div>

        <form onSubmit={handleClientLogin} className="space-y-3 font-bold text-[11px] text-slate-600 dark:text-slate-400">
          <label className="block space-y-1">📱 شماره همراه / نام کاربری:
            <input 
              type="text" 
              placeholder="مثال: 09123456789" 
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl text-xs font-mono text-center tracking-widest outline-none text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </label>

          <label className="block space-y-1">🔑 کلمه عبور اختصاصی:
            <input 
              type="password" 
              placeholder="رمز عبور شما (۶ رقم آخر شماره خط)" 
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl text-xs text-center outline-none text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black py-2.5 rounded-xl text-center shadow-lg shadow-indigo-500/10 transition-all cursor-pointer text-xs"
          >
            {loading ? '⏳ در حال تایید گارد امنیتی...' : '🔓 ورود امن به میزکار'}
          </button>
        </form>

      </div>
    </div>
  );
}