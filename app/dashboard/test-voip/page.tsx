'use client';

import React, { useState } from 'react';

export default function TestVoipPage() {
  const [leadId, setLeadId] = useState('');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const BACKEND_URL = `http://${currentHost}:8000/api/next/leads`;

  const handleTestApi = async () => {
    if (!leadId) return alert('لطفاً ابتدا آیدی یک لید را وارد کنید.');
    setLoading(true);
    setApiResponse(null);
    
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${BACKEND_URL}/${leadId}/call-logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      const data = await res.json();
      setApiResponse(data);
    } catch (err: any) {
      setApiResponse({ error: 'عدم برقراری ارتباط با سرور لاراول', details: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-800" dir="rtl">
      <h2 className="text-sm font-black text-emerald-400 mb-2">🧪 اسکریپت رادار و تست اتمیک وب‌سرویس VoIP پیشگامان</h2>
      <p className="text-[11px] text-slate-400 border-b border-slate-800 pb-4 mb-4">
        این ابزار دیتای خام ارسالی از جدول <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-400 font-mono">voip_call_stats</code> بک‌اِند را مانیتور کرده و با ساختار شرطی فرانت تطبیق می‌دهد.
      </p>

      <div className="flex gap-2 max-w-sm mb-6">
        <input 
          type="number" 
          placeholder="آیدی لید مورد نظر (مثلاً 5)..." 
          className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs w-full text-center font-mono focus:outline-none font-bold text-white"
          value={leadId}
          onChange={e => setLeadId(e.target.value)}
        />
        <button 
          onClick={handleTestApi}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 font-bold px-5 py-2.5 text-xs rounded-xl transition-all whitespace-nowrap disabled:opacity-50"
        >
          {loading ? '⏳ در حال واکشی...' : '🔍 شلیک به API'}
        </button>
      </div>

      {apiResponse && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn font-bold text-[11px]">
          {/* ستون اول: ساختار آنالیز پپ لاین فرانت */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <h3 className="text-xs text-indigo-400 border-b border-slate-800 pb-1 mb-2">👁️ شبیه‌ساز رندر فرانت‌اِند (Next.js Render Preview)</h3>
            {apiResponse.data && apiResponse.data.length > 0 ? (
              apiResponse.data.map((log: any, idx: number) => {
                // شبیه‌سازی دقیق کدهای شرطی دراور
                const isSuccess = log.status === 'success';
                const isNoAnswer = log.status === 'failed' || log.status === 'no_answer';
                
                return (
                  <div key={idx} className="p-3 bg-slate-900 rounded-lg border border-slate-800/60 flex justify-between items-center">
                    <div>
                      <span className="block text-slate-300">📞 جهت: {log.type === 'inbound' ? '↙️ ورودی' : '↗️ خروجی'}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">🧑‍💼 داخلی اپراتور: {log.agent_extension}</span>
                    </div>
                    <div className="text-left">
                      <span className={`px-2 py-0.5 rounded text-[9px] ${
                        isSuccess ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                        isNoAnswer ? 'bg-amber-950 text-amber-400 border border-amber-900' : 'bg-rose-950 text-rose-400 border border-rose-900'
                      }`}>
                        {isSuccess ? '🟢 موفق و متصل' : isNoAnswer ? '🟡 بی‌پاسخ (Missed)' : '🔴 اشغال / قطع'}
                      </span>
                      <span className="block font-mono text-[10px] text-slate-500 mt-1">⏱️ {log.duration}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500 text-center py-4">هیچ داده‌ای برای رندر یافت نشد.</p>
            )}
          </div>

          {/* ستون دوم: دیتای خام جیسون (JSON) ارسالی لاراول */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col">
            <h3 className="text-xs font-black text-amber-500 border-b border-slate-800 pb-1.5 mb-2">📦 دیتای خام خروجی لاراول (JSON Payload)</h3>
            <pre className="text-left font-mono text-[10px] text-emerald-400 bg-slate-900 p-3 rounded-xl overflow-x-auto max-h-72 flex-1">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}