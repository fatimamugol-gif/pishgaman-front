// services/delayCompensationService.ts

import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';

// Types
export interface DelayCompensationRule {
  id: number;
  rule_name: string;
  delay_start_minutes: number;
  delay_end_minutes: number;
  compensation_minutes: number;
  auto_leave_hours: boolean;
  auto_leave_duration_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DelayCompensation {
  id: number;
  user_id: number;
  attendance_clock_id: number;
  date: string;
  delay_minutes: number;
  compensation_minutes_required: number;
  compensation_minutes_completed: number;
  auto_leave_recorded: boolean;
  auto_leave_request_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
  attendance_date?: string;
}

/**
 * Get all delay compensation rules
 */
export async function getDelayCompensationRules(): Promise<{ status: string; data: DelayCompensationRule[] }> {
  try {
    const res = await fetch(`${API_BASE_URL}/next/delay-compensation/rules`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Get rules error:', res.status, errorData);
      throw new Error(errorData.message || 'خطا در دریافت قوانین جبران تاخیر');
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching delay compensation rules:', error);
    return { status: 'error', data: [] };
  }
}

/**
 * Create a new delay compensation rule (Admin only)
 */
export async function createDelayCompensationRule(
  rule: Omit<DelayCompensationRule, 'id' | 'created_at' | 'updated_at'>
): Promise<{ status: string; rule_id?: number; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/next/delay-compensation/rules`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(rule),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Create rule error:', res.status, errorData);
      throw new Error(errorData.message || 'خطا در ایجاد قانون جبران تاخیر');
    }
    return await res.json();
  } catch (error) {
    console.error('Error creating delay compensation rule:', error);
    return { status: 'error', message: 'خطا در ایجاد قانون' };
  }
}

/**
 * Update a delay compensation rule (Admin only)
 * توجه: بک‌اند از متد POST استفاده می‌کند
 */
export async function updateDelayCompensationRule(
  id: number,
  rule: Partial<DelayCompensationRule>
): Promise<{ status: string; message?: string; data?: DelayCompensationRule }> {
  try {
    console.log('Updating rule:', { id, rule });
    
    const headers = getAuthHeaders();
    console.log('Auth headers present:', !!headers.Authorization);
    
    const res = await fetch(`${API_BASE_URL}/next/delay-compensation/rules/${id}`, {
      method: 'PUT', // تطابق با روت بک‌اند
      headers: headers,
      body: JSON.stringify(rule),
    });

    console.log('Update response status:', res.status);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Server error:', res.status, errorData);
      
      let errorMessage = 'خطا در به‌روزرسانی قانون جبران تاخیر';
      if (res.status === 403) {
        errorMessage = 'شما دسترسی لازم برای ویرایش این قانون را ندارید. لطفاً با مدیر سیستم تماس بگیرید.';
      } else if (res.status === 401) {
        errorMessage = 'نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.';
      } else if (res.status === 404) {
        errorMessage = 'قانون مورد نظر یافت نشد.';
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
      
      throw new Error(errorMessage);
    }
    
    const responseData = await res.json();
    console.log('Update success:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error updating delay compensation rule:', error);
    return { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'خطا در به‌روزرسانی قانون' 
    };
  }
}

/**
 * Delete a delay compensation rule (Admin only)
 */
export async function deleteDelayCompensationRule(id: number): Promise<{ status: string; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/next/delay-compensation/rules/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Delete error:', res.status, errorData);
      
      let errorMessage = 'خطا در حذف قانون جبران تاخیر';
      if (res.status === 403) {
        errorMessage = 'شما دسترسی لازم برای حذف این قانون را ندارید.';
      } else if (res.status === 401) {
        errorMessage = 'نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.';
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
      
      throw new Error(errorMessage);
    }
    return await res.json();
  } catch (error) {
    console.error('Error deleting delay compensation rule:', error);
    return { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'خطا در حذف قانون' 
    };
  }
}

/**
 * Process delay for an attendance record
 */
export async function processAttendanceDelay(
  attendanceId: number
): Promise<{ status: string; data?: DelayCompensation; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/next/delay-compensation/process`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ attendance_id: attendanceId }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Process delay error:', res.status, errorData);
      throw new Error(errorData.message || 'خطا در پردازش تاخیر');
    }
    return await res.json();
  } catch (error) {
    console.error('Error processing attendance delay:', error);
    return { status: 'error', message: 'خطا در پردازش تاخیر' };
  }
}

/**
 * Record completed compensation
 */
export async function recordCompensationCompleted(
  compensationId: number,
  minutesCompleted: number
): Promise<{ status: string; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/next/delay-compensation/record`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        compensation_id: compensationId,
        minutes_completed: minutesCompleted,
      }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Record compensation error:', res.status, errorData);
      throw new Error(errorData.message || 'خطا در ثبت جبران خدمت');
    }
    return await res.json();
  } catch (error) {
    console.error('Error recording compensation:', error);
    return { status: 'error', message: 'خطا در ثبت جبران خدمت' };
  }
}

/**
 * Get user delay compensations
 */
export async function getUserDelayCompensations(
  userId?: number,
  startDate?: string,
  endDate?: string
): Promise<{ status: string; data: DelayCompensation[] }> {
  try {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId.toString());
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const res = await fetch(`${API_BASE_URL}/next/delay-compensation/user?${params.toString()}`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Get user compensations error:', res.status, errorData);
      throw new Error(errorData.message || 'خطا در دریافت گزارش جبران تاخیر');
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching user delay compensations:', error);
    return { status: 'error', data: [] };
  }
}

/**
 * Get all delay compensations (Admin/Supervisor only)
 */
export async function getAllDelayCompensations(): Promise<{ status: string; data: DelayCompensation[] }> {
  try {
    const res = await fetch(`${API_BASE_URL}/next/delay-compensation/all`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Get all compensations error:', res.status, errorData);
      throw new Error(errorData.message || 'خطا در دریافت لیست جبران تاخیرها');
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching all delay compensations:', error);
    return { status: 'error', data: [] };
  }
}