"use client";

import React from 'react';

interface VaultTabProps {
  documents: any[];
  docType: string;
  setDocType: (val: string) => void;
  docTitle: string;
  setDocTitle: (val: string) => void;
  setSelectedFile: (file: File | null) => void;
  isUploading: boolean;
  handleUploadDoc: (e: React.FormEvent) => void;
}

export default function VaultTab({
  documents,
  docType,
  setDocType,
  docTitle,
  setDocTitle,
  setSelectedFile,
  isUploading,
  handleUploadDoc,
}: VaultTabProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border dark:border-slate-800 shadow-xl space-y-4 animate-fadeIn">
      <div className="flex justify-between items-center border-b pb-2 dark:border-slate-800">
        <h3 className="font-black text-slate-800 dark:text-white text-xs">
          📂 خزانه اسناد و مدارک پرونده مهاجرتی (Vault)
        </h3>
        <span className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-lg border dark:border-slate-800">
          حداکثر حجم مجاز: ۱۰ مگابایت
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <form onSubmit={handleUploadDoc} className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border dark:border-slate-800">
          <h4 className="font-black text-slate-700 dark:text-slate-300 text-[10px] border-b pb-1 dark:border-slate-800">
            📤 بارگذاری سند جدید
          </h4>

          <label className="block text-[10px] space-y-1 text-slate-500">
            نوع سند مدرک:
          </label>
          <select
            className="w-full p-2 bg-white dark:bg-slate-900 border dark:border-slate-800 text-xs rounded-xl outline-none text-slate-800 dark:text-white font-bold"
            value={docType}
            onChange={e => setDocType(e.target.value)}
          >
            <option value="passport">پاسپورت و هویت</option>
            <option value="degree">مدارک تحصیلی و ریز نمرات</option>
            <option value="resume">رزومه و سوابق کاری</option>
            <option value="contract">قرارداد رسمی امضا شده</option>
            <option value="other">سایر مدارک پشتیبان</option>
          </select>

          <label className="block text-[10px] space-y-1 text-slate-500">
            عنوان فایل نمایشی:
          </label>
          <input
            type="text"
            placeholder="مثال: ترجمه شناسنامه و ریزنمرات"
            className="w-full p-2 bg-white dark:bg-slate-900 border dark:border-slate-800 text-xs rounded-xl outline-none text-slate-800 dark:text-white font-bold"
            value={docTitle}
            onChange={e => setDocTitle(e.target.value)}
          />

          <label className="block text-[10px] space-y-1 text-slate-500">
            انتخاب سند (PDF, JPG, PNG):
          </label>
          <input
            type="file"
            className="w-full text-[10px] text-slate-400 font-mono mt-1"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => {
              const file = e.target.files?.[0] ?? null;
              setSelectedFile(file);
            }}
          />

          <button
            type="submit"
            disabled={isUploading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2 rounded-xl text-center text-xs transition-all shadow-md cursor-pointer disabled:bg-slate-800 disabled:cursor-not-allowed"
          >
            {isUploading ? '⏳ در حال فرستادن به مرکز اسناد...' : '📤 ارسال به خزانه اسناد'}
          </button>
        </form>

        <div className="col-span-1 md:col-span-2 space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {documents.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-bold">
              هیچ فایلی در خزانه مدارک پرونده شما مستقر نشده است. 📁
            </div>
          ) : (
            documents.map((doc: any) => (
              <div
                key={doc.id}
                className="p-3 bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-xl flex justify-between items-center group hover:border-indigo-400 transition-all"
              >
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {doc.title}
                  </h5>
                  <div className="flex gap-3 text-[9px] text-slate-400 mt-0.5">
                    <span>📅 ثبت: {doc.created_at}</span>
                    <span className="text-indigo-500 font-bold">🗂️ دسته: {doc.document_type}</span>
                  </div>

                  {doc.status === 'rejected' && (
                    <div className="text-[9px] text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/20 p-2 rounded-lg mt-1 border border-rose-100 dark:border-rose-900/30">
                      ❌ نیاز به اصلاح: {doc.rejection_reason}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-black ${
                      doc.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20'
                        : doc.status === 'rejected'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 animate-pulse'
                    }`}
                  >
                    {doc.status === 'approved'
                      ? '✓ تایید شد'
                      : doc.status === 'rejected'
                        ? '✕ ریجکت شد'
                        : '⏳ در حال بررسی'}
                  </span>

                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 p-1.5 rounded-lg text-[10px] font-black transition-all"
                  >
                    👁️ نمایش فایل
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
