import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // ۱. استخراج مسیر فعلی که کاربر قصد ورود به آن را دارد
  const { pathname } = request.nextUrl;

  // ۲. این ترفند برای خنثی کردن خطاهای توکن در لوکال استوریج است؛ 
  // در Middleware نکس، ما به کوکی‌ها دسترسی مستقیم داریم
  const token = request.cookies.get('pishgaman_token')?.value;

  // ۳. اگر کاربر قصد ورود به صفحات داشبورد را دارد ولی توکن ندارد:
  if (pathname.startsWith('/dashboard') && !token) {
    // او را با احترام به صفحه لاگین هدایت کن
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // ۴. اگر کاربر لاگین کرده و می‌خواهد دوباره به صفحه لاگین (/auth) برود:
  if (pathname.startsWith('/auth') && token) {
    // او را مستقیم بفرست به کارتابلش
    return NextResponse.redirect(new URL('/dashboard/leads', request.url));
  }

  return NextResponse.next();
}

// 🎯 کانفیگ مقتدر مچ‌کد: این گارد فقط روی آدرس‌های زیر سایه می‌اندازد
export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};