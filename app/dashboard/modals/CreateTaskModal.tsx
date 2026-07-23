import React, { useState } from 'react';
import axios from 'axios';

interface TaskFormPayload {
  lead_id: number;
  task_title: string;
  priority: 'low' | 'medium' | 'high';
  due_date_shamsi: string;
  has_reminder: boolean;
  reminder_time_shamsi: string | null; // فرمت نهایی: YYYY/MM/DD HH:mm
}

export const CreateTaskModal: React.FC<{ leadId: number; onClose: () => void }> = ({ leadId, onClose }) => {
  const [title, setTitle] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [shamsiDate, setShamsiDate] = useState<string>(''); // از دیت‌پیکر: مثلا "1405/04/19"
  const [hasReminder, setHasReminder] = useState<boolean>(false);
  const [reminderTime, setReminderTime] = useState<string>(''); // از تایم‌پیکر: مثلا "14:30"

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🎯 پچ طلایی: ادغام دقیق تاریخ و ساعت به صورت رشته استاندارد برای لاراول
    const payload: TaskFormPayload = {
      lead_id: leadId,
      task_title: title,
      priority: priority,
      due_date_shamsi: shamsiDate,
      has_reminder: hasReminder,
      reminder_time_shamsi: hasReminder && reminderTime ? `${shamsiDate} ${reminderTime}` : null
    };

    try {
      const response = await axios.post('/api/tasks', payload);
      if (response.data.status === 'success') {
        onClose();
        // اینجا می‌توانی نوتیفیکیشن یا استیت دشبورد را ریلود کنی
      }
    } catch (error) {
      console.error('Task creation failed:', error);
    }
  };

  return (
    <form onSubmit={handleCreateTask}>
      {/* کامپوننت‌های اینپوت فرانت لوکست در اینجا رندر می‌شوند */}
    </form>
  );
};