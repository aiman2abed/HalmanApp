"use client";

import { motion } from "framer-motion";
import {
  Beaker,
  Briefcase,
  Building,
  Palette,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import { useAuth } from "@/contexts/AuthContext";

type RiasecKey =
  | "realistic"
  | "investigative"
  | "artistic"
  | "social"
  | "enterprising"
  | "conventional";

interface MapBuildingLayout {
  id: RiasecKey;
  top: string;
  left: string;
  center?: boolean;
}

interface RiasecMapItem {
  name: string;
  desc: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  color: string;
  path: string;
}

const riasecData: Record<RiasecKey, RiasecMapItem> = {
  realistic: {
    name: "عملي",
    desc: "ورشة الروبوتات",
    icon: Wrench,
    color: "from-emerald-400 to-emerald-600",
    path: "/spaces/realistic",
  },
  investigative: {
    name: "مفكر",
    desc: "مختبر العلوم",
    icon: Beaker,
    color: "from-blue-400 to-blue-600",
    path: "/spaces/investigative",
  },
  artistic: {
    name: "فني",
    desc: "استوديو الإبداع",
    icon: Palette,
    color: "from-purple-400 to-purple-600",
    path: "/spaces/artistic",
  },
  social: {
    name: "اجتماعي",
    desc: "المركز المجتمعي",
    icon: Users,
    color: "from-rose-400 to-rose-600",
    path: "/spaces/social",
  },
  enterprising: {
    name: "مبادر",
    desc: "مقر الابتكار",
    icon: Briefcase,
    color: "from-orange-400 to-orange-600",
    path: "/spaces/enterprising",
  },
  conventional: {
    name: "منظم",
    desc: "المكتبة الذكية",
    icon: Building,
    color: "from-slate-500 to-slate-700",
    path: "/spaces/conventional",
  },
};

const mapAssetLayouts: MapBuildingLayout[] = [
  { id: "realistic", top: "25%", left: "15%" },
  { id: "conventional", top: "15%", left: "50%", center: true },
  { id: "investigative", top: "35%", left: "80%" },
  { id: "social", top: "65%", left: "20%" },
  { id: "enterprising", top: "75%", left: "75%" },
  { id: "artistic", top: "80%", left: "45%", center: true },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

function getProgressPercent(totalXp: number) {
  return Math.max(0, Math.min(100, totalXp % 100));
}

/**
 * Main campus dashboard for HalmanApp.
 * Renders the interactive RIASEC world map and authenticated student progress.
 */
export default function CampusDashboard() {
  const { profile } = useAuth();

  const displayName = profile?.display_name ?? "مستكشف جديد";
  const currentLevel = profile?.current_level ?? 1;
  const currentProgress = getProgressPercent(profile?.total_xp ?? 0);

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-b-3xl bg-emerald-50 shadow-inner md:rounded-3xl"
      dir="rtl"
    >
      {/* منطق واجهة المستخدم: زخارف خفيفة لخلفية الحرم */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-30">
        <div className="absolute left-[20%] top-[20%] h-[60%] w-[60%] rounded-[120px] border-[60px] border-emerald-200" />
        <div className="absolute left-[-10%] top-[50%] h-[60px] w-[120%] rotate-12 bg-emerald-200" />
      </div>

      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-20 mx-4 mt-6 w-full max-w-2xl rounded-2xl border border-white bg-white/90 p-4 shadow-xl backdrop-blur-xl md:mx-auto md:mx-12"
      >
        <div className="absolute -top-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-800 px-6 py-1.5 shadow-lg">
          <Sparkles size={14} className="text-orange-400" />
          <span className="text-sm font-black tracking-wide text-white">
            الحرم المدرسي
          </span>
          <Sparkles size={14} className="text-orange-400" />
        </div>

        <div className="mt-3 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-gradient-to-tr from-sky-400 to-blue-500 shadow-md">
            <span className="text-2xl font-black text-white">
              {displayName[0]?.toUpperCase() ?? "أ"}
            </span>
          </div>

          <div className="flex-1">
            <h3 className="text-base font-black text-slate-800">
              {displayName}
            </h3>
            <div className="relative mt-1.5 h-4 w-full overflow-hidden rounded-full bg-slate-200 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-l from-orange-400 to-yellow-400"
                style={{ width: `${currentProgress}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-800 drop-shadow-sm">
                مستوى {currentLevel} - {currentProgress}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mt-4 flex-1 overflow-hidden"
      >
        {mapAssetLayouts.map((layout) => {
          const trait = riasecData[layout.id];
          const Icon = trait.icon;

          return (
            <Link key={layout.id} href={trait.path}>
              <motion.div
                variants={item}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className={`absolute z-10 flex h-32 w-32 cursor-pointer flex-col items-center justify-end md:h-40 md:w-40 ${layout.center ? "-translate-x-1/2" : ""}`}
                style={{ top: layout.top, left: layout.left }}
              >
                <div className="z-20 flex items-center gap-1.5 rounded-full border border-slate-100 bg-white/95 px-4 py-1.5 shadow-lg backdrop-blur-sm transition-all hover:-translate-y-1">
                  <Icon size={14} className="text-orange-500" />
                  <span className="whitespace-nowrap text-xs font-black text-slate-700 md:text-sm">
                    {trait.desc}
                  </span>
                </div>

                <div
                  className={`relative mt-2 flex h-20 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white/50 bg-gradient-to-br ${trait.color} shadow-2xl md:h-28 md:w-32`}
                >
                  <div className="absolute bottom-0 h-1/2 w-full bg-black/10 backdrop-blur-sm" />
                  <Icon size={36} className="z-10 text-white drop-shadow-md" />
                </div>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}
