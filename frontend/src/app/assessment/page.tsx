"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Loader2, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  BrainCircuit, 
  Check, 
  X, 
  HelpCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SwipeCard from "@/components/SwipeCard";
import RiasecRadar from "@/components/RiasecRadar";
import { useAuth } from "@/contexts/AuthContext";
import { submitAssessment, fetchAssessmentCards } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { AssessmentCard, RiasecScores } from "@/types";
import confetti from "canvas-confetti"; 

interface AssessmentResult {
  dominant_trait: string;
  ai_insight: string;
  raw_scores: Record<string, number>;
}

export default function AssessmentPage() {
  const { user, profile, refreshProfile } = useAuth();

  const [cards, setCards] = useState<AssessmentCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AssessmentResult | null>(null);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const [isGeneratingAdaptive, setIsGeneratingAdaptive] = useState(false);
  const [hasInjectedAdaptive, setHasInjectedAdaptive] = useState(false);

  const [scores, setScores] = useState<RiasecScores>({
    Realistic: 0, Investigative: 0, Artistic: 0,
    Social: 0, Enterprising: 0, Conventional: 0,
  });

  useEffect(() => {
    const loadCards = async () => {
      try {
        const data = await fetchAssessmentCards();
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setCards(shuffled);
      } catch (error) {
        console.error("Failed to load cards", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCards();
  }, []);

  const speakQuestion = useCallback((text: string) => {
    if (!isSpeechEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-SA";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [isSpeechEnabled]);

  useEffect(() => {
    if (cards[currentIndex] && !isAnalyzing && !aiResult) {
      speakQuestion(cards[currentIndex].prompt_text);
    }
  }, [currentIndex, cards, isAnalyzing, aiResult, speakQuestion]);

  const generateAdaptiveQuestions = async () => {
    setIsGeneratingAdaptive(true);
    try {
      // قراءة الرابط من البيئة، وإذا لم يوجد نستخدم اللوكال هوست
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const res = await fetch(`${API_URL}/api/adaptive-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_scores: scores })
      });

      if (!res.ok) throw new Error("API Request Failed");
      
      const data = await res.json();
      
      if (data?.newCards && data.newCards.length > 0) {
        const formattedCards = data.newCards.map((c: any, i: number) => ({
          ...c,
          id: `adaptive-${Date.now()}-${i}`
        }));
        setCards(prev => [...prev, ...formattedCards]);
      }
    } catch (err) {
      console.error("Adaptive generation failed, skipping...", err);
    } finally {
      setHasInjectedAdaptive(true);
      setIsGeneratingAdaptive(false);
    }
  };

  useEffect(() => {
    const isBasicFinished = cards.length > 0 && currentIndex === cards.length;
    
    if (isBasicFinished && !hasInjectedAdaptive && !isAnalyzing) {
      generateAdaptiveQuestions();
      return;
    }

    if (isBasicFinished && hasInjectedAdaptive && !isAnalyzing && !aiResult) {
      submitAndPersistAssessment();
    }
  }, [currentIndex, cards.length, hasInjectedAdaptive]);

  const submitAndPersistAssessment = async () => {
    setIsAnalyzing(true);
    try {
      const result = await submitAssessment(scores);
      setAiResult(result);
      
      // إطلاق تأثيرات الاحتفال
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

      if (!user) return;

      await supabase.from("riasec_profiles").upsert({
        user_id: user.id,
        primary_trait: result.dominant_trait,
        raw_scores: scores,
      }, { onConflict: "user_id" });

      if (profile) {
        const nextTotalXp = profile.total_xp + 150; 
        const nextLevel = Math.max(1, Math.floor(nextTotalXp / 100) + 1);
        await supabase.from("users").update({ total_xp: nextTotalXp, current_level: nextLevel }).eq("id", user.id);
        await refreshProfile();
      }
    } catch (error: any) {
      console.error("Analysis failed:", error);
      setAiResult({
        dominant_trait: "Error",
        ai_insight: "عذراً، حدث خطأ في تحليل قوتك الخارقة. حاول مرة أخرى!",
        raw_scores: scores,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSwipe = (direction: "left" | "right", trait: keyof RiasecScores) => {
    if (direction === "right") {
      setScores((prev) => ({ ...prev, [trait]: prev[trait] + 3 }));
    }
    setCurrentIndex((prev) => prev + 1);
  };

  // UI States
  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-emerald-50">
      <Loader2 className="animate-spin text-emerald-500" size={48} />
    </div>
  );

  if (isGeneratingAdaptive) return (
    <div className="flex h-screen flex-col items-center justify-center space-y-6 bg-sky-50 p-6 text-center" dir="rtl">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
        <BrainCircuit size={64} className="text-sky-500" />
      </motion.div>
      <h2 className="text-2xl font-black text-slate-800">حلمان يفكر في أسئلة خاصة لك...</h2>
      <p className="text-slate-500 font-bold">بناءً على إجاباتك، أريد التأكد من ميزتك التنافسية!</p>
    </div>
  );

  if (isAnalyzing) return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-white text-center" dir="rtl">
      <Loader2 className="animate-spin text-pink-500" size={64} />
      <h2 className="text-xl font-bold text-slate-800">حلمان أفندي يكتب تقريرك النهائي...</h2>
    </div>
  );

  if (aiResult) return (
    <div className="flex h-full w-full flex-col items-center space-y-6 overflow-y-auto bg-slate-50 px-4 pb-12 pt-8 text-center" dir="rtl">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
        <div className="mx-auto mb-2 flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 shadow-xl border-4 border-white">
          <Sparkles className="text-orange-500" size={48} />
        </div>
        <h2 className="text-3xl font-black text-slate-800">أنت مذهل!</h2>
        <p className="text-lg font-bold text-emerald-600">اكتمل التقرير بنجاح</p>
      </motion.div>

      <div className="w-full max-w-md rounded-3xl bg-white p-4 shadow-xl">
        <RiasecRadar scores={aiResult.raw_scores} />
      </div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full max-w-md rounded-3xl border-2 border-orange-200 bg-white p-6 text-right shadow-lg">
        <div className="absolute -top-4 right-6 bg-orange-500 px-3 py-1 rounded-full text-white text-xs font-black">تحليل حلمان أفندي</div>
        <p className="text-lg font-bold leading-relaxed text-slate-700">{aiResult.ai_insight}</p>
      </motion.div>

      <Link href="/" className="w-full max-w-md">
        <button className="w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white shadow-xl transition-all hover:bg-slate-800 active:scale-95">الذهاب إلى الحرم المدرسي</button>
      </Link>
    </div>
  );

  return (
    <div className="relative mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-white px-6 pt-12 pb-24" dir="rtl">
      
      {/* Header & Progress */}
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
          className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all ${isSpeechEnabled ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}
        >
          {isSpeechEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
        <div className="flex flex-col items-end">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">المقدمة</span>
          <span className="text-lg font-black text-slate-800">سؤال {currentIndex + 1} <span className="text-slate-300">/ {cards.length}</span></span>
        </div>
      </div>

      <div className="mb-8 h-3 w-full rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-l from-orange-400 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${(currentIndex / cards.length) * 100}%` }}
        />
      </div>

      {/* Helper Annotation */}
      <div className="mb-4 flex items-center gap-2 rounded-2xl bg-sky-50 p-3 text-sky-700">
        <HelpCircle size={18} className="shrink-0" />
        <p className="text-[11px] font-bold leading-tight">اسحب البطاقة لليمين إذا كان النشاط يعجبك، ولليسار إذا كان لا يعجبك!</p>
      </div>

      {/* Cards Area */}
      <div className="relative mt-2 flex h-[420px] w-full justify-center">
        {/* Visual Cues (Floating Labels) */}
        <div className="pointer-events-none absolute inset-0 z-0 flex justify-between px-4 pt-40 opacity-20">
          <div className="flex flex-col items-center text-rose-500">
            <X size={64} strokeWidth={3} />
            <span className="font-black">لا أحب</span>
          </div>
          <div className="flex flex-col items-center text-emerald-500">
            <Check size={64} strokeWidth={3} />
            <span className="font-black">أحب</span>
          </div>
        </div>

        <AnimatePresence>
          {cards.map((card, index) => {
            if (index < currentIndex || index > currentIndex + 1) return null;
            return (
              <SwipeCard
                key={card.id}
                card={card}
                onSwipe={handleSwipe}
                isFront={index === currentIndex}
              />
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Footer Info */}
      <div className="mt-auto text-center">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Halman Intelligence Engine v2.0</p>
      </div>
    </div>
  );
}