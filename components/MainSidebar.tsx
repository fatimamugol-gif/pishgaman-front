// components/MainSidebar.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';

export default function MainSidebar() {
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  
  const [role, setRole] = useState<string>('agent');
  const [userName, setUserName] = useState<string>('کارشناس');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false); // 🎯 استیت کنترل همبرگر مپ موبایل

  useEffect(() => {
    setRole(localStorage.getItem('user_role') || 'agent');
    setUserName(localStorage.getItem('user_name') || 'کارشناس ارشد');
  }, []);

  // 🎯 الحاق و استقرار آیتم پورتال اداری و مرخصی در آرایه منوهای اصلی سیستم
  const menuItems = [
    // { title: 'میزکار و اقدامات امروز', path: '/dashboard', icon: '⚡' },
    // { title: 'کارتابل مشاوره اولیه', path: '/dashboard/leads', icon: '🎯' },
    // { title: 'کلاینت ها', path: '/dashboard/clients', icon: '📝' },
    { title: 'پورتال اداری و مرخصی', path: '/dashboard/leaves', icon: '📆' }, // 👈 ماژول مستقل منابع انسانی
    // { title: 'مدیریت و دسترسی کارشناسان', path: '/dashboard/users', icon: '👥', isSupervisorOnly: true },
    // { title: 'اتاق آنالیز و گزارشات ناظر', path: '/dashboard/reports', icon: '👑', isSupervisorOnly: true },
    // { title: 'مدیریت فلوچارت و ورک‌فلوها', path: '/dashboard/workflows', icon: '🌡', isSupervisorOnly: true },
    { title: 'کال لاگ جامع', path: '/dashboard/call-logs', icon: '📕', isSupervisorOnly: true },
  ];

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "pishgaman_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = '/auth';
  };

  return (
    <>
      {/* 🍔 دکمه همبرگری شناور - فقط در موبایل ظاهر می‌شود (جایگزین کشوی ثابت) */}
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)} 
        className={`fixed top-4 right-4 z-50 md:hidden w-9 h-9 rounded-xl flex items-center justify-center border font-black text-sm shadow-md transition-all cursor-pointer ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {isMenuOpen ? '✕' : '☰'}
      </button>

      {/* 👤 بک‌دراپ تیره کننده پس‌زمینه در موبایل هنگام باز بودن سایدبار */}
      {isMenuOpen && (
        <div 
          onClick={() => setIsMenuOpen(false)} 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* 🗂️ بدنه اصلی سایدبار - کاملاً واکنش‌گرا بر اساس ابعاد شبکه */}
      <div 
        className={`w-64 h-screen fixed top-0 flex flex-col justify-between z-45 font-sans text-[11px] transition-all duration-300 border-l ${
          isDark 
            ? 'bg-slate-950/80 backdrop-blur-md border-slate-900 text-slate-300' 
            : 'bg-white/90 backdrop-blur-md border-slate-100 text-slate-600 shadow-xl'
        } ${
          /* 🧠 قفل مهندسی: در دسکتاپ چسبیده به راست (right-0) و در موبایل به صورت کشویی متحرک با استیت */
          isMenuOpen ? 'right-0' : '-right-64 md:right-0'
        }`} 
        dir="rtl"
      >
        <div>
          {/* هدر برندینگ متمایز با استایل نئونی هوش مصنوعی */}
          <div className={`p-5 border-b flex items-center justify-between ${isDark ? 'border-slate-900 bg-slate-950/40' : 'border-slate-50 bg-slate-50/50'}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-500/20">P</div>
              <div>
                <h2 className={`font-black text-xs tracking-wide ${isDark ? 'text-white' : 'text-slate-800'}`}>PISHGAMAN</h2>
                <p className="text-[8px] text-indigo-500 font-bold tracking-widest mt-0.5">AI WORKSPACE</p>
              </div>
            </div>
            
            {/* ☀️ کلید سوئیچ لوکس حالت روز و شب 🌙 */}
            <button 
              onClick={toggleTheme}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' 
                  : 'bg-slate-100 border-slate-200 text-indigo-900 hover:bg-slate-200 shadow-2xs'
              }`}
              title={isDark ? "سوئیچ به حالت روز لوکس" : "سوئیچ به شب نئونی"}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>

          {/* کارت پروفایل مینیمال معلق */}
          <div className={`p-4 mx-3 my-4 rounded-xl border flex items-center gap-2.5 ${
            isDark ? 'bg-slate-900/40 border-slate-900' : 'bg-slate-50 border-slate-100'
          }`}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-xs">👤</div>
            <div className="truncate">
              <div className={`font-black text-[11px] ${isDark ? 'text-white' : 'text-slate-800'}`}>{userName}</div>
              <div className="text-[9px] text-indigo-500 font-bold mt-0.5">
                {role === 'supervisor' ? '👑 ناظر ارشد شعبه' : '💼 کارشناس فروش'}
              </div>
            </div>
          </div>

          {/* گزینه‌های منو با افکت هاور نئون */}
          <nav className="px-3 space-y-1">
            {menuItems.map((item, index) => {
              // if (item.isSupervisorOnly && role !== 'supervisor') return null;
              const isActive = pathname === item.path;

              return (
                <Link 
                  key={index} 
                  href={item.path}
                  onClick={() => setIsMenuOpen(false)} // 🎯 بستن خودکار منو پس از کلیک در موبایل
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 group ${
                    isActive 
                      ? 'bg-gradient-to-l from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20' 
                      : isDark
                        ? 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600 shadow-2xs'
                  }`}
                >
                  <span className={`text-sm transition-transform group-hover:scale-110 duration-200`}>{item.icon}</span>
                  <span className="text-xs">{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* دکمه خروج مینیمال در لبه پایینی */}
        <div className={`p-3 border-t ${isDark ? 'border-slate-900 bg-slate-950/20' : 'border-slate-50 bg-slate-50/10'}`}>
          <button 
            onClick={handleLogout}
            className="w-full text-right px-4 py-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2"
          >
            <span>🚪</span> خروج ایمن از سامانه
          </button>
        </div>

      </div>
    </>
  );
}