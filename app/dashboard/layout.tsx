// app/dashboard/layout.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import MainSidebar from '@/components/MainSidebar';
import StaffChat from '@/components/staff/StaffChat';
import { useTheme } from '../../context/ThemeContext';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

  const BACKEND_BASE_URL = API_BASE_URL;

if (typeof window !== 'undefined' && !((window as any).Echo)) {
  const reverbHost = process.env.NEXT_PUBLIC_REVERB_HOST || '127.0.0.1';
  const reverbPort = parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || '8080');
  const isHttps = process.env.NEXT_PUBLIC_REVERB_SCHEME === 'https';

  (window as any).Pusher = Pusher;
  (window as any).Echo = new Echo({
    broadcaster: 'reverb',
    key: 'wyBCijEJNkmFP5eoSDfSg6+bz0glNb8MnHwLLM6Mchk=',
    wsHost: reverbHost,
    wsPort: reverbPort,
    wssPort: reverbPort,
    forceTLS: isHttps,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
  });
}

const formatDuration = (seconds: number) => {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const [openPopup, setOpenPopup] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserExt, setCurrentUserExt] = useState<string | null>(null);
  const [userDepartmentId, setUserDepartmentId] = useState<number | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);

  const [popupView, setPopupView] = useState<'main' | 'link_lead' | 'create_lead'>('main');
  const [createMode, setCreateMode] = useState<'quick' | 'full'>('quick');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [callDuration, setCallDuration] = useState(0);

  // 🛡️ قفل اتمیک رادار پولینگ برای مهار اسپم سرور
  const isFetchingRadar = useRef(false);

  const [newLeadData, setNewLeadData] = useState({
    name: '', age: '', current_city: '', target_country: 'آلمان', requested_plan: 'مهاجرت کاری'
  });

  // 🧠 فچ دیتای کاربران و اطلاعات هاب فقط ۱ بار در کل طول لایوت
  useEffect(() => {
    const loadUsersAndSelf = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const hubRes = await fetch(`${BACKEND_BASE_URL}/next/agent/dashboard-hub`, { headers: { 'Authorization': `Bearer ${token}` } });
        const hubJson = await hubRes.json();
        if (hubJson.status === 'success') {
          setCurrentUserId(hubJson.user_id);
          setCurrentUserExt(hubJson.agent_extension);
          setUserDepartmentId(hubJson.department_id); // دریافت شناسه دپارتمان کارشناس
        }

        const uRes = await fetch(`${BACKEND_BASE_URL}/next/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        const uData = await uRes.json();
        if (uData.status === 'success') setUsersList(uData.data || []);
      } catch (e) { console.error(e); }
    };

    loadUsersAndSelf();
  }, []);

 // app/dashboard/layout.tsx
  const checkLiveCallRadarFallback = async () => {
    const token = localStorage.getItem('token');
    if (!token || openPopup || isFetchingRadar.current) return; 
    
    try {
      isFetchingRadar.current = true;
      const res = await fetch(`${BACKEND_BASE_URL}/next/dashboard/live-popup`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.active_call) {
          const call = json.active_call;
          const localRole = localStorage.getItem('user_role') || 'agent';
          const isUserAdmin = localRole === 'supervisor' || localRole === 'admin';

          if (call.call_type === 'outbound') {
            if (currentUserExt && call.agent_extension !== currentUserExt) return;
          }

          if (call.call_type === 'inbound' && !isUserAdmin) {
            if (userDepartmentId && call.department_id && call.department_id !== userDepartmentId) {
              return; 
            }
          }

          setIncomingCall(call);
          setOpenPopup(true);
          setCallDuration(0);
        }
      }
    } catch (e) { 
      // 👑 خنثی‌سازی کرش پاپ‌آپ سراسری در زمان عدم پاسخ وب‌سرور لاراول
      // کنسول با این پچ دیگر قفل و فریز نمی‌شود
    } finally {
      isFetchingRadar.current = false;
    }
  };

  useEffect(() => {
    if (!openPopup) {
      setPopupView('main');
      setSearchTerm('');
      setSearchResults([]);
    }
  }, [openPopup]);

  // 📡 شنود لایو وب‌سوکت با شروط تفکیکی دپارتمان و ادمین
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Echo && currentUserId) {
      const channel = (window as any).Echo.channel(`agents.${currentUserId}`);

      const triggerPopup = (e: any) => {
        if (e && e.callData) {
          const call = e.callData;
          const localRole = localStorage.getItem('user_role') || 'agent';
          const isUserAdmin = localRole === 'supervisor' || localRole === 'admin';

          // گارد خروجی سوکت
          if (call.call_type === 'outbound' && currentUserExt && call.agent_extension !== currentUserExt) {
            return;
          }

          // گارد ورودی سوکت
          if (call.call_type === 'inbound' && !isUserAdmin) {
            if (userDepartmentId && call.department_id && call.department_id !== userDepartmentId) {
              return;
            }
          }

          setIncomingCall(call);
          setOpenPopup(true);
          setCallDuration(0);
        }
      };

      channel.listen('App\\Events\\IncomingCallEvent', triggerPopup);

      return () => {
        (window as any).Echo.leave(`agents.${currentUserId}`);
      };
    }
  }, [currentUserId, currentUserExt, userDepartmentId]);

  // ⏱️ اجرای فاصله زمانی پولینگ (هر ۵ ثانیه برای کاهش قاطع بار سرور)
  useEffect(() => {
    const radarInterval = setInterval(() => {
      checkLiveCallRadarFallback();
    }, 5000);

    return () => clearInterval(radarInterval);
  }, [openPopup, currentUserExt, userDepartmentId]);

  // ⏱️ مأموریت تایمر تماس صعودی اوتباند
  useEffect(() => {
    let timer: any;
    if (openPopup && incomingCall?.call_type === 'outbound') {
      timer = setInterval(() => { setCallDuration(prev => prev + 1); }, 1000);
    }
    return () => clearInterval(timer);
  }, [openPopup, incomingCall]);

  const handleSearchLeads = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/next/dashboard/leads?sort_by=id&sort_dir=desc`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        const filtered = data.data.filter((l: any) => l.name.includes(term) || l.phone.includes(term));
        setSearchResults(filtered);
      }
    } catch (e) { console.error(e); }
  };

  const getAgentNameByExtension = (ext: string) => {
    if (!ext) return 'سیستم مرکزی';
    const found = usersList.find((u: any) => u.agent_extension === ext || u.id === parseInt(ext));
    return found ? found.name : `داخلی ${ext}`;
  };

  const popupBg = isDark ? 'bg-slate-900/95 text-white border-slate-800 shadow-slate-950/50' : 'bg-white/95 text-slate-800 border-slate-200 shadow-xl';
  const inputBg = isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800';
  
  const isOutbound = incomingCall?.call_type === 'outbound';
  const mappedName = incomingCall?.customer_name || incomingCall?.name;
  const isKnown = mappedName && !mappedName.includes('ناشناس') && !mappedName.includes('جدید');
  const displayPhone = incomingCall?.phone || incomingCall?.customer_phone || '---';

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`} dir="rtl">
      <MainSidebar />
      <div className="flex-1 pr-0 md:pr-64 min-h-screen transition-all duration-300 overflow-x-hidden">
        <main className="w-full h-full p-2 md:p-4">{children}</main>
      </div>

      {/* ================= پاپ‌آپ جامع و هوشمند ================= */}
      {openPopup && incomingCall && (
        <div className={`fixed bottom-6 left-6 p-5 rounded-2xl border backdrop-blur-md z-50 w-80 shadow-2xl transition-all duration-300 ${popupBg}`}>
          <div className="flex items-center justify-between border-b pb-2 mb-3 dark:border-slate-800 border-slate-100">
            <span className={`font-black text-[10px] flex items-center gap-1.5 ${isOutbound ? 'text-amber-500' : 'text-emerald-500'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping"></span>
              {isOutbound ? '📤 Outbound تماس خروجی کارشناس' : '📥 Inbound تماس ورودی جدید'}
            </span>
            <button type="button" onClick={() => setOpenPopup(false)} className="w-5 h-5 border rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors text-slate-400 font-bold text-xs cursor-pointer">×</button>
          </div>

          {popupView === 'main' && (
            <div className="space-y-2 text-[11px] font-bold">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">👤 مخاطب پرونده:</span>
                {isKnown ? <span className="text-indigo-600 font-black">{mappedName}</span> : <span className="text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md text-[10px]">متقاضی ناشناس / لید جدید</span>}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">📱 شماره خط:</span>
                <span className="font-mono tracking-wider text-slate-600 dark:text-slate-300">{displayPhone}</span>
              </div>
              <div className="flex justify-between border-t border-dashed pt-2 mt-1 dark:border-slate-800 border-slate-100">
                <span className="text-slate-400">🧑‍💼 کارشناس پاسخگو:</span>
                <span className="text-purple-500 font-black">{getAgentNameByExtension(incomingCall.agent_extension)}</span>
              </div>
              <div className="pt-3 border-t dark:border-slate-800 border-slate-100 space-y-1.5">
                {isOutbound ? (
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 text-center py-2.5 rounded-xl space-y-1">
                    <div className="text-[9px] font-black">⏱️ مدت زمان مکالمه جاری کارشناس:</div>
                    <div className="text-base font-mono font-black tracking-widest">{formatDuration(callDuration)}</div>
                  </div>
                ) : (
                  isKnown ? (
                    <button type="button" onClick={() => { setOpenPopup(false); window.location.href = `/dashboard/leads?active_lead_id=${incomingCall.lead_id || ''}`; }} className="bg-indigo-600 hover:bg-indigo-700 text-white text-center font-black py-2 rounded-xl w-full block text-[10px] transition-all shadow-md cursor-pointer">💬 باز کردن پرونده و چت‌های متقاضی</button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setPopupView('create_lead')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 rounded-xl text-[10px] transition-all shadow-sm cursor-pointer">➕ ثبت متقاضی</button>
                      <button type="button" onClick={() => setPopupView('link_lead')} className="bg-amber-600 hover:bg-amber-700 text-white font-black py-2 rounded-xl text-[10px] transition-all shadow-sm cursor-pointer">🔗 پیوند شماره</button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* فرم پیوند لید به کلاینت قدیمی */}
          {popupView === 'link_lead' && (
            <div className="space-y-3 text-[11px] font-bold">
              <span className="text-slate-400 block mb-1">🎯 انتخاب کلاینت برای پیوند شماره:</span>
              <input type="text" placeholder="نام یا شماره پرونده کلاینت..." className={`p-2 border rounded-xl text-xs w-full focus:outline-none font-bold ${inputBg}`} value={searchTerm} onChange={e => handleSearchLeads(e.target.value)} />
              <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                {searchResults.map((l: any) => (
                  <button key={l.id} type="button" onClick={async () => {
                    const res = await fetch(`${BACKEND_BASE_URL}/next/leads/link-secondary-phone`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ lead_id: l.id, new_phone: displayPhone })
                    });
                    const data = await res.json();
                    if (data.status === 'success') { alert(data.message); setOpenPopup(false); }
                  }} className="w-full text-right p-2 bg-slate-50 dark:bg-slate-950 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 block transition-all text-[10px]">👤 {l.name} ({l.phone})</button>
                ))}
              </div>
              <button type="button" onClick={() => setPopupView('main')} className="text-slate-400 w-full text-center mt-2 block hover:underline cursor-pointer">⬅️ بازگشت</button>
            </div>
          )}

          {/* فرم مکتوب ساخت لید جدید */}
          {popupView === 'create_lead' && (
            <div className="space-y-3 text-[11px] font-bold">
              <div className="flex justify-between items-center border-b pb-1.5 dark:border-slate-800">
                <span className="text-slate-400">گزینش سطح فرم:</span>
                <div className="bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg flex gap-0.5">
                  <button type="button" onClick={() => setCreateMode('quick')} className={`px-2 py-1 rounded text-[9px] font-black ${createMode === 'quick' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>⏱️ فوری</button>
                  <button type="button" onClick={() => setCreateMode('full')} className={`px-2 py-1 rounded text-[9px] font-black ${createMode === 'full' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>👑 جامع</button>
                </div>
              </div>
              <div className="space-y-2">
                <input type="text" placeholder="نام و فامیل متقاضی" className={`p-2 border rounded-xl text-xs w-full focus:outline-none ${inputBg}`} value={newLeadData.name} onChange={e => setNewLeadData({...newLeadData, name: e.target.value})} />
                <input type="number" placeholder="سن متقاضی" className={`p-2 border rounded-xl text-xs w-full text-center focus:outline-none ${inputBg}`} value={newLeadData.age} onChange={e => setNewLeadData({...newLeadData, age: e.target.value})} />
                {createMode === 'full' && (
                  <div className="space-y-2 anonymity-fadeIn">
                    <input type="text" placeholder="شهر محل سکونت" className={`p-2 border rounded-xl text-xs w-full focus:outline-none ${inputBg}`} value={newLeadData.current_city} onChange={e => setNewLeadData({...newLeadData, current_city: e.target.value})} />
                    <input type="text" placeholder="کشور مقصد هدف" className={`p-2 border rounded-xl text-xs w-full focus:outline-none ${inputBg}`} value={newLeadData.target_country} onChange={e => setNewLeadData({...newLeadData, target_country: e.target.value})} />
                    <input type="text" placeholder="پلن مهاجرتی" className={`p-2 border rounded-xl text-xs w-full focus:outline-none ${inputBg}`} value={newLeadData.requested_plan} onChange={e => setNewLeadData({...newLeadData, requested_plan: e.target.value})} />
                  </div>
                )}
              </div>
              <button type="button" onClick={async () => {
                if(!newLeadData.name) return alert('نام متقاضی الزامی است.');
                const res = await fetch(`${BACKEND_BASE_URL}/next/leads/store`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...newLeadData, phone: displayPhone })
                });
                const data = await res.json();
                if (data.status === 'success') { alert('پرونده با موفقیت مستقر شد.'); setOpenPopup(false); }
              }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl font-black text-center text-[10px] shadow-sm cursor-pointer">🚀 ثبت لید در سیستم</button>
              <button type="button" onClick={() => setPopupView('main')} className="text-slate-400 w-full text-center mt-1 block hover:underline cursor-pointer">⬅️ انصراف</button>
            </div>
          )}
        </div>
      )}

      {/* 💬 چت آنلاین کارشناسان */}
      <StaffChat />
    </div>
  );
}
