// src/app/quests/page.tsx
'use client';

import { Zap, Lock, Star, Play, Compass } from 'lucide-react';
import { useState } from 'react';

// Types
interface Mission {
  id: number;
  title: string;
  description: string;
  xpReward: number;
  difficulty: 'سهل' | 'متوسط' | 'صعب';
  category: string;
  isLocked: boolean;
  color: string;
}

export default function QuestsPage() {
  // MOCK STATE: We pretend the user took the assessment and got "Investigative" (Science Lab)
  // When we connect Supabase, this will be fetched dynamically from their profile.
  const [mockWorkspace] = useState({
    name: 'مختبر العلوم',
    code: 'I'
  });

  const difficultyColors = {
    'سهل': 'bg-green-100 text-green-700',
    'متوسط': 'bg-yellow-100 text-yellow-700',
    'صعب': 'bg-rose-100 text-rose-700',
  };

  // Mission Data (Adapted from the project dump)
  const missions: Mission[] = [
    {
      id: 1,
      title: 'بناء الدوائر',
      description: 'تعلم بناء دوائر بسيطة وإضاءة مصابيح LED!',
      xpReward: 50,
      difficulty: 'سهل',
      category: 'R',
      isLocked: mockWorkspace.code !== 'R',
      color: 'from-emerald-400 to-emerald-600',
    },
    {
      id: 2,
      title: 'مستكشف العلوم',
      description: 'قم بإجراء تجارب ممتعة وتعلم عن التفاعلات الكيميائية!',
      xpReward: 75,
      difficulty: 'متوسط',
      category: 'I',
      isLocked: mockWorkspace.code !== 'I', // Unlocked for our mock user!
      color: 'from-blue-400 to-blue-600',
    },
    {
      id: 3,
      title: 'فنان رقمي',
      description: 'أنشئ أعمالاً فنية رقمية ورسوماً متحركة رائعة!',
      xpReward: 60,
      difficulty: 'سهل',
      category: 'A',
      isLocked: mockWorkspace.code !== 'A',
      color: 'from-purple-400 to-purple-600',
    },
    {
      id: 4,
      title: 'قائد الفريق',
      description: 'نظم نشاطاً جماعياً وقد فريقك في تحدي اليوم!',
      xpReward: 80,
      difficulty: 'صعب',
      category: 'S',
      isLocked: mockWorkspace.code !== 'S',
      color: 'from-rose-400 to-rose-600',
    },
    {
      id: 5,
      title: 'رائد أعمال صغير',
      description: 'أنشئ خطة عمل لبيع عصير الليمون في الحي!',
      xpReward: 90,
      difficulty: 'صعب',
      category: 'E',
      isLocked: mockWorkspace.code !== 'E',
      color: 'from-orange-400 to-orange-600',
    },
    {
      id: 6,
      title: 'منظم محترف',
      description: 'صمم نظاماً رقمياً لتنظيم مكتبة صفك الدراسي!',
      xpReward: 70,
      difficulty: 'متوسط',
      category: 'C',
      isLocked: mockWorkspace.code !== 'C',
      color: 'from-slate-500 to-slate-700',
    },
    // Global Missions (Always unlocked)
    {
      id: 7,
      title: 'راوي القصص المتميز',
      description: 'اكتب وارسم قصتك القصيرة الخاصة وشاركها مع زملائك!',
      xpReward: 50,
      difficulty: 'سهل',
      category: 'Global',
      isLocked: false,
      color: 'from-pink-400 to-pink-600',
    },
    {
      id: 8,
      title: 'ساحر الرياضيات',
      description: 'حل الألغاز الصعبة والأحاجي الذهنية في وقت قياسي!',
      xpReward: 60,
      difficulty: 'متوسط',
      category: 'Global',
      isLocked: false,
      color: 'from-sky-400 to-sky-600',
    },
  ];

  return (
    <div className="p-4 md:p-6 w-full h-full flex flex-col">
      
      {/* Header Area */}
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
          <div className="bg-yellow-100 p-2 rounded-xl border border-yellow-200 shadow-sm">
            <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          </div>
          سجل المهمات
        </h1>
        <p className="text-slate-500 font-medium text-sm">أكمل المهام لكسب النقاط والارتقاء بمستواك! 🚀</p>
      </div>

      {/* Current Workspace Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-sky-500 rounded-2xl p-5 text-white mb-6 shadow-lg border border-blue-400 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-lg font-black mb-1 flex items-center gap-2">
            <Compass className="w-5 h-5" />
            مساحتك الحالية: {mockWorkspace.name}
          </h2>
          <p className="text-sm font-medium opacity-90">تم فتح مهام خاصة بناءً على مهاراتك الاستقصائية! 🔬</p>
        </div>
        {/* Background Decor */}
        <div className="absolute -left-4 -bottom-4 opacity-20 transform -rotate-12 pointer-events-none">
          <Zap className="w-32 h-32 fill-white" />
        </div>
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col transition-all duration-300 ${
              mission.isLocked 
                ? 'opacity-60 border-slate-200 grayscale-[0.2]' 
                : 'border-slate-100 hover:shadow-md hover:-translate-y-1'
            }`}
          >
            {/* Card Header (Gradient) */}
            <div className={`bg-gradient-to-r ${mission.color} p-4 text-white relative`}>
              {mission.isLocked && (
                <div className="absolute top-4 left-4 bg-black/20 p-1.5 rounded-lg backdrop-blur-sm">
                  <Lock className="w-4 h-4" />
                </div>
              )}
              <h3 className="text-lg font-black mb-2 pl-8">{mission.title}</h3>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black ${difficultyColors[mission.difficulty]}`}>
                  {mission.difficulty}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 flex-1 flex flex-col">
              <p className="text-slate-600 text-sm font-medium mb-4 flex-1 leading-relaxed">
                {mission.description}
              </p>

              <div className="flex items-center justify-between mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500">المكافأة:</span>
                <div className="flex items-center gap-1 text-yellow-500 font-black text-sm">
                  <Star className="w-4 h-4 fill-yellow-500" />
                  <span>+{mission.xpReward} نقطة</span>
                </div>
              </div>

              <button
                disabled={mission.isLocked}
                className={`w-full font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${
                  mission.isLocked
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : `bg-gradient-to-r ${mission.color} text-white shadow-md active:scale-95`
                }`}
              >
                {mission.isLocked ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>مغلق مؤقتاً</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>ابدأ المهمة</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}