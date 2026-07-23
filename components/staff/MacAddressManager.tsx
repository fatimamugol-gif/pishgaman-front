'use client';

import { useState, useEffect } from 'react';
import { staffService } from '@/services/staffService';

interface Agent {
  id: number;
  name: string;
  email: string;
  mac_address_1: string | null;
  mac_address_2: string | null;
  user_id: number;
  role: string;
}

export default function MacAddressManager() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [mac1, setMac1] = useState('');
  const [mac2, setMac2] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await staffService.getAgentsWithMacAddresses();
      setAgents(data);
    } catch (error) {
      console.error('خطا در دریافت لیست کارشناسان:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setMac1(agent.mac_address_1 || '');
    setMac2(agent.mac_address_2 || '');
    setErrorMsg(null);
  };

  // اعتبارسنجی فرمت MAC Address
  const isValidMac = (mac: string) => {
    if (!mac) return true; // خالی بودن مجاز است
    const regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return regex.test(mac);
  };

  const handleSave = async () => {
    if (!editingAgent) return;

    // بررسی فرمت صحیح قبل از ارسال
    if (mac1 && !isValidMac(mac1)) {
      setErrorMsg('فرمت آدرس MAC اول نامعتبر است (مثال: 00:1A:2B:3C:4D:5E)');
      return;
    }
    if (mac2 && !isValidMac(mac2)) {
      setErrorMsg('فرمت آدرس MAC دوم نامعتبر است (مثال: 00:1A:2B:3C:4D:5E)');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      await staffService.updateAgentMacAddresses(
        editingAgent.id,
        mac1 ? mac1.toUpperCase() : null,
        mac2 ? mac2.toUpperCase() : null
      );
      
      await loadAgents();
      setEditingAgent(null);
      setMac1('');
      setMac2('');
    } catch (error) {
      console.error('خطا در ذخیره MAC Address:', error);
      setErrorMsg('خطا در ذخیره اطلاعات. لطفاً مجدداً تلاش کنید.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingAgent(null);
    setMac1('');
    setMac2('');
    setErrorMsg(null);
  };

  const formatMacAddress = (value: string) => {
    const cleaned = value.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    const parts = cleaned.match(/.{1,2}/g) || [];
    return parts.slice(0, 6).join(':');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">مدیریت MAC Address کارشناسان</h2>
        <p className="text-gray-600 text-sm">
          آدرس‌های MAC به صورت خودکار در اولین و دومین ورود کارشناس ثبت و قفل می‌شوند. 
          مدیران می‌توانند در صورت تعویض دستگاه کارشناس، آدرس‌های ثبت‌شده را از این بخش ویرایش یا پاک‌سازی نمایند.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {errorMsg}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                نام کارشناس
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                ایمیل
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                MAC Address 1
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                MAC Address 2
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                نقش
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {agents.map((agent) => (
              <tr key={agent.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{agent.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingAgent?.id === agent.id ? (
                    <input
                      type="text"
                      maxLength={17}
                      value={mac1}
                      onChange={(e) => setMac1(formatMacAddress(e.target.value))}
                      placeholder="00:1A:2B:3C:4D:5E"
                      className="text-sm border border-gray-300 rounded px-2 py-1 w-44 font-mono uppercase"
                      dir="ltr"
                    />
                  ) : (
                    <div className="text-sm text-gray-500 font-mono" dir="ltr">
                      {agent.mac_address_1 || <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">ثبت‌نشده (آزاد)</span>}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingAgent?.id === agent.id ? (
                    <input
                      type="text"
                      maxLength={17}
                      value={mac2}
                      onChange={(e) => setMac2(formatMacAddress(e.target.value))}
                      placeholder="00:1A:2B:3C:4D:5F"
                      className="text-sm border border-gray-300 rounded px-2 py-1 w-44 font-mono uppercase"
                      dir="ltr"
                    />
                  ) : (
                    <div className="text-sm text-gray-500 font-mono" dir="ltr">
                      {agent.mac_address_2 || <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">ثبت‌نشده (آزاد)</span>}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {agent.role === 'admin' ? 'مدیر' : agent.role === 'supervisor' ? 'ناظر' : 'کارشناس'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingAgent?.id === agent.id ? (
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50 font-bold"
                      >
                        {saving ? 'در حال ذخیره...' : 'ذخیره'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        انصراف
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(agent)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      ویرایش / آزادسازی
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {agents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          هیچ کارشناسی یافت نشد
        </div>
      )}
    </div>
  );
}