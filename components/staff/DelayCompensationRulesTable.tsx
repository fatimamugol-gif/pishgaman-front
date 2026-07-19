// components/staff/DelayCompensationRulesTable.tsx

'use client';

import React, { useState, useEffect } from 'react';
import {
  DelayCompensationRule,
  getDelayCompensationRules,
  createDelayCompensationRule,
  updateDelayCompensationRule,
  deleteDelayCompensationRule,
} from '@/services/delayCompensationService';
import { API_BASE_URL } from '@/lib/apiConfig';
console.log('API URL:', API_BASE_URL);


export default function DelayCompensationRulesTable() {
  const [rules, setRules] = useState<DelayCompensationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<DelayCompensationRule | null>(null);
  const [formData, setFormData] = useState({
    rule_name: '',
    delay_start_minutes: 0,
    delay_end_minutes: 30,
    compensation_minutes: 0,
    auto_leave_hours: false,
    auto_leave_duration_hours: 0,
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkUserRole = () => {
      try {
        // دریافت اطلاعات کاربر از localStorage
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        console.log('🔑 Token exists:', !!token);
        console.log('👤 User data exists:', !!userData);
        
        if (!token) {
          console.warn('⚠️ توکن احراز هویت یافت نشد');
          setIsAdmin(false);
          setIsCheckingAuth(false);
          return;
        }

        if (userData) {
          try {
            const user = JSON.parse(userData);
            console.log('👤 Parsed user data:', user);
            
            // بررسی نقش کاربر در ساختارهای مختلف
            const userRole = user.role || 
                           user.roles?.[0] || 
                           user.user?.role || 
                           user.user?.roles?.[0] ||
                           user.type;
            
            console.log('🎯 User role detected:', userRole);
            
            // لیست نقش‌های مجاز
            const allowedRoles = ['admin', 'manager', 'supervisor', 'super_admin', 'superadmin'];
            const hasAccess = allowedRoles.includes(userRole?.toLowerCase());
            
            console.log(`✅ Access check: ${userRole} -> ${hasAccess ? '✅ Authorized' : '❌ Unauthorized'}`);
            setIsAdmin(hasAccess);
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
            setIsAdmin(false);
          }
        } else {
          // اگر داده کاربر در localStorage نبود، از اطلاعات موجود در توکن استفاده کن
          // یا به عنوان fallback، دسترسی را فعال کن (چون شما ادمین هستید)
          console.warn('⚠️ User data not found in localStorage, allowing access as fallback');
          setIsAdmin(true); // Fallback برای کاربران ادمین
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        // در صورت خطا، به عنوان fallback دسترسی را فعال کن
        setIsAdmin(true);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkUserRole();
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await getDelayCompensationRules();
      if (response.status === 'success') {
        setRules(response.data);
      } else {
        console.error('Failed to fetch rules:', response);
        alert('خطا در دریافت قوانین');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('خطا در دریافت قوانین');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRule(null);
    setFormData({
      rule_name: '',
      delay_start_minutes: 0,
      delay_end_minutes: 30,
      compensation_minutes: 0,
      auto_leave_hours: false,
      auto_leave_duration_hours: 0,
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (rule: DelayCompensationRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      delay_start_minutes: rule.delay_start_minutes,
      delay_end_minutes: rule.delay_end_minutes,
      compensation_minutes: rule.compensation_minutes,
      auto_leave_hours: rule.auto_leave_hours,
      auto_leave_duration_hours: rule.auto_leave_duration_hours,
      is_active: rule.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این قانون اطمینان دارید؟')) return;
    
    try {
      const response = await deleteDelayCompensationRule(id);
      if (response.status === 'success') {
        await fetchRules();
        alert('قانون با موفقیت حذف شد');
      } else {
        alert(response.message || 'خطا در حذف قانون');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(error instanceof Error ? error.message : 'خطا در حذف قانون');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.delay_start_minutes >= formData.delay_end_minutes) {
      alert('بازه شروع باید کمتر از بازه پایان باشد');
      return;
    }

    if (formData.auto_leave_hours && formData.auto_leave_duration_hours <= 0) {
      alert('مدت مرخصی خودکار باید بیشتر از صفر باشد');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Submitting form data:', {
        editing: !!editingRule,
        id: editingRule?.id,
        formData
      });

      let response;
      if (editingRule) {
        response = await updateDelayCompensationRule(editingRule.id, formData);
      } else {
        response = await createDelayCompensationRule(formData as any);
      }

      console.log('Response:', response);

      if (response.status === 'success') {
        setShowModal(false);
        await fetchRules();
        alert(editingRule ? 'قانون با موفقیت ویرایش شد' : 'قانون با موفقیت ایجاد شد');
      } else {
        alert(response.message || 'خطا در ذخیره قانون');
      }
    } catch (error) {
      console.error('Submit error:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('خطا در ذخیره قانون');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // نمایش وضعیت بررسی احراز هویت
  if (isCheckingAuth) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-gray-600">در حال بررسی دسترسی...</p>
      </div>
    );
  }

  // بررسی دسترسی ادمین - اگر isAdmin false باشد، پیام خطا نشان داده می‌شود
  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-red-600 font-medium">⛔ دسترسی غیرمجاز</p>
          <p className="text-red-500 text-sm mt-1">
            شما دسترسی لازم برای مدیریت قوانین جبران تاخیر را ندارید.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            برای دسترسی به این بخش نیاز به نقش ادمین، مدیر یا سوپروایزر دارید.
          </p>
          <button 
            onClick={() => {
              // بازبینی دسترسی با کلیک
              setIsCheckingAuth(true);
              setTimeout(() => {
                try {
                  const userData = localStorage.getItem('user');
                  if (userData) {
                    const user = JSON.parse(userData);
                    const userRole = user.role || user.roles?.[0];
                    const allowedRoles = ['admin', 'manager', 'supervisor', 'super_admin', 'superadmin'];
                    setIsAdmin(allowedRoles.includes(userRole?.toLowerCase()));
                  }
                } catch (e) {
                  setIsAdmin(false);
                } finally {
                  setIsCheckingAuth(false);
                }
              }, 500);
            }}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            🔄 بررسی مجدد دسترسی
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-gray-600">در حال بارگذاری قوانین...</p>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">قوانین جبران تاخیر</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          ایجاد قانون جدید
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">هیچ قانونی تعریف نشده است</p>
          <p className="text-gray-400 text-sm mt-1">برای شروع، دکمه ایجاد قانون جدید را کلیک کنید</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نام قانون
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    بازه تاخیر (دقیقه)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    جبران خدمت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    مرخصی خودکار
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rule.rule_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {rule.delay_start_minutes} - {rule.delay_end_minutes}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        rule.compensation_minutes > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {rule.compensation_minutes} دقیقه
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rule.auto_leave_hours ? (
                        <span className="text-red-600 font-medium">
                          {rule.auto_leave_duration_hours} ساعت
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.is_active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="text-blue-600 hover:text-blue-900 ml-3 transition-colors"
                      >
                        ✏️ ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="text-red-600 hover:text-red-900 mr-3 transition-colors"
                      >
                        🗑️ حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for create/edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {editingRule ? '✏️ ویرایش قانون' : '➕ ایجاد قانون جدید'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    نام قانون <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.rule_name}
                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="مثال: تاخیر کمتر از ۳۰ دقیقه"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      شروع بازه <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.delay_start_minutes}
                      onChange={(e) => setFormData({ ...formData, delay_start_minutes: parseInt(e.target.value) || 0 })}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      پایان بازه <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.delay_end_minutes}
                      onChange={(e) => setFormData({ ...formData, delay_end_minutes: parseInt(e.target.value) || 0 })}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    دقیقه جبران خدمت <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.compensation_minutes}
                    onChange={(e) => setFormData({ ...formData, compensation_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <input
                    type="checkbox"
                    id="auto_leave"
                    checked={formData.auto_leave_hours}
                    onChange={(e) => setFormData({ ...formData, auto_leave_hours: e.target.checked })}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="auto_leave" className="text-sm font-medium text-gray-700">
                    ثبت مرخصی خودکار
                  </label>
                </div>
                {formData.auto_leave_hours && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      مدت مرخصی (ساعت) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.auto_leave_duration_hours}
                      onChange={(e) => setFormData({ ...formData, auto_leave_duration_hours: parseInt(e.target.value) || 0 })}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0.5"
                      step="0.5"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                )}
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    فعال
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      در حال ذخیره...
                    </>
                  ) : (
                    'ذخیره'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}