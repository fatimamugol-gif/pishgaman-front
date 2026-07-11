// components/staff/TicketsDashboard.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { staffService } from '@/services/staffService';

export default function TicketsDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    fetchTickets(); 
  }, []);

  // اسکرول اتوماتیک به انتهای چت هنگام انتخاب یا ارسال پیام جدید
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await staffService.getTickets();
      setTickets(data);
    } catch (error) { 
      console.error('خطا در دریافت تیکت‌ها:', error); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setSubmitting(true);
      await staffService.replyToTicket(selectedTicket.id, replyText);
      
      const newMsg: any = {
        id: Date.now(),
        body: replyText,
        admin_id: 1,
        client_id: null,
        sender_name: 'شما (کارشناس ارشد)',
        created_at: new Date().toISOString(),
      };

      setSelectedTicket((prev: any) => ({
        ...prev,
        messages: prev.messages ? [...prev.messages, newMsg] : [newMsg],
        status: 'answered',
      }));

      setReplyText('');
      setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: 'answered' } : t)));
    } catch (error) { 
      console.error(error); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const departmentsList = Array.from(new Set(tickets.map(t => t.department_name || 'پشتیبانی عمومی')));
  const filteredTickets = tickets.filter(t => selectedDeptFilter === 'all' || t.department_name === selectedDeptFilter);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3" dir="rtl">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black text-xs animate-pulse">در حال همگام‌سازی کارتابل تیکت‌های مشاوره‌ای...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-right font-sans text-[11px] h-[calc(100vh-140px)] flex flex-col" dir="rtl">
      
      {/* 🎛️ هدر فیلترهای لوکس و گلس‌مورفیسم */}
      <div className="flex flex-wrap items-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 rounded-[20px] border border-slate-100 shadow-2xs shrink-0">
        <span className="text-slate-400 font-bold ml-2 text-[10px]">🎯 فیلتر دپارتمانی:</span>
        <button 
          onClick={() => setSelectedDeptFilter('all')} 
          className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${selectedDeptFilter === 'all' ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' : 'text-slate-600 bg-slate-50 hover:bg-slate-100'}`}
        >
          📦 همه دپارتمان‌ها ({tickets.length})
        </button>
        {departmentsList.map((dept: any, idx) => {
          const count = tickets.filter(t => t.department_name === dept).length;
          return (
            <button 
              key={idx} 
              onClick={() => setSelectedDeptFilter(dept)} 
              className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${selectedDeptFilter === dept ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-slate-600 bg-slate-50 hover:bg-slate-100'}`}
            >
              🗂️ {dept} ({count})
            </button>
          );
        })}
      </div>

      {/* بدنه دو ستونه چت‌پنل صنعتی */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0 overflow-hidden">
        
        {/* 👉 ستون راست: لیست تیکت‌های جاری دپارتمان */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 shadow-2xs overflow-y-auto p-3 space-y-2.5 h-full">
          <div className="text-slate-800 font-black text-xs border-b pb-2 px-1 flex justify-between items-center">
            <span>📥 تیکت‌های دریافتی</span>
            <span className="text-[9px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded-md">{filteredTickets.length} مورد</span>
          </div>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold">هیچ تیکتی در این بخش یافت نشد رفیق.</div>
          ) : (
            filteredTickets.map((ticket) => (
              <div 
                key={ticket.id} 
                onClick={() => setSelectedTicket(ticket)} 
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-[95px] select-none ${selectedTicket?.id === ticket.id ? 'border-indigo-500 bg-indigo-50/40 shadow-sm shadow-indigo-500/5' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}`}
              >
                {/* خط نشانگر عمودی وضعیت */}
                <div className={`absolute top-0 bottom-0 right-0 w-1.5 ${ticket.status === 'open' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                
                <div className="flex justify-between items-start mb-1 pr-1.5">
                  <h3 className="font-black text-slate-900 text-xs line-clamp-1 w-[70%]">{ticket.subject}</h3>
                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-black shrink-0 ${ticket.status === 'open' ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                    {ticket.status === 'open' ? '🔴 باز و معلق' : '✓ پاسخ داده شده'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 border-t border-dashed border-slate-200/60 pt-2 pr-1.5">
                  <span className="font-black text-slate-600 flex items-center gap-1">👤 {ticket.client?.name || 'متقاضی محترم'}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono ${ticket.priority === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                    {ticket.priority === 'high' ? 'HIGH' : 'NORMAL'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 👈 ستون چپ: باکس زنده چت مچ‌شده و پیام‌های متوالی */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[24px] shadow-2xs border border-slate-100 flex flex-col h-full overflow-hidden">
          {selectedTicket ? (
            <>
              {/* هدر بالایی پنجره چت */}
              <div className="p-4 border-b bg-slate-50/60 backdrop-blur-xs flex justify-between items-center shadow-3xs">
                <div>
                  <h2 className="text-xs font-black text-slate-900 flex items-center gap-1.5">📌 {selectedTicket.subject}</h2>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">
                    کلاینت: <span className="text-slate-700 font-black">{selectedTicket.client?.name}</span> | دپارتمان مقصد: <span className="text-indigo-600 font-black">{selectedTicket.department_name}</span>
                  </p>
                </div>
                
                {/* دکمهٔ شیک رویت فایل پیوست کلاینت */}
                {selectedTicket.attachment_url && (
                  <a href={selectedTicket.attachment_url} target="_blank" rel="noreferrer" className="bg-white border border-slate-200 text-slate-700 font-black text-[9px] px-3 py-2 rounded-xl shadow-3xs hover:bg-slate-50 hover:border-indigo-300 transition-all flex items-center gap-1">
                    📎 رویت سند ضمیمه کلاینت
                  </a>
                )}
              </div>

              {/* اسکرول باکس مسیج‌ها */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30 pr-2">
                {selectedTicket.messages?.map((msg: any, idx: number) => {
                  const isStaff = msg.admin_id !== null || msg.sender_name?.includes('مشاور') || msg.sender_name?.includes('کارشناس');
                  return (
                    <div key={idx} className={`flex ${isStaff ? 'justify-start' : 'justify-end'} animate-fadeIn`}>
                      <div className={`max-w-[70%] flex flex-col ${isStaff ? 'items-start' : 'items-end'}`}>
                        {/* نام فرستنده بالای باکس پیام */}
                        <span className="text-[8px] text-slate-400 font-black mb-1 px-1">{msg.sender_name}</span>
                        
                        <div className={`rounded-2xl p-3 text-xs leading-relaxed font-medium shadow-3xs ${isStaff ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/10' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'}`}>
                          <p className="whitespace-pre-line break-words">{msg.body}</p>
                        </div>
                        
                        {/* زمان ثبت پیام */}
                        <span className="text-[8px] text-slate-300 font-mono mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString('fa-IR', {hour: '2-digit', minute: '2-digit'})}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {/* نشانگر انتهای چت جهت اسکرول اتوماتیک */}
                <div ref={chatBottomRef} />
              </div>

              {/* فرم پایینی ارسال پاسخ سریع */}
              <form onSubmit={handleSendReply} className="p-3 border-t bg-white flex gap-2 items-center">
                <input 
                  type="text" 
                  value={replyText} 
                  onChange={(e) => setReplyText(e.target.value)} 
                  placeholder="پاسخ رسمی، دقیق و مشاوره‌ای خود را بنویسید..." 
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:border-indigo-400 focus:bg-white transition-all" 
                  disabled={submitting} 
                />
                <button 
                  type="submit" 
                  disabled={submitting || !replyText.trim()} 
                  className="px-5 bg-slate-950 text-white font-black py-3 rounded-xl text-xs hover:bg-slate-800 transition-all disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer shadow-md"
                >
                  {submitting ? '⏳ در حال ابلاغ...' : '🚀 شلیک پاسخ رسمی'}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 font-bold p-8 space-y-3">
              <div className="text-3xl">🎫</div>
              <p className="text-slate-400 text-xs font-black">جهت شروع پیگیری و گفتگو، یک تیکت را از منوی سمت راست انتخاب کنید رفیق.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}