// components/staff/KnowledgeManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { staffService } from '@/services/staffService';

export default function KnowledgeManager() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // استیت فیلدها (با پشتیبانی از شناسه مخفی برای ویرایش)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('general');
  const [content, setContent] = useState<string>('');
  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { loadArticlesHistory(); }, []);

  const loadArticlesHistory = async () => {
    try {
      setLoading(true);
      const res = await staffService.getKnowledgeArticlesArchive();
      setArticles(res);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleEditLoad = (article: any) => {
    setEditingId(article.id);
    setTitle(article.title);       // 🎯 فیکس شد: استفاده صحیح از متغیر article
    setCategory(article.category);   // 🎯 فیکس شد: استفاده صحیح از متغیر article
    setContent(article.content || ''); // 🎯 فیکس شد: استفاده صحیح از متغیر article
    setMessage({ type: 'success', text: '📝 اطلاعات مستند جهت ویرایش روی فرم بارگذاری شد.' });
  };

  const handleDeleteArticle = async (id: number) => {
    if (!confirm('آیا از حذف کامل این مستند علمی از پرتال کلاینت‌ها مطمئن هستید؟')) return;
    try {
      const res = await staffService.deleteKnowledgeArticle(id);
      if (res.status === 'success') {
        alert('مستند با موفقیت حذف شد.');
        loadArticlesHistory();
      }
    } catch (err) { console.error(err); }
  };

  const handleSubmitKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setMessage({ type: 'error', text: 'لطفاً فیلدهای ستاره‌دار را پر کن رفیق.' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);

      const formData = new FormData();
      if (editingId) formData.append('id', editingId.toString()); // 🎯 پاس دادن آیدی در صورت ویرایش
      formData.append('title', title);
      formData.append('category', category);
      formData.append('content', content);

      await staffService.upsertKnowledge(formData);
      setMessage({ type: 'success', text: editingId ? '✓ مستند با موفقیت به‌روزرسانی شد!' : '📚 مستند جدید منتشر شد!' });
      
      setTitle(''); setContent(''); setCategory('general'); setEditingId(null);
      loadArticlesHistory();
    } catch (error) { setMessage({ type: 'error', text: 'خطا در برقراری ارتباط با سرور.' }); } finally { setSubmitting(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right animate-fadeIn" dir="rtl">
      
      {/* سمت راست: فرم ایجاد / ویرایش دوجانبه */}
      <div className="lg:col-span-1 bg-white rounded-[24px] border p-5 h-fit space-y-4 shadow-xs">
        <h2 className="text-xs font-black text-slate-800 border-b pb-2">{editingId ? '📝 ویرایش مستند پایگاه دانش' : '📤 انتشار مستند جدید'}</h2>
        {message && <div className={`p-3 rounded-xl text-[10px] font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{message.text}</div>}
        <form onSubmit={handleSubmitKnowledge} className="space-y-3">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان مستند علمی..." className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-bold" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-bold text-slate-800">
            <option value="general">📜 مستندات عمومی</option>
            <option value="faq">❓ سوالات متداول (FAQ)</option>
          </select>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="متن بخشنامه..." rows={6} className="w-full p-2 bg-slate-50 border rounded-xl text-xs leading-relaxed" />
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 text-white font-black py-2 rounded-xl text-xs cursor-pointer hover:bg-indigo-700">{submitting ? '⏳ در حال ثبت...' : editingId ? '✓ ثبت ویرایش' : '✍️ انتشار سند'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setTitle(''); setContent(''); setCategory('general'); }} className="bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer">انصراف</button>}
          </div>
        </form>
      </div>

      {/* سمت چپ: نمایش آرشیو به همراه ابزار حذف و ادیت */}
      <div className="lg:col-span-2 bg-white rounded-[24px] border p-5 space-y-4 shadow-xs">
        <h2 className="text-xs font-black text-slate-800 border-b pb-2">📚 مقالات و مستندات جاری دیتابیس</h2>
        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-8 text-slate-400 font-bold">⏳ در حال فراخوانی آرشیو...</div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold">هیچ دیتایی یافت نشد.</div>
          ) : (
            articles.map((art: any) => (
              <div key={art.id} className="p-4 bg-slate-50 border rounded-2xl flex justify-between items-start hover:border-indigo-200 transition-all gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-800 text-xs">📖 {art.title}</h4>
                    <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-mono">#{art.category}</span>
                  </div>
                  <p className="text-slate-500 text-[10px] leading-relaxed line-clamp-2">{art.content}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEditLoad(art)} className="bg-amber-50 text-amber-600 hover:bg-amber-100 p-1.5 rounded-lg text-[9px] font-black cursor-pointer transition-all">📝 ادیت</button>
                  <button onClick={() => handleDeleteArticle(art.id)} className="bg-rose-50 text-rose-600 hover:bg-rose-100 p-1.5 rounded-lg text-[9px] font-black cursor-pointer transition-all">🗑️ حذف</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}