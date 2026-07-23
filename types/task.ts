export interface Task {
  id: number;
  global_doc_id: number | null;
  task_title: string;
  description: string;
  due_date_shamsi: string;
  // 🎯 تایپ‌های جدید منطبق بر پچ بک‌اِند:
  due_date_iso?: string | null;
  start_date_iso?: string | null;
  reminder_iso?: string | null;
  status: 'pending' | 'done' | 'expired_by_supervisor';
  priority: 'low' | 'medium' | 'high';
  has_reminder: number | boolean;
  client_file_url: string | null;
  created_at: string;
}