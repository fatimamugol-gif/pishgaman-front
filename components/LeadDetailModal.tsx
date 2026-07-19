import React, { useState } from 'react';
import ConsultationSessionForm from './staff/ConsultationSessionForm';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
}

export default function LeadDetailModal({ isOpen, onClose, lead }: LeadModalProps) {
  const [showConsultationForm, setShowConsultationForm] = useState(false);

  const handleConsultationSuccess = () => {
    setShowConsultationForm(false);
    // Optionally refresh lead data or show success message
  };

  if (!isOpen || !lead) return null;

  if (showConsultationForm) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50" dir="rtl">
        <div className="bg-white w-full max-w-4xl rounded-[24px] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <ConsultationSessionForm 
            leadId={lead.id} 
            onSuccess={handleConsultationSuccess}
            onCancel={() => setShowConsultationForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white w-full max-w-2xl rounded-[24px] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold text-slate-800">پروفایل: {lead.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
        </div>

        {/* بخش اول: اطلاعات فردی و نظام وظیفه */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-indigo-600 mb-3 bg-indigo-50 px-3 py-1 rounded-lg inline-block">👤 اطلاعات فردی و عمومی</h3>
          <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl">
            <div><span className="text-xs text-slate-400 block">سن:</span> <span className="text-sm font-medium">{lead.profile_details.age} سال</span></div>
            <div><span className="text-xs text-slate-400 block">وضعیت تاهل:</span> <span className="text-sm font-medium">{lead.profile_details.marital_status}</span></div>
            <div><span className="text-xs text-slate-400 block">وضعیت نظام وظیفه:</span> <span className="text-sm font-medium">{lead.profile_details.military_status}</span></div>
          </div>
        </div>

        {/* بخش دوم: سوابق تحصیلی */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-emerald-600 mb-3 bg-emerald-50 px-3 py-1 rounded-lg inline-block">🎓 سوابق تحصیلی</h3>
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
            <div><span className="text-xs text-slate-400 block">آخرین مدرک تحصیلی:</span> <span className="text-sm font-medium">{lead.educational_background.degree}</span></div>
            <div><span className="text-xs text-slate-400 block">رشته تحصیلی:</span> <span className="text-sm font-medium">{lead.educational_background.field}</span></div>
            <div><span className="text-xs text-slate-400 block">معدل:</span> <span className="text-sm font-mono font-medium">{lead.educational_background.gpa}</span></div>
            <div><span className="text-xs text-slate-400 block">سال فارغ‌التحصیلی:</span> <span className="text-sm font-medium">{lead.educational_background.graduation_year}</span></div>
          </div>
        </div>

        {/* بخش سوم: شایستگی‌ها و تمکن مالی */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-amber-600 mb-3 bg-amber-50 px-3 py-1 rounded-lg inline-block">🌐 مهارت زبان و تمکن</h3>
          <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl">
            <div><span className="text-xs text-slate-400 block">وضعیت مدرک زبان:</span> <span className="text-sm font-medium">{lead.qualification_details.language}</span></div>
            <div><span className="text-xs text-slate-400 block">میزان تمکن مالی:</span> <span className="text-sm font-medium text-emerald-600 font-semibold">{lead.qualification_details.financial}</span></div>
            <div><span className="text-xs text-slate-400 block">دارای جاب آفر:</span> <span className="text-sm font-medium">{lead.qualification_details.has_job_offer}</span></div>
          </div>
        </div>

        {/* بخش چهارم: آنالیز هوش مصنوعی */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-purple-600 mb-3 bg-purple-50 px-3 py-1 rounded-lg inline-block">🧠 تحلیل هوشمند </h3>
          <div className="p-4 border border-purple-100 bg-purple-50/30 rounded-xl space-y-2">
            <p className="text-sm"><strong className="text-slate-600">کشور مقصد پیشنهادی:</strong> {lead.ai_insights.destination}</p>
            <p className="text-sm"><strong className="text-slate-600">نوع ویزای استخراج شده:</strong> {lead.ai_insights.intent}</p>
            <p className="text-xs text-slate-500 leading-relaxed"><strong className="text-slate-600 block mb-1">خلاصه پرونده:</strong> {lead.ai_insights.summary}</p>
          </div>
        </div>

        {/* دکمه ثبت جلسه مشاوره */}
        <div className="pt-4 border-t">
          <button 
            onClick={() => setShowConsultationForm(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            📋 ثبت جلسه مشاوره اولیه
          </button>
        </div>
      </div>
    </div>
  );
}