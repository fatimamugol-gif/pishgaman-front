'use client';

import { useState, useEffect } from 'react';
import { staffService } from '@/services/staffService';

interface DailyRecord {
  id: number;
  date_shamsi: string;
  clock_in: string;
  clock_out: string;
  delay_minutes: number;
  compensation_minutes_required: number;
  compensation_minutes_completed: number;
  worked_hours: number;
}

interface WorkingHoursData {
  year: number;
  month: number;
  shift: {
    name: string;
    start: string;
    end: string;
    allowed_delay: number;
  };
  expected_monthly_hours: number;
  actual_hours: number;
  delay_compensation: {
    required_minutes: number;
    completed_minutes: number;
    remaining_minutes: number;
  };
  final_effective_hours: number;
  completion_percentage: number;
  daily_records: DailyRecord[];
}

export default function MonthlyWorkingHoursPanel({ userId }: { userId?: number }) {
  const [data, setData] = useState<WorkingHoursData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth, userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await staffService.getMonthlyWorkingHours(userId, selectedYear, selectedMonth);
      if (response.status === 'success') {
        setData(response.data);
      }
    } catch (error) {
      console.error('خطا در دریافت گزارش ساعات کاری:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h} ساعت و ${m} دقیقه`;
  };

  const formatMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) {
      return `${h} ساعت و ${m} دقیقه`;
    }
    return `${m} دقیقه`;
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8 text-gray-500">
          داده‌ای یافت نشد
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">گزارش ساعات کاری ماهانه</h2>
        <p className="text-gray-600 text-sm">
          مشاهده کامل ساعات کاری ماهانه با در نظر گرفتن جبران تاخیرها
        </p>
      </div>

      {/* Month Selector */}
      <div className="mb-6 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">سال</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2"
          >
            {[2024, 2025, 2026, 2027].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ماه</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2"
          >
            {persianMonths.map((month, index) => (
              <option key={index + 1} value={index + 1}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium mb-1">ساعات مورد انتظار</div>
          <div className="text-2xl font-bold text-blue-800">
            {formatHours(data.expected_monthly_hours)}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium mb-1">ساعات واقعی</div>
          <div className="text-2xl font-bold text-green-800">
            {formatHours(data.actual_hours)}
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-600 font-medium mb-1">جبران تاخیر انجام شده</div>
          <div className="text-2xl font-bold text-purple-800">
            {formatMinutes(data.delay_compensation.completed_minutes)}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 font-medium mb-1">ساعات موثر نهایی</div>
          <div className={`text-2xl font-bold ${getCompletionColor(data.completion_percentage)}`}>
            {formatHours(data.final_effective_hours)}
          </div>
        </div>
      </div>

      {/* Shift Information */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-800 mb-2">اطلاعات شیفت کاری</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">نام شیفت:</span>
            <span className="mr-2 font-medium">{data.shift.name}</span>
          </div>
          <div>
            <span className="text-gray-600">ساعت شروع:</span>
            <span className="mr-2 font-medium">{data.shift.start}</span>
          </div>
          <div>
            <span className="text-gray-600">ساعت پایان:</span>
            <span className="mr-2 font-medium">{data.shift.end}</span>
          </div>
          <div>
            <span className="text-gray-600">تاخیر مجاز:</span>
            <span className="mr-2 font-medium">{data.shift.allowed_delay} دقیقه</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">درصد تکمیل ساعات کاری</span>
          <span className={`font-medium ${getCompletionColor(data.completion_percentage)}`}>
            {data.completion_percentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all ${
              data.completion_percentage >= 100 ? 'bg-green-500' :
              data.completion_percentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(data.completion_percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Delay Compensation Status */}
      <div className="bg-orange-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-800 mb-2">وضعیت جبران تاخیر</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">جبران مورد نیاز:</span>
            <span className="mr-2 font-medium text-orange-800">
              {formatMinutes(data.delay_compensation.required_minutes)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">جبران انجام شده:</span>
            <span className="mr-2 font-medium text-green-800">
              {formatMinutes(data.delay_compensation.completed_minutes)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">باقی‌مانده:</span>
            <span className={`mr-2 font-medium ${
              data.delay_compensation.remaining_minutes > 0 ? 'text-red-800' : 'text-green-800'
            }`}>
              {formatMinutes(data.delay_compensation.remaining_minutes)}
            </span>
          </div>
        </div>
      </div>

      {/* Daily Records Table */}
      <div>
        <h3 className="font-medium text-gray-800 mb-4">رکوردهای روزانه</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاریخ
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ساعت ورود
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ساعت خروج
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ساعات کارکرد
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاخیر (دقیقه)
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  جبران مورد نیاز
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  جبران انجام شده
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.daily_records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {record.date_shamsi}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500" dir="ltr">
                    {record.clock_in ? new Date(record.clock_in).toLocaleTimeString('fa-IR') : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500" dir="ltr">
                    {record.clock_out ? new Date(record.clock_out).toLocaleTimeString('fa-IR') : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatHours(record.worked_hours)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.delay_minutes > 0 ? (
                      <span className="text-red-600 font-medium">{record.delay_minutes}</span>
                    ) : (
                      <span className="text-green-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {record.compensation_minutes_required > 0 ? (
                      <span className="text-orange-600 font-medium">{record.compensation_minutes_required}</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.compensation_minutes_completed > 0 ? (
                      <span className="text-green-600 font-medium">{record.compensation_minutes_completed}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.daily_records.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            هیچ رکوردی برای این ماه یافت نشد
          </div>
        )}
      </div>

      {/* Information about 45 minutes delay */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">نکته مهم درباره تاخیر 45 دقیقه‌ای</h3>
        <p className="text-sm text-blue-700">
          طبق قانون جبران تاخیر، کارشناسی که 45 دقیقه تاخیر دارد (مثلاً ساعت 9:45 به جای 9:00 وارد می‌شود)
          در بازه 30-60 دقیقه قرار می‌گیرد و باید <strong className="font-bold">10 دقیقه جبران خدمت</strong> انجام دهد.
        </p>
      </div>
    </div>
  );
}
