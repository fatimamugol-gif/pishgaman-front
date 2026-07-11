// components/staff/AdminAttendanceViewer.tsx
'use client';

import React, { useState, useEffect } from 'react';

export default function AdminAttendanceViewer({ usersList, BACKEND_BASE_URL, formatTimestampToPersian, formatDurationText }: any) {
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [userRole, setUserRole] = useState('supervisor'); 
  const [isGroupedByDay, setIsGroupedByDay] = useState(false);

  // استیت‌های ماژول ویرایش دستی تردد
  const [editingAttendance, setEditingAttendance] = useState<any>(null);
  const [correctionForm, setCorrectionForm] = useState({ clock_in_time: '', clock_out_time: '' });

  const fetchFilteredLogs = async () => {
    const token = localStorage.getItem('token');
    let url = `${BACKEND_BASE_URL}/api/next/hr/admin/all-attendance?`;
    if (selectedUser) url += `user_id=${selectedUser}&`;
    
    if (filterDate) {
      const startTs = Math.floor(new Date(filterDate).setHours(0,0,0,0) / 1000);
      const endTs = Math.floor(new Date(filterDate).setHours(23,59,59,999) / 1000);
      url += `start_timestamp=${startTs}&end_timestamp=${endTs}`;
    }

    try {
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const json = await res.json();
      if (json.status === 'success') setFilteredLogs(json.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    fetchFilteredLogs(); 
    
    const localUser = localStorage.getItem('user');
    if (localUser) {
      const u = JSON.parse(localUser);
      setUserRole(u.role || 'agent');
    }
  }, [selectedUser, filterDate]);

  const isSupervisor = userRole === 'supervisor' || userRole === 'admin';

  const handleAttendanceCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttendance) return;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/next/hr/admin/update-attendance`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendance_id: editingAttendance.id,
          clock_in_time: correctionForm.clock_in_time,
          clock_out_time: correctionForm.clock_out_time,
          date_shamsi: filterDate || new Date().toISOString().slice(0, 10)
        })
      });

      if (res.ok) {
        alert('✓ کارکرد کارشناس با موفقیت اصلاح و در هسته دیتابیس قفل شد.');
        setEditingAttendance(null);
        fetchFilteredLogs(); 
      } else {
        const data = await res.json();
        alert(`❌ خطا: ${data.message || 'مشکل در اصطلاح داده.'}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getProcessedLogs = () => {
    if (!isGroupedByDay) return filteredLogs;

    const grouped: { [key: string]: any } = {};

    filteredLogs.forEach((log) => {
      const inInfo = formatTimestampToPersian(log.clock_in_timestamp);
      const groupKey = `${log.user_id}_${inInfo.shamsiDate}`;

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          ...log,
          first_in_ts: log.clock_in_timestamp,
          last_out_ts: log.clock_out_timestamp,
          total_duration: log.duration_seconds,
          records_count: 1
        };
      } else {
        if (log.clock_in_timestamp < grouped[groupKey].first_in_ts) {
          grouped[groupKey].first_in_ts = log.clock_in_timestamp;
        }
        if (log.clock_out_timestamp && (!grouped[groupKey].last_out_ts || log.clock_out_timestamp > grouped[groupKey].last_out_ts)) {
          grouped[groupKey].last_out_ts = log.clock_out_timestamp;
        }
        grouped[groupKey].total_duration += log.duration_seconds;
        grouped[groupKey].records_count += 1;
      }
    });

    return Object.values(grouped);
  };

  return (
    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-2xs space-y-4 text-right animate-fadeIn" dir="rtl">
      
      {/* بخش هدر فیلترها */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h4 className="text-xs font-black text-slate-800">🔍 اتاق پایش و فیلتر پیشرفته کارکرد پرسنل دپارتمان</h4>
          <p className="text-slate-400 text-[10px] mt-0.5">قابلیت رصد و گزارش‌گیری لایو بر پایه فیلتر انتخابی کارمند و روز کاری</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsGroupedByDay(!isGroupedByDay)}
            className={`px-3 py-2 rounded-xl font-black text-[10px] transition-all cursor-pointer border ${
              isGroupedByDay 
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' 
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {isGroupedByDay ? '👑 نمایش به صورت تفکیکی و خرد' : '📊 تجمیع کل روز در یک رکورد'}
          </button>

          <select className="p-2 border rounded-xl bg-slate-50 font-bold text-slate-700 cursor-pointer text-[10px] outline-none" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
            <option value="">🎯 مانیتورینگ کل کارمندان شعبه...</option>
            {usersList.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <input type="date" className="p-2 border rounded-xl bg-slate-50 font-bold text-slate-600 font-mono text-[10px] outline-none cursor-pointer" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        </div>
      </div>

      {/* بخش جدول اصلی پایش تردد */}
      <div className="overflow-x-auto border rounded-xl max-h-[250px] overflow-y-auto shadow-2xs">
        <table className="w-full text-right border-collapse whitespace-nowrap">
          <thead className="bg-slate-950 text-white font-bold h-9 text-[10px]">
            <tr>
              <th className="p-2.5">نام کارمند</th>
              <th className="p-2.5 text-center">روز هفته</th>
              <th className="p-2.5 text-center">تاریخ تقویم</th>
              <th className="p-2.5 text-center">ساعت اولین ورود</th>
              <th className="p-2.5 text-center">ساعت آخرین خروج</th>
              <th className="p-2.5 text-center bg-indigo-900">مجموع خالص کارکرد روز</th>
              {isSupervisor && <th className="p-2.5 text-center bg-amber-600">اصلاحیه دستی ناظر</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[10px] text-slate-600 font-medium">
            {getProcessedLogs().length === 0 ? (
              <tr>
                <td colSpan={isSupervisor ? 7 : 6} className="p-6 text-center text-slate-400">هیچ رکورد کارکردی با فیلتر انتخابی شما مچ نشد. ✨</td>
              </tr>
            ) : (
              getProcessedLogs().map((log: any, i: number) => {
                const inTs = isGroupedByDay ? log.first_in_ts : log.clock_in_timestamp;
                const outTs = isGroupedByDay ? log.last_out_ts : log.clock_out_timestamp;
                const duration = isGroupedByDay ? log.total_duration : log.duration_seconds;

                const inInfo = formatTimestampToPersian(inTs);
                const outInfo = formatTimestampToPersian(outTs);
                
                return (
                  <tr key={i} className="hover:bg-slate-50 h-10 transition-colors">
                    <td className="p-2.5 font-black text-slate-900 flex items-center gap-2">
                      {log.user_name}
                      {isGroupedByDay && (
                        <span className="bg-amber-50 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded-md border border-amber-200">
                          📦 {log.records_count} بازه
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-center text-indigo-600 font-bold">{inInfo.dayName}</td>
                    <td className="p-2.5 text-center font-mono font-bold">{inInfo.shamsiDate}</td>
                    <td className="p-2.5 text-center font-mono text-emerald-600 font-bold">{inInfo.timeStr}</td>
                    <td className="p-2.5 text-center font-mono text-rose-600 font-bold">
                      {outTs ? outInfo.timeStr : isGroupedByDay ? 'تایمر باز' : '⏳ در حال کار...'}
                    </td>
                    <td className="p-2.5 text-center font-mono font-black bg-indigo-50/40 text-indigo-950">
                      {formatDurationText(duration)}
                    </td>
                    
                    {isSupervisor && (
                      <td className="p-2.5 text-center font-mono font-black bg-amber-500/5">
                        <button 
                          type="button" 
                          onClick={() => {
                            const dateIn = new Date(inTs * 1000);
                            const dateOut = outTs ? new Date(outTs * 1000) : new Date();
                            setEditingAttendance(log);
                            setCorrectionForm({
                              clock_in_time: dateIn.toTimeString().slice(0, 5),
                              clock_out_time: outTs ? dateOut.toTimeString().slice(0, 5) : ''
                            });
                          }} 
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1 rounded-xl font-black text-[9px] cursor-pointer transition-all shadow-2xs"
                        >
                          ✏️ اصلاح بازه
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================= ⚖️ مگا-مودال نئونی اصلاح دستی ساعت کارکرد پرسنل ================= */}
      {editingAttendance && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center animate-fadeIn">
          <form onSubmit={handleAttendanceCorrectionSubmit} className="bg-white p-6 rounded-[28px] border w-[360px] shadow-2xl space-y-4 text-right">
            <h3 className="text-sm font-black text-slate-800">⚙️ اصلاح دستی ساعت کارکرد مفید</h3>
            <p className="text-[10px] text-slate-400">ناظر گرامی، لطفاً بازه ورود و خروج واقعی را با فرمت ۲۴ ساعته اصلاح فرمایید. نام کاربر: <span className="text-indigo-600 font-black">{editingAttendance.user_name}</span></p>
            
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 font-bold text-slate-500 text-[10px]">
                ⏱️ ساعت ورود واقعی:
                <input type="text" placeholder="مثال: 08:30" className="p-2.5 border rounded-xl bg-slate-50 font-mono text-center outline-none text-slate-800 text-xs font-black" value={correctionForm.clock_in_time} onChange={e => setCorrectionForm({...correctionForm, clock_in_time: e.target.value})} required />
              </label>
              <label className="flex flex-col gap-1 font-bold text-slate-500 text-[10px]">
                🛑 ساعت خروج واقعی:
                <input type="text" placeholder="مثال: 17:15" className="p-2.5 border rounded-xl bg-slate-50 font-mono text-center outline-none text-slate-800 text-xs font-black" value={correctionForm.clock_out_time} onChange={e => setCorrectionForm({...correctionForm, clock_out_time: e.target.value})} required />
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 bg-slate-900 text-white font-black py-2 rounded-xl text-xs cursor-pointer">💾 قفل دستی تغییرات</button>
              <button type="button" onClick={() => setEditingAttendance(null)} className="px-4 bg-slate-100 text-slate-600 font-bold py-2 rounded-xl cursor-pointer">انصراف</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}