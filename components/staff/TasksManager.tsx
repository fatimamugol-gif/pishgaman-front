// components/staff/TasksManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { staffService } from '@/services/staffService';

interface ClientOption { id: number; name: string; phone: string; }

export default function TasksManager() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [archiveTasks, setArchiveTasks] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState<boolean>(true);

  const [activeDetailTask, setActiveDetailTask] = useState<any | null>(null);
  const [staffCommentInput, setStaffCommentInput] = useState<string>('');

  // استیت‌های فرم وظیفه
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<string>('medium');
  const [hasReminder, setHasReminder] = useState<boolean>(false);
  const [reminderDateTime, setReminderDateTime] = useState<string>('');

  // 👑 استیت‌های ماژول مستقل مدیریت اسناد عمومی
  const [globalDocs, setGlobalDocs] = useState<any[]>([]);
  const [newDocTitle, setNewDocTitle] = useState<string>('');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [assignTargetClients, setAssignTargetClients] = useState<Record<number, string>>({});
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { loadOfficialClients(); loadTasksHistory(); loadGlobalDocs(); }, []);

  const loadOfficialClients = async () => {
    try {
      setLoadingClients(true);
      const data = await staffService.getOfficialClients();
      setClients(data);
    } catch (err) { console.error(err); } finally { setLoadingClients(false); }
  };

  const loadTasksHistory = async () => {
    try {
      const archive = await staffService.getClientTasksArchive();
      setArchiveTasks(archive);
      if (activeDetailTask) {
        const updated = archive.find((t: any) => t.id === activeDetailTask.id);
        if (updated) setActiveDetailTask(updated);
      }
    } catch (err) { console.error(err); }
  };

  // واکشی لیست اسناد مرکزی
  const loadGlobalDocs = async () => {
    try {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
      const token = localStorage.getItem('token');
      const res = await fetch(`http://${currentHost}:8000/api/staff/global-docs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setGlobalDocs(json.data || []);
      }
    } catch (e) { console.error(e); }
  };

  // آپلود فایل جدید در مخزن عمومی (مجهز به گارد ضد ۴۲۲ لاراول)
  const handleUploadGlobalDoc = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newDocTitle.trim()) return alert('لطفاً عنوان سند را وارد کنید رفیق.');
    if (!newDocFile) return alert('لطفاً ابتدا فایل سند را انتخاب کنید.');

    try {
      setUploadingDoc(true);
      const token = localStorage.getItem('token');
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';

      const formData = new FormData();
      formData.append('title', newDocTitle.trim());
      // 🎯 ارسال فایل خالص مطمئن
      formData.append('file', newDocFile);

      const res = await fetch(`http://${currentHost}:8000/api/staff/global-docs/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json' // 👈 حتماً بگو اکسبت لاراول جیسون باشد تا جزئیات خطا لو برود
        },
        body: formData
      });

      const json = await res.json();

      if (res.ok) {
        alert('✓ سند با موفقیت در مخزن عمومی ذخیره شد.');
        setNewDocTitle('');
        setNewDocFile(null);
        loadGlobalDocs();
      } else {
        // 🚨 اگر باز هم ۴۲۲ داد، پیغام دقیق ولیدیشن لاراول را در آلرت چاپ کن
        alert(`⚠️ خطای ولیدیشن بک‌آند: ${json.message || 'فرمت یا حجم فایل مجاز نیست.'}`);
      }
    } catch (e) {
      console.error(e);
      alert('خطا در اتصال به سرور مخزن اسناد');
    } finally {
      setUploadingDoc(false);
    }
  };

  // تخصیص سند به کلاینت انتخابی و صدور اتوماتیک کارت تسک تایید (رفع باگ ۴۲۲)
  const handleAssignDocToClient = async (docId: number) => {
    const targetClientId = assignTargetClients[docId];
    if (!targetClientId) return alert('لطفاً ابتدا کلاینت مورد نظر را انتخاب کنید رفیق.');
    
    try {
      const token = localStorage.getItem('token');
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
      
      // 🎯 فیکس نهایی: ارسال دیتای کلاینت و سند به صورت JSON به بک‌آند
      const res = await fetch(`http://${currentHost}:8000/api/staff/global-docs/assign`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          global_doc_id: docId, 
          lead_id: parseInt(targetClientId) 
        })
      });

      const json = await res.json();

      if (res.ok) {
        alert('🎯 کارت وظیفه تایید مشروط سند با موفقیت برای کلاینت ابلاغ و صادر شد!');
        loadTasksHistory();
      } else {
        alert(`⚠️ خطای بک‌آند: ${json.message || 'مشکلی در ابلاغ سند پیش آمد.'}`);
      }
    } catch (e) { 
      console.error(e); 
      alert('خطا در اتصال به سرور جهت ابلاغ سند');
    }
  };

  const handleLoadEditTask = (task: any) => {
    setEditingTaskId(task.id);
    setSelectedLeadId(task.lead_id.toString());
    setTitle(task.task_title);
    setDescription(task.description || '');
    setStartDate(task.start_date_shamsi || '');
    setDueDate(task.due_date_shamsi || '');
    setPriority(task.priority);
    setHasReminder(task.has_reminder === 1);
    if (task.reminder_timestamp) {
      const d = new Date(task.reminder_timestamp * 1000);
      setReminderDateTime(d.toISOString().slice(0, 16));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendStaffComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDetailTask || !staffCommentInput.trim()) return;
    try {
      const res = await staffService.sendTaskCommentFromStaff(activeDetailTask.id, staffCommentInput);
      if (res.status === 'success') {
        setStaffCommentInput('');
        loadTasksHistory();
      }
    } catch (err) { console.error(err); }
  };

  // حذف فیزیکی کارت وظیفه ایجاد شده اشتباه
  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('رفیق جان، آیا از حذف کامل این کارت وظیفه اطمینان داری؟')) return;
    try {
      const response = await staffService.deleteClientTask(taskId);
      if (response.status === 'success' || response.message) {
        alert('✓ وظیفه صادر شده با موفقیت حذف و از کارتابل کلاینت پاک شد.');
        loadTasksHistory();
      }
    } catch (error) {
      console.error(error);
      alert('خطا در حذف وظیفه');
    }
  };

  // ویرایش سریع عنوان و توضیحات کارت تسک کلاینت
  const handleUpdateTaskTitleOrDesc = async (taskId: number, currentTitle: string, currentDesc: string) => {
    const newTitle = window.prompt('عنوان جدید وظیفه را وارد کنید:', currentTitle);
    if (newTitle === null) return;

    const newDesc = window.prompt('شرح و توضیحات جدید را وارد کنید:', currentDesc);
    if (newDesc === null) return;

    try {
      const response = await staffService.updateTaskFields(taskId, {
        task_title: newTitle,
        description: newDesc
      });

      if (response.status === 'success' || response.message) {
        alert('✓ کارت وظیفه با موفقیت ویرایش و اصلاح شد.');
        loadTasksHistory();
      }
    } catch (error) {
      console.error(error);
      alert('خطا در به‌روزرسانی فیلدهای تسک');
    }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !title.trim() || !dueDate) {
      setMessage({ type: 'error', text: 'تکمیل فیلدهای ستاره‌دار الزامی است.' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);

      let timestampValue = null;
      if (hasReminder && reminderDateTime) {
        timestampValue = Math.floor(new Date(reminderDateTime).getTime() / 1000);
      }

      const payload = {
        lead_id: selectedLeadId,
        task_title: title,
        description: description,
        start_date_shamsi: startDate,
        due_date_shamsi: dueDate,
        priority: priority,
        has_reminder: hasReminder ? 1 : 0,
        reminder_timestamp: timestampValue
      };

      if (editingTaskId) {
        await staffService.updateTaskFields(editingTaskId, payload);
        setMessage({ type: 'success', text: '✓ کارت وظیفه با موفقیت ویرایش و مچ شد.' });
        setEditingTaskId(null);
      } else {
        const formData = new FormData();
        Object.entries(payload).forEach(([k, v]) => formData.append(k, v ? v.toString() : ''));
        await staffService.createClientTask(formData);
        setMessage({ type: 'success', text: '🎯 کارت ترلو جدید با موفقیت ابلاغ شد!' });
      }

      setTitle(''); setDescription(''); setDueDate(''); setStartDate(''); setReminderDateTime(''); setHasReminder(false); setSelectedLeadId('');
      loadTasksHistory();
    } catch (error) { setMessage({ type: 'error', text: 'خطا در عملیات.' }); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 text-right font-sans text-[11px] animate-fadeIn" dir="rtl">

      {/* 📥 ردیف اول دشبورد تسک‌ها */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* فرم ثبت/ویرایش کارت وظیفه */}
        <div className="lg:col-span-1 bg-white rounded-[24px] border p-5 h-fit space-y-4 shadow-2xs">
          <h2 className="text-xs font-black text-slate-800 border-b pb-2">{editingTaskId ? '📝 ویرایش کارت ترلو کلاینت' : '📤 صدور کارت وظیفه ترلو کلاینت'}</h2>
          {message && <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 font-bold">{message.text}</div>}
          <form onSubmit={handleSubmitTask} className="space-y-3">
            <select value={selectedLeadId} onChange={(e) => setSelectedLeadId(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl font-bold outline-none">
              <option value="">-- انتخاب کلاینت طرف قرارداد --</option>
              {clients.map(l => <option key={l.id} value={l.id}>💎 {l.name}</option>)}
            </select>

            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان اقدام کارت..." className="w-full p-2 bg-slate-50 border rounded-xl font-bold" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="شرح نیازمندی‌ها..." rows={3} className="w-full p-2 bg-slate-50 border rounded-xl leading-relaxed" />

            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="تاریخ شروع (شمسی)" className="w-full p-2 bg-slate-50 border rounded-xl text-center font-bold" />
              <input type="text" value={dueDate} onChange={(e) => setDueDate(e.target.value)} placeholder="مهلت / ددلاین (شمسی) *" className="w-full p-2 bg-slate-50 border rounded-xl text-center font-bold" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl font-bold">
                <option value="low">🟢 کم (Low)</option>
                <option value="medium">🟡 متوسط (Medium)</option>
                <option value="high">🔴 فوری (High)</option>
              </select>
              <label className="flex items-center gap-1.5 font-bold cursor-pointer select-none">
                <input type="checkbox" checked={hasReminder} onChange={(e) => setHasReminder(e.target.checked)} /> ⏰ یادآور هوشمند
              </label>
            </div>

            {hasReminder && (
              <div className="animate-fadeIn space-y-1">
                <label className="block text-slate-400 text-[9px] font-bold">⏰ انتخاب تاریخ و ساعت زنگ هشدار:</label>
                <input type="datetime-local" value={reminderDateTime} onChange={(e) => setReminderDateTime(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl font-mono font-bold" />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={submitting} className="flex-1 bg-slate-900 text-white font-black py-2 rounded-xl text-xs hover:bg-slate-800">{submitting ? '⏳ پردازش...' : editingTaskId ? '✓ ذخیره تغییرات' : '🚀 صدور کارت'}</button>
              {editingTaskId && <button type="button" onClick={() => { setEditingTaskId(null); setTitle(''); setDescription(''); setDueDate(''); setSelectedLeadId(''); }} className="bg-slate-200 text-slate-700 px-3 rounded-xl">انصراف</button>}
            </div>
          </form>
        </div>

        {/* بورد آرشیو و بازرس کارت فعال */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-[24px] border p-5 shadow-2xs space-y-3">
            <h2 className="text-xs font-black text-slate-800 border-b pb-2">📋 کارتابل و بورد پیگیری وظایف کلاینت‌ها</h2>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {archiveTasks.map((task: any) => (
                <div key={task.id} className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center hover:border-slate-300 transition-all">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">
                      {task.global_doc_id ? '🔏 ابلاغیه سند: ' : '📋 '} {task.task_title}
                    </h4>
                    <div className="flex flex-wrap gap-3 text-[9px] text-slate-400 mt-1 font-bold">
                      <span>👤 کلاینت: {task.lead_name}</span>
                      <span>📅 مهلت: {task.due_date_shamsi}</span>
                      <span className={task.status === 'done' ? 'text-emerald-600' : 'text-amber-500'}>📦 وضعیت: {task.status === 'done' ? '✓ تحویل شده' : 'در انتظار اقدام'}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <button onClick={() => setActiveDetailTask(task)} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded-lg font-black transition-all">👁️ پایش</button>
                    <button onClick={() => handleLoadEditTask(task)} className="bg-amber-50 text-amber-600 hover:bg-amber-100 px-2 py-1 rounded-lg font-black transition-all">⚙️ ادیت کامل</button>
                    <button onClick={() => handleUpdateTaskTitleOrDesc(task.id, task.task_title, task.description)} className="bg-amber-500 text-white hover:bg-amber-600 px-2 py-1 rounded-lg text-[10px] font-black transition-all">📝 ویرایش سریع متن</button>
                    <button onClick={() => handleDeleteTask(task.id)} className="bg-rose-600 text-white hover:bg-rose-700 px-2 py-1 rounded-lg text-[10px] font-black transition-all">🗑️ حذف</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* بازرس کارت ترلو کارشناس */}
          {activeDetailTask && (
            <div className="bg-white p-5 rounded-[24px] border border-indigo-100 shadow-xs animate-fadeIn space-y-4">
              <div className="border-b pb-2 flex justify-between items-center bg-indigo-50/40 p-3 rounded-xl">
                <h3 className="font-black text-xs text-indigo-950">🔍 بازرس کارت ترلو: {activeDetailTask.task_title}</h3>
                <button onClick={() => setActiveDetailTask(null)} className="text-slate-400 text-xs font-bold cursor-pointer">✖ بستن</button>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-xs font-medium leading-relaxed">
                <strong className="block text-[10px] font-black text-slate-700 mb-1">📝 شرح وظیفه:</strong>
                {activeDetailTask.description || 'توضیحات تکمیلی ثبت نشده است.'}
              </div>

              {/* کامنت‌گذاری مشاور درون بازرس تسک */}
              <div className="space-y-2 border-t pt-3">
                <span className="block font-black text-slate-700 text-[10px]">💬 رشته گفتگو و پیام‌های اختصاصی این کارت ({activeDetailTask.comments?.length || 0})</span>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto bg-slate-50/30 p-2 rounded-xl">
                  {activeDetailTask.comments?.map((c: any, idx: number) => (
                    <div key={idx} className="p-2 bg-white rounded-lg border text-[10px] flex justify-between font-bold">
                      <span><strong className="text-indigo-600">{c.sender_name}:</strong> {c.comment}</span>
                      <span className="text-slate-400 font-mono text-[9px]">{new Date(c.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendStaffComment} className="flex gap-2 pt-1">
                  <input type="text" value={staffCommentInput} onChange={(e) => setStaffCommentInput(e.target.value)} placeholder="پاسخ یا یادداشتی روی این کارت بنویسید..." className="flex-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs outline-none" />
                  <button type="submit" className="bg-indigo-600 text-white font-black px-4 rounded-xl text-xs hover:bg-indigo-700">ثبت کامنت</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 👑 ردیف دوم: مخزن اسناد مرکزی و ابزار ابلاغ اسناد مشروط */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 border-t pt-6">

        {/* سمت راست: فرم آپلود ۱ بار فایل عمومی */}
        <div className="lg:col-span-1 bg-white rounded-[24px] border p-5 h-fit space-y-4 shadow-2xs">
          <h3 className="text-xs font-black text-slate-800 border-b pb-2">📥 مخزن اسناد عمومی (آپلود یکباره سند)</h3>
          <form onSubmit={handleUploadGlobalDoc} className="space-y-3">
            <div>
              <label className="block text-slate-400 text-[9px] mb-1 font-bold">عنوان سند یا قرارداد رسمی:</label>
              <input
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="مثال: آیین‌نامه اجرایی سفارت آلمان ۲۰۲۶"
                className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[9px] mb-1 font-bold">انتخاب فایل اصلی:</label>
              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setNewDocFile(e.target.files[0]); // 🎯 ذخیره فایل اول کلیک شده
                  }
                }}
                className="w-full p-1 bg-slate-50 border rounded-xl text-[10px] cursor-pointer"
              />
            </div>
            <button
              type="submit"
              disabled={uploadingDoc}
              className="w-full bg-slate-900 text-white font-black py-2 rounded-xl text-xs hover:bg-slate-800"
            >
              {uploadingDoc ? '⏳ در حال ذخیره‌سازی...' : '📁 ذخیره در مخزن مرکزی'}
            </button>
          </form>
        </div>

        {/* سمت چپ (طول ۲): نمایش آرشیو اسناد عمومی مخزن + ابزار تخصیص به کلاینت‌ها و صدور تسک تایید مشروط */}
        <div className="lg:col-span-2 bg-white rounded-[24px] border p-5 shadow-2xs space-y-3">
          <h3 className="text-xs font-black text-slate-800 border-b pb-2">📁 مرکز توزیع اسناد و صدور وظایف تایید مشروط کلاینت</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {globalDocs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-bold">مخزن مرکزی اسناد خالی است.</div>
            ) : (
              globalDocs.map((doc) => (
                <div key={doc.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-slate-200 transition-all">
                  <div>
                    <h4 className="font-black text-slate-900 text-xs">📄 {doc.title}</h4>
                    <span className="text-[9px] text-slate-400 font-mono block mt-0.5">ثبت شده در: {new Date(doc.created_at).toLocaleDateString('fa-IR')}</span>
                  </div>

                  {/* ابزار داینامیک تخصیص به کلاینت برای ایجاد اتوماتیک تسک تایید مشروط */}
                  <div className="flex gap-2 w-full sm:w-auto items-center justify-end">
                    <select
                      value={assignTargetClients[doc.id] || ''}
                      onChange={(e) => setAssignTargetClients(prev => ({ ...prev, [doc.id]: e.target.value }))}
                      className="p-1.5 bg-white border rounded-xl text-[10px] font-bold outline-none"
                    >
                      <option value="">-- انتخاب کلاینت مقصد --</option>
                      {clients.map(c => <option key={c.id} value={c.id}>💎 {c.name}</option>)}
                    </select>
                    <button
                      onClick={() => handleAssignDocToClient(doc.id)}
                      className="bg-indigo-600 text-white font-black text-[9px] px-3 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-sm shrink-0 cursor-pointer"
                    >
                      🚀 ابلاغ و صدور تسک تایید
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}