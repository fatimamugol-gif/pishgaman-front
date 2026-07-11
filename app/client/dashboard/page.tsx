"use client";

import React, { useEffect, useState } from 'react';
import HubTab from './HubTab';
import ChatTab from './ChatTab';
import VaultTab from './VaultTab';
import TicketsTab from './TicketsTab';
import KnowledgeTab from './KnowledgeTab';
import ConsultationTracker from '@/components/staff/ConsultationTracker';

type TabType = 'hub' | 'chat' | 'vault' | 'tickets' | 'knowledge';

export default function ClientPortalDashboard() {
  const [dashboardData, setHubData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [knowledgeArticles, setArticles] = useState<any[]>([]);
  const [targetCountry, setTargetCountry] = useState('آلمان');


  const [activeTab, setActiveTab] = useState<TabType>('hub');
  const [chatInput, setChatInput] = useState('');
  const [taskComments, setTaskComments] = useState<Record<number, any[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});

  const [docType, setDocType] = useState('passport');
  const [docTitle, setDocTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDescription] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketFile, setTicketFile] = useState<File | null>(null);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  const BACKEND_BASE_URL = `http://${currentHost}:8000`;

  const loadPortalData = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', 'Content-Type': 'application/json' };

    try {
      const [dashRes, taskRes, invRes, tickRes, chatRes, docRes, kbRes] = await Promise.all([
        fetch(`${BACKEND_BASE_URL}/api/client-portal/dashboard`, { headers }),
        fetch(`${BACKEND_BASE_URL}/api/client-portal/tasks`, { headers }),
        fetch(`${BACKEND_BASE_URL}/api/client-portal/invoices`, { headers }),
        fetch(`${BACKEND_BASE_URL}/api/client-portal/tickets`, { headers }),
        fetch(`${BACKEND_BASE_URL}/api/client-portal/chat/history`, { headers }),
        fetch(`${BACKEND_BASE_URL}/api/client-portal/documents`, { headers }),
        fetch(`${BACKEND_BASE_URL}/api/client-portal/knowledge-base`, { headers })
      ]);

      if (dashRes.ok) setHubData(await dashRes.json());
      if (taskRes.ok) {
        const tData = await taskRes.json();
        setTasks(tData.data || []);
        tData.data?.forEach((task: any) => fetchComments(task.id));
      }
      if (invRes.ok) setInvoices((await invRes.json()).data || []);
      if (tickRes.ok) setTickets((await tickRes.json()).data || []);
      if (chatRes.ok) setChats((await chatRes.json()).data || []);
      if (docRes.ok) setDocuments((await docRes.json()).data || []);
      if (kbRes.ok) {
        const kbJson = await kbRes.json();
        setArticles(kbJson.data || []);
        setTargetCountry(kbJson.target_country);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchComments = async (taskId: number) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_BASE_URL}/api/client-portal/tasks/${taskId}/comments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const json = await res.json();
      setTaskComments(prev => ({ ...prev, [taskId]: json.data || [] }));
    }
  };

  const handleSendComment = async (taskId: number) => {
    const text = commentInputs[taskId];
    if (!text || !text.trim()) return;
    const token = localStorage.getItem('token');

    const res = await fetch(`${BACKEND_BASE_URL}/api/client-portal/tasks/${taskId}/comments/store`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: text })
    });
    if (res.ok) {
      setCommentInputs(prev => ({ ...prev, [taskId]: '' }));
      fetchComments(taskId);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !(selectedFile instanceof File) || !docTitle.trim()) {
      return alert('لطفاً عنوان مدرک را بنویسید و فایل آن را مجدداً انتخاب کنید.');
    }

    setIsUploading(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('document_type', docType);
    formData.append('title', docTitle);
    formData.append('file', selectedFile, selectedFile.name);

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/client-portal/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        alert('✨ مدرک شما با موفقیت در خزانه اسناد آپلود شد.');
        setDocTitle('');
        setSelectedFile(null);
        const docRes = await fetch(`${BACKEND_BASE_URL}/api/client-portal/documents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (docRes.ok) setDocuments((await docRes.json()).data || []);
      } else {
        alert('⚠️ خطای سرور: ' + (data.message || 'فرمت فایل مجاز نیست.'));
      }
    } catch (err) { console.error(err); } finally { setIsUploading(false); }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_BASE_URL}/api/client-portal/chat/send`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: chatInput })
    });
    if (res.ok) {
      setChatInput('');
      const chatRes = await fetch(`${BACKEND_BASE_URL}/api/client-portal/chat/history`, { headers: { 'Authorization': `Bearer ${token}` } });
      setChats((await chatRes.json()).data || []);
    }
  };

  const handleSendTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDesc.trim()) return alert('لطفاً اطلاعات را پر کنید.');
    setIsSubmittingTicket(true);

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('subject', ticketSubject);
    formData.append('description', ticketDesc);

    // 🧠 گارد امنیتی: تنها در صورتی فایل ضمیمه شود که نمونهٔ معتبری از کلاس File باشد
    if (ticketFile && ticketFile instanceof File) {
      formData.append('file', ticketFile, ticketFile.name);
    }

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/client-portal/tickets/store`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        alert('تیکت به همراه فایل ضمیمه با موفقیت ارسال شد.');
        setTicketSubject('');
        setTicketDescription('');
        setTicketFile(null);
        loadPortalData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  useEffect(() => { loadPortalData(); }, []);

  if (loading) return <div className="p-20 text-center font-bold text-slate-500 animate-pulse" dir="rtl">⏳ در حال همگام‌سازی نهایی کانتکست ارتباطات پیشگامان...</div>;

  const client = dashboardData?.client_info || { name: 'متقاضی محترم', plan: '---', country: '---', status_label: 'تشکیل پرونده' };
  const timeline = dashboardData?.timeline || { current_stage: 1, stages: [] };

  return (
    <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen text-right font-sans text-[11px]" dir="rtl">

      {/* هدر لوکس پرتال */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-[24px] text-white shadow-xl mb-6 flex flex-col md:flex-row justify-between items-center gap-4 border border-indigo-900/40">
        <div>
          <h1 className="text-xl font-black">🌟 پرتال متمرکز مشاوره‌ای و مالی پیشگامان</h1>
          <p className="text-slate-400 text-[10px] mt-1">پنل شخصی کلاینت رسمی: {client.name} | وضعیت: {client.status_label}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/10">
          <button onClick={() => { setActiveTab('hub'); setSelectedTicket(null); }} className={`px-3 py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer ${activeTab === 'hub' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5'}`}>📊 میزکار اصلی</button>
          <button onClick={() => { setActiveTab('chat'); setSelectedTicket(null); }} className={`px-3 py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5'}`}>💬 گفتگو با مشاور ({chats.length})</button>
          <button onClick={() => { setActiveTab('vault'); setSelectedTicket(null); }} className={`px-3 py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer ${activeTab === 'vault' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5'}`}>📂 خزانه اسناد ({documents.length})</button>
          <button onClick={() => { setActiveTab('tickets'); setSelectedTicket(null); }} className={`px-3 py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer ${activeTab === 'tickets' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5'}`}>🎫 پشتیبانی دپارتمانی ({tickets.length})</button>
          <button onClick={() => { setActiveTab('knowledge'); setSelectedTicket(null); }} className={`px-3 py-1.5 rounded-lg font-black text-[10px] transition-all cursor-pointer ${activeTab === 'knowledge' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5'}`}>📚 پایگاه دانش</button>
        </div>
      </div>

      {/* تایم‌لاین ثابت */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-xs mb-6">
        <div className="relative flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-2">
          <div className="absolute right-0 left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 dark:bg-slate-800 hidden sm:block -z-0" />
          {timeline.stages.map((stage: string, idx: number) => (
            <div key={idx} className="flex flex-col items-center z-10">
              <div className={`w-6 h-7 rounded-full flex items-center justify-center font-bold text-[10px] transition-all border ${idx + 1 <= timeline.current_stage ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}>{idx + 1 <= timeline.current_stage ? '✓' : idx + 1}</div>
              <span className={`mt-1.5 font-black text-[9px] ${idx + 1 <= timeline.current_stage ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>{stage}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 🧠 تزریق پویای ماژول‌های مستقل بر اساس تب فعال */}
      {/* 🎯 شلیک نهایی: نمایش لایو پایش عملکرد و کارکرد مشاوران برای کلاینت در میزکار اصلی */}
      {activeTab === 'hub' && (
        <div className="mb-6">
          <ConsultationTracker trackingData={dashboardData?.tracking_summary} />
        </div>
      )}
      {activeTab === 'hub' && (
        <HubTab tasks={tasks} invoices={invoices} taskComments={taskComments} commentInputs={commentInputs} setCommentInputs={setCommentInputs} handleSendComment={handleSendComment} setActiveTab={setActiveTab} />
      )}
      {activeTab === 'chat' && (
        <ChatTab chats={chats} chatInput={chatInput} setChatInput={setChatInput} handleSendChatMessage={handleSendChatMessage} />
      )}
      {activeTab === 'vault' && (
        <VaultTab documents={documents} docType={docType} setDocType={setDocType} docTitle={docTitle} setDocTitle={setDocTitle} setSelectedFile={setSelectedFile} isUploading={isUploading} handleUploadDoc={handleUploadDoc} />
      )}
      {activeTab === 'tickets' && (
        <TicketsTab
          tickets={tickets}
          ticketSubject={ticketSubject}
          setTicketSubject={setTicketSubject}
          ticketDesc={ticketDesc}
          setTicketDescription={setTicketDescription}
          setTicketFile={setTicketFile} // 👈 پروپس جدید پاس داده شد
          isSubmittingTicket={isSubmittingTicket}
          handleSendTicket={handleSendTicket}
          selectedTicket={selectedTicket}
          setSelectedTicket={setSelectedTicket}
        />
      )}
      {activeTab === 'knowledge' && (
        <KnowledgeTab articles={knowledgeArticles} targetCountry={targetCountry} />
      )}

    </div>
  );
}