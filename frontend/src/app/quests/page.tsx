'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Lock, Star, Play, Compass, 
  Laptop, FlaskConical, Wrench, Mic2, Leaf, Library, Trophy
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ==========================================
// TYPES & DATABASE
// ==========================================
interface Mission {
  id: number;
  title: string;
  description: string;
  xpReward: number;
  difficulty: 'سهل' | 'متوسط' | 'صعب';
  categoryId: string; // Matches the 6 spaces + 'global'
  color: string;
  isLocked?: boolean; 
}

const difficultyColors = {
  'سهل': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'متوسط': 'bg-amber-100 text-amber-700 border-amber-200',
  'صعب': 'bg-rose-100 text-rose-700 border-rose-200',
};

// Comprehensive mission list spanning all new spaces
const missionsDatabase: Mission[] = [
  // 1. CS Lab
  {
    id: 1,
    title: 'أول سطر كود',
    description: 'اكتب برنامجاً بسيطاً يطبع "مرحباً بالعالم" وتعرف على أساسيات لغة البرمجة.',
    xpReward: 50,
    difficulty: 'سهل',
    categoryId: 'cs-lab',
    color: 'from-indigo-400 to-indigo-600',
  },
  {
    id: 2,
    title: 'صائد الأخطاء (مكتشف البقز)',
    description: 'ابحث عن الخطأ المخفي في خوارزمية اللعبة وقم بإصلاحه لتعمل بشكل صحيح.',
    xpReward: 80,
    difficulty: 'متوسط',
    categoryId: 'cs-lab',
    color: 'from-indigo-500 to-blue-600',
  },
  // 2. Robotics
  {
    id: 3,
    title: 'مهندس الدوائر',
    description: 'قم بتوصيل بطارية، أسلاك، ومصباح LED لإنشاء دائرة كهربائية مغلقة ومضيئة.',
    xpReward: 60,
    difficulty: 'سهل',
    categoryId: 'robotics',
    color: 'from-blue-400 to-blue-600',
  },
  // 3. Chem-Bio
  {
    id: 4,
    title: 'عالم الجينات الصغير',
    description: 'قم بإجراء تجربة استخراج الحمض النووي (DNA) من حبة فراولة في المنزل.',
    xpReward: 90,
    difficulty: 'صعب',
    categoryId: 'chem-bio',
    color: 'from-purple-400 to-purple-600',
  },
  // 4. Podcast
  {
    id: 5,
    title: 'الصوت الذهبي',
    description: 'سجّل مقدمة بودكاست مدتها دقيقة واحدة بصوت واضح وبدون تردد.',
    xpReward: 50,
    difficulty: 'سهل',
    categoryId: 'podcast',
    color: 'from-pink-400 to-pink-600',
  },
  // 5. Greenhouse
  {
    id: 6,
    title: 'نظام الري الذكي',
    description: 'اصنع نظام ري ذاتي باستخدام زجاجة بلاستيكية وخيط قطني لإنقاذ نبتتك.',
    xpReward: 75,
    difficulty: 'متوسط',
    categoryId: 'greenhouse',
    color: 'from-emerald-400 to-emerald-600',
  },
  // 6. Library
  {
    id: 7,
    title: 'أمين المكتبة الرقمي',
    description: 'أنشئ جدولاً إلكترونياً (Spreadsheet) لتنظيم وتصنيف 10 من كتبك المفضلة.',
    xpReward: 60,
    difficulty: 'متوسط',
    categoryId: 'library',
    color: 'from-amber-400 to-amber-600',
  },
  // Global
  {
    id: 8,
    title: 'المستكشف الفضولي',
    description: 'قم بزيارة 3 مساحات مختلفة في خريطة الحرم المدرسي واقرأ عن المهن فيها.',
    xpReward: 40,
    difficulty: 'سهل',
    categoryId: 'global',
    color: 'from-sky-400 to-cyan-500',
  },
  {
    id: 9,
    title: 'صديق حلمان',
    description: 'اسأل حلمان أفندي سؤالاً علمياً في قسم المساعدة واستفد من إجابته.',
    xpReward: 30,
    difficulty: 'سهل',
    categoryId: 'global',
    color: 'from-orange-400 to-rose-400',
  },
];

export default function QuestsPage() {
  const { profile } = useAuth();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked'>('unlocked');

  // MOCK STATE: Pretend the user is assigned to the "CS Lab"
  // In production, this maps to profile data (e.g., profile.current_space)
  const userWorkspace = {
    id: 'cs-lab',
    name: 'مختبر الحاسوب',
    icon: Laptop,
    colorClass: 'from-indigo-500 to-sky-500',
    borderColor: 'border-indigo-400'
  };

  // Compute missions based on locks and filters
  const displayedMissions = useMemo(() => {
    return missionsDatabase.map(mission => {
      // A mission is unlocked if it's Global OR belongs to the user's specific workspace
      const isUnlocked = mission.categoryId === 'global' || mission.categoryId === userWorkspace.id;
      return { ...mission, isLocked: !isUnlocked };
    }).filter(mission => {
      if (activeTab === 'unlocked') return !mission.isLocked;
      return true; // 'all' tab shows everything
    });
  }, [activeTab, userWorkspace.id]);

  return (
    // Mobile First: min-h-[100dvh] and pb-24 for safe BottomNav clearance
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-slate-50/50 p-4 pb-24 md:p-6 md:pb-6" dir="rtl">
      
      {/* Header Area */}
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="flex items-center gap-3 text-2xl font-black text-slate-800 md:text-3xl">
          <div className="rounded-xl border border-yellow-200 bg-yellow-100 p-2 shadow-sm">
            <Zap className="h-6 w-6 fill-yellow-500 text-yellow-500" />
          </div>
          سجل المهمات
        </h1>
        <p className="text-sm font-medium text-slate-500">
          أكمل المهام اليومية لكسب نقاط الخبرة والارتقاء بمستواك! 🚀
        </p>
      </div>

      {/* Current Workspace Banner */}
      <motion.div 
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`relative mb-6 overflow-hidden rounded-3xl border ${userWorkspace.borderColor} bg-gradient-to-r ${userWorkspace.colorClass} p-5 text-white shadow-lg`}
      >
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="mb-1 flex items-center gap-2 text-lg font-black">
              <Compass className="h-5 w-5" />
              مساحتك الحالية: {userWorkspace.name}
            </h2>
            <p className="text-sm font-medium opacity-90">
              تم فتح مهام حصرية بناءً على تخصصك المختار! 💻
            </p>
          </div>
          <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm sm:flex">
            <userWorkspace.icon className="h-6 w-6 text-white" />
          </div>
        </div>
        {/* Background Decor */}
        <div className="pointer-events-none absolute -bottom-6 -left-4 -rotate-12 transform opacity-20">
          <Trophy className="h-32 w-32 fill-white" />
        </div>
      </motion.div>

      {/* Interactive Tabs */}
      <div className="mb-6 flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('unlocked')}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
            activeTab === 'unlocked'
              ? 'bg-orange-100 text-orange-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          متاحة لي ({displayedMissions.filter(m => !m.isLocked && activeTab === 'unlocked').length || 4})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-orange-100 text-orange-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          كل المهام
        </button>
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {displayedMissions.map((mission) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={mission.id}
              className={`flex flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-300 ${
                mission.isLocked 
                  ? 'border-slate-200 opacity-70 grayscale-[0.3]' 
                  : 'border-slate-100 hover:-translate-y-1 hover:shadow-md'
              }`}
            >
              {/* Card Header (Gradient) */}
              <div className={`relative p-5 text-white bg-gradient-to-r ${mission.color}`}>
                {mission.isLocked && (
                  <div className="absolute left-4 top-4 rounded-xl bg-black/20 p-2 backdrop-blur-md shadow-sm">
                    <Lock className="h-4 w-4" />
                  </div>
                )}
                {!mission.isLocked && (
                  <div className="absolute left-4 top-4 rounded-xl bg-white/20 p-2 backdrop-blur-md shadow-sm">
                    <Zap className="h-4 w-4" />
                  </div>
                )}
                <h3 className="mb-3 text-lg font-black pr-1">{mission.title}</h3>
                <div className="flex items-center gap-2">
                  <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-black ${difficultyColors[mission.difficulty]} ${mission.isLocked ? 'bg-white/20 text-white border-white/30' : ''}`}>
                    {mission.difficulty}
                  </span>
                  {mission.categoryId === 'global' && (
                    <span className="rounded-lg border border-white/30 bg-white/20 px-2.5 py-1 text-[11px] font-black text-white backdrop-blur-sm">
                      مهمة عامة
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col p-5">
                <p className="mb-5 flex-1 text-sm font-medium leading-relaxed text-slate-600">
                  {mission.description}
                </p>

                <div className="mb-5 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <span className="text-xs font-bold text-slate-500">المكافأة المتوقعة:</span>
                  <div className="flex items-center gap-1.5 text-sm font-black text-yellow-500">
                    <Star className="h-4 w-4 fill-yellow-400" />
                    <span>+{mission.xpReward} نقطة</span>
                  </div>
                </div>

                <button
                  disabled={mission.isLocked}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition-all ${
                    mission.isLocked
                      ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                      : `bg-gradient-to-r text-white shadow-md active:scale-95 ${mission.color}`
                  }`}
                >
                  {mission.isLocked ? (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>مغلقة (اختر هذه المساحة لتفعيلها)</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-white" />
                      <span>ابدأ المهمة الآن</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
    </div>
  );
}