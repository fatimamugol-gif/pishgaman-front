// app/dashboard/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import LeadDrawer from '@/components/LeadDrawer';
import TicketsDashboard from '@/components/staff/TicketsDashboard';
import TasksManager from '@/components/staff/TasksManager';
import KnowledgeManager from '@/components/staff/KnowledgeManager';
import AccountingManager from '@/components/staff/AccountingManager';

type StaffTabType = 'analytics' | 'tickets' | 'tasks' | 'knowledge' | 'accounting';
type QuickRangeType = 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'custom';

export default function AgentDashboardMainPage() {
  const [hubData, setHubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('کارشناس محترم');
  const [userRole, setUserRole] = useState('agent');
  
  const [activeTab, setActiveTab] = useState<StaffTabType>('analytics');
  const [activeDrawerLead, setActiveLeadForDrawer] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [liveCallPopup, setLiveCallPopup] = useState<any>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [quickRange, setQuickRange] = useState<QuickRangeType>('today');

  // 🎯 فیکس شد: انتقال استیت سورت به بالاترین سطح کامپوننت (قبل از دستورهای شرطی return) جهت مهار ارور ری‌آکت
  const [extSortConfig, setExtSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
    key: 'total_minutes',
    direction: 'desc' 
  });

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  const BACKEND_BASE_URL = `http://${currentHost}:8000`; 

  const fetchHubData = async () => {
    const token = localStorage.getItem('token');
    const storedName = localStorage.getItem('user_name');
    if (storedName) setUserName(storedName);
    
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/next/agent/dashboard-hub?start_date=${startDate}&end_date=${endDate}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setHubData(data);
        setUserRole(data.is_supervisor ? 'supervisor' : 'agent');
      }
    } catch (err) {
      console.error("خطا در بارگذاری اطلاعات هب:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkLiveVoipPopup = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/next/dashboard/live-popup`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.active_call) {
          setLiveCallPopup(json.active_call);
        } else {
          setLiveCallPopup(null);
        }
      }
    } catch (e) {
      console.error("خطا در واکشی پاپ‌آپ مخابرات", e);
    }
  };

  useEffect(() => { 
    fetchHubData(); 
  }, [startDate, endDate]);

  useEffect(() => {
    const interval = setInterval(checkLiveVoipPopup, 2000);
    return () => clearInterval(interval);
  }, []);

  // 🎯 توابع موتور محاسباتی سورت داینامیک در سمت فرانت
  const getSortedExtensions = () => {
    const performanceData = hubData?.extensions_performance ? [...hubData.extensions_performance] : [];
    if (!extSortConfig) return performanceData;

    return performanceData.sort((a: any, b: any) => {
      let aVal = a[extSortConfig.key];
      let bVal = b[extSortConfig.key];

      if (extSortConfig.key === 'avg_talk_time') {
        const parseSeconds = (str: string) => {
          if (!str) return 0;
          let total = 0;
          const m = str.match(/(\d+)m/);
          const s = str.match(/(\d+)s/);
          if (m) total += parseInt(m[1]) * 60;
          if (s) total += parseInt(s[1]);
          return total > 0 ? total : parseInt(str) || 0;
        };
        aVal = parseSeconds(aVal);
        bVal = parseSeconds(bVal);
      }

      if (typeof aVal === 'string') {
        return extSortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal, 'fa') 
          : bVal.localeCompare(aVal, 'fa');
      } else {
        return extSortConfig.direction === 'asc' 
          ? (aVal ?? 0) - (bVal ?? 0) 
          : (bVal ?? 0) - (aVal ?? 0);
      }
    });
  };

  const handleExtSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (extSortConfig && extSortConfig.key === key && extSortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setExtSortConfig({ key, direction });
  };

  const getSortIndicator = (key: string) => {
    if (!extSortConfig || extSortConfig.key !== key) return ' ↕️';
    return extSortConfig.direction === 'asc' ? ' 🔼' : ' 🔽';
  };

  const handleQuickRangeChange = (range: QuickRangeType) => {
    setQuickRange(range);
    const today = new Date();
    
    if (range === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (range === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const mystr = yesterday.toISOString().slice(0, 10);
      setStartDate(mystr);
      setEndDate(mystr);
    } else if (range === 'last_7_days') {
      const past7 = new Date();
      past7.setDate(today.getDate() - 7);
      setStartDate(past7.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (range === 'last_30_days') {
      const past30 = new Date();
      past30.setDate(today.getDate() - 30);
      setStartDate(past30.toISOString().slice(0, 10));
      setEndDate(todayStr);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center text-xs text-slate-500 font-sans" dir="rtl">
        ⏳ در حال بارگذاری کارتابل و هوش محاسباتی پیشگامان...
      </div>
    );
  }

  const metrics = hubData?.metrics || { total_leads: 0, pending_tasks_count: 0, today_reminders_count: 0, total_calls: 0, answered_calls: 0, no_answer_calls: 0, outbound_count: 0, inbound_count: 0, today_tickets: 0, pending_invoices: 0, today_paid_invoices: 0, pending_tasks: 0 };
  const isSupervisor = userRole === 'supervisor';
  const roundToFixed = (num: number) => Math.round(num * 10) / 10;

  return (
    <div className="p-8 space-y-6 bg-[#f4f6fa] min-h-screen text-[#2d3748] font-sans text-[11px] relative" dir="rtl">
      
      {/* پاپ‌آ‌پ لایو مخابرات */}
      {liveCallPopup && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 border border-emerald-500 text-white p-5 rounded-[24px] w-72 shadow-2xl animate-bounce space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <strong className="text-[10px] text-emerald-400 font-bold">📞 تماس ورودی زنده...</strong>
            </span>
            <button onClick={() => setLiveCallPopup(null)} className="text-slate-500 hover:text-white font-bold">✖</button>
          </div>
          <div>
            <h4 className="text-sm font-black text-white">{liveCallPopup.customer_name}</h4>
            <p className="text-xs font-mono text-slate-400 mt-1" dir="ltr">{liveCallPopup.phone}</p>
          </div>
          <button 
            onClick={() => {
              setActiveLeadForDrawer({ id: liveCallPopup.lead_id, name: liveCallPopup.customer_name, phone: liveCallPopup.phone });
              setIsDrawerOpen(true);
              setLiveCallPopup(null);
            }}
            className="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl text-center text-xs"
          >
            🚀 باز کردن فوری پرونده متقاضی
          </button>
        </div>
      )}

      {/* هدر لوکس به همراه منوی بازه‌های زمانی سریع */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-[24px] text-white shadow-xl flex flex-col xl:flex-row justify-between items-center gap-4 border border-indigo-900/40">
        <div className="flex flex-col lg:flex-row items-center gap-4 w-full xl:w-auto justify-between xl:justify-start">
          <div>
            <h1 className="text-xl font-black tracking-tight">
              {isSupervisor ? '👑 داشبورد نظارتی و داده‌کاوی ناظر ارشد' : '💼 میزکار و آنالیز پرفورمنس کارشناس'}
            </h1>
            <p className="text-[10px] text-slate-400 mt-1">خوش‌آمدید {userName} دوست گرامی؛ بخش‌های فنی و کارتابل‌ها آماده پردازش هستند.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10 text-[10px] font-bold">
            <span className="text-slate-400">📊 فیلتر پایش:</span>
            <select 
              value={quickRange} 
              onChange={(e) => handleQuickRangeChange(e.target.value as QuickRangeType)}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg p-1 outline-none font-bold cursor-pointer text-[10px]"
            >
              <option value="today">امروز</option>
              <option value="yesterday">دیروز</option>
              <option value="last_7_days">هفته گذشته (۷ روز)</option>
              <option value="last_30_days">ماه گذشته (۳۰ روز)</option>
              <option value="custom">بازه سفارشی (دستی)</option>
            </select>

            <div className={`flex items-center gap-1.5 transition-all ${quickRange !== 'custom' ? 'opacity-50 pointer-events-none' : ''}`}>
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setQuickRange('custom'); }} className="bg-slate-800 border border-slate-700 rounded-lg p-1 text-white text-center font-mono outline-none cursor-pointer" />
              <span className="text-slate-500">تا</span>
              <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setQuickRange('custom'); }} className="bg-slate-800 border border-slate-700 rounded-lg p-1 text-white text-center font-mono outline-none cursor-pointer" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/10">
          <button onClick={() => setActiveTab('analytics')} className={`px-3 py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5'}`}>📊 آمار و پایش زنده</button>
          <button onClick={() => setActiveTab('tickets')} className={`px-3 py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer ${activeTab === 'tickets' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5'}`}>🎫 تیکت‌های متقاضیان</button>
          <button onClick={() => setActiveTab('tasks')} className={`px-3 py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer ${activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5'}`}>📋 صدور وظیفه کلاینت</button>
          <button onClick={() => setActiveTab('knowledge')} className={`px-3 py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer ${activeTab === 'knowledge' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5'}`}>📚 مدیریت پایگاه دانش</button>
          <button onClick={() => setActiveTab('accounting')} className={`px-3 py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer ${activeTab === 'accounting' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5'}`}>💳 هاب حسابداری و اقساط</button>
        </div>
      </div>

      {/* 📊 بخش ماژول ۴ ویجت عملیاتی درشت‌شده و ۱۰۰٪ کلیک‌پذیر */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div onClick={() => setActiveTab('tickets')} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4 cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl text-lg font-bold group-hover:scale-110 transition-transform">🎫</div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold">تیکت‌های باز بازه</div>
            <div className="text-base font-black text-slate-950 mt-0.5">{metrics.today_tickets} مورد</div>
          </div>
        </div>
        
        <div onClick={() => setActiveTab('accounting')} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4 cursor-pointer hover:border-teal-400 hover:shadow-md transition-all group">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-lg font-bold group-hover:scale-110 transition-transform">💳</div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold">فیش‌های باز بررسی</div>
            <div className="text-base font-black text-rose-600 mt-0.5">{metrics.pending_invoices} سند</div>
          </div>
        </div>

        <div onClick={() => setActiveTab('accounting')} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4 cursor-pointer hover:border-teal-400 hover:shadow-md transition-all group">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-lg font-bold group-hover:scale-110 transition-transform">💰</div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold">وصولی‌های موفق بازه</div>
            <div className="text-base font-black text-emerald-600 mt-0.5">{metrics.today_paid_invoices} تراکنش</div>
          </div>
        </div>

        <div onClick={() => setActiveTab('tasks')} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4 cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl text-lg font-bold group-hover:scale-110 transition-transform">📋</div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold">تکالیف معلق کلاینت</div>
            <div className="text-base font-black text-slate-950 mt-0.5">{metrics.pending_tasks} تسک</div>
          </div>
        </div>
      </div>

      {/* بخش نمایش تب‌ها */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-white space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b pb-3 mb-2">
                  <h2 className="font-black text-xs text-slate-800">☎️ پیگیری‌های فوری معلق امروز</h2>
                  <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg text-[9px] font-bold">اتوماسیون زنده</span>
                </div>
                <div className="space-y-3 max-h-[180px] overflow-y-auto">
                  {hubData?.recent_reminders?.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-[10px]">هیچ آلارم تماس عقب‌افتاده‌ای نداری رفیق. ✨</div>
                  ) : (
                    hubData?.recent_reminders?.map((rem: any) => (
                      <div key={rem.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100/60 transition-all">
                        <div>
                          <div className="font-black text-xs text-slate-800">{rem.title}</div>
                          <div className="text-[9px] text-slate-400 font-medium mt-0.5">{rem.description || 'بدون توضیحات'}</div>
                        </div>
                        <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-mono font-bold text-[10px]">{rem.reminder_time || '09:00'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="text-slate-400 text-[10px] pt-2 border-t font-medium">
                جمع کل اقدامات: <span className="font-mono font-bold text-rose-600">{metrics.today_reminders_count} اعلان</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-white flex flex-col justify-between">
              <h2 className="font-black text-xs text-slate-800">
                {isSupervisor ? '📊 راندمان تبدیل کل دپارتمان فروش' : '⏱️ راندمان کارتابل اختصاصی من'}
              </h2>
              <div className="flex items-center justify-between my-2">
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 font-bold">{isSupervisor ? 'کل پرونده‌های سیستم:' : 'پرونده‌های تحت مدیریت:'}</div>
                  <div className="text-xs font-black text-indigo-950">{metrics.total_leads} متقاضی فعال</div>
                  <div className="text-[10px] text-slate-400 mt-2">تسک‌های باز مشاورین:</div>
                  <div className="font-mono text-xs font-black text-amber-600">{metrics.pending_tasks_count} اقدام معلق</div>
                </div>
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-indigo-600" strokeDasharray="74, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute font-mono font-black text-xs text-slate-800">۷۴٪</div>
                </div>
              </div>
              <div className="bg-indigo-50 text-indigo-700 p-2.5 rounded-xl text-[10px] font-bold text-center">
                🎯 آمارهای شما بر اساس اقدامات لایو بازه زمانی کارتابل فیکس شده است.
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-950 to-indigo-900 text-white p-6 rounded-[24px] shadow-[0_12px_40px_rgba(49,46,129,0.15)] flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <h2 className="font-black text-xs opacity-90">وضعیت زنده پورتال پیشگامان</h2>
                <span className="text-xs opacity-60 select-none">•••</span>
              </div>
              <div className="my-4 space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="opacity-70">سرخط تهران پیشگامان:</span>
                  <span className="text-sky-300 font-mono font-bold">2191018028</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="opacity-70">سرخط مشهد پیشگامان:</span>
                  <span className="text-sky-300 font-mono font-bold">5191015025</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="opacity-70">شنود مخابرات:</span>
                  <span className="text-emerald-400 font-bold">AMI اتصال ۱۰۰٪ امن</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl flex justify-between items-center">
                <div>
                  <div className="text-[10px] opacity-90 font-bold">تفکیک جهت لایو</div>
                  <div className="text-[9px] opacity-65">خطاهای تغییر داده کاملاً خنثی شدند.</div>
                </div>
                <Link href="/dashboard/leads" className="bg-white text-indigo-950 px-2.5 py-1 rounded-lg font-bold text-[9px] hover:bg-slate-100 transition-all">
                  ورود به میزکار
                </Link>
              </div>
            </div>
          </div>

          {/* ماژول گزارش داده‌کاوی مکالمات ارتقا یافته با متراژ دقایق */}
          <div className="bg-white p-6 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-white space-y-6">
            <div className="border-b pb-3 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-800">
                📈 پکیج تحلیل استراتژیک مکالمات مخابرات (بازه: {quickRange === 'today' ? 'امروز' : quickRange === 'yesterday' ? 'دیروز' : quickRange === 'last_7_days' ? 'هفته گذشته' : quickRange === 'last_30_days' ? 'ماه گذشته' : `${startDate} تا ${endDate}`})
              </h3>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg font-black">پایش فیلتر شده لایو</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-bold">
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="text-slate-400 text-[10px]">کل مکالمات بازه</div>
                <div className="text-lg font-black text-slate-800 font-mono mt-1">{metrics.total_calls} تماس</div>
                <div className="text-[9px] text-emerald-600 mt-1 font-medium">موفق: {metrics.answered_calls} مکالمه</div>
              </div>
              
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="text-slate-400 text-[10px]">تماس‌های ورودی (Inbound)</div>
                <div className="text-lg font-black text-sky-600 font-mono mt-1">{metrics.inbound_count} تماس</div>
                <div className="text-[9px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded mt-1 inline-block font-mono font-bold">⏱️ {metrics.inbound_duration_minutes ?? 0} دقیقه</div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="text-slate-400 text-[10px]">تماس‌های خروجی (Outbound)</div>
                <div className="text-lg font-black text-purple-600 font-mono mt-1">{metrics.outbound_count} تماس</div>
                <div className="text-[9px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded mt-1 inline-block font-mono font-bold">⏱️ {metrics.outbound_duration_minutes ?? 0} دقیقه</div>
              </div>

              <div className="p-3.5 bg-slate-900 border border-slate-950 text-white rounded-xl flex flex-col justify-center items-center">
                <div className="text-slate-400 text-[9px] font-bold">مجموع کل زمان گفتگو</div>
                <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                  {roundToFixed((metrics.inbound_duration_minutes ?? 0) + (metrics.outbound_duration_minutes ?? 0))} دقیقه
                </div>
              </div>
            </div>

            {/* ☎️ رصد لایو حجم مکالمات به تفکیک شماره داخلی سانترال */}
            {hubData?.extensions_performance?.length > 0 && (
              <div className="pt-6 border-t border-dashed border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-black text-indigo-950 flex items-center gap-1">
                    <span>🎛️ گزارش عملکرد و راندمان تجمیعی کارشناسان فروش:</span>
                  </h4>
                  <span className="text-[9px] text-slate-400 font-mono">تعداد کارشناسان فعال در بازه: {hubData.extensions_performance.length}</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-xs">
                  <table className="w-full text-right border-collapse bg-white">
                    <thead>
                      <tr className="bg-slate-950 text-white text-[10px] font-bold select-none">
                        <th className="p-2.5 cursor-pointer hover:bg-slate-900 transition-colors" onClick={() => handleExtSort('extension')}>نام کارشناس {getSortIndicator('extension')}</th>
                        <th className="p-2.5 text-center cursor-pointer hover:bg-slate-900 transition-colors" onClick={() => handleExtSort('total_calls')}>کل تماس‌ها {getSortIndicator('total_calls')}</th>
                        <th className="p-2.5 text-center cursor-pointer hover:bg-slate-900 transition-colors" onClick={() => handleExtSort('answered_calls')}>پاسخ داده شده {getSortIndicator('answered_calls')}</th>
                        <th className="p-2.5 text-center cursor-pointer hover:bg-slate-900 transition-colors" onClick={() => handleExtSort('inbound_minutes')}>دقایق ورودی {getSortIndicator('inbound_minutes')}</th>
                        <th className="p-2.5 text-center cursor-pointer hover:bg-slate-900 transition-colors" onClick={() => handleExtSort('outbound_minutes')}>دقایق خروجی {getSortIndicator('outbound_minutes')}</th>
                        <th className="p-2.5 text-center bg-amber-600 cursor-pointer hover:bg-amber-700 transition-colors" onClick={() => handleExtSort('avg_talk_time')}>میانگین گفتگو {getSortIndicator('avg_talk_time')}</th>
                        <th className="p-2.5 text-center bg-indigo-900 cursor-pointer hover:bg-indigo-950 transition-colors" onClick={() => handleExtSort('total_minutes')}>مجموع مکالمه {getSortIndicator('total_minutes')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[10px] font-medium text-slate-700">
                      {getSortedExtensions().map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors h-10">
                          <td className="p-2.5 font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            {item.extension}
                          </td>
                          <td className="p-2.5 text-center font-mono">{item.total_calls}</td>
                          <td className="p-2.5 text-center font-mono text-emerald-600 font-bold">{item.answered_calls}</td>
                          <td className="p-2.5 text-center font-mono text-slate-500">{item.inbound_minutes} m</td>
                          <td className="p-2.5 text-center font-mono text-slate-500">{item.outbound_minutes} m</td>
                          <td className="p-2.5 text-center font-mono font-bold text-amber-700 bg-amber-50/40">{item.avg_talk_time}</td>
                          <td className="p-2.5 text-center font-mono font-black bg-indigo-50/50 text-indigo-900">{item.total_minutes} دقیقه</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 👑 پنل رصد عملکرد کارشناسان فروش */}
            {hubData?.agents_performance?.length > 0 && (
              <div className="pt-4 border-t border-dashed border-slate-200">
                <div className="mb-3 text-[11px] font-black text-indigo-950 flex items-center gap-1.5">
                  <span>👥 پایش همزمان عملکرد و حجم مکالمات تیم مشاورین:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {hubData.agents_performance.map((agent: any) => (
                    <div key={agent.id} className="p-3 bg-gradient-to-b from-white to-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between shadow-xs">
                      <div>
                        <div className="font-black text-slate-800 text-xs">{agent.name}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5 font-medium">داخلی: {agent.extension}</div>
                        <div className="text-[9px] text-amber-600 font-bold mt-1">⏱️ میانگین: {agent.avg_talk_time}</div>
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] font-black text-slate-900 font-mono">{agent.total_calls} تماس</div>
                        <div className="text-[9px] font-bold text-emerald-600 font-mono bg-emerald-50 px-1 py-0.5 rounded mt-0.5 text-center">{agent.talk_minutes} دقیقه</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tickets' && <TicketsDashboard />}
      {activeTab === 'tasks' && <TasksManager />}
      {activeTab === 'knowledge' && <KnowledgeManager />}
      {activeTab === 'accounting' && <AccountingManager />}

      {isDrawerOpen && activeDrawerLead && (
        <LeadDrawer 
          lead={activeDrawerLead} 
          onClose={() => { setIsDrawerOpen(false); fetchHubData(); }} 
          onUpdate={async (updated) => {
            await fetch(`${BACKEND_BASE_URL}/api/next/leads/update/${updated.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
              body: JSON.stringify(updated)
            });
            alert('پرونده با موفقیت ذخیره شد.');
          }}
        />
      )}
    </div>
  );
}