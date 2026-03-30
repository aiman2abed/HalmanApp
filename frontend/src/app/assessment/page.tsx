"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import SwipeCard from "@/components/SwipeCard";
import RiasecRadar from "@/components/RiasecRadar";
import { useAuth } from "@/contexts/AuthContext";
import { submitAssessment, fetchAssessmentCards } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { AssessmentCard, RiasecScores } from "@/types";

interface AssessmentResult {
  dominant_trait: string;
  ai_insight: string;
  raw_scores: Record<string, number>;
}

/**
 * RIASEC assessment flow for HalmanApp.
 * Collects swipes, calls AI analysis, and persists both history + current profile in Supabase.
 */
export default function AssessmentPage() {
  const { user, profile, refreshProfile } = useAuth();

  const [cards, setCards] = useState<AssessmentCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AssessmentResult | null>(null);

  const [scores, setScores] = useState<RiasecScores>({
    Realistic: 0,
    Investigative: 0,
    Artistic: 0,
    Social: 0,
    Enterprising: 0,
    Conventional: 0,
  });

  useEffect(() => {
    const loadCards = async () => {
      try {
        const data = await fetchAssessmentCards();
        setCards(data);
      } catch (error) {
        console.error("Failed to load cards", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCards();
  }, []);

  useEffect(() => {
    const isAssessmentComplete =
      cards.length > 0 && currentIndex === cards.length;

    if (!isAssessmentComplete || isAnalyzing || aiResult) return;

    const submitAndPersistAssessment = async () => {
      setIsAnalyzing(true);

      try {
        const result = await submitAssessment(scores);
        setAiResult(result);

        if (!user) return;

        const assessmentPayload = {
          user_id: user.id,
          realistic_score: scores.Realistic,
          investigative_score: scores.Investigative,
          artistic_score: scores.Artistic,
          social_score: scores.Social,
          enterprising_score: scores.Enterprising,
          conventional_score: scores.Conventional,
          dominant_code: result.dominant_trait.charAt(0).toUpperCase(),
        };

        const { error: historyError } = await supabase
          .from("assessments")
          .insert(assessmentPayload);
        if (historyError) {
          throw historyError;
        }

        const { error: profileError } = await supabase
          .from("riasec_profiles")
          .upsert(
            {
              user_id: user.id,
              realistic_score: scores.Realistic,
              investigative_score: scores.Investigative,
              artistic_score: scores.Artistic,
              social_score: scores.Social,
              enterprising_score: scores.Enterprising,
              conventional_score: scores.Conventional,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id",
            },
          );

        if (profileError) {
          throw profileError;
        }

        if (profile) {
          // Core architecture: XP progression is stored only in public.users.
          const nextTotalXp = profile.total_xp + 100;
          const nextLevel = Math.max(1, Math.floor(nextTotalXp / 100) + 1);

          const { error: userUpdateError } = await supabase
            .from("users")
            .update({ total_xp: nextTotalXp, current_level: nextLevel })
            .eq("id", user.id);

          if (userUpdateError) {
            throw userUpdateError;
          }

          await refreshProfile();
        }
      } catch (error) {
        console.error("Analysis or persistence failed:", error);
        setAiResult({
          dominant_trait: "Error",
          // منطق واجهة المستخدم: رسالة عربية واضحة للطالب عند فشل التحليل.
          ai_insight: "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.",
          raw_scores: scores,
        });
      } finally {
        setIsAnalyzing(false);
      }
    };

    submitAndPersistAssessment();
  }, [
    currentIndex,
    cards.length,
    isAnalyzing,
    aiResult,
    scores,
    user,
    profile,
    refreshProfile,
  ]);

  const handleSwipe = (
    direction: "left" | "right",
    trait: keyof RiasecScores,
  ) => {
    if (direction === "right") {
      setScores((prev) => ({ ...prev, [trait]: prev[trait] + 3 }));
    }

    setCurrentIndex((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
        <Loader2 className="animate-spin text-pink-500" size={64} />
        <h2 className="text-xl font-bold text-slate-800">
          حلمان أفندي يحلل إجاباتك...
        </h2>
        <p className="text-sm text-slate-500">
          جاري اكتشاف قوتك الخارقة وحفظ تقدمك!
        </p>
      </div>
    );
  }

  if (aiResult) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-start space-y-6 overflow-y-auto px-4 pb-12 text-center">
        <div className="mt-4">
          <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 shadow-sm">
            <Sparkles className="text-orange-500" size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">اكتمل التقييم!</h2>
          <p className="mt-1 text-sm font-bold text-green-600">
            +100 نقطة خبرة مكافأة!
          </p>
        </div>

        <div className="w-full">
          <p className="mb-2 px-2 text-right text-sm font-bold text-slate-500">
            مخطط شخصيتك (RIASEC)
          </p>
          <RiasecRadar scores={aiResult.raw_scores} />
        </div>

        <div className="relative mt-2 w-full rounded-2xl border border-slate-100 bg-white p-6 text-right shadow-lg">
          <p className="mb-3 text-xs font-black uppercase tracking-wider text-orange-500">
            تحليل حلمان أفندي
          </p>
          <p className="text-lg font-medium leading-relaxed text-slate-700">
            {aiResult.ai_insight}
          </p>
        </div>

        <Link href="/" className="mt-4 w-full">
          <button className="w-full rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 py-4 font-bold text-white shadow-md transition-all active:scale-95 hover:shadow-lg">
            الذهاب إلى الحرم المدرسي
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full w-full max-w-sm flex-col overflow-hidden pt-12">
      <div className="mb-8 h-2.5 w-full rounded-full bg-slate-200">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 transition-all duration-300"
          style={{ width: `${(currentIndex / cards.length) * 100}%` }}
        />
      </div>

      <p className="mb-8 text-center font-bold text-slate-500">
        سؤال {currentIndex + 1} من {cards.length}
      </p>

      <div className="relative mt-4 flex h-96 w-full justify-center">
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
      </div>
    </div>
  );
}
