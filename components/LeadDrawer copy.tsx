'use client';

import React, { useState, useEffect } from 'react';

interface LeadDrawerProps {
  lead: any;
  onClose: () => void;
  onUpdate: (updatedLead: any) => Promise<void>;
}

export default function LeadDrawer({ lead, onClose, onUpdate }: LeadDrawerProps) {
  const [selectedLead, setSelectedLead] = useState<any>({ ...lead });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'chat' | 'reminders' | 'tasks' | 'merge'>('profile');
  
  const [leadReminders, setLeadReminders] = useState<any[]>([]);
  const [leadTasks, setLeadTasks] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  
  const [masterLeadId, setMasterLeadId] = useState('');
  const [newReminder, setNewReminder] = useState({ title: '', description: '', date: '', time: '09:00' });
  const [newTask, setNewTask] = useState<any>({ title: '', date: '', has_reminder: false, reminder_date: '', reminder_time: '09:00', channels: ['in_app'], assigned_agent_id: '' });
  const [loading, setLoading] = useState(true);

  // 🎯 استخراج اتوماتیک آی‌پی/دامنه‌ای که در حال حاضر کاربر با آن وصل شده (حل قطعی باگ پابلیک آی‌پی شبکه)
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  const BACKEND_BASE_URL = `http://${currentHost}:8000`; 

  const fetchLeadSubData = async (leadId: number) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };
    
    try {
      // ۱. واکشی یادآورها با آدرس تصحیح‌شده شبکه
      const remRes = await fetch(`${BACKEND_BASE_URL}/api/next/leads/${leadId}/reminders`, { headers: authHeaders });
      if (remRes.ok) {
        const remData = await remRes.json();
        if (remData.status === 'success') setLeadReminders(remData.data || []);
      }

      // ۲. واکشی وظایف با آدرس تصحیح‌شده شبکه
      const taskRes = await fetch(`${BACKEND_BASE_URL}/api/next/leads/${leadId}/tasks`, { headers: authHeaders });
      if (taskRes.ok) {
        const taskData = await taskRes.json();
        if (taskData.status === 'success') setLeadTasks(taskData.data || []);
      }

      // ۳. واکشی شناسنامه ۳۶۰ درجه و تاریخچه کانتکست RAG
      const detailRes = await fetch(`${BACKEND_BASE_URL}/api/next/leads/detail/${leadId}`, { headers: authHeaders });
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        if (detailData.status === 'success') {
          setSelectedLead(detailData.data);
          setChatHistory(detailData.data.chat_history || []);
        }
      }
    } catch (err) {
      console.error("🚨 [FETCH ERROR IN DRAWER]:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsEditing(false);
    if (lead?.id) {
      fetchLeadSubData(lead.id);
    }
  }, [lead]);

  // 🎯 موتور تبدیل اتوماتیک میلادی دیتابیس به شمسی لوکس
const convertToShamsi = (isoDateString: string) => {
  if (!isoDateString) return '---';
  try {
    const date = new Date(isoDateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch (e) {
    return isoDateString; // اگر قالب از قبل شمسی بود خودش را برگردان
  }
};

  const handleAddReminder = async () => {
    const token = localStorage.getItem('token');
    const channels = (selectedLead.notification_channels) ? JSON.parse(selectedLead.notification_channels) : ['in_app'];
    await fetch(`${BACKEND_BASE_URL}/api/next/reminders/store`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        lead_id: selectedLead.id,
        title: newReminder.title,
        description: newReminder.description,
        reminder_date_shamsi: newReminder.date,
        reminder_time: newReminder.time,
        notification_channels: channels
      })
    });
    alert('یادآور چندکاناله ثبت شد.');
    setNewReminder({ title: '', description: '', date: '', time: '09:00' });
    fetchLeadSubData(selectedLead.id);
  };

  const handleAddTask = async () => {
    if (!newTask.title) return alert('عنوان وظیفه را وارد کنید.');
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/next/tasks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          task_title: newTask.title,
          due_date_shamsi: newTask.date,
          has_reminder: newTask.has_reminder ? 1 : 0, 
          reminder_date_shamsi: newTask.reminder_date,
          reminder_time: newTask.reminder_time || '09:00',
          notification_channels: newTask.channels || ['in_app'],
          assigned_agent_id: newTask.assigned_agent_id
        }),
      });

      if (response.ok) {
        alert('وظیفه تیمی با موفقیت مستقر شد.');
        setNewTask({ title: '', date: '', has_reminder: false, reminder_date: '', reminder_time: '09:00', channels: ['in_app'], assigned_agent_id: '' });
        fetchLeadSubData(selectedLead.id);
      }
    } catch (error) { console.error(error); }
  };

  const handleMergeLeads = async () => {
    if (!masterLeadId) return alert('لطفاً آیدی پرونده اصلی را وارد کنید.');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/next/leads/merge`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ target_lead_id: selectedLead.id, master_lead_id: parseInt(masterLeadId) })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert(data.message);
        onClose();
      } else {
        alert('خطا در ادغام: ' + data.message);
      }
    } catch (error) { console.error(error); }
  };

  if (loading || !selectedLead) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-start">
        <div className="bg-white w-full max-w-2xl h-full flex items-center justify-center p-6 border-r text-xs">
          <div className="text-center font-bold text-slate-500 animate-pulse">⏳ در حال بازخوانی پرونده و کانتکست هوش مصنوعی...</div>
        </div>
      </div>
    );
  }

//   return (
//     <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-start animate-fadeIn" dir="rtl">
//       <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col p-6 overflow-y-auto border-r text-[11px]">
        
//         {/* هدر دراور */}
//         <div className="flex justify-between items-center border-b pb-3 mb-4">
//           <div>
//             <h2 className="text-base font-black text-slate-800">👤 شناسنامه جامع و ۳۶۰ درجه متقاضی</h2>
//             <p className="text-xs text-indigo-600 font-bold mt-0.5">{selectedLead.name} ({selectedLead.phone})</p>
//           </div>
//           <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg cursor-pointer">×</button>
//         </div>

//         {/* سوئیچ تب‌ها */}
//         <div className="flex flex-wrap gap-1.5 border-b pb-3 mb-4 select-none">
//           <button onClick={() => setActiveTab('profile')} className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600'}`}>👤 شناسنامه و وضعیت تاهل</button>
//           <button onClick={() => setActiveTab('chat')} className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600'}`}>💬 تاریخچه مکالمات ({chatHistory.length})</button>
//           <button onClick={() => setActiveTab('reminders')} className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'reminders' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600'}`}>🔔 یادآورها ({leadReminders.length})</button>
//           <button onClick={() => setActiveTab('tasks')} className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600'}`}>✅ وظایف ({leadTasks.length})</button>
//           <button onClick={() => setActiveTab('merge')} className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'merge' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700'}`}>🔗 ادغام لید</button>
//         </div>

//         {/* محتوای تب‌ها */}
//         <div className="flex-1 flex flex-col">
//           {activeTab === 'profile' && (
//             <div className="space-y-4 pb-10">
              
//               {/* ویجت تحلیل هوش مصنوعی اختصاصی پیشگامان */}
//               <div className="p-4 border border-purple-100 bg-purple-50/40 rounded-2xl space-y-1.5">
//                 <h3 className="text-xs font-black text-purple-700">🧠 خلاصه کانتکست و پیشنهاد هوش مصنوعی (RAG)</h3>
//                 <p className="text-slate-700"><strong>🎯 مقصد پیشنهادی کور:</strong> {selectedLead.ai_insights?.destination}</p>
//                 <p className="text-slate-700"><strong>✈️ نوع اقدام استخراج شده:</strong> {selectedLead.ai_insights?.intent}</p>
//                 <p className="text-slate-500 leading-relaxed bg-white p-2 rounded-lg border border-purple-50 mt-1"><strong>💡 نقشه راه ادمین:</strong> {selectedLead.ai_insights?.summary}</p>
//               </div>

//               {isEditing ? (
//                 /* ================= پنل کامل ویرایش اطلاعات (Editor Mode) ================= */
//                 <div className="space-y-4">
                  
//                   {/* بخش اول: اطلاعات فردی */}
//                   <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
//                     <h4 className="font-bold text-indigo-600 border-b pb-1">📞 هویت و اطلاعات ارتباطی</h4>
//                     <div className="grid grid-cols-2 gap-3">
//                       <label className="flex flex-col gap-1">نام و نام خانوادگی:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.name || ''} onChange={e => setSelectedLead({ ...selectedLead, name: e.target.value })} /></label>
//                       <label className="flex flex-col gap-1">تلفن همراه اول:<input type="text" className="p-2 border rounded-lg text-left font-mono" value={selectedLead.phone || ''} onChange={e => setSelectedLead({ ...selectedLead, phone: e.target.value })} /></label>
//                       <label className="flex flex-col gap-1">تلفن همراه دوم:<input type="text" className="p-2 border rounded-lg text-left font-mono" value={selectedLead.secondary_phone || ''} onChange={e => setSelectedLead({ ...selectedLead, secondary_phone: e.target.value })} /></label>
//                       <label className="flex flex-col gap-1">شهر محل سکونت:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.current_city || ''} onChange={e => setSelectedLead({ ...selectedLead, current_city: e.target.value })} /></label>
//                       <label className="flex flex-col gap-1">سن متقاضی:<input type="number" className="p-2 border rounded-lg text-center" value={selectedLead.age || ''} onChange={e => setSelectedLead({ ...selectedLead, age: e.target.value })} /></label>
//                       <label className="flex flex-col gap-1">وضعیت نظام وظیفه:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.military_status || ''} onChange={e => setSelectedLead({ ...selectedLead, military_status: e.target.value })} /></label>
//                     </div>
//                   </div>

//                   {/* بخش دوم: وضعیت تاهل و همسر */}
//                   <div className="bg-pink-50/30 p-4 rounded-xl border border-pink-100 space-y-3">
//                     <h4 className="font-bold text-pink-700 border-b pb-1">💍 وضعیت تاهل، همسر و فرزندان</h4>
//                     <div className="grid grid-cols-2 gap-3">
//                       <label className="flex flex-col gap-1">وضعیت تاهل:
//                         <select className="p-2 border rounded-lg bg-white font-bold text-slate-700" value={selectedLead.marital_status || 'single'} onChange={e => setSelectedLead({ ...selectedLead, marital_status: e.target.value })}>
//                           <option value="single">مجرد</option>
//                           <option value="married">متاهل</option>
//                           <option value="divorced">مطلقه / فوت همسر</option>
//                         </select>
//                       </label>
//                       <label className="flex flex-col gap-1">تعداد فرزندان:<input type="number" className="p-2 border rounded-lg text-center" value={selectedLead.children_count || '0'} onChange={e => setSelectedLead({ ...selectedLead, children_count: e.target.value })} /></label>
//                     </div>

//                     <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-pink-100">
//                       <label className="flex flex-col gap-1">نام و فامیل همسر:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.spouse_name || ''} onChange={e => setSelectedLead({ ...selectedLead, spouse_name: e.target.value })} /></label>
//                       <label className="flex flex-col gap-1">سن همسر:<input type="number" className="p-2 border rounded-lg text-center" value={selectedLead.spouse_age || ''} onChange={e => setSelectedLead({ ...selectedLead, spouse_age: e.target.value })} /></label>
//                       <label className="flex flex-col gap-1">تحصیلات همسر:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.spouse_education || ''} onChange={e => setSelectedLead({ ...selectedLead, spouse_education: e.target.value })} /></label>
//                       <label className="flex flex-col gap-1">سطح زبان همسر:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.spouse_language_level || ''} onChange={e => setSelectedLead({ ...selectedLead, spouse_language_level: e.target.value })} /></label>
//                       <label className="flex flex-col gap-1 col-span-2">سابقه کار همسر:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.spouse_work_history || ''} onChange={e => setSelectedLead({ ...selectedLead, spouse_work_history: e.target.value })} /></label>
//                       <label className="flex flex-col gap-1 col-span-2">آیا همسر متقاضی همراه سفر است؟
//                         <select className="p-2 border rounded-lg bg-white font-medium text-slate-700" value={selectedLead.spouse_accompanying || 'yes'} onChange={e => setSelectedLead({ ...selectedLead, spouse_accompanying: e.target.value })}>
//                           <option value="yes">بله، به عنوان همراه پرونده مهاجرت می‌کند</option>
//                           <option value="no">خیر، در حال حاضر قصد همراهی ندارد</option>
//                         </select>
//                       </label>
//                     </div>
//                   </div>

//                   {/* بخش سوم: تحصیلات */}
//                   <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
//                     <h4 className="font-bold text-emerald-600 border-b pb-1">🎓 تحصیلات و سوابق آکادمیک</h4>
//                     <div className="grid grid-cols-2 gap-3">
//                       <label className="flex flex-col gap-1">آخرین مدرک تحصیلی:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.education_level || ''} onChange={e => setSelectedLead({ ...selectedLead, education_level: e.target.value })} /></label>
//                       <label className="flex flex-col gap-1">رشته تحصیلی:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.field_of_study || ''} onChange={e => setSelectedLead({ ...selectedLead, field_of_study: e.target.value })} /></label>
//                       <label className="flex flex-col gap-1">معدل کل (GPA):<input type="text" className="p-2 border rounded-lg text-center font-mono" value={selectedLead.gpa || ''} onChange={e => setSelectedLead({ ...selectedLead, gpa: e.target.value })} /></label>
//                       <label className="flex flex-col gap-1">سابقه کار و بیمه:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.work_and_insurance_history || ''} onChange={e => setSelectedLead({ ...selectedLead, work_and_insurance_history: e.target.value })} /></label>
//                     </div>
//                   </div>

//                   {/* بخش چهارم: زبان */}
//                   <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
//                     <h4 className="font-bold text-amber-600 border-b pb-1">🗣️ سطوح و مدارک زبان متقاضی اصلی</h4>
//                     <div className="grid grid-cols-2 gap-3">
//                       <label className="flex flex-col gap-1">انگلیسی عمومی:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.english_level || ''} onChange={e => setSelectedLead({ ...selectedLead, english_level: e.target.value })} /></label>
//                       <label className="flex flex-col gap-1">مدرک انگلیسی:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.english_certified_level || ''} onChange={e => setSelectedLead({ ...selectedLead, english_certified_level: e.target.value })} /></label>
//                       <label className="flex flex-col gap-1">زبان آلمانی:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.german_level || ''} onChange={e => setSelectedLead({ ...selectedLead, german_level: e.target.value })} /></label>
//                       <label className="flex flex-col gap-1">مدرک آلمانی:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.german_certified_level || ''} onChange={e => setSelectedLead({ ...selectedLead, german_certified_level: e.target.value })} /></label>
//                     </div>
//                   </div>

//                   {/* بخش پنجم: مالی و مقصد */}
//                   <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
//                     <h4 className="font-bold text-cyan-600 border-b pb-1">✈️ اهداف مهاجرتی و مالی</h4>
//                     <div className="grid grid-cols-2 gap-3">
//                       <label className="flex flex-col gap-1">کشور مقصد هدف:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.target_country || ''} onChange={e => setSelectedLead({ ...selectedLead, target_country: e.target.value })} /></label>
//                       <label className="flex flex-col gap-1">پلن مهاجرتی درخواست شده:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.requested_plan || ''} onChange={e => setSelectedLead({ ...selectedLead, requested_plan: e.target.value })} /></label>
//                       <label className="flex flex-col gap-1">تمکن مالی (تومان):<input type="number" className="p-2 border rounded-lg bg-white font-mono" value={selectedLead.financial_capability_toman || ''} onChange={e => setSelectedLead({ ...selectedLead, financial_capability_toman: e.target.value })} /></label>
//                       <label className="flex flex-col gap-1">کانال کشف مجموعه:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.discovery_channel || ''} onChange={e => setSelectedLead({ ...selectedLead, discovery_channel: e.target.value })} /></label>
//                     </div>
//                   </div>

//                   <button onClick={() => onUpdate(selectedLead).then(() => setIsEditing(false))} className="w-full bg-emerald-600 text-white p-3 rounded-xl font-bold shadow-md cursor-pointer hover:bg-emerald-700 transition-all">💾 ذخیره کل تغییرات چهل‌گانه شناسنامه</button>
//                 </div>
//               ) : (
//                 /* ================= پنل نمایش لوکس چهل‌گانه (Read-Only View) ================= */
//                 <div className="space-y-4">
                  
//                   {/* کارت اطلاعات عمومی */}
//                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
//                     <h4 className="font-bold text-indigo-600 border-b pb-1">👤 اطلاعات فردی و ارتباطی کلاینت</h4>
//                     <div className="grid grid-cols-2 gap-2 text-slate-600">
//                       <div>📌 <strong>نام متقاضی:</strong> <span className="text-slate-800 font-bold">{selectedLead.name}</span></div>
//                       <div>📱 <strong>تلفن همراه اصلی:</strong> <span className="font-mono text-slate-800 font-bold">{selectedLead.phone}</span></div>
//                       <div>📞 <strong>تلفن همراه دوم:</strong> <span className="font-mono">{selectedLead.secondary_phone || 'ثبت نشده'}</span></div>
//                       <div>📍 <strong>شهر سکونت:</strong> <span className="text-slate-700">{selectedLead.current_city || '---'}</span></div>
//                       <div>🎂 <strong>سن کلاینت:</strong> <span>{selectedLead.age || '---'} سال</span></div>
//                       <div>🪖 <strong>وضعیت نظام وظیفه:</strong> <span>{selectedLead.military_status || '---'}</span></div>
//                     </div>
//                   </div>

//                   {/* کارت ازدواج و همسر */}
//                   <div className="bg-pink-50/40 p-4 rounded-xl border border-pink-100/70 space-y-2">
//                     <h4 className="font-bold text-pink-700 border-b pb-1">💍 وضعیت تاهل و ساختار خانواده کلاینت</h4>
//                     <div className="grid grid-cols-2 gap-2 text-slate-600">
//                       <div>📌 <strong>وضعیت تاهل:</strong> <span className="text-pink-700 font-black">{selectedLead.marital_status === 'married' ? 'متاهل 👨‍👩‍👦' : selectedLead.marital_status === 'divorced' ? 'مطلقه / فوت همسر' : 'مجرد 🧍'}</span></div>
//                       <div>👶 <strong>تعداد فرزندان همراه:</strong> <span className="font-mono font-bold text-slate-800">{selectedLead.children_count || '0'} فرزند</span></div>
//                       {selectedLead.marital_status === 'married' && (
//                         <>
//                           <div>👰 <strong>نام همسر:</strong> <span className="text-slate-800 font-bold">{selectedLead.spouse_name || '---'}</span></div>
//                           <div>🎂 <strong>سن همسر:</strong> <span>{selectedLead.spouse_age || '---'} سال</span></div>
//                           <div>🎓 <strong>تحصیلات همسر:</strong> <span>{selectedLead.spouse_education || '---'}</span></div>
//                           <div>🗣️ <strong>سطح زبان همسر:</strong> <span className="text-indigo-600 font-medium">{selectedLead.spouse_language_level || '---'}</span></div>
//                           <div className="col-span-2">💼 <strong>رزومه شغلی همسر:</strong> <span>{selectedLead.spouse_work_history || '---'}</span></div>
//                           <div className="col-span-2 text-slate-500 font-medium bg-white/70 p-1.5 rounded border border-pink-50">
//                             ✈️ وضعیت همراهی: <span className="text-slate-800 font-bold">{selectedLead.spouse_accompanying === 'no' ? 'خیر، همسر همسفر نیست' : 'بله، همسر در همین کیس پرونده مهاجرت می‌کند'}</span>
//                           </div>
//                         </>
//                       )}
//                     </div>
//                   </div>

//                   {/* کارت تحصیلات و رزومه */}
//                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
//                     <h4 className="font-bold text-emerald-600 border-b pb-1">🎓 آکادمیک، سوابق کاری و رزومه</h4>
//                     <div className="grid grid-cols-2 gap-2 text-slate-600">
//                       <div>🏛️ <strong>آخرین مقطع تحصیلی:</strong> <span className="text-slate-800 font-bold">{selectedLead.education_level || '---'}</span></div>
//                       <div>🔬 <strong>رشته تحصیلی:</strong> <span className="text-slate-800">{selectedLead.field_of_study || '---'}</span></div>
//                       <div>📝 <strong>معدل کل فارغ‌التحصیلی:</strong> <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{selectedLead.gpa || '---'}</span></div>
//                       <div>💼 <strong>رزومه سابقه کار و بیمه:</strong> <span className="text-slate-700">{selectedLead.work_and_insurance_history || '---'}</span></div>
//                     </div>
//                   </div>

//                   {/* کارت شایستگی زبان */}
//                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
//                     <h4 className="font-bold text-amber-600 border-b pb-1">🗣️ سطوح و مدارک زبان متقاضی اصلی</h4>
//                     <div className="grid grid-cols-2 gap-2 text-slate-600">
//                       <div>🇬🇧 <strong>انگلیسی عمومی:</strong> <span>{selectedLead.english_level || '---'}</span></div>
//                       <div>📜 <strong>مدرک رسمی انگلیسی:</strong> <span className="text-indigo-600 font-bold">{selectedLead.english_certified_level || 'ندارد'}</span></div>
//                       <div>🇩🇪 <strong>زبان آلمانی:</strong> <span>{selectedLead.german_level || '---'}</span></div>
//                       <div>📜 <strong>مدرک رسمی آلمانی:</strong> <span className="text-indigo-600 font-bold">{selectedLead.german_certified_level || 'ندارد'}</span></div>
//                     </div>
//                   </div>

//                   {/* کارت اهداف مالی و مقصد */}
//                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
//                     <h4 className="font-bold text-cyan-600 border-b pb-1">✈️ اهداف مهاجرتی، مالی و کانال ورودی</h4>
//                     <div className="grid grid-cols-2 gap-2 text-slate-600">
//                       <div>🌍 <strong>کشور هدف:</strong> <span className="text-slate-800 font-bold">{selectedLead.target_country || '---'}</span></div>
//                       <div>📋 <strong>نوع پلن درخواستی:</strong> <span className="text-indigo-600 font-bold">{selectedLead.requested_plan || '---'}</span></div>
//                       <div>💰 <strong>میزان تمکن مالی:</strong> <span className="text-emerald-600 font-bold font-mono bg-emerald-50/50 px-1.5 py-0.5 rounded">{selectedLead.financial_capability_toman ? `${Number(selectedLead.financial_capability_toman).toLocaleString()} تومان` : '---'}</span></div>
//                       <div>📡 <strong>منبع کانال کشف:</strong> <span className="text-slate-700">{selectedLead.source}</span></div>
//                     </div>
//                   </div>

//                   <button onClick={() => setIsEditing(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-bold transition-all text-center cursor-pointer shadow-xs">✏️ ورود به پنل ادیتور و ویرایش ۳۶۰ درجه کل فیلدها</button>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* 💬 تب تاریخچه مکالمات چندکاناله تیره رنگ - کاملاً تمام‌صفحه و چسبیده به کف */}
//           {activeTab === 'chat' && (
//             <div className="flex-1 flex flex-col bg-slate-950 p-4 rounded-2xl border border-slate-900 text-white min-h-[500px] h-[calc(100vh-230px)] justify-between">
//               <div className="flex-1 overflow-y-auto pr-1 pl-2 space-y-3 mb-3 max-h-[calc(100vh-320px)] scrollbar-thin">
//                 {chatHistory.length === 0 ? (
//                   <div className="text-center text-slate-500 py-10 font-bold">هیچ مکالمه‌ای ثبت نشده است.</div>
//                 ) : (
//                   chatHistory.map((msg) => (
//                     <div key={msg.id} className={`flex flex-col max-w-[85%] p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-600 self-start mr-auto rounded-bl-none' : msg.sender === 'bot' ? 'bg-purple-900 self-end ml-auto rounded-br-none' : 'bg-slate-800 self-end ml-auto rounded-br-none'}`}>
//                       <div className="text-[9px] text-slate-300 font-bold mb-1">
//                         {msg.sender === 'user' ? '👤 متقاضی' : msg.sender === 'bot' ? '🤖 دستیار هوشمند' : '🧑‍💼 کارشناس (من)'}
//                       </div>
//                       <p className="text-xs text-white leading-relaxed">{msg.message}</p>
//                       {/* <span className="text-[8px] text-slate-400 self-end mt-1 font-mono">{msg.date} - {msg.time}</span> */}
//                       <span className="text-[8px] text-slate-400 self-end mt-1 font-mono">
//                         {convertToShamsi(msg.date)} - {msg.time}
// </span>
//                     </div>
//                   ))
//                 )}
//               </div>

//               <div className="border-t border-slate-900/60 pt-3 text-slate-800 bg-slate-950 mt-auto">
//                 <div className="flex gap-2">
//                   <input type="text" placeholder="متن گفتگو یا یادداشت تماس را تایپ کنید..." className="p-2 bg-white rounded-xl text-xs w-full focus:outline-none placeholder-slate-400 font-bold" id="manualMsgInput" />
//                   <select id="manualSenderType" className="p-2 bg-slate-100 rounded-xl text-xs font-black text-slate-700">
//                     <option value="agent">🧑‍💼 کارشناس</option>
//                     <option value="user">👤 متقاضی</option>
//                   </select>
//                   <button 
//                     onClick={async () => {
//                       const msgInput = document.getElementById('manualMsgInput') as HTMLInputElement;
//                       const senderSelect = document.getElementById('manualSenderType') as HTMLSelectElement;
//                       if (!msgInput.value) return alert('متن پیام را وارد کنید.');

//                       const res = await fetch(`${BACKEND_BASE_URL}/api/next/leads/store-chat`, {
//                         method: 'POST',
//                         headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
//                         body: JSON.stringify({ lead_id: selectedLead.id, message: msgInput.value, sender_type: senderSelect.value })
//                       });
//                       if (res.ok) {
//                         msgInput.value = '';
//                         fetchLeadSubData(selectedLead.id);
//                       }
//                     }}
//                     className="bg-indigo-600 text-white px-4 rounded-xl font-bold text-xs cursor-pointer hover:bg-indigo-700 whitespace-nowrap active:scale-95 transition-all"
//                   >
//                     ثبت پیام
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* ⏰ تب یادآورها مجهز به سکوهای ارسال آلارم چندکاناله */}
//           {activeTab === 'reminders' && (
//             <div className="space-y-4 pb-10">
//               <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
//                 <h4 className="font-bold text-slate-700">⏰ تنظیم یادآور پیگیری و کانال‌های مخابراتی</h4>
//                 <div className="grid grid-cols-2 gap-3">
//                   <input type="text" placeholder="موضوع پیگیری" className="p-2 border rounded-lg bg-white" value={newReminder.title} onChange={e => setNewReminder({ ...newReminder, title: e.target.value })} />
//                   <input type="text" placeholder="تاریخ شمسی" className="p-2 border rounded-lg bg-white text-center font-mono" value={convertToShamsi(newReminder.date)} onChange={e => setNewReminder({ ...newReminder, date: e.target.value })} />
//                   <input type="time" className="p-2 border rounded-lg bg-white text-center font-mono" value={newReminder.time} onChange={e => setNewReminder({ ...newReminder, time: e.target.value })} />
//                   <input type="text" placeholder="توضیحات تکمیلی..." className="p-2 border rounded-lg bg-white" value={newReminder.description} onChange={e => setNewReminder({ ...newReminder, description: e.target.value })} />
//                 </div>
//                 <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-2">
//                   <span className="text-[10px] text-slate-400 font-bold block mb-1">📢 پلتفرم‌های مقصد ارسال آلارم:</span>
//                   <div className="flex flex-wrap gap-4 text-slate-700 font-bold">
//                     <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" defaultChecked onChange={(e) => {
//                       let ch = (selectedLead.notification_channels) ? JSON.parse(selectedLead.notification_channels) : ['in_app'];
//                       if(e.target.checked) ch.push('in_app'); else ch = ch.filter((c:any)=>c!=='in_app');
//                       setSelectedLead({...selectedLead, notification_channels: JSON.stringify(ch)});
//                     }}/> پرتال داخلی</label>
//                     <label className="flex items-center gap-1 cursor-pointer text-blue-600"><input type="checkbox" onChange={(e) => {
//                       let ch = ['in_app'];
//                       if(e.target.checked) ch.push('sms');
//                       setSelectedLead({...selectedLead, notification_channels: JSON.stringify(ch)});
//                     }}/> 💬 پیامک کشوری</label>
//                     <label className="flex items-center gap-1 cursor-pointer text-sky-500"><input type="checkbox" onChange={(e) => {
//                       let ch = ['in_app'];
//                       if(e.target.checked) ch.push('telegram');
//                       setSelectedLead({...selectedLead, notification_channels: JSON.stringify(ch)});
//                     }}/> ✈️ تلگرام</label>
//                   </div>
//                 </div>
//                 <button onClick={handleAddReminder} className="w-full bg-indigo-600 text-white p-2.5 rounded-xl font-bold shadow-md cursor-pointer hover:bg-indigo-700 transition-all text-center block">⏰ ثبت ناتیفیکیشن روی سکوها</button>
//               </div>
              
//               <div className="space-y-2">
//                 <h4 className="font-bold text-slate-700">📋 لیست یادآورهای فعال پرونده:</h4>
//                 {leadReminders.map((rem: any) => (
//                   <div key={rem.id} className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center">
//                     <div><strong>{rem.title}</strong> <span className="text-slate-400">({rem.reminder_date_shamsi} {rem.reminder_time})</span></div>
//                     <span className="text-indigo-600 font-bold bg-white px-2 py-0.5 rounded border">{rem.status}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* ✅ تب وظایف تیمی پیشرفته و ارجاع همکاران دپارتمان‌ها */}
//           {activeTab === 'tasks' && (
//             <div className="space-y-4 pb-10">
//               <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
//                 <h4 className="font-bold text-slate-800">➕ تعریف وظیفه و اتوماسیون پیگیری متمرکز دپارتمان</h4>
//                 <div className="space-y-3">
//                   <div className="grid grid-cols-3 gap-2">
//                     <input type="text" placeholder="عنوان وظیفه..." className="p-2 border rounded-lg col-span-2 bg-white" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
//                     <input type="text" placeholder="ددلاین" className="p-2 border rounded-lg text-center bg-white font-mono" value={convertToShamsi(newTask.date)} onChange={e => setNewTask({ ...newTask, date: e.target.value })} />
//                   </div>
                  
//                   <div className="flex flex-col gap-1">
//                     <span className="text-[10px] text-slate-400 font-bold">👤 ارجاع وظیفه به کارشناس:</span>
//                     <select className="p-2 border rounded-lg bg-white font-bold text-slate-700" onChange={(e) => setNewTask({ ...newTask, assigned_agent_id: e.target.value })}>
//                       <option value="">کارشناس پیش‌فرض پرونده</option>
//                       <option value="1">خانم صادقی راد (لاین تحصیلی)</option>
//                       <option value="2">آقای محمدی (لاین کاری آلمان)</option>
//                       <option value="3">خانم لطفی (لاین سرمایه‌گذاری)</option>
//                     </select>
//                   </div>

//                   <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-2">
//                     <label className="flex items-center gap-1.5 font-bold text-indigo-600 cursor-pointer select-none">
//                       <input type="checkbox" checked={newTask.has_reminder || false} onChange={(e) => setNewTask({ ...newTask, has_reminder: e.target.checked })} />
//                       ⏰ نیاز به یادآور پیگیری دارد؟
//                     </label>

//                     {newTask.has_reminder && (
//                       <div className="pt-2 border-t border-dashed space-y-2 animate-fadeIn">
//                         <div className="grid grid-cols-2 gap-2">
//                           <input type="text" placeholder="تاریخ هشدار" className="p-2 border rounded-lg bg-slate-50 text-center font-mono" value={newTask.reminder_date || ''} onChange={e => setNewTask({ ...newTask, reminder_date: e.target.value })} />
//                           <input type="time" className="p-2 border rounded-lg bg-slate-50 text-center font-mono" value={newTask.reminder_time || '09:00'} onChange={e => setNewTask({ ...newTask, reminder_time: e.target.value })} />
//                         </div>
//                         <div className="flex flex-wrap gap-3 font-bold text-slate-600">
//                           <label className="flex items-center gap-1"><input type="checkbox" defaultChecked />پرتال</label>
//                           <label className="flex items-center gap-1 text-blue-600"><input type="checkbox" />پیامک</label>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//                 <button onClick={handleAddTask} className="w-full bg-emerald-600 text-white p-2.5 rounded-xl font-bold cursor-pointer hover:bg-emerald-700 text-center block">🚀 استقرار وظیفه تیمی در دپارتمان</button>
//               </div>

//               <div className="space-y-2">
//                 <h4 className="font-bold text-slate-700">📋 لیست کارهای کارشناسان روی این پرونده:</h4>
//                 {leadTasks.map((t: any) => (
//                   <div key={t.id} className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center">
//                     <div><strong>{t.task_title}</strong> <span className="text-slate-400">({convertToShamsi(t.due_date_shamsi) || 'بدون ددلاین'})</span></div>
//                     <span className={`px-2 py-0.5 rounded text-white font-bold ${t.status === 'done' ? 'bg-emerald-600' : 'bg-amber-600'}`}>{t.status}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* 🔗 تب ابزار ادغام پرونده‌های تکراری تلگرام/ایزابل با اسکن دوگانه هوشمند */}
//           {activeTab === 'merge' && (
//             <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 space-y-4">
//               <div>
//                 <h3 className="text-sm font-black text-rose-800">🔗 ادغام پرونده جاری با کارتابل اصلی</h3>
//                 <p className="text-xs text-slate-500 mt-1">اگر این لید یک رکورد تکراری از تلگرام است، آیدی پرونده اصلی یا آیدی پرفکس او را وارد کنید تا تمام تاریخچه‌ها منتقل شده و این رکورد فرعی حذف شود.</p>
//               </div>
//               <div className="flex gap-2 max-w-md">
//                 <input type="number" placeholder="آیدی لید اصلی یا شناسه پرفکس..." className="p-2.5 border rounded-xl bg-white text-center font-mono text-xs w-full text-slate-800 font-bold border-rose-200" value={masterLeadId} onChange={e => setMasterLeadId(e.target.value)} />
//                 <button onClick={handleMergeLeads} className="bg-rose-600 hover:bg-rose-700 text-white px-5 rounded-xl font-bold cursor-pointer whitespace-nowrap">🔗 ادغام اتمیک</button>
//               </div>
//             </div>
//           )}
//         </div>

//       </div>
//     </div>
//   );
// 🎯 بهینه‌سازی کانتینر کلی رندر دراور برای موبایل و دسکتاپ مهندس کیسکا
  return (
    <div  className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-start animate-fadeIn" dir="rtl">
      {/* 🧠 در موبایل عرض کامل w-full و در دسکتاپ عرض مهندسی شده max-w-2xl صادر می‌شود */}
      <div className="bg-white w-full md:max-w-2xl h-full shadow-2xl flex flex-col p-4 md:p-6 overflow-y-auto border-r text-[11px]">
        
        {/* هدر دراور */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <div>
            <h2 className="text-sm md:text-base font-black text-slate-800">👤 شناسنامه جامع و ۳۶۰ درجه متقاضی</h2>
            <p className="text-xs text-indigo-600 font-bold mt-0.5">{selectedLead.name} ({selectedLead.phone})</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg cursor-pointer">×</button>
        </div>
            {/* 🎰 سوئیچ تب‌های هوشمند پیشگامان - مجهز به گارد اسکرول افقی نرم در موبایل مهندس کیسکا */}
            {/* <div className="flex flex-row items-center gap-1.5 border-b pb-3 mb-4 select-none overflow-x-auto whitespace-nowrap px-1 scrollbar-thin dark:border-slate-800"> */}
              <div className="flex flex-row items-center gap-1.5 border-b pb-3 mb-4 select-none overflow-x-auto whitespace-nowrap px-1 scrollbar-none dark:border-slate-800">
              <button 
                onClick={() => setActiveTab('profile')} 
                className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer text-[10px] sm:text-[11px] flex-shrink-0 ${
                  activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                👤 شناسنامه و وضعیت
              </button>
              
              <button 
                onClick={() => setActiveTab('chat')} 
                className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer text-[10px] sm:text-[11px] flex-shrink-0 ${
                  activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                💬 مکالمات ({chatHistory.length})
              </button>
              
              <button 
                onClick={() => setActiveTab('reminders')} 
                className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer text-[10px] sm:text-[11px] flex-shrink-0 ${
                  activeTab === 'reminders' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                🔔 یادآورها ({leadReminders.length})
              </button>
              
              <button 
                onClick={() => setActiveTab('tasks')} 
                className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer text-[10px] sm:text-[11px] flex-shrink-0 ${
                  activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                ✅ وظایف ({leadTasks.length})
              </button>
              
              <button 
                onClick={() => setActiveTab('merge')} 
                className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer text-[10px] sm:text-[11px] flex-shrink-0 ${
                  activeTab === 'merge' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                🔗 ادغام لید
              </button>

            </div>
        {/* سوئیچ تب‌ها - مجهز به قابلیت اسکرول افقی در موبایل بدون مچاله شدن دکمه‌ها
        <div className="flex flex-nowrap md:flex-wrap gap-1.5 border-b pb-3 mb-4 select-none overflow-x-auto scrollbar-none whitespace-nowrap pb-2">
          <button onClick={() => setActiveTab('profile')} className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600'}`}>👤 شناسنامه</button>
          <button onClick={() => setActiveTab('chat')} className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600'}`}>💬 مکالمات ({chatHistory.length})</button>
          <button onClick={() => setActiveTab('reminders')} className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'reminders' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600'}`}>🔔 یادآورها ({leadReminders.length})</button>
          <button onClick={() => setActiveTab('tasks')} className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600'}`}>✅ وظایف ({leadTasks.length})</button>
          <button onClick={() => setActiveTab('merge')} className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'merge' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700'}`}>🔗 ادغام</button>
        </div> */}

        {/* محتوای تب‌ها */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'profile' && (
            <div className="space-y-4 pb-10">
              
              {/* ویجت تحلیل هوش مصنوعی اختصاصی پیشگامان */}
              <div className="p-4 border border-purple-100 bg-purple-50/40 rounded-2xl space-y-1.5">
                <h3 className="text-xs font-black text-purple-700">🧠 خلاصه کانتکست و پیشنهاد هوش مصنوعی (RAG)</h3>
                <p className="text-slate-700"><strong>🎯 مقصد پیشنهادی کور:</strong> {selectedLead.ai_insights?.destination}</p>
                <p className="text-slate-700"><strong>✈️ نوع اقدام استخراج شده:</strong> {selectedLead.ai_insights?.intent}</p>
                <p className="text-slate-500 leading-relaxed bg-white p-2 rounded-lg border border-purple-50 mt-1"><strong>💡 نقشه راه ادمین:</strong> {selectedLead.ai_insights?.summary}</p>
              </div>

              {isEditing ? (
                /* ================= پنل کامل ویرایش اطلاعات (Editor Mode) ================= */
                <div className="space-y-4">
                  {/* اطلاعات فردی */}
                  <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                    <h4 className="font-bold text-indigo-600 border-b pb-1">📞 هویت و ارتباطات</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">نام و نام خانوادگی:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.name || ''} onChange={e => setSelectedLead({ ...selectedLead, name: e.target.value })} /></label>
                      <label className="flex flex-col gap-1">تلفن همراه اول:<input type="text" className="p-2 border rounded-lg text-left font-mono" value={selectedLead.phone || ''} onChange={e => setSelectedLead({ ...selectedLead, phone: e.target.value })} /></label>
                      <label className="flex flex-col gap-1">تلفن همراه دوم:<input type="text" className="p-2 border rounded-lg text-left font-mono" value={selectedLead.secondary_phone || ''} onChange={e => setSelectedLead({ ...selectedLead, secondary_phone: e.target.value })} /></label>
                      <label className="flex flex-col gap-1">شهر محل سکونت:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.current_city || ''} onChange={e => setSelectedLead({ ...selectedLead, current_city: e.target.value })} /></label>
                      <label className="flex flex-col gap-1">سن متقاضی:<input type="number" className="p-2 border rounded-lg text-center" value={selectedLead.age || ''} onChange={e => setSelectedLead({ ...selectedLead, age: e.target.value })} /></label>
                      <label className="flex flex-col gap-1">وضعیت نظام وظیفه:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.military_status || ''} onChange={e => setSelectedLead({ ...selectedLead, military_status: e.target.value })} /></label>
                    </div>
                  </div>

                  {/* وضعیت تاهل و همسر */}
                  <div className="bg-pink-50/30 p-4 rounded-xl border border-pink-100 space-y-3">
                    <h4 className="font-bold text-pink-700 border-b pb-1">💍 وضعیت خانواده</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">وضعیت تاهل:
                        <select className="p-2 border rounded-lg bg-white font-bold text-slate-700" value={selectedLead.marital_status || 'single'} onChange={e => setSelectedLead({ ...selectedLead, marital_status: e.target.value })}>
                          <option value="single">مجرد</option>
                          <option value="married">متاهل</option>
                          <option value="divorced">مطلقه / فوت همسر</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1">تعداد فرزندان:<input type="number" className="p-2 border rounded-lg text-center" value={selectedLead.children_count || '0'} onChange={e => setSelectedLead({ ...selectedLead, children_count: e.target.value })} /></label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-dashed border-pink-100">
                      <label className="flex flex-col gap-1">نام همسر:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.spouse_name || ''} onChange={e => setSelectedLead({ ...selectedLead, spouse_name: e.target.value })} /></label>
                      <label className="flex flex-col gap-1">سن همسر:<input type="number" className="p-2 border rounded-lg text-center" value={selectedLead.spouse_age || ''} onChange={e => setSelectedLead({ ...selectedLead, spouse_age: e.target.value })} /></label>
                      <label className="flex flex-col gap-1">تحصیلات همسر:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.spouse_education || ''} onChange={e => setSelectedLead({ ...selectedLead, spouse_education: e.target.value })} /></label>
                      <label className="flex flex-col gap-1">سطح زبان همسر:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.spouse_language_level || ''} onChange={e => setSelectedLead({ ...selectedLead, spouse_language_level: e.target.value })} /></label>
                      <label className="flex flex-col gap-1 sm:col-span-2">سابقه کار همسر:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.spouse_work_history || ''} onChange={e => setSelectedLead({ ...selectedLead, spouse_work_history: e.target.value })} /></label>
                      <label className="flex flex-col gap-1 sm:col-span-2">همراه سفر است؟
                        <select className="p-2 border rounded-lg bg-white font-medium text-slate-700" value={selectedLead.spouse_accompanying || 'yes'} onChange={e => setSelectedLead({ ...selectedLead, spouse_accompanying: e.target.value })}>
                          <option value="yes">بله، به عنوان همراه پرونده مهاجرت می‌کند</option>
                          <option value="no">خیر، در حال حاضر قصد همراهی ندارد</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  {/* تحصیلات */}
                  <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                    <h4 className="font-bold text-emerald-600 border-b pb-1">🎓 تحصیلات و سوابق کاری</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">آخرین مدرک تحصیلی:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.education_level || ''} onChange={e => setSelectedLead({ ...selectedLead, education_level: e.target.value })} /></label>
                      <label className="flex flex-col gap-1">رشته تحصیلی:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.field_of_study || ''} onChange={e => setSelectedLead({ ...selectedLead, field_of_study: e.target.value })} /></label>
                      <label className="flex flex-col gap-1">معدل کل (GPA):<input type="text" className="p-2 border rounded-lg text-center font-mono" value={selectedLead.gpa || ''} onChange={e => setSelectedLead({ ...selectedLead, gpa: e.target.value })} /></label>
                      <label className="flex flex-col gap-1">سابقه کار و بیمه:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.work_and_insurance_history || ''} onChange={e => setSelectedLead({ ...selectedLead, work_and_insurance_history: e.target.value })} /></label>
                    </div>
                  </div>

                  {/* زبان */}
                  <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                    <h4 className="font-bold text-amber-600 border-b pb-1">🗣️ سطوح و مدارک زبان</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">انگلیسی عمومی:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.english_level || ''} onChange={e => setSelectedLead({ ...selectedLead, english_level: e.target.value })} /></label>
                      <label className="flex flex-col gap-1">مدرک انگلیسی:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.english_certified_level || ''} onChange={e => setSelectedLead({ ...selectedLead, english_certified_level: e.target.value })} /></label>
                      <label className="flex flex-col gap-1">زبان آلمانی:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.german_level || ''} onChange={e => setSelectedLead({ ...selectedLead, german_level: e.target.value })} /></label>
                      <label className="flex flex-col gap-1">مدرک آلمانی:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.german_certified_level || ''} onChange={e => setSelectedLead({ ...selectedLead, german_certified_level: e.target.value })} /></label>
                    </div>
                  </div>

                  {/* مالی و مقصد */}
                  <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                    <h4 className="font-bold text-cyan-600 border-b pb-1">✈️ اهداف مهاجرتی و مالی</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">کشور مقصد هدف:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.target_country || ''} onChange={e => setSelectedLead({ ...selectedLead, target_country: e.target.value })} /></label>
                      <label className="flex flex-col gap-1">پلن مهاجرتی درخواست شده:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.requested_plan || ''} onChange={e => setSelectedLead({ ...selectedLead, requested_plan: e.target.value })} /></label>
                      <label className="flex flex-col gap-1">تمکن مالی (تومان):<input type="number" className="p-2 border rounded-lg bg-white font-mono" value={selectedLead.financial_capability_toman || ''} onChange={e => setSelectedLead({ ...selectedLead, financial_capability_toman: e.target.value })} /></label>
                      <label className="flex flex-col gap-1">کانال کشف مجموعه:<input type="text" className="p-2 border rounded-lg bg-white" value={selectedLead.discovery_channel || ''} onChange={e => setSelectedLead({ ...selectedLead, discovery_channel: e.target.value })} /></label>
                    </div>
                  </div>

                  <button onClick={() => onUpdate(selectedLead).then(() => setIsEditing(false))} className="w-full bg-emerald-600 text-white p-3 rounded-xl font-bold shadow-md cursor-pointer hover:bg-emerald-700 transition-all">💾 ذخیره تغییرات شناسنامه</button>
                </div>
              ) : (
                /* ================= پنل نمایش لوکس چهل‌گانه (Read-Only View) ================= */
                <div className="space-y-4">
                  {/* کارت اطلاعات عمومی */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <h4 className="font-bold text-indigo-600 border-b pb-1">👤 اطلاعات فردی و ارتباطی کلاینت</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                      <div>📌 <strong>نام متقاضی:</strong> <span className="text-slate-800 font-bold">{selectedLead.name}</span></div>
                      <div>📱 <strong>تلفن همراه اصلی:</strong> <span className="font-mono text-slate-800 font-bold">{selectedLead.phone}</span></div>
                      <div>📞 <strong>تلفن همراه دوم:</strong> <span className="font-mono">{selectedLead.secondary_phone || 'ثبت نشده'}</span></div>
                      <div>📍 <strong>شهر سکونت:</strong> <span className="text-slate-700">{selectedLead.current_city || '---'}</span></div>
                      <div>🎂 <strong>سن کلاینت:</strong> <span>{selectedLead.age || '---'} سال</span></div>
                      <div>🪖 <strong>وضعیت نظام وظیفه:</strong> <span>{selectedLead.military_status || '---'}</span></div>
                    </div>
                  </div>

                  {/* کارت ازدواج و همسر */}
                  <div className="bg-pink-50/40 p-4 rounded-xl border border-pink-100/70 space-y-2">
                    <h4 className="font-bold text-pink-700 border-b pb-1">💍 وضعیت تاهل و ساختار خانواده کلاینت</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                      <div>📌 <strong>وضعیت تاهل:</strong> <span className="text-pink-700 font-black">{selectedLead.marital_status === 'married' ? 'متاهل 👨‍👩‍👦' : selectedLead.marital_status === 'divorced' ? 'مطلقه / فوت همسر' : 'مجرد 🧍'}</span></div>
                      <div>👶 <strong>تعداد فرزندان همراه:</strong> <span className="font-mono font-bold text-slate-800">{selectedLead.children_count || '0'} فرزند</span></div>
                      {selectedLead.marital_status === 'married' && (
                        <>
                          <div>👰 <strong>نام همسر:</strong> <span className="text-slate-800 font-bold">{selectedLead.spouse_name || '---'}</span></div>
                          <div>🎂 <strong>سن همسر:</strong> <span>{selectedLead.spouse_age || '---'} سال</span></div>
                          <div>🎓 <strong>تحصیلات همسر:</strong> <span>{selectedLead.spouse_education || '---'}</span></div>
                          <div>🗣️ <strong>سطح زبان همسر:</strong> <span className="text-indigo-600 font-medium">{selectedLead.spouse_language_level || '---'}</span></div>
                          <div className="sm:col-span-2">💼 <strong>رزومه شغلی همسر:</strong> <span>{selectedLead.spouse_work_history || '---'}</span></div>
                          <div className="sm:col-span-2 text-slate-500 font-medium bg-white/70 p-1.5 rounded border border-pink-50">
                            ✈️ وضعیت همراهی: <span className="text-slate-800 font-bold">{selectedLead.spouse_accompanying === 'no' ? 'خیر، همسر همسفر نیست' : 'بله، همسر در همین کیس پرونده مهاجرت می‌کند'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* کارت تحصیلات و رزومه */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <h4 className="font-bold text-emerald-600 border-b pb-1">🎓 آکادمیک، سوابق کاری و رزومه</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                      <div>🏛️ <strong>آخرین مقطع تحصیلی:</strong> <span className="text-slate-800 font-bold">{selectedLead.education_level || '---'}</span></div>
                      <div>🔬 <strong>رشته تحصیلی:</strong> <span className="text-slate-800">{selectedLead.field_of_study || '---'}</span></div>
                      <div>📝 <strong>معدل کل:</strong> <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{selectedLead.gpa || '---'}</span></div>
                      <div>💼 <strong>رزومه سابقه کار:</strong> <span className="text-slate-700">{selectedLead.work_and_insurance_history || '---'}</span></div>
                    </div>
                  </div>

                  {/* کارت شایستگی زبان */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <h4 className="font-bold text-amber-600 border-b pb-1">🗣️ سطوح و مدارک زبان متقاضی اصلی</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                      <div>🇬🇧 <strong>انگلیسی عمومی:</strong> <span>{selectedLead.english_level || '---'}</span></div>
                      <div>📜 <strong>مدرک انگلیسی:</strong> <span className="text-indigo-600 font-bold">{selectedLead.english_certified_level || 'ندارد'}</span></div>
                      <div>🇩🇪 <strong>زبان آلمانی:</strong> <span>{selectedLead.german_level || '---'}</span></div>
                      <div>📜 <strong>مدرک آلمانی:</strong> <span className="text-indigo-600 font-bold">{selectedLead.german_certified_level || 'ندارد'}</span></div>
                    </div>
                  </div>

                  {/* کارت اهداف مالی و مقصد */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <h4 className="font-bold text-cyan-600 border-b pb-1">✈️ اهداف مهاجرتی، مالی و کانال ورودی</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                      <div>🌍 <strong>کشور هدف:</strong> <span className="text-slate-800 font-bold">{selectedLead.target_country || '---'}</span></div>
                      <div>📋 <strong>نوع پلن درخواستی:</strong> <span className="text-indigo-600 font-bold">{selectedLead.requested_plan || '---'}</span></div>
                      <div>💰 <strong>میزان تمکن مالی:</strong> <span className="text-emerald-600 font-bold font-mono bg-emerald-50/50 px-1.5 py-0.5 rounded">{selectedLead.financial_capability_toman ? `${Number(selectedLead.financial_capability_toman).toLocaleString()} تومان` : '---'}</span></div>
                      <div>📡 <strong>منبع کانال کشف:</strong> <span className="text-slate-700">{selectedLead.source}</span></div>
                    </div>
                  </div>

                  <button onClick={() => setIsEditing(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-bold transition-all text-center cursor-pointer shadow-xs">✏️ ورود به پنل ادیتور و ویرایش ۳۶۰ درجه کل فیلدها</button>
                </div>
              )}
            </div>
          )}

          {/* 💬 تب تاریخچه مکالمات چندکاناله تیره رنگ */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col bg-slate-950 p-4 rounded-2xl border border-slate-900 text-white min-h-[450px] h-[calc(100vh-230px)] justify-between">
              <div className="flex-1 overflow-y-auto pr-1 pl-2 space-y-3 mb-3 max-h-[calc(100vh-320px)] scrollbar-thin">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-slate-500 py-10 font-bold">هیچ مکالمه‌ای ثبت نشده است.</div>
                ) : (
                  chatHistory.map((msg) => (
                    <div key={msg.id} className={`flex flex-col max-w-[85%] p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-600 self-start mr-auto rounded-bl-none' : msg.sender === 'bot' ? 'bg-purple-900 self-end ml-auto rounded-br-none' : 'bg-slate-800 self-end ml-auto rounded-br-none'}`}>
                      <div className="text-[9px] text-slate-300 font-bold mb-1">
                        {msg.sender === 'user' ? '👤 متقاضی' : msg.sender === 'bot' ? '🤖 دستیار هوشمند' : '🧑‍💼 کارشناس (من)'}
                      </div>
                      <p className="text-xs text-white leading-relaxed">{msg.message}</p>
                      <span className="text-[8px] text-slate-400 self-end mt-1 font-mono">
                        {convertToShamsi(msg.date)} - {msg.time}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-900/60 pt-3 text-slate-800 bg-slate-950 mt-auto">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input type="text" placeholder="متن گفتگو یا یادداشت تماس..." className="p-2 bg-white rounded-xl text-xs w-full focus:outline-none placeholder-slate-400 font-bold" id="manualMsgInput" />
                  <div className="flex gap-2">
                    <select id="manualSenderType" className="p-2 bg-slate-100 rounded-xl text-xs font-black text-slate-700 w-full sm:w-auto">
                      <option value="agent">🧑‍💼 کارشناس</option>
                      <option value="user">👤 متقاضی</option>
                    </select>
                    <button 
                      onClick={async () => {
                        const msgInput = document.getElementById('manualMsgInput') as HTMLInputElement;
                        const senderSelect = document.getElementById('manualSenderType') as HTMLSelectElement;
                        if (!msgInput.value) return alert('متن پیام را وارد کنید.');

                        const res = await fetch(`${BACKEND_BASE_URL}/api/next/leads/store-chat`, {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
                          body: JSON.stringify({ lead_id: selectedLead.id, message: msgInput.value, sender_type: senderSelect.value })
                        });
                        if (res.ok) {
                          msgInput.value = '';
                          fetchLeadSubData(selectedLead.id);
                        }
                      }}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-xs cursor-pointer hover:bg-indigo-700 whitespace-nowrap active:scale-95 transition-all w-full sm:w-auto text-center"
                    >
                      ثبت پیام
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ⏰ تب یادآورها */}
          {activeTab === 'reminders' && (
            <div className="space-y-4 pb-10">
              <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                <h4 className="font-bold text-slate-700">⏰ تنظیم یادآور پیگیری و کانال‌ها</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" placeholder="موضوع پیگیری" className="p-2 border rounded-lg bg-white" value={newReminder.title} onChange={e => setNewReminder({ ...newReminder, title: e.target.value })} />
                  <input type="text" placeholder="تاریخ شمسی" className="p-2 border rounded-lg bg-white text-center font-mono" value={newReminder.date} onChange={e => setNewReminder({ ...newReminder, date: e.target.value })} />
                  <input type="time" className="p-2 border rounded-lg bg-white text-center font-mono" value={newReminder.time} onChange={e => setNewReminder({ ...newReminder, time: e.target.value })} />
                  <input type="text" placeholder="توضیحات تکمیلی..." className="p-2 border rounded-lg bg-white" value={newReminder.description} onChange={e => setNewReminder({ ...newReminder, description: e.target.value })} />
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">📢 پلتفرم‌های مقصد ارسال آلارم:</span>
                  <div className="flex flex-wrap gap-4 text-slate-700 font-bold">
                    <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" defaultChecked /> پرتال داخلی</label>
                    <label className="flex items-center gap-1 cursor-pointer text-blue-600"><input type="checkbox" /> پیامک</label>
                    <label className="flex items-center gap-1 cursor-pointer text-sky-500"><input type="checkbox" /> تلگرام</label>
                  </div>
                </div>
                <button onClick={handleAddReminder} className="w-full bg-indigo-600 text-white p-2.5 rounded-xl font-bold shadow-md cursor-pointer hover:bg-indigo-700 transition-all text-center block">⏰ ثبت ناتیفیکیشن روی سکوها</button>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700">📋 یادآورهای فعال:</h4>
                {leadReminders.map((rem: any) => (
                  <div key={rem.id} className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center">
                    <div><strong>{rem.title}</strong> <span className="text-slate-400">({rem.reminder_date_shamsi} {rem.reminder_time})</span></div>
                    <span className="text-indigo-600 font-bold bg-white px-2 py-0.5 rounded border">{rem.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ✅ تب وظایف تیمی */}
          {activeTab === 'tasks' && (
            <div className="space-y-4 pb-10">
              <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                <h4 className="font-bold text-slate-800">➕ تعریف وظیفه و اتوماسیون پیگیری</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input type="text" placeholder="عنوان وظیفه..." className="p-2 border rounded-lg sm:col-span-2 bg-white" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                    <input type="text" placeholder="ددلاین" className="p-2 border rounded-lg text-center bg-white font-mono" value={newTask.date} onChange={e => setNewTask({ ...newTask, date: e.target.value })} />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-bold">👤 ارجاع وظیفه به کارشناس:</span>
                    <select className="p-2 border rounded-lg bg-white font-bold text-slate-700" onChange={(e) => setNewTask({ ...newTask, assigned_agent_id: e.target.value })}>
                      <option value="">کارشناس پیش‌فرض پرونده</option>
                      <option value="1">خانم صادقی راد (لاین تحصیلی)</option>
                      <option value="2">آقای محمدی (لاین کاری آلمان)</option>
                      <option value="3">خانم لطفی (لاین سرمایه‌گذاری)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-2">
                    <label className="flex items-center gap-1.5 font-bold text-indigo-600 cursor-pointer select-none">
                      <input type="checkbox" checked={newTask.has_reminder || false} onChange={(e) => setNewTask({ ...newTask, has_reminder: e.target.checked })} />
                      ⏰ نیاز به یادآور پیگیری دارد؟
                    </label>

                    {newTask.has_reminder && (
                      <div className="pt-2 border-t border-dashed space-y-2 animate-fadeIn">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input type="text" placeholder="تاریخ هشدار" className="p-2 border rounded-lg bg-slate-50 text-center font-mono" value={newTask.reminder_date || ''} onChange={e => setNewTask({ ...newTask, reminder_date: e.target.value })} />
                          <input type="time" className="p-2 border rounded-lg bg-slate-50 text-center font-mono" value={newTask.reminder_time || '09:00'} onChange={e => setNewTask({ ...newTask, reminder_time: e.target.value })} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={handleAddTask} className="w-full bg-emerald-600 text-white p-2.5 rounded-xl font-bold cursor-pointer hover:bg-emerald-700 text-center block">🚀 استقرار وظیفه تیمی</button>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-700">📋 لیست کارها:</h4>
                {leadTasks.map((t: any) => (
                  <div key={t.id} className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center">
                    <div><strong>{t.task_title}</strong> <span className="text-slate-400">({convertToShamsi(t.due_date_shamsi) || 'بدون ددلاین'})</span></div>
                    <span className={`px-2 py-0.5 rounded text-white font-bold ${t.status === 'done' ? 'bg-emerald-600' : 'bg-amber-600'}`}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🔗 تب ابزار ادغام پرونده‌های تکراری */}
          {activeTab === 'merge' && (
            <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 space-y-4">
              <div>
                <h3 className="text-sm font-black text-rose-800">🔗 ادغام پرونده جاری</h3>
                <p className="text-xs text-slate-500 mt-1">آیدی پرونده اصلی را وارد کنید تا تمام تاریخچه‌ها منتقل شده و این رکورد حذف شود.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                <input type="number" placeholder="آیدی لید اصلی..." className="p-2.5 border rounded-xl bg-white text-center font-mono text-xs w-full text-slate-800 font-bold border-rose-200" value={masterLeadId} onChange={e => setMasterLeadId(e.target.value)} />
                <button onClick={handleMergeLeads} className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold cursor-pointer whitespace-nowrap text-center">🔗 ادغام اتمیک</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );

}