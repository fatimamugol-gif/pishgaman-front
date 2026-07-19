// app/dashboard/leads/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import LeadDrawer from '@/components/LeadDrawer';
import SessionReportForm from '@/components/staff/SessionReportForm';
import ConsultationSessionForm from '@/components/staff/ConsultationSessionForm';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';

type ViewModeType = 'leads';

const formatDuration = (seconds: number) => {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

export default function LeadsDashboardPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewModeType>('leads');

  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [activeReportData, setActiveReportData] = useState<any>(null);

  const [leads, setLeads] = useState<any[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
  const [eventModalLeadId, setEventModalLeadId] = useState<number | null>(null);
  const [summaryModalLeadId, setSummaryModalLeadId] = useState<number | null>(null);
  const [callSummaryText, setCallSummaryText] = useState('');
  const [personaModalLead, setPersonaModalLead] = useState<any | null>(null);
  const [consultationModalLeadId, setConsultationModalLeadId] = useState<number | null>(null);

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
    { key: 'Family-First', name: 'خانواده‌محور (Family-First)', follow: '1-3-5-10-15-25-35-retarget', logic: 'تصمیم جمعی دارند؛ زمان می‌خواهند تا با همسر/خانواده هماهنگ کنند.', method: 'توضیحات الحاق همزمان خانواده، مدارس فرزندان و بیمه‌ها.' },
    { key: 'Fast-Track', name: 'فوری/عجول (Fast-Track)', follow: '1-2-2-4-8-10-retarget', logic: 'تصمیم فوق‌العاده سریع؛ اگر معطل شوند، بلافاصله جای دیگر اقدام می‌کنند.', method: 'تخصیص اسلات فوری و شلیک CTAهای مستقیم.' },
    { key: 'Undecided/Passive', name: 'بلاتکلیف/منفعل (Undecided/Passive)', follow: '1-2-4-8-15-25-45-retarget', logic: 'به‌سختی فعال می‌شوند؛ باید کم‌کم و با حوصله گرم شوند.', method: 'ارسال پیام‌های ساده، صمیمی و انتخاب‌های محدود.' },
    { key: 'Opportunity-Driven', name: 'فرصت‌محور (Opportunity-Driven)', follow: '1-2-3-4-6-10-18-retarget', logic: 'به محض دیدن آفر یا فرصت اقدام می‌کنند؛ اگر آفر از دست برود، انگیزه کلاً می‌میرد.', method: 'ارسال فوری فرصت‌های لحظه آخری, بورسیه‌ها و آفرهای دپارتمان.' },
    { key: 'Case Study Seeker', name: 'علاقه‌مند به کیس استادی (Case Study Seeker)', follow: '1-2-3-6-10-15-25-retarget', logic: 'فقط و فقط وقتی قانع می‌شوند که نمونه‌های واقعی و زنده را لمس کنند.', method: 'ارسال کیس‌های مشابه موفق و داستان‌های مستند مهاجرت.' }
  ];

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
      // 🎯 شلیک مستقیم به اندپوینت اختصاصی دپارتمان ۷ (مشاوره عالی)
      const res = await fetch(`${BACKEND_BASE_URL}/next/senior-consultants`, { headers: authHeaders });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success') setSeniorConsultants(json.data || []); // استفاده از کلید data
      }

      const usersRes = await fetch(`${BACKEND_BASE_URL}/next/users`, { headers: authHeaders });
      if (usersRes.ok) {
        const json = await usersRes.json();
        if (json.status === 'success') setAgents(json.data || []);
      }
    } catch (e) {
      console.warn("🚨 [CONFIG LOAD ERROR]:", e);
    }
  };

  const convertToShamsi = (isoDateString: string) => {
    if (!isoDateString) return '---';
    try {
      const date = new Date(isoDateString);
      if (isNaN(date.getTime())) return isoDateString;
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return isoDateString;
    }
  };

  const loadData = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    let url = `${BACKEND_BASE_URL}/next/dashboard/leads?page=${currentPage}&view_mode=${viewMode}&per_page=15&sort_by=${sortConfig.key}&sort_dir=${sortConfig.direction}`;

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

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
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
      alert('✓ خلاصه مکالمه ثبت و در پیام‌ها پلمب شد.');
      setSummaryModalLeadId(null);
      setCallSummaryText('');
      loadData();
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      // 🎯 شلیک مستقیم به روت اختصاصی جدید به جای روت عمومی قبلی
      const res = await fetch(`${BACKEND_BASE_URL}/next/leads/schedule-senior-session/${eventModalLeadId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(eventForm) // ارسال مستقیم استیت فرم بدون نیاز به فیلدهای اضافی
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        setEventModalLeadId(null);
        setEventForm({ session_date_shamsi: '', next_call_date_shamsi: '', assigned_agent_id: '', session_type: 'online', form_type: '' });
        loadData(); // بروزرسانی زنده گرید
      } else {
        const errData = await res.json();
        alert(errData.message || 'خطا در ثبت جلسه');
      }
    } catch (err) {
      console.error("🚨 [EVENT STORE ERROR]:", err);
    }
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

  const removeAdvancedRule = (index: number) => {
    setAdvancedFilters(prev => ({ ...prev, rules: prev.rules.filter((_, i) => i !== index) }));
  };

  const handleOpenSessionReport = async (lead: any) => {
    if (!lead) return;

    // 🛡️ گارد اول فرانت‌آند: اگر کلاً تاریخ جلسه‌ای ثبت نشده، مسدود کن
    if (!lead.session_date_shamsi) {
      alert('⚠️ خطای سیستمی: برای این متقاضی هیچ جلسه مشاوره تخصصی زمان‌بندی نشده است.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const now = new Date();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const res = await fetch(`${BACKEND_BASE_URL}/next/session-report/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lead_id: lead.id,
          agent_id: localStorage.getItem('user_id'),
          client_name: lead.name,
          initial_agent_name: lead.assigned_agent || lead.agent_name || 'مشاور اولیه',
          initial_agent_id: lead.agent_id || null,
          senior_consultant_name: localStorage.getItem('user_name') || 'مشاور ارشد',
          session_start_at: oneHourAgo.toISOString(),
          session_end_at: now.toISOString(),
          // فرستادن تاریخ شمس لایو گرید برای راستی‌آزمایی دژ بک‌آند
          current_session_shamsi: lead.session_date_shamsi
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setActiveReportData({
          id: data.report_id,
          client_name: lead.name,
          initial_agent_name: lead.assigned_agent || lead.agent_name || 'مشاور اولیه',
          initial_agent_id: lead.agent_id || null,
          senior_consultant_name: localStorage.getItem('user_name') || 'مشاور ارشد',
          deadline_at: data.deadline_at,
        });
        setIsSessionModalOpen(true);
      } else {
        alert(data.message || 'خطا در تایید صلاحیت جلسه جدید.');
      }
    } catch (err) {
      console.error(err);
      alert('خطا در ارتباط با سرور مرکزی پیشگامان.');
    }
  };
  const handleContextMenu = (e: React.MouseEvent, lead: any) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, lead });
  };

  const getPersonaLabel = (key: string) => {
    const found = personasDatabase.find(p => p.key === key);
    return found ? found.name : key || 'تعیین نشده';
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-right font-sans text-[11px]" dir="rtl">

      {/* هدر بالایی */}
      <div className="flex justify-between items-center mb-6 bg-white dark:bg-slate-900 p-5 rounded-[24px] border shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white">🦾 کارتابل متمرکز مدیریت متقاضیان (Persona Edition)</h1>
          <p className="text-slate-400 text-[10px] mt-0.5">کلیک راست روی سطرها جهت باز کردن پاپ‌آپ عملیاتی و فعال‌سازی مودال هوشمند یازده پرسونا مخاطب</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAdvancedPanel(!showAdvancedPanel)} className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl font-black text-xs">
            {showAdvancedPanel ? '🔒 بستن فیلتر پیشرفته' : '🔍 موتور فیلتر پیشرفته چند پارامتری'}
          </button>
          <Link href="/dashboard/leads/new" className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-indigo-600">➕ مشاوره اولیه جدید</Link>
        </div>
      </div>

      {/* پنل فیلتر پیشرفته */}
      {showAdvancedPanel && (
        <div className="bg-slate-900 text-white p-5 rounded-[24px] border mb-6 space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-black text-amber-400">Docs: فیلتراسیون پیشرفته بر پایه پرسونا و تواریخ جلالی</span>
            <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl">
              <button type="button" onClick={() => setAdvancedFilters({ ...advancedFilters, conjunction: 'AND' })} className={`px-3 py-1 rounded-lg text-[10px] font-black ${advancedFilters.conjunction === 'AND' ? 'bg-indigo-600' : 'text-slate-400'}`}>گیت AND</button>
              <button type="button" onClick={() => setAdvancedFilters({ ...advancedFilters, conjunction: 'OR' })} className={`px-3 py-1 rounded-lg text-[10px] font-black ${advancedFilters.conjunction === 'OR' ? 'bg-indigo-600' : 'text-slate-400'}`}>گیت OR</button>
            </div>
          </div>
          <div className="space-y-3">
            {advancedFilters.rules.map((rule, idx) => (
              <div key={idx} className="flex flex-wrap gap-3 items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                <select className="bg-slate-900 border p-1.5 rounded-lg text-xs font-bold text-slate-300 outline-none" value={rule.field} onChange={e => updateAdvancedRule(idx, 'field', e.target.value)}>
                  <option value="name">👤 نام متقاضی</option>
                  <option value="phone">📱 شماره تلفن</option>
                  <option value="score">💯 امتیاز پرونده</option>
                  <option value="status">💼 وضعیت پرونده</option>
                  <option value="source">🌐 منبع ورودی</option>
                  <option value="level">🎓 سطح ارزش</option>
                  <option value="plan">✈️ پلن مهاجرتی</option>
                  <option value="country">🌍 کشور مقصد</option>
                  <option value="session_date">📅 تاریخ جلسه</option>
                  <option value="next_call_date">📞 تماس بعدی</option>
                  <option value="persona">🧠 پرسونای روان‌شناختی</option>
                </select>
                <select className="bg-slate-900 border p-1.5 rounded-lg text-xs font-bold text-amber-500 outline-none" value={rule.operator} onChange={e => updateAdvancedRule(idx, 'operator', e.target.value)}>
                  <option value="contains">شامل متن</option>
                  <option value="=">برابر با</option>
                  <option value=">">بزرگتر از</option>
                  <option value="<">کوچکتر از</option>
                </select>
                <input type="text" placeholder="مقدار شرط..." className="p-1.5 bg-slate-900 border rounded-lg text-xs text-white outline-none w-48 font-bold" value={rule.value} onChange={e => updateAdvancedRule(idx, 'value', e.target.value)} />
                {advancedFilters.rules.length > 1 && (
                  <button type="button" onClick={() => removeAdvancedRule(idx)} className="text-rose-500 hover:text-rose-400 font-black text-xs mr-auto">❌ حذف قانون</button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAdvancedFilters({ ...advancedFilters, rules: [...advancedFilters.rules, { field: 'name', operator: 'contains', value: '' }] })} className="bg-slate-800 px-4 py-1.5 rounded-xl text-[10px] font-black">➕ افزودن شرط جدید</button>
            <button type="button" onClick={loadData} className="bg-indigo-600 px-6 py-1.5 rounded-xl text-[10px] font-black shadow-md">🚀 شلیک فیلتر پیشرفته</button>
          </div>
        </div>
      )}

      {/* گرید کلاینت‌ها */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-500 font-black text-[10px] h-11 select-none">
                <th className="p-3 text-center w-8"><input type="checkbox" /></th>
                <th onClick={() => requestSort('name')} className="p-3 cursor-pointer hover:bg-slate-100">نام متقاضی ↕️</th>
                <th onClick={() => requestSort('phone')} className="p-3 cursor-pointer hover:bg-slate-100">شماره تلفن ↕️</th>
                <th onClick={() => requestSort('score')} className="p-3 text-center cursor-pointer hover:bg-slate-100">امتیاز ↕️</th>
                <th className="p-3 text-center">سطح ارزش لید</th>
                <th className="p-3">کارشناس</th>
                <th onClick={() => requestSort('status')} className="p-3 cursor-pointer hover:bg-slate-100">وضعیت پرونده ↕️</th>
                <th onClick={() => requestSort('source')} className="p-3 cursor-pointer hover:bg-slate-100">منبع ورودی ↕️</th>
                <th className="p-3">لینک فرم</th>
                <th className="p-3">آخرین تماس</th>
                <th onClick={() => requestSort('created_at_text')} className="p-3 cursor-pointer hover:bg-slate-100">ایجاد شده ↕️</th>
                <th className="p-3 text-center">مشاوره عالی💎</th>
                <th onClick={() => requestSort('session_date_shamsi')} className="p-3 text-center cursor-pointer hover:bg-slate-100">تاریخ جلسه⏰ ↕️</th>
                <th onClick={() => requestSort('next_call_date_shamsi')} className="p-3 text-center cursor-pointer hover:bg-slate-100">تماس بعدی ↕️</th>
                <th className="p-3 text-center">⏳ زمان کل مکالمات</th>
              </tr>
              <tr className="bg-slate-100/40 border-b">
                <td className="p-1"></td>
                <td className="p-1.5"><input type="text" placeholder="فیلتر نام..." className="w-full p-1 bg-white border rounded-lg text-[10px] outline-none font-bold" value={colFilters.name} onChange={e => setColFilters({ ...colFilters, name: e.target.value })} /></td>
                <td className="p-1.5"><input type="text" placeholder="فیلتر تلفن..." className="w-full p-1 bg-white border rounded-lg text-[10px] outline-none font-bold text-center font-mono" value={colFilters.phone} onChange={e => setColFilters({ ...colFilters, phone: e.target.value })} /></td>
                <td className="p-1.5"><input type="number" placeholder="امتیاز..." className="w-16 mx-auto p-1 bg-white border rounded-lg text-[10px] outline-none font-bold text-center" value={colFilters.score} onChange={e => setColFilters({ ...colFilters, score: e.target.value })} /></td>
                <td colSpan={2}></td>
                <td className="p-1.5">
                  <select className="w-full p-1 bg-white border rounded-lg text-[10px] outline-none font-black text-purple-700" value={colFilters.status} onChange={e => setColFilters({ ...colFilters, status: e.target.value })}>
                    <option value="">همه وضعیت‌ها</option>
                    {statusesList.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </td>
                <td className="p-1.5">
                  <select className="w-full p-1 bg-white border rounded-lg text-[10px] outline-none font-black text-indigo-700" value={colFilters.source} onChange={e => setColFilters({ ...colFilters, source: e.target.value })}>
                    <option value="">همه سورس‌ها</option>
                    {sourceOptions.map(sc => <option key={sc} value={sc}>{sc}</option>)}
                  </select>
                </td>
                <td colSpan={7}></td>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-600 dark:text-slate-300 font-bold">
              {filteredLeads.map((lead: any) => (
                <tr
                  key={lead.id}
                  className="hover:bg-slate-50/50 h-14 transition-colors cursor-pointer"
                  onClick={() => setSelectedLead(lead)}
                  onContextMenu={e => handleContextMenu(e, lead)}
                >
                  <td className="p-3 text-center" onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                  <td className="p-3 font-black text-slate-900 dark:text-white flex flex-col justify-center">
                    <span>{lead.name}</span>
                    <span className="text-[8px] bg-indigo-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md w-max mt-1 font-black">🎯 {getPersonaLabel(lead.persona)}</span>
                  </td>
                  <td className="p-3 font-mono text-slate-500">{lead.phone}</td>
                  <td className="p-3 text-center font-mono text-indigo-600">{lead.score}</td>
                  <td className="p-3 text-center text-[10px]">{lead.level}</td>
                  <td className="p-3 text-slate-700 dark:text-slate-200">{lead.assigned_agent}</td>
                  <td className="p-3" onClick={e => e.stopPropagation()}>
                    <select
                      className="p-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-black text-[10px] text-purple-700 outline-none"
                      value={lead.status}
                      onChange={e => handleInlineUpdate(lead.id, 'initial_consultation_status', e.target.value)}
                    >
                      {statusesList.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">{lead.source || '---'}</td>
                  <td className="p-3 font-mono text-sky-600 max-w-[120px] truncate" title={lead.form_link}>{lead.form_link}</td>
                  <td className="p-3 text-slate-500">{lead.last_contact}</td>
                  <td className="p-3 text-slate-400 text-right">{convertToShamsi(lead.created_at_text)}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs ${lead.is_excellent_lead === 1 ? 'text-emerald-500 font-black' : 'text-slate-300'}`}>
                      {lead.is_excellent_lead === 1 ? '💎 بله' : '---'}
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono text-slate-500">{convertToShamsi(lead.session_date_shamsi)}</td>
                  <td className="p-3 text-center text-indigo-600 font-mono">{convertToShamsi(lead.next_call_date_shamsi)}</td>
                  <td className="p-3 text-center font-mono text-purple-600 font-black">{formatDuration(lead.total_call_duration)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* پیجینیشن */}
      <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-3 flex items-center justify-between border-t select-none">
        <div className="flex flex-1 justify-between sm:hidden">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} className="relative inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer">⏮️ صفحه قبل</button>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, lastPage))} disabled={currentPage === lastPage || loading} className="relative ml-3 inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer">صفحه بعد ⏭️</button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between w-full">
          <div>
            <p className="text-[10px] text-slate-500 font-bold">
              نمایش مجموعاً <span className="font-black text-indigo-600 font-mono">{totalLeads}</span> پرونده متقاضی | صفحه <span className="font-black text-slate-800 dark:text-white font-mono">{currentPage}</span> از <span className="font-black text-slate-800 dark:text-white font-mono">{lastPage}</span>
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-xl shadow-2xs gap-1" aria-label="Pagination">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || loading} className="relative inline-flex items-center rounded-lg bg-white dark:bg-slate-800 border p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-colors" title="صفحه اول">«</button>
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} className="relative inline-flex items-center rounded-lg bg-white dark:bg-slate-800 border px-2.5 py-1.5 text-[10px] font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-colors">قبلی</button>
              {Array.from({ length: lastPage }, (_, index) => index + 1)
                .filter(page => page === 1 || page === lastPage || Math.abs(page - currentPage) <= 1)
                .map((page, idx, array) => {
                  const showEllipsis = idx > 0 && page - array[idx - 1] > 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && <span className="relative inline-flex items-center px-2 py-1.5 text-[10px] font-bold text-slate-400">...</span>}
                      <button type="button" onClick={() => setCurrentPage(page)} disabled={loading} className={`relative inline-flex items-center rounded-lg px-3 py-1.5 text-[10px] font-mono font-black transition-all cursor-pointer border ${currentPage === page ? 'z-10 bg-indigo-600 text-white border-indigo-700 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}>{page}</button>
                    </React.Fragment>
                  );
                })}
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, lastPage))} disabled={currentPage === lastPage || loading} className="relative inline-flex items-center rounded-lg bg-white dark:bg-slate-800 border px-2.5 py-1.5 text-[10px] font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-colors">بعدی</button>
              <button onClick={() => setCurrentPage(lastPage)} disabled={currentPage === lastPage || loading} className="relative inline-flex items-center rounded-lg bg-white dark:bg-slate-800 border p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-colors" title="صفحه آخر">»</button>
            </nav>
          </div>
        </div>
      </div>

      {/* ================= 🗓️ مودال ارتقایافته تنظیم جلسه مشاور عالی با گارد ساعت و کلید اتمیک ================= */}
      {eventModalLeadId && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50">
          <form onSubmit={handleSaveEvent} className="bg-white p-6 rounded-[28px] border w-[440px] shadow-2xl space-y-4 text-right animate-scaleIn">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <span>🗓️ زمان‌بندی و پلمب ساعت جلسه دپارتمان مشاور عالی</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-500 mb-1">📅 تاریخ و ساعت جلسه:</label>
                {/* 🎯 پچ نوع datetime-local برای ست کردن همزمان روز و ساعت دقیق */}
                <input
                  type="datetime-local"
                  className="w-full p-2 border rounded-xl bg-slate-50 font-mono text-center text-[10px] font-bold outline-none focus:border-indigo-500"
                  value={eventForm.session_date_shamsi}
                  onChange={e => setEventForm({ ...eventForm, session_date_shamsi: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">📞 تاریخ و ساعت تماس بعدی:</label>
                <input
                  type="datetime-local"
                  className="w-full p-2 border rounded-xl bg-slate-50 font-mono text-center text-[10px] font-bold outline-none focus:border-indigo-500"
                  value={eventForm.next_call_date_shamsi}
                  onChange={e => setEventForm({ ...eventForm, next_call_date_shamsi: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-500 mb-1">👑 انتخاب مشاور عالی پرونده:</label>
              <select
                className="w-full p-2.5 border rounded-xl bg-slate-50 text-indigo-600 font-black outline-none cursor-pointer text-xs"
                value={eventForm.assigned_agent_id}
                onChange={e => setEventForm({ ...eventForm, assigned_agent_id: e.target.value })}
                required
              >
                <option value="">انتخاب مشاور عالی...</option>
                {/* 🎯 فیکس ارور ری‌آکت: تزریق ترکیب ترکیبی agent.id و index برای تضمین یکتا بودن کلیدها */}
                {seniorConsultants.map((agent: any, idx: number) => (
                  <option key={`${agent.id || agent.staff_id || idx}-${idx}`} value={agent.id || agent.staff_id}>
                    🧑‍💼 {agent.name} {agent.voip_extension ? `(داخلی: ${agent.voip_extension})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-950 text-white font-black py-2.5 rounded-xl text-xs cursor-pointer transition-colors shadow-md">
                🔏 ثبت دوره و ارجاع
              </button>
              <button type="button" onClick={() => setEventModalLeadId(null)} className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-colors">
                انصراف
              </button>
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
              <button type="submit" className="flex-1 bg-emerald-600 text-white font-black py-2 rounded-xl text-xs">⚡ ذخیره و انتقال به پرونده پیام‌ها</button>
              <button type="button" onClick={() => setSummaryModalLeadId(null)} className="px-4 bg-slate-100 text-slate-600 font-bold py-2 rounded-xl">انصراف</button>
            </div>
          </form>
        </div>
      )}

      {/* ================= 📋 مودال ثبت جلسه مشاوره اولیه ================= */}
      {consultationModalLeadId && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl rounded-[24px] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <ConsultationSessionForm
              leadId={consultationModalLeadId}
              leadData={leads.find(l => l.id === consultationModalLeadId)}
              onSuccess={() => setConsultationModalLeadId(null)}
              onCancel={() => setConsultationModalLeadId(null)}
            />
          </div>
        </div>
      )}

      {/* ================= 🎯 مگا-مودال جدید و نئونی گزینش ۱۱ پرسونا روان‌شناختی مخاطب ================= */}
      {personaModalLead && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border w-[680px] max-h-[85vh] overflow-y-auto shadow-2xl text-right space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">🎯 تعیین پرسونا روان‌شناختی و زمان‌بندی منحنی توجه</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">متقاضی جاری: <span className="text-indigo-600 font-black">{personaModalLead.name}</span> | لطفاً با توجه به کانتکست صحبت، یک مورد را پلمب کنید:</p>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {personasDatabase.map((p) => (
                <div
                  key={p.key}
                  onClick={() => handleUpdatePersona(personaModalLead.id, p.key)}
                  className={`p-3 border rounded-2xl text-right transition-all cursor-pointer flex flex-col justify-between items-start gap-1.5 group ${personaModalLead.persona === p.key ? 'bg-indigo-600/10 border-indigo-600 dark:bg-indigo-950/40' : 'bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300'}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-black text-slate-800 dark:text-slate-100 text-xs group-hover:text-indigo-600 transition-colors">{p.name}</span>
                    <span className="bg-indigo-50 dark:bg-slate-950 border text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-lg font-mono text-[9px] font-black">🗓️ زنجیره فالوآپ: {p.follow}</span>
                  </div>
                  <p className="text-slate-500 text-[10px] leading-relaxed"><span className="text-amber-500 font-black">منطق مغزی:</span> {p.logic}</p>
                  <p className="text-slate-400 text-[9px]"><span className="text-emerald-500 font-black">🛠️ روش پیگیری:</span> {p.method}</p>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t flex justify-end">
              <button type="button" onClick={() => setPersonaModalLead(null)} className="px-6 bg-slate-100 text-slate-600 font-bold py-2 rounded-xl text-xs">بستن منوی پرسونا</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ⚡ منوی کلیک‌راست پیشرفته دپارتمان پیشگامان ================= */}
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
            <button onClick={() => { setConsultationModalLeadId(contextMenu.lead.id); setContextMenu(null); }} className="w-full text-right px-3 py-1.5 hover:bg-emerald-50 hover:text-emerald-600 flex items-center gap-2 font-black">📋 ثبت جلسه مشاوره اولیه</button>
            <button onClick={() => { setSummaryModalLeadId(contextMenu.lead.id); }} className="w-full text-right px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 font-black">📝 ثبت سریع خلاصه مکالمه</button>
            <button
              onClick={() => {
                // 🎯 آماده‌سازی استیت فرم برای لید انتخاب شده
                setEventForm({
                  session_date_shamsi: contextMenu.lead.session_date_shamsi || '',
                  next_call_date_shamsi: contextMenu.lead.next_call_date_shamsi || '',
                  assigned_agent_id: contextMenu.lead.agent_id || '',
                  session_type: 'online',
                  form_type: 'senior_consultation_session'
                });
                setEventModalLeadId(contextMenu.lead.id);
              }}
              className="w-full text-right px-3 py-1.5 hover:bg-amber-50 hover:text-amber-600 flex items-center gap-2 font-bold"
            >
              🗓️ برنامه‌ریزی جلسه ارشد
            </button>

            {/* 🎯 فیکس باگ دوم: اصلاح دکمه کلیک راست برای پاس دادن لید فعال (contextMenu.lead) */}
            <button
              onClick={() => {
                if (contextMenu.lead.session_date_shamsi) {
                  handleOpenSessionReport(contextMenu.lead);
                  setContextMenu(null);
                }
              }}
              disabled={!contextMenu.lead.session_date_shamsi}
              className={`w-full text-right px-3 py-1.5 flex items-center gap-2 font-black transition-all ${contextMenu.lead.session_date_shamsi
                  ? 'hover:bg-indigo-50 text-indigo-750 cursor-pointer'
                  : 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-50'
                }`}
              title={!contextMenu.lead.session_date_shamsi ? "ابتدا باید تاریخ مشاوره تخصصی تنظیم شود" : ""}
            >
              <span>👑 ثبت گزارش جلسه مشاور عالی</span>
              {!contextMenu.lead.session_date_shamsi && <span className="text-[8px] bg-rose-100 text-rose-600 px-1 rounded">🔒 قفل</span>}
            </button>

            <button onClick={() => { handleClickToDial(contextMenu.lead.phone, contextMenu.lead.id); }} className="w-full text-right px-3 py-1.5 hover:bg-emerald-50 text-emerald-600 flex items-center gap-2 font-black">📞 تماس هوشمند (VoIP)</button>

            <div className="border-t my-1"></div>

            <div className="px-3 py-1.5">
              <label className="text-[9px] font-black text-slate-400 mb-1 block">تخصیص کارشناس جدید:</label>
              <select
                className={`w-full p-1.5 border rounded-lg font-bold text-[10px] outline-none ${isSupervisor ? 'bg-indigo-50 text-indigo-700 border-indigo-200 cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
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
            <button onClick={() => { setPersonaModalLead(contextMenu.lead); }} className="w-full text-right px-3 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-black flex items-center gap-2 text-[10px] rounded-b-lg">🎯 تعیین پرسونا روان‌شناختی</button>
          </div>
        );
      })()}

      {/* ================= 👑 مودال لوکس نمایش فرم ارزیابی جلسه ================= */}
      {isSessionModalOpen && activeReportData && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-[24px] shadow-2xl p-2 animate-fadeIn">
            <button
              onClick={() => setIsSessionModalOpen(false)}
              className="absolute top-6 left-6 w-6 h-6 border rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white text-slate-400 font-bold transition-colors cursor-pointer text-xs z-50"
            >
              ×
            </button>
            <SessionReportForm
              reportId={activeReportData.id}
              initialData={activeReportData}
              onSuccess={() => {
                setIsSessionModalOpen(false);
                loadData();
              }}
            />
          </div>
        </div>
      )}

      {selectedLead && <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} onUpdate={loadData} />}

    </div>
  );
}