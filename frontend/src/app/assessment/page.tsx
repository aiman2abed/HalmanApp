// src/app/assessment/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { fetchAssessmentCards, submitAssessment } from '@/lib/api';
import { AssessmentCard } from '@/types';
import SwipeCard from '@/components/SwipeCard';
import { Loader2, Sparkles } from 'lucide-react';
import RiasecRadar from '@/components/RiasecRadar';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function AssessmentPage() {
  const { user, refreshProfile } = useAuth(); // Hook into our global auth state
  
  const [cards, setCards] = useState<AssessmentCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [aiResult, setAiResult] = useState<{ 
    dominant_trait: string; 
    ai_insight: string;
    raw_scores: Record<string, number>;
  } | null>(null);
  
  const [scores, setScores] = useState<Record<string, number>>({
    Realistic: 0, Investigative: 0, Artistic: 0, Social: 0, Enterprising: 0, Conventional: 0
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
    const isAssessmentComplete = cards.length > 0 && currentIndex === cards.length;

    if (isAssessmentComplete && !isAnalyzing && !aiResult) {
      const getAIInsightAndSave = async () => {
        setIsAnalyzing(true);
        try {
          console.log("🚀 Firing AI request...");
          const result = await submitAssessment(scores);
          setAiResult(result);

          // --- 💾 DATABASE WIRING START ---
          if (user) {
            // 1. Save to historical assessments table
            await supabase.from('assessments').insert({
              user_id: user.id,
              realistic_score: scores.Realistic,
              investigative_score: scores.Investigative,
              artistic_score: scores.Artistic,
              social_score: scores.Social,
              enterprising_score: scores.Enterprising,
              conventional_score: scores.Conventional,
              dominant_code: result.dominant_trait.charAt(0).toUpperCase()
            });

            // 2. Upsert (Update or Insert) into riasec_profiles
            await supabase.from('riasec_profiles').upsert({
              user_id: user.id,
              realistic_score: scores.Realistic,
              investigative_score: scores.Investigative,
              artistic_score: scores.Artistic,
              social_score: scores.Social,
              enterprising_score: scores.Enterprising,
              conventional_score: scores.Conventional,
              updated_at: new Date().toISOString()
            });

            // 3. Award XP in users table
            if (profile) {
              await supabase
                .from('users')
                .update({ total_xp: profile.total_xp + 100 })
                .eq('id', user.id);
              
              await refreshProfile();
            }
          }
          // --- 💾 DATABASE WIRING END ---

        } catch (error) {
          console.error("Analysis or Save failed:", error);
          setAiResult({ 
            dominant_trait: "Error", 
            ai_insight: "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.",
            raw_scores: scores 
          });
        } finally {
          setIsAnalyzing(false);
        }
      };
      
      getAIInsightAndSave();
    }
  }, [currentIndex, cards.length, user]); 

  const handleSwipe = (direction: 'left' | 'right', trait: string) => {
    if (direction === 'right') {
      setScores(prev => ({ ...prev, [trait]: prev[trait] + 3 }));
    }
    setCurrentIndex(prev => prev + 1);
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={48} /></div>;
  }

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
        <Loader2 className="animate-spin text-pink-500" size={64} />
        <h2 className="text-xl font-bold text-slate-800">حلمان أفندي يحلل إجاباتك...</h2>
        <p className="text-sm text-slate-500">جاري اكتشاف قوتك الخارقة وحفظ تقدمك!</p>
      </div>
    );
  }

  if (aiResult) {
    return (
      <div className="flex flex-col items-center justify-start h-full space-y-6 text-center px-4 overflow-y-auto pb-12 w-full">
        <div className="mt-4">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
            <Sparkles className="text-orange-500" size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">اكتمل التقييم!</h2>
          <p className="text-sm font-bold text-green-600 mt-1">+100 نقطة خبرة مكافأة!</p>
        </div>

        <div className="w-full">
          <p className="text-sm font-bold text-slate-500 mb-2 text-right px-2">مخطط شخصيتك (RIASEC)</p>
          <RiasecRadar scores={aiResult.raw_scores} />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 relative w-full text-right mt-2">
          <p className="text-xs text-orange-500 font-black mb-3 uppercase tracking-wider">
            تحليل حلمان أفندي
          </p>
          <p className="text-lg text-slate-700 font-medium leading-relaxed">
            {aiResult.ai_insight}
          </p>
        </div>

        <Link href="/" className="w-full mt-4">
            <button className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95">
                الذهاب إلى الحرم المدرسي
            </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-sm mx-auto pt-12 relative overflow-hidden">
      <div className="w-full bg-slate-200 rounded-full h-2.5 mb-8">
        <div 
          className="bg-gradient-to-r from-orange-400 to-pink-500 h-2.5 rounded-full transition-all duration-300" 
          style={{ width: `${(currentIndex / cards.length) * 100}%` }}
        ></div>
      </div>
      
      <p className="text-center text-slate-500 font-bold mb-8">
        سؤال {currentIndex + 1} من {cards.length}
      </p>

      <div className="relative w-full h-96 flex justify-center mt-4">
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