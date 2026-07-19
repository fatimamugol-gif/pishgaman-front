'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';

export default function StaffLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const BACKEND_BASE_URL = API_BASE_URL;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/next/auth/login`, {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: JSON.stringify({ username, password, portal: 'staff' })
      });
      
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        // ذخیره در لوکال استوریج برای کامپوننت‌ها
        localStorage.setItem('token', data.token);
        localStorage.setItem('user_role', data.user.role);
        localStorage.setItem('user_name', data.user.name);
        localStorage.setItem('user_id', data.user.id); // ذخیره آیدی یوزر برای سیستم لایو چت و ایونتها

        localStorage.setItem('user_permissions', JSON.stringify(data.user.user_permissions || {}));
        localStorage.setItem('dept_permissions', JSON.stringify(data.user.dept_permissions || {}));

        // 🧠 قفل طلایی حل باگ پابلیک آی‌پی مهندس کیسکا:
        // تغییر SameSite به Lax جهت اجازه دادن به مرورگر برای ذخیره کوکی در بسترهای HTTP بدون SSL شبکه
        document.cookie = `pishgaman_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

        if (data.user.role === 'supervisor') {
          alert(`سلام مهندس ${data.user.name}، ورود شما به عنوان ناظر ارشد تایید شد.`);
          router.push('/dashboard/leads');
        } else {
          alert(`کارشناس گرامی ${data.user.name}، به کارتابل فروش خوش آمدید.`);
          router.push('/dashboard/leads'); 
        }
      } else {
        // 🧠 مهار ریدایرکت بی‌صدا: نمایش ارورهای واقعی برگشتی از لاراول (مثل پسورد اشتباه)
        setError(data.message || 'اعتبار سنجی ناموفق بود. نام کاربری یا رمز عبور اشتباه است.');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور مرکزی لاراول؛ مطمئن شوید پورت ۸۰۰۰ بک‌اند باز است.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 font-sans text-right" dir="rtl">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">
        
        <div className="text-center space-y-1">
          <h2 className="text-xl font-black text-white tracking-tight">🔐 دروازه ورود کارکنان پیشگامان</h2>
          <p className="text-slate-500 text-xs">احراز هویت متمرکز ناظرین ارشد و کارشناسان کال‌سنتر</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl text-center animate-fadeIn">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-400">شماره موبایل یا ایمیل سازمانی:</label>
            <input type="text" required className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-left font-mono outline-none focus:border-indigo-500 transition-all"
              value={username} onChange={e => setUsername(e.target.value)} placeholder="0912..." />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-400">رمز عبور امنیتی:</label>
            <input type="password" required className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-left font-mono outline-none focus:border-indigo-500 transition-all"
              value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-black text-sm transition-all shadow-lg shadow-indigo-600/10 disabled:bg-slate-800 disabled:text-slate-600 cursor-pointer">
            {loading ? '⏳ در حال بررسی اصالت...' : '🚀 ورود به کارتابل هوشمند'}
          </button>
        </form>

        <div className="text-center">
          <span className="text-[10px] text-slate-600 font-mono">Pishgaman AI-Brain Workspace v2.6</span>
        </div>
      </div>
    </div>
  );
}