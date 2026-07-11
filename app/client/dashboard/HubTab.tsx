// components/client/HubTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import GanttChart from '@/components/client/GanttChart';
import TaskCardModal from '@/components/client/TaskCardModal';

interface HubTabProps {
  tasks: any[];
  invoices: any[];
  taskComments: Record<number, any[]>;
  commentInputs: Record<number, string>;
  setCommentInputs: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  handleSendComment: (taskId: number) => Promise<void>;
  setActiveTab: (tab: any) => void;
}

export default function HubTab({
  tasks,
  invoices,
  taskComments,
  commentInputs,
  setCommentInputs,
  handleSendComment,
  setActiveTab
}: HubTabProps) {

  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [sharedDocs, setSharedDocs] = useState<any[]>([]);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';

  useEffect(() => {
    fetchSharedDocuments();
  }, []);

  // 🎯 مبدل اتمیک تایم‌استمپ عددی سرور به تاریخ لوکس شمسی
  const convertTimestampToShamsi = (timestamp: number) => {
    if (!timestamp) return '---';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // 🎯 تابع اتصال به درگاه آنلاین هوشمند کلاینت با پشتیبانی از چند درگاه
  const handleOnlinePayment = async (invoiceId: number, gatewayName: 'zarinpal' | 'nextpay') => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://${currentHost}:8000/api/client-portal/invoices/${invoiceId}/online-pay`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ gateway: gatewayName }) // 🎯 ارسال داینامیک نام درگاه به لاراول
      });
      const json = await res.json();
      if (res.ok && json.payment_url) {
        window.location.href = json.payment_url;
      } else {
        alert(json.message || 'خطا در اتصال به درگاه');
      }
    } catch (e) {
      alert('خطا در بارگذاری درگاه بانک');
    }
  };
  // 📤 تابع آپلود مستقیم فیش بانکی کلاینت
  const handleUploadReceiptFile = async (invoiceId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://${currentHost}:8000/api/client-portal/invoices/${invoiceId}/upload-receipt`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: formData
      });
      const json = await res.json();
      if (res.ok) {
        alert('✓ فیش شما با موفقیت برای حسابرس ارسال شد.');
        window.location.reload();
      }
    } catch (e) {
      alert('خطا در آپلود سند فیش');
    }
  };

  const fetchSharedDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://${currentHost}:8000/api/client-portal/shared-documents`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (res.ok) {
        const json = await res.json();
        setSharedDocs(json.data || []);
      }
    } catch (e) {
      console.error("خطا در بارگذاری خزانه مشترک:", e);
    }
  };

  return (
    <div className="space-y-6 text-right animate-fadeIn font-sans text-[11px]" dir="rtl">

      {/* 📊 رندر گانت چارت پیشرفته پروژه */}
      <GanttChart tasks={tasks} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 📋 ستون راست و وسط (طول ۲): اسناد مشروط عمومی و اقدامات */}
        <div className="lg:col-span-2 space-y-4">

          {/* مرکز رویت اسناد قفل‌دار اشتراکی عمومی */}
          <div className="bg-white rounded-[24px] border p-5 shadow-xs space-y-3">
            <div className="border-b pb-3 mb-2 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-800">🔏 مرکز رویت اسناد رسمی و قراردادهای ابلاغی مشروط</h3>
              <span className="text-[8px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-md font-black">گارد امضای الکترونیک</span>
            </div>
            <div className="space-y-2.5">
              {sharedDocs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 font-bold">هنوز هیچ سند رسمی برای شما ابلاغ مشروط نشده است.</div>
              ) : (
                sharedDocs.map((doc) => (
                  <div key={doc.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-slate-300 transition-all">
                    <div>
                      <h4 className="font-black text-slate-900 text-[11px]">📄 {doc.title}</h4>
                      <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                        {doc.is_unlocked ? '🔓 وضعیت: قفل فایل باز شده و آماده بهره‌برداری است.' : '🔒 وضعیت: لینک دانلود مسدود است (ابتدا باید وظیفه مرتبط با آن را در کارتابل پایین تایید کنید)'}
                      </span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      {doc.is_unlocked ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-600 text-white font-black text-[9px] px-4 py-2 rounded-xl shadow-md hover:bg-emerald-700 transition-colors"
                        >
                          📥 دانلود سند آزاد شده
                        </a>
                      ) : (
                        <span className="bg-rose-50 text-rose-600 font-black text-[9px] px-2.5 py-1.5 rounded-xl border border-rose-200 select-none">🔒 فایل قفل است</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* بورد اقدامات جاری متقاضی */}
          <div className="bg-white rounded-[24px] border p-5 shadow-xs">
            <div className="border-b pb-3 mb-4 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-800">📋 بورد اقدامات و تکالیف پرونده شما</h3>
              <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold">جهت مدیریت و ثبت تاییدیه روی کارت کلیک کنید</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-400 font-bold">🎉 کارتابل شما خالی است.</div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 transition-all flex flex-col justify-between group animate-fadeIn"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h4 className="font-black text-slate-900 text-xs group-hover:text-indigo-600 transition-colors">
                          {task.global_doc_id ? '🔏 ابلاغیه سند: ' : '🎯 '} {task.task_title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black shrink-0 ${task.status === 'done' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse'}`}>
                          {task.status === 'done' ? '✓ تایید شد' : task.global_doc_id ? '🔏 نیازمند تایید دریافت' : 'نیازمند اقدام'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-3">{task.description || 'بدون توضیحات تکمیلی...'}</p>
                    </div>

                    <div className="flex justify-between items-center border-t border-dashed pt-2 mt-2 text-[9px] font-bold text-slate-400">
                      <span>🗓️ مهلت: <strong className="font-mono text-slate-600">{task.due_date_shamsi || '---'}</strong></span>
                      <span className={`px-1.5 py-0.5 rounded ${task.priority === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                        {task.priority === 'high' ? '🚨 فوری' : 'عادی'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* 💳 ستون چپ فاکتورهای حسابداری لوکس و هوشمند کلاینت */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-[24px] border p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="border-b pb-3 mb-4 flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-800">💳 وضعیت حسابداری و فاکتورهای شما</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>

              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-0.5">
                {invoices.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 font-bold">هیچ صورت‌حساب مالی صادر نشده است رفیق.</div>
                ) : (
                  /* 🎯 گام اول: سورت کردن فاکتورها از قدیمی‌ترین به جدیدترین برای پیاده‌سازی گارد زنجیره‌ای */
                  [...invoices].sort((a, b) => a.id - b.id).map((inv: any, index: number, sortedArray: any[]) => {
                    
                    // 🎯 گام دوم: بررسی لایو وضعیت پرداخت قسط قبلی در آرایه
                    let isPreviousUnpaid = false;
                    if (index > 0) {
                      const previousInvoice = sortedArray[index - 1];
                      if (previousInvoice.status !== 'paid') {
                        isPreviousUnpaid = true;
                      }
                    }

                    return (
                      <div key={inv.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between shadow-md relative overflow-hidden">
                        
                        {/* افکت لایه قفل روی کارت در صورت عدم رعایت زنجیره پرداخت */}
                        {isPreviousUnpaid && inv.status !== 'paid' && (
                          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] z-10 flex items-center justify-center select-none pointer-events-none">
                            <span className="bg-slate-800/90 text-slate-400 text-[9px] border border-slate-700 px-2 py-1 rounded-lg font-black shadow-lg">
                              🔒 قفل: تسویه قسط قبلی الزامی است
                            </span>
                          </div>
                        )}

                        <div className={isPreviousUnpaid && inv.status !== 'paid' ? "opacity-30 select-none" : ""}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] font-mono text-slate-400">#{inv.invoice_number}</span>
                            {inv.status === 'unpaid' && <span className="bg-rose-500/10 text-rose-400 text-[8px] px-2 py-0.5 rounded-full font-bold">پرداخت نشده</span>}
                            {inv.status === 'pending_review' && <span className="bg-amber-500/10 text-amber-400 text-[8px] px-2 py-0.5 rounded-full font-bold animate-pulse">در انتظار تایید</span>}
                            {inv.status === 'paid' && <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-2 py-0.5 rounded-full font-bold">✓ تسویه شده</span>}
                            {inv.status === 'rejected' && <span className="bg-rose-600/20 text-rose-300 text-[8px] px-2 py-0.5 rounded-full font-bold">برگشت خورده</span>}
                          </div>
                          <h4 className="font-black text-white text-[11px] mb-1">{inv.title}</h4>
                          <span className="text-[9px] text-slate-400 block mb-1">
                            سررسید قسط: <strong className="font-mono text-slate-300">{convertTimestampToShamsi(inv.due_timestamp)}</strong>
                          </span>
                          <p className="text-xs font-mono text-teal-400 font-black">{parseFloat(inv.amount).toLocaleString()} تومان</p>
                          {inv.reject_reason && <p className="text-[9px] text-rose-300 mt-2 bg-rose-950/40 p-1.5 rounded-lg border border-rose-900/30">⚠️ نیاز به اصلاح: {inv.reject_reason}</p>}
                        </div>

                        {inv.status !== 'paid' && inv.status !== 'pending_review' && (
  <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-col gap-1.5 z-20">
    
    {/* ردیف دکمه‌های چنددرگاهی موازی و شیک */}
    <div className="grid grid-cols-2 gap-2">
      <button 
        onClick={() => handleOnlinePayment(inv.id, 'zarinpal')} 
        disabled={isPreviousUnpaid}
        className={`font-black py-1.5 rounded-xl text-[9px] shadow-sm transition-all ${
          isPreviousUnpaid 
            ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' 
            : 'bg-gradient-to-r from-amber-600 to-amber-500 text-white cursor-pointer hover:from-amber-500 hover:to-amber-400'
        }`}
      >
        🟡 درگاه زرین‌پال
      </button>

      <button 
        onClick={() => handleOnlinePayment(inv.id, 'nextpay')} 
        disabled={isPreviousUnpaid}
        className={`font-black py-1.5 rounded-xl text-[9px] shadow-sm transition-all ${
          isPreviousUnpaid 
            ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' 
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white cursor-pointer hover:from-blue-500 hover:to-indigo-500'
        }`}
      >
        🔵 درگاه نکست‌پی
      </button>
    </div>
    
    <div className="relative">
      <label className={`block text-center border py-1 rounded-xl text-[9px] font-black transition ${
        isPreviousUnpaid 
          ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed' 
          : 'text-slate-300 bg-slate-800 border-slate-700 hover:bg-slate-750 cursor-pointer'
      }`}>
        📤 آپلود تصویر فیش واریزی مکتوب
        <input 
          type="file" 
          accept="image/*,application/pdf" 
          className="hidden" 
          disabled={isPreviousUnpaid}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) handleUploadReceiptFile(inv.id, e.target.files[0]);
          }} 
        />
      </label>
    </div>
  </div>
)}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 👑 فراخوانی ماژول تفکیک‌شدهٔ بازرس مستقل کارت تسک کلاینت */}
      {selectedTask && (
        <TaskCardModal
          selectedTask={selectedTask}
          onClose={() => setSelectedTask(null)}
          taskComments={taskComments}
          commentInputs={commentInputs}
          setCommentInputs={setCommentInputs}
          handleSendComment={handleSendComment}
        />
      )}

    </div>
  );
}