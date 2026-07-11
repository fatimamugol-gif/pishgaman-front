"use client";

import React from 'react';

interface TicketsTabProps {
  tickets: any[];
  ticketSubject: string;
  setTicketSubject: (val: string) => void;
  ticketDesc: string;
  setTicketDescription: (val: string) => void;
  setTicketFile: (file: File | null) => void; // 👈 اضافه شد
  isSubmittingTicket: boolean;
  handleSendTicket: (e: React.FormEvent) => void;
  selectedTicket: any;
  setSelectedTicket: (ticket: any) => void;
}

export default function TicketsTab({
  tickets, ticketSubject, setTicketSubject, ticketDesc, setTicketDescription, setTicketFile, isSubmittingTicket, handleSendTicket, selectedTicket, setSelectedTicket
}: TicketsTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn text-right" dir="rtl">

      {/* فرم ایجاد تیکت همراه با پیوست سند */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border dark:border-slate-800 shadow-xl space-y-4 h-fit">
        <h3 className="font-black text-slate-800 dark:text-white text-xs border-b pb-2 dark:border-slate-800">🎫 ثبت تیکت جدید به دپارتمان‌های پشتیبانی</h3>
        <form onSubmit={handleSendTicket} className="space-y-2">
          <input type="text" placeholder="موضوع تیکت..." className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl text-xs outline-none text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20" value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} />
          <textarea placeholder="متن کامل درخواست..." rows={4} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl text-xs outline-none text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 resize-none" value={ticketDesc} onChange={e => setTicketDescription(e.target.value)} />

          {/* 📎 گیت بارگذاری فایل ضمیمه تیکت پشتیبانی */}
          <label className="block text-[10px] space-y-1 text-slate-500 pt-1">
            📎 ضمیمه فایل پشتیبان (اختیاری):
            <input
              type="file"
              className="text-[9px] text-slate-450 font-mono mt-1"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => {
                // 👑 اصلاح قطعی: شکار دقیق اولین فایل باینری تکی [0] از لیست ورودی مرورگر جهت پاس دادن گارد TypeScript
                if (e.target.files && e.target.files.length > 0) {
                  setTicketFile(e.target.files[0]); // 🎯 تغییر کلیدی: استخراج ایندکس صفر به جای کل لیست
                } else {
                  setTicketFile(null);
                }
              }}
            />
          </label>

          <button type="submit" disabled={isSubmittingTicket} className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl text-center text-xs transition-all shadow-md cursor-pointer mt-2">
            {isSubmittingTicket ? '⏳ در حال ثبت...' : '🚀 شلیک تیکت به دپارتمان'}
          </button>
        </form>
      </div>

      {/* لیست تاریخچه تیکت‌ها */}
      <div className="col-span-1 lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-[24px] border dark:border-slate-800 shadow-xl space-y-4">
        <h3 className="font-black text-slate-800 dark:text-white text-xs border-b pb-2 dark:border-slate-800">🎫 آرشیو و وضعیت تیکت‌های قبلی شما</h3>

        {selectedTicket ? (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border dark:border-slate-800">
              <div>
                <h4 className="font-black text-xs text-indigo-600">📌 موضوع: {selectedTicket.subject}</h4>
                <span className="text-[9px] text-slate-400 block mt-0.5">ثبت: {selectedTicket.created_at || 'امروز'}</span>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md font-bold text-slate-700 dark:text-slate-300 cursor-pointer">← بازگشت</button>
            </div>

            <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border dark:border-slate-800/60">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border dark:border-slate-800">
                <span className="font-black text-slate-400 text-[9px] block mb-1">👤 متن درخواست شما:</span>
                <p className="text-slate-700 dark:text-slate-300 font-bold text-xs">{selectedTicket.description}</p>
              </div>

              {selectedTicket.reply ? (
                <div className="bg-indigo-50/60 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                  <span className="font-black text-indigo-500 text-[9px] block mb-1">🎯 پاسخ پشتیبانی پیشگامان:</span>
                  <p className="text-slate-800 dark:text-slate-200 font-black text-xs leading-relaxed">{selectedTicket.reply}</p>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400 font-bold bg-white dark:bg-slate-900 rounded-xl border border-dashed dark:border-slate-800 animate-pulse">⏳ این تیکت در صف بررسی کارشناسان قرار دارد.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {tickets.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-bold">هیچ تیکتی ثبت نشده است. 🟢</div>
            ) : (
              tickets.map((ticket: any) => (
                <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="p-3 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800/80 rounded-xl flex justify-between items-center group hover:border-indigo-400 transition-all cursor-pointer active:scale-[0.99]">
                  <div>
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs group-hover:text-indigo-600 transition-colors">🎫 {ticket.subject}</h4>
                    <span className="text-[9px] text-slate-400 block mt-0.5">وضعیت: {ticket.status === 'open' ? '⏳ در جریان' : '✔️ پاسخ داده شده'}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black ${ticket.status === 'open' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {ticket.status === 'open' ? '⏳ در صف' : ' رویت پاسخ ←'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}