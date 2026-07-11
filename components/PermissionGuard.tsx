'use client';

import React, { useEffect, useState } from 'react';

interface GuardProps {
  permissionKey: string; // مثلاً 'view_all_leads' یا 'menu_reports'
  children: React.ReactNode;
}

export default function PermissionGuard({ permissionKey, children }: GuardProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    // ۱. ناظر ارشد به طور پیش‌فرض به تمام منوها و دکمه‌ها دسترسی مطلق دارد
    const role = localStorage.getItem('user_role');
    if (role === 'supervisor') {
      setHasAccess(true);
      return;
    }

    // ۲. بررسی پرمیشن‌های اورراید شدهٔ خود کاربر در لوکال استوریج
    try {
      const userPermsRaw = localStorage.getItem('user_permissions');
      const userPerms = userPermsRaw ? JSON.parse(userPermsRaw) : {};
      
      if (userPerms[permissionKey] === true) {
        setHasAccess(true);
        return;
      }
      
      if (userPerms[permissionKey] === false) {
        setHasAccess(false);
        return;
      }
    } catch (e) {
      console.error("خطا در خواندن پرمیشن‌های اختصاصی");
    }

    // ۳. فالبک: اگر کاربر پرمیشن اختصاصی نداشت، باید به پرمیشن دپارتمانش رجوع شود
    // این داتا را موقع لاگین در کامپوننت بعدی ذخیره می‌کنیم
    try {
      const deptPermsRaw = localStorage.getItem('dept_permissions');
      const deptPerms = deptPermsRaw ? JSON.parse(deptPermsRaw) : {};
      
      setHasAccess(deptPerms[permissionKey] === true);
    } catch (e) {
      setHasAccess(false);
    }
  }, [permissionKey]);

  if (hasAccess === null) return null; // در حال واکشی گارد
  if (!hasAccess) return null; // عدم دسترسی -> رندر نشدن بخش مربوطه

  return <>{children}</>;
}