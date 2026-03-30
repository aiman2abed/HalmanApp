"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Compass,
  Leaf,
  Lock,
  Mic2,
  Microscope,
  School,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { useAuth } from "@/contexts/AuthContext";

type SpaceStatus = "available" | "completed" | "locked";

interface CampusSpace {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  description: string;
  quests: string[];
  suggestions: string[];
  futures: string[];
  icon: ComponentType<{ size?: number; className?: string }>;
  status: SpaceStatus;
  marker: { x: number; y: number };
}

const campusSpaces: CampusSpace[] = [
  {
    id: "central-school-house",
    title: "البيت المدرسي المركزي",
    subtitle: "منطقة الانطلاق اليومية",
    path: "/spaces/social",
    description: "هنا تبدأ جولتك، وتراجع إنجازاتك اليومية وتختار خطوتك التالية.",
    quests: ["مهمة ترحيب قصيرة", "تحدي تعاون جماعي"],
    suggestions: ["ابدأ بمهمة سهلة", "شارك صديقًا في نشاط اليوم"],
    futures: ["قيادة الفريق", "التوجيه المدرسي"],
    icon: School,
    status: "available",
    marker: { x: 48, y: 57 },
  },
  {
    id: "investigative-lab",
    title: "مختبر الاستكشاف الرقمي",
    subtitle: "علوم + برمجة",
    path: "/spaces/investigative",
    description: "تجارب ممتعة في التفكير العلمي والبرمجة وتعلّم حل المشكلات.",
    quests: ["تجربة علمية آمنة", "خوارزمية بسيطة"],
    suggestions: ["سجّل ملاحظاتك", "جرّب نسخة محسّنة من التجربة"],
    futures: ["عالم بيانات", "مطور برمجيات"],
    icon: Microscope,
    status: "completed",
    marker: { x: 68, y: 44 },
  },
  {
    id: "artistic-studio",
    title: "الاستوديو الفني والبودكاست",
    subtitle: "إبداع وصوت وصورة",
    path: "/spaces/artistic",
    description: "مساحة للتصميم، التسجيل الصوتي، وبناء قصص قصيرة هادفة.",
    quests: ["تسجيل مقدمة بودكاست", "تصميم ملصق تعليمي"],
    suggestions: ["اكتب فكرة الحلقة", "استخدم ألوانًا هادئة"],
    futures: ["منتج محتوى", "مصمم تجربة"],
    icon: Mic2,
    status: "available",
    marker: { x: 36, y: 40 },
  },
  {
    id: "conventional-library",
    title: "المكتبة الذكية",
    subtitle: "قراءة وتنظيم المعرفة",
    path: "/spaces/conventional",
    description: "ابحث، نظّم، واستكشف مصادر تعلم جديدة بطريقة ممتعة.",
    quests: ["استعارة كتاب", "تصنيف مصادر تعلم"],
    suggestions: ["اختر كتابًا قصيرًا", "دوّن ملخصًا سريعًا"],
    futures: ["باحث", "منسق محتوى"],
    icon: Compass,
    status: "locked",
    marker: { x: 22, y: 56 },
  },
  {
    id: "greenhouse",
    title: "البيت الأخضر الزراعي",
    subtitle: "زراعة وابتكار بيئي",
    path: "/spaces/realistic",
    description: "مشاريع زراعية صغيرة، تتبع نمو النباتات، وتجارب الاستدامة.",
    quests: ["زرع بذرة", "متابعة أسبوعية للنمو"],
    suggestions: ["التصوير اليومي للنبات", "سقي منتظم وآمن"],
    futures: ["مهندس بيئي", "متخصص زراعة"],
    icon: Leaf,
    status: "available",
    marker: { x: 68, y: 67 },
  },
];

/**
 * Home campus dashboard with interactive map and contextual space panel.
 */
const CampusDashboardPage = () => {
  const { profile } = useAuth();
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(campusSpaces[0].id);
  const [mapImageFailed, setMapImageFailed] = useState(false);

  const selectedSpace = useMemo(
    () => campusSpaces.find((space) => space.id === selectedSpaceId) ?? campusSpaces[0],
    [selectedSpaceId],
  );

  const displayName = profile?.display_name ?? "مستكشف جديد";
  const currentLevel = profile?.current_level ?? 1;
  const totalXp = profile?.total_xp ?? 0;
  const progressPercent = Math.max(0, Math.min(100, totalXp % 100));

  return (
    <div className="relative h-full w-full overflow-hidden bg-emerald-50" dir="rtl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#d9f99d_0%,#ecfeff_45%,#f8fafc_100%)]" />

      <div className="relative z-20 mx-auto flex h-full max-w-[1600px] flex-col gap-3 p-3 pb-28 md:flex-row md:gap-4 md:p-4 md:pb-4">
        <motion.header
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="rounded-2xl border border-white/70 bg-white/90 p-3 shadow-lg backdrop-blur"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-400 to-pink-500 text-xl font-black text-white">
              {displayName[0] ?? "أ"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-800">{displayName}</p>
              <p className="text-xs font-bold text-slate-500">مرشد الحرم المدرسي</p>
            </div>
          </div>
          <div className="mt-2 rounded-xl bg-slate-100 p-2">
            <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>المستوى {currentLevel}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-gradient-to-l from-orange-400 to-yellow-400"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative min-h-0 flex-1 overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-xl"
          aria-label="خريطة الحرم المدرسي"
        >
          {mapImageFailed ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-200 via-sky-100 to-amber-100">
              <p className="rounded-full bg-white/85 px-4 py-2 text-sm font-bold text-slate-700">
                سيتم إضافة لوحة الحرم قريبًا
              </p>
            </div>
          ) : (
            <Image
              src="/image_0.png"
              alt="خريطة الحرم المدرسي التفاعلية"
              fill
              priority
              className="object-cover"
              onError={() => setMapImageFailed(true)}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />

          {campusSpaces.map((space) => {
            const Icon = space.icon;
            const isSelected = selectedSpace.id === space.id;
            const statusIcon =
              space.status === "completed" ? (
                <CheckCircle2 size={14} className="text-emerald-500" />
              ) : space.status === "locked" ? (
                <Lock size={14} className="text-amber-600" />
              ) : (
                <Sparkles size={14} className="text-sky-500" />
              );

            return (
              <div
                key={space.id}
                className="absolute"
                style={{ left: `${space.marker.x}%`, top: `${space.marker.y}%` }}
              >
                <div className="-translate-x-1/2 -translate-y-1/2">
                  <button
                    type="button"
                    aria-label={`فتح تفاصيل ${space.title}`}
                    onClick={() => setSelectedSpaceId(space.id)}
                    className={`min-w-[140px] rounded-2xl border bg-white/95 px-3 py-2 text-right shadow-lg transition hover:scale-[1.02] ${
                      isSelected ? "border-orange-300 ring-2 ring-orange-200" : "border-white"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <Icon size={15} />
                      </span>
                      {statusIcon}
                    </div>
                    <p className="line-clamp-1 text-xs font-black text-slate-800">{space.title}</p>
                    <p className="line-clamp-1 text-[11px] font-bold text-slate-500">{space.subtitle}</p>
                  </button>
                </div>
              </div>
            );
          })}
        </motion.section>

        <aside className="hidden w-full max-w-sm flex-col gap-3 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur md:flex">
          <div>
            <p className="text-xs font-black text-orange-500">المساحة المختارة</p>
            <h2 className="mt-1 text-lg font-black text-slate-800">{selectedSpace.title}</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">{selectedSpace.description}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="mb-2 text-sm font-black text-slate-700">مهمات متاحة</p>
            <ul className="space-y-1 text-sm font-bold text-slate-600">
              {selectedSpace.quests.map((quest) => (
                <li key={quest}>• {quest}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-sky-50 p-3">
            <p className="mb-2 text-sm font-black text-sky-700">اقتراحات اليوم</p>
            <ul className="space-y-1 text-sm font-bold text-sky-700">
              {selectedSpace.suggestions.map((tip) => (
                <li key={tip}>• {tip}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-3">
            <p className="mb-2 text-sm font-black text-emerald-700">مسارات مستقبلية</p>
            <ul className="space-y-1 text-sm font-bold text-emerald-700">
              {selectedSpace.futures.map((future) => (
                <li key={future}>• {future}</li>
              ))}
            </ul>
          </div>

          <Link
            href={selectedSpace.path}
            className="mt-auto rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-slate-700"
          >
            دخول هذه المساحة
          </Link>
        </aside>
      </div>

      <div className="pointer-events-none absolute bottom-24 left-3 right-3 z-20 md:hidden">
        <div className="rounded-2xl border border-white/70 bg-white/95 p-3 shadow-lg backdrop-blur">
          <p className="text-xs font-black text-orange-500">التفاصيل الحالية</p>
          <p className="text-sm font-black text-slate-800">{selectedSpace.title}</p>
          <p className="line-clamp-1 text-xs font-bold text-slate-500">{selectedSpace.subtitle}</p>
          <Link
            href={selectedSpace.path}
            className="pointer-events-auto mt-2 inline-block rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white"
          >
            متابعة
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CampusDashboardPage;
