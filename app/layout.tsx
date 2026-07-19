import type { Metadata } from "next";
import { ThemeProvider } from "../context/ThemeContext";
import localFont from "next/font/local";
import "./globals.css";
import EchoListener from "@/components/EchoListener";

// const vazirFont = Vazirmatn({
//   subsets: ["arabic"],
//   weight: ["300", "400", "500", "700", "900"],
//   variable: "--font-vazir",
// });

const vazirFont = localFont({
  src: [
    {
      path: "./fonts/Vazir-FD.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Vazir-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Vazir-Bold-FD.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-vazir",
});

export const metadata: Metadata = {
  title: "داشبورد پیشگامان",
  description: "CRM Automation Portal",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={vazirFont.variable}>
      <body className={`${vazirFont.className} antialiased bg-slate-50 text-slate-800`}>
        <ThemeProvider>
          <EchoListener />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
