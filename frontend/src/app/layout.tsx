import type { Metadata, Viewport } from "next";
import { Noto_Kufi_Arabic } from "next/font/google";
import Navigation from "@/components/Navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const notoKufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["400", "700", "900"],
});

// إعدادات ألوان التطبيق في شريط إشعارات الهاتف وخصائص العرض
export const viewport: Viewport = {
  themeColor: "#f97316", // لون برتقالي ليتناسب مع هوية حلمان
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // لمنع التقريب العشوائي عند النقر المزدوج في الهواتف
};

export const metadata: Metadata = {
  title: "Halman",
  description: "منصة حلمان التعليمية والتفاعلية",
  manifest: "/manifest.json", // سيتم توليده تلقائياً من ملف manifest.ts الذي أنشأناه
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Halman",
  },
};

/**
 * Root app shell with single-navigation architecture.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${notoKufi.className} h-screen overflow-hidden bg-slate-100 text-slate-900`}
      >
        <AuthProvider>
          <Navigation />
          <main className="relative h-full overflow-y-auto pb-24 md:pb-0 md:pr-24">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}