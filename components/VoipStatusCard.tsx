import React from 'react';

interface AgentVoipStatus {
  id: number;
  name: string;
  extension: string;
  role: string;
  daily_talk_time: string;
  status: 'active' | 'busy' | 'offline';
}

export default function VoipStatusCard({ agents }: { agents: AgentVoipStatus[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 font-sans transition-colors duration-300" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">وضعیت اتصال زنده VoIP (ایزابل)</h3>
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
      </div>
      
      <div className="space-y-3">
        {agents.map((agent) => (
          <div key={agent.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{agent.name} (داخلی {agent.extension})</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{agent.role === 'call_center' ? 'کال سنتر' : 'تیم قرارداد'}</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-xs font-mono text-slate-600 dark:text-slate-300">{agent.daily_talk_time}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">مجموع مکالمات امروز</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}