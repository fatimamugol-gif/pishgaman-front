// app/dashboard/leads/new/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';

export default function NewLeadForm() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '', gender: 'male', phone: '', secondary_phone: '', email: '', current_city: '',
    initial_consultation_status: 'مشاوره 1', source: 'ورود دستی فرانت', 
    persona: 'Goal Oriented', discovery_channel: 'سرچ گوگل', supervisor_status: 'تایید اولیه ناظر',
    session_date_shamsi: '', next_call_date_shamsi: '',
    age: '', education_level: 'کارشناسی', requested_plan: 'مهاجرت تحصیلی',
    score: '70', form_link: 'https://pishgamanapply.com/manual-entry',
    english_level: 'متوسط (B1/B2)', german_level: 'هیچ آشنایی ندارد',
    english_certified_level: 'مدرک ندارد', german_certified_level: 'مدرک ندارد',
    work_and_insurance_history: '', target_country: 'آلمان', 
    financial_capability_million: '', military_status: 'کارت پایان خدمت',
    description: '', marital_status: 'single', spouse_name: '',
    spouse_education: '', children_count: '0', spouse_work_history: '',
    spouse_age: '', spouse_language_level: 'بدون مدرک', spouse_accompanying: 'yes',
    field_of_study: '', gpa: '', department_id: '', assigned_agent_id: ''
  });
  const BACKEND_BASE_URL = API_BASE_URL;
  // const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  // const BACKEND_BASE_URL = `http://${currentHost}:8000`; 

  const statusesList = ['مشاوره 1', 'مشاوره عالی 1', 'پیگیری', 'ساسپند', 'مشاوره 2', 'بی پاسخ', 'هدف', 'نظر مدیر', 'لید فوری', 'مساعد نبود', 'ارزیابی پرونده', 'رها شده', 'مشاوره عالی 2', 'پیگیری 2', 'پیگیری 3', 'پیگیری 4', 'پیگیری 5', 'واتساپی', 'تلگرام'];
  const sourceOptions = ['اینستاگرام', 'پیشگامان', 'تهران ویزا', 'واتساپ', 'تلگرام', 'بله', 'معرفی', 'تماس ورودی', 'رزرو سایت', 'ورود دستی فرانت'];
  const personasList = ['Goal Oriented', 'Analytical', 'Safety Oriented', 'Explorer', 'Skeptic', 'Budget-Conscious', 'Family-First', 'Fast-Track', 'Undecided/Passive', 'Opportunity-Driven', 'Case Study Seeker'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };

    fetch(`${BACKEND_BASE_URL}/next/departments`, { headers: authHeaders })
      .then(res => res.json())
      .then(data => { if(data.status === 'success') setDepartments(data.data || []); });

    fetch(`${BACKEND_BASE_URL}/next/users`, { headers: authHeaders })
      .then(res => res.json())
      .then(data => { if(data.status === 'success') setAgents(data.data || []); });
  }, []);

  const handleGenderChange = (genderValue: string) => {
    setFormData(prev => ({
      ...prev,
      gender: genderValue,
      military_status: genderValue === 'female' ? 'عدم نیاز - بانوان' : 'کارت پایان خدمت'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const token = localStorage.getItem('token');

    const capToman = formData.financial_capability_million ? parseFloat(formData.financial_capability_million) * 1000000 : 0;
    const finalPayload = { ...formData, financial_capability_toman: capToman };

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/next/leads/store`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(finalPayload)
        });
      const data = await res.json();
      if (data.status === 'success') {
        setMessage('✅ پرونده متقاضی با موفقیت ثبت شد و به کارتابل مشاور ارجاع یافت.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) { setMessage('❌ خطا در ارتباط با سرور لاراول.'); } finally { setLoading(false); }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-right font-sans text-[11px]" dir="rtl">
      <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl border">
        <div>
          <h1 className="text-lg font-black text-slate-800">➕ فرم ثبت هوشمند پرونده ۳۶۰ درجه متقاضیان</h1>
          <p className="text-slate-400 text-[10px] mt-0.5">ثبت مشخصات کامل هویتی، خانوادگی، تحصیلی و پلمب هوشمند پرسونا کلاینت</p>
        </div>
        <Link href="/dashboard/leads" className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold text-xs">🔙 بازگشت به کارتابل</Link>
      </div>

      {message && <div className="p-4 mb-6 rounded-xl bg-indigo-50 text-indigo-700 font-bold border text-xs">{message}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl max-w-5xl mx-auto space-y-6 border shadow-2xs font-bold text-slate-700">
        
        {/* ۱. مشخصات هویتی و تفکیک جنسیت */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-indigo-600 border-b pb-1.5">📞 مشخصات هویتی و تفکیک جنسیت متقاضی</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <label className="flex flex-col gap-1">نام و نام خانوادگی:<input type="text" required className="p-2 border rounded-lg bg-slate-50 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></label>
            <label className="flex flex-col gap-1">جنسیت متقاضی:
              <select className="p-2 border rounded-lg bg-white outline-none text-indigo-600" value={formData.gender} onChange={e => handleGenderChange(e.target.value)}>
                <option value="male">👨 آقا (مرد)</option>
                <option value="female">👩 خانم (زن)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">شماره موبایل اصلی:<input type="text" required className="p-2 border rounded-lg text-left font-mono outline-none" placeholder="0912..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></label>
            <label className="flex flex-col gap-1">شماره تماس دوم:<input type="text" className="p-2 border rounded-lg text-left font-mono outline-none" value={formData.secondary_phone} onChange={e => setFormData({...formData, secondary_phone: e.target.value})} /></label>
            <label className="flex flex-col gap-1">سن متقاضی:<input type="number" className="p-2 border rounded-lg text-center bg-white" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} /></label>
            <label className="flex flex-col gap-1">ایمیل کلاینت:<input type="email" className="p-2 border rounded-lg text-left outline-none font-mono" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></label>
            <label className="flex flex-col gap-1">شهر سکونت فعلی:<input type="text" className="p-2 border rounded-lg outline-none" value={formData.current_city} onChange={e => setFormData({...formData, current_city: e.target.value})} /></label>
            <label className="flex flex-col gap-1">وضعیت نظام وظیفه:
              <select className="p-2 border rounded-lg bg-white outline-none" value={formData.military_status} onChange={e => setFormData({...formData, military_status: e.target.value})} disabled={formData.gender === 'female'}>
                {formData.gender === 'female' ? <option value="عدم نیاز - بانوان">عدم نیاز - بانوان 👩</option> : (
                  <>
                    <option value="کارت پایان خدمت">کارت پایان خدمت</option>
                    <option value="معافیت دائم">معافیت دائم</option>
                    <option value="معافیت تحصیلی">معافیت تحصیلی</option>
                    <option value="مشمول">مشمول (بدون خدمت)</option>
                  </>
                )}
              </select>
            </label>
          </div>
        </div>

        {/* ۲. شایستگی‌های آکادمیک و مدارک زبان */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-emerald-600 border-b pb-1.5">🎓 شایستگی‌های آکادمیک و اهداف مهاجرت</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <label className="flex flex-col gap-1">آخرین مقطع تحصیلی:
              <select className="p-2 border rounded-lg bg-white" value={formData.education_level} onChange={e => setFormData({...formData, education_level: e.target.value})}>
                <option value="دیپلم">دیپلم</option><option value="کاردانی">کاردانی</option><option value="کارشناسی">کارشناسی</option><option value="کارشناسی ارشد">کارشناسی ارشد</option><option value="دکتری">دکتری</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">رشته تحصیلی:<input type="text" className="p-2 border rounded-lg outline-none" value={formData.field_of_study} onChange={e => setFormData({...formData, field_of_study: e.target.value})} /></label>
            <label className="flex flex-col gap-1">معدل فارغ‌التحصیلی:<input type="text" className="p-2 border rounded-lg text-left font-mono outline-none" placeholder="17.50" value={formData.gpa} onChange={e => setFormData({...formData, gpa: e.target.value})} /></label>
            <label className="flex flex-col gap-1">امتیاز اولیه کیس:<input type="number" className="p-2 border rounded-lg text-center font-mono outline-none text-indigo-600" value={formData.score} onChange={e => setFormData({...formData, score: e.target.value})} /></label>
            <label className="flex flex-col gap-1">پلن مهاجرتی مورد نیاز:
              <select className="p-2 border rounded-lg bg-white" value={formData.requested_plan} onChange={e => setFormData({...formData, requested_plan: e.target.value})}>
                <option value="مهاجرت تحصیلی">مهاجرت تحصیلی</option><option value="آوسبیلدونگ">آوسبیلدونگ</option><option value="جاب آفر / کاری">جاب آفر / کاری</option><option value="تمکن مالی / سرمایه‌گذاری">تمکن مالی / سرمایه‌گذاری</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">کشور مقصد:<input type="text" className="p-2 border rounded-lg outline-none" placeholder="آلمان" value={formData.target_country} onChange={e => setFormData({...formData, target_country: e.target.value})} /></label>
            <label className="flex flex-col gap-1">میزان تمکن مالی (به میلیون تومان):<input type="number" className="p-2 border rounded-lg bg-emerald-500/5 text-emerald-600 font-mono font-black" placeholder="مثلا 450" value={formData.financial_capability_million} onChange={e => setFormData({...formData, financial_capability_million: e.target.value})} /></label>
            <label className="flex flex-col gap-1">لینک فرم ورودی لید:<input type="text" className="p-2 border rounded-lg bg-slate-50 font-mono text-sky-600 text-[10px]" value={formData.form_link} onChange={e => setFormData({...formData, form_link: e.target.value})} /></label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <label className="flex flex-col gap-1">انگلیسی (عمومی):<select className="p-2 border rounded-lg bg-white" value={formData.english_level} onChange={e => setFormData({...formData, english_level: e.target.value})}><option value="مبتدی (A1/A2)">مبتدی</option><option value="متوسط (B1/B2)">متوسط</option><option value="پیشرفته (C1/C2)">پیشرفته</option></select></label>
            <label className="flex flex-col gap-1">آلمانی (عمومی):<select className="p-2 border rounded-lg bg-white" value={formData.german_level} onChange={e => setFormData({...formData, german_level: e.target.value})}><option value="هیچ آشنایی ندارد">هیچ آشنایی ندارد</option><option value="A1">A1</option><option value="B1">B1</option><option value="B2">B2</option></select></label>
            <label className="flex flex-col gap-1">مدرک رسمی انگلیسی:<select className="p-2 border rounded-lg bg-white text-indigo-600" value={formData.english_certified_level} onChange={e => setFormData({...formData, english_certified_level: e.target.value})}><option value="مدرک ندارد">مدرک ندارد</option><option value="IELTS">IELTS</option><option value="TOEFL">TOEFL</option></select></label>
            <label className="flex flex-col gap-1">مدرک رسمی آلمانی:<select className="p-2 border rounded-lg bg-white text-indigo-600" value={formData.german_certified_level} onChange={e => setFormData({...formData, german_certified_level: e.target.value})}><option value="مدرک ندارد">مدرک ندارد</option><option value="ÖSD">ÖSD</option><option value="Goethe">Goethe</option></select></label>
          </div>
          <label className="flex flex-col gap-1 mt-2">سوابق کاری، بیمه و اشتغال متقاضی:<textarea rows={2} className="p-2 border rounded-lg outline-none" value={formData.work_and_insurance_history} onChange={e => setFormData({...formData, work_and_insurance_history: e.target.value})} /></label>
        </div>

        {/* ۳. وضعیت تاهل و خانواده */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-pink-600 border-b pb-1.5">💍 وضعیت تاهل و ساختار خانواده متقاضی</h3>
          <div className="flex gap-4 items-center bg-slate-50 p-2.5 rounded-xl border">
            <span className="font-bold">وضعیت تاهل:</span>
            <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="marital_status" value="single" checked={formData.marital_status === 'single'} onChange={e => setFormData({...formData, marital_status: e.target.value})} /> مجرد</label>
            <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="marital_status" value="married" checked={formData.marital_status === 'married'} onChange={e => setFormData({...formData, marital_status: e.target.value})} /> متاهل</label>
          </div>
          {formData.marital_status === 'married' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 bg-pink-50/20 p-4 rounded-xl border border-pink-100/60 animate-fadeIn">
              <label className="flex flex-col gap-1">نام و فامیل همسر:<input type="text" className="p-2 border rounded-lg bg-white outline-none" value={formData.spouse_name} onChange={e => setFormData({...formData, spouse_name: e.target.value})} /></label>
              <label className="flex flex-col gap-1">سن همسر:<input type="number" className="p-2 border rounded-lg text-center" value={formData.spouse_age} onChange={e => setFormData({...formData, spouse_age: e.target.value})} /></label>
              <label className="flex flex-col gap-1">تحصیلات همسر:<input type="text" className="p-2 border rounded-lg bg-white" value={formData.spouse_education} onChange={e => setFormData({...formData, spouse_education: e.target.value})} /></label>
              <label className="flex flex-col gap-1">سطح زبان همسر:<input type="text" className="p-2 border rounded-lg bg-white" value={formData.spouse_language_level} onChange={e => setFormData({...formData, spouse_language_level: e.target.value})} /></label>
              <label className="flex flex-col gap-1">تعداد فرزندان:<input type="number" className="p-2 border rounded-lg text-center" value={formData.children_count} onChange={e => setFormData({...formData, children_count: e.target.value})} /></label>
              <label className="flex flex-col gap-1">وضعیت همراهی سفر:
                <select className="p-2 border rounded-lg bg-white font-bold" value={formData.spouse_accompanying} onChange={e => setFormData({...formData, spouse_accompanying: e.target.value})}>
                  <option value="yes">بله، همراه پرونده است</option><option value="no">خیر، همراه نیست</option>
                </select>
              </label>
            </div>
          )}
        </div>

        {/* ۴. ورک‌فلو ارجاع لید */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-amber-600 border-b pb-1.5">🏢 ورک‌فلو ارجاع لید و بازه‌های زمانی</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <label className="flex flex-col gap-1">🏢 ارجاع مستقیم به دپارتمان:
              <select className="p-2 border rounded-lg bg-white text-indigo-600" value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})}>
                <option value="">انتخاب دپارتمان...</option>
                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">💼 کارشناس پیگیری‌کننده:
              <select className="p-2 border rounded-lg bg-white text-slate-700" value={formData.assigned_agent_id} onChange={e => setFormData({...formData, assigned_agent_id: e.target.value})}>
                <option value="">تخصیص آزاد سیستمی...</option>
                {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">وضعیت اولیه پرونده:
              <select className="p-2 border rounded-lg bg-white text-purple-700" value={formData.initial_consultation_status} onChange={e => setFormData({...formData, initial_consultation_status: e.target.value})}>
                {statusesList.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">منبع ورودی پرونده:
              <select className="p-2 border rounded-lg bg-white text-indigo-700" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>
                {sourceOptions.map(src => <option key={src} value={src}>{src}</option>)}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div><label className="flex flex-col gap-1">📅 تاریخ جلسه ارشد:</label><input type="date" className="p-2 border rounded-lg w-full text-center outline-none bg-slate-50 font-mono" value={formData.session_date_shamsi} onChange={e => setFormData({...formData, session_date_shamsi: e.target.value})} /></div>
            <div><label className="flex flex-col gap-1">📞 موعد تماس بعدی:</label><input type="date" className="p-2 border rounded-lg w-full text-center outline-none text-indigo-600 bg-slate-50 font-mono" value={formData.next_call_date_shamsi} onChange={e => setFormData({...formData, next_call_date_shamsi: e.target.value})} /></div>
            <div>
              <label className="flex flex-col gap-1">🎯 پرسونای روان‌شناختی (AI):</label>
              <select className="p-2 border rounded-lg w-full bg-amber-500/10 text-amber-600" value={formData.persona} onChange={e => setFormData({...formData, persona: e.target.value})}>
                {personasList.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex flex-col gap-1">📝 یادداشت فرعی و توضیحات تکمیلی پرونده:
            <textarea rows={3} className="p-2 border rounded-lg w-full bg-white outline-none leading-relaxed" placeholder="ملاحظات مشاور..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </label>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-black text-xs shadow-sm text-center">
            {loading ? '⏳ در حال ثبت اطلاعات پرونده...' : '🚀 ثبت قطعی و ارجاع متمرکز لید به کارتابل سازمان'}
          </button>
        </div>
      </form>
    </div>
  );
}