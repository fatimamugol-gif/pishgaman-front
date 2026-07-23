import React from 'react';
import { format, isBefore } from 'date-fns-jalali';
import { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  // 🎯 پارس هوشمند تاریخ میلادی به شمسی با هندل کردن حالت نال
  const displayDate = task.due_date_iso 
    ? format(new Date(task.due_date_iso), 'yyyy/MM/dd') 
    : task.due_date_shamsi;

  // محاسبهٔ اینکه آیا تسک منقضی شده یا خیر (بومی در فرانت)
  const isOverdue = task.due_date_iso 
    ? isBefore(new Date(task.due_date_iso), new Date()) && task.status === 'pending'
    : false;

  return (
    <div className={`p-4 rounded-lg border ${isOverdue ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <h4 className="font-bold text-gray-800">{task.task_title}</h4>
      <p className="text-gray-600 text-sm mt-1">{task.description}</p>
      
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          ⏳ سررسید: {displayDate}
        </span>
        <span className={`px-2 py-0.5 rounded ${task.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>
          {task.priority}
        </span>
      </div>

      {isOverdue && (
        <span className="text-red-600 text-xs font-bold block mt-2 animate-pulse">
          ⚠️ مهلت قانونی این اقدام گذشته است
        </span>
      )}
    </div>
  );
};