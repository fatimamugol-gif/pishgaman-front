"use client";

import React, { useState } from 'react';

interface KnowledgeTabProps {
  articles: any[];
  targetCountry: string;
}

export default function KnowledgeTab({ articles, targetCountry }: KnowledgeTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'faq' | 'general'>('all');

  // 🧠 موتور فیلتر آنی کلاینت (Client-side Search Core)
  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      article.category.toLowerCase() === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border dark:border-slate-800 shadow-xl space-y-4 animate-fadeIn text-right" dir="rtl">
      
      {/* هدر ماژول */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3 dark:border-slate-800">
        <div>
          <h3 className="font-black text-slate-800 dark:text-white text-xs">
            📚 پایگاه دانش، چک‌لیست‌ها و قوانین مهاجرتی ۲۰۲۶
          </h3>
          <p className="text-slate-400 text-[9px] mt-0.5">بر اساس فیلتر داینامیک و سرچ اتمیک مقالات</p>
        </div>
        <span className="text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded-lg border dark:border-indigo-900/30 font-bold">
          🎯 تمرکز پرونده شما: {targetCountry}
        </span>
      </div>

      {/* 🎛️ نوار ابزار سرچ و فیلتر دسته‌بندی (Search & Filter Toolbar) */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border dark:border-slate-850">
        
        {/* اینپوت سرچ متنی */}
        <div className="w-full sm:w-72 relative">
          <input 
            type="text"
            placeholder="🔍 جستجو در عنوان یا متن قوانین..."
            className="w-full p-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl text-xs outline-none text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* دکمه‌های سوئیچ دسته‌بندی */}
        <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border dark:border-slate-800 w-full sm:w-auto justify-center">
          <button 
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${selectedCategory === 'all' ? 'bg-slate-900 text-white dark:bg-indigo-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-950'}`}
          >
            همه مستندات
          </button>
          <button 
            onClick={() => setSelectedCategory('general')}
            className={`px-3 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${selectedCategory === 'general' ? 'bg-slate-900 text-white dark:bg-indigo-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-950'}`}
          >
            📜 قوانین و بخشنامه‌ها
          </button>
          <button 
            onClick={() => setSelectedCategory('faq')}
            className={`px-3 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${selectedCategory === 'faq' ? 'bg-slate-900 text-white dark:bg-indigo-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-950'}`}
          >
            ❓ سوالات متداول (FAQ)
          </button>
        </div>
      </div>

      {/* نمایش کارتی مقالات فیلتر شده */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
        {filteredArticles.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-slate-400 font-bold bg-slate-55/20 rounded-2xl border border-dashed dark:border-slate-850 animate-pulse">
            🔍 هیچ مقاله یا مستندی متناسب با جستجوی شما یافت نشد!
          </div>
        ) : (
          filteredArticles.map((article: any) => (
            <div key={article.id} className="p-4 bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 rounded-2xl flex flex-col justify-between space-y-3 hover:border-indigo-500/30 transition-all group">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-slate-800 dark:text-slate-200 text-xs group-hover:text-indigo-600 transition-colors">{article.title}</h4>
                  <span className="text-[8px] text-slate-400 font-mono">📅 {article.updated_at}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[10px] leading-relaxed line-clamp-4 whitespace-pre-line font-bold">
                  {article.content}
                </p>
              </div>

              <div className="flex justify-between items-center border-t pt-2 dark:border-slate-800">
                <span className="text-[9px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded-md font-mono font-bold">
                  #{article.category === 'faq' ? 'سوالات_متداول' : 'مستندات_عمومی'}
                </span>
                {article.file_url && (
                  <a href={article.file_url} target="_blank" rel="noreferrer" className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] px-2 py-1 rounded-lg transition-all shadow-xs cursor-pointer">
                    📥 دانلود فایل پیوست (PDF/Doc)
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}