// components/staff/HrLeaveManager.tsx
'use client';

import React, { useEffect, useState } from 'react';
import AdminAttendanceViewer from './AdminAttendanceViewer';
import PayrollManager from './PayrollManager';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';

export default function HrLeaveManager() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves' | 'holidays' | 'payroll'>('attendance');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('agent');
  
  const [clocks, setClocks] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);


  useEffect(() => {
    const initHrData = async () => {
      await loadLogsData();
    };
    initHrData();
    }, []);
  
  
  // استیت هوشمند سقف مرخصی ماهانه (8.5% قانون)
  const [leaveBalance, setLeaveBalance] = useState({ 
    total_allowed_hours: 15.9, 
    total_used_hours: 0, 
    remaining_hours: 15.9,
    used_daily_leaves: 0,
    monthly_working_hours: 187,
    calculation_rule: '8.5% monthly working hours'
  });

  // لایو تایمرها
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [liveSeconds, setLiveActiveSeconds] = useState(0);
  const [totalSecondsToday, setTotalSecondsToday] = useState(0);

  // فرم مرخصی
  const [leaveForm, setLeaveForm] = useState({ leave_type: 'daily_vacation', target_user_id: '', start_date: '', end_date: '', reason: '' });
  
  // پنل روزهای تعطیل و سقف‌های ادمین
  const [adminHoliday, setAdminHoliday] = useState({ date: '', title: '' });
  const [holidaysList, setHolidaysList] = useState<any[]>([]);
  const [customLimitForm, setCustomLimitForm] = useState({ user_id: '', limit: '' });

  // مودال بررسی ناظر برای تایید/رد مرخصی
  const [reviewingLeave, setReviewingLeave] = useState<any>(null);
  const [supervisorNote, setSupervisorNote] = useState('');

  const BACKEND_BASE_URL = API_BASE_URL;

  const formatTimestampToPersian = (timestamp: number | null) => {
    if (!timestamp) return { dayName: '---', shamsiDate: '---', timeStr: '---' };
    const date = new Date(timestamp * 1000);
    const dayName = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(date);
    const shamsiDate = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
    const timeStr = date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    return { dayName, shamsiDate, timeStr };
  };
  

const loadLogsData = async () => {
    const token = localStorage.getItem('token');
    
    // 🧠 ارتقای گارد ترکیبی: ابتدا نقش را از لوکال‌استوریج سایدبار بخوان تا به عنوان سوپروایزر معطل نمانیم
    const localRole = localStorage.getItem('user_role') || 'agent';
    setUserRole(localRole);

    const todayStr = new Date().toISOString().slice(0, 10);
    try {
      // واکشی دیتای هاب
      const hubRes = await fetch(`${BACKEND_BASE_URL}/next/agent/dashboard-hub`, { headers: { 'Authorization': `Bearer ${token}` } });
      const hubJson = await hubRes.json();
      
      // چفت کردن نهایی نقش با دیتای سرور (پشتیبانی از هر دو متد)
      const finalRole = (hubJson.is_supervisor || localRole === 'supervisor' || localRole === 'admin') ? 'supervisor' : 'agent';
      setUserRole(finalRole);

      const clockStatusRes = await fetch(`${BACKEND_BASE_URL}/next/hr/attendance/status?date_shamsi=${todayStr}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const clockJson = await clockStatusRes.json();
      if (clockJson.status === 'success') {
        setIsClockedIn(clockJson.is_clocked_in);
        setTotalSecondsToday(clockJson.total_seconds_today);
        setLiveActiveSeconds(clockJson.live_active_seconds || 0);
      }

      const logsRes = await fetch(`${BACKEND_BASE_URL}/next/hr/leaves/history`, { headers: { 'Authorization': `Bearer ${token}` } });
      const logsJson = await logsRes.json();
      if (logsJson.status === 'success') {
        setClocks(logsJson.clocks || []);
        setLeaves(logsJson.leaves || []);
        if (logsJson.leave_balance) setLeaveBalance(logsJson.leave_balance);
      }

      // 👑 لود همزمان دیتاهای تکمیلی اتاق پایش ناظر ارشد
      if (finalRole === 'supervisor') {
        const uRes = await fetch(`${BACKEND_BASE_URL}/next/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        const uData = await uRes.json();
        if (uData.status === 'success') setUsersList(uData.data || []);

        const configRes = await fetch(`${BACKEND_BASE_URL}/next/hr/admin/config-list`, { headers: { 'Authorization': `Bearer ${token}` } });
        const configJson = await configRes.json();
        if (configJson.status === 'success') setHolidaysList(configJson.holidays || []);
      }
    } catch (err) { 
      console.error("خطا در فچ اطلاعات هاب اداری:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadLogsData(); }, []);

  useEffect(() => {
    let timer: any;
    if (isClockedIn) {
      timer = setInterval(() => { setLiveActiveSeconds(prev => prev + 1); }, 1000);
    }
    return () => clearInterval(timer);
  }, [isClockedIn]);

  const handleClockToggle = async () => {
    const token = localStorage.getItem('token');
    const todayStr = new Date().toISOString().slice(0, 10);
    
    // 🎯 دریافت MAC Address دستگاه
    const macAddress = await getMacAddress();
    
    const res = await fetch(`${BACKEND_BASE_URL}/next/hr/attendance/toggle`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json',
        'X-Client-MAC': macAddress
      },
      body: JSON.stringify({ date_shamsi: todayStr })
    });
    
    if (res.ok) { 
      loadLogsData(); 
    } else {
      const errorData = await res.json();
      alert(errorData.message || 'خطا در ثبت تردد');
    }
  };

  // 🎯 تابع دریافت MAC Address (شبیه‌سازی)
  const getMacAddress = async (): Promise<string> => {
    // در محیط واقعی، این باید از طریق API مرورگر یا سرور پروکسی دریافت شود
    // فعلاً یک MAC آدرس نمونه برمی‌گردانیم
    return '00:1A:2B:3C:4D:5E';
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const startTs = Math.floor(new Date(leaveForm.start_date).getTime() / 1000);
    const endTs = Math.floor(new Date(leaveForm.end_date).getTime() / 1000);

    if (isNaN(startTs) || isNaN(endTs)) {
      alert('⚠️ لطفا تواریخ مرخصی را از کادر دیت‌پیکر تقویم انتخاب کنید.');
      return;
    }

    const res = await fetch(`${BACKEND_BASE_URL}/next/hr/leaves/store`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leave_type: leaveForm.leave_type,
        target_user_id: leaveForm.target_user_id || null,
        start_timestamp: startTs,
        end_timestamp: endTs,
        reason: leaveForm.reason
      })
    });
    if (res.ok) {
      alert('✓ درخواست مرخصی با موفقیت ثبت شد.');
      setLeaveForm({ leave_type: 'daily_vacation', target_user_id: '', start_date: '', end_date: '', reason: '' });
      loadLogsData();
    }
  };

  const handleReviewSubmit = async (status: 'approved' | 'rejected') => {
    if (!reviewingLeave) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/next/hr/leaves/review/${reviewingLeave.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, supervisor_note: supervisorNote })
      });
      if (res.ok) {
        alert('✓ دستور ناظر با موفقیت روی پرونده مرخصی اعمال شد.');
        setReviewingLeave(null);
        setSupervisorNote('');
        loadLogsData();
      }
    } catch (err) { console.error(err); }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_BASE_URL}/next/hr/admin/store-holiday`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ holiday_date_shamsi: adminHoliday.date, title: adminHoliday.title })
    });
    if (res.ok) {
      alert('✓ روز تعطیل رسمی به کورتکس تقویم الصاق شد.');
      setAdminHoliday({ date: '', title: '' });
      loadLogsData();
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
      alert('✓ سقف مرخصی اختصاصی کارشناس با موفقیت در دیتابیس قفل شد.');
      setCustomLimitForm({ user_id: '', limit: '' });
      loadLogsData();
    }
  };

  const formatDurationText = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  if (loading) return <div className="text-center p-10 text-slate-400">⏳ راه‌اندازی کارگزینی دیجیتال پیشگامان...</div>;
  const isSupervisor = userRole === 'supervisor';

  return (
    <div className="space-y-6 text-right font-sans text-[11px]" dir="rtl">
      
      {/* ناوبری ماژول */}
      <div className="flex gap-2 border-b pb-3 bg-white p-4 rounded-2xl border shadow-2xs">
        <button onClick={() => setActiveTab('attendance')} className={`px-4 py-2 rounded-xl font-black transition-all cursor-pointer ${activeTab === 'attendance' ? 'bg-slate-900 text-white shadow' : 'bg-slate-100 text-slate-600'}`}>⏱️ تایمر کارکرد لایو و تردد مکرر</button>
        <button onClick={() => setActiveTab('leaves')} className={`px-4 py-2 rounded-xl font-black transition-all cursor-pointer ${activeTab === 'leaves' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-600'}`}>📅 کارتابل مرخصی و ماموریت‌های پرسنلی</button>
        {isSupervisor && (
          <button onClick={() => setActiveTab('holidays')} className={`px-4 py-2 rounded-xl font-black transition-all cursor-pointer ${activeTab === 'holidays' ? 'bg-rose-600 text-white shadow' : 'bg-slate-100 text-slate-600'}`}>🎉 پنل ادمین: تقویم تعطیلات و سقف‌ها</button>
        )}
        {/* <button onClick={() => setActiveTab('payroll')} className={`px-4 py-1.5 rounded-xl font-black transition-all cursor-pointer ${activeTab === 'payroll' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-600 hover:bg-slate-50'}`}>💰 حقوق، دستمزد و کارانه‌ها</button> */}
      </div>

      {/* ================= تب اول: حضور و غیاب مکرر زنده ================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800">🚀 دکمه تک‌وضعیتی کنترل تردد</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">محاسبه مجموع کارکرد مفید روز بر پایه ثاني شمار زنده</p>
              </div>
              
              <div className="p-5 bg-slate-950 text-white text-center rounded-2xl space-y-2 border">
                <div className="text-[9px] text-emerald-400 font-bold">⏱️ زمان کارکرد این بازه جاری:</div>
                <div className="text-2xl font-mono font-black text-emerald-400 tracking-widest">{formatDurationText(liveSeconds)}</div>
                <div className="text-[9px] text-slate-400 pt-1.5 border-t border-slate-900">کل کارکرد امروز شما: {formatDurationText(totalSecondsToday)}</div>
              </div>

              <button onClick={handleClockToggle} className={`w-full py-4 rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer ${isClockedIn ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                {isClockedIn ? '🛑 ثبت خروج زنده (بستن این بازه کاری)' : '🚀 ثبت ورود زنده به کارتابل'}
              </button>
            </div>

            <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-2xs lg:col-span-2 space-y-3">
              <h4 className="text-xs font-black text-slate-800">📋 لاگ ترددهای مکرر شخصی امروز</h4>
              <div className="overflow-x-auto border rounded-xl max-h-[230px] overflow-y-auto">
                <table className="w-full text-right border-collapse whitespace-nowrap">
                  <thead className="bg-slate-950 text-white text-[10px]">
                    <tr>
                      <th className="p-2.5">روز هفته</th>
                      <th className="p-2.5 text-center">تاریخ شمسی</th>
                      <th className="p-2.5 text-center">ساعت ورود</th>
                      <th className="p-2.5 text-center">ساعت خروج</th>
                      <th className="p-2.5 text-center bg-indigo-900">مجموع کارکرد این بازه</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[10px] text-slate-600 font-medium">
                    {clocks.map((c: any, i: number) => {
                      const clockInInfo = formatTimestampToPersian(c.clock_in_timestamp);
                      const clockOutInfo = formatTimestampToPersian(c.clock_out_timestamp);
                      return (
                        <tr key={i} className="hover:bg-slate-50 h-10">
                          <td className="p-2.5 font-bold text-slate-800 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{clockInInfo.dayName}</td>
                          <td className="p-2.5 text-center font-mono">{clockInInfo.shamsiDate}</td>
                          <td className="p-2.5 text-center font-mono text-emerald-600 font-bold">{clockInInfo.timeStr}</td>
                          <td className="p-2.5 text-center font-mono text-rose-600 font-bold">{c.clock_out_timestamp ? clockOutInfo.timeStr : 'تایمر باز...'}</td>
                          <td className="p-2.5 text-center font-mono font-black bg-indigo-50/40 text-indigo-950">{formatDurationText(c.duration_seconds)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 🎯 تزریق کامپوننت پایش فیلتردار کل کارمندان مخصوص ادمین */}
          {isSupervisor && (
            <AdminAttendanceViewer 
              usersList={usersList} 
              BACKEND_BASE_URL={BACKEND_BASE_URL} 
              formatTimestampToPersian={formatTimestampToPersian} 
              formatDurationText={formatDurationText} 
            />
          )}
        </div>
      )}

      {/* ================= تب دوم: بخش مدیریت مرخصی مجزا با حسابگر سقف مجاز ================= */}
      {activeTab === 'leaves' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-4 rounded-2xl text-white border">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
              <div>
                <div className="text-[10px] text-slate-400 font-bold">سقف مرخصی ماهانه (8.5%):</div>
                <div className="text-base font-black text-white mt-1">{leaveBalance.total_allowed_hours} ساعت</div>
              </div>
              <span className="text-xl">📊</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
              <div>
                <div className="text-[10px] text-slate-400 font-bold">مرخصی‌های مصرف شده:</div>
                <div className="text-base font-black text-rose-400 mt-1">{leaveBalance.total_used_hours} ساعت</div>
              </div>
              <span className="text-xl">🌴</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center bg-emerald-500/10">
              <div>
                <div className="text-[10px] text-emerald-300 font-bold">باقیمانده مرخصی مجاز شما:</div>
                <div className="text-base font-black text-emerald-400 mt-1">{leaveBalance.remaining_hours} ساعت مجاز</div>
              </div>
              <span className="text-xl">✔️</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleLeaveSubmit} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-2xs space-y-3 h-fit">
              <h3 className="text-xs font-black text-slate-800">📅 فرم مرخصی و مأموریت</h3>
              
              <div>
                <label className="block font-bold text-slate-600 mb-1">💼 انتخاب عضو تیم:</label>
                {isSupervisor ? (
                  <select className="w-full p-2 border rounded-xl bg-slate-50 font-bold text-indigo-600 outline-none" value={leaveForm.target_user_id} onChange={e => setLeaveForm({ ...leaveForm, target_user_id: e.target.value })} required>
                    <option value="">انتخاب کارشناس مربوطه...</option>
                    {usersList.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                ) : (
                  <input type="text" className="w-full p-2.5 border rounded-xl bg-slate-100 text-slate-400 font-bold outline-none" value="پروفایل کاربری من (قفل شده)" disabled />
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">نوع وضعیت اداری:</label>
                <select className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold" value={leaveForm.leave_type} onChange={e => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}>
                  <option value="daily_vacation">📅 مرخصی روزانه استحقاقی</option>
                  <option value="hourly_pass">⏱️ پاس ساعتی درون‌روزی</option>
                  <option value="mission">💼 مأموریت سازمانی پرسنل</option>
                  <option value="medical">🩺 استعلاجی کلینیک</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-0.5">📅 از تاریخ:</label>
                  <input type="date" className="w-full p-2 border rounded-xl bg-slate-50 text-center font-bold outline-none cursor-pointer text-[10px]" value={leaveForm.start_date} onChange={e => setLeaveForm({ ...leaveForm, start_date: e.target.value })} required />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-0.5">📅 تا تاریخ:</label>
                  <input type="date" className="w-full p-2 border rounded-xl bg-slate-50 text-center font-bold outline-none cursor-pointer text-[10px]" value={leaveForm.end_date} onChange={e => setLeaveForm({ ...leaveForm, end_date: e.target.value })} required />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">علت و دلایل درخواست مرخصی:</label>
                <textarea placeholder="توضیحات پیوست فرم..." rows={2} className="w-full p-2 border rounded-xl bg-slate-50 outline-none resize-none font-medium text-[10px]" value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}></textarea>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-2.5 rounded-xl text-xs cursor-pointer">🚀 ارسال فرم اداری</button>
            </form>

            <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-2xs lg:col-span-2">
              <h4 className="text-xs font-black text-slate-800 mb-3">📋 آرشیو مرخصی‌ها و روزهای هفته</h4>
              <div className="overflow-x-auto border rounded-xl max-h-[290px] overflow-y-auto">
                <table className="w-full text-right border-collapse whitespace-nowrap">
                  <thead className="bg-slate-950 text-white text-[10px]">
                    <tr>
                      {isSupervisor && <th className="p-2.5">کارشناس</th>}
                      <th className="p-2.5">روز آغاز</th>
                      <th className="p-2.5 text-center">نوع درخواست</th>
                      <th className="p-2.5 text-center">تاریخ تقویم</th>
                      <th className="p-2.5 text-center">وضعیت تایید</th>
                      {isSupervisor && <th className="p-2.5 text-center">مدیریت</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[10px] text-slate-600 font-medium">
                    {leaves.map((l: any, idx: number) => {
                      const startInfo = formatTimestampToPersian(l.start_timestamp);
                      return (
                        <tr key={idx} className="hover:bg-slate-50 h-10">
                          {isSupervisor && <td className="p-2.5 font-black text-slate-900">{l.user_name}</td>}
                          <td className="p-2.5 font-bold text-slate-800">{startInfo.dayName}</td>
                          <td className="p-2.5 text-center">
                            <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">
                              {l.leave_type === 'mission' ? '💼 مأموریت' : l.leave_type === 'hourly_pass' ? '⏱️ پاس ساعتی' : '📅 مرخصی روزانه'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-slate-700">{startInfo.shamsiDate}</td>
                          <td className="p-2.5 text-center">
                            <span className={l.status === 'approved' ? 'text-emerald-600 font-black' : l.status === 'rejected' ? 'text-rose-600 font-bold' : 'text-amber-600 font-bold animate-pulse'}>
                              {l.status === 'approved' ? '✔️ تایید شده' : l.status === 'rejected' ? '❌ رد شده' : '⏳ در انتظار'}
                            </span>
                          </td>
                          {isSupervisor && (
                            <td className="p-2.5 text-center">
                              {l.status === 'pending' ? (
                                <button onClick={() => setReviewingLeave(l)} className="bg-indigo-600 text-white font-black px-2 py-1 rounded-md text-[9px] cursor-pointer hover:bg-indigo-700 transition-all">⚖️ بررسی و قضاوت</button>
                              ) : (
                                <span className="text-slate-300">بررسی شده</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payroll' && (
  <PayrollManager usersList={usersList} BACKEND_BASE_URL={BACKEND_BASE_URL} isSupervisor={isSupervisor} />
)}

      {/* ================= تب سوم: پنل تنظیم تعطیلات و سقف‌های ادمین ================= */}
      {activeTab === 'holidays' && isSupervisor && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900 text-white p-5 rounded-[24px] border border-slate-950 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* فرم ثبت روز تعطیل سالانه */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-amber-400">🎉 پنل ثبت روزهای تعطیلات رسمی پیشگامان</h3>
              <p className="text-slate-400 text-[10px]">جمعه‌ها خودکار تعطیل هستند؛ مابقی مناسبت‌ها را وارد کنید.</p>
              <form onSubmit={handleAddHoliday} className="flex gap-2 items-center">
                <input type="text" placeholder="تاریخ: 1405/01/01" className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-center font-mono text-white text-[10px] w-28 outline-none" value={adminHoliday.date} onChange={e => setAdminHoliday({ ...adminHoliday, date: e.target.value })} required />
                <input type="text" placeholder="مناسبت تعطیلی..." className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-[10px] font-bold flex-1 outline-none" value={adminHoliday.title} onChange={e => setAdminHoliday({ ...adminHoliday, title: e.target.value })} required />
                <button type="submit" className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black px-3 py-2 rounded-xl text-[10px] cursor-pointer transition-all">➕ پلمب</button>
              </form>
              <div className="flex flex-wrap gap-1.5 max-h-[70px] overflow-y-auto pt-1">
                {holidaysList.map((h: any) => (
                  <span key={h.id} className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono text-[9px]">📅 {h.holiday_date_shamsi} ({h.title})</span>
                ))}
              </div>
            </div>

            {/* ⚙️ فرم فوق‌لوکس نئونی تخصیص سقف اختصاصی برای هر پرسنل */}
            <div className="space-y-3 border-r border-slate-800 pr-6">
              <h3 className="text-xs font-black text-sky-400">⚙️ تعیین سقف مرخصی اختصاصی پرسنل</h3>
              <p className="text-slate-400 text-[10px]">تغییر و بازنویسی سقف ۲۶ روز پیش‌فرض قانون کار دفتر مرکزی</p>
              <form onSubmit={handleCustomLimitSubmit} className="flex gap-2 items-center">
                <select className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-[10px] flex-1 cursor-pointer outline-none" value={customLimitForm.user_id} onChange={e => setCustomLimitForm({ ...customLimitForm, user_id: e.target.value })} required>
                  <option value="">انتخاب کارشناس...</option>
                  {usersList.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <input type="number" placeholder="تعداد روز مجاز..." className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-[10px] w-24 text-center outline-none font-mono" value={customLimitForm.limit} onChange={e => setCustomLimitForm({ ...customLimitForm, limit: e.target.value })} required />
                <button type="submit" className="bg-sky-500 text-slate-950 font-black px-3 py-2 rounded-xl text-[10px] cursor-pointer hover:bg-sky-600 transition-all">🔏 قفل سقف</button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* ================= ⚖️ مودال بررسی ناظر ارشد ================= */}
      {reviewingLeave && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm space-y-4 border text-right">
            <h3 className="font-black text-slate-800 text-sm flex items-center gap-1.5">⚖️ بررسی فرم درخواست: {reviewingLeave.user_name}</h3>
            
            <div className="bg-slate-50 p-3 rounded-xl border space-y-2 text-[10px]">
              <div><strong>علت نوشته شده کارشناس:</strong></div>
              <p className="text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border text-[10px] font-medium">{reviewingLeave.reason || 'توضیحاتی قید نشده است.'}</p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600">✍️ دستور ناظر ارشد (اختیاری):</label>
              <textarea placeholder="علت تایید یا رد درخواست..." rows={2} className="w-full p-2.5 border rounded-xl bg-slate-50 outline-none text-[11px] resize-none font-medium" value={supervisorNote} onChange={e => setSupervisorNote(e.target.value)}></textarea>
            </div>

            <div className="pt-1 flex gap-2">
              <button type="button" onClick={() => handleReviewSubmit('approved')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl font-black cursor-pointer transition-all text-xs">✔️ موافقت و تایید</button>
              <button type="button" onClick={() => handleReviewSubmit('rejected')} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white p-2.5 rounded-xl font-black cursor-pointer transition-all text-xs">❌ مخالفت و رد</button>
              <button type="button" onClick={() => setReviewingLeave(null)} className="bg-slate-100 text-slate-600 px-3 py-2.5 rounded-xl font-medium cursor-pointer">انصراف</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}