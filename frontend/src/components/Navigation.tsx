// src/components/Navigation.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BotMessageSquare,
  Compass,
  Gamepad,
  Home,
  UserCircle,
  ShieldAlert,
  Building2,
  Presentation,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const hiddenRoutes = new Set(["/login", "/assessment"]);

export default function Navigation() {
  const pathname = usePathname();
  const { roleAssignments, loading } = useAuth();

  // Do not render navigation on authentication, assessment screens, or while loading roles
  if (hiddenRoutes.has(pathname) || loading) return null;

  // 1. Dynamically build the navigation items based on RBAC roles
  const isDeveloper = roleAssignments.some((ra) => ra.role === "app_developer");
  const isSchoolAdmin = roleAssignments.some((ra) => ra.role === "school_admin");
  const isTeacherOrSpaceAdmin = roleAssignments.some((ra) => ra.role === "class_teacher" || ra.role === "space_admin");
  const isParent = roleAssignments.some((ra) => ra.role === "parent");

  const navItems = [
    { id: "home", name: "الرئيسية", icon: Home, path: "/" },
    { id: "quests", name: "مهمات", icon: Gamepad, path: "/quests" },
    { id: "assistant", name: "حلمان", icon: BotMessageSquare, path: "/assistant" },
    { id: "discover", name: "اكتشف", icon: Compass, path: "/discover" },
    
    // Inject Developer Console
    ...(isDeveloper
      ? [{ id: "developer", name: "النظام", icon: ShieldAlert, path: "/developer" }]
      : []),
      
    // Inject School Admin Dashboard
    ...(isSchoolAdmin && !isDeveloper
      ? [{ id: "admin", name: "الإدارة", icon: Building2, path: "/admin" }]
      : []),

    // Inject Teacher/Space Admin Dashboard
    ...(isTeacherOrSpaceAdmin && !isDeveloper && !isSchoolAdmin
      ? [{ id: "teacher", name: "إشراف", icon: Presentation, path: "/teacher" }]
      : []),

    // Inject Parent Dashboard
    ...(isParent && !isDeveloper && !isSchoolAdmin && !isTeacherOrSpaceAdmin
      ? [{ id: "family", name: "الأسرة", icon: Users, path: "/family" }]
      : []),

    { id: "profile", name: "حسابي", icon: UserCircle, path: "/settings" },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="التنقل السفلي"
        dir="rtl"
        className="fixed inset-x-0 bottom-0 z-[100] border-t border-slate-200/60 bg-white/90 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl md:hidden"
      >
        {/* Replaced dynamic Grid with Flexbox */}
        <ul className="flex w-full items-center justify-between gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            // Dynamic color coding for special roles
            const activeTextColor = item.id === "developer" ? "text-rose-600" 
                                  : item.id === "admin" ? "text-blue-600"
                                  : item.id === "teacher" ? "text-emerald-600"
                                  : item.id === "family" ? "text-purple-600"
                                  : "text-orange-600";
            const activeBgColor = item.id === "developer" ? "bg-rose-100/80" 
                                : item.id === "admin" ? "bg-blue-100/80"
                                : item.id === "teacher" ? "bg-emerald-100/80"
                                : item.id === "family" ? "bg-purple-100/80"
                                : "bg-orange-100/80";

            return (
              // Added flex-1 and min-w-0 to ensure items share space evenly and don't overflow
              <li key={`mobile-${item.id}`} className="relative h-full flex-1 min-w-0">
                <Link
                  href={item.path}
                  aria-label={item.name}
                  className={`relative flex min-h-[56px] w-full flex-col items-center justify-center rounded-2xl px-1 py-1 transition-colors duration-300 active:scale-95 ${
                    isActive ? activeTextColor : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-active-nav-pill"
                      className={`absolute inset-0 rounded-2xl ${activeBgColor}`}
                      transition={{ type: "spring", stiffness: 400, damping: 100 }}
                    />
                  )}
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={`transition-transform duration-300 ${isActive ? "-translate-y-0.5" : ""}`}
                    />
                    <span className={`mt-1 text-[10px] sm:text-[11px] font-black truncate max-w-full transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-80"}`}>
                      {item.name}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop Right Sidebar Navigation */}
      <nav
        aria-label="الشريط الجانبي"
        dir="rtl"
        className="fixed bottom-0 right-0 top-0 z-[100] hidden w-24 border-l border-slate-200/60 bg-white/90 py-6 shadow-xl backdrop-blur-xl md:flex"
      >
        <ul className="flex w-full flex-col items-center gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            const activeTextColor = item.id === "developer" ? "text-rose-600" 
                                  : item.id === "admin" ? "text-blue-600"
                                  : item.id === "teacher" ? "text-emerald-600"
                                  : item.id === "family" ? "text-purple-600"
                                  : "text-orange-600";
            const activeBgColor = item.id === "developer" ? "bg-rose-100/80" 
                                : item.id === "admin" ? "bg-blue-100/80"
                                : item.id === "teacher" ? "bg-emerald-100/80"
                                : item.id === "family" ? "bg-purple-100/80"
                                : "bg-orange-100/80";

            return (
              <li key={`desktop-${item.id}`} className="relative w-full px-3">
                <Link
                  href={item.path}
                  aria-label={item.name}
                  className={`relative flex min-h-[76px] w-full flex-col items-center justify-center rounded-2xl px-1 py-2 text-center transition-colors duration-300 active:scale-95 ${
                    isActive ? activeTextColor : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="desktop-active-nav-pill"
                      className={`absolute inset-0 rounded-2xl ${activeBgColor}`}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <Icon
                      size={24}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={`transition-transform duration-300 ${isActive ? "-translate-y-0.5" : ""}`}
                    />
                    <span className="mt-1.5 text-[11px] font-black leading-4">
                      {item.name}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}