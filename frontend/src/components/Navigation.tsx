// src/components/Navigation.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, BotMessageSquare, Gamepad, UserCircle } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  // Hide completely on auth and assessment onboarding flows
  if (pathname === '/login' || pathname === '/assessment') return null;

  const navItems = [
    { id: 'home', name: 'الرئيسية', icon: Home, path: '/' },
    { id: 'discover', name: 'اكتشف', icon: Compass, path: '/discover' },
    { id: 'assistant', name: 'المساعد', icon: BotMessageSquare, path: '/assistant' },
    { id: 'quests', name: 'مهمات', icon: Gamepad, path: '/quests' },
    { id: 'settings', name: 'الاعدادات', icon: UserCircle, path: '/settings' },
  ];

  return (
    <nav className="fixed z-50 bg-white/90 backdrop-blur-lg border-slate-200 shadow-2xl transition-all duration-300
      /* Mobile: Bottom Nav */
      bottom-0 left-0 w-full border-t pb-safe
      /* Desktop: Right Side Dock (RTL) */
      md:top-0 md:right-0 md:bottom-auto md:w-24 md:h-full md:border-l md:border-t-0" 
      dir="rtl"
    >
      <div className="flex md:flex-col justify-around md:justify-center items-center h-20 md:h-full px-2 md:px-0 py-2 md:py-8 gap-0 md:gap-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          const isAssistant = item.id === 'assistant';

          return (
            <Link key={item.id} href={item.path} className="relative flex flex-col items-center justify-center w-full md:w-auto">
              
              {/* Active Indicator Line */}
              {isActive && !isAssistant && (
                <div className="absolute -top-2 md:top-auto md:-right-2 w-8 md:w-1 h-1 md:h-8 bg-orange-500 rounded-full" />
              )}
              
              <div className={`flex flex-col items-center transition-all duration-300 
                ${isAssistant ? '-translate-y-6 md:translate-y-0 md:-translate-x-4' : ''}`}>
                
                {/* Icon Box */}
                <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
                  isAssistant ? 'bg-gradient-to-tr from-orange-400 to-pink-500 text-white shadow-xl shadow-orange-200/50 p-4 scale-110 md:scale-125' : 
                  isActive ? 'bg-orange-50 text-orange-500' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}>
                  <Icon size={isAssistant ? 28 : 22} strokeWidth={isActive ? 2.5 : 2} />
                </div>

                {/* Text Label */}
                <span className={`text-[10px] font-bold mt-1.5 transition-colors ${
                  isActive ? 'text-slate-800' : 'text-slate-500'
                }`}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}