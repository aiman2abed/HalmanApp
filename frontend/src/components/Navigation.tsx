"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BotMessageSquare,
  Compass,
  Gamepad,
  Home,
  UserCircle,
} from "lucide-react";

const navItems = [
  { id: "home", name: "الرئيسية", icon: Home, path: "/" },
  { id: "discover", name: "اكتشف", icon: Compass, path: "/discover" },
  {
    id: "assistant",
    name: "المساعد",
    icon: BotMessageSquare,
    path: "/assistant",
  },
  { id: "quests", name: "مهمات", icon: Gamepad, path: "/quests" },
  { id: "settings", name: "الإعدادات", icon: UserCircle, path: "/settings" },
];

/**
 * Unified HalmanApp navigation shell.
 * Renders as bottom navigation on mobile and right-side RTL dock on desktop.
 */
export default function Navigation() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/assessment") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 z-50 w-full border-t border-slate-200 bg-white/90 shadow-2xl backdrop-blur-lg transition-all duration-300 md:bottom-auto md:right-0 md:top-0 md:h-full md:w-24 md:border-l md:border-t-0"
      dir="rtl"
    >
      <div className="flex h-20 items-center justify-around gap-0 px-2 py-2 md:h-full md:flex-col md:justify-center md:gap-8 md:px-0 md:py-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          const isAssistant = item.id === "assistant";

          return (
            <Link
              key={item.id}
              href={item.path}
              className="relative flex w-full flex-col items-center justify-center md:w-auto"
            >
              {isActive && !isAssistant && (
                <div className="absolute -top-2 h-1 w-8 rounded-full bg-orange-500 md:-right-2 md:top-auto md:h-8 md:w-1" />
              )}

              <div
                className={`flex flex-col items-center transition-all duration-300 ${isAssistant ? "-translate-y-6 md:-translate-x-4 md:translate-y-0" : ""}`}
              >
                <div
                  className={`rounded-2xl p-2.5 transition-all duration-300 ${
                    isAssistant
                      ? "scale-110 bg-gradient-to-tr from-orange-400 to-pink-500 p-4 text-white shadow-xl shadow-orange-200/50 md:scale-125"
                      : isActive
                        ? "bg-orange-50 text-orange-500"
                        : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                  }`}
                >
                  <Icon
                    size={isAssistant ? 28 : 22}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>

                {/* منطق واجهة المستخدم: اسم القسم يظهر دائمًا تحت الأيقونة */}
                <span
                  className={`mt-1.5 text-[10px] font-bold transition-colors ${isActive ? "text-slate-800" : "text-slate-500"}`}
                >
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
