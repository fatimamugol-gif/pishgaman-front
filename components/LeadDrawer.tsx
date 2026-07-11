// components/LeadDrawer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import ProfileTab from './drawer/ProfileTab';
import ChatTab from './drawer/ChatTab';
import RemindersTab from './drawer/RemindersTab';
import TasksTab from './drawer/TasksTab';
import CallsTab from './drawer/CallsTab';

interface LeadDrawerProps {
  lead: any;
  onClose: () => void;
  onUpdate: (updated: any) => Promise<void>;
}

export default function LeadDrawer({ lead, onClose, onUpdate }: LeadDrawerProps) {
  const [selectedLead, setSelectedLead] = useState<any>({ ...lead });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'chat' | 'reminders' | 'tasks' | 'merge' | 'calls'>('profile');

  const [leadReminders, setLeadReminders] = useState<any[]>([]);
  const [leadTasks, setLeadTasks] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [leadCallLogs, setLeadCallLogs] = useState<any[]>([]);

  const [masterLeadId, setMasterLeadId] = useState('');
  const [newReminder, setNewReminder] = useState({ title: '', description: '', date: '', time: '09:00' });
  const [newTask, setNewTask] = useState<any>({ title: '', date: '', has_reminder: false, reminder_date: '', reminder_time: '09:00', channels: ['in_app'], assigned_agent_id: '' });
  
  const [loading, setLoading] = useState(true);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [callsLoading, setCallsLoading] = useState(false); 
  const [isConverting, setIsSubmittingConversion] = useState(false);

  const [departments, setDepartments] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  const BACKEND_BASE_URL = `http://${currentHost}:8000`;

  const personasList = ['Goal Oriented', 'Analytical', 'Safety Oriented', 'Explorer', 'Skeptic', 'Budget-Conscious', 'Family-First', 'Fast-Track', 'Undecided/Passive', 'Opportunity-Driven', 'Case Study Seeker'];
  const sourceOptions = ['اینستاگرام', 'پیشگامان', 'تهران ویزا', 'واتساپ', 'تلگرام', 'بله', 'معرفی', 'تماس ورودی', 'رزرو سایت', 'ورود دستی فرانت'];

  const fetchLeadSubData = async (leadId: number) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };

    try {
      const [remRes, taskRes, detailRes, callRes, deptRes, userRes] = await Promise.all([
        fetch(`${BACKEND_BASE_URL}/api/next/leads/${leadId}/reminders`, { headers: authHeaders }),
        fetch(`${BACKEND_BASE_URL}/api/next/leads/${leadId}/tasks`, { headers: authHeaders }),
        fetch(`${BACKEND_BASE_URL}/api/next/leads/detail/${leadId}`, { headers: authHeaders }),
        fetch(`${BACKEND_BASE_URL}/api/next/leads/${leadId}/call-logs`, { headers: authHeaders }),
        fetch(`${BACKEND_BASE_URL}/api/next/departments`, { headers: authHeaders }),
        fetch(`${BACKEND_BASE_URL}/api/next/users`, { headers: authHeaders })
      ]);

      if (remRes.ok) { const r = await remRes.json(); if (r.status === 'success') setLeadReminders(r.data || []); }
      if (taskRes.ok) { const t = await taskRes.json(); if (t.status === 'success') setLeadTasks(t.data || []); }
      if (callRes.ok) { const c = await callRes.json(); if (c.status === 'success') setLeadCallLogs(c.data || []); }
      if (deptRes.ok) { const d = await deptRes.json(); if (d.status === 'success') setDepartments(d.data || []); }
      if (userRes.ok) { const u = await userRes.json(); if (u.status === 'success') setAgents(u.data || []); }

      if (detailRes.ok) {
        const detailData = await detailRes.json();
        if (detailData.status === 'success') {
          setSelectedLead(detailData.data);
          setChatHistory(detailData.data.chat_history || []);
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // 🎯 مگا-پچ فرانت‌آند: ارسال مستقیم و فیزیکی اطلاعات ادیتور به روت معتبر بک‌آند
  const handlePersistLeadUpdate = async (updatedFields: any) => {
    const token = localStorage.getItem('token');
    try {
      // شلیک مستقیم به روت POST چفت شده در بک‌آند لاراول شما
      const res = await fetch(`${BACKEND_BASE_URL}/api/next/leads/update/${updatedFields.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(updatedFields)
      });

      if (res.ok) {
        const json = await res.json();
        alert(json.message || '✓ تغییرات با موفقیت ذخیره شد.');
        // بازخوانی لایو اطلاعات از دیتابیس پس از قفل شدن هارد
        fetchLeadSubData(updatedFields.id);
        // رفرش گرید کارتابل اصلی پشت صفحه
        if (onUpdate) onUpdate();
      } else {
        alert('❌ خطای سرور در ذخیره‌سازی اطلاعات.');
      }
    } catch (err) {
      console.error("🚨 [HTTP SHOT CRASH]:", err);
      alert('❌ خطا در اتصال به سرور مخابراتی لاراول.');
    }
  };

  const refreshCallLogs = async () => {
    setCallsLoading(true);
    const token = localStorage.getItem('token');
    try {
      const callRes = await fetch(`${BACKEND_BASE_URL}/api/next/leads/${selectedLead.id}/call-logs`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (callRes.ok) { const c = await callRes.json(); if (c.status === 'success') setLeadCallLogs(c.data || []); }
    } catch (err) { console.error(err); } finally { setCallsLoading(false); }
  };

  useEffect(() => {
    setIsEditing(false);
    if (lead?.id) fetchLeadSubData(lead.id);
  }, [lead]);

  const handleRecalculateScore = async () => {
    setScoringLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/next/leads/${selectedLead.id}/recalculate-score`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { fetchLeadSubData(selectedLead.id); }
    } catch (err) { console.error(err); } finally { setScoringLoading(false); }
  };

  const handleConvertToOfficialClient = async () => {
    if (!confirm(`👑 ناظر گرامی، آیا از ارتقای متقاضی اطمینان دارید؟`)) return;
    setIsSubmittingConversion(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/next/leads/convert-to-client`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ lead_id: lead.id }) });
      if (res.ok) { if (onClose) onClose(); if (onUpdate) onUpdate(); }
    } catch (e) { console.error(e); } finally { setIsSubmittingConversion(false); }
  };

  const handleAddTask = async () => {
    if (!newTask.title) return alert('عنوان وظیفه را وارد کنید.');
    const token = localStorage.getItem('token');
    await fetch(`${BACKEND_BASE_URL}/api/next/tasks`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: selectedLead.id, task_title: newTask.title, due_date_shamsi: newTask.date, has_reminder: 0, assigned_agent_id: newTask.assigned_agent_id }),
    });
    fetchLeadSubData(selectedLead.id);
  };

  const handleMergeLeads = async () => {
    if (!masterLeadId) return alert('آیدی لید اصلی الزامی است.');
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_BASE_URL}/api/next/leads/merge`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ target_lead_id: selectedLead.id, master_lead_id: parseInt(masterLeadId) }) });
    if (res.ok) { onClose(); if (onUpdate) onUpdate(); }
  };

  const handleAddReminder = async () => {
    const token = localStorage.getItem('token');
    await fetch(`${BACKEND_BASE_URL}/api/next/reminders/store`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: selectedLead.id, title: newReminder.title, description: newReminder.description, reminder_date_shamsi: newReminder.date, reminder_time: newReminder.time, notification_channels: ['in_app'] })
    });
    setNewReminder({ title: '', description: '', date: '', time: '09:00' });
    fetchLeadSubData(selectedLead.id);
  };

  if (loading || !selectedLead) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-start">
        <div className="bg-white w-full max-w-2xl h-full flex items-center justify-center p-6 border-r text-xs">
          <div className="text-center font-bold text-slate-500 animate-pulse">⏳ در حال بازخوانی پرونده ۳۶۰ درجه و اتصالات مرکز تلفن...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-start animate-fadeIn" dir="rtl">
      <div className="bg-white dark:bg-slate-900 w-full md:max-w-2xl h-full shadow-2xl flex flex-col p-4 md:p-6 overflow-y-auto border-r text-[11px] font-bold text-slate-700 dark:text-slate-300">
        
        {/* هدر دراور */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <div>
            <h2 className="text-sm md:text-base font-black text-slate-800 dark:text-white">👤 شناسنامه جامع و ۳۶۰ درجه متقاضی</h2>
            <p className="text-xs text-indigo-600 font-bold mt-0.5">{selectedLead.name} ({selectedLead.phone})</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg cursor-pointer">×</button>
        </div>

        {/* تب‌ها */}
        <div className="flex flex-row items-center gap-1.5 border-b pb-3 mb-4 select-none overflow-x-auto whitespace-nowrap px-1 scrollbar-none">
          <button type="button" onClick={() => setActiveTab('profile')} className={`px-3 py-2 rounded-xl font-bold transition-all text-[10px] ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>👤 شناسنامه و وضعیت</button>
          <button type="button" onClick={() => setActiveTab('chat')} className={`px-3 py-2 rounded-xl font-bold transition-all text-[10px] ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>💬 مکالمات ({chatHistory.length})</button>
          <button type="button" onClick={() => setActiveTab('reminders')} className={`px-3 py-2 rounded-xl font-bold transition-all text-[10px] ${activeTab === 'reminders' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>🔔 یادآورها ({leadReminders.length})</button>
          <button type="button" onClick={() => setActiveTab('tasks')} className={`px-3 py-2 rounded-xl font-bold transition-all text-[10px] ${activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>✅ وظایف ({leadTasks.length})</button>
          <button type="button" onClick={() => setActiveTab('calls')} className={`px-3 py-2 rounded-xl font-bold transition-all text-[10px] ${activeTab === 'calls' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>📞 تماس‌های VoIP ({leadCallLogs.length})</button>
          <button type="button" onClick={() => setActiveTab('merge')} className={`px-3 py-2 rounded-xl font-bold transition-all text-[10px] ${activeTab === 'merge' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700'}`}>🔗 ادغام لید</button>
        </div>

        <div className="flex-1 flex flex-col">
          {activeTab === 'profile' && (
            <ProfileTab 
              selectedLead={selectedLead} setSelectedLead={setSelectedLead} isEditing={isEditing} setIsEditing={setIsEditing}
              departments={departments} agents={agents} personasList={personasList} sourceOptions={sourceOptions} 
              onUpdate={handlePersistLeadUpdate} // 🎯 پاس دادن ارجاع متد فچ‌کننده فیکس شده فرانت
              handleRecalculateScore={handleRecalculateScore} scoringLoading={scoringLoading} isConverting={isConverting} handleConvertToOfficialClient={handleConvertToOfficialClient}
            />
          )}

          {activeTab === 'chat' && (
            <ChatTab chatHistory={chatHistory} leadId={selectedLead.id} BACKEND_BASE_URL={BACKEND_BASE_URL} onRefresh={() => fetchLeadSubData(selectedLead.id)} />
          )}

          {activeTab === 'reminders' && (
            <RemindersTab leadReminders={leadReminders} newReminder={newReminder} setNewReminder={setNewReminder} handleAddReminder={handleAddReminder} />
          )}

          {activeTab === 'tasks' && (
            <TasksTab leadTasks={leadTasks} newTask={newTask} setNewTask={setNewTask} agents={agents} handleAddTask={handleAddTask} />
          )}

          {activeTab === 'calls' && (
            <CallsTab leadCallLogs={leadCallLogs} callsLoading={callsLoading} refreshCallLogs={refreshCallLogs} />
          )}

          {activeTab === 'merge' && (
            <div className="bg-rose-50/50 dark:bg-slate-950 p-5 rounded-2xl border border-rose-100 space-y-4">
              <input type="number" placeholder="آیدی لید اصلی..." className="p-2.5 border rounded-xl bg-white dark:bg-slate-900 text-center font-mono text-xs w-full text-slate-800 dark:text-white" value={masterLeadId} onChange={e => setMasterLeadId(e.target.value)} />
              <button type="button" onClick={handleMergeLeads} className="bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold w-full cursor-pointer">🔗 ادغام پرونده اتمیک</button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}