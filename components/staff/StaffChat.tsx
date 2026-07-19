'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';


const BACKEND_BASE_URL = API_BASE_URL;

interface User {
  id: number;
  name: string;
  role: string;
  status?: string;
}

interface Conversation {
  user: User;
  last_message: string;
  last_time: string;
  unread_count: number;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function StaffChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [view, setView] = useState<'conversations' | 'new_chat'>('conversations');
  const [allStaff, setAllStaff] = useState<User[]>([]);
  const [searchStaff, setSearchStaff] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const getToken = () => localStorage.getItem('token');

  // Load current user info
  useEffect(() => {
    const fetchUser = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/user`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.id) setCurrentUserId(json.id);
      } catch (e) { console.error(e); }
    };
    fetchUser();
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/staff/chat/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.status === 'success') {
        setConversations(json.data);
        const total = json.data.reduce((sum: number, c: Conversation) => sum + c.unread_count, 0);
        setUnreadTotal(total);
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (isOpen) loadConversations();
  }, [isOpen, loadConversations]);

  // Load all staff users for new chat
  const loadAllStaff = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/next/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.status === 'success') {
        // Filter out current user and clients
        const staff = (json.data || []).filter((u: any) => u.id !== currentUserId && u.role !== 'client');
        setAllStaff(staff);
      }
    } catch (e) { console.error(e); }
  }, [currentUserId]);

  // Load messages for selected user
  const loadMessages = useCallback(async (userId: number) => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/staff/chat/messages/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.status === 'success') setMessages(json.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  // Select a conversation
  const selectConversation = (user: User) => {
    setSelectedUser(user);
    setView('conversations');
    loadMessages(user.id);
    setConversations(prev => prev.map(c =>
      c.user.id === user.id ? { ...c, unread_count: 0 } : c
    ));
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    const token = getToken();
    if (!token) return;

    const optimisticMsg: Message = {
      id: Date.now(),
      sender_id: currentUserId!,
      receiver_id: selectedUser.id,
      message: newMessage.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/staff/chat/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiver_id: selectedUser.id, message: optimisticMsg.message }),
      });
      const json = await res.json();
      if (json.status === 'success') {
        setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? json.data : m));
        loadConversations();
      }
    } catch (e) { console.error(e); }
  };

  // Listen for real-time messages via Echo
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Echo && currentUserId) {
      const channel = (window as any).Echo.channel(`staff-chat.${currentUserId}`);

      channel.listen('App\\Events\\StaffMessageSent', (e: any) => {
        if (selectedUser && e.sender_id === selectedUser.id) {
          setMessages(prev => [...prev, {
            id: e.id,
            sender_id: e.sender_id,
            receiver_id: e.receiver_id,
            message: e.message,
            is_read: e.is_read,
            created_at: e.created_at,
          }]);
        }
        loadConversations();
      });

      return () => {
        (window as any).Echo.leave(`staff-chat.${currentUserId}`);
      };
    }
  }, [currentUserId, selectedUser, loadConversations]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const closeChat = () => {
    setSelectedUser(null);
    setMessages([]);
    setView('conversations');
    loadConversations();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'supervisor': 'سرپرست',
      'admin': 'مدیر',
      'agent': 'کارشناس',
      'senior_consultant': 'مشاور ارشد',
      'initial_consultant': 'مشاور اولیه',
    };
    return labels[role] || role;
  };

  const filteredStaff = allStaff.filter(u =>
    u.name.includes(searchStaff) || u.role.includes(searchStaff)
  );

  return (
    <>
      {/* Chat FAB Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" />
            </svg>
            {unreadTotal > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatBoxRef}
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[500px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all"
          dir="rtl"
        >
          {/* Header */}
          <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" />
              </svg>
              <span className="font-black text-sm">
                {selectedUser ? selectedUser.name : 'چت کارشناسان'}
              </span>
            </div>
            {selectedUser && (
              <button
                type="button"
                onClick={closeChat}
                className="text-white/80 hover:text-white text-xs font-bold cursor-pointer"
              >
                ← بازگشت
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {!selectedUser && view === 'conversations' && (
              /* Conversation List */
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* New Chat Button */}
                <button
                  type="button"
                  onClick={() => { setView('new_chat'); loadAllStaff(); }}
                  className="w-full text-right px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 flex items-center gap-3 transition-colors border-b-2 border-indigo-100 dark:border-indigo-900/50 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                    <span className="text-emerald-600 dark:text-emerald-400 text-lg">+</span>
                  </div>
                  <div>
                    <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">شروع چت جدید</span>
                    <div className="text-[10px] text-slate-400 mt-0.5">ارسال پیام به یکی از کارشناسان</div>
                  </div>
                </button>

                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 opacity-30" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">هنوز چتی شروع نشده</span>
                    <span className="text-[10px] mt-1">روی "شروع چت جدید" کلیک کن</span>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.user.id}
                      type="button"
                      onClick={() => selectConversation(conv.user)}
                      className="w-full text-right px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                        <span className="text-indigo-600 dark:text-indigo-400 text-xs font-black">
                          {getInitials(conv.user.name)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                            {conv.user.name}
                          </span>
                          {conv.last_time && (
                            <span className="text-[10px] text-slate-400 shrink-0 mr-2">{conv.last_time}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {conv.last_message || 'شروع گفتگو...'}
                          </span>
                          {conv.unread_count > 0 && (
                            <span className="bg-rose-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 mr-2">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {!selectedUser && view === 'new_chat' && (
              /* New Chat - All Staff List */
              <div>
                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                  <input
                    type="text"
                    value={searchStaff}
                    onChange={(e) => setSearchStaff(e.target.value)}
                    placeholder="جستجوی کارشناس..."
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  <button
                    type="button"
                    onClick={() => setView('conversations')}
                    className="w-full text-right px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-2 text-slate-500 text-xs cursor-pointer"
                  >
                    ← بازگشت به لیست مکالمات
                  </button>
                  {filteredStaff.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">کارشناسی یافت نشد</div>
                  ) : (
                    filteredStaff.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => selectConversation(user)}
                        className="w-full text-right px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                          <span className="text-indigo-600 dark:text-indigo-400 text-xs font-black">
                            {getInitials(user.name)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                            {user.name}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {getRoleLabel(user.role)}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {selectedUser && (
              /* Messages View */
              <div className="flex flex-col h-full">
                {/* User Info Bar */}
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    <span className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black">
                      {getInitials(selectedUser.name)}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{selectedUser.name}</span>
                    <span className="text-[10px] text-slate-400 mr-2">({getRoleLabel(selectedUser.role)})</span>
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">در حال بارگذاری...</div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">اولین پیام را ارسال کنید 👋</div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender_id === currentUserId;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-sm shadow-sm ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-bl-md'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-br-md'
                            }`}
                          >
                            <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-start' : 'justify-end'}`}>
                              <span className={`text-[10px] ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {formatTime(msg.created_at)}
                              </span>
                              {isMe && (
                                <svg className={`w-3 h-3 ${msg.is_read ? 'text-blue-300' : 'text-indigo-300'}`} viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Box */}
                <div className="border-t border-slate-200 dark:border-slate-800 p-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="پیام خود را بنویسید..."
                      className="flex-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" style={{ transform: 'scaleX(-1)' }}>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}