// app/dashboard/clients/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import LeadDrawer from '@/components/LeadDrawer';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';


type ViewModeType = 'leads' | 'clients';

const formatDuration = (seconds: number) => {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

export default function ClientsDashboardPage() {
  // 🎯 پلمب اختصاصی کارتابل: مودِ نمایش به صورت پیش‌فرض روی کلاینت‌های رسمی قفل است
  const [viewMode, setViewMode] = useState<ViewModeType>('clients');
  const [leads, setLeads] = useState<any[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🎯 استیت شناسایی هویت ناظر جهت اعمال گارد تخصیص کارشناس
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [colFilters, setColFilters] = useState({ name: '', phone: '', score: '', status: '', source: '' });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'id', direction: 'desc' });

  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    conjunction: 'AND',
    rules: [{ field: 'name', operator: 'contains', value: '' }]
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; lead: any } | null>(null);
  const [seniorConsultants, setSeniorConsultants] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]); 
  const [eventModalLeadId, setEventModalLeadId] = useState<number | null>(null);
  const [summaryModalLeadId, setSummaryModalLeadId] = useState<number | null>(null);
  const [callSummaryText, setCallSummaryText] = useState('');
  const [personaModalLead, setPersonaModalLead] = useState<any | null>(null);

  const [eventForm, setEventForm] = useState({ session_date_shamsi: '', next_call_date_shamsi: '', assigned_agent_id: '', session_type: 'online', form_type: '' });

  const BACKEND_BASE_URL = API_BASE_URL;

  const statusesList = ['مشاوره 1', 'مشاوره عالی 1', 'پیگیری', 'ساسپند', 'مشاوره 2', 'بی پاسخ', 'هدف', 'نظر مدیر', 'لید فوری', 'مساعد نبود', 'ارزیابی پرونده', 'رها شده', 'مشاوره عالی 2', 'پیگیری 2', 'پیگیری 3', 'پیگیری 4', 'پیگیری 5', 'واتساپی', 'تلگرام'];
  const sourceOptions = ['اینستاگرام', 'پیشگامان', 'تهران ویزا', 'واتساپ', 'تلگرام', 'بله', 'معرفی', 'تماس ورودی', 'رزرو سایت', 'ورود دستی فرانت'];

  const personasDatabase = [
    { key: 'Goal Oriented', name: 'هدف‌گرا (Goal Oriented)', follow: '1-2-3-5-8-15-21-retarget', logic: 'سریع تصمیم می‌گیرند، ولی باید داده کامل داشته باشند. اگر زود نتیجه نگیرند، رها می‌کنند.', method: 'چک‌لیست مدارک + جلسه ارزیابی تخصصی.' },
    { key: 'Analytical', name: 'تحلیلی (Analytical)', follow: '1-2-5-10-20-30-retarget', logic: 'نیاز به زمان برای مقایسه و بررسی دارند. پیگیری زود‌به‌زود نتیجه معکوس می‌دهد.', method: 'ارائه گزارش‌ها، مقایسه زنده مسیرها و مستندات.' },
    { key: 'Safety Oriented', name: 'امنیت‌محور (Safety Oriented)', follow: '1-2-3-5-10-15-21-retarget', logic: 'اضطراب دارند، باید اطمینان سریع بدهید و بعد با فاصله آرام آرام دنبال کنید.', method: 'تأکید قاطع بر ضمانت‌ها و اسناد تجربه‌های موفق شرکت.' },
    { key: 'Explorer', name: 'کاوش‌گر (Explorer)', follow: '1-2-5-9-14-21-30-retarget', logic: 'تنوع‌طلب هستند؛ اگر جذابیت و کشف جدید نباشد، به شدت سرد می‌شوند.', method: 'دعوت به وبینار، ارسال کوییز و معرفی پویای کشورها.' },
    { key: 'Skeptic', name: 'شکاک (Skeptic)', follow: '1-2-4-8-16-25-retarget', logic: 'اعتمادسازی سخت است؛ باید پشت‌سرهم شواهد بدهید تا کاملاً قانع شوند.', method: 'ارائه متن قراردادها، کیس‌های واقعی زنده و ویدئو تستیمونیال.' },
    { key: 'Budget-Conscious', name: 'حساس به هزینه (Budget-Conscious)', follow: '1-2-5-9-14-21-28-retarget', logic: 'دنبال تخفیف یا اقساط هستند؛ باید پیشنهاد مرحله‌ای و قیمت‌گذاری پلکانی بدهید.', method: 'تأکید روی آفر اقساط و تشریح ارزش خدمات نسبت به هزینه.' },
    { key: 'Family-First', name: 'خانواده‌محور (Family-First)', follow: '1-3-5-10-15-25-35-retarget', logic: 'تصمیم جمعی دارند؛ زمان می‌خواهند تا با همسر/خانواده هماهنگ کنند.', method: 'توضیحات الحاق همزمان خانواده, مدارس فرزندان و بیمه‌ها.' },
    { key: 'Fast-Track', name: 'فوری/عجول (Fast-Track)', follow: '1-2-2-4-8-10-retarget', logic: 'تصمیم فوق‌العاده سریع؛ اگر معطل شوند، بلافاصله جای دیگر اقدام می‌کنند.', method: 'تخصیص اسلات فوری و شلیک CTAهای مستقیم.' },
    { key: 'Undecided/Passive', name: 'بلاتکلیف/منفعل (Undecided/Passive)', follow: '1-2-4-8-15-25-45-retarget', logic: 'به‌سختی فعال می‌شوند؛ باید کم‌کم و با حوصله گرم شوند.', method: 'ارسال پیام‌های ساده، صمیمی و انتخاب‌های محدود.' },
    { key: 'Opportunity-Driven', name: 'فرصت‌محور (Opportunity-Driven)', follow: '1-2-3-4-6-10-18-retarget', logic: 'به محض دیدن آفر یا فرصت اقدام می‌کنند؛ اگر آفر از دست برود، انگیزه کلاً می‌میرد.', method: 'ارسال فوری فرصت‌های لحظه آخری، بورسیه‌ها و آفرهای دپارتمان.' },
    { key: 'Case Study Seeker', name: 'علاقه‌مند به کیس استادی (Case Study Seeker)', follow: '1-2-3-6-10-15-25-retarget', logic: 'فقط و فقط وقتی قانع می‌شوند که نمونه‌های واقعی و زنده را لمس کنند.', method: 'ارسال کیس‌های مشابه موفق و داستان‌های مستند مهاجرت.' }
  ];

  const convertToShamsi = (isoDateString: string) => {
    if (!isoDateString) return '---';
    try {
      const date = new Date(isoDateString);
      if (isNaN(date.getTime())) return isoDateString;
      return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
    } catch (e) {
      return isoDateString;
    }
  };

  const loadData = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    // قفل دایمی اندپوینت روی واکشی کلاینت‌های رسمی
    let url = `${BACKEND_BASE_URL}/next/dashboard/leads?page=${currentPage}&view_mode=clients&per_page=15&sort_by=${sortConfig.key}&sort_dir=${sortConfig.direction}`;
    
    Object.entries(colFilters).forEach(([k, v]) => { if (v) url += `&filter_${k}=${v}`; });
    if (showAdvancedPanel && advancedFilters.rules.length > 0 && advancedFilters.rules[0].value) {
      url += `&advanced_filters=${encodeURIComponent(JSON.stringify(advancedFilters))}`;
    }

    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => res.json())
    .then(resData => {
      if (resData && resData.status === 'success') {
        setLeads(resData.data || []);
        setFilteredLeads(resData.data || []);
        setCurrentPage(resData.meta?.current_page || 1);
        setLastPage(resData.meta?.last_page || 1);
        setTotalLeads(resData.meta?.total || 0);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  

  const loadSeniorConsultants = async () => {
    const token = localStorage.getItem('token');
    const authHeaders = { 
      'Authorization': `Bearer ${token}`, 
      'Accept': 'application/json', 
      'Content-Type': 'application/json' 
    };
    
    const localUser = localStorage.getItem('user');
    if (localUser) setCurrentUser(JSON.parse(localUser));

    try {
      // ۱. 🎯 فیکس باگ قطعی CORS/Fetch: لود گزارش ناظر بر پایه روت بیرونی مجهز به پیشوند واقعی /api
      const res = await fetch(`${BACKEND_BASE_URL}/next/supervisor/reports`, { headers: authHeaders });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success') setSeniorConsultants(json.agent_performance || []);
      }

      // ۲. 🎯 بارگذاری کاربران سیستم: روت داخلی سانکتوم بدون پیشوند api طبق فایل روت‌های شما
      const usersRes = await fetch(`${BACKEND_BASE_URL}/next/users`, { headers: authHeaders });
      if (usersRes.ok) {
        const json = await usersRes.json();
        if (json.status === 'success') setAgents(json.data || []);
      }
    } catch (e) { 
      console.warn("🚨 [CONFIG LOAD ERROR]:", e); 
    }
  };
  

  useEffect(() => { 
    loadData(); 
    loadSeniorConsultants();
  }, [currentPage, viewMode, colFilters, sortConfig]);

  useEffect(() => {
    const closeContext = () => setContextMenu(null);
    window.addEventListener('click', closeContext);
    return () => window.removeEventListener('click', closeContext);
  }, []);

  const handleInlineUpdate = async (leadId: number, field: string, value: any) => {
    const token = localStorage.getItem('token');
    
    if (field === 'agent_id' && currentUser?.role !== 'supervisor') {
      return alert('🚨 خطا: فقط ادمین یا سوپروایزر ناظر سیستم اجازه واگذاری و جابجایی مشاور پرونده را دارد.');
    }

    const payload = field === 'agent_id' ? { agent_id: value } : { field, value };
    const url = field === 'agent_id' 
      ? `${BACKEND_BASE_URL}/next/leads/update/${leadId}` 
      : `${BACKEND_BASE_URL}/next/leads/update-inline/${leadId}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      loadData();
    } else {
      alert('خطا در به‌روزرسانی ردیف کارتابل کلاینت‌ها.');
    }
  };

  const handleUpdatePersona = async (leadId: number, persona: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_BASE_URL}/next/leads/update-persona/${leadId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona })
    });
    if (res.ok) {
      setPersonaModalLead(null);
      loadData();
    }
  };

  const handleSaveSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_BASE_URL}/next/leads/store-summary/${summaryModalLeadId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: callSummaryText })
    });
    if (res.ok) {
      alert('✓ خلاصه مکالمه ثبت و در پرونده پیام‌ها پلمب شد.');
      setSummaryModalLeadId(null);
      setCallSummaryText('');
      loadData();
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await fetch(`${BACKEND_BASE_URL}/next/leads/store-event/${eventModalLeadId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(eventForm)
    });
    setEventModalLeadId(null); 
    loadData(); 
  };

  const handleClickToDial = async (customerPhone: string, leadId: number) => {
    const token = localStorage.getItem('token');
    await fetch(`${BACKEND_BASE_URL}/next/voip/click-to-dial`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_phone: customerPhone, lead_id: leadId })
    });
    alert(`📲 سیگنال تماس صادر شد.`);
  };

  const requestSort = (key: string) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const updateAdvancedRule = (index: number, key: string, value: string) => {
    const newRules = [...advancedFilters.rules];
    newRules[index] = { ...newRules[index], [key]: value };
    setAdvancedFilters(prev => ({ ...prev, rules: newRules }));
  };

  const handleContextMenu = (e: React.MouseEvent, lead: any) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, lead });
  };

  // 🎯 پچ قطعی رفع باگ: تزریق متد مپ‌کننده کلید داینامیک پرسونا به لایه نمایشی گرید کلاینت‌ها
  const getPersonaLabel = (key: string) => {
    const found = personasDatabase.find(p => p.key === key);
    return found ? found.name : key || 'تعیین نشده';
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-right font-sans text-[11px]" dir="rtl">
      
      {/* هدر بالایی اختصاصی کلاینت‌ها */}
      <div className="flex justify-between items-center mb-6 bg-white dark:bg-slate-900 p-5 rounded-[24px] border shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-purple-800 dark:text-purple-400">👑 کارتابل متمرکز کلاینت‌های رسمی (قراردادهای فعال)</h1>
          <p className="text-slate-400 text-[10px] mt-0.5">پایش پرونده‌های در جریان، تراکنش‌های مالی، اسناد و تیکت‌های پشتیبانی رسمی سازمان</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAdvancedPanel(!showAdvancedPanel)} className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl font-black text-xs cursor-pointer">
            {showAdvancedPanel ? '🔒 بستن فیلتر' : '🔍 فیلتراسیون کلاینت‌ها'}
          </button>
        </div>
      </div>

      {/* پنل فیلتر پیشرفته */}
      {showAdvancedPanel && (
        <div className="bg-slate-900 text-white p-5 rounded-[24px] border mb-6 space-y-4 animate-fadeIn">
          <div className="space-y-3">
            {advancedFilters.rules.map((rule, idx) => (
              <div key={idx} className="flex flex-wrap gap-3 items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                <select className="bg-slate-900 border p-1.5 rounded-lg text-xs font-bold text-slate-300 outline-none" value={rule.field} onChange={e => updateAdvancedRule(idx, 'field', e.target.value)}>
                  <option value="name">👤 نام کلاینت</option>
                  <option value="phone">📱 شماره تلفن</option>
                  <option value="score">💯 امتیاز پرونده</option>
                </select>
                <input type="text" placeholder="مقدار شرط..." className="p-1.5 bg-slate-900 border rounded-lg text-xs text-white outline-none w-48 font-bold" value={rule.value} onChange={e => updateAdvancedRule(idx, 'value', e.target.value)} />
              </div>
            ))}
          </div>
          <button type="button" onClick={loadData} className="bg-indigo-600 px-6 py-1.5 rounded-xl text-[10px] font-black shadow-md cursor-pointer">🚀 اعمال فیلتر پرونده‌ها</button>
        </div>
      )}

      
      {/* ================= 👑 گرید تخصصی و توسعه‌یافته کلاینت‌های رسمی سازمان ================= */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-purple-50/50 dark:bg-slate-800 border-b text-purple-950 dark:text-slate-400 font-black text-[10px] h-11 select-none">
                <th className="p-3 text-center w-8"><input type="checkbox" /></th>
                <th onClick={() => requestSort('name')} className="p-3 cursor-pointer hover:bg-purple-100/30">👤 نام کلاینت و پرسونا ↕️</th>
                <th onClick={() => requestSort('phone')} className="p-3 cursor-pointer hover:bg-purple-100/30">📱 شماره همراه ↕️</th>
                <th onClick={() => requestSort('score')} className="p-3 text-center cursor-pointer hover:bg-purple-100/30">💯 امتیاز پرونده ↕️</th>
                <th className="p-3 text-center">✈️ پلن و کشور مقصد</th>
                <th className="p-3">🧑‍💼 کارشناس پشتیبان</th>
                <th onClick={() => requestSort('status')} className="p-3 cursor-pointer hover:bg-purple-100/30">💼 وضعیت فرآیند اجرایی ↕️</th>
                <th className="p-3 text-center bg-emerald-50/40 dark:bg-emerald-950/10">💰 وضعیت اقساط مالی</th>
                <th className="p-3 text-center bg-amber-50/40 dark:bg-amber-950/10">🎫 تیکت‌های پشتیبانی</th>
                <th className="p-3">🌐 کانال ورودی</th>
                <th onClick={() => requestSort('created_at_text')} className="p-3 cursor-pointer hover:bg-purple-100/30">📅 تاریخ عقد قرارداد ↕️</th>
                <th className="p-3 text-center">⏳ کل تایم VoIP</th>
              </tr>

              {/* 🔍 ردیف فیلترهای سریع سرستون کلاینت‌ها */}
              <tr className="bg-slate-100/40 border-b">
                <td className="p-1"></td>
                <td className="p-1.5"><input type="text" placeholder="فیلتر نام..." className="w-full p-1 bg-white border rounded-lg text-[10px] outline-none font-bold" value={colFilters.name} onChange={e => setColFilters({...colFilters, name: e.target.value})} /></td>
                <td className="p-1.5"><input type="text" placeholder="فیلتر همراه..." className="w-full p-1 bg-white border rounded-lg text-[10px] outline-none font-bold text-center font-mono" value={colFilters.phone} onChange={e => setColFilters({...colFilters, phone: e.target.value})} /></td>
                <td className="p-1.5"><input type="number" placeholder="امتیاز..." className="w-16 mx-auto p-1 bg-white border rounded-lg text-[10px] outline-none font-bold text-center" value={colFilters.score} onChange={e => setColFilters({...colFilters, score: e.target.value})} /></td>
                <td colSpan={2}></td>
                <td className="p-1.5">
                  <select className="w-full p-1 bg-white border rounded-lg text-[10px] outline-none font-black text-purple-700" value={colFilters.status} onChange={e => setColFilters({...colFilters, status: e.target.value})}>
                    <option value="">همه وضعیت‌های اجرایی</option>
                    {statusesList.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </td>
                <td className="p-1.5">
                  <select className="w-full p-1 bg-white border rounded-lg text-[10px] outline-none font-black text-emerald-700" value={colFilters.source} onChange={e => setColFilters({...colFilters, source: e.target.value})}>
                    <option value="">وضعیت مالی...</option>
                    <option value="paid">تسویه شده</option>
                    <option value="installment">دارای اقساط فعال</option>
                    <option value="overdue">بدهی معوقه</option>
                  </select>
                </td>
                <td colSpan={4}></td>
              </tr>
            </thead>
            
            <tbody className="divide-y text-slate-600 dark:text-slate-300 font-bold">
              {filteredLeads.map((lead: any) => (
                <tr
                  key={lead.id}
                  className="bg-purple-50/5 hover:bg-purple-50/20 dark:bg-slate-950/20 h-14 transition-colors cursor-pointer"
                  onClick={() => setSelectedLead(lead)}
                  onContextMenu={e => handleContextMenu(e, lead)}
                >
                  <td className="p-3 text-center" onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                  
                  {/* ۱. نام کلاینت و تگ پرسونا */}
                  <td className="p-3 font-black text-slate-900 dark:text-white flex flex-col justify-center">
                    <span>{lead.name}</span>
                    <span className="text-[8px] bg-indigo-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md w-max mt-1 font-black">🎯 {getPersonaLabel(lead.persona)}</span>
                  </td>
                  
                  {/* ۲. شماره همراه با فونت مونو */}
                  <td className="p-3 font-mono text-slate-500">{lead.phone}</td>
                  
                  {/* ۳. امتیاز پرونده */}
                  <td className="p-3 text-center font-mono text-indigo-600">{lead.score}</td>
                  
                  {/* ۴. پلن و کشور مقصد */}
                  <td className="p-3 text-center text-[10px]">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg">
                      🌍 {lead.target_country || 'تعیین نشده'} | {lead.requested_plan || '---'}
                    </span>
                  </td>
                  
                  {/* ۵. کارشناس مسئول پشتیبانی کلاینت */}
                  <td className="p-3 text-slate-700 dark:text-slate-200">👤 {lead.assigned_agent || 'بدون پشتیبان'}</td>
                  
                  {/* ۶. وضعیت فرآیند اجرایی داینامیک */}
                  <td className="p-3" onClick={e => e.stopPropagation()}>
                    <select 
                      className="p-1.5 bg-white dark:bg-slate-800 border rounded-xl font-black text-[10px] text-purple-700 outline-none cursor-pointer shadow-2xs"
                      value={lead.status}
                      onChange={e => handleInlineUpdate(lead.id, 'initial_consultation_status', e.target.value)}
                    >
                      {statusesList.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </td>

                  {/* ۷. وضعیت مالی اقساط (سفارشی مگا دشبورد کلاینت) */}
                  <td className="p-3 text-center bg-emerald-50/10 dark:bg-emerald-950/5">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                      lead.financial_capability_toman > 0 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {lead.financial_capability_toman > 0 ? '✔️ تسویه منظم' : '⚠️ بررسی مالی'}
                    </span>
                  </td>

                  {/* ۸. تیکت‌های فعال دپارتمان ویزا/اجرا */}
                  <td className="p-3 text-center bg-amber-50/10 dark:bg-amber-950/5">
                    <span className="text-[10px] font-mono text-amber-600 bg-amber-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border">
                      📩 {lead.is_excellent_lead === 1 ? '۱ تیکت باز' : '۰ باز'}
                    </span>
                  </td>

                  {/* ۹. منبع ورودی کلاینت */}
                  <td className="p-3 text-slate-400 text-xs">{lead.source || 'رزرو مستقیم'}</td>
                  
                  {/* ۱۰. تاریخ قرارداد (convertToShamsi) */}
                  <td className="p-3 text-slate-500 text-right font-mono">{convertToShamsi(lead.created_at_text)}</td>
                  
                  {/* ۱۱. کل تایم مکالمات VoIP ضبط شده */}
                  <td className="p-3 text-center font-mono text-purple-600 font-black">{formatDuration(lead.total_call_duration)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= 🗓️ مودال تنظیم جلسه مشاور عالی ================= */}
      {eventModalLeadId && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50">
          <form onSubmit={handleSaveEvent} className="bg-white p-6 rounded-[28px] border w-[420px] shadow-2xl space-y-4 text-right">
            <h3 className="text-sm font-black text-slate-800">🗓️ زمان‌بندی جلسه دپارتمان مشاور عالی</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-500 mb-1">📅 تاریخ جلسه:</label>
                <input type="date" className="w-full p-2 border rounded-xl bg-slate-50 font-mono text-center font-bold outline-none" value={eventForm.session_date_shamsi} onChange={e => setEventForm({...eventForm, session_date_shamsi: e.target.value})} required />
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">📞 تاریخ تماس بعدی:</label>
                <input type="date" className="w-full p-2 border rounded-xl bg-slate-50 font-mono text-center font-bold outline-none" value={eventForm.next_call_date_shamsi} onChange={e => setEventForm({...eventForm, next_call_date_shamsi: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">👑 انتخاب مشاور عالی پرونده:</label>
              <select className="w-full p-2.5 border rounded-xl bg-slate-50 text-indigo-600 font-black outline-none" value={eventForm.assigned_agent_id} onChange={e => setEventForm({...eventForm, assigned_agent_id: e.target.value})} required>
                <option value="">انتخاب مشاور عالی...</option>
                {seniorConsultants.map((agent: any) => <option key={agent.id} value={agent.id}>🧑‍💼 {agent.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-slate-900 text-white font-black py-2 rounded-xl text-xs cursor-pointer">🔏 ثبت دوره و ارجاع</button>
              <button type="button" onClick={() => setEventModalLeadId(null)} className="px-4 bg-slate-100 text-slate-600 font-bold py-2 rounded-xl cursor-pointer">انصراف</button>
            </div>
          </form>
        </div>
      )}

      {/* ================= 📝 مودال ثبت سریع خلاصه مکالمه ================= */}
      {summaryModalLeadId && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50">
          <form onSubmit={handleSaveSummary} className="bg-white p-6 rounded-[28px] border w-[420px] shadow-2xl space-y-4 text-right">
            <h3 className="text-sm font-black text-slate-800">📝 ثبت سریع خلاصه مکالمه تلفنی کارشناس</h3>
            <textarea required rows={4} className="w-full p-3 border rounded-xl bg-slate-50 font-sans text-xs outline-none" placeholder="نکات کلیدی مکالمه را مکتوب کنید..." value={callSummaryText} onChange={e => setCallSummaryText(e.target.value)} />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-emerald-600 text-white font-black py-2 rounded-xl text-xs cursor-pointer">⚡ ذخیره و انتقال به پرونده</button>
              <button type="button" onClick={() => setSummaryModalLeadId(null)} className="px-4 bg-slate-100 text-slate-600 font-bold py-2 rounded-xl cursor-pointer">انصراف</button>
            </div>
          </form>
        </div>
      )}

      {/* ================= 🎯 مگا-مودال ۱۱ پرسونای روان‌شناختی ================= */}
      {personaModalLead && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border w-[680px] max-h-[85vh] overflow-y-auto shadow-2xl text-right space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">🎯 تعیین پرسونا روان‌شناختی مخاطب</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">کلاینت جاری: <span className="text-indigo-600 font-black">{personaModalLead.name}</span></p>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {personasDatabase.map((p) => (
                <div 
                  key={p.key} 
                  onClick={() => handleUpdatePersona(personaModalLead.id, p.key)}
                  className={`p-3 border rounded-2xl transition-all cursor-pointer flex flex-col gap-1 ${personaModalLead.persona === p.key ? 'bg-purple-600/10 border-purple-600' : 'bg-slate-50/50 hover:border-slate-300'}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-black text-slate-800 text-xs">{p.name}</span>
                    <span className="bg-purple-50 border text-purple-700 px-2 py-0.5 rounded-lg font-mono text-[9px] font-black">🗓️ زنجیره: {p.follow}</span>
                  </div>
                  <p className="text-slate-500 text-[10px]"><strong>منطق:</strong> {p.logic}</p>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t flex justify-end">
              <button type="button" onClick={() => setPersonaModalLead(null)} className="px-6 bg-slate-100 text-slate-600 font-bold py-2 rounded-xl text-xs cursor-pointer">بستن</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ⚡ منوی کلیک‌راست پیشرفته با دراپ‌داون سوییچر پرسنل ناظر ================= */}
      {contextMenu && (() => {
        const isSupervisor = currentUser?.role === 'supervisor';
        const currentAgentObj = agents.find(a => a.name === contextMenu.lead.assigned_agent);

        return (
          <div 
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed bg-white border border-slate-200 rounded-xl shadow-2xl py-1.5 z-50 w-52 text-right font-sans animate-scaleIn"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-3 py-1 border-b text-slate-400 text-[9px] font-black">⚙️ عملیات سریع: {contextMenu.lead.name}</div>
            <button onClick={() => { setSelectedLead(contextMenu.lead); }} className="w-full text-right px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 font-bold">👁️ نمایش پرونده (۳۶۰)</button>
            <button onClick={() => { setSummaryModalLeadId(contextMenu.lead.id); }} className="w-full text-right px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 font-black">📝 ثبت سریع خلاصه مکالمه</button>
            <button onClick={() => { setEventModalLeadId(contextMenu.lead.id); }} className="w-full text-right px-3 py-1.5 hover:bg-amber-50 hover:text-amber-600 flex items-center gap-2 font-bold">🗓️ برنامه‌ریزی جلسه ارشد</button>
            <button onClick={() => { handleClickToDial(contextMenu.lead.phone, contextMenu.lead.id); }} className="w-full text-right px-3 py-1.5 hover:bg-emerald-50 text-emerald-600 flex items-center gap-2 font-black">📞 تماس هوشمند (VoIP)</button>
            
            <div className="border-t my-1"></div>
            
            {/* 🎯 سوییچر دراپ‌داون قفل‌شده با هویت ناظر (Supervisor) در کلیک راست کلاینت‌ها */}
            <div className="px-3 py-1.5">
              <label className="text-[9px] font-black text-slate-400 mb-1 block">واگذاری کارشناس پشتیبان:</label>
              <select 
                className={`w-full p-1.5 border rounded-lg font-bold text-[10px] utline-none ${isSupervisor ? 'bg-purple-50 text-purple-700 border-purple-200 cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                value={currentAgentObj ? currentAgentObj.id : ''}
                disabled={!isSupervisor}
                onChange={e => {
                  handleInlineUpdate(contextMenu.lead.id, 'agent_id', e.target.value);
                  setContextMenu(null);
                }}
              >
                <option value="">تخصیص آزاد سیستم...</option>
                {agents.map((a: any) => (
                  <option key={a.id} value={a.id}>🧑‍💼 {a.name} (داخلی: {a.voip_extension})</option>
                ))}
              </select>
            </div>

            <div className="border-t my-1"></div>
            <button onClick={() => { setPersonaModalLead(contextMenu.lead); }} className="w-full text-right px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-black flex items-center gap-2 text-[10px] rounded-b-lg">🎯 تعیین پرسونا روان‌شناختی</button>
          </div>
        );
      })()}

      {selectedLead && <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} onUpdate={loadData} />}
    </div>
  );
}