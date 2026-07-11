//app/dashboard/workflows/page.tsx
'use client';
import React, { useState, useEffect } from 'react';

export default function WorkflowsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<number>(1);
  const [highScore, setHighScore] = useState<number>(80);
  const [vipRole, setVipRole] = useState('senior_agent');
  
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  const BACKEND_BASE_URL = `http://${currentHost}:8000`; 

  const loadWorkflowData = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };

    try {
      // لود دپارتمان‌ها
      const dRes = await fetch(`${BACKEND_BASE_URL}/api/next/departments`, { headers });
      const dData = await dRes.json();
      if (dData.status === 'success') setDepartments(dData.data || []);

      // 🧠 همگام‌سازی اتمیک: واکشی مستقیم از جدول یوزرز (منبع اصلی هویت کارشناسان سیستم)
      const uRes = await fetch(`${BACKEND_BASE_URL}/api/next/users`, { headers });
      const uData = await uRes.json();
      if (uData.status === 'success') {
        // فیلتر کردن کلاینت‌ها و فقط نمایش اپراتورها و کارشناسان فروش در لیست
        const staff = (uData.data || []).filter((user: any) => user.role !== 'client');
        setAgents(staff);
      }
    } catch (e) {
      console.error("🚨 Error loading workflow cortex:", e);
    }
  };

  useEffect(() => {
    loadWorkflowData();
  }, []);

  const handleAssignDept = async (agentId: number, deptId: number) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_BASE_URL}/api/next/workflows/assign-agent`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ agent_id: agentId, department_id: deptId })
    });
    if (res.ok) {
      alert('🔄 کارشناس با موفقیت به ساختار درختی دپارتمان متصل شد.');
      loadWorkflowData();
    }
  };

  const handleSaveFlow = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_BASE_URL}/api/next/workflows/store`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        title: `قانون داینامیک دپارتمان ${selectedDept}`,
        department_id: selectedDept,
        flow_rules: { high_score_threshold: highScore, VIP_agent_role: vipRole }
      })
    });
    if (res.ok) {
      alert('🚀 فلوچارت داینامیک این دپارتمان با موفقیت در هسته هوش مصنوعی مستقر شد.');
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans text-[11px] bg-slate-50 min-h-screen text-right" dir="rtl">
      <h1 className="text-sm md:text-base font-black text-slate-800">🎛️ اتاق فرمان ساختار دپارتمان‌ها و فلوچارت ارجاع داینامیک</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ۱. تنظیم شروط فلوچارت */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border space-y-4 shadow-sm">
          <h2 className="font-bold text-slate-700 border-b pb-2 flex items-center gap-1.5">📐 بوم تنظیم شروط فلوچارت ارجاع (Workflow Builder)</h2>
          <label className="block font-bold">انتخاب دپارتمان جهت اعمال فلو:
            <select className="w-full mt-1 p-2 border rounded-xl font-bold bg-slate-50 cursor-pointer" value={selectedDept} onChange={e => setSelectedDept(Number(e.target.value))}>
              {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          
          <div className="p-4 bg-violet-50/50 rounded-xl border border-violet-100 space-y-3">
            <div className="font-bold text-violet-800 text-xs">Core هوشمند ماتریکس ارجاع:</div>
            <p className="text-[10px] text-slate-500">اگر امتیاز پرونده (Lead Score) متقاضی از حد زیر بیشتر شد، فلوچارت مسیر ارجاع را به رول VIP تغییر دهد:</p>
            <div className="flex items-center gap-2">
              <input type="number" className="p-2 border rounded-lg bg-white font-bold font-mono text-center w-24 text-indigo-600 outline-none" value={highScore} onChange={e => setHighScore(Number(e.target.value))} />
              <span className="font-bold text-slate-700">امتیاز ارزیابی شناسنامه</span>
            </div>
            
            <div className="mt-2 pt-2 border-t border-dashed border-violet-200">
              <span className="font-bold text-slate-700">ارجاع اتوماتیک به رول سیستمی:</span>
              <select className="p-2 border rounded-lg bg-white font-bold mx-2 cursor-pointer text-indigo-600" value={vipRole} onChange={e => setVipRole(e.target.value)}>
                <option value="senior_agent">👑 کارشناس ارشد دپارتمان (Eastern Sales)</option>
                <option value="call_center">💼 مشاور اولیه معمولی</option>
              </select>
            </div>
          </div>

          <button onClick={handleSaveFlow} className="bg-indigo-900 hover:bg-indigo-950 text-white font-bold p-3 rounded-xl transition-all cursor-pointer shadow-sm text-xs">
            ⚡ استقرار و اعمال نهایی فلوچارت در هسته دیتابیس
          </button>
        </div>

        {/* ۲. لیست کارشناسان واقعی سیستم */}
        <div className="bg-white p-5 rounded-2xl border space-y-4 shadow-sm">
          <h2 className="font-bold text-slate-700 border-b pb-2">👥 دپارتمان مشاورین و کارشناسان فعال</h2>
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {agents.map((agent: any) => (
              <div key={agent.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
                <div className="font-bold text-slate-800 text-[11px] flex justify-between items-center">
                  <span>👤 {agent.name}</span>
                  <span className="font-mono text-slate-400 bg-white border px-1.5 py-0.5 rounded text-[9px]">داخلی: {agent.voip_extension || '---'}</span>
                </div>
                <select 
                  className="p-1.5 border rounded-lg bg-white font-bold text-indigo-600 text-[10px] cursor-pointer"
                  onChange={(e) => handleAssignDept(agent.id, Number(e.target.value))}
                  value={agent.department_id || ""}
                >
                  <option value="" disabled>انتخاب دپارتمان جهت اتصال...</option>
                  {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}