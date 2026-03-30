// src/components/SwipeCard.tsx
'use client';

import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { AssessmentCard } from '@/types';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface SwipeCardProps {
  card: AssessmentCard;
  onSwipe: (direction: 'left' | 'right', trait: string) => void;
  isFront: boolean;
}

export default function SwipeCard({ card, onSwipe, isFront }: SwipeCardProps) {
  const controls = useAnimation();
  const x = useMotionValue(0);
  
  // Physics: As X moves 200px left/right, rotate 15 degrees
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  // Physics: Fade out slightly at the extreme edges
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  // Color overlays based on drag direction
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const dislikeOpacity = useTransform(x, [0, -100], [0, 1]);

  const handleDragEnd = async (e: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      await controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } });
      onSwipe('right', card.primary_trait);
    } else if (info.offset.x < -threshold) {
      await controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } });
      onSwipe('left', card.primary_trait);
    } else {
      // Snap back to center if they didn't swipe far enough
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  return (
    <motion.div
      className="absolute w-full h-96 bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center justify-center p-8 text-center"
      style={{ x, rotate, opacity, zIndex: isFront ? 10 : 0 }}
      animate={controls}
      drag={isFront ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background Overlays for visual feedback */}
      <motion.div style={{ opacity: likeOpacity }} className="absolute inset-0 bg-green-50 rounded-3xl z-0" />
      <motion.div style={{ opacity: dislikeOpacity }} className="absolute inset-0 bg-red-50 rounded-3xl z-0" />

      {/* Card Content */}
      <div className="z-10 flex flex-col items-center gap-6">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center shadow-inner">
           {/* Placeholder for the image_url later */}
           <span className="text-4xl font-black text-slate-300">?</span>
        </div>
        <h3 className="text-2xl font-black text-slate-800 leading-tight">
          {card.prompt_text}
        </h3>
      </div>

      {/* Swipe Indicators */}
      <motion.div style={{ opacity: likeOpacity }} className="absolute top-6 left-6 text-green-500 border-2 border-green-500 rounded-full p-2 rotate-12 z-20">
        <ThumbsUp size={32} strokeWidth={3} />
      </motion.div>
      <motion.div style={{ opacity: dislikeOpacity }} className="absolute top-6 right-6 text-red-500 border-2 border-red-500 rounded-full p-2 -rotate-12 z-20">
        <ThumbsDown size={32} strokeWidth={3} />
      </motion.div>
    </motion.div>
  );
}