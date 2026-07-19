// services/staffService.ts
import { Ticket, ClientTask } from '@/types/staff';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';

const BASE_URL = API_BASE_URL;

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

  // ۶. API های جلسات مشاوره (Consultation Sessions)
  createConsultationSession: async (sessionData: any): Promise<any> => {
    const res = await fetch(`${BASE_URL}/next/consultation-sessions`, {
      method: 'POST',
      headers: getAuthHeaders(false),
      body: JSON.stringify(sessionData),
    });
    if (!res.ok) throw new Error('خطا در ثبت جلسه مشاوره');
    return res.json();
  },

  getConsultationSessions: async (leadId?: number): Promise<any[]> => {
    const url = leadId 
      ? `${BASE_URL}/next/consultation-sessions?lead_id=${leadId}`
      : `${BASE_URL}/next/consultation-sessions`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(false),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('خطا در دریافت جلسات مشاوره');
    const json = await res.json();
    return json.data || [];
  },

  updateConsultationSession: async (sessionId: number, sessionData: any): Promise<any> => {
    const res = await fetch(`${BASE_URL}/next/consultation-sessions/${sessionId}`, {
      method: 'PUT',
      headers: getAuthHeaders(false),
      body: JSON.stringify(sessionData),
    });
    if (!res.ok) throw new Error('خطا در ویرایش جلسه مشاوره');
    return res.json();
  },

  deleteConsultationSession: async (sessionId: number): Promise<any> => {
    const res = await fetch(`${BASE_URL}/next/consultation-sessions/${sessionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(false),
    });
    if (!res.ok) throw new Error('خطا در حذف جلسه مشاوره');
    return res.json();
  },

  // 🔐 مدیریت MAC Address کارشناسان
  getAgentsWithMacAddresses: async (): Promise<any[]> => {
    const res = await fetch(`${BASE_URL}/next/agents/mac-addresses`, {
      method: 'GET',
      headers: getAuthHeaders(false),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('خطا در دریافت لیست کارشناسان');
    const json = await res.json();
    return json.data || [];
  },

  updateAgentMacAddresses: async (agentId: number, macAddress1: string | null, macAddress2: string | null): Promise<any> => {
    const res = await fetch(`${BASE_URL}/next/agents/mac-addresses/${agentId}`, {
      method: 'POST',
      headers: getAuthHeaders(false),
      body: JSON.stringify({ 
        mac_address_1: macAddress1, 
        mac_address_2: macAddress2 
      }),
    });
    if (!res.ok) throw new Error('خطا در به‌روزرسانی MAC Address');
    return res.json();
  },

  // 📊 گزارش ساعات کاری ماهانه
  getMonthlyWorkingHours: async (userId?: number, year?: number, month?: number): Promise<any> => {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId.toString());
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    
    const res = await fetch(`${BASE_URL}/next/hr/monthly-working-hours?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(false),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('خطا در دریافت گزارش ساعات کاری');
    return res.json();
  },
};