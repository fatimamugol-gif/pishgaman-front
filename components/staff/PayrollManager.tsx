// components/staff/PayrollManager.tsx
'use client';

import React, { useEffect, useState } from 'react';

export default function PayrollManager({ usersList, BACKEND_BASE_URL, isSupervisor }: any) {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('1405/04');
  
  // استیت فرم تسویه حساب ادمین
  const [reviewForm, setReviewForm] = useState({ user_id: '', performance_bonus: '0', status: 'pending' });

  const loadPayrollData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/next/payrolls?month_shamsi=${selectedMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.status === 'success') setPayrolls(json.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { loadPayrollData(); }, [selectedMonth]);

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_BASE_URL}/api/next/payrolls`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: parseInt(reviewForm.user_id),
        month_shamsi: selectedMonth,
        performance_bonus: parseInt(reviewForm.performance_bonus || '0'),
        status: reviewForm.status
      })
    });
    if (res.ok) {
      alert('✓ فیش مالی و وضعیت تسویه حساب کیف پول با موفقیت ثبت شد.');
      setReviewForm({ user_id: '', performance_bonus: '0', status: 'pending' });
      loadPayrollData();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const formatHoursText = (totalSeconds: number) => {
    if (!totalSeconds) return '۰ ساعت';
    const hrs = Math.floor(totalSeconds / 3600);
    return `${hrs} ساعت مفید`;
  };

  if (loading) return <div className="text-center p-6 text-slate-400">⏳ در حال بازخوانی کیف پول و کورتکس مالی...</div>;

  return (
    <div className="space-y-6 text-right font-sans text-[11px]" dir="rtl">
      
      {/* هدر فیلتر انحصاری ماه */}
      <div className="bg-white p-4 rounded-2xl border flex justify-between items-center gap-4">
        <div>
          <h4 className="text-xs font-black text-slate-800">💳 هاب خودکار محاسبات مالی و تسویه کیف پول</h4>
          <p className="text-slate-400 text-[9px] mt-0.5">محاسبه هوشمند حقوق دریافتی روزانه بر پایه کسر کارکرد از مرز ۸ ساعت کار مفید</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500">انتخاب دوره محاسباتی:</span>
          <input type="text" className="p-2 border rounded-xl bg-slate-50 text-center font-mono font-bold text-xs outline-none" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* فرم مدیریت ادمین: تخصیص کارانه + کلید تسویه آخر ماه */}
        {isSupervisor ? (
          <form onSubmit={handleSettleSubmit} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-2xs space-y-3 h-fit animate-fadeIn">
            <h3 className="text-xs font-black text-slate-800">💳 کارتابل پلمب و تسویه حساب کیف پول پرسنل</h3>
            
            <div>
              <label className="block font-bold text-slate-600 mb-1">💼 انتخاب کارمند:</label>
              <select className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold text-indigo-600 outline-none cursor-pointer" value={reviewForm.user_id} onChange={e => setReviewForm({ ...reviewForm, user_id: e.target.value })} required>
                <option value="">انتخاب کارمند جهت تسویه حساب...</option>
                {usersList.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl space-y-1">
              <label className="block font-black text-amber-800">💎 کارانه تشویقی مصوب دوره:</label>
              <input type="number" className="w-full p-2 border border-amber-200 rounded-lg text-center font-mono font-bold text-slate-800 outline-none" value={reviewForm.performance_bonus} onChange={e => setReviewForm({ ...reviewForm, performance_bonus: e.target.value })} />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">دستور نهایی وضعیت پرداخت:</label>
              <select className="w-full p-2 border rounded-xl bg-slate-50 font-bold cursor-pointer" value={reviewForm.status} onChange={e => setReviewForm({ ...reviewForm, status: e.target.value })}>
                <option value="pending">⏳ تایید اولیه محاسبات خودکار سیستم</option>
                <option value="approved">✔️ تایید نهایی سند و انتقال به صف حسابداری</option>
                <option value="paid">💳 تسویه شد (واریز قطعی وجه و صفر کردن کیف پول)</option>
              </select>
            </div>

            <button type="submit" className="w-full bg-slate-900 text-white font-black py-2.5 rounded-xl text-xs cursor-pointer hover:bg-slate-950 transition-all">🔏 قفل فیش و تایید تسویه حساب</button>
          </form>
        ) : (
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-5 rounded-[24px] border border-slate-950 h-fit space-y-3">
            <h3 className="text-xs font-black text-amber-400">👛 وضعیت کیف پول اعتباری شما</h3>
            <p className="text-slate-300 leading-relaxed text-[10px] font-medium">حقوق شما روزانه بر اساس ثانیه‌های حضور مکرر ثبت شده در تب تردد محاسبه می‌شود. در صورت حضور کمتر از ۸ ساعت در روز، سیستم به صورت اتوماتیک مبلغ کسر کار را محاسبه کرده و در فیش زیر اعمال می‌کند. انتهای ماه پس از ثبت وضعیت «واریز شد» توسط ادمین، مبلغ کیف پول تسویه می‌گردد.</p>
          </div>
        )}

        {/* جدول فیش‌های حقوقی صادر شده مجهز به کسر کار خودکار */}
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-2xs lg:col-span-2 space-y-3 animate-fadeIn">
          <h4 className="text-xs font-black text-slate-800">📋 لیست فیش‌های صادر شده دوره محاسباتی</h4>
          <div className="overflow-x-auto border rounded-xl max-h-[300px] overflow-y-auto">
            <table className="w-full text-right border-collapse whitespace-nowrap">
              <thead className="bg-slate-950 text-white text-[10px]">
                <tr>
                  <th className="p-2.5">نام پرسنل</th>
                  <th className="p-2.5 text-center">حضور کل ماه</th>
                  <th className="p-2.5 text-center">حقوق کارکرد</th>
                  <th className="p-2.5 text-center bg-amber-950 text-amber-300">💎 کارانه</th>
                  <th className="p-2.5 text-center text-rose-500 font-bold">❌ جریمه کسرکار</th>
                  <th className="p-2.5 text-center bg-indigo-900">خالص دریافتی کیف پول</th>
                  <th className="p-2.5 text-center">وضعیت تسویه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[10px] text-slate-600 font-medium">
                {payrolls.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 h-10 transition-colors">
                    <td className="p-2.5 font-black text-slate-900">{p.user_name}</td>
                    <td className="p-2.5 text-center font-mono font-bold text-indigo-600">{formatHoursText(p.total_worked_seconds)}</td>
                    <td className="p-2.5 text-center font-mono">{formatCurrency(p.base_salary)}</td>
                    <td className="p-2.5 text-center font-mono text-amber-700 bg-amber-50/30 font-black">{formatCurrency(p.performance_bonus)}</td>
                    <td className="p-2.5 text-center font-mono text-rose-600 font-bold">{formatCurrency(p.deductions)}</td>
                    <td className="p-2.5 text-center font-mono font-black bg-indigo-50/40 text-indigo-950">{formatCurrency(p.final_payable)}</td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded font-black ${
                        p.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        p.status === 'approved' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {p.status === 'paid' ? '💳 تسویه شد' : p.status === 'approved' ? '✔️ مصوب' : '⏳ معلق'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}