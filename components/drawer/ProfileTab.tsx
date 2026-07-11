// components/drawer/ProfileTab.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface ProfileTabProps {
  selectedLead: any;
  setSelectedLead: (lead: any) => void;
  isEditing: boolean;
  setIsEditing: (edit: boolean) => void;
  departments: any[];
  agents: any[];
  personasList: string[];
  sourceOptions: string[];
  onUpdate: (lead: any) => Promise<void>;
  handleRecalculateScore: () => void;
  scoringLoading: boolean;
  isConverting: boolean;
  handleConvertToOfficialClient: () => void;
}

export default function ProfileTab({
  selectedLead, setSelectedLead, isEditing, setIsEditing, departments, agents, personasList, sourceOptions, onUpdate, handleRecalculateScore, scoringLoading, isConverting, handleConvertToOfficialClient
}: ProfileTabProps) {

  const [millionInput, setMillionInput] = useState(
    selectedLead.financial_capability_toman ? (parseFloat(selectedLead.financial_capability_toman) / 1000000).toString() : ''
  );

  useEffect(() => {
    if (selectedLead.financial_capability_toman) {
      setMillionInput((parseFloat(selectedLead.financial_capability_toman) / 1000000).toString());
    }
  }, [selectedLead.financial_capability_toman]);

  const handleGenderChange = (gender: string) => {
    setSelectedLead({
      ...selectedLead,
      gender,
      military_status: gender === 'female' ? 'عدم نیاز - بانوان' : selectedLead.military_status
    });
  };

  const handleMillionChange = (val: string) => {
    setMillionInput(val);
    const calculatedToman = val ? parseFloat(val) * 1000000 : 0;
    setSelectedLead({ ...selectedLead, financial_capability_million: val, financial_capability_toman: calculatedToman });
  };

  const getFinancialCapabilityMillion = (toman: any) => {
    if (!toman || toman === 0) return 'ثبت نشده';
    const million = parseFloat(toman) / 1000000;
    return `${million.toLocaleString()} میلیون تومان`;
  };

  return (
    <div className="space-y-4 pb-10">
      
      {/* رنکینگ و امتیاز */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border">
        <div>
          <span className="text-[10px] text-slate-400 block font-bold">امتیاز هوشمند پرونده:</span>
          <span className="text-sm font-black text-indigo-600 font-mono">🌟 {selectedLead.score || 'در انتظار ارزیابی'}</span>
        </div>
        <button type="button" onClick={handleRecalculateScore} disabled={scoringLoading} className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-xs">
          {scoringLoading ? '⏳ محاسبه...' : '🔄 محاسبه مجدد امتیاز'}
        </button>
      </div>

      {selectedLead.status !== 'official_client' && (
        <div className="pt-1">
          <button type="button" disabled={isConverting} onClick={handleConvertToOfficialClient} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black py-2.5 px-4 rounded-xl text-center text-[11px] shadow-sm">
            👑 {isConverting ? '⏳ در حال ارتقای پرونده...' : 'تبدیل به کلاینت رسمی و عقد قرارداد پورتال'}
          </button>
        </div>
      )}

      {/* هوش مصنوعی */}
      <div className="p-4 border border-purple-100 bg-purple-50/40 rounded-2xl space-y-2">
        <h3 className="text-xs font-black text-purple-700">🧠 خلاصه کانتکست و پیشنهاد هوش مصنوعی (RAG)</h3>
        <div className="flex flex-wrap gap-2 text-slate-700">
          <div>🎯 پرسونای روان‌شناختی: <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black">{selectedLead.persona || 'تعیین نشده'}</span></div>
          <div>💎 لید عالی: <span className="text-emerald-600">{selectedLead.is_excellent_lead === 1 ? 'بله ✔️' : 'خیر'}</span></div>
        </div>
        <p className="text-slate-500 leading-relaxed bg-white dark:bg-slate-950 p-2 rounded-lg border border-purple-50 mt-1"><strong>💡 نقشه راه ادمین:</strong> {selectedLead.ai_insights?.summary || 'سیستم در حال تحلیل پیام‌ها و تراکنش‌های خطوط متقاضی است.'}</p>
      </div>

      {isEditing ? (
        <div className="space-y-4 animate-fadeIn">
          {/* پنل ویرایش ادیتور */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border space-y-3">
            <h4 className="font-bold text-indigo-600 border-b pb-1">📞 هویت و اطلاعات ارتباطی و دپارتمانی</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">نام متقاضی:<input type="text" className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={selectedLead.name || ''} onChange={e => setSelectedLead({ ...selectedLead, name: e.target.value })} /></label>
              <label className="flex flex-col gap-1">جنسیت متقاضی:
                <select className="p-2 border rounded-lg bg-white dark:bg-slate-900 font-bold text-indigo-600" value={selectedLead.gender || 'male'} onChange={e => handleGenderChange(e.target.value)}>
                  <option value="male">👨 آقا (مرد)</option><option value="female">👩 خانم (زن)</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">تلفن همراه اول:<input type="text" className="p-2 border rounded-lg text-left font-mono bg-white dark:bg-slate-900" value={selectedLead.phone || ''} onChange={e => setSelectedLead({ ...selectedLead, phone: e.target.value })} /></label>
              <label className="flex flex-col gap-1">تلفن همراه دوم:<input type="text" className="p-2 border rounded-lg text-left font-mono bg-white dark:bg-slate-900" value={selectedLead.secondary_phone || ''} onChange={e => setSelectedLead({ ...selectedLead, secondary_phone: e.target.value })} /></label>
              <label className="flex flex-col gap-1">شهر محل سکونت:<input type="text" className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={selectedLead.current_city || ''} onChange={e => setSelectedLead({ ...selectedLead, current_city: e.target.value })} /></label>
              <label className="flex flex-col gap-1">سن متقاضی:<input type="number" className="p-2 border rounded-lg text-center bg-white dark:bg-slate-900" value={selectedLead.age || ''} onChange={e => setSelectedLead({ ...selectedLead, age: e.target.value })} /></label>
              <label className="flex flex-col gap-1">وضعیت نظام وظیفه:
                <select className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={selectedLead.military_status || 'کارت پایان خدمت'} onChange={e => setSelectedLead({ ...selectedLead, military_status: e.target.value })} disabled={selectedLead.gender === 'female'}>
                  {selectedLead.gender === 'female' ? <option value="عدم نیاز - بانوان">عدم نیاز - بانوان 👩</option> : (
                    <>
                      <option value="کارت پایان خدمت">کارت پایان خدمت</option>
                      <option value="معافیت دائم">معافیت دائم</option>
                      <option value="معافیت تحصیلی">معافیت تحصیلی</option>
                      <option value="مشمول">مشمول (بدون خدمت)</option>
                    </>
                  )}
                </select>
              </label>
              <label className="flex flex-col gap-1">🎯 پرسونای روان‌شناختی (AI):
                <select className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={selectedLead.persona || 'Goal Oriented'} onChange={e => setSelectedLead({ ...selectedLead, persona: e.target.value })}>
                  {personasList.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">💼 منبع کانال ورودی:
                <select className="p-2 border rounded-lg bg-white dark:bg-slate-900 text-indigo-600 outline-none" value={selectedLead.source || 'سایت اصلی'} onChange={e => setSelectedLead({ ...selectedLead, source: e.target.value })}>
                  {sourceOptions.map(sc => <option key={sc} value={sc}>{sc}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">🏢 ارجاع به دپارتمان:
                <select className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={selectedLead.department_id || ''} onChange={e => setSelectedLead({ ...selectedLead, department_id: e.target.value })}>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">🧑‍💼 کارشناس مسئول:
                <select className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={selectedLead.assigned_agent_id || ''} onChange={e => setSelectedLead({ ...selectedLead, assigned_agent_id: e.target.value })}>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">📅 تاریخ جلسه ارشد:<input type="date" className="p-2 border rounded-lg font-mono text-center bg-white dark:bg-slate-900" value={selectedLead.session_date_shamsi || ''} onChange={e => setSelectedLead({ ...selectedLead, session_date_shamsi: e.target.value })} /></label>
              <label className="flex flex-col gap-1">☎️ موعد تماس بعدی:<input type="date" className="p-2 border rounded-lg font-mono text-center text-indigo-600 bg-white dark:bg-slate-900" value={selectedLead.next_call_date_shamsi || ''} onChange={e => setSelectedLead({ ...selectedLead, next_call_date_shamsi: e.target.value })} /></label>
            </div>
          </div>

          {/* ویرایش ساختار خانواده */}
          <div className="bg-pink-50/30 dark:bg-slate-950 p-4 rounded-xl border border-pink-100 space-y-3">
            <h4 className="font-bold text-pink-700 border-b pb-1">💍 وضعیت تاهل، همسر و فرزندان همراه کیس</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">وضعیت تاهل:
                <select className="p-2 border rounded-lg bg-white dark:bg-slate-900 font-bold" value={selectedLead.marital_status || 'single'} onChange={e => setSelectedLead({ ...selectedLead, marital_status: e.target.value })}>
                  <option value="single">مجرد</option><option value="married">متاهل</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">تعداد فرزندان:<input type="number" className="p-2 border rounded-lg text-center bg-white dark:bg-slate-900" value={selectedLead.children_count || '0'} onChange={e => setSelectedLead({ ...selectedLead, children_count: e.target.value })} /></label>
            </div>
            {selectedLead.marital_status === 'married' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-dashed border-pink-100 animate-fadeIn">
                <label className="flex flex-col gap-1">نام همسر:<input type="text" className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={selectedLead.spouse_name || ''} onChange={e => setSelectedLead({ ...selectedLead, spouse_name: e.target.value })} /></label>
                <label className="flex flex-col gap-1">سن همسر:<input type="number" className="p-2 border rounded-lg text-center bg-white dark:bg-slate-900" value={selectedLead.spouse_age || ''} onChange={e => setSelectedLead({ ...selectedLead, spouse_age: e.target.value })} /></label>
                <label className="flex flex-col gap-1">تحصیلات همسر:<input type="text" className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={selectedLead.spouse_education || ''} onChange={e => setSelectedLead({ ...selectedLead, spouse_education: e.target.value })} /></label>
                <label className="flex flex-col gap-1">سطح زبان همسر:<input type="text" className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={selectedLead.spouse_language_level || ''} onChange={e => setSelectedLead({ ...selectedLead, spouse_language_level: e.target.value })} /></label>
                <label className="flex flex-col gap-1 sm:col-span-2">سابقه کار همسر:<input type="text" className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={selectedLead.spouse_work_history || ''} onChange={e => setSelectedLead({ ...selectedLead, spouse_work_history: e.target.value })} /></label>
                <label className="flex flex-col gap-1 sm:col-span-2">وضعیت همراهی سفر:
                  <select className="p-2 border rounded-lg bg-white dark:bg-slate-900 font-bold" value={selectedLead.spouse_accompanying || 'yes'} onChange={e => setSelectedLead({ ...selectedLead, spouse_accompanying: e.target.value })}>
                    <option value="yes">بله، همراه سفر است</option><option value="no">خیر، همراه نیست</option>
                  </select>
                </label>
              </div>
            )}
          </div>

          {/* تحصیلات و مدارک زبان در مود ادیت */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border space-y-3">
            <h4 className="font-bold text-emerald-600 border-b pb-1">🎓 تحصیلات، رزومه آکادمیک و مدارک رسمی زبان متقاضی</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">آخرین مدرک تحصیلی:<input type="text" className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={selectedLead.education_level || ''} onChange={e => setSelectedLead({ ...selectedLead, education_level: e.target.value })} /></label>
              <label className="flex flex-col gap-1">رشته تحصیلی:<input type="text" className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={selectedLead.field_of_study || ''} onChange={e => setSelectedLead({ ...selectedLead, field_of_study: e.target.value })} /></label>
              <label className="flex flex-col gap-1">معدل کل (GPA):<input type="text" className="p-2 border rounded-lg text-center font-mono bg-white dark:bg-slate-900" value={selectedLead.gpa || ''} onChange={e => setSelectedLead({ ...selectedLead, gpa: e.target.value })} /></label>
              <label className="flex flex-col gap-1">سوابق بیمه و کار:<input type="text" className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={selectedLead.work_and_insurance_history || ''} onChange={e => setSelectedLead({ ...selectedLead, work_and_insurance_history: e.target.value })} /></label>
              <label className="flex flex-col gap-1">انگلیسی عمومی:<input type="text" className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={selectedLead.english_level || ''} onChange={e => setSelectedLead({ ...selectedLead, english_level: e.target.value })} /></label>
              <label className="flex flex-col gap-1">مدرک انگلیسی:<input type="text" className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={selectedLead.english_certified_level || ''} onChange={e => setSelectedLead({ ...selectedLead, english_certified_level: e.target.value })} /></label>
              <label className="flex flex-col gap-1">زبان آلمانی:<input type="text" className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={selectedLead.german_level || ''} onChange={e => setSelectedLead({ ...selectedLead, german_level: e.target.value })} /></label>
              <label className="flex flex-col gap-1">مدرک آلمانی:<input type="text" className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={selectedLead.german_certified_level || ''} onChange={e => setSelectedLead({ ...selectedLead, german_certified_level: e.target.value })} /></label>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border space-y-3">
            <h4 className="font-bold text-cyan-600 border-b pb-1">✈️ اهداف مهاجرتی و تمکن مالی پرونده</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">کشور هدف مقصد:<input type="text" className="p-2 border rounded-lg bg-white dark:bg-slate-900 font-bold" value={selectedLead.target_country || ''} onChange={e => setSelectedLead({ ...selectedLead, target_country: e.target.value })} /></label>
              <label className="flex flex-col gap-1">پلن مهاجرتی:
                <select className="p-2 border rounded-lg bg-white dark:bg-slate-900 font-bold" value={selectedLead.requested_plan || 'مهاجرت تحصیلی'} onChange={e => setSelectedLead({ ...selectedLead, requested_plan: e.target.value })}>
                  <option value="مهاجرت تحصیلی">مهاجرت تحصیلی</option><option value="آوسبیلدونگ">آوسبیلدونگ</option><option value="جاب آفر / کاری">جاب آفر / کاری</option><option value="تمکن مالی / سرمایه‌گذاری">تمکن مالی / سرمایه‌گذاری</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">میزان تمکن مالی (به میلیون تومان):<input type="number" className="p-2 border rounded-lg bg-white dark:bg-slate-900 font-mono font-bold text-emerald-600" value={millionInput} onChange={e => handleMillionChange(e.target.value)} /></label>
              <label className="flex flex-col gap-1">کانال دیسکاوری مجموعه:<input type="text" className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={selectedLead.discovery_channel || ''} onChange={e => setSelectedLead({ ...selectedLead, discovery_channel: e.target.value })} /></label>
            </div>
            <label className="flex flex-col gap-1 mt-2">📝 یادداشت و توضیحات تکمیلی مشاور:<textarea rows={3} className="p-2 border rounded-lg bg-white dark:bg-slate-900 font-sans outline-none leading-relaxed font-medium" value={selectedLead.description || ''} onChange={e => setSelectedLead({ ...selectedLead, description: e.target.value })} /></label>
          </div>

          {/* 🎯 پچ پایداری دائمی: فراخوانی مگا-فانکشن روت کلاینت */}
          <button 
            type="button" 
            onClick={async () => {
              try {
                // ارسال اتمیک کل استیت ویرایش شده به متد والد جهت ارسال هدر POST به لاراول
                await onUpdate(selectedLead);
                setIsEditing(false);
              } catch (err) {
                console.error(err);
                setIsEditing(false);
              }
            }} 
            className="w-full bg-emerald-600 text-white p-3 rounded-xl font-bold shadow-md cursor-pointer hover:bg-emerald-700 transition-all text-center"
          >
            💾 ذخیره کل تغییرات چهل‌گانه شناسنامه
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          {/* ۱. لایه نمایش مشخصات فردی */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-indigo-600 border-b pb-1">👤 اطلاعات فردی، ارتباطی و سازمانی کلاینت</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
              <div>📌 <strong>نام متقاضی:</strong> <span className="text-slate-800 dark:text-white font-bold">{selectedLead.name || '---'}</span></div>
              <div>⚧️ <strong>جنسیت متقاضی:</strong> <span className="text-slate-800 dark:text-white font-bold">{selectedLead.gender === 'female' ? '👩 خانم (زن)' : '👨 آقا (مرد)'}</span></div>
              <div>📱 <strong>تلفن همراه اصلی:</strong> <span className="font-mono text-slate-800 dark:text-white font-bold">{selectedLead.phone || '---'}</span></div>
              <div>📞 <strong>تلفن همراه دوم:</strong> <span className="font-mono">{selectedLead.secondary_phone || 'ثبت نشده'}</span></div>
              <div>📍 <strong>شهر سکونت:</strong> <span className="text-slate-700 dark:text-slate-200">{selectedLead.current_city || '---'}</span></div>
              <div>🎂 <strong>سن کلاینت:</strong> <span>{selectedLead.age || '---'} سال</span></div>
              <div>🪖 <strong>وضعیت نظام وظیفه:</strong> <span>{selectedLead.military_status || '---'}</span></div>
              <div>🏢 <strong>لاین دپارتمان:</strong> <span className="text-indigo-600">{selectedLead.department_name || 'در انتظار تخصیص'}</span></div>
              <div>🧑‍💼 <strong>کارشناس مسئول:</strong> <span>{selectedLead.assigned_agent || 'سیستم آزاد'}</span></div>
              <div>📅 <strong>تاریخ ایجاد پرونده:</strong> <span className="font-mono">{selectedLead.created_at_text || '---'}</span></div>
              <div>⏰ <strong>تاریخ جلسه ارشد:</strong> <span className="font-mono text-amber-600 font-black">{selectedLead.session_date_shamsi || '---'}</span></div>
              <div>📞 <strong>موعد تماس بعدی:</strong> <span className="font-mono text-indigo-600 font-black">{selectedLead.next_call_date_shamsi || '---'}</span></div>
            </div>
          </div>

          {/* ۲. لایه نمایش وضعیت تاهل و خانواده */}
          <div className="bg-pink-50/40 dark:bg-slate-950 p-4 rounded-xl border border-pink-100/70 space-y-2">
            <h4 className="font-bold text-pink-700 border-b pb-1">💍 وضعیت تاهل و ساختار خانواده کلاینت</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
              <div>📌 <strong>وضعیت تاهل:</strong> <span className="text-pink-700 font-black">{selectedLead.marital_status === 'married' ? 'متاهل 👨‍👩‍👦' : 'مجرد 🧍'}</span></div>
              <div>👶 <strong>تعداد فرزندان همراه:</strong> <span className="font-mono font-bold text-slate-800 dark:text-white">{selectedLead.children_count || '0'} فرزند</span></div>
              {selectedLead.marital_status === 'married' && (
                <>
                  <div>👰 <strong>نام همسر:</strong> <span className="text-slate-800 dark:text-white font-bold">{selectedLead.spouse_name || '---'}</span></div>
                  <div>🎂 <strong>سن همسر:</strong> <span>{selectedLead.spouse_age || '---'} سال</span></div>
                  <div>🎓 <strong>تحصیلات همسر:</strong> <span>{selectedLead.spouse_education || '---'}</span></div>
                  <div>🗣️ <strong>سطح زبان همسر:</strong> <span className="text-indigo-600 font-medium">{selectedLead.spouse_language_level || '---'}</span></div>
                  <div className="sm:col-span-2">💼 <strong>رزومه شغلی همسر:</strong> <span>{selectedLead.spouse_work_history || '---'}</span></div>
                  <div className="sm:col-span-2 text-slate-500 font-medium bg-white/70 dark:bg-slate-900 p-1.5 rounded border border-pink-50">
                    ✈️ وضعیت همراهی: <span className="text-slate-800 dark:text-white font-bold">{selectedLead.spouse_accompanying === 'no' ? 'خیر، همسر همسفر نیست' : 'بله، همسر در همین کیس پرونده مهاجرت می‌کند'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ۳. لایه نمایش سوابق آکادمیک و زبان */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-emerald-600 border-b pb-1">🎓 آکادمیک، سوابق کاری و زبان متقاضی</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
              <div>🏛️ <strong>آخرین مقطع تحصیلی:</strong> <span className="text-slate-800 dark:text-white font-bold">{selectedLead.education_level || '---'}</span></div>
              <div>🔬 <strong>رشته تحصیلی:</strong> <span className="text-slate-800 dark:text-white">{selectedLead.field_of_study || '---'}</span></div>
              <div>📝 <strong>معدل کل فارغ‌التحصیلی:</strong> <span className="font-mono font-bold text-emerald-700 bg-emerald-50 dark:bg-slate-900 px-1.5 py-0.5 rounded">{selectedLead.gpa || '---'}</span></div>
              <div>🇬🇧 <strong>انگلیسی عمومی / مدرک:</strong> <span className="text-slate-700 dark:text-slate-200">{selectedLead.english_level || '---'} / {selectedLead.english_certified_level || 'ندارد'}</span></div>
              <div>🇩🇪 <strong>آلمانی عمومی / مدرک:</strong> <span className="text-slate-700 dark:text-slate-200">{selectedLead.german_level || '---'} / {selectedLead.german_certified_level || 'ندارد'}</span></div>
              <div className="sm:col-span-2">💼 <strong>رزومه سابقه کار و بیمه:</strong> <span className="text-slate-700 dark:text-slate-200">{selectedLead.work_and_insurance_history || '---'}</span></div>
            </div>
          </div>

          {/* ۴. لایه نمایش اهداف و یادداشت مشاور */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-cyan-600 border-b pb-1">✈️ اهداف مهاجرتی، مالی و کانال ورودی</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
              <div>🌍 <strong>کشور هدف:</strong> <span className="text-slate-800 dark:text-white font-black text-indigo-600">{selectedLead.target_country || '---'}</span></div>
              <div>📋 <strong>نوع پلن درخواستی:</strong> <span className="text-slate-800 dark:text-white font-bold">{selectedLead.requested_plan || '---'}</span></div>
              <div>💰 <strong>میزان تمکن مالی:</strong> <span className="text-emerald-600 font-bold font-mono bg-emerald-50/50 dark:bg-slate-900 px-1.5 py-0.5 rounded">{getFinancialCapabilityMillion(selectedLead.financial_capability_toman)}</span></div>
              <div>📡 <strong>منبع کانال کشف:</strong> <span className="text-slate-700 dark:text-slate-200">{selectedLead.discovery_channel || '---'}</span></div>
              <div className="sm:col-span-2">📝 <strong>یادداشت و ملاحظات مشاور:</strong> <span className="text-slate-500 font-medium leading-relaxed block bg-white dark:bg-slate-900 p-2 rounded-xl border mt-1">{selectedLead.description || '---'}</span></div>
            </div>
          </div>

          <button type="button" onClick={() => setIsEditing(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-bold transition-all text-center cursor-pointer">✏️ ورود به پنل ادیتور و ویرایش ۳۶۰ درجه کل فیلدها</button>
        </div>
      )}
    </div>
  );
}