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
  };

  const handleSave = async () => {
    if (!editingAgent) return;

    try {
      setSaving(true);
      await staffService.updateAgentMacAddresses(
        editingAgent.id,
        mac1 || null,
        mac2 || null
      );
      
      // Refresh the list
      await loadAgents();
      setEditingAgent(null);
      setMac1('');
      setMac2('');
    } catch (error) {
      console.error('خطا در ذخیره MAC Address:', error);
      alert('خطا در ذخیره MAC Address');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingAgent(null);
    setMac1('');
    setMac2('');
  };

  const formatMacAddress = (value: string) => {
    // Auto-format MAC address as user types
    const cleaned = value.replace(/[^a-fA-F0-9]/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}:${cleaned.slice(4)}`;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}:${cleaned.slice(4, 6)}:${cleaned.slice(6)}`;
    if (cleaned.length <= 10) return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}:${cleaned.slice(4, 6)}:${cleaned.slice(6, 8)}:${cleaned.slice(8)}`;
    return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}:${cleaned.slice(4, 6)}:${cleaned.slice(6, 8)}:${cleaned.slice(8, 10)}:${cleaned.slice(10, 12)}`;
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
          هر کارشناس می‌تواند حداکثر 2 MAC Address برای دستگاه‌های مجاز خود ثبت کند.
          ثبت ورود/خروج فقط از دستگاه‌های مجاز امکان‌پذیر است.
        </p>
      </div>

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
                      value={mac1}
                      onChange={(e) => setMac1(formatMacAddress(e.target.value))}
                      placeholder="00:1A:2B:3C:4D:5E"
                      className="text-sm border border-gray-300 rounded px-2 py-1 w-40"
                      dir="ltr"
                    />
                  ) : (
                    <div className="text-sm text-gray-500 font-mono" dir="ltr">
                      {agent.mac_address_1 || '-'}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingAgent?.id === agent.id ? (
                    <input
                      type="text"
                      value={mac2}
                      onChange={(e) => setMac2(formatMacAddress(e.target.value))}
                      placeholder="00:1A:2B:3C:4D:5F"
                      className="text-sm border border-gray-300 rounded px-2 py-1 w-40"
                      dir="ltr"
                    />
                  ) : (
                    <div className="text-sm text-gray-500 font-mono" dir="ltr">
                      {agent.mac_address_2 || '-'}
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
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
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
                      ویرایش
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
