'use client';

import React, { useEffect, useState } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';

export default function LeadsPage() {
  const [livePopup, setLivePopup] = useState<any>(null);
  
  // فرض می‌کنیم داخلی این کارشناس ۱۰۲ است (این داتا می‌تواند از لاگین کاربر بیاید)
  const myExtension = "102"; 

  useEffect(() => {
    const BACKEND_BASE_URL = API_BASE_URL;
    const interval = setInterval(() => {
      fetch(`${BACKEND_BASE_URL}/next/dashboard/live-popup?extension=${myExtension}`)
        .then(res => res.json())
        .then(resData => {
          if (resData.has_call) {
            setLivePopup(resData.data); // باز شدن لایو پاپ‌آپ
          } else {
            setLivePopup(null); // بستن خودکار پاپ‌آپ در صورت قطع شدن تماس
          }
        });
    }, 2000); // هر ۲ ثانیه یک‌بار چک کن خط زنگ می‌خورد یا نه

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '30px', direction: 'rtl', position: 'relative' }}>
      {/* کدهای لیست جدول لیدها */}

      {/* 🚨 ویترین پاپ‌آپ هوشمند زنده پیشگامان به محض بوق خوردن تلفن شرکت */}
      {livePopup && (
        <div style={{ position: 'fixed', bottom: '20px', left: '20px', width: '350px', backgroundColor: '#fff', borderLeft: '5px solid #ef4444', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', borderRadius: '12px', padding: '15px', zIndex: 999, animation: 'slideIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <strong style={{ color: '#ef4444', fontSize: '14px' }}>📞 تماس ورودی زنده...</strong>
            <span style={{ fontSize: '11px', background: '#fee2e2', color: '#ef4444', padding: '2px 6px', borderRadius: '4px' }}>در حال زنگ خوردن</span>
          </div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>{livePopup.name}</h3>
          <p style={{ margin: '0', fontSize: '13px', color: '#475569' }}>📱 شماره: <span style={{fontFamily: 'monospace'}}>{livePopup.phone}</span></p>
          
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#334155' }}>
            <p style={{margin: '3px 0'}}>🎯 <strong>ویزای درخواستی:</strong> {livePopup.visa_type || 'نامشخص'}</p>
            <p style={{margin: '3px 0'}}>🌍 <strong>مقصد هدف:</strong> {livePopup.target_country || 'نامشخص'}</p>
          </div>
          <button style={{ marginTop: '10px', width: '100%', background: '#4f46e5', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
            باز کردن سریع پرونده متقاضی
          </button>
        </div>
      )}
    </div>
  );
}