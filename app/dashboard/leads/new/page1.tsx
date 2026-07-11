// app/leads/new/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NewLeadForm() {
  const [sources, setSources] = useState<string[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '', phone: '', secondary_phone: '', email: '', current_city: '',
    initial_consultation_status: 'مشاوره جدید', lead_source: 'ورود دستی فرانت', 
    preferred_call_time: 'ساعت ۹ تا ۱۲', specialized_consultation_status: 'جلسه برگزار نشده',
    discovery_channel: 'سرچ گوگل', supervisor_status: 'تایید اولیه ناظر',
    session_date_shamsi: '', client_conversion_date_shamsi: '', next_call_date_shamsi: '',
    age: '', education_level: 'کارشناسی', requested_plan: 'مهاجرت تحصیلی',
    score: '70', level: 'متوسط', form_link: 'https://pishgamanapply.com/manual-entry',
    is_excellent: true,
    english_level: 'متوسط (B1/B2)', german_level: 'هیچ آشنایی ندارد',
    english_certified_level: 'مدرک ندارد', german_certified_level: 'مدرک ندارد',
    language_test_history: '', work_and_insurance_history: '',
    target_country: 'آلمان', financial_capability_toman: '', military_status: 'کارت پایان خدمت',
    description: '', marital_status: 'single', spouse_name: '', spouse_birth_date_shamsi: '',
    spouse_education: '', children_count: '0', spouse_work_history: '',
    spouse_age: '', spouse_language_level: 'بدون مدرک', spouse_accompanying: 'yes',
    field_of_study: '', gpa: '', call_today_flag: false,
    department_id: '', assigned_agent_id: ''
  });

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  const BACKEND_BASE_URL = `http://${currentHost}`; // خودکار آی‌پی سیستم شما را پورت ۸۰۰۰ جفت می‌کند

  useEffect(() => {
    const token = localStorage.getItem('token');
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };

    // ۱. لود منابع ورودی
    fetch(`${BACKEND_BASE_URL}:8000/api/next/leads/sources`, { headers: authHeaders })
      .then(res => res.json())
      .then(data => { if(data.status === 'success') setSources(data.data || []); });

    // ۲. لود دپارتمان‌های معتبر شرکت
    fetch(`${BACKEND_BASE_URL}:8000/api/next/departments`, { headers: authHeaders })
      .then(res => res.json())
      .then(data => { if(data.status === 'success') setDepartments(data.data || []); });

    // ۳. لود لیست کارشناسان جهت تخصیص مستقیم مسئول پرونده
    fetch(`${BACKEND_BASE_URL}:8000/api/next/users`, { headers: authHeaders })
      .then(res => res.json())
      .then(data => { if(data.status === 'success') setAgents(data.data?.filter((u: any) => u.role === 'agent') || []); });
  }, []);

  const setTodayDate = (field: string) => {
    const today = new Date();
    const formatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' });
    setFormData(prev => ({ ...prev, [field]: formatter.format(today) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${BACKEND_BASE_URL}:8000/api/next/leads/store`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify(formData)
        });
      const data = await res.json();
      
      if (data.status === 'success') {
        setMessage('✅ پرونده متقاضی با موفقیت ثبت شد و بر اساس گارد اسکوپ به کارتابل ارجاع یافت.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setMessage('❌ خطایی در ثبت اطلاعات رخ داد؛ لطفاً فیلدها را بررسی کنید.');
      }
    } catch (err) {
      setMessage('❌ خطا در ارتباط با سرور لاراول.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-right font-sans text-[11px]" dir="rtl">
      <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl border">
        <div>
          <h1 className="text-lg font-black text-slate-800">➕ فرم ثبت هوشمند پرونده ۳۶۰ درجه متقاضیان</h1>
          <p className="text-slate-400 text-[10px] mt-0.5">ثبت یکپارچه مشخصات فردی، تحصیلی، اهداف مهاجرتی و ساختار تاهل خانواده</p>
        </div>
        <Link href="/dashboard/leads" className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-xs transition-all">🔙 بازگشت به کارتابل</Link>
      </div>

      {message && <div className="p-4 mb-6 rounded-xl bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 text-xs shadow-2xs">{message}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl max-w-5xl mx-auto space-y-6 border shadow-2xs">
        
        {/* ۱. اطلاعات هویتی و ارتباطی */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-indigo-600 border-b pb-1.5">📞 مشخصات هویتی و ارتباطی</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label style={styles.label}>نام و نام خانوادگی متقاضی:<input type="text" required className="mt-1 p-2 border rounded-lg bg-slate-50/50 font-bold text-slate-800 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></label>
            <label style={styles.label}>شماره موبایل اصلی:<input type="text" required className="mt-1 p-2 border rounded-lg text-left bg-slate-50/50 font-mono text-slate-800 outline-none" placeholder="0912..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></label>
            <label style={styles.label}>شماره تماس دوم / ثابت:<input type="text" className="mt-1 p-2 border rounded-lg text-left bg-white font-mono outline-none" value={formData.secondary_phone} onChange={e => setFormData({...formData, secondary_phone: e.target.value})} /></label>
            <label style={styles.label}>سن متقاضی:<input type="number" className="mt-1 p-2 border rounded-lg text-center outline-none bg-white" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} /></label>
            <label style={styles.label}>ایمیل کلاینت:<input type="email" className="mt-1 p-2 border rounded-lg text-left outline-none bg-white font-mono" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></label>
            <label style={styles.label}>شهر سکونت فعلی:<input type="text" className="mt-1 p-2 border rounded-lg outline-none bg-white" value={formData.current_city} onChange={e => setFormData({...formData, current_city: e.target.value})} /></label>
            <label style={styles.label}>وضعیت نظام وظیفه:
              <select className="mt-1 p-2 border rounded-lg bg-white outline-none font-bold" value={formData.military_status} onChange={e => setFormData({...formData, military_status: e.target.value})}>
                <option value="کارت پایان خدمت">کارت پایان خدمت</option>
                <option value="معافیت دائم">معافیت دائم</option>
                <option value="معافیت تحصیلی">معافیت تحصیلی</option>
                <option value="مشمول">مشمول (بدون خدمت)</option>
              </select>
            </label>
          </div>
        </div>

        {/* ۲. سوابق تحصیلی و اهداف سرمایه گذاری */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-emerald-600 border-b pb-1.5">🎓 شایستگی‌های آکادمیک و اهداف مهاجرت</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <label style={styles.label}>آخرین مقطع تحصیلی:
              <select className="mt-1 p-2 border rounded-lg bg-white outline-none font-bold" value={formData.education_level} onChange={e => setFormData({...formData, education_level: e.target.value})}>
                <option value="دیپلم">دیپلم</option><option value="کاردانی">کاردانی</option><option value="کارشناسی">کارشناسی</option><option value="کارشناسی ارشد">کارشناسی ارشد</option><option value="دکتری">دکتری</option>
              </select>
            </label>
            <label style={styles.label}>رشته تحصیلی:<input type="text" className="mt-1 p-2 border rounded-lg outline-none bg-white" value={formData.field_of_study} onChange={e => setFormData({...formData, field_of_study: e.target.value})} /></label>
            <label style={styles.label}>معدل فارغ‌التحصیلی (GPA):<input type="text" className="mt-1 p-2 border rounded-lg text-left font-mono bg-white outline-none" placeholder="17.50" value={formData.gpa} onChange={e => setFormData({...formData, gpa: e.target.value})} /></label>
            <label style={styles.label}>امتیاز اولیه کیس (رنک):<input type="number" className="mt-1 p-2 border rounded-lg text-center font-mono bg-white outline-none text-indigo-600 font-bold" value={formData.score} onChange={e => setFormData({...formData, score: e.target.value})} /></label>
            
            <label style={styles.label}>پلن مهاجرتی مورد نیاز:
              <select className="mt-1 p-2 border rounded-lg bg-white outline-none font-bold text-slate-700" value={formData.requested_plan} onChange={e => setFormData({...formData, requested_plan: e.target.value})}>
                <option value="مهاجرت تحصیلی">مهاجرت تحصیلی</option><option value="آوسبیلدونگ">آوسبیلدونگ</option><option value="جاب آفر / کاری">جاب آفر / کاری</option><option value="تمکن مالی / سرمایه‌گذاری">تمکن مالی / سرمایه‌گذاری</option>
              </select>
            </label>
            <label style={styles.label}>کشور مقصد:<input type="text" className="mt-1 p-2 border rounded-lg bg-white outline-none font-bold" placeholder="آلمان" value={formData.target_country} onChange={e => setFormData({...formData, target_country: e.target.value})} /></label>
            <label style={styles.label}>میزان تمکن مالی (تومان):<input type="number" className="mt-1 p-2 border rounded-lg bg-white outline-none font-mono" placeholder="مثلا 500000000" value={formData.financial_capability_toman} onChange={e => setFormData({...formData, financial_capability_toman: e.target.value})} /></label>
            <label style={styles.label}>لینک فرم ورودی لید:<input type="text" className="mt-1 p-2 border rounded-lg bg-slate-50 font-mono text-sky-600 outline-none text-[10px]" value={formData.form_link} onChange={e => setFormData({...formData, form_link: e.target.value})} /></label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <label style={styles.label}>انگلیسی (عمومی):<select className="mt-1 p-2 border rounded-lg bg-white outline-none" value={formData.english_level} onChange={e => setFormData({...formData, english_level: e.target.value})}><option value="مبتدی (A1/A2)">مبتدی</option><option value="متوسط (B1/B2)">متوسط</option><option value="پیشرفته (C1/C2)">پیشرفته</option><option value="هیچ آشنایی ندارد">هیچ آشنایی ندارد</option></select></label>
            <label style={styles.label}>آلمانی (عمومی):<select className="mt-1 p-2 border rounded-lg bg-white outline-none" value={formData.german_level} onChange={e => setFormData({...formData, german_level: e.target.value})}><option value="هیچ آشنایی ندارد">هیچ آشنایی ندارد</option><option value="A1">A1</option><option value="A2">A2</option><option value="B1">B1</option><option value="B2">B2</option></select></label>
            <label style={styles.label}>مدرک رسمی انگلیسی:<select className="mt-1 p-2 border rounded-lg bg-white outline-none font-bold text-indigo-600" value={formData.english_certified_level} onChange={e => setFormData({...formData, english_certified_level: e.target.value})}><option value="مدرک ندارد">مدرک ندارد</option><option value="IELTS">IELTS</option><option value="TOEFL">TOEFL</option></select></label>
            <label style={styles.label}>مدرک رسمی آلمانی:<select className="mt-1 p-2 border rounded-lg bg-white outline-none font-bold text-indigo-600" value={formData.german_certified_level} onChange={e => setFormData({...formData, german_certified_level: e.target.value})}><option value="مدرک ندارد">مدرک ندارد</option><option value="ÖSD">ÖSD</option><option value="Goethe">Goethe</option></select></label>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2">
            <label style={styles.label}>سوابق سوابق کاری، بیمه و اشتغال متقاضی:<textarea rows={2} className="mt-1 p-2 border rounded-lg bg-white outline-none leading-relaxed" placeholder="محل اشتغال، مدت زمان رد شدن بیمه..." value={formData.work_and_insurance_history} onChange={e => setFormData({...formData, work_and_insurance_history: e.target.value})} /></label>
          </div>
        </div>

        {/* ۳. تخصیص کارتابل و ورک‌فلو سازمان */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-amber-600 border-b pb-1.5">🏢 ورک‌فلو ارجاع لید و بازه‌های زمانی</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* 🚀 تخصیص داینامیک به دپارتمان فعال سازمان */}
            <label style={styles.label}>🏢 ارجاع مستقیم به دپارتمان:
              <select className="mt-1 p-2 border rounded-lg bg-white outline-none font-bold text-indigo-600" value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})}>
                <option value="">انتخاب دپارتمان مربوطه...</option>
                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>

            {/* 🚀 تخصیص مستقیم به کارشناس مسئول (Agent مسئول) */}
            <label style={styles.label}>💼 کارشناس پیگیری‌کننده (Agent):
              <select className="mt-1 p-2 border rounded-lg bg-white outline-none font-bold text-slate-700" value={formData.assigned_agent_id} onChange={e => setFormData({...formData, assigned_agent_id: e.target.value})}>
                <option value="">تخصیص آزاد سیستمی...</option>
                {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>

            <label style={styles.label}>وضعیت اولیه پرونده:
              <select className="mt-1 p-2 border rounded-lg bg-white outline-none font-bold text-purple-700" value={formData.initial_consultation_status} onChange={e => setFormData({...formData, initial_consultation_status: e.target.value})}>
                <option value="مشاوره جدید">مشاوره جدید</option><option value="در انتظار تماس اولیه">در انتظار تماس اولیه</option><option value="عدم پاسخگویی">عدم پاسخگویی</option><option value="مشاوره انجام شد">مشاوره انجام شد</option>
              </select>
            </label>

            <label style={styles.label}>سورس ورودی:
              <select className="mt-1 p-2 border rounded-lg bg-white outline-none font-medium" value={formData.lead_source} onChange={e => setFormData({...formData, lead_source: e.target.value})}>
                <option value="ورود دستی فرانت">ورود دستی فرانت</option>
                {sources.map((src, i) => <option key={i} value={src}>{src}</option>)}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div><label style={styles.label}>تاریخ جلسه (شمسی):</label><input type="text" className="mt-1 p-2 border rounded-lg w-full text-center outline-none bg-slate-50 font-mono" placeholder="کلیک برای تاریخ امروز" value={formData.session_date_shamsi} onFocus={() => setTodayDate('session_date_shamsi')} onChange={e => setFormData({...formData, session_date_shamsi: e.target.value})} /></div>
            <div><label style={styles.label}>تاریخ تبدیل به کلاینت (شمسی):</label><input type="text" className="mt-1 p-2 border rounded-lg w-full text-center outline-none bg-slate-50 font-mono" placeholder="کلیک برای تاریخ امروز" value={formData.client_conversion_date_shamsi} onFocus={() => setTodayDate('client_conversion_date_shamsi')} onChange={e => setFormData({...formData, client_conversion_date_shamsi: e.target.value})} /></div>
            <div><label style={styles.label}>زمان تماس بعدی☎️ (شمسی):</label><input type="text" className="mt-1 p-2 border rounded-lg w-full text-center outline-none font-bold text-indigo-600 bg-slate-50 font-mono" placeholder="کلیک برای تاریخ امروز" value={formData.next_call_date_shamsi} onFocus={() => setTodayDate('next_call_date_shamsi')} onChange={e => setFormData({...formData, next_call_date_shamsi: e.target.value})} /></div>
          </div>
        </div>

        {/* ۴. وضعیت خانواده و تاهل */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-pink-600 border-b pb-1.5">💍 وضعیت تاهل و ساختار خانواده متقاضی</h3>
          <div className="flex gap-4 items-center bg-slate-50 p-2.5 rounded-xl border">
            <span className="font-bold text-slate-700">وضعیت تاهل متقاضی:</span>
            <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="marital_status" value="single" checked={formData.marital_status === 'single'} onChange={e => setFormData({...formData, marital_status: e.target.value})} /> مجرد</label>
            <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="marital_status" value="married" checked={formData.marital_status === 'married'} onChange={e => setFormData({...formData, marital_status: e.target.value})} /> متاهل</label>
          </div>

          {formData.marital_status === 'married' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 bg-pink-50/20 p-4 rounded-xl border border-pink-100/60 animate-fadeIn">
              <label style={styles.label}>نام و نام خانوادگی همسر:<input type="text" className="mt-1 p-2 border rounded-lg bg-white outline-none" value={formData.spouse_name} onChange={e => setFormData({...formData, spouse_name: e.target.value})} /></label>
              <label style={styles.label}>سن همسر:<input type="number" className="mt-1 p-2 border rounded-lg text-center bg-white outline-none" value={formData.spouse_age} onChange={e => setFormData({...formData, spouse_age: e.target.value})} /></label>
              <label style={styles.label}>رشته و تحصیلات همسر:<input type="text" className="mt-1 p-2 border rounded-lg bg-white outline-none" value={formData.spouse_education} onChange={e => setFormData({...formData, spouse_education: e.target.value})} /></label>
              <label style={styles.label}>سطح زبان همسر:<input type="text" className="mt-1 p-2 border rounded-lg bg-white outline-none" placeholder="مثلا آلمانی B1" value={formData.spouse_language_level} onChange={e => setFormData({...formData, spouse_language_level: e.target.value})} /></label>
              <label style={styles.label}>تعداد فرزندان همراه:<input type="number" className="mt-1 p-2 border rounded-lg text-center bg-white outline-none" value={formData.children_count} onChange={e => setFormData({...formData, children_count: e.target.value})} /></label>
              <label style={styles.label}>آیا همسر همراه سفر است؟
                <select className="mt-1 p-2 border rounded-lg bg-white outline-none font-medium text-slate-700" value={formData.spouse_accompanying} onChange={e => setFormData({...formData, spouse_accompanying: e.target.value})}>
                  <option value="yes">بله، همراه پرونده است</option>
                  <option value="no">خیر، همراه نیست</option>
                </select>
              </label>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label style={styles.label}>📝 یادداشت فرعی و توضیحات تکمیلی پرونده:
            <textarea rows={3} className="mt-1 p-2 border rounded-lg w-full bg-white outline-none font-sans leading-relaxed" placeholder="ملاحظات مشاور..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </label>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-black text-xs transition-all disabled:bg-slate-300 shadow-sm cursor-pointer text-center">
            {loading ? '⏳ در حال تایید گارد و ثبت پرونده مهاجرتی...' : '🚀 ثبت قطعی و ارجاع متمرکز لید به کارتابل دپارتمان'}
          </button>
        </div>

      </form>
    </div>
  );
}

const styles = {
  label: { display: 'flex', flexDirection: 'column' as const, fontSize: '12px', fontWeight: '500', color: '#475569' },
};