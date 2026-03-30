import type { Metadata } from "next";
import { Noto_Kufi_Arabic } from "next/font/google";
import Navigation from "@/components/Navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const notoKufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "HalmanApp - طريق المستقبل",
  description: "Gamified Educational Campus",
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
