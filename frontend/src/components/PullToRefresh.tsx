// src/components/PullToRefresh.tsx
"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { Loader2, ArrowDown } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const pullProgressRef = useRef(0);
  const controls = useAnimation();

  const THRESHOLD = 80; // How far to pull down before triggering refresh

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pulling if the user is at the very top of the page
      if (container.scrollTop <= 0) {
        startYRef.current = e.touches[0].clientY;
      } else {
        startYRef.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startYRef.current === 0 || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startYRef.current;

      // Only apply pull mechanics if dragging downwards
      if (deltaY > 0) {
        // Prevent default browser overscroll/refresh
        if (e.cancelable) e.preventDefault();

        setShowIndicator(true);

        // Apply friction to the pull so it feels heavy
        const resistantY = deltaY * 0.4;
        const cappedY = Math.min(resistantY, THRESHOLD + 40);

        pullProgressRef.current = cappedY;
        
        // Use Framer Motion controls for direct DOM manipulation (high performance)
        controls.set({ y: cappedY });
      }
    };

    const handleTouchEnd = async () => {
      if (startYRef.current === 0 || isRefreshing) return;

      if (pullProgressRef.current >= THRESHOLD) {
        setIsRefreshing(true);
        // Snap to the threshold position and hold it there while loading
        await controls.start({
          y: THRESHOLD,
          transition: { type: "spring", stiffness: 300, damping: 30 },
        });

        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setShowIndicator(false);
          pullProgressRef.current = 0;
          // Animate back to the top
          controls.start({
            y: 0,
            transition: { type: "spring", stiffness: 300, damping: 30 },
          });
        }
      } else {
        // Didn't pull far enough, snap back to origin
        setShowIndicator(false);
        pullProgressRef.current = 0;
        controls.start({
          y: 0,
          transition: { type: "spring", stiffness: 300, damping: 30 },
        });
      }

      startYRef.current = 0;
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isRefreshing, controls, onRefresh]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100">
      {/* Refresh Indicator Layer (Hidden underneath the content) */}
      <div className="absolute left-0 top-0 flex w-full justify-center z-0 pt-6">
        <AnimatePresence>
          {showIndicator && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="flex items-center justify-center"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-slate-200 text-orange-500">
                {isRefreshing ? (
                  <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                ) : (
                  <motion.div animate={{ rotate: pullProgressRef.current >= THRESHOLD ? 180 : 0 }}>
                    <ArrowDown className="h-5 w-5" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scrollable Content Layer (Pulls down to reveal the indicator) */}
      <motion.div
        ref={containerRef}
        className="h-full w-full overflow-y-auto relative z-10 bg-slate-50/50"
        animate={controls}
      >
        {children}
      </motion.div>
    </div>
  );
}