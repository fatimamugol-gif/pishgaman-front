'use client';

import React from 'react';
import DelayCompensationRulesTable from '@/components/staff/DelayCompensationRulesTable';
import DelayCompensationRecordsTable from '@/components/staff/DelayCompensationRecordsTable';

export default function DelayCompensationPage() {
  const [activeTab, setActiveTab] = React.useState<'rules' | 'records'>('rules');

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 space-x-reverse" dir="rtl">
            <button
              onClick={() => setActiveTab('rules')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rules'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              قوانین جبران تاخیر
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'records'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              گزارش جبران تاخیرها
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'rules' && <DelayCompensationRulesTable />}
        {activeTab === 'records' && <DelayCompensationRecordsTable />}
      </div>
    </div>
  );
}