// components/staff/AdminHolidayManager.tsx
'use client';

import React, { useState } from 'react';
import ShamsiCalendarView from './ShamsiCalendarView'; // 🎯 لود قطعی ماژول گرافیکی تقویم
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';


export default function AdminHolidayManager({ usersList, holidaysList, BACKEND_BASE_UR, onRefresh }: any) {
  const [adminHoliday, setAdminHoliday] = useState({ date: '', title: '' });
  const [customLimitForm, setCustomLimitForm] = useState({ user_id: '', limit: '' });

  const BACKEND_BASE_URL = API_BASE_URL;
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_BASE_URL}/next/hr/admin/store-holiday`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ holiday_date_shamsi: adminHoliday.date, title: adminHoliday.title })
    });
    if (res.ok) {
      alert('✓ روز تعطیل رسمی با موفقیت در کورتکس تقویم دشبورد پلمب شد.');
      setAdminHoliday({ date: '', title: '' });
      onRefresh();
    }
  };

  const handleCustomLimitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_BASE_URL}/next/hr/admin/update-limit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: parseInt(customLimitForm.user_id), custom_limit: parseInt(customLimitForm.limit) })
    });
    if (res.ok) {
      alert('✓ سقف مرخصی اختصاصی کارشناس در دیتابیس قفل شد.');
      setCustomLimitForm({ user_id: '', limit: '' });
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* 💳 باکس فرم‌ها (بخش تیره رنگ موجود در اسکرین‌شات شما) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900 text-white p-6 rounded-[24px] border border-slate-950">
        
        {/* ستون سمت راست: فرم درج مناسبت */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-black text-amber-400">🎉 پرتال و کورتکس تقویم تعطیلات رسمی پیشگامان</h3>
            <p className="text-slate-400 text-[10px] mt-0.5">جمعه‌ها خودکار قفل هستند؛ مابقی تواریخ مصوب را الحاق کنید.</p>
          </div>
          
          <form onSubmit={handleAddHoliday} className="flex gap-2 items-center">
            <input type="text" placeholder="تاریخ: 1405/04/14" className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-center font-mono text-white text-[10px] w-28 outline-none" value={adminHoliday.date} onChange={e => setAdminHoliday({ ...adminHoliday, date: e.target.value })} required />
            <input type="text" placeholder="مناسبت تعطیلی..." className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-[10px] font-bold flex-1 outline-none" value={adminHoliday.title} onChange={e => setAdminHoliday({ ...adminHoliday, title: e.target.value })} required />
            <button type="submit" className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black px-3 py-2 rounded-xl text-[10px] cursor-pointer transition-all">➕ پلمب</button>
          </form>
        </div>

        {/* ستون سمت چپ: مدیریت سقف مرخصی اختصاصی کارمندان */}
        <div className="space-y-3 border-r border-slate-800 pr-6 flex flex-col justify-start">
          <div>
            <h3 className="text-xs font-black text-sky-400">⚙️ تعیین سقف مرخصی اختصاصی پرسنل</h3>
            <p className="text-slate-400 text-[10px] mt-0.5">تغییر و بازنویسی سقف ۱۸ روز پیش‌فرض تناسبی شعبه مرکزی</p>
          </div>
          <form onSubmit={handleCustomLimitSubmit} className="flex gap-2 items-center pt-1">
            <select className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-[10px] flex-1 cursor-pointer outline-none" value={customLimitForm.user_id} onChange={e => setCustomLimitForm({ ...customLimitForm, user_id: e.target.value })} required>
              <option value="">انتخاب کارشناس...</option>
              {usersList.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <input type="number" placeholder="تعداد روز..." className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-[10px] w-20 text-center outline-none font-mono" value={customLimitForm.limit} onChange={e => setCustomLimitForm({ ...customLimitForm, limit: e.target.value })} required />
            <button type="submit" className="bg-sky-500 text-slate-950 font-black px-3 py-2 rounded-xl text-[10px] cursor-pointer hover:bg-sky-600 transition-all">🔏 قفل سقف</button>
          </form>
        </div>

      </div>

      {/* 🎯 شلیک نهایی: استقرار تقویم گرافیکی دو ستونه کاملاً متمایز در زیر کادر تیره */}
      <div className="mt-4">
        <ShamsiCalendarView holidaysList={holidaysList || []} />
      </div>

    </div>
  );
}