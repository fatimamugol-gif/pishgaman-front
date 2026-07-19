import { API_BASE_URL, getAuthHeaders } from './apiConfig';

export async function fetchLeads() {
  try {
    const res = await fetch(`${API_BASE_URL}/next/dashboard/leads`, {
      cache: 'no-store', // دریافت دیتای کاملاً زنده بدون کِش فرانت
    });
    if (!res.ok) throw new Error('خطا در برقراری ارتباط با سرور لاراول');
    return await res.json();
  } catch (error) {
    console.error(error);
    return { data: [] };
  }
}
