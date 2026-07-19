//app/dashboard/users/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';

export default function UsersAndDepartmentsManagement() {
  const [panelTab, setPanelTab] = useState<'users' | 'departments'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingUser, setEditingUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showCreateUserModal, setShowCreateModal] = useState(false);
  
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'agent', department_id: '', voip_extension: '' });

  const BACKEND_BASE_URL = API_BASE_URL;

  const [editingDept, setEditingDept] = useState<any>(null);

  const loadAllData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };

    try {
      const uRes = await fetch(`${BACKEND_BASE_URL}/next/users`, { headers });
      const uData = await uRes.json();
      if (uData.status === 'success') setUsers(uData.data || []);

      const dRes = await fetch(`${BACKEND_BASE_URL}/next/departments`, { headers });
      const dData = await dRes.json();
      if (dData.status === 'success') setDepartments(dData.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAllData(); }, []);

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_BASE_URL}/next/departments/store`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(editingDept)
    });
    if (res.ok) {
      alert('✓ اطلاعات و پرمیشن‌های پایه دپارتمان با موفقیت مستقر شدند.');
      setEditingDept(null);
      loadAllData();
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_BASE_URL}/next/users/store`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(newUser)
    });
    if (res.ok) {
      alert('✓ کارشناس جدید با موفقیت ایجاد و داخلی‌های مخابرات پلمب شدند.');
      setShowCreateModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'agent', department_id: '', voip_extension: '' });
      loadAllData();
    }
  };

  const handleUserUpdate = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_BASE_URL}/next/users/update/${editingUser.id}`, {
      method: 'POST', 
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: editingUser.name,
        role: editingUser.role,
        status: editingUser.status,
        department_id: editingUser.department_id ? parseInt(editingUser.department_id) : null,
        voip_extension: editingUser.voip_extension, // 🎯 الحاق زنده داخلی‌های فرعی
        password: newPassword,
        permissions: editingUser.permissions_parsed || {}
      })
    });
    if (res.ok) {
      alert('✓ تغییرات پروفایل کارشناس، داخلی‌های سازمانی و پرمیشن‌ها با موفقیت اعمال شد.');
      setEditingUser(null);
      setNewPassword('');
      loadAllData();
    } else {
      alert('خطا در به‌روزرسانی دسترسی‌های کارشناس مرکز تلفن.');
    }
  };

  const openUserEdit = (user: any) => {
    let permissions_parsed = { view_all_leads: false, delete_leads: false, export_excel: false, edit_settings: false, menu_leads: true, menu_reports: false };
    try { if (user.permissions) permissions_parsed = { ...permissions_parsed, ...JSON.parse(user.permissions) }; } catch (e) { }
    setEditingUser({ ...user, permissions_parsed });
  };

  if (loading) return <div className="p-20 text-center text-xs font-sans text-slate-500" dir="rtl">⏳ در حال بارگذاری زیرساخت امنیتی پیشگامان...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-right font-sans text-xs" dir="rtl">

      <div className="flex gap-4 mb-6 bg-white p-4 rounded-2xl border">
        <button onClick={() => setPanelTab('users')} className={`px-5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${panelTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}>💼 مدیریت کاربران و دسترسی‌ها</button>
        <button onClick={() => setPanelTab('departments')} className={`px-5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${panelTab === 'departments' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}>🏢 مدیریت دپارتمان‌ها و مجوزهای منو</button>
      </div>

      {panelTab === 'users' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border flex justify-between items-center">
            <div>
              <h2 className="text-base font-black text-slate-800">🛡️ ماتریس کارشناسان و پرمیشن‌ها</h2>
              <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">پشتیبانی کامل از داخلی‌های چندگانه کارشناسان فروش جهت محاسبه دقیق راندمان و حقوق</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold cursor-pointer hover:bg-indigo-700 transition-all text-xs">➕ افزودن عضو جدید</button>
          </div>

          <div className="bg-white rounded-2xl border overflow-hidden shadow-2xs">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                <tr>
                  <th className="p-4">نام کارشناس</th>
                  <th className="p-4">ایمیل سازمانی</th>
                  <th className="p-4">خطوط داخلی VoIP معتبر</th>
                  <th className="p-4">دپارتمان فعال</th>
                  <th className="p-4">وضعیت حساب</th>
                  <th className="p-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{u.name}</td>
                    <td className="p-4 font-mono text-slate-500">{u.email}</td>
                    <td className="p-4">
                      {/* نمایش شیک داخلی‌ها با رنگ‌بندی تفکیک‌شده */}
                      <div className="flex flex-wrap gap-1 justify-start">
                        {(u.voip_extension || '---').split(',').map((ext: string, i: number) => (
                          <span key={i} className="font-mono font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-lg text-[10px]">{ext.trim()}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-indigo-600">{departments.find(d => d.id === u.department_id)?.name || '🔴 بدون دپارتمان'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{u.status === 'active' ? 'فعال' : 'غیرفعال'}</span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => openUserEdit(u)} className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer text-[10px] transition-all">🛠️ تنظیمات دسترسی</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* مودال مدیریت و ویرایش دسترسی‌های کارشناسان */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-4 border max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-slate-800 text-sm">👤 ویرایش شناسنامه سازمانی: {editingUser.name}</h3>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border">
              <label className="font-bold text-slate-600">نقش سیستم:
                <select className="w-full p-2 border rounded-lg mt-1 bg-white font-bold cursor-pointer" value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
                  <option value="agent">💼 کارشناس فروش</option>
                  <option value="supervisor">👑 ناظر کل</option>
                </select>
              </label>
              <label className="font-bold text-slate-600">وضعیت حساب:
                <select className="w-full p-2 border rounded-lg mt-1 bg-white font-bold cursor-pointer" value={editingUser.status} onChange={e => setEditingUser({ ...editingUser, status: e.target.value })}>
                  <option value="active">🟢 فعال</option>
                  <option value="inactive">🚫 غیرفعال</option>
                </select>
              </label>

              <label className="font-bold text-slate-600 col-span-2">🏢 انتساب به دپارتمان:
                <select className="w-full p-2 border rounded-lg mt-1 bg-white font-bold text-indigo-600 outline-none cursor-pointer" value={editingUser.department_id || ''} onChange={e => setEditingUser({ ...editingUser, department_id: e.target.value })}>
                  <option value="">🔴 بدون دپارتمان آزاد</option>
                  {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600">📞 مدیریت لایو داخلی‌های مرکز تلفن (با کاما جدا کنید):</label>
              <input type="text" className="w-full p-2.5 border rounded-xl bg-slate-50 font-mono text-center text-teal-600 font-bold" value={editingUser.voip_extension || ''} onChange={e => setEditingUser({ ...editingUser, voip_extension: e.target.value })} placeholder="مثال: 305,302,303" />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600">کلمه عبور جدید (اختیاری):</label>
              <input type="text" placeholder="فقط در صورت نیاز پر کنید..." className="w-full p-2 border rounded-lg bg-slate-50 font-mono text-center" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>

            <div className="pt-2 flex gap-2">
              <button onClick={handleUserUpdate} className="flex-1 bg-indigo-600 text-white p-2.5 rounded-xl font-bold cursor-pointer hover:bg-indigo-700 transition-all">💾 ذخیره تغییرات کارشناس</button>
              <button onClick={() => setEditingUser(null)} className="bg-slate-100 text-slate-600 p-2.5 rounded-xl font-medium cursor-pointer">انصراف</button>
            </div>
          </div>
        </div>
      )}

      {/* مودال افزودن کاربر جدید */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center animate-fadeIn">
          <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm space-y-3 border">
            <h3 className="font-black text-slate-800 text-sm">➕ عضویت کارشناس جدید</h3>
            <label className="block font-bold">نام و نام خانوادگی:<input type="text" required className="w-full p-2 border rounded-lg mt-1" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} /></label>
            <label className="block font-bold">ایমেল کاربری:<input type="email" required className="w-full p-2 border rounded-lg mt-1 font-mono text-left" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} /></label>
            <label className="block font-bold">کلمه عبور:<input type="password" required className="w-full p-2 border rounded-lg mt-1 font-mono text-center" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} /></label>
            <label className="block font-bold">دپارتمان اولیه:
              <select className="w-full p-2 border rounded-lg mt-1 font-bold cursor-pointer" value={newUser.department_id} onChange={e => setNewUser({ ...newUser, department_id: e.target.value })}>
                <option value="">انتخاب کنید...</option>
                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                📞 شماره داخلی مرکز تلفن (برای چند خط با کاما جدا کنید) *
              <input
                type="text"
                required
                placeholder="مثال: 305,302"
                className="w-full mt-1 p-2.5 border rounded-xl font-mono text-center tracking-widest text-indigo-600 bg-slate-50 focus:bg-white transition-all text-[11px]"
                value={newUser.voip_extension || ''}
                onChange={(e) => setNewUser({ ...newUser, voip_extension: e.target.value })}
              />
            </label>
            <div className="pt-2 flex gap-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white p-2.5 rounded-xl font-bold cursor-pointer hover:bg-indigo-700 transition-all">💾 ثبت</button>
              <button type="button" onClick={() => setShowCreateModal(false)} className="bg-slate-100 text-slate-600 p-2.5 rounded-xl font-medium cursor-pointer">انصراف</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}