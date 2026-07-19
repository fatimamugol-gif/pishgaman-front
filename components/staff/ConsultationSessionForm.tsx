'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';

interface ConsultationSessionFormProps {
  leadId?: number;
  leadData?: any;
  initialData?: any;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function ConsultationSessionForm({ leadId, leadData, initialData, onSuccess, onCancel }: ConsultationSessionFormProps) {
  const [formData, setFormData] = useState({
    // Session info
    lead_id: leadId || '',
    agent_id: '',
    session_date: '',
    session_date_shamsi: '',
    session_type: 'initial',
    status: 'scheduled',
    notes: '',

    // Personal info
    first_name: '',
    last_name: '',
    age: '',
    marital_status: '',
    military_status: '',

    // Education
    last_degree: '',
    gpa: '',
    graduation_year: '',
    field_of_study: '',

    // Language & financial
    language_degree: '',
    language_score: '',
    financial_capability: '',
    has_job_offer: false,

    // Visa info
    target_country: '',
    visa_type: '',

    // Spouse info
    spouse_name: '',
    spouse_phone: '',
  });

  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const BACKEND_BASE_URL = API_BASE_URL;

  useEffect(() => {
    // Get current user from localStorage
    const localUser = localStorage.getItem('user');
    const user = localUser ? JSON.parse(localUser) : null;
    setCurrentUser(user);

    if (initialData) {
      setFormData(initialData);
    } else {
      // Auto-fill from lead data if available
      if (leadData) {
        setFormData(prev => ({
          ...prev,
          first_name: leadData.name?.split(' ')[0] || '',
          last_name: leadData.name?.split(' ').slice(1).join(' ') || '',
          lead_id: leadId || '',
          agent_id: user?.id || '',
        }));
      } else if (user) {
        // At least set the current agent
        setFormData(prev => ({
          ...prev,
          agent_id: user.id || '',
        }));
      }
    }

    // Fetch agents (still needed for reference, but auto-select current user)
    fetch(`${BACKEND_BASE_URL}/next/users`, {
      headers: getAuthHeaders(false)
    })
      .then(res => res.json())
      .then(data => { if(data.status === 'success') setAgents(data.data || []); });
  }, [initialData, leadData, leadId]);

  // Convert Jalali to Gregorian
  const jalaliToGregorian = (jalaliDate: string): string => {
    if (!jalaliDate) return '';
    // Format: YYYY/MM/DD
    const parts = jalaliDate.split('/').map(Number);
    if (parts.length !== 3) return '';

    const [jy, jm, jd] = parts;
    const gy = jy <= 979 ? 621 : 1600;
    const j_day_no = 365 * (jy - (jy <= 979 ? 0 : 979)) +
      Math.floor((jy - (jy <= 979 ? 0 : 979)) / 4) +
      Math.floor(((jy - (jy <= 979 ? 0 : 979)) % 4 + 3) / 4) * 365 +
      Math.floor((jm - 1) * 30.6) +
      jd - 1;

    const g_day_no = j_day_no - 79;

    const gy2 = 1600 + 400 * Math.floor(g_day_no / 146097);
    let remainder = g_day_no % 146097;
    const g_day_no2 = remainder - Math.floor(remainder / 36524) * 36524;
    const gy3 = 100 * Math.floor(g_day_no2 / 36524);
    remainder = g_day_no2 % 36524;
    const g_day_no3 = remainder + Math.floor(remainder / 1460) * 365;
    const gy4 = Math.floor(g_day_no3 / 1460);
    remainder = g_day_no3 % 1460;
    const g_day_no4 = Math.floor((remainder - Math.floor(remainder / 365) * 365) / 4);
    const gm = Math.floor((remainder - Math.floor(remainder / 365) * 365) / 365) * 12;
    const gd = remainder - Math.floor(remainder / 365) * 365 + 1;

    const g_year = gy2 + gy3 + gy4;
    const g_month = gm + 1;
    const g_day = gd;

    return `${g_year}-${String(g_month).padStart(2, '0')}-${String(g_day).padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        gpa: formData.gpa ? parseFloat(formData.gpa) : null,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
        financial_capability: formData.financial_capability ? parseInt(formData.financial_capability) : 0,
      };

      const res = await fetch(`${BACKEND_BASE_URL}/next/consultation-sessions`, {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        alert('جلسه مشاوره با موفقیت ثبت شد');
        onSuccess();
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
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <div>
          <h2 className="text-sm font-black text-slate-900">📋 فرم ثبت جلسه مشاوره</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">ثبت اطلاعات کامل جلسه مشاوره اولیه متقاضی</p>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 font-bold">
        
        {/* Session Info */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-indigo-600 border-b pb-1.5">📞 اطلاعات جلسه</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-500 mb-1">لید:</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded-xl bg-slate-50 outline-none"
                value={formData.lead_id}
                disabled
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">مشاور:</label>
              <input
                type="text"
                className="w-full p-2 border rounded-xl bg-slate-50 outline-none"
                value={agents.find((a: any) => a.id === formData.agent_id)?.name || currentUser?.name || 'کاربر فعلی'}
                disabled
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">تاریخ جلسه:</label>
              <input
                type="date"
                required
                className="w-full p-2 border rounded-xl bg-slate-50 outline-none font-mono text-center"
                value={formData.session_date}
                onChange={e => setFormData({ ...formData, session_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">نوع جلسه:</label>
              <select 
                className="w-full p-2 border rounded-xl bg-white outline-none"
                value={formData.session_type}
                onChange={e => setFormData({ ...formData, session_type: e.target.value })}
              >
                <option value="initial">مشاوره اولیه</option>
                <option value="followup">پیگیری</option>
                <option value="final">جلسه نهایی</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">وضعیت:</label>
              <select 
                className="w-full p-2 border rounded-xl bg-white outline-none"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="scheduled">برنامه‌ریزی شده</option>
                <option value="completed">تکمیل شده</option>
                <option value="cancelled">لغو شده</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-slate-500 mb-1">یادداشت‌ها:</label>
            <textarea 
              rows={3} 
              className="w-full p-2 border rounded-xl bg-slate-50 outline-none resize-none"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        {/* Personal Info */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-emerald-600 border-b pb-1.5">👤 اطلاعات هویتی</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-500 mb-1">نام:</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-xl bg-slate-50 outline-none"
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">نام خانوادگی:</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-xl bg-slate-50 outline-none"
                value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">سن:</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded-xl bg-slate-50 outline-none text-center"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">وضعیت تاهل:</label>
              <select 
                className="w-full p-2 border rounded-xl bg-white outline-none"
                value={formData.marital_status}
                onChange={e => setFormData({ ...formData, marital_status: e.target.value })}
              >
                <option value="">انتخاب...</option>
                <option value="single">مجرد</option>
                <option value="married">متاهل</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">وضعیت نظام وظیفه:</label>
              <select 
                className="w-full p-2 border rounded-xl bg-white outline-none"
                value={formData.military_status}
                onChange={e => setFormData({ ...formData, military_status: e.target.value })}
              >
                <option value="">انتخاب...</option>
                <option value="exempt">معاف</option>
                <option value="served">انجام شده</option>
                <option value="serving">در حال خدمت</option>
                <option value="not_required">مشمول نمی‌باشد</option>
              </select>
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-amber-600 border-b pb-1.5">🎓 سوابق تحصیلی</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 mb-1">آخرین مدرک تحصیلی:</label>
              <select 
                className="w-full p-2 border rounded-xl bg-white outline-none"
                value={formData.last_degree}
                onChange={e => setFormData({ ...formData, last_degree: e.target.value })}
              >
                <option value="">انتخاب...</option>
                <option value="diploma">دیپلم</option>
                <option value="associate">کاردانی</option>
                <option value="bachelor">کارشناسی</option>
                <option value="master">کارشناسی ارشد</option>
                <option value="phd">دکتری</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">معدل:</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full p-2 border rounded-xl bg-slate-50 outline-none text-left font-mono"
                value={formData.gpa}
                onChange={e => setFormData({ ...formData, gpa: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">سال فارغ‌التحصیلی:</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded-xl bg-slate-50 outline-none text-center"
                value={formData.graduation_year}
                onChange={e => setFormData({ ...formData, graduation_year: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">رشته تحصیلی:</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-xl bg-slate-50 outline-none"
                value={formData.field_of_study}
                onChange={e => setFormData({ ...formData, field_of_study: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Language & Financial */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-purple-600 border-b pb-1.5">🌐 مدرک زبان و تمکن مالی</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 mb-1">نوع مدرک زبان:</label>
              <select 
                className="w-full p-2 border rounded-xl bg-white outline-none"
                value={formData.language_degree}
                onChange={e => setFormData({ ...formData, language_degree: e.target.value })}
              >
                <option value="">انتخاب...</option>
                <option value="ielts">IELTS</option>
                <option value="toefl">TOEFL</option>
                <option value="duolingo">Duolingo</option>
                <option value="pte">PTE</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">نمره زبان:</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-xl bg-slate-50 outline-none"
                value={formData.language_score}
                onChange={e => setFormData({ ...formData, language_score: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">تمکن مالی (تومان):</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded-xl bg-emerald-500/5 text-emerald-600 font-mono font-black outline-none"
                value={formData.financial_capability}
                onChange={e => setFormData({ ...formData, financial_capability: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">جاب آفر:</label>
              <select 
                className="w-full p-2 border rounded-xl bg-white outline-none"
                value={formData.has_job_offer ? 'true' : 'false'}
                onChange={e => setFormData({ ...formData, has_job_offer: e.target.value === 'true' })}
              >
                <option value="false">ندارد</option>
                <option value="true">دارد</option>
              </select>
            </div>
          </div>
        </div>

        {/* Visa Info */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-pink-600 border-b pb-1.5">📊 اطلاعات ویزا</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 mb-1">کشور مقصد:</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-xl bg-slate-50 outline-none"
                value={formData.target_country}
                onChange={e => setFormData({ ...formData, target_country: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">نوع ویزا:</label>
              <select 
                className="w-full p-2 border rounded-xl bg-white outline-none"
                value={formData.visa_type}
                onChange={e => setFormData({ ...formData, visa_type: e.target.value })}
              >
                <option value="">انتخاب...</option>
                <option value="study">ویزای تحصیلی</option>
                <option value="work">ویزای کاری</option>
                <option value="investment">ویزای سرمایه‌گذاری</option>
                <option value="tourist">ویزای توریستی</option>
              </select>
            </div>
          </div>
        </div>

        {/* Spouse Info */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-sky-600 border-b pb-1.5">💑 اطلاعات همسر</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 mb-1">نام همسر:</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-xl bg-slate-50 outline-none"
                value={formData.spouse_name}
                onChange={e => setFormData({ ...formData, spouse_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">شماره تماس همسر:</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-xl bg-slate-50 outline-none text-left font-mono"
                value={formData.spouse_phone}
                onChange={e => setFormData({ ...formData, spouse_phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <button 
            type="submit" 
            disabled={loading} 
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-black text-xs shadow-sm text-center disabled:opacity-50"
          >
            {loading ? '⏳ در حال ثبت...' : '🚀 ثبت جلسه مشاوره'}
          </button>
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-xl font-bold text-xs"
            >
              انصراف
            </button>
          )}
        </div>
      </form>
    </div>
  );
}