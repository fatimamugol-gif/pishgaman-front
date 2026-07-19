"use client";

import React, { useState, useEffect } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';


export default function CallLogsDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [loading, setLoading] = useState(false);
  
  // 🧠 حافظه پنهان فرانت برای مپ کردن لایو نام‌ها بر اساس شماره تلفن
  const [leadMap, setLeadMap] = useState<Record<string, string>>({});
  
  // استیت‌های مدیریت ثبت سریع لید درون جدول
  const [quickCreateTarget, setQuickCreateTarget] = useState<string | null>(null);
  const [quickName, setQuickName] = useState('');
  const [isSubmittingQuickLead, setIsSubmittingQuickLead] = useState(false);

  // وضعیت فیلترها
  const [filters, setFilters] = useState({
    date_range: 'today',
    call_type: '',
    disposition: '',
    agent_extension: '',
    search: '',
    page: 1,
    per_page: 15
  });

  const BACKEND_BASE_URL = API_BASE_URL;
  
  // 🎯 استخراج اتوماتیک آی‌پی یا دامنه لایو سیستم شما
  //const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  //const BACKEND_BASE_URL = `http://${currentHost}:8000`;

  // 🔄 ۱. واکشی لایو نقشه هویتی کلاینت‌ها برای رفرش آنی اسامی
  const fetchLeadsMapping = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/next/dashboard/leads?per_page=200`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && json.data) {
          const mapping: Record<string, string> = {};
          json.data.forEach((lead: any) => {
            if (lead.phone) {
              const cleanKey = lead.phone.replace(/[^0-9]/g, '').slice(-10);
              mapping[cleanKey] = lead.name;
            }
          });
          setLeadMap(mapping);
        }
      }
    } catch (e) {
      console.error("🚨 Network Guard - Failed to map leads:", e);
    }
  };

  // 🔄 ۲. متد جامع واکشی دیتای لاگ‌های مرکز تلفن
  const fetchLogs = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const queryParams = new URLSearchParams({
        date_range: filters.date_range,
        call_type: filters.call_type,
        disposition: filters.disposition,
        agent_extension: filters.agent_extension,
        search: filters.search,
        page: filters.page.toString(),
        per_page: filters.per_page.toString()
      }).toString();

      const response = await fetch(`${BACKEND_BASE_URL}/next/voip/logs?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      if (json.status === 'success') {
        setLogs(json.data || []);
        setMeta(json.meta || {});
      }
    } catch (error) {
      console.error("🚨 Error fetching call logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // واکشی خودکار دیتای مرکز تلفن و اسکن هویتی کلاینت‌ها
  useEffect(() => {
    fetchLeadsMapping();
    fetchLogs();
    
    const liveInterval = setInterval(() => {
      if (!loading) {
        fetchLeadsMapping();
        fetchLogs();
      }
    }, 120000);
    
    return () => clearInterval(liveInterval);
  }, [filters.date_range, filters.call_type, filters.disposition, filters.page]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // 🤝 ۳. هندلر دکمهٔ ثبت سریع لید بدون نیاز به تغییر صفحه
  const handleQuickStoreLead = async () => {
    if (!quickName.trim()) return alert('نام و فامیل متقاضی الزامی است رفیق.');
    setIsSubmittingQuickLead(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/next/leads/store`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: quickName,
          phone: quickCreateTarget,
          target_country: 'آلمان',
          requested_plan: 'مهاجرت کاری'
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert('پرونده کلاینت با متد سریع با موفقیت مستقر شد!');
        setQuickCreateTarget(null);
        setQuickName('');
        fetchLeadsMapping();
        fetchLogs();
      }
    } catch (e) {
      console.error(e);
      alert('خطا در ارتباط با وب‌سرویس ثبت لید.');
    } finally {
      setIsSubmittingQuickLead(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-sm md:text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
            📊 مرکز پایش و گزارشات جامع مکالمات VoIP پیشگامان
          </h1>
          <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-1 rounded-lg font-black animate-pulse">🎯 متصل به هسته آستریسک</span>
        </div>

        {/* 🛠️ بخش فیلترهای پیشرفته */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border dark:border-slate-800 mb-6 text-[11px] font-bold text-slate-700 dark:text-slate-300">
          <label className="flex flex-col gap-1">بازه زمانی:
            <select name="date_range" value={filters.date_range} onChange={handleFilterChange} className="p-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg text-xs font-bold focus:outline-none">
              <option value="today">⏱️ امروز</option>
              <option value="yesterday">⏳ دیروز</option>
              <option value="last_7_days">📅 ۷ روز گذشته</option>
              <option value="last_30_days">🗓️ ۳۰ روز گذشته</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">جهت تماس:
            <select name="call_type" value={filters.call_type} onChange={handleFilterChange} className="p-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg text-xs font-bold focus:outline-none">
              <option value="">همه جهت‌ها</option>
              <option value="inbound">📥 ورودی (به شرکت)</option>
              <option value="outbound">📤 خروجی (از شرکت)</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">وضعیت پاسخ:
            <select name="disposition" value={filters.disposition} onChange={handleFilterChange} className="p-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg text-xs font-bold focus:outline-none">
              <option value="">همه وضعیت‌ها</option>
              <option value="ANSWERED">🟢 موفق و متصل</option>
              <option value="NO ANSWER">🔴 بی‌پاسخ</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">داخلی کارشناس:
            <input type="text" name="agent_extension" placeholder="مثلا 304" value={filters.agent_extension} onChange={handleFilterChange} onBlur={fetchLogs} className="p-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg text-xs text-center font-mono focus:outline-none" />
          </label>

          <div className="flex flex-col gap-1">
            <span className="block">جستجوی مشتری / لید:</span>
            <div className="flex gap-1">
              <input type="text" name="search" placeholder="شماره یا نام..." value={filters.search} onChange={handleFilterChange} className="p-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg text-xs w-full focus:outline-none" />
              <button type="button" onClick={fetchLogs} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 rounded-lg text-xs transition-all">🔍</button>
            </div>
          </div>
        </div>

        {/* 📋 جدول دیتای گزارشات مکالمات */}
        <div className="overflow-x-auto rounded-xl border dark:border-slate-800 border-slate-100">
          <table className="w-full text-right border-collapse text-[11px] font-bold">
            <thead>
              <tr className="bg-slate-800 text-white text-xs">
                <th className="p-3">شناسه تماس</th>
                <th className="p-3">نام لید / مشتری</th>
                <th className="p-3">شماره تماس</th>
                <th className="p-3">جهت تماس</th>
                <th className="p-3">داخلی</th>
                <th className="p-3">مدت مکالمه</th>
                <th className="p-3">تاریخ و ساعت اتمام</th>
                <th className="p-3">وضعیت نهایی</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800 divide-slate-100 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr><td colSpan={8} className="text-center p-8 text-slate-400 font-bold animate-pulse">⏳ در حال بارگذاری لاگ‌های سیستم مرکز تلفن...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="text-center p-8 text-slate-400 font-bold">❌ هیچ تماسی با فیلترهای انتخاب شده یافت نشد.</td></tr>
              ) : (
                logs.map((log: any) => {
                  
                  const cleanPhoneKey = log.customer_phone ? log.customer_phone.replace(/[^0-9]/g, '').slice(-10) : '';
                  const mappedName = leadMap[cleanPhoneKey] || log.customer_name;
                  
                  const isCustomerKnown = log.lead_id !== null || (mappedName && !mappedName.includes('ناشناس') && !mappedName.includes('جدید'));

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
                      <td className="p-3 font-mono text-xs text-slate-400">#{log.unique_id ? log.unique_id.split('_') : log.id}</td>
                      <td className="p-3">
                        {isCustomerKnown ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-black flex items-center gap-1">
                            👤 {mappedName}
                          </span>
                        ) : (
                          // 🎯 دکمه اکشن ثبت سریع متقاضی با کلیک مستقیم روی المان خاکستری رنگ
                          <button 
                            type="button" 
                            onClick={() => setQuickCreateTarget(log.customer_phone)}
                            className="text-slate-500 hover:text-white bg-slate-100 hover:bg-emerald-600 dark:bg-slate-950 dark:hover:bg-emerald-600 px-2 py-1 rounded-lg text-[10px] font-medium border border-slate-200 dark:border-slate-800/60 transition-all cursor-pointer flex items-center gap-1"
                            title="ثبت سریع متقاضی برای این شماره"
                          >
                            <span>➕</span> ثبت سریع لید
                          </button>
                        )}
                      </td>
                      <td className="p-3 font-mono tracking-wider">{log.customer_phone}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${log.call_type === 'inbound' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400'}`}>
                          {log.call_type === 'inbound' ? '📥 ورودی' : '📤 خروجی'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-900 dark:text-white">{log.agent_extension}</td>
                      <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400 font-black">
                        {log.duration_seconds ? formatDuration(log.duration_seconds) : '00:00'}
                        {log.billable_seconds > 0 && (
                          <span className="text-[9px] text-slate-400 font-normal mr-1">(خالص: {formatDuration(log.billable_seconds)})</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400 font-mono" dir="ltr">{log.created_at}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${log.disposition === 'ANSWERED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400'}`}>
                          {log.disposition === 'ANSWERED' ? '🟢 موفق و متصل' : '🔴 بی‌پاسخ'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 🔢 پجینیشن جدول */}
        {!loading && meta.last_page > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t dark:border-slate-800 text-[11px] font-bold text-slate-500">
            <span>نمایش {logs.length} تماس از کل {meta.total || 0} رکورد مخابرات</span>
            <div className="flex gap-2">
              <button type="button" disabled={filters.page === 1} onClick={() => setFilters(p => ({...p, page: p.page - 1}))} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-40 cursor-pointer">صفحه قبل</button>
              <button type="button" disabled={filters.page === meta.last_page} onClick={() => setFilters(p => ({...p, page: p.page + 1}))} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-40 cursor-pointer">صفحه بعد</button>
            </div>
          </div>
        )}

      </div>

      {/* 🚨 مدال پاپ‌آپِ معلق ثبت سریع برای شماره‌های ناشناس انتخاب شده */}
      {quickCreateTarget && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl w-80 shadow-2xl space-y-4 text-right">
            <div className="flex justify-between items-center border-b pb-2 dark:border-slate-800">
              <span className="font-black text-xs text-indigo-500">✨ فرم استقرار سریع متقاضی</span>
              <button type="button" onClick={() => setQuickCreateTarget(null)} className="w-5 h-5 text-slate-400 font-bold text-xs cursor-pointer hover:text-rose-500">×</button>
            </div>
            
            <div className="space-y-3 text-[11px] font-bold">
              <div className="space-y-1">
                <span className="text-slate-400 block">📞 شماره خط مخاطب:</span>
                <input type="text" disabled className="p-2 bg-slate-100 dark:bg-slate-950 border rounded-xl text-center text-xs w-full outline-none font-mono text-slate-500" value={quickCreateTarget} />
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 block">👤 نام و نام خانوادگی کلاینت:</span>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="مثال: افشین محمدی" 
                  className="p-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl text-xs w-full outline-none text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20" 
                  value={quickName}
                  onChange={e => setQuickName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleQuickStoreLead(); }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400 pt-1">
                <div>✈️ کشور هدف: <span className="text-slate-600 dark:text-slate-300">آلمان</span></div>
                <div>💼 پلن اولیه: <span className="text-slate-600 dark:text-slate-300">مهاجرت کاری</span></div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 text-[10px] font-black">
              <button 
                type="button" 
                disabled={isSubmittingQuickLead}
                onClick={handleQuickStoreLead}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-center shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmittingQuickLead ? '⏳ در حال ثبت...' : '🚀 تایید و استقرار لید'}
              </button>
              <button type="button" onClick={() => { setQuickCreateTarget(null); setQuickName(''); }} className="px-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 py-2 rounded-xl text-center hover:bg-slate-200 transition-all cursor-pointer">انصراف</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}