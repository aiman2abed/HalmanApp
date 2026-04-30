// src/app/admin/page.tsx
"use client";

import CmsVideoManager from "@/components/CmsVideoManager";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  GraduationCap,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  BarChart3,
  MapPin,
  Loader2
} from "lucide-react";
import { Can } from "@/components/auth/Can";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { fetchAdminSuggestions, updateSuggestionStatus } from "@/lib/api";

const MOCK_SPACES_STATS = [
  { name: "مختبر الحاسوب", students: 124, progress: 85 },
  { name: "ورشة الروبوتات", students: 89, progress: 72 },
  { name: "المكتبة الذكية", students: 210, progress: 93 },
  { name: "مختبر العلوم", students: 156, progress: 78 },
];

export default function SchoolAdminPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "cms">("overview");
  
  // --- REAL DATA STATE ---
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const data = await fetchAdminSuggestions(session.access_token);
        setSuggestions(data.suggestions || []);
      } catch (error) {
        console.error("Failed to load suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    // Optimistic UI Update
    setSuggestions(prev => prev.filter(s => s.id !== id));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const newStatus = action === "approve" ? "approved" : "rejected";
      await updateSuggestionStatus(session.access_token, id, newStatus);
    } catch (error) {
      console.error("فشل تحديث حالة الاقتراح:", error);
      // In a real app, you might want to revert the UI state here if the API call fails.
    }
  };

  return (
    <Can 
      I="view_dashboard" 
      a="admin_tools" 
      fallback={
        <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-slate-50 p-6 text-center" dir="rtl">
          <Building2 className="h-16 w-16 text-slate-400 mb-4" />
          <h1 className="text-2xl font-black text-slate-800 mb-2">غير مصرح</h1>
          <p className="text-slate-500">هذه الصفحة مخصصة لمدراء المدارس فقط.</p>
        </div>
      }
    >
      <div className="flex min-h-[100dvh] w-full flex-col bg-slate-50/50 pb-24 md:pb-6" dir="rtl">
        
        {/* Header - Mobile Optimized Padding */}
        <div className="sticky top-0 z-20 flex items-center justify-between bg-white/90 p-3 md:p-4 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2 border border-blue-200">
              <Building2 className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">إدارة المدرسة</h1>
              <p className="text-[10px] md:text-xs font-bold text-blue-600">نطاق المدرسة</p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl space-y-4 md:space-y-6 px-3 md:px-6 mt-4 md:mt-6">
          
          {/* Welcome Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-sky-500 p-5 md:p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-xl md:text-2xl font-black mb-1">مرحباً بك، {profile?.display_name || "أيها المدير"}!</h2>
              <p className="text-xs md:text-sm font-medium text-blue-100">إليك ملخص أداء المدرسة والطلبات المعلقة اليوم.</p>
            </div>
            <BarChart3 className="absolute -left-4 -bottom-4 h-24 w-24 md:h-32 md:w-32 text-white opacity-10 pointer-events-none" />
          </div>

          {/* Quick KPIs - Mobile Grid Adjustments */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
            {[
              { label: "إجمالي الطلاب", value: "842", icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" },
              { label: "الخريجين", value: "156", icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-100" },
              { label: "الطلبات", value: suggestions.length.toString(), icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
              { label: "المساحات", value: "6", icon: MapPin, color: "text-rose-600", bg: "bg-rose-100" },
            ].map((stat, idx) => (
              <div key={idx} className="rounded-2xl md:rounded-3xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm flex flex-col items-start">
                <div className={`mb-2 rounded-lg p-2 ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800">{stat.value}</h3>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 mt-1 line-clamp-1">{stat.label}</p>
              </div>
            ))}
          </div>
          
          <div className="flex overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm hide-scrollbar mb-4">
            <button onClick={() => setActiveTab("overview")} className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs md:text-sm font-bold transition-all ${activeTab === "overview" ? "bg-blue-50 text-blue-700 shadow-sm" : "text-slate-500"}`}>نظرة عامة</button>
            <button onClick={() => setActiveTab("cms")} className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs md:text-sm font-bold transition-all ${activeTab === "cms" ? "bg-blue-50 text-blue-700 shadow-sm" : "text-slate-500"}`}>إدارة المحتوى</button>
          </div>

          {/* ===== OVERVIEW TAB ===== */}
          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              
              {/* Approval Workflow Queue */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-amber-500" />
                    قائمة الموافقات
                  </h3>
                  {suggestions.length > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-[10px] md:text-xs font-black px-2 py-1 rounded-full">
                      {suggestions.length} جديد
                    </span>
                  )}
                </div>

                <div className="space-y-3 flex-1">
                  <AnimatePresence>
                    {isLoading ? (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-full py-10 text-center"
                      >
                        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
                        <p className="text-xs text-slate-400 font-bold">جاري تحميل الطلبات...</p>
                      </motion.div>
                    ) : suggestions.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-full py-10 text-center"
                      >
                        <CheckCircle2 className="h-12 w-12 text-emerald-300 mb-3" />
                        <p className="text-sm md:text-base text-slate-500 font-bold">لا توجد طلبات معلقة!</p>
                        <p className="text-xs text-slate-400 mt-1">تمت مراجعة جميع الاقتراحات بنجاح.</p>
                      </motion.div>
                    ) : (
                      suggestions.map((sug) => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, x: -50 }}
                          key={sug.id}
                          className="rounded-2xl border border-slate-100 bg-slate-50 p-3 md:p-4 transition-colors hover:border-blue-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                              {sug.type}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">{sug.date}</span>
                          </div>
                          <p className="text-xs md:text-sm font-bold text-slate-800 mb-1">{sug.author}</p>
                          <p className="text-[11px] md:text-xs font-medium text-slate-600 leading-relaxed mb-4">
                            {sug.description}
                          </p>
                          {/* Mobile: Buttons stack on very small screens, side-by-side on sm */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button 
                              onClick={() => handleAction(sug.id, "approve")}
                              className="flex-1 flex justify-center items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black py-2.5 md:py-2 rounded-xl transition-all active:scale-95"
                            >
                              <CheckCircle2 className="w-4 h-4" /> موافقة
                            </button>
                            <button 
                              onClick={() => handleAction(sug.id, "reject")}
                              className="flex-1 flex justify-center items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 text-xs font-black py-2.5 md:py-2 rounded-xl transition-all active:scale-95"
                            >
                              <XCircle className="w-4 h-4" /> رفض
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Spaces Overview */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                <h3 className="text-base md:text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-indigo-500" />
                  ملخص المساحات (Spaces)
                </h3>
                
                <div className="space-y-4">
                  {MOCK_SPACES_STATS.map((space, idx) => (
                    <div key={idx} className="group">
                      <div className="flex justify-between items-end mb-1.5">
                        <div>
                          <p className="text-xs md:text-sm font-black text-slate-700">{space.name}</p>
                          <p className="text-[10px] font-bold text-slate-400">{space.students} طالب نشط</p>
                        </div>
                        <span className="text-[10px] md:text-xs font-black text-indigo-600">{space.progress}% إنجاز</span>
                      </div>
                      <div className="h-2 md:h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-l from-indigo-500 to-sky-400 rounded-full transition-all duration-1000 group-hover:opacity-80"
                          style={{ width: `${space.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-6 flex justify-between items-center text-xs md:text-sm font-bold text-slate-500 bg-slate-50 border border-slate-100 p-3 rounded-xl hover:bg-slate-100 transition-colors">
                  عرض التقرير المفصل
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          )}

          {/* ===== NEW CMS TAB RENDER BLOCK ===== */}
          {activeTab === "cms" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <CmsVideoManager />
            </motion.div>
          )}

        </div>
      </div>
    </Can>
  );
}