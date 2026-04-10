"use client";

import { API_BASE_URL } from '@/lib/api';
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Lock,
  Sparkles,
  Cpu,
  Laptop,
  FlaskConical,
  Mic2,
  Leaf,
  Library,
  TreePine,
  TreeDeciduous,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useRef, useEffect } from "react";
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
  color: string;
  bgColor: string;
}

// 1. Define the 6 spaces with their coordinates
const campusSpaces: CampusSpace[] = [
  {
    id: "library",
    title: "المكتبة",
    subtitle: "مصادر البحث والقراءة",
    path: "${API_BASE_URL}/spaces/library",
    description: "مساحة هادئة للبحث، قراءة الكتب، وبناء قاعدة معرفية صلبة.",
    quests: ["استعارة كتاب رقمي", "تلخيص مقال علمي"],
    suggestions: ["اقرأ عن تاريخ الحواسيب", "نظم جدول دراستك"],
    futures: ["باحث", "أمين مكتبة بيانات"],
    icon: Library,
    status: "available",
    marker: { x: 15, y: 30 },
    color: "text-amber-500",
    bgColor: "bg-amber-100",
  },
  {
    id: "podcast",
    title: "استوديو البودكاست",
    subtitle: "إعلام وتواصل",
    path: "${API_BASE_URL}/spaces/podcast",
    description: "مكان لتسجيل أفكارك، إجراء المقابلات، وتطوير مهارات الإلقاء.",
    quests: ["تسجيل مقدمة دقيقة", "إجراء مقابلة قصيرة"],
    suggestions: ["تدرب على نبرة الصوت", "اكتب سيناريو لحلقة"],
    futures: ["إعلامي", "صانع محتوى"],
    icon: Mic2,
    status: "available",
    marker: { x: 25, y: 70 },
    color: "text-pink-500",
    bgColor: "bg-pink-100",
  },
  {
    id: "cs-lab",
    title: "مختبر الحاسوب",
    subtitle: "برمجة وتطوير",
    path: "${API_BASE_URL}/spaces/cs-lab",
    description: "اكتب أول أسطر الكود الخاص بك وتعرف على عالم الخوارزميات.",
    quests: ["طباعة Hello World", "حل لغز برمجي"],
    suggestions: ["جرب لغة بايثون", "صمم موقعاً بسيطاً"],
    futures: ["مهندس برمجيات", "مطور ويب"],
    icon: Laptop,
    status: "completed",
    marker: { x: 45, y: 20 },
    color: "text-indigo-500",
    bgColor: "bg-indigo-100",
  },
  {
    id: "chem-bio",
    title: "مختبر الكيمياء والأحياء",
    subtitle: "تجارب واكتشافات",
    path: "${API_BASE_URL}/spaces/chem-bio",
    description: "اكتشف أسرار الخلايا والتفاعلات الكيميائية من خلال تجارب آمنة.",
    quests: ["تجربة البركان الكيميائي", "فحص خلايا نباتية"],
    suggestions: ["سجل ملاحظات التجربة", "ارتدِ نظارة الحماية"],
    futures: ["عالم كيمياء", "طبيب"],
    icon: FlaskConical,
    status: "available",
    marker: { x: 55, y: 60 },
    color: "text-purple-500",
    bgColor: "bg-purple-100",
  },
  {
    id: "robotics",
    title: "ورشة الروبوتات",
    subtitle: "هندسة وميكانيكا",
    path: "${API_BASE_URL}/spaces/robotics",
    description: "ركّب أجزاء الروبوت وبرمجه ليقوم بمهام محددة في الحلبة.",
    quests: ["تحريك الروبوت للأمام", "استخدام حساس المسافة"],
    suggestions: ["تأكد من توصيل البطارية", "اختبر الروبوت ببطء"],
    futures: ["مهندس ميكاترونكس", "مطور روبوتات"],
    icon: Cpu,
    status: "locked",
    marker: { x: 80, y: 35 },
    color: "text-blue-500",
    bgColor: "bg-blue-100",
  },
  {
    id: "greenhouse",
    title: "البيت الأخضر",
    subtitle: "زراعة وبيئة",
    path: "${API_BASE_URL}/spaces/greenhouse",
    description: "تعلم كيف تزرع النباتات وتعتني بالبيئة من حولك.",
    quests: ["زراعة بذرة", "مراقبة نمو النبتة"],
    suggestions: ["اسقِ النباتات بانتظام", "وفر ضوء الشمس المناسب"],
    futures: ["مهندس زراعي", "عالم بيئة"],
    icon: Leaf,
    status: "available",
    marker: { x: 85, y: 75 },
    color: "text-emerald-500",
    bgColor: "bg-emerald-100",
  },
];

// 2. Paths to connect buildings
const paths = [
  { from: { x: 15, y: 30 }, to: { x: 45, y: 20 } },
  { from: { x: 15, y: 30 }, to: { x: 25, y: 70 } },
  { from: { x: 45, y: 20 }, to: { x: 55, y: 60 } },
  { from: { x: 45, y: 20 }, to: { x: 80, y: 35 } },
  { from: { x: 25, y: 70 }, to: { x: 55, y: 60 } },
  { from: { x: 55, y: 60 }, to: { x: 85, y: 75 } },
  { from: { x: 80, y: 35 }, to: { x: 85, y: 75 } },
];

// 3. Map Decorations
const decorations = [
  { x: 10, y: 10, type: TreePine, size: 40 },
  { x: 30, y: 15, type: TreeDeciduous, size: 30 },
  { x: 10, y: 80, type: TreePine, size: 45 },
  { x: 40, y: 85, type: TreeDeciduous, size: 35 },
  { x: 65, y: 25, type: TreePine, size: 50 },
  { x: 90, y: 15, type: TreeDeciduous, size: 40 },
  { x: 70, y: 85, type: TreePine, size: 35 },
];

const CampusDashboardPage = () => {
  const { profile } = useAuth();
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(campusSpaces[0].id);
  
  // Ref for the map container to enable auto-centering
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const selectedSpace = useMemo(
    () => campusSpaces.find((space) => space.id === selectedSpaceId) ?? campusSpaces[0],
    [selectedSpaceId],
  );

  const displayName = profile?.display_name ?? "مستكشف جديد";
  const currentLevel = profile?.current_level ?? 1;
  const totalXp = profile?.total_xp ?? 0;
  const progressPercent = Math.max(0, Math.min(100, totalXp % 100));

  // Auto-center the map on mobile devices on first load
  useEffect(() => {
    if (mapContainerRef.current) {
      const container = mapContainerRef.current;
      // Scroll to the middle of the X and Y axes
      container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
      container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
    }
  }, []);

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-emerald-50/50 pb-24 md:pb-6" dir="rtl">
      
      {/* Background Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

      <div className="relative z-20 mx-auto flex h-full w-full max-w-[1600px] flex-1 flex-col gap-3 p-3 md:flex-row md:gap-4 md:p-4">
        
        {/* Compact Mobile Header */}
        <motion.header
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex shrink-0 flex-col rounded-3xl border border-white/70 bg-white/90 p-3 shadow-lg backdrop-blur-md md:w-72"
        >
          <div className="flex items-center justify-between gap-3 md:flex-col md:items-start md:justify-start">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-400 to-pink-500 text-xl font-black text-white shadow-sm">
                {displayName[0] ?? "أ"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-800">{displayName}</p>
                <p className="text-xs font-bold text-slate-500">مستكشف الحرم</p>
              </div>
            </div>
            
            {/* Mobile inline level indicator, Desktop stacked level indicator */}
            <div className="flex flex-col md:mt-4 md:w-full md:rounded-2xl md:border md:border-slate-100 md:bg-slate-50 md:p-3">
              <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-700 md:mb-2">
                <span>المستوى {currentLevel}</span>
                <span className="hidden text-orange-500 md:inline">{progressPercent}%</span>
              </div>
              <div className="hidden h-2.5 w-full overflow-hidden rounded-full bg-slate-200 md:block">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-orange-400 to-yellow-400 transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </motion.header>

        {/* Omnidirectional Panning Map Section */}
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex-1 overflow-hidden rounded-3xl border-2 border-white/60 bg-gradient-to-br from-emerald-100/40 to-sky-50/40 shadow-xl backdrop-blur-sm"
          aria-label="خريطة الحرم المدرسي التفاعلية"
        >
          {/* Scrollable Map Container (Both X and Y) */}
          <div 
            ref={mapContainerRef}
            className="hide-scrollbar relative h-full w-full overflow-auto scroll-smooth"
          >
            {/* The Actual Canvas Size (Forces scrolling on small screens) */}
            <div className="relative h-full min-h-[600px] min-w-[900px] w-full">
              
              {/* SVG Paths */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full">
                {paths.map((path, idx) => (
                  <line
                    key={idx}
                    x1={`${path.from.x}%`}
                    y1={`${path.from.y}%`}
                    x2={`${path.to.x}%`}
                    y2={`${path.to.y}%`}
                    stroke="#94a3b8"
                    strokeWidth="3"
                    strokeDasharray="8 8"
                    className="opacity-50"
                  />
                ))}
              </svg>

              {/* Decorations (Trees) */}
              {decorations.map((dec, idx) => {
                const Tree = dec.type;
                return (
                  <div
                    key={`dec-${idx}`}
                    className="pointer-events-none absolute text-emerald-600/20"
                    style={{ left: `${dec.x}%`, top: `${dec.y}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <Tree size={dec.size} />
                  </div>
                );
              })}

              {/* Map Nodes (Buildings) */}
              {campusSpaces.map((space) => {
                const Icon = space.icon;
                const isSelected = selectedSpace.id === space.id;
                
                const statusBadge = space.status === "completed" ? (
                  <div className="absolute -right-2 -top-2 rounded-full border-2 border-white bg-emerald-500 p-1 text-white shadow-sm">
                    <CheckCircle2 size={12} strokeWidth={3} />
                  </div>
                ) : space.status === "locked" ? (
                  <div className="absolute -right-2 -top-2 rounded-full border-2 border-white bg-slate-400 p-1 text-white shadow-sm">
                    <Lock size={12} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="absolute -right-2 -top-2 rounded-full border-2 border-white bg-sky-500 p-1 text-white shadow-sm">
                    <Sparkles size={12} strokeWidth={3} />
                  </div>
                );

                return (
                  <div
                    key={space.id}
                    className="absolute z-10 flex flex-col items-center"
                    style={{ left: `${space.marker.x}%`, top: `${space.marker.y}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <button
                      onClick={() => setSelectedSpaceId(space.id)}
                      className={`group relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
                        isSelected 
                          ? `bg-white ring-4 ring-orange-400 ring-offset-2 ring-offset-white` 
                          : `border-2 border-slate-100 bg-white hover:border-slate-300`
                      }`}
                    >
                      {statusBadge}
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${space.bgColor} ${space.color}`}>
                        <Icon size={24} />
                      </div>
                    </button>
                    
                    {/* Node Label */}
                    <div className={`mt-2 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-black shadow-sm transition-all ${
                      isSelected ? 'scale-110 bg-orange-500 text-white' : 'border border-slate-100 bg-white text-slate-700'
                    }`}>
                      {space.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* Desktop Sidebar Details */}
        <aside className="hidden w-full shrink-0 flex-col gap-3 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur-md md:flex md:w-80">
          <div className="mb-2">
            <div className="mb-2 flex items-center gap-2">
              <div className={`rounded-xl p-2 ${selectedSpace.bgColor} ${selectedSpace.color}`}>
                <selectedSpace.icon size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-800">{selectedSpace.title}</h2>
            </div>
            <p className="text-sm font-bold leading-6 text-slate-500">{selectedSpace.description}</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-black text-slate-700">المهمات المتاحة</p>
            <ul className="space-y-1.5 text-sm font-bold text-slate-600">
              {selectedSpace.quests.map((quest) => (
                <li key={quest} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> {quest}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3">
            <p className="mb-2 text-xs font-black text-sky-800">اقتراحات اليوم</p>
            <ul className="space-y-1.5 text-sm font-bold text-sky-700">
              {selectedSpace.suggestions.map((tip) => (
                <li key={tip} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" /> {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
            <p className="mb-2 text-xs font-black text-emerald-800">مسارات مستقبلية</p>
            <ul className="space-y-1.5 text-sm font-bold text-emerald-700">
              {selectedSpace.futures.map((future) => (
                <li key={future} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {future}
                </li>
              ))}
            </ul>
          </div>

          <Link
            href={selectedSpace.path}
            className="mt-auto flex items-center justify-center rounded-2xl bg-slate-900 py-3.5 text-sm font-black text-white shadow-md transition hover:bg-slate-800 active:scale-95"
          >
            دخول المساحة
          </Link>
        </aside>
      </div>

      {/* Mobile Bottom Details Card - Pushed up to bottom-24 to safely clear Bottom Navigation */}
      <div className="pointer-events-none fixed bottom-24 left-3 right-3 z-30 md:hidden">
        <div className="rounded-3xl border border-white/70 bg-white/95 p-4 shadow-2xl backdrop-blur-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${selectedSpace.bgColor} ${selectedSpace.color}`}>
                <selectedSpace.icon size={24} />
              </div>
              <div>
                <p className="mb-0.5 text-xs font-black text-orange-500">الوجهة المحددة</p>
                <p className="text-base font-black text-slate-800">{selectedSpace.title}</p>
              </div>
            </div>
            <Link
              href={selectedSpace.path}
              className="pointer-events-auto flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-black text-white shadow-md transition active:scale-95"
            >
              دخول
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default CampusDashboardPage;