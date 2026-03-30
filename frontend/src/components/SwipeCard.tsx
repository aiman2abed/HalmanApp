"use client";

import {
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import type { AssessmentCard, RiasecScores } from "@/types";

interface SwipeCardProps {
  card: AssessmentCard;
  onSwipe: (direction: "left" | "right", trait: keyof RiasecScores) => void;
  isFront: boolean;
}

/**
 * Swipe interaction card used by the HalmanApp onboarding assessment.
 * Converts gestures into RIASEC trait scoring signals.
 */
export default function SwipeCard({ card, onSwipe, isFront }: SwipeCardProps) {
  const controls = useAnimation();
  const x = useMotionValue(0);

  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(
    x,
    [-200, -100, 0, 100, 200],
    [0.5, 1, 1, 1, 0.5],
  );
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const dislikeOpacity = useTransform(x, [0, -100], [0, 1]);

  const handleDragEnd = async (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number } },
  ) => {
    const threshold = 100;
    const trait = card.primary_trait as keyof RiasecScores;

    if (info.offset.x > threshold) {
      await controls.start({
        x: 500,
        opacity: 0,
        transition: { duration: 0.3 },
      });
      onSwipe("right", trait);
      return;
    }

    if (info.offset.x < -threshold) {
      await controls.start({
        x: -500,
        opacity: 0,
        transition: { duration: 0.3 },
      });
      onSwipe("left", trait);
      return;
    }

    controls.start({
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    });
  };

  return (
    <motion.div
      className="absolute flex h-96 w-full flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl"
      style={{ x, rotate, opacity, zIndex: isFront ? 10 : 0 }}
      animate={controls}
      drag={isFront ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.98 }}
    >
      {/* منطق واجهة المستخدم: لون أخضر عند القبول */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute inset-0 z-0 rounded-3xl bg-green-50"
      />
      {/* منطق واجهة المستخدم: لون أحمر عند الرفض */}
      <motion.div
        style={{ opacity: dislikeOpacity }}
        className="absolute inset-0 z-0 rounded-3xl bg-red-50"
      />

      <div className="z-10 flex flex-col items-center gap-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 shadow-inner">
          <span className="text-4xl font-black text-slate-300">?</span>
        </div>
        <h3 className="text-2xl font-black leading-tight text-slate-800">
          {card.prompt_text}
        </h3>
      </div>

      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute left-6 top-6 z-20 rotate-12 rounded-full border-2 border-green-500 p-2 text-green-500"
      >
        <ThumbsUp size={32} strokeWidth={3} />
      </motion.div>
      <motion.div
        style={{ opacity: dislikeOpacity }}
        className="absolute right-6 top-6 z-20 -rotate-12 rounded-full border-2 border-red-500 p-2 text-red-500"
      >
        <ThumbsDown size={32} strokeWidth={3} />
      </motion.div>
    </motion.div>
  );
}
