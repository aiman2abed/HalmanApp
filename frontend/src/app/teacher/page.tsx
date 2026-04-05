"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Presentation,
  Users,
  Search,
  Activity,
  Lightbulb,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RotateCcw,
  X
} from "lucide-react";
import { Can } from "@/components/auth/Can";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const MOCK_STUDENTS = [
  { id: "st-1", name: "أحمد كريم", level: 4, xp: 1850, track: "مختبر الحاسوب", progress: 85, status: "نشط" },
  { id: "st-2", name: "سارة محمود", level: 3, xp: 1420, track: "مختبر الحاسوب", progress: 60, status: "نشط" },
  { id: "st-3", name: "يوسف علي", level: 5, xp: 2100, track: "مختبر الحاسوب", progress: 92, status: "متميز" },
];

export default function TeacherDashboardPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"students" | "history">("students");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [suggestionType, setSuggestionType] = useState("تعديل خطة طالب");
  const [suggestionText, setSuggestionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredStudents = MOCK_STUDENTS.filter(s => s.name.includes(searchQuery));

  const openSuggestionModal = (student: any) => {
    setSelectedStudent(student);
    setSuggestionType("تعديل خطة طالب");
    setSuggestionText("");
    setIsModalOpen(true);
  };

  const submitSuggestion = async () => {
    if (!user || !selectedStudent) return;
    setIsSubmitting(true);
    try {
      // const { error } = await supabase.from('content_suggestions').insert({...});
      alert(`تم إرسال الاقتراح بنجاح للمدير`);
      setIsModalOpen(false);
    } catch (error: any) {
      alert(`خطأ: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const forceAssessmentRetake = async (studentId: string, studentName: string) => {
    const confirmed = window.confirm(`تأكيد إجبار (${studentName}) على التقييم مجدداً؟`);
    if (!confirmed) return;
    try {
      // await supabase.from('riasec_profiles').delete().eq('user_id', studentId);
      alert(`تم بنجاح!`);
    } catch (error) {
      alert("حدث خطأ.");
    }
  };

  return (
    <Can 
      I="read" 
      a="student_progress" 
      fallback={
        <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-slate-50 p-6 text-center" dir="rtl">
          <Presentation className="h-16 w-16 text-slate-400 mb-4" />
          <h1 className="text-2xl font-black text-slate-800 mb-2">غير مصرح</h1>
        </div>
      }
    >
      <div className="flex min-h-[100dvh] w-full flex-col bg-slate-50/50 pb-24 md:pb-6" dir="rtl">
        
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between bg-white/90 p-3 md:p-4 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2 border border-emerald-200">
              <Presentation className="h-5 w-5 md:h-6 md:w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">لوحة الإشراف</h1>
              <p className="text-[10px] md:text-xs font-bold text-emerald-600">نطاق المساحة/الصف</p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl space-y-4 md:space-y-6 px-3 md:px-6 mt-4 md:mt-6">
          
          {/* Welcome Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 p-5 md:p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-xl md:text-2xl font-black mb-1">مرحباً، {profile?.display_name || "أستاذي"}!</h2>
              <p className="text-xs md:text-sm font-medium text-emerald-100">أداء طلابك والمقترحات المرفوعة.</p>
            </div>
            <Activity className="absolute -left-4 -bottom-4 h-24 w-24 md:h-32 md:w-32 text-white opacity-10 pointer-events-none" />
          </div>

          {/* Quick KPIs */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
            {[
              { label: "طلابي", value: "3", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
              { label: "التقدم", value: "79%", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100" },
              { label: "معلقة", value: "1", icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
              { label: "مقبولة", value: "1", icon: CheckCircle2, color: "text-purple-600", bg: "bg-purple-100" },
            ].map((stat, idx) => (
              <div key={idx} className="rounded-2xl md:rounded-3xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm flex flex-col items-start">
                <div className={`mb-2 rounded-lg p-2 ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800">{stat.value}</h3>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm hide-scrollbar">
            <button onClick={() => setActiveTab("students")} className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs md:text-sm font-bold transition-all ${activeTab === "students" ? "bg-emerald-50 text-emerald-700 shadow-sm" : "text-slate-500"}`}>الطلاب</button>
            <button onClick={() => setActiveTab("history")} className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs md:text-sm font-bold transition-all ${activeTab === "history" ? "bg-emerald-50 text-emerald-700 shadow-sm" : "text-slate-500"}`}>سجل الاقتراحات</button>
          </div>

          {activeTab === "students" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Search */}
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                <Search className="h-4 w-4 text-slate-400 mr-2" />
                <input type="text" placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-xs md:text-sm font-medium outline-none py-1 px-2" />
              </div>

              {/* Students Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="rounded-2xl md:rounded-3xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-base md:text-lg font-black text-slate-600 border border-slate-200">
                        {student.name[0]}
                      </div>
                      <div>
                        <p className="font-black text-sm md:text-base text-slate-800">{student.name}</p>
                        <p className="text-[10px] md:text-xs font-bold text-slate-500">{student.track} • م. {student.level}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${student.progress}%` }} />
                      </div>
                    </div>

                    {/* Mobile Buttons Stacked */}
                    <div className="flex flex-col sm:flex-row gap-2 border-t border-slate-100 pt-3 md:pt-4">
                      <button onClick={() => openSuggestionModal(student)} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-black py-2.5 rounded-xl">
                        <Lightbulb className="w-4 h-4" /> اقتراح
                      </button>
                      <button onClick={() => forceAssessmentRetake(student.id, student.name)} className="flex-1 flex items-center justify-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-100 text-xs font-black py-2.5 rounded-xl">
                        <RotateCcw className="w-4 h-4" /> إعادة تقييم
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modal is already mobile friendly (w-11/12 max-w-lg) */}
      <AnimatePresence>
        {isModalOpen && selectedStudent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 z-[120] w-11/12 max-w-sm md:max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white shadow-2xl p-5 md:p-6" dir="rtl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg md:text-xl font-black text-slate-800">اقتراح للإدارة</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-slate-100 rounded-full"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4 mb-5">
                <select value={suggestionType} onChange={(e) => setSuggestionType(e.target.value)} className="w-full rounded-xl border bg-slate-50 p-3 text-xs md:text-sm font-bold outline-none">
                  <option>تعديل خطة طالب</option>
                  <option>إضافة مشروع جديد</option>
                </select>
                <textarea rows={3} value={suggestionText} onChange={(e) => setSuggestionText(e.target.value)} className="w-full rounded-xl border bg-slate-50 p-3 text-xs md:text-sm font-medium outline-none resize-none" placeholder="التفاصيل..." />
              </div>
              <button onClick={submitSuggestion} disabled={!suggestionText || isSubmitting} className="w-full bg-emerald-500 text-white font-black py-3 rounded-xl disabled:opacity-50 text-sm">
                {isSubmitting ? "جاري الإرسال..." : "إرسال"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Can>
  );
}