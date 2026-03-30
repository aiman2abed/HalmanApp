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
  { id: "quests", name: "مهمات", icon: Gamepad, path: "/quests" },
  {
    id: "assistant",
    name: "حلمان أفندي",
    icon: BotMessageSquare,
    path: "/assistant",
  },
  { id: "discover", name: "اكتشف", icon: Compass, path: "/discover" },
  { id: "profile", name: "الاعدادات", icon: UserCircle, path: "/settings" },
] as const;

const hiddenRoutes = new Set(["/login", "/assessment"]);

/**
 * Global app navigation.
 * Mobile: bottom bar only. Desktop: right sidebar only.
 */
const Navigation = () => {
  const pathname = usePathname();

  if (hiddenRoutes.has(pathname)) return null;

  return (
    <>
      <nav
        aria-label="التنقل السفلي"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-2xl backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <li key={`mobile-${item.id}`}>
                <Link
                  href={item.path}
                  aria-label={item.name}
                  className={`flex min-h-[60px] flex-col items-center justify-center rounded-2xl px-1 py-2 transition ${
                    isActive
                      ? "bg-orange-100 text-orange-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="mt-1 text-[11px] font-bold">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav
        aria-label="الشريط الجانبي"
        className="fixed bottom-0 right-0 top-0 z-40 hidden w-24 border-l border-slate-200 bg-white/95 py-6 shadow-xl backdrop-blur md:flex"
      >
        <ul className="flex w-full flex-col items-center gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <li key={`desktop-${item.id}`} className="w-full px-2">
                <Link
                  href={item.path}
                  aria-label={item.name}
                  className={`group flex min-h-[72px] w-full flex-col items-center justify-center rounded-2xl px-1 py-2 text-center transition ${
                    isActive
                      ? "bg-orange-100 text-orange-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="mt-1 text-[11px] font-bold leading-4">
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
};

export default Navigation;
