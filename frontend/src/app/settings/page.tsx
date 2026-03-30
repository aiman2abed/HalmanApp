// src/app/settings/page.tsx
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
    <div className="p-4 md:p-6 w-full h-full flex flex-col max-w-2xl mx-auto pb-24">
      
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
          <div className="bg-slate-100 p-2 rounded-xl border border-slate-200 shadow-sm">
            <UserCircle className="w-6 h-6 text-slate-500" />
          </div>
          الملف الشخصي
        </h1>
      </div>

      {/* Student ID Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-br from-sky-400 to-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 mb-6 relative overflow-hidden"
      >
        <div className="absolute -right-8 -top-8 opacity-10 pointer-events-none">
          <Trophy className="w-48 h-48" />
        </div>

        <div className="relative z-10 flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-inner border-4 border-blue-300 transform rotate-3">
            <span className="text-4xl font-black text-blue-500">{username[0]}</span>
          </div>
          
          <div>
            <h2 className="text-2xl font-black">{username}</h2>
            <div className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full mt-1 border border-white/20">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-bold text-yellow-50">مستكشف مبتدئ</span>
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-white">المستوى {level}</span>
            </div>
            <span className="text-xs font-bold text-blue-100">{xp} / {nextLevelXp} نقطة</span>
          </div>
          <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden border border-white/10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full rounded-full" 
            />
          </div>
        </div>
      </motion.div>

      {/* Settings List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><Volume2 className="w-5 h-5" /></div>
            <span className="font-bold text-slate-700">المؤثرات الصوتية</span>
          </div>
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-12 h-7 rounded-full transition-colors relative ${soundEnabled ? 'bg-green-500' : 'bg-slate-200'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${soundEnabled ? 'left-1' : 'left-6'}`} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><Bell className="w-5 h-5" /></div>
            <span className="font-bold text-slate-700">الإشعارات</span>
          </div>
          <button 
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`w-12 h-7 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-green-500' : 'bg-slate-200'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${notificationsEnabled ? 'left-1' : 'left-6'}`} />
          </button>
        </div>
      </div>

      {/* Real Logout Button */}
      <button 
        onClick={handleLogout}
        className="w-full mt-auto mb-4 bg-rose-50 text-rose-600 font-bold py-4 rounded-2xl border-2 border-rose-100 hover:bg-rose-100 hover:border-rose-200 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        <span>تسجيل الخروج الأمان</span>
      </button>

    </div>
  );
}