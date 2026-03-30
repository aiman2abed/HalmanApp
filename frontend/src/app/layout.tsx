import type { Metadata } from 'next';
import { Noto_Kufi_Arabic } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';
import { AuthProvider } from '@/contexts/AuthContext'; // <-- ADD THIS

const notoKufi = Noto_Kufi_Arabic({ subsets: ['arabic'], weight: ['400', '700', '900'] });

export const metadata: Metadata = {
  title: 'HalmanApp - طريق المستقبل',
  description: 'Gamified Educational Campus',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${notoKufi.className} bg-slate-50 text-slate-900 h-screen w-full overflow-hidden flex`}>
        {/* Wrap everything in the AuthProvider */}
        <AuthProvider>
          <Navigation />
          <main className="flex-1 h-full overflow-y-auto pb-24 md:pb-0 md:pr-24 relative transition-all duration-300">
            <div className="max-w-5xl mx-auto w-full h-full relative">
              {children}
            </div>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}