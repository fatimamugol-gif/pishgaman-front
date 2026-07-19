// app/dashboard/leaves/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import HrLeaveManager from '@/components/staff/HrLeaveManager';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';

export default function LeavesPage() {
  const [userRole, setUserRole] = useState('agent');
  const [loading, setLoading] = useState(true);

    const BACKEND_BASE_URL = API_BASE_URL;

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/next/agent/dashboard-hub`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (data.status === 'success') {
          setUserRole(data.is_supervisor ? 'supervisor' : 'agent');
        }
      } catch (err) {
        console.error("خطا در ارزیابی رول کارگزینی:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  if (loading) {
    return (
      <div className="p-20 text-center text-xs text-slate-500 font-sans" dir="rtl">
        ⏳ در حال فراخوانی دپارتمان منابع انسانی و کنترل تردد پیشگامان...
      </div>
    );
  }

  const isSupervisor = userRole === 'supervisor';

  return (
    <div className="p-6 space-y-6 text-right font-sans" dir="rtl">
      
      {/* هدر هوشمند متناسب با سطح دسترسی پرسنل */}
      <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-2xs">
        <h1 className="text-lg font-black text-slate-800">
          {isSupervisor 
            ? '👑 پرتال مدیریت متمرکز منابع انسانی' 
            : ' پرتال خدمات رفاهی و مانیتورینگ کارکرد کارشناس'}
        </h1>
        <p className="text-slate-400 text-[10px] mt-0.5">
          {isSupervisor 
            ? 'پایش لایو کارکرد پرسنل، داوری فرم‌های مرخصی و پلمب تقویم تعطیلات رسمی سالانه' 
            : 'ثبت لایو ورود و خروج، محاسبه هوشمند مانده مرخصی استحقاقی و آرشیو لاگ‌های زمانی'}
        </p>
      </div>
      
      {/* 🗂️ لود کورتکس ماژولار منابع انسانی پرتال پیشگامان */}
      <HrLeaveManager />

    </div>
  );
}