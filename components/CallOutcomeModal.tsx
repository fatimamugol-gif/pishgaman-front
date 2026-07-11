'use client';
import React, { useState } from 'react';

export default function CallOutcomeModal({ lead, taskId, onClose, onSuccess }: any) {
  const [outcome, setOutcome] = useState('consultation');
  const [persona, setPersona] = useState('Goal-Oriented');
  const [reqDate, setReqDate] = useState('');
  const [reqTime, setReqTime] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  const BACKEND_BASE_URL = `http://${currentHost}:8000`; // خودکار آی‌پی سیستم شما را پورت ۸۰۰۰ جفت می‌کند

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token');

    let finalOutcome = outcome;
    if (outcome === 'not_convenient') {
      finalOutcome = reqDate && reqTime ? 'not_convenient_has_time' : 'not_convenient_no_time';
    }

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/next/leads/call-outcome`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          task_id: taskId,
          outcome: finalOutcome,
          persona: persona,
          requested_date: reqDate,
          requested_time: reqTime,
          next_step_note: `[اقدام بعدی: ${nextStep}] - یادداشت: ${note}`
        })
      });
      if (res.ok) {
        alert('✅ تسک بسته شد و فالوآپ بعدی با موفقیت در سیستم زمان‌بندی شد.');
        onSuccess();
        onClose();
      }
    } catch (err) {
      alert('خطا در ثبت نتیجه');
    } finally {
      setLoading(false);
    }
  };

  const handleLiveClickToDial = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/next/voip/click-to-dial`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_phone: lead.phone,
          lead_id: lead.id
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert('☎️ ' + data.message);
      } else {
        alert('❌ ' + data.message);
      }
    } catch (err) {
      alert('خطا در شلیک دستور به AMI آستریسک');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
      {/* کانتینر اصلی مجهز به امضای لبه فوق گرد Jaida UI و دو تم پذیری کامل */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 font-sans text-[11px] transition-colors duration-300">

        {/* هدر پاپ‌آ‌پ */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">📞 ثبت وضعیت‌سنجی تماس (Follow-up)</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">پرونده: <span className="font-bold text-indigo-600 dark:text-indigo-400">{lead.name}</span> | تلفن: <span className="font-mono dark:text-slate-300">{lead.phone}</span></p>
          </div>
          <button type="button" onClick={onClose} className="w-6 h-6 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-bold transition-colors cursor-pointer">×</button>
        </div>

        {/* بدنه فرم */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* ردیف انتخاب نتیجه تماس (Outcome) */}
          <div className="bg-slate-50/60 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <label className="font-bold text-slate-700 dark:text-slate-300">نتیجه تماس (Outcome):</label>
            <div className="flex gap-3 select-none">
              <label className="flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold"><input type="radio" name="outcome" checked={outcome === 'no_answer'} onChange={() => setOutcome('no_answer')} className="accent-rose-500" /> 🚫 عدم پاسخگویی</label>
              <label className="flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold"><input type="radio" name="outcome" checked={outcome === 'not_convenient'} onChange={() => setOutcome('not_convenient')} className="accent-amber-500" /> ⏳ مساعد نبودن</label>
              <label className="flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/60 text-[10px] font-bold"><input type="radio" name="outcome" checked={outcome === 'consultation'} onChange={() => setOutcome('consultation')} className="accent-indigo-600" /> 🗣️ مشاوره (پرسونا)</label>
            </div>
          </div>

          {/* فیلدهای پویا وابسته به انتخاب بازه یا پرسونا */}
          <div className="grid grid-cols-2 gap-4">
            {outcome === 'not_convenient' && (
              <>
                <label className="block font-bold text-slate-600 dark:text-slate-400">تاریخ درخواستی مشتری:
                  <input type="text" className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-mono text-center outline-none" placeholder="1405/03/25" value={reqDate} onChange={e => setReqDate(e.target.value)} />
                </label>
                <label className="block font-bold text-slate-600 dark:text-slate-400">ساعت درخواستی:
                  <input type="time" className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-mono text-center outline-none" value={reqTime} onChange={e => setReqTime(e.target.value)} />
                </label>
              </>
            )}

            {outcome === 'consultation' && (
              <label className="col-span-2 block font-bold text-slate-600 dark:text-slate-400">
                تشخیص تیپ شخصیتی (Persona):
                <select className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 outline-none font-bold cursor-pointer" value={persona} onChange={e => setPersona(e.target.value)}>
                  <option value="Goal-Oriented" className="dark:bg-slate-900 dark:text-slate-100">هدف‌گرا (Goal Oriented) - سریع</option>
                  <option value="Analytical" className="dark:bg-slate-900 dark:text-slate-100">تحلیلی (Analytical) - مستندات و مقایسه</option>
                  <option value="Safety-Oriented" className="dark:bg-slate-900 dark:text-slate-100">امنیت‌محور (Safety Oriented) - ضمانت</option>
                  <option value="Explorer" className="dark:bg-slate-900 dark:text-slate-100">کاوش‌گر (Explorer) - تنوع طلب</option>
                  <option value="Skeptic" className="dark:bg-slate-900 dark:text-slate-100">شکاک (Skeptic) - نیازمند شواهد</option>
                  <option value="Budget-Conscious" className="dark:bg-slate-900 dark:text-slate-100">حساس به هزینه (Budget-Conscious)</option>
                  <option value="Family-First" className="dark:bg-slate-900 dark:text-slate-100">خانواده‌محور (Family-First)</option>
                  <option value="Fast-Track" className="dark:bg-slate-900 dark:text-slate-100">فوری/عجول (Fast-Track)</option>
                  <option value="Undecided/Passive" className="dark:bg-slate-900 dark:text-slate-100">بلاتکلیف (Undecided/Passive)</option>
                  <option value="Opportunity-Driven" className="dark:bg-slate-900 dark:text-slate-100">فرصت‌محور (Opportunity-Driven)</option>
                  <option value="Case-Study-Seeker" className="dark:bg-slate-900 dark:text-slate-100">کیس استادی (Case Study Seeker)</option>
                </select>
              </label>
            )}
          </div>

          <label className="block font-bold text-slate-600 dark:text-slate-400">گام بعدی (Next Step):
            <input type="text" className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none font-medium" placeholder="برای تماس بعدی چه چیزی پیگیری شود؟" value={nextStep} onChange={e => setNextStep(e.target.value)} required={outcome === 'consultation'} />
          </label>

          <label className="block font-bold text-slate-600 dark:text-slate-400">یادداشت گزارش مشاوره (Note):
            <textarea rows={3} className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none leading-relaxed font-medium" placeholder="خلاصه مکالمات و نیازمندی‌ها..." value={note} onChange={e => setNote(e.target.value)}></textarea>
          </label>

          {/* 🎯 فوتر پاپ‌آ‌پ */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between items-center select-none">
            
            {/* سمت راست: دکمه‌های عملیاتی اصلی */}
            <div className="flex gap-2">
              <button 
                type="submit" 
                disabled={loading} 
                className="bg-indigo-900 dark:bg-indigo-600 hover:bg-indigo-950 dark:hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer text-xs"
              >
                {loading ? '⏳ در حال پردازش...' : 'Submit Outcome 💾'}
              </button>
              
              <button 
                type="button" 
                onClick={handleLiveClickToDial}
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer text-xs"
              >
                <span>📞</span> Call (dispatch)
              </button>
              
              <button 
                type="button" 
                onClick={() => window.open(`/dashboard/leads`, '_blank')}
                className="bg-purple-100 dark:bg-purple-950/40 hover:bg-purple-200 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-400 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer text-xs"
              >
                Open Lead ↗️
              </button>
            </div>

            {/* سمت چپ: دکمه خروج/بستن مستقل */}
            <button 
              type="button" 
              onClick={onClose} 
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer text-xs"
            >
              بستن
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}