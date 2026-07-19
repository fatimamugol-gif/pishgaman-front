'use client';

import React, { useEffect, useState } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';

export default function ActiveCallsPage() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  // const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  // const BACKEND_BASE_URL = `http://${currentHost}:8000`; // خودکار آی‌پی سیستم شما را پورت ۸۰۰۰ جفت می‌کند

  const BACKEND_BASE_URL = API_BASE_URL;
  const fetchLiveCalls = () => {
    fetch(`${BACKEND_BASE_URL}/next/dashboard/active-calls`)
      .then(res => res.json())
      .then(resData => {
        setCalls(resData.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLiveCalls();
    const interval = setInterval(fetchLiveCalls, 2000); // به‌روزرسانی زنده سوکت هر ۲ ثانیه
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', direction: 'rtl', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f172a' }}>🛰️ مرکز نظارت بر تماس‌های جاری (Live AMI)</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>نمایش کارشناسان و متقاضیانی که همین حالا در حال بوق خوردن یا مکالمه هستند</p>
      </div>

      {loading ? (
        <div>⏳ در حال اتصال به خطوط مخابراتی...</div>
      ) : calls.length === 0 ? (
        <div style={{ padding: '30px', background: '#fff', borderRadius: '12px', textAlign: 'center', color: '#94a3b8' }}>
          📭 در حال حاضر هیچ تماس فعالی روی خطوط ایزابل وجود ندارد.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {calls.map((call: any, idx) => (
            <div key={idx} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', borderRight: call.state === 'talking' ? '5px solid #10b981' : '5px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: call.state === 'talking' ? '#10b981' : '#f59e0b', background: call.state === 'talking' ? '#d1fae5' : '#fef3c7', padding: '2px 8px', borderRadius: '6px' }}>
                  {call.state === 'talking' ? '🟢 در حال مکالمه' : '🔔 در حال زنگ خوردن'}
                </span>
                <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#64748b' }}>⏳ {call.duration}</span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 5px 0' }}>{call.customer_name}</h3>
              <p style={{ margin: '3px 0', fontSize: '13px', color: '#475569' }}>📱 تلفن متقاضی: <span style={{fontFamily: 'monospace'}}>{call.customer_phone}</span></p>
              <p style={{ margin: '3px 0', fontSize: '13px', color: '#475569' }}>🎧 متصل به کارشناس داخلی: <strong>{call.agent_extension}</strong></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}