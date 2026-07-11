import React, { useState, useEffect } from 'react';

interface Client {
  id: number;
  name: string;
  phone?: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  title: string;
  amount: number;
  due_timestamp: number;
  payment_type: 'full' | 'installment';
  status: 'unpaid' | 'pending_review' | 'paid' | 'rejected';
  reject_reason?: string;
  lead_name?: string;
  file_path?: string; // اگر فیش آپلود شده باشه
}

export default function AccountingManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  // استیت‌های فرم صدor فاکتور
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'full' | 'installment'>('full');
  const [installmentsCount, setInstallmentsCount] = useState('2');
  const [gapDays, setGapDays] = useState('30');
  const [shamsiDateStr, setShamsiDateStr] = useState(''); // دریافت تاریخ متنی یا به صورت تایم‌استمپ میلادی از دیت‌پیکر شما

  // استیت رد فیش
  const [rejectReason, setRejectReason] = useState('');
  const [selectedInvoiceForReject, setSelectedInvoiceForReject] = useState<number | null>(null);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // ۱. لود کلاینت‌ها/لیدها برای منوی آبشاری (با اندپوینت فعلی پروژه‌ت ست کن)
      const resLeads = await fetch(`http://${currentHost}:8000/api/staff/leads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataLeads = await resLeads.json();
      if (resLeads.ok) setClients(dataLeads.data || dataLeads);

      // ۲. لود لیست تمام فاکتورها جهت پایش حسابرس
      const resInvoices = await fetch(`http://${currentHost}:8000/api/staff/accounting/invoices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataInvoices = await resInvoices.json();
      if (resInvoices.ok) setInvoices(dataInvoices.data || dataInvoices);
    } catch (e) {
      console.error("خطا در بارگذاری داده‌های مالی", e);
    } finally {
      setLoading(false);
    }
  };

  const convertTimestampToShamsi = (timestamp: number) => {
  if (!timestamp) return '---';
  // تبدیل ثانیه به میلی‌ثانیه
  const date = new Date(timestamp * 1000); 
  return date.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

  // ثبت و صدور ساختار مالی جدید
  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !title || !totalAmount) return alert('لطفاً فیلدهای اجباری را پر کنید رفیق.');

    // تبدیل تاریخ فرانت به تایم‌استمپ عددی ثانیه‌ای (مثال برای تاریخ جاری یا انتخاب شده)
    // اگر کامپوننت تقویم داری، خروجی خروجی عددی‌اش رو بذار، در غیر این صورت زمان حال رو رندوم تبدیل میکنیم:
    const baseTimestamp = Math.floor(Date.now() / 1000); 

    try {
      const res = await fetch(`http://${currentHost}:8000/api/staff/accounting/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          lead_id: parseInt(selectedLeadId),
          title,
          total_amount: parseFloat(totalAmount),
          payment_method: paymentMethod,
          installments_count: paymentMethod === 'installment' ? parseInt(installmentsCount) : null,
          gap_days: paymentMethod === 'installment' ? parseInt(gapDays) : null,
          base_due_timestamp: baseTimestamp
        })
      });

      const json = await res.json();
      if (res.ok) {
        alert('✓ ساختار مالی و فاکتورها با موفقیت صادر و ابلاغ شد رفیق!');
        setTitle('');
        setTotalAmount('');
        loadData();
      } else {
        alert(`⚠️ خطا: ${json.message}`);
      }
    } catch (e) {
      alert('خطا در اتصال به سرور مالی');
    }
  };

  // تایید یا رد فیش واریزی کلاینت
  const handleReviewReceipt = async (id: number, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectReason.trim()) {
      setSelectedInvoiceForReject(id);
      return;
    }

    try {
      const res = await fetch(`http://${currentHost}:8000/api/staff/accounting/review/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          action,
          reject_reason: action === 'reject' ? rejectReason : null
        })
      });

      if (res.ok) {
        alert(action === 'approve' ? '✓ فیش تایید و فاکتور تسویه شد.' : '❌ فیش رد و به کلاینت عودت شد.');
        setRejectReason('');
        setSelectedInvoiceForReject(null);
        loadData();
      }
    } catch (e) {
      alert('خطا در ثبت وضعیت فیش');
    }
  };

  return (
    <div className="p-4 bg-slate-900 min-h-screen text-slate-100 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* راست: فرم هوشمند صدور فاکتور و تقسیط قرارداد */}
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 h-fit shadow-xl">
          <h2 className="text-sm font-bold text-teal-400 mb-4 flex items-center gap-2">
            <span>💳</span> صدور فاکتور و ساختار تقسیط لوکس
          </h2>
          <form onSubmit={handleGenerateInvoice} className="space-y-3 text-[11px]">
            <div>
              <label className="block text-slate-400 mb-1">انتخاب کلاینت / پرونده:</label>
              <select 
                value={selectedLeadId} 
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 p-2 rounded-xl text-white"
              >
                <option value="">-- انتخاب کنید --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">عنوان قرارداد / صورت‌حساب:</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلا: حق‌الوکاله یا پیش‌پرداخت سئو" className="w-full bg-slate-900 border border-slate-700 p-2 rounded-xl text-white"/>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">مبلغ کل (تومان):</label>
              <input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="مبلغ کل صورت‌حساب" className="w-full bg-slate-900 border border-slate-700 p-2 rounded-xl text-white font-mono text-left"/>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">روش پرداخت:</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" checked={paymentMethod === 'full'} onChange={() => setPaymentMethod('full')}/> نقدی / یکباره
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" checked={paymentMethod === 'installment'} onChange={() => setPaymentMethod('installment')}/> اقساطی (تقسیط اتوماتیک)
                </label>
              </div>
            </div>

            {paymentMethod === 'installment' && (
              <div className="grid grid-cols-2 gap-2 bg-slate-900 p-3 rounded-xl border border-slate-700">
                <div>
                  <label className="block text-slate-400 mb-1">تعداد اقساط:</label>
                  <input type="number" value={installmentsCount} onChange={(e) => setInstallmentsCount(e.target.value)} className="w-full bg-slate-800 border border-slate-600 p-1.5 rounded-lg text-center text-white"/>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">فاصله اقساط (روز):</label>
                  <input type="number" value={gapDays} onChange={(e) => setGapDays(e.target.value)} className="w-full bg-slate-800 border border-slate-600 p-1.5 rounded-lg text-center text-white"/>
                </div>
              </div>
            )}

            <button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 font-bold p-2.5 rounded-xl transition-all shadow-lg text-white mt-4">
              🚀 صدور فاکتور و ابلاغ به کارتابل کلاینت
            </button>
          </form>
        </div>

        {/* چپ: جدول مانیتورینگ فاکتورها و پایش فیش‌های دریافتی */}
        <div className="lg:col-span-2 bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-xl">
          <h2 className="text-sm font-bold text-amber-400 mb-4 flex items-center gap-2">
            <span>📊</span> میز پایش فاکتورها و اسناد پرداخت کلاینت‌ها
          </h2>

          <div className="overflow-x-auto text-[11px]">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 bg-slate-900/50">
                  <th className="p-2">شماره فاکتور</th>
                  <th className="p-2">عنوان</th>
                  <th className="p-2">تاریخ سررسید</th><th className="p-2">مبلغ (تومان)</th>
                  <th className="p-2">وضعیت</th>
                  <th className="p-2">اقدامات حسابرس</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-700/50 hover:bg-slate-750 transition">
                    <td className="p-2 font-mono text-slate-300">{inv.invoice_number}</td>
                    <td className="p-2 font-bold">{inv.title}</td>
                    <td className="p-2 font-mono text-slate-300">{convertTimestampToShamsi(inv.due_timestamp)}</td>
                    <td className="p-2 font-mono text-emerald-400">{inv.amount.toLocaleString()}</td>
                    <td className="p-2">
                      {inv.status === 'unpaid' && <span className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full">پرداخت نشده</span>}
                      {inv.status === 'pending_review' && <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full animate-pulse">در انتظار بررسی فیش</span>}
                      {inv.status === 'paid' && <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">✓ تسویه شده</span>}
                      {inv.status === 'rejected' && <span className="bg-slate-600/30 text-slate-400 px-2 py-0.5 rounded-full">مرجوع شده</span>}
                    </td>
                    <td className="p-2 flex gap-1.5 items-center">
                      {inv.status === 'pending_review' && (
                        <>
                          <a href={`http://${currentHost}:8000/storage/${inv.file_path}`} target="_blank" rel="noreferrer" className="bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded-lg">🔍 مشاهده فیش</a>
                          <button onClick={() => handleReviewReceipt(inv.id, 'approve')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded-lg">✓ تایید</button>
                          <button onClick={() => setSelectedInvoiceForReject(inv.id)} className="bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 rounded-lg">❌ رد فیش</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* مودال کوچک درون‌برنامه‌ای جهت ثبت علت رد فیش بانکی */}
          {selectedInvoiceForReject && (
            <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800 rounded-xl">
              <p className="text-[10px] text-rose-300 mb-1">علت رد فیش بانکی کلاینت چیست؟</p>
              <div className="flex gap-2">
                <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="مثلا: مبلغ ناخوانا است یا مغایرت دارد" className="flex-1 bg-slate-900 border border-rose-700 p-1.5 rounded-lg text-[11px] text-white"/>
                <button onClick={() => handleReviewReceipt(selectedInvoiceForReject, 'reject')} className="bg-rose-600 text-white text-[11px] px-3 py-1 rounded-lg font-bold">ثبت رد نهایی</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}