'use client';

import React, { useEffect, useState } from 'react';
import SessionReportForm from './SessionReportForm';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';

export default function SessionsArchive() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed' | 'expired'>('all');
  
  // این دو خط را به لیست useState های بالای فایل (کنار sessions) اضافه کن:
const [seniorConsultants, setSeniorConsultants] = useState<any[]>([]);
const [initialConsultants, setInitialConsultants] = useState<any[]>([]);
  // مدیریت باز شدن مودال فرم روی ردیف‌های ناقص
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const BACKEND_BASE_URL = API_BASE_URL;

  const loadConsultants = async () => {
  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  // 1. لود مشاوران عالی
  const resSenior = await fetch(`${BACKEND_BASE_URL}/next/senior-consultants`, { headers });
  const jsonSenior = await resSenior.json();
  if (jsonSenior.status === 'success') setSeniorConsultants(jsonSenior.data);

  // 2. لود مشاوران اولیه
  const resInitial = await fetch(`${BACKEND_BASE_URL}/next/initial-consultants`, { headers });
  const jsonInitial = await resInitial.json();
  if (jsonInitial.status === 'success') setInitialConsultants(jsonInitial.data);
};

  const loadSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_BASE_URL}/next/session-reports/archive`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.status === 'success') {
        setSessions(json.data || []);
        setFilteredSessions(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const resolveInitialAgentName = (session: any) => {
    const agentId = session.initial_agent_id ?? session.agent_id ?? session.lead_agent_id;
    if (agentId && initialConsultants.length) {
      const consultant = initialConsultants.find(
        (c) => String(c.id) === String(agentId) || String(c.staff_id) === String(agentId)
      );
      if (consultant?.name) return consultant.name;
    }
    return session.initial_agent || '---';
  };

  useEffect(() => {
    loadSessions();
    loadConsultants();
  }, []);

  useEffect(() => {
    if (filterMode === 'all') {
      setFilteredSessions(sessions);
    } else {
      setFilteredSessions(sessions.filter(s => s.status === filterMode));
    }
  }, [filterMode, sessions]);

  const convertToShamsi = (isoStr: string) => {
    if (!isoStr) return '---';
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(isoStr));
  };

  if (loading) return <div className="p-10 text-center text-xs text-slate-400">⏳ در حال بارگذاری پورتال آرشیو جلسات تخصصی پیشگامان...</div>;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 shadow-xl p-5 text-right font-sans text-[11px] text-[#2d3748]" dir="rtl">
      
      {/* هدر کارتابل جلسات */}
      <div className="flex flex-col sm:flex-row justify-between items-center border-b pb-4 mb-5 gap-3">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white">🗂️ هاب نظارتی و مانیتورینگ جلسات مشاوره تخصصی</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">پایش لایو وضعیت پلمب فرم‌های ارزیابی و مدیریت علل تاخیر کارشناسان ارشد</p>
        </div>
        
        {/* فیلترهای تب‌دار نئونی */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border gap-1 font-bold text-[10px]">
          <button onClick={() => setFilterMode('all')} className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${filterMode === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500'}`}>کل جلسات ({sessions.length})</button>
          <button onClick={() => setFilterMode('pending')} className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${filterMode === 'pending' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-500'}`}>معلق در ددلاین ({sessions.filter(s => s.status === 'pending').length})</button>
          <button onClick={() => setFilterMode('completed')} className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${filterMode === 'completed' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'}`}>پلمب موفق ({sessions.filter(s => s.status === 'completed').length})</button>
          <button onClick={() => setFilterMode('expired')} className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${filterMode === 'expired' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'}`}>تخلف / قفل شده ({sessions.filter(s => s.status === 'expired').length})</button>
        </div>
      </div>

      {/* گرید و جدول لایو اطلاعات */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full border-collapse text-right whitespace-nowrap bg-white dark:bg-slate-900">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b text-slate-500 text-[10px] font-black h-10 select-none">
              <th className="p-3">👤 نام متقاضی</th>
              <th className="p-3">🧑‍💼 مشاور اولیه</th>
              <th className="p-3">💎 مشاور عالی</th>
              <th className="p-3 text-center">⏰ زمان اتمام جلسه</th>
              <th className="p-3 text-center">⏳ تایم قفل</th>
              <th className="p-3 text-center">🚦 وضعیت گزارش</th>
              <th className="p-3 text-center">⏱️ ساعت ثبت نهایی</th>
              <th className="p-3 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filteredSessions.map((session) => (
              <tr key={session.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 h-12 transition-colors">
                <td className="p-3 font-black text-slate-900 dark:text-white">
                  <div>{session.client_name}</div>
                  <div className="text-[9px] text-slate-400 font-mono font-medium mt-0.5">{session.client_phone}</div>
                </td>
                {/* <td className="p-3 text-slate-600">{session.initial_agent}</td>
                <td className="p-3 font-bold text-indigo-600">{session.senior_consultant}</td> */}

                <td className="p-3 text-slate-600">{resolveInitialAgentName(session)}</td>
<td className="p-3 font-bold text-indigo-600">{session.senior_consultant}</td>
                <td className="p-3 text-center font-mono text-slate-500">{convertToShamsi(session.session_start)}</td>
                <td className="p-3 text-center font-mono text-slate-500">{convertToShamsi(session.deadline)}</td>
                
                {/* بدنه و بج وضعیت رنگی */}
                <td className="p-3 text-center">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black inline-block ${
                    session.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                    session.status === 'expired' ? 'bg-rose-50 text-rose-600 animate-pulse' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {session.status === 'completed' ? '✓ گزارش ثبت شده' :
                     session.status === 'expired' ? '⚠️ منقضی + علت تاخیر' :
                     '⏳ در انتظار تکمیل'}
                  </span>
                </td>

                <td className="p-3 text-center font-mono text-slate-400">
                  {session.submitted_at ? convertToShamsi(session.submitted_at) : '---'}
                </td>

                {/* دکمه اکشن داینامیک */}
                <td className="p-3 text-center">
                  {session.status !== 'completed' ? (
                    <button 
                      onClick={() => setSelectedSession(session)}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-[10px] cursor-pointer transition-all shadow-xs"
                    >
                      📝 تکمیل فوری فرم
                    </button>
                  ) : (
                    <span className="text-slate-400 text-[10px] font-bold">📂 (دیتا امن)</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredSessions.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 font-medium text-[10px]">هیچ جلسه مشاوره تخصصی در این دسته یافت نشد. ✨</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= 👑 رندر مودال داخلی تکمیل گزارش در صورت کلیک ================= */}
      {selectedSession && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-[24px] shadow-2xl p-2 animate-fadeIn">
            <button 
              onClick={() => setSelectedSession(null)}
              className="absolute top-6 left-6 w-6 h-6 border rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white text-slate-400 font-bold cursor-pointer text-xs z-50"
            >
              ×
            </button>
            <SessionReportForm 
              reportId={selectedSession.id}
              initialData={{
                client_name: selectedSession.client_name,
                initial_agent_name: resolveInitialAgentName(selectedSession),
                initial_agent_id: selectedSession.initial_agent_id ?? selectedSession.agent_id ?? selectedSession.lead_agent_id ?? null,
                senior_consultant_name: selectedSession.senior_consultant,
                deadline_at: selectedSession.deadline
              }}
              onSuccess={() => {
                setSelectedSession(null);
                loadSessions(); // لود مجدد اطلاعات کارتابل
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}