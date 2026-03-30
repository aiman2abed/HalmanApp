// src/app/spaces/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ChevronRight, Wrench, Beaker, Palette, Users, Briefcase, Building, 
  Gamepad2, Lightbulb, GraduationCap, ArrowLeft, Hammer
} from 'lucide-react';

// The Database of Spaces
const spaceData: Record<string, any> = {
  realistic: { 
    id: 'realistic', name: 'ورشة الروبوتات', icon: Wrench, color: 'from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-200',
    description: 'المكان المفضل للممارسين وصناع الأشياء! هنا نحول الأفكار إلى آلات تتحرك.',
    careers: ['مهندس ميكانيكي', 'مطور روبوتات', 'فني إلكترونيات'],
    projects: ['بناء ذراع آلية هيدروليكية', 'تصليح الألعاب الإلكترونية المعطلة']
  },
  investigative: { 
    id: 'investigative', name: 'مختبر العلوم', icon: Beaker, color: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-200',
    description: 'ملاذ المفكرين والباحثين. هنا نطرح الأسئلة الصعبة ونبحث عن الإجابات عبر التجارب.',
    careers: ['عالم كيمياء', 'باحث بيانات', 'طبيب'],
    projects: ['تجربة تنقية المياه', 'برمجة خوارزمية ذكاء اصطناعي بسيطة']
  },
  artistic: { 
    id: 'artistic', name: 'استوديو الإبداع', icon: Palette, color: 'from-purple-400 to-purple-600', shadow: 'shadow-purple-200',
    description: 'مساحة المبدعين والفنانين. لا حدود للخيال هنا، من الرسم إلى تأليف الموسيقى والبودكاست.',
    careers: ['مصمم جرافيك', 'مخرج أفلام', 'كاتب سيناريو'],
    projects: ['تسجيل حلقة بودكاست مدرسية', 'تصميم شخصية لعبة فيديو']
  },
  social: { 
    id: 'social', name: 'المركز المجتمعي', icon: Users, color: 'from-rose-400 to-rose-600', shadow: 'shadow-rose-200',
    description: 'قلب المدرسة النابض. مكان يجمع الأشخاص الذين يحبون مساعدة الآخرين وصنع تأثير إيجابي.',
    careers: ['أخصائي نفسي', 'معلم', 'مستشار توجيه'],
    projects: ['تنظيم حملة تنظيف المدرسة', 'إنشاء نادي لدعم الطلاب الجدد']
  },
  enterprising: { 
    id: 'enterprising', name: 'مقر الابتكار', icon: Briefcase, color: 'from-orange-400 to-orange-600', shadow: 'shadow-orange-200',
    description: 'موطن القادة والمبادرين. هنا نتعلم كيف ندير المشاريع ونقنع الآخرين بأفكارنا.',
    careers: ['رائد أعمال', 'مدير مشاريع', 'محامي'],
    projects: ['تأسيس شركة صغيرة لبيع الأعمال اليدوية', 'إدارة حملة لانتخابات المدرسة']
  },
  conventional: { 
    id: 'conventional', name: 'المكتبة الذكية', icon: Building, color: 'from-slate-500 to-slate-700', shadow: 'shadow-slate-200',
    description: 'مساحة المنظمين وصناع الأنظمة. الدقة والبيانات هي لغتنا هنا.',
    careers: ['محلل مالي', 'مدير قواعد بيانات', 'مبرمج أنظمة'],
    projects: ['أتمتة نظام استعارة الكتب', 'بناء جدول ذكي لمواعيد الامتحانات']
  },
};

export default function SpacePage() {
  const params = useParams();
  const spaceId = params.id as string;
  const space = spaceData[spaceId];

  if (!space) {
    return <div className="p-8 text-center font-bold text-xl">المساحة غير موجودة 🚫</div>;
  }

  const Icon = space.icon;

  return (
    <div className="flex flex-col w-full h-full pb-20">
      
      {/* Top Navigation Bar (Specific to this page) */}
      <div className="flex items-center justify-between p-4 sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md">
        <Link href="/" className="bg-white p-2 rounded-full shadow-sm border border-slate-200 hover:bg-slate-100 transition-colors">
          {/* Right Chevron because we are in RTL */}
          <ChevronRight className="w-6 h-6 text-slate-700" />
        </Link>
        <div className="bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-200 font-bold text-slate-700 text-sm">
          تفاصيل المساحة
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      <div className="px-4 md:px-6 space-y-6 max-w-2xl mx-auto w-full">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-br ${space.color} rounded-3xl p-6 md:p-8 text-white shadow-xl ${space.shadow} relative overflow-hidden`}
        >
          <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
            <Icon className="w-48 h-48" />
          </div>
          
          <div className="relative z-10">
            <div className="bg-white/20 backdrop-blur-md w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-white/30 shadow-inner">
              <Icon className="w-8 h-8 text-white drop-shadow-md" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 drop-shadow-md">{space.name}</h1>
            <p className="text-sm md:text-base font-medium leading-relaxed opacity-95 text-white/90">
              {space.description}
            </p>
          </div>
        </motion.div>

        {/* Minigames / Quests Placeholder */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm"
        >
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
            <Gamepad2 className="w-5 h-5 text-orange-500" />
            ألعاب وتحديات
          </h2>
          <div className="bg-orange-50 border-2 border-dashed border-orange-200 rounded-2xl p-6 text-center">
            <Hammer className="w-8 h-8 text-orange-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-orange-600">منطقة الألعاب المصغرة (قيد التطوير)</p>
            <p className="text-xs text-orange-500 mt-1">ستتوفر تحديات {space.name} التفاعلية هنا قريباً!</p>
          </div>
        </motion.div>

        {/* DIY Projects */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm"
        >
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-sky-500" />
            مشاريع يمكنك تنفيذها
          </h2>
          <div className="space-y-3">
            {space.projects.map((project: string, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-sky-200 transition-colors group cursor-pointer">
                <span className="text-sm font-bold text-slate-700">{project}</span>
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Career Paths */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-8"
        >
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-emerald-500" />
            مسارات مهنية للمستقبل
          </h2>
          <div className="flex flex-wrap gap-2">
            {space.careers.map((career: string, index: number) => (
              <span key={index} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-4 py-2 rounded-xl text-sm font-bold">
                {career}
              </span>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}