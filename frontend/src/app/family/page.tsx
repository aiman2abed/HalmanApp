// src/app/family/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Award,
  TrendingUp,
  MessageCircle,
  Star,
  ChevronLeft,
  GraduationCap,
  CalendarDays,
  Loader2
} from "lucide-react";
import { Can } from "@/components/auth/Can";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { fetchFamilyChildren } from "@/lib/api";

export default function FamilyDashboardPage() {
  const { profile } = useAuth();
  
  // --- REAL DATA STATE ---
  const [children, setChildren] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH DATA ON LOAD ---
  useEffect(() => {
    const loadChildren = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const data = await fetchFamilyChildren(session.access_token);
        setChildren(data.children || []);
      } catch (error) {
        console.error("Failed to load children:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadChildren();
  }, []);

  return (
    <Can 
      I="read" 
      a="student_progress" 
      fallback={
        <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-slate-50 p-6 text-center" dir="rtl">
          <Users className="h-16 w-16 text-slate-400 mb-4" />
          <h1 className="text-2xl font-black text-slate-800 mb-2">غير مصرح</h1>
        </div>
      }
    >
      <div className="flex min-h-[100dvh] w-full flex-col bg-slate-50/50 pb-24 md:pb-6" dir="rtl">
        
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between bg-white/90 p-3 md:p-4 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-2 border border-purple-200">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">متابعة الأسرة</h1>
              <p className="text-[10px] md:text-xs font-bold text-purple-600">نطاق العائلة</p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-4xl space-y-4 md:space-y-6 px-3 md:px-6 mt-4 md:mt-6">
          
          {/* Welcome Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-500 p-5 md:p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-xl md:text-2xl font-black mb-1">أهلاً بك، {profile?.display_name || "ولي الأمر"}!</h2>
              <p className="text-xs md:text-sm font-medium text-purple-100">تابع رحلة استكشاف وتطور أبنائك في الحرم المدرسي.</p>
            </div>
            <Users className="absolute -left-4 -bottom-4 h-24 w-24 md:h-32 md:w-32 text-white opacity-10 pointer-events-none" />
          </div>

          {/* Children Cards or Loading State */}
          <div className="space-y-4 md:space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-4" />
                <p className="text-sm font-bold text-slate-500">جاري جلب بيانات الأبناء...</p>
              </div>
            ) : children.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <Users className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-500">لم يتم ربط أي أبناء بحسابك بعد.</p>
              </div>
            ) : (
              children.map((child) => {
                const progressPercent = Math.min((child.xp / child.nextLevelXp) * 100, 100);

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    key={child.id} 
                    className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm"
                  >
                    {/* Child Header - Mobile Wrap */}
                    <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-lg md:text-xl font-black text-purple-600 border border-purple-100">
                          {child.name[0]}
                        </div>
                        <div>
                          <h3 className="text-lg md:text-xl font-black text-slate-800">{child.name}</h3>
                          <p className="text-xs md:text-sm font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <GraduationCap className="w-3.5 h-3.5 text-purple-400" /> {child.track}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-1.5">
                        {child.badges.map((badge: string, idx: number) => (
                          <span key={idx} className="flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-700 text-[10px] md:text-xs font-black px-2 py-1 md:px-2.5 md:py-1.5 rounded-xl">
                            <Star className="w-3 h-3 fill-amber-500" /> {badge}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Progress & Stats */}
                    <div className="p-4 md:p-5 bg-slate-50/50">
                      <div className="flex justify-between items-end mb-2">
                        <div className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
                          <span className="text-sm md:text-base font-black text-slate-700">المستوى {child.level}</span>
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-slate-500">{child.xp} / {child.nextLevelXp} نقطة</span>
                      </div>
                      <div className="h-2.5 md:h-3 w-full bg-slate-200 rounded-full overflow-hidden mb-4 border border-slate-300/50">
                        <div className="h-full bg-gradient-to-l from-purple-500 to-indigo-400 rounded-full" style={{ width: `${progressPercent}%` }} />
                      </div>

                      {/* Teacher Feedback Note */}
                      {child.recentTeacherNote && (
                        <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 md:p-4">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <MessageCircle className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs md:text-sm font-black text-emerald-800">ملاحظة المعلم</span>
                          </div>
                          <p className="text-[11px] md:text-sm font-medium text-emerald-700 leading-relaxed">"{child.recentTeacherNote}"</p>
                          <p className="text-[10px] md:text-xs font-bold text-emerald-600/70 mt-1.5">— {child.noteAuthor}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Bar - Mobile Stacked */}
                    <div className="p-3 md:p-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2 md:gap-3">
                      <button className="flex-1 flex justify-center items-center gap-2 bg-slate-900 text-white text-xs md:text-sm font-black py-2.5 md:py-3 rounded-xl hover:bg-slate-800 active:scale-95 transition-all shadow-md">
                        <TrendingUp className="w-4 h-4" /> التقرير المفصل
                      </button>
                      <button className="flex-1 flex justify-center items-center gap-2 bg-white border-2 border-slate-200 text-slate-700 text-xs md:text-sm font-black py-2.5 md:py-3 rounded-xl hover:bg-slate-50 active:scale-95 transition-all">
                        <CalendarDays className="w-4 h-4" /> جدول المهام
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
          
        </div>
      </div>
    </Can>
  );
}