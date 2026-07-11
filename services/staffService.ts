// services/staffService.ts
import { Ticket, ClientTask } from '@/types/staff';

const currentHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
// const BASE_URL = `http://${currentHost}:8000/api`; 
// موقتاً به این شکل تست کن رفیق:
const BASE_URL = 'http://127.0.0.1:8000/api';

const getAuthHeaders = (isFormData: boolean = false) => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  };

  // اگر دیتا از نوع FormData بود نباید Content-Type را دستی بگذاریم تا خود مرورگر Boundry را ست کند
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

export const staffService = {
  // ۱. دریافت لیست تیکت‌ها (مجهز به گارد ضد کش استاندارد)
  getTickets: async (): Promise<any[]> => {
    const res = await fetch(`${BASE_URL}/staff/tickets`, {
      method: 'GET',
      headers: getAuthHeaders(false),
      cache: 'no-store', // 🎯 شلیک نهایی به قلب کش Next.js بدون خراب کردن هدرهای CORS
    });

    if (!res.ok) {
      console.error(`🚨 ارور دپارتمان تیکت - وضعیت سرور: ${res.status}`);
      throw new Error('خطا در دریافت تیکت‌ها');
    }

    const json = await res.json();
    return json.data ? json.data : (Array.isArray(json) ? json : []);
  },

  // ۲. ارسال پاسخ به تیکت کلاینت
  replyToTicket: async (ticketId: number, replyBody: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/staff/tickets/${ticketId}/reply`, {
      method: 'POST',
      headers: getAuthHeaders(false),
      body: JSON.stringify({ reply: replyBody }),
    });
    if (!response.ok) throw new Error('خطا در ثبت پاسخ تیکت');
    return response.json();
  },

  deleteClientTask: async (id: number): Promise<any> => {
    const res = await fetch(`${BASE_URL}/staff/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(false)
    });
    if (!res.ok) throw new Error('خطا در حذف وظیفه');
    return res.json();
  },

  // ۳. صدور وظیفه جدید برای کلاینت (اصلاح هدر FormData)
  createClientTask: async (formData: FormData): Promise<any> => {
    const res = await fetch(`${BASE_URL}/staff/tasks/create-client-task`, {
      method: 'POST',
      headers: getAuthHeaders(true), // 🎯 اصلاح شد
      body: formData,
    });
    if (!res.ok) throw new Error('خطا در صدور وظیفه کلاینت');
    return res.json();
  },

  // ۴. ثبت یا ویرایش مقالات پایگاه دانش (اصلاح هدر FormData)
  upsertKnowledge: async (formData: FormData): Promise<any> => {
    const res = await fetch(`${BASE_URL}/staff/knowledge/upsert`, {
      method: 'POST',
      headers: getAuthHeaders(true), // 🎯 اصلاح شد
      body: formData,
    });
    if (!res.ok) throw new Error('خطا در ثبت پایگاه دانش');
    return res.json();
  },

  // واکشی آرشیو تمام کارهای صادر شده برای کلاینت‌ها
  getClientTasksArchive: async (): Promise<any[]> => {
    const res = await fetch(`${BASE_URL}/staff/tasks/archive`, {
      method: 'GET',
      headers: getAuthHeaders(false)
    });
    const json = await res.json();
    return json.data || [];
  },

  updateTaskFields: async (id: number, fields: any): Promise<any> => {
    const res = await fetch(`${BASE_URL}/staff/tasks/update-fields/${id}`, {
      method: 'POST',
      headers: getAuthHeaders(false),
      body: JSON.stringify(fields)
    });
    if (!res.ok) throw new Error('خطا در ویرایش کارت وظیفه');
    return res.json();
  },

  // ۵. واکشی آرشیو تمام مقالات دانشنامه دیتابیس
  getKnowledgeArticlesArchive: async (): Promise<any[]> => {
    const res = await fetch(`${BASE_URL}/staff/knowledge/archive`, {
      method: 'GET',
      headers: getAuthHeaders(false)
    });
    if (!res.ok) throw new Error('خطا در دریافت آرشیو دانشنامه');
    const json = await res.json();
    return json.data || [];
  },

  // واکشی کلاینت‌های رسمی تفکیک‌شده از لیدها
  getOfficialClients: async (): Promise<any[]> => {
    const res = await fetch(`${BASE_URL}/staff/leads`, {
      method: 'GET',
      headers: getAuthHeaders(false)
    });
    const json = await res.json();
    return json.data || [];
  },

  // حذف مستند پایگاه دانش
  deleteKnowledgeArticle: async (id: number): Promise<any> => {
    const res = await fetch(`${BASE_URL}/staff/knowledge/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(false)
    });
    return res.json();
  },

  // ثبت کامنت کارشناس روی تسک
  sendTaskCommentFromStaff: async (taskId: number, comment: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}/staff/tasks/${taskId}/comment`, {
      method: 'POST',
      headers: getAuthHeaders(false),
      body: JSON.stringify({ comment })
    });
    return res.json();
  },

  // // ویرایش همه‌جانبه کارت تسک
  // updateTaskFields: async (id: number, fields: any): Promise<any> => {
  //   const res = await fetch(`${BASE_URL}/staff/tasks/update-fields/${id}`, {
  //     method: 'POST',
  //     headers: getAuthHeaders(false),
  //     body: JSON.stringify(fields)
  //   });
  //   return res.json();
  // },
};