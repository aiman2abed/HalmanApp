"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Users,
  Activity,
  Database,
  Search,
  UserPlus,
  Lock,
  ChevronDown,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Can } from "@/components/auth/Can";
import { UserRole, ScopeType } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const AVAILABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: "app_developer", label: "مطور نظام (سوبر أدمن)" },
  { value: "school_admin", label: "مدير مدرسة" },
  { value: "space_admin", label: "مشرف مساحة" },
  { value: "class_teacher", label: "معلم صف" },
  { value: "parent", label: "ولي أمر" },
  { value: "student", label: "طالب" },
];

const getScopeTypeForRole = (role: string): ScopeType => {
  switch (role) {
    case "app_developer": return "global";
    case "school_admin": return "school";
    case "space_admin": return "space";
    case "class_teacher": return "class";
    case "parent": return "family";
    default: return "self";
  }
};

// ==========================================
// User Row Component
// ==========================================
function UserRow({ user, onAssignRole }: { user: any, onAssignRole: (userId: string, role: string, scopeType: string, scopeId: string) => Promise<boolean> }) {
  const existingRole = user.roles && user.roles.length > 0 ? user.roles[0] : null;
  const [selectedRole, setSelectedRole] = useState<string>(existingRole?.role || "student");
  const [scopeId, setScopeId] = useState<string>(existingRole?.scope_id || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    const scopeType = getScopeTypeForRole(selectedRole);
    const success = await onAssignRole(user.id, selectedRole, scopeType, scopeId);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 md:p-5 border-b border-slate-100 last:border-0 gap-4">
      {/* User Info */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-base md:text-lg font-black text-slate-600 border border-slate-200">
          {user.name[0] || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-black text-sm md:text-base text-slate-800 truncate">{user.name}</p>
          <p className="text-[10px] md:text-[11px] font-medium text-slate-500 mt-0.5 truncate" dir="ltr">{user.id}</p>
        </div>
      </div>

      {/* Role & Scope Assigner - Mobile Stacked */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto bg-slate-50 p-2 md:p-3 rounded-2xl border border-slate-100">
        <div className="relative w-full sm:w-36 md:w-40">
          <select 
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pl-8 text-xs md:text-sm font-bold text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            {AVAILABLE_ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute left-2.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
        
        <div className="relative w-full sm:w-36 md:w-40">
          <input 
            type="text" 
            placeholder="Scope ID (اختياري)" 
            value={scopeId}
            onChange={(e) => setScopeId(e.target.value)}
            disabled={selectedRole === "app_developer" || selectedRole === "student"}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs md:text-sm font-medium text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 placeholder:text-slate-400 disabled:opacity-50 disabled:bg-slate-100"
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full sm:w-auto flex items-center justify-center rounded-xl border px-4 py-2.5 text-xs md:text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 ${
            saveSuccess 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : "حفظ"}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================
export default function DeveloperConsolePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "system" | "logs">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchSystemUsers = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/developer/users`, {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error("فشل جلب المستخدمين");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchSystemUsers(); 
  }, []);

  const assignUserRole = async (targetUserId: string, role: string, scopeType: string, scopeId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;
      const res = await fetch(`${API_URL}/api/developer/assign-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify({ target_user_id: targetUserId, role, scope_type: scopeType, scope_id: scopeId || null })
      });
      if (!res.ok) throw new Error("فشل تعيين الصلاحية");
      return true;
    } catch (error: any) {
      console.error(error);
      alert(`خطأ: ${error.message}`);
      return false;
    }
  };

  // --- السطر الذي كان مفقوداً وتم إرجاعه ---
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.id.includes(searchQuery)
  );

  return (
    <Can 
      I="view_dashboard" 
      a="admin_tools" 
      fallback={
        <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-slate-50 p-6 text-center" dir="rtl">
          <ShieldAlert className="h-16 w-16 text-rose-500 mb-4" />
          <h1 className="text-2xl font-black text-slate-800 mb-2">غير مصرح لك بالدخول</h1>
        </div>
      }
    >
      <div className="flex min-h-[100dvh] w-full flex-col bg-slate-50/50 pb-24 md:pb-6" dir="rtl">
        
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between bg-white/90 p-3 md:p-4 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-100 p-2 border border-rose-200">
              <ShieldAlert className="h-5 w-5 md:h-6 md:w-6 text-rose-600" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">لوحة المطور</h1>
              <p className="text-[10px] md:text-xs font-bold text-rose-600">صلاحيات كاملة</p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl space-y-4 md:space-y-6 px-3 md:px-6 mt-4 md:mt-6">
          
          {/* Quick System Stats */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
            {[
              { label: "المستخدمين", value: users.length.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
              { label: "المدارس", value: "1", icon: Database, color: "text-emerald-600", bg: "bg-emerald-100" },
              { label: "السيرفر", value: "متصل", icon: Activity, color: "text-purple-600", bg: "bg-purple-100" },
              { label: "أخطاء", value: "0", icon: ShieldAlert, color: "text-rose-600", bg: "bg-rose-100" },
            ].map((stat, idx) => (
              <div key={idx} className="rounded-2xl md:rounded-3xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
                <div className={`mb-2 w-fit rounded-lg p-2 ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800">{stat.value}</h3>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm hide-scrollbar">
            {[
              { id: "users", label: "إدارة المستخدمين" },
              { id: "system", label: "إعدادات النظام" },
              { id: "logs", label: "سجلات النظام" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap rounded-xl px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-rose-50 text-rose-700 shadow-sm border border-rose-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "users" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                <div className="flex items-center flex-1 gap-2 bg-slate-50 rounded-xl px-3 py-1">
                  <Search className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-xs md:text-sm font-medium outline-none placeholder:text-slate-400 py-2"
                  />
                </div>
                <button 
                  onClick={fetchSystemUsers}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs md:text-sm font-bold text-white transition-transform active:scale-95 shrink-0"
                >
                  <Activity className="h-4 w-4" />
                  <span>تحديث</span>
                </button>
              </div>

              {/* Users List */}
              <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-rose-500 mb-3" />
                    <p className="text-xs font-bold text-slate-500">جاري الجلب...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-10 text-xs font-bold text-slate-500">لا يوجد مستخدمين.</div>
                ) : (
                  filteredUsers.map((u) => (
                    <UserRow key={u.id} user={u} onAssignRole={assignUserRole} />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Can>
  );
}