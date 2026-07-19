'use client';

import React, { useState, useEffect } from 'react';
import {
  DelayCompensation,
  getAllDelayCompensations,
  getUserDelayCompensations,
  recordCompensationCompleted,
} from '@/services/delayCompensationService';

export default function DelayCompensationRecordsTable({ userId }: { userId?: number }) {
  const [records, setRecords] = useState<DelayCompensation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DelayCompensation | null>(null);
  const [compensationMinutes, setCompensationMinutes] = useState(0);

  useEffect(() => {
    fetchRecords();
  }, [userId]);

  const fetchRecords = async () => {
    setLoading(true);
    const response = userId 
      ? await getUserDelayCompensations(userId)
      : await getAllDelayCompensations();
    
    if (response.status === 'success') {
      setRecords(response.data);
    }
    setLoading(false);
  };

  const handleRecordCompensation = (record: DelayCompensation) => {
    setSelectedRecord(record);
    setCompensationMinutes(0);
    setShowRecordModal(true);
  };

  const handleSubmitCompensation = async () => {
    if (!selectedRecord || compensationMinutes <= 0) return;

    const response = await recordCompensationCompleted(selectedRecord.id, compensationMinutes);
    if (response.status === 'success') {
      setShowRecordModal(false);
      fetchRecords();
      alert('جبران خدمت با موفقیت ثبت شد');
    } else {
      alert(response.message || 'خطا در ثبت جبران خدمت');
    }
  };

  const getRemainingCompensation = (record: DelayCompensation) => {
    return Math.max(0, record.compensation_minutes_required - record.compensation_minutes_completed);
  };

  const isComplete = (record: DelayCompensation) => {
    return record.compensation_minutes_completed >= record.compensation_minutes_required;
  };

  if (loading) {
    return <div className="p-6 text-center">در حال بارگذاری...</div>;
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {userId ? 'گزارش جبران تاخیر' : 'لیست جبران تاخیرها'}
        </h1>
        <button
          onClick={fetchRecords}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          بروزرسانی
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {!userId && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  کاربر
                </th>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                تاریخ
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                تاخیر (دقیقه)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                جبران مورد نیاز
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                جبران انجام شده
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                باقی‌مانده
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                مرخصی خودکار
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.length === 0 ? (
              <tr>
                <td colSpan={userId ? 7 : 8} className="px-6 py-4 text-center text-gray-500">
                  هیچ رکوردی یافت نشد
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  {!userId && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.user_name || `کاربر ${record.user_id}`}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(record.date).toLocaleDateString('fa-IR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      record.delay_minutes > 60 ? 'bg-red-100 text-red-800' : 
                      record.delay_minutes > 30 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {record.delay_minutes} دقیقه
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.compensation_minutes_required} دقیقه
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.compensation_minutes_completed} دقیقه
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      isComplete(record) ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {getRemainingCompensation(record)} دقیقه
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.auto_leave_recorded ? (
                      <span className="text-red-600">ثبت شده</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {!isComplete(record) && (
                      <button
                        onClick={() => handleRecordCompensation(record)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        ثبت جبران
                      </button>
                    )}
                    {isComplete(record) && (
                      <span className="text-green-600">تکمیل شده</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showRecordModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">ثبت جبران خدمت</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>تاخیر:</strong> {selectedRecord.delay_minutes} دقیقه
                </p>
                <p className="text-sm text-gray-600">
                  <strong>جبران مورد نیاز:</strong> {selectedRecord.compensation_minutes_required} دقیقه
                </p>
                <p className="text-sm text-gray-600">
                  <strong>جبران انجام شده:</strong> {selectedRecord.compensation_minutes_completed} دقیقه
                </p>
                <p className="text-sm text-gray-600">
                  <strong>باقی‌مانده:</strong> {getRemainingCompensation(selectedRecord)} دقیقه
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  دقیقه جبران خدمت انجام شده
                </label>
                <input
                  type="number"
                  value={compensationMinutes}
                  onChange={(e) => setCompensationMinutes(parseInt(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                  min="1"
                  max={getRemainingCompensation(selectedRecord)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  حداکثر: {getRemainingCompensation(selectedRecord)} دقیقه
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRecordModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                انصراف
              </button>
              <button
                onClick={handleSubmitCompensation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ثبت
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
