// components/drawer/TasksTab.tsx
'use client';

import React from 'react';

interface TasksTabProps {
  leadTasks: any[];
  newTask: any;
  setNewTask: (task: any) => void;
  agents: any[];
  handleAddTask: () => void;
}

export default function TasksTab({ leadTasks, newTask, setNewTask, agents, handleAddTask }: TasksTabProps) {
  return (
    <div className="space-y-4 pb-10">
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border space-y-3">
        <h4 className="font-bold text-slate-800 dark:text-white">➕ تعریف وظیفه و اتوماسیون پیگیری متمرکز دپارتمان</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input type="text" placeholder="عنوان وظیفه..." className="p-2 border rounded-lg sm:col-span-2 bg-white dark:bg-slate-900" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
          <input type="date" className="p-2 border rounded-lg text-center bg-white dark:bg-slate-900 font-mono" value={newTask.date} onChange={e => setNewTask({ ...newTask, date: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-slate-400 font-bold">👤 ارجاع وظیفه به کارشناس:</span>
          <select className="p-2 border rounded-lg bg-white dark:bg-slate-900 font-bold" value={newTask.assigned_agent_id} onChange={(e) => setNewTask({ ...newTask, assigned_agent_id: e.target.value })}>
            <option value="">کارشناس پیش‌فرض پرونده</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <button type="button" onClick={handleAddTask} className="w-full bg-emerald-600 text-white p-2.5 rounded-xl font-bold hover:bg-emerald-700 text-center block">🚀 استقرار وظیفه تیمی در دپارتمان</button>
      </div>
      <div className="space-y-2">
        <h4 className="font-bold text-slate-700 dark:text-slate-200">📋 لیست کارهای کارشناسان:</h4>
        {leadTasks.map((t: any) => (
          <div key={t.id} className="p-3 bg-slate-50 dark:bg-slate-950 border rounded-xl flex justify-between items-center">
            <div><strong>{t.task_title}</strong> <span className="text-slate-400">({t.due_date_shamsi || 'بدون ددلاین'})</span></div>
            <span className={`px-2 py-0.5 rounded text-white font-bold ${t.status === 'done' ? 'bg-emerald-600' : 'bg-amber-600'}`}>{t.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}