// components/drawer/ChatTab.tsx
'use client';

import React, { useState } from 'react';

interface ChatTabProps {
  chatHistory: any[];
  leadId: number;
  BACKEND_BASE_URL: string;
  onRefresh: () => void;
}

export default function ChatTab({ chatHistory, leadId, BACKEND_BASE_URL, onRefresh }: ChatTabProps) {
  const [msgText, setMsgText] = useState('');
  const [senderType, setSenderType] = useState('agent');

  const handleSendChat = async () => {
    if (!msgText.trim()) return alert('متن پیام خالی است رفیق.');
    const res = await fetch(`${BACKEND_BASE_URL}/api/next/leads/store-chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ lead_id: leadId, message: msgText, sender_type: senderType })
    });
    if (res.ok) {
      setMsgText('');
      onRefresh();
    }
  };



   const convertToShamsi = (isoDateString: string) => {
    if (!isoDateString) return '---';
    try {
      const date = new Date(isoDateString);
      if (isNaN(date.getTime())) return isoDateString; // مقاومت در برابر تاریخ نامعتبر
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'short', // 👈 استفاده از نام خلاصه ماه برای جلوگیری از به هم ریختگی
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return isoDateString;
    }
  };

const toPersianDigits = (timeStr: string) => {
  if (!timeStr) return '---';
  
  // نگاشت اعداد انگلیسی به فارسی
  return timeStr.replace(/\d/g, (char) => {
    return '۰۱۲۳۴۵۶۷۸۹'[Number(char)];
  });
};


  return (
    <div className="flex-1 flex flex-col bg-slate-950 p-4 rounded-2xl border border-slate-900 text-white h-[calc(100vh-220px)] justify-between">
      <div className="flex-1 overflow-y-auto pr-1 pl-2 space-y-3 mb-3 max-h-[calc(100vh-310px)] flex flex-col">
        {chatHistory.length === 0 ? (
          <div className="text-center text-slate-500 my-auto font-bold py-10">هیچ مکالمه‌ای ثبت نشده است.</div>
        ) : (
          chatHistory.map((msg, idx) => {
            const isClient = msg.sender === 'user' || msg.sender_type === 'user';
            return (
              <div key={idx} className={`flex flex-col max-w-[85%] p-3 rounded-2xl ${isClient ? 'bg-indigo-600 self-start mr-auto rounded-bl-none' : 'bg-purple-900 self-end ml-auto rounded-br-none'}`}>
                <div className="text-[9px] text-indigo-300 font-black mb-1">{isClient ? '👤 متقاضی' : `🧑‍💼 مشاور: ${msg.description || 'کارشناس سیستم'}`}</div>
                <p className="text-xs text-white leading-relaxed">{msg.message}</p>
                <span className="text-[8px] text-slate-400 self-end mt-1 font-mono"> {toPersianDigits(msg.time)} - {convertToShamsi(msg.date)} </span>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-slate-900/60 pt-3 text-slate-800 bg-slate-950 mt-auto">
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="text" placeholder="متن گفتگو یا یادداشت تماس..." className="p-2 bg-white rounded-xl text-xs w-full focus:outline-none placeholder-slate-400 font-bold" value={msgText} onChange={e => setMsgText(e.target.value)} />
          <div className="flex gap-2">
            <select className="p-2 bg-slate-100 rounded-xl text-xs font-black text-slate-700 w-full sm:w-auto" value={senderType} onChange={e => setSenderType(e.target.value)}>
              <option value="agent">🧑‍💼 کارشناس</option>
              <option value="user">👤 متقاضی</option>
            </select>
            <button type="button" onClick={handleSendChat} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-xs cursor-pointer hover:bg-indigo-700 whitespace-nowrap active:scale-95 transition-all text-center">ثبت پیام</button>
          </div>
        </div>
      </div>
    </div>
  );
}