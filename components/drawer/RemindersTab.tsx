// components/drawer/RemindersTab.tsx
'use client';

import React from 'react';

interface RemindersTabProps {
  leadReminders: any[];
  newReminder: any;
  setNewReminder: (rem: any) => void;
  handleAddReminder: () => void;
}

export default function RemindersTab({ leadReminders, newReminder, setNewReminder, handleAddReminder }: RemindersTabProps) {
  return (
    <div className="space-y-4 pb-10">
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border space-y-3">
        <h4 className="font-bold text-slate-700 dark:text-slate-200">⏰ تنظیم یادآور پیگیری و کانال‌های مخابراتی</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" placeholder="موضوع پیگیری" className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={newReminder.title} onChange={e => setNewReminder({ ...newReminder, title: e.target.value })} />
          <input type="date" className="p-2 border rounded-lg bg-white dark:bg-slate-900 text-center font-mono" value={newReminder.date} onChange={e => setNewReminder({ ...newReminder, date: e.target.value })} />
          <input type="time" className="p-2 border rounded-lg bg-white dark:bg-slate-900 text-center font-mono" value={newReminder.time} onChange={e => setNewReminder({ ...newReminder, time: e.target.value })} />
          <input type="text" placeholder="توضیحات تکمیلی..." className="p-2 border rounded-lg bg-white dark:bg-slate-900" value={newReminder.description} onChange={e => setNewReminder({ ...newReminder, description: e.target.value })} />
        </div>
        <button type="button" onClick={handleAddReminder} className="w-full bg-indigo-600 text-white p-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all text-center block">⏰ ثبت ناتیفیکیشن روی سکوها</button>
      </div>
      <div className="space-y-2">
        <h4 className="font-bold text-slate-700 dark:text-slate-200">📋 لیست یادآورهای فعال پرونده:</h4>
        {leadReminders.map((rem: any) => (
          <div key={rem.id} className="p-3 bg-slate-50 dark:bg-slate-950 border rounded-xl flex justify-between items-center">
            <div><strong>{rem.title}</strong> <span className="text-slate-400">({rem.reminder_date_shamsi} {rem.reminder_time})</span></div>
            <span className="text-indigo-600 font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">{rem.status || 'فعال'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}