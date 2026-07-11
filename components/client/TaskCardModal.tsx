// components/client/TaskCardModal.tsx
'use client';

import React, { useState } from 'react';

interface TaskCardModalProps {
  selectedTask: any;
  onClose: () => void;
  taskComments: Record<number, any[]>;
  commentInputs: Record<number, string>;
  setCommentInputs: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  handleSendComment: (taskId: number) => Promise<void>;
}

export default function TaskCardModal({
  selectedTask,
  onClose,
  taskComments,
  commentInputs,
  setCommentInputs,
  handleSendComment
}: TaskCardModalProps) {
  
  const [uploadingFile, setUploadFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureText, setSignatureText] = useState('');
  const [isAgreed, setIsApproveCheckbox] = useState(false);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';

  // متد تایید ابلاغیه مشروط سندی
  const handleApproveDocTask = async () => {
    if (!isAgreed) return alert('لطفاً ابتدا تیک تایید صحت و دریافت سند را ثبت فرمایید.');
    if (signatureText.trim() !== 'تایید می کنم') return alert('لطفاً عبارت «تایید می‌کنم» را دقیقاً تایپ کنید.');

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://${currentHost}:8000/api/client-portal/tasks/${selectedTask.id}/complete`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        alert('🔏 ابلاغیه رسمی با موفقیت امضا، تایید دریافت و قفل فایل باز گردید!');
        onClose();
        window.location.reload();
      }
    } catch (e) { console.error(e); } finally { setIsSubmitting(false); }
  };

  // متد ارسال فیش یا پاسخ برای تسک‌های عادی کارتابل
  const handleUploadAnswer = async () => {
    if (!uploadingFile) return alert('لطفاً ابتدا فایل پاسخ خود را انتخاب کنید.');
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', uploadingFile, uploadingFile.name);

      const res = await fetch(`http://${currentHost}:8000/api/client-portal/tasks/${selectedTask.id}/answer`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: formData
      });

      if (res.ok) {
        alert('✓ پاسخ شما با موفقیت تسلیم کارشناس ارشد پرونده شد.');
        onClose();
        window.location.reload();
      }
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const isSignatureValid = isAgreed && signatureText.trim() === 'تایید می کنم';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn text-right" dir="rtl">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[28px] border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* هدر مودال بازرس */}
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-black text-xs text-slate-900">🔍 بازرس هوشمند اقدام: {selectedTask.task_title}</h3>
            <p className="text-[9px] text-slate-400 mt-0.5">شناسه: #{selectedTask.id} | وضعیت: {selectedTask.status === 'done' ? '✓ تکمیل شده' : '⏳ معلق'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer">✖ بستن</button>
        </div>

        {/* بدنه اطلاعاتی */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-[11px]">
          
          <div className="grid grid-cols-2 gap-3 text-center text-[10px] font-bold">
            <div className="p-2 bg-slate-50 rounded-xl border">
              <span className="text-slate-400 block">📅 مهلت نهایی ددلاین</span>
              <span className="text-rose-600 font-mono mt-1 block">{selectedTask.due_date_shamsi || '---'}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border">
              <span className="text-slate-400 block">⚙️ ساختار اقدام</span>
              {/* 🎯 سوئیچ لایو برچسب مودال هوشمند با مچ شدن بر روی فیلد جدید */}
              <span className={selectedTask.global_doc_id ? "text-amber-600 mt-1 block" : "text-indigo-600 mt-1 block"}>
                {selectedTask.global_doc_id ? '🔏 سند رسمی ابلاغی مشروط' : '🎯 وظیفه کارتابلی عادی'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border rounded-xl leading-relaxed">
            <strong className="block text-[10px] text-slate-700 mb-1">📝 شرح کارشناس ارشد پرونده:</strong>
            <p className="text-slate-600">{selectedTask.description || 'توضیحات تکمیلی ثبت نشده است.'}</p>
          </div>

          {/* رندر تفکیکی بر اساس فیلد داده‌ای منتقل شده از لاراول */}
          {selectedTask.status !== 'done' ? (
            selectedTask.global_doc_id ? (
              /* 🔏 باکس نمایش امضای دیجیتال برای کارت‌هایی که از بخش اشتراک اسناد عمومی صادر شده‌اند */
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-3">
                <strong className="block text-[11px] text-amber-950 font-black">🖋️ هاب امضا و تعهدنامه الکترونیک دریافت سند:</strong>
                
                <div className="space-y-2 bg-white p-3 rounded-xl border border-amber-100">
                  <label className="flex items-center gap-2 font-bold cursor-pointer select-none text-slate-700">
                    <input type="checkbox" checked={isAgreed} onChange={(e) => setIsApproveCheckbox(e.target.checked)} className="rounded text-amber-500 cursor-pointer" />
                    اینجانب صحت دریافت، مطالعه و رویت مفاد فایل ابلاغی را کاملاً تایید می‌نمایم.
                  </label>

                  <div className="pt-2 border-t border-dashed border-amber-100">
                    <label className="block text-slate-500 text-[10px] mb-1">جهت تایید نهایی، عبارت <strong className="text-amber-700">"تایید می‌کنم"</strong> را در باکس زیر تایپ فرمایید:</label>
                    <input 
                      type="text" 
                      value={signatureText} 
                      onChange={(e) => setSignatureText(e.target.value)}
                      placeholder="تایید می کنم"
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-400 text-center font-black"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={handleApproveDocTask}
                    disabled={isSubmitting || !isSignatureValid}
                    className={`font-black px-5 py-2 rounded-xl text-[10px] transition-all shadow-md ${isSignatureValid ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                  >
                    {isSubmitting ? '⏳ ثبت رسید دیجیتال...' : '🔏 تایید تیک دریافت و باز کردن قفل فایل'}
                  </button>
                </div>
              </div>
            ) : (
              /* 📤 باکس نمایش فرم آپلود فیش/مدارک برای تسک‌های اجرایی عادی */
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-2">
                <strong className="block text-[10px] text-indigo-950">📤 پیوست اسناد پاسخ یا فیش پرداختی برای وظیفه کارتابل:</strong>
                <div className="flex gap-2">
                  <input type="file" onChange={(e) => { if (e.target.files) setUploadFile(e.target.files[0]); }} className="flex-1 p-1 bg-white border rounded-lg text-[10px]" />
                  <button onClick={handleUploadAnswer} disabled={isSubmitting} className="bg-indigo-600 text-white font-black px-4 py-1.5 rounded-lg text-[10px] hover:bg-indigo-700 transition-colors">
                    {isSubmitting ? '⏳ ارسال...' : 'ارسال مدرک پاسخ ✓'}
                  </button>
                </div>
              </div>
            )
          ) : (
            /* 🎯 نمایش فیکس شده وضعیت امضا (مطابق ساختار تصویر image_fb3580.png) */
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 font-bold text-[10px] text-center select-none animate-fadeIn">
              ✓ این ابلاغیه با موفقیت تایید، امضا و آرشیو شده است و قفل دانلود فایل در دشبورد شما باز گردید.
            </div>
          )}

          {/* کامنت لاگ */}
          <div className="space-y-2 border-t pt-3">
            <span className="block font-black text-slate-700 text-[10px]">💬 گفتگو روی این کارت ({taskComments[selectedTask.id]?.length || 0})</span>
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto bg-slate-50/50 p-2 rounded-xl">
              {taskComments[selectedTask.id]?.length === 0 ? (
                <div className="text-center text-slate-400 py-4 font-bold text-[10px]">پیامی ثبت نشده است.</div>
              ) : (
                taskComments[selectedTask.id]?.map((comm: any, cIdx: number) => (
                  <div key={cIdx} className="p-2 bg-white rounded-lg border text-[10px] flex justify-between font-bold shadow-2xs">
                    <span className="text-slate-700"><strong className="text-indigo-600">{comm.sender_name}:</strong> {comm.comment}</span>
                    <span className="text-slate-400 font-mono text-[9px]">{new Date(comm.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={commentInputs[selectedTask.id] || ''}
                onChange={(e) => setCommentInputs(prev => ({ ...prev, [selectedTask.id]: e.target.value }))}
                placeholder="یادداشت خود را بنویسید..."
                className="flex-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs outline-none focus:border-indigo-400"
              />
              <button onClick={async () => { await handleSendComment(selectedTask.id); }} className="bg-slate-900 text-white font-black px-4 rounded-xl text-xs hover:bg-slate-800 transition-all">ارسال</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}