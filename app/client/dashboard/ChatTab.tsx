"use client";

import React from 'react';

interface ChatTabProps {
  chats: any[];
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendChatMessage: (e: React.FormEvent) => void;
}

export default function ChatTab({ chats, chatInput, setChatInput, handleSendChatMessage }: ChatTabProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border dark:border-slate-800 shadow-xl flex flex-col h-[520px] animate-fadeIn">
      <div className="border-b pb-2 mb-3">
        <h3 className="font-black text-slate-800 dark:text-white text-xs">💬 کانال امن چت زنده با مشاور ارشد پرونده</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl pr-2">
        {chats.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-bold">هیچ پیامی یافت نشد؛ اولین پیام را ارسال کنید رفیق. ✨</div>
        ) : (
          chats.map((chat: any) => {
            const isMe = chat.sender === 'user';
            return (
              <div key={chat.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                <div className={`p-3 max-w-sm rounded-2xl text-[11px] font-bold shadow-2xs ${isMe ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-600/10' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border dark:border-slate-700'}`}>
                  <div>{chat.message}</div>
                  <span className="text-[8px] opacity-60 block text-left font-mono mt-1">{chat.time} - {chat.date}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSendChatMessage} className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="پیام خود را بنویسید..."
          className="w-full p-3 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-bold text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
        />
        <button type="submit" className="bg-indigo-600 text-white font-black px-6 rounded-xl text-xs hover:bg-indigo-700 transition-all cursor-pointer shadow-md">ارسال 🚀</button>
      </form>
    </div>
  );
}