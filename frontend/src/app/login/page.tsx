// src/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Rocket, Mail, Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState("");

  const { signIn, signUp, user } = useAuth();
  const router = useRouter();

  // If they are already logged in, push them to the campus!
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLocalLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, username);
        router.push("/assessment"); // New users go to assessment
      } else {
        await signIn(email, password);
        router.push("/"); // Returning users go to campus
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "حدث خطأ ما";
      setError(message);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div
      className="absolute inset-0 bg-gradient-to-br from-orange-400 via-rose-400 to-pink-500 flex items-center justify-center p-4 z-50 overflow-hidden"
      dir="rtl"
    >
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-yellow-300 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute bottom-32 right-32 w-40 h-40 bg-blue-300 rounded-full opacity-30 animate-pulse delay-150"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-green-300 rounded-full opacity-30 animate-pulse delay-300"></div>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full mb-4 shadow-lg">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">
            طريق المستقبل
          </h1>
          <p className="text-slate-500 font-bold flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            اكتشف مغامرتك!
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                اسم البطل الخاص بك
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:outline-none text-base"
                placeholder="أدخل اسمك"
                required={isSignUp}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-12 pl-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:outline-none text-base"
                placeholder="email@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              كلمة المرور السرية
            </label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-12 pl-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:outline-none text-base"
                placeholder="أدخل كلمة المرور"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={localLoading}
            className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white font-black py-4 px-6 rounded-xl hover:shadow-lg active:scale-95 transition-all shadow-md disabled:opacity-50 mt-4"
          >
            {localLoading
              ? "جاري التحميل..."
              : isSignUp
                ? "ابدأ رحلتي!"
                : "هيا بنا!"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-orange-500 hover:text-orange-600 font-bold text-sm"
          >
            {isSignUp
              ? "لديك حساب بالفعل؟ سجل دخول!"
              : "جديد هنا؟ أنشئ حساباً!"}
          </button>
        </div>
      </div>
    </div>
  );
}
