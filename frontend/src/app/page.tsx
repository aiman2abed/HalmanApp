// src/app/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Wrench, Beaker, Palette, Users, Briefcase, Building, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';

const riasecData: Record<string, any> = {
  realistic: { name: 'عملي', desc: 'ورشة الروبوتات', icon: Wrench, color: 'from-emerald-400 to-emerald-600', path: '/spaces/realistic' },
  investigative: { name: 'مفكر', desc: 'مختبر العلوم', icon: Beaker, color: 'from-blue-400 to-blue-600', path: '/spaces/investigative' },
  artistic: { name: 'فني', desc: 'استوديو الإبداع', icon: Palette, color: 'from-purple-400 to-purple-600', path: '/spaces/artistic' },
  social: { name: 'اجتماعي', desc: 'المركز المجتمعي', icon: Users, color: 'from-rose-400 to-rose-600', path: '/spaces/social' },
  enterprising: { name: 'مبادر', desc: 'مقر الابتكار', icon: Briefcase, color: 'from-orange-400 to-orange-600', path: '/spaces/enterprising' },
  conventional: { name: 'منظم', desc: 'المكتبة الذكية', icon: Building, color: 'from-slate-500 to-slate-700', path: '/spaces/conventional' },
};

// Use percentages so it scales on massive desktop screens and tiny mobile screens
const mapAssetLayouts = [
  { id: 'realistic', top: '25%', left: '15%' },
  { id: 'conventional', top: '15%', left: '50%', center: true },
  { id: 'investigative', top: '35%', left: '80%' },
  { id: 'social', top: '65%', left: '20%' },
  { id: 'enterprising', top: '75%', left: '75%' },
  { id: 'artistic', top: '80%', left: '45%', center: true },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } }
};

const MapBuilding = ({ layout }: { layout: any }) => {
  const trait = riasecData[layout.id];
  const Icon = trait.icon;

  return (
    <Link href={trait.path}>
      <motion.div 
        variants={item}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className={`absolute w-32 h-32 md:w-40 md:h-40 flex flex-col items-center justify-end cursor-pointer z-10 ${layout.center ? '-translate-x-1/2' : ''}`}
        style={{ top: layout.top, left: layout.left }}
      >
        <div className="absolute -top-8 bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-lg border border-slate-100 flex items-center gap-1.5 z-20 transition-all hover:-translate-y-1">
          <Icon size={14} className="text-orange-500" />
          <span className="text-xs md:text-sm font-black text-slate-700 whitespace-nowrap">{trait.desc}</span>
        </div>

        <div className={`w-24 h-20 md:w-32 md:h-28 bg-gradient-to-br ${trait.color} rounded-2xl shadow-2xl border-4 border-white/50 flex items-center justify-center relative overflow-hidden`}>
          <div className="absolute bottom-0 w-full h-1/2 bg-black/10 backdrop-blur-sm" />
          <Icon size={36} className="text-white drop-shadow-md z-10" />
          <div className="absolute -right-2 -top-2 w-8 h-8 bg-sky-400 rounded-full border-[3px] border-white shadow-sm" />
        </div>
      </motion.div>
    </Link>
  );
};

export default function CampusDashboard() {
  return (
    <div className="relative flex flex-col h-full w-full bg-emerald-50 rounded-b-3xl md:rounded-3xl shadow-inner overflow-hidden" dir="rtl">
      
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] border-[60px] border-emerald-200 rounded-[120px]" />
        <div className="absolute top-[50%] left-[-10%] w-[120%] h-[60px] bg-emerald-200 rotate-12" />
      </div>

      {/* Top Banner - Scales nicely on desktop */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-20 mt-6 mx-4 md:mx-12 max-w-2xl md:mx-auto w-full bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white"
      >
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-800 px-6 py-1.5 rounded-full shadow-lg flex items-center gap-2">
          <Sparkles size={14} className="text-orange-400" />
          <span className="text-sm font-black text-white tracking-wide">الحرم المدرسي</span>
          <Sparkles size={14} className="text-orange-400" />
        </div>

        <div className="flex items-center gap-4 mt-3">
          <div className="w-14 h-14 bg-gradient-to-tr from-sky-400 to-blue-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
            <span className="text-2xl font-black text-white">أ</span>
          </div>
          
          <div className="flex-1">
            <h3 className="text-base font-black text-slate-800">User</h3>
            <div className="w-full bg-slate-200 rounded-full h-4 mt-1.5 relative overflow-hidden shadow-inner">
              <div className="bg-gradient-to-l from-orange-400 to-yellow-400 h-full w-[60%] rounded-full" />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-800 drop-shadow-sm">مستوى 2 - 60%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Interactive Map */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="relative flex-1 z-10 w-full max-w-4xl mx-auto overflow-hidden mt-4"
      >
        {mapAssetLayouts.map((layout) => (
          <MapBuilding key={layout.id} layout={layout} />
        ))}
      </motion.div>
    </div>
  );
}