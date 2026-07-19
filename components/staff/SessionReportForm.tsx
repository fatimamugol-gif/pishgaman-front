'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';

interface SessionReportFormProps {
  reportId: number;
  initialData: {
    client_name: string;
    initial_agent_name: string;
    initial_agent_id?: number | string | null;
    senior_consultant_name: string;
    senior_agent_id?: number | string | null;
    deadline_at: string;
  };
  onSuccess: () => void;
}

export default function SessionReportForm({ reportId, initialData, onSuccess }: SessionReportFormProps) {
  const [formData, setFormData] = useState({
    target_plan: '',
    special_conditions: '',
    strengths: '',
    weaknesses: '',
    client_questions: '',
    previous_actions: '',
    session_outcome: '',
    next_session_documents: '',
    senior_consultant_opinion: '',
    delay_reason: '',
  });
  const BACKEND_BASE_URL = API_BASE_URL;

  const [isSpouseBetter, setIsSpouseBetter] = useState<boolean>(false);
  const [spouseName, setSpouseName] = useState<string>('');
  const [spousePhone, setSpousePhone] = useState<string>('');
  // 🎯 آپشن‌های قابل سلکت برای پلن‌های توصیه شده مشاور عالی
  const availablePlans = [
    'ویزای کاری (Job Offer)', 'ویزای جستجوی کار', 'آوسبیلدونگ تخصصی',
    'مهاجرت تحصیلی (دانشگاهی)', 'سرمایه‌گذاری و ثبت شرکت', 'ویزای جاب‌سیکر',
    'بلوکارت آلمان', 'کارت شانس (Chancenkarte)'
  ];
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);

  const [timeLeft, setTimeLeft] = useState<string>('02:00:00');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [showReasonInput, setShowReasonInput] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(initialData.deadline_at) - +new Date();
      if (difference <= 0) {
        setTimeLeft('00:00:00');
        setIsExpired(true);
        setShowReasonInput(true); // 🚨 باز شدن خودکار کادر علت تاخیر به محض اتمام تایمر
        return;
      }
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
      const minutes = Math.floor((difference / 1000 / 60) % 60).toString().padStart(2, '0');
      const seconds = Math.floor((difference / 1000) % 60).toString().padStart(2, '0');
      setTimeLeft(`${hours}:${minutes}:${seconds}`);
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, [initialData.deadline_at]);

  const handlePlanToggle = (plan: string) => {
    if (selectedPlans.includes(plan)) {
      setSelectedPlans(selectedPlans.filter(p => p !== plan));
    } else {
      setSelectedPlans([...selectedPlans, plan]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ۱. چک کردن ددلاین (باید قبل از هر کاری انجام شود)
    if (isExpired && !formData.delay_reason) {
      alert('⚠️ ددلاین تمام شده! ثبت فرم منوط به مکتوب کردن علت تاخیر است.');
      return;
    }

    // ۲. چک کردن انتخاب پلن
    if (selectedPlans.length === 0) {
      alert('⚠️ لطفاً حداقل یکی از پلن‌های توصیه شده را سلکت کنید.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // ۳. ساخت پِی‌لود نهایی
      const payload = {
        ...formData,
        recommended_plans: selectedPlans.join(' | '),
        is_spouse_better: isSpouseBetter,
        spouse_name: isSpouseBetter ? spouseName : null,
        spouse_phone: isSpouseBetter ? spousePhone : null,

        // 🎯 ارسال امن آیدی‌ها به بک‌اِند
        initial_agent_id: initialData.initial_agent_id,
        senior_agent_id: initialData.senior_agent_id,
      };

      const res = await fetch(`${BACKEND_BASE_URL}/next/session-report/submit/${reportId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || 'ثبت با موفقیت انجام شد');
        onSuccess();
      } else if (data.status === 'require_reason') {
        setShowReasonInput(true);
        alert(data.message);
      } else {
        alert(data.message || 'خطا در ثبت اطلاعات');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      alert('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-[24px] text-right font-sans text-[11px] text-[#2d3748]" dir="rtl">

      {/* هدر مجهز به تایمر معکوس اتمیک */}
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <div>
          <h2 className="text-sm font-black text-slate-900">👑 فرم ارزیابی زنده جلسه (مبنا: زمان اتمام مشاوره عالی)</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">ساعت ورود و ساعت ثبت نهایی این فرم در دژ نظارتی سوپروایزر پلمب خواهد شد.</p>
        </div>
        <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 font-mono font-bold ${isExpired ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-slate-900 text-emerald-400'}`}>
          <span className="text-[9px] font-sans text-slate-400">تایمر معکوس ناظر:</span>
          <span className="text-sm tracking-widest">{timeLeft}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 font-bold">

        {/* کادر اخطار و علت تاخیر اضطراری */}
        {showReasonInput && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-[10px] space-y-2 animate-fadeIn">
            <div className="font-black text-rose-600">🚨 هشدار: مهلت زمان قانونی ۲ ساعته شما به اتمام رسیده است!</div>
            <label className="block text-slate-700">تکمیل فرم تنها با لایروبی علت تاخیر و ارائه ادله برای ناظر ارشد سیستم آزاد می‌شود:</label>
            <input type="text" required className="w-full p-2 bg-white border border-amber-300 rounded-lg outline-none font-bold" placeholder="مثال: قطعی اینترنت لوکال شرکت / طولانی شدن زمان جلسه و امضای فوری پیش‌قرارداد..." value={formData.delay_reason} onChange={e => setFormData({ ...formData, delay_reason: e.target.value })} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-500 mb-1">🎯 پلن مد نظر متقاضی:</label>
            <input type="text" required className="w-full p-2 border rounded-xl bg-slate-50 outline-none focus:border-indigo-500" placeholder="مثلاً: جاب آفر مهندسی مکانیک" value={formData.target_plan} onChange={e => setFormData({ ...formData, target_plan: e.target.value })} />
          </div>

          {/* 🎯 بخش گزینه‌های قابل سلکت برای پلن‌های توصیه شده */}
          <div>
            <label className="block text-slate-500 mb-1">💡 پلن‌های توصیه شده مشاور عالی (انتخاب چندگانه):</label>
            <div className="flex flex-wrap gap-1.5 p-2 border rounded-xl bg-slate-50 max-h-[75px] overflow-y-auto">
              {availablePlans.map(plan => {
                const isSelected = selectedPlans.includes(plan);
                return (
                  <button type="button" key={plan} onClick={() => handlePlanToggle(plan)} className={`px-2 py-1 rounded-md text-[9px] font-black transition-all cursor-pointer ${isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>
                    {isSelected ? '✓ ' : ''}{plan}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* سایر فیلدهای متنی غنی فرم شما */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-500 mb-1">🩺 شرایط خاص متقاضی:</label>
            <textarea required rows={2} className="w-full p-2 border rounded-xl bg-slate-50 outline-none resize-none" value={formData.special_conditions} onChange={e => setFormData({ ...formData, special_conditions: e.target.value })} />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">⚡ اقدامات قبلی متقاضی:</label>
            <textarea required rows={2} className="w-full p-2 border rounded-xl bg-slate-50 outline-none resize-none" value={formData.previous_actions} onChange={e => setFormData({ ...formData, previous_actions: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-500 mb-1">📈 نقاط قوت متقاضی:</label>
            <textarea required rows={2} className="w-full p-2 border rounded-xl bg-slate-50 outline-none resize-none" value={formData.strengths} onChange={e => setFormData({ ...formData, strengths: e.target.value })} />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">📉 نقاط ضعف متقاضی:</label>
            <textarea required rows={2} className="w-full p-2 border rounded-xl bg-slate-50 outline-none resize-none" value={formData.weaknesses} onChange={e => setFormData({ ...formData, weaknesses: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-500 mb-1">❓ سوالات و ابهامات کلیدی کلاینت:</label>
            <textarea required rows={2} className="w-full p-2 border rounded-xl bg-slate-50 outline-none resize-none" value={formData.client_questions} onChange={e => setFormData({ ...formData, client_questions: e.target.value })} />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">📊 نتیجه نهایی جلسه حضوری:</label>
            <textarea required rows={2} className="w-full p-2 border rounded-xl bg-slate-50 outline-none resize-none" value={formData.session_outcome} onChange={e => setFormData({ ...formData, session_outcome: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-500 mb-1">📂 مدارک مورد نیاز برای جلسه بعد:</label>
            <textarea required rows={2} className="w-full p-2 border rounded-xl bg-slate-50 outline-none resize-none" value={formData.next_session_documents} onChange={e => setFormData({ ...formData, next_session_documents: e.target.value })} />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">🧠 نظر کارشناسی و تحلیل نهایی مشاور عالی:</label>
            <textarea required rows={2} className="w-full p-2 border rounded-xl bg-slate-50 outline-none resize-none" value={formData.senior_consultant_opinion} onChange={e => setFormData({ ...formData, senior_consultant_opinion: e.target.value })} />
          </div>
        </div>

        {/* ================= 🔄 ماژول سوئیچ هوشمند به کیس همسر ================= */}
        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl text-[10px] space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="spouseToggle"
              className="w-4 h-4 cursor-pointer accent-indigo-600"
              checked={isSpouseBetter}
              onChange={(e) => setIsSpouseBetter(e.target.checked)}
            />
            <label htmlFor="spouseToggle" className="font-black text-indigo-950 cursor-pointer text-xs select-none">
              🔄 موقعیت و رزومه همسر متقاضی برای مهاجرت مناسب‌تر است (ساخت لید موازی خودکار)
            </label>
          </div>

          {isSpouseBetter && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px] animate-scaleIn">
              <div>
                <label className="block text-slate-500 mb-1">👤 نام و نام خانوادگی همسر:</label>
                <input
                  type="text"
                  required={isSpouseBetter}
                  className="w-full p-2 bg-white border rounded-lg outline-none focus:border-indigo-500 font-bold"
                  placeholder="مثال: علیرضا حسینی"
                  value={spouseName}
                  onChange={e => setSpouseName(e.target.value)} // 💎 پلمب مستقیم استیت فرانت
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">📱 شماره تلفن همراه همسر:</label>
                <input
                  type="text"
                  required={isSpouseBetter}
                  className="w-full p-2 bg-white border rounded-lg text-center font-mono outline-none focus:border-indigo-500 font-bold"
                  placeholder="09123456789"
                  value={spousePhone}
                  onChange={e => setSpousePhone(e.target.value)} // 💎 پلمب مستقیم استیت فرانت
                />
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className={`w-full py-2.5 rounded-xl font-black text-center text-xs text-white transition-all shadow-md cursor-pointer ${isExpired ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
          {loading ? '⏳ در حال پلمب اطلاعات در کارتابل پیشگامان...' : isExpired ? '⚠️ ثبت گزارش جلسه حضوری با درج علت تاخیر' : '🚀 ثبت و قفل نهایی فرم ارزیابی'}
        </button>
      </form>
    </div>
  );
}
