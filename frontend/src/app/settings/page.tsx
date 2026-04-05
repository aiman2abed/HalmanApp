'use client';

import { useState } from 'react';
import { 
  UserCircle, Trophy, Star, Target, LogOut, 
  Volume2, Bell, Shield, ChevronLeft 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { profile, signOut } = useAuth();
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Fallback defaults while loading
  const username = profile?.display_name || 'بطل مجهول';
  const level = profile?.current_level || 1;
  const xp = profile?.total_xp || 0;
  
  // Math for progress bar (each level requires 500 XP)
  const nextLevelXp = level * 500;
  const xpProgress = Math.min((xp / nextLevelXp) * 100, 100);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    // Mobile First: min-h-[100dvh] and pb-24 for BottomNav clearance
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col p-4 pb-24 md:p-6 md:pb-6" dir="rtl">
      
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="flex items-center gap-3 text-2xl font-black text-slate-800 md:text-3xl">
          <div className="rounded-xl border border-slate-200 bg-slate-100 p-2 shadow-sm">
            <UserCircle className="h-6 w-6 text-slate-500" />
          </div>
          الملف الشخصي
        </h1>
      </div>

      {/* Student ID Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-sky-400 to-blue-600 p-6 text-white shadow-xl shadow-blue-200"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 opacity-10">
          <Trophy className="h-48 w-48" />
        </div>

        <div className="relative z-10 mb-6 flex items-center gap-4">
          <div className="flex h-20 w-20 rotate-3 transform items-center justify-center rounded-2xl border-4 border-blue-300 bg-white shadow-inner">
            <span className="text-4xl font-black text-blue-500">{username[0]}</span>
          </div>
          
          <div>
            <h2 className="text-2xl font-black">{username}</h2>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/20 px-3 py-1 backdrop-blur-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-bold text-yellow-50">مستكشف مبتدئ</span>
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="rounded-2xl border border-white/20 bg-black/20 p-4 backdrop-blur-sm">
          <div className="mb-2 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <span className="font-bold text-white">المستوى {level}</span>
            </div>
            <span className="text-xs font-bold text-blue-100">{xp} / {nextLevelXp} نقطة</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full border border-white/10 bg-black/30">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400" 
            />
          </div>
        </div>
      </motion.div>

      {/* Settings List */}
      <div className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600"><Volume2 className="h-5 w-5" /></div>
            <span className="font-bold text-slate-700">المؤثرات الصوتية</span>
          </div>
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`relative h-7 w-12 rounded-full transition-colors ${soundEnabled ? 'bg-green-500' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${soundEnabled ? 'left-1' : 'left-6'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600"><Bell className="h-5 w-5" /></div>
            <span className="font-bold text-slate-700">الإشعارات</span>
          </div>
          <button 
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`relative h-7 w-12 rounded-full transition-colors ${notificationsEnabled ? 'bg-green-500' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${notificationsEnabled ? 'left-1' : 'left-6'}`} />
          </button>
        </div>
      </div>

      {/* Real Logout Button */}
      <button 
        onClick={handleLogout}
        className="mb-4 mt-auto flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-rose-100 bg-rose-50 py-4 font-bold text-rose-600 transition-all hover:border-rose-200 hover:bg-rose-100 active:scale-95"
      >
        <LogOut className="h-5 w-5" />
        <span>تسجيل الخروج الأمان</span>
      </button>

    </div>
  );
}