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
 * Root shell for HalmanApp App Router.
 * Keeps one unified navigation component and allocates content spacing per breakpoint.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${notoKufi.className} flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900`}
      >
        <AuthProvider>
          <Navigation />
          <main className="relative h-full flex-1 overflow-y-auto pb-24 transition-all duration-300 md:pr-24 md:pb-0">
            <div className="relative mx-auto h-full w-full max-w-5xl">
              {children}
            </div>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
