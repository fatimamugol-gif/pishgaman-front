/** @type {import('next').NextConfig} */
const nextConfig = {
// output: 'export',
  // 🧠 گام اول: فعال‌سازی آپشن توربوپک خالی جهت بی‌صدا کردن و رفع ارور کامپایلر
  turbopack: {},

  // 🧠 گام دوم: کانفیگ استاندارد HMR پورت ۴۰۰۰ شبکه بدون استفاده از بلاک وب‌پک قدیمی
  devIndicators: {
    appIsrStatus: false, // غیرفعال کردن اعلان‌های کاستوم سنگین در شبکه
  }
};

//export default nextConfig;
module.exports = nextConfig;