// src/app/discover/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Heart,
  Share2,
  Sparkles,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// Import our API functions
import { fetchDiscoverVideos, toggleLikeVideo, toggleSaveVideo } from "@/lib/api";

interface VideoState {
  videoId: string;
  watched: boolean;
  saved: boolean;
  liked: boolean;
  likeCount: number;
}

interface ConfettiPiece {
  id: number;
  left: string;
  animationDelay: string;
  animationDuration: string;
  color: string;
}

const confettiColors = ["#FCD34D", "#F59E0B", "#EF4444", "#10B981", "#3B82F6"];

function createConfettiPieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 0.5}s`,
    animationDuration: `${2 + Math.random()}s`,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
  }));
}

export default function DiscoverPage() {
  const { profile } = useAuth();

  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoStates, setVideoStates] = useState<Record<string, VideoState>>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXPToast, setShowXPToast] = useState(false);
  const [muted, setMuted] = useState(true);
  const [earnedXp, setEarnedXp] = useState(0);
  const [confettiPieces] = useState<ConfettiPiece[]>(() =>
    createConfettiPieces(30)
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement>>({});
  const watchTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const displayedXp = (profile?.total_xp ?? 0) + earnedXp;

  const fetchVideos = async (skip: number) => {
    try {
      const data = await fetchDiscoverVideos(skip, 3);
      
      setVideos((prev) => {
        const newVids = data.videos.filter(
          (nv: any) => !prev.some((pv) => pv.id === nv.id)
        );
        return [...prev, ...newVids];
      });
      setHasNext(data.has_next);
      
      setVideoStates((prev) => {
        const newStates = { ...prev };
        data.videos.forEach((v: any) => {
          if (!newStates[v.id]) {
            newStates[v.id] = {
              videoId: v.id,
              watched: false,
              saved: false,
              liked: false,
              likeCount: Math.floor(Math.random() * 500) + 50,
            };
          }
        });
        return newStates;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(0);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const scrollTop = containerRef.current.scrollTop;
      const windowHeight = containerRef.current.clientHeight;
      const newIndex = Math.round(scrollTop / windowHeight);

      if (
        newIndex !== currentIndex &&
        newIndex >= 0 &&
        newIndex < videos.length
      ) {
        setCurrentIndex(newIndex);
      }

      if (newIndex >= videos.length - 2 && hasNext && !loading) {
        setPage((p) => p + 3);
        fetchVideos(page + 3);
      }
    };

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [currentIndex, videos.length, hasNext, loading, page]);

  useEffect(() => {
    const currentVideo = videos[currentIndex];
    if (!currentVideo) return;

    const videoElement = videoRefs.current[currentVideo.id];
    if (videoElement) {
      videoElement.play().catch(() => {});
    }

    Object.keys(videoRefs.current).forEach((id) => {
      if (id !== currentVideo.id) {
        const video = videoRefs.current[id];
        if (video) {
          video.pause();
          video.currentTime = 0;
        }
      }
    });

    if (watchTimers.current[currentVideo.id]) {
      clearTimeout(watchTimers.current[currentVideo.id]);
    }

    if (!videoStates[currentVideo.id]?.watched) {
      watchTimers.current[currentVideo.id] = setTimeout(() => {
        setVideoStates((prev) => ({
          ...prev,
          [currentVideo.id]: { ...prev[currentVideo.id], watched: true },
        }));

        setEarnedXp((prev) => prev + 15);
        setShowConfetti(true);
        setShowXPToast(true);

        setTimeout(() => {
          setShowConfetti(false);
          setShowXPToast(false);
        }, 3000);
      }, 5000);
    }

    const watchTimerRef = watchTimers.current;
    return () => {
      if (watchTimerRef[currentVideo.id]) {
        clearTimeout(watchTimerRef[currentVideo.id]);
      }
    };
  }, [currentIndex, videos, videoStates]);

  const handleLike = async (videoId: string) => {
    // Optimistic UI update
    setVideoStates((prev) => {
      const isLiked = prev[videoId]?.liked;
      return {
        ...prev,
        [videoId]: {
          ...prev[videoId],
          liked: !isLiked,
          likeCount: prev[videoId].likeCount + (isLiked ? -1 : 1),
        },
      };
    });

    // Background Database update
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await toggleLikeVideo(session.access_token, videoId);
      }
    } catch (error) {
      console.error("Failed to sync like with database", error);
    }
  };

  const handleSave = async (videoId: string) => {
    // Optimistic UI update
    setVideoStates((prev) => ({
      ...prev,
      [videoId]: { ...prev[videoId], saved: !prev[videoId]?.saved },
    }));

    // Background Database update
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await toggleSaveVideo(session.access_token, videoId);
      }
    } catch (error) {
      console.error("Failed to sync save with database", error);
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
    Object.values(videoRefs.current).forEach((video) => {
      if (video) video.muted = !muted;
    });
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black pb-20 shadow-2xl md:rounded-3xl md:pb-0" dir="rtl">
      {showXPToast && (
        <div className="absolute left-1/2 top-20 z-50 -translate-x-1/2 animate-bounce whitespace-nowrap rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-3 text-sm font-bold text-white shadow-2xl">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <span>+15 نقطة خبرة!</span>
          </div>
        </div>
      )}

      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
          {confettiPieces.map((piece) => (
            <div
              key={piece.id}
              className="absolute animate-confetti"
              style={{
                left: piece.left,
                top: "-10%",
                animationDelay: piece.animationDelay,
                animationDuration: piece.animationDuration,
              }}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: piece.color }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="absolute right-4 top-4 z-30 flex gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-md">
          <Sparkles size={14} className="text-yellow-400" />
          <span>{displayedXp} نقطة</span>
        </div>
      </div>

      <button
        onClick={toggleMute}
        className="absolute left-4 top-4 z-30 rounded-full border border-white/20 bg-black/40 p-2 text-white backdrop-blur-md transition-all hover:bg-black/60"
      >
        {muted ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </button>

      <div
        ref={containerRef}
        className="hide-scrollbar h-full w-full snap-y snap-mandatory overflow-y-scroll"
      >
        {videos.map((video) => (
          <div
            key={video.id}
            className="relative flex h-full w-full snap-start snap-always items-center justify-center bg-black"
          >
            <video
              ref={(el) => {
                if (el) videoRefs.current[video.id] = el;
              }}
              src={video.videoUrl}
              loop
              muted={muted}
              playsInline
              className="h-full w-full object-cover"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            <div
              className="absolute bottom-6 left-20 right-4 p-4 text-right text-white"
              dir="rtl"
            >
              <h2 className="mb-1 text-xl font-bold drop-shadow-md">
                {video.title}
              </h2>
              <p className="mb-3 text-sm opacity-90 drop-shadow-md">
                {video.description}
              </p>
              <span className="inline-block rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                {video.hashtag}
              </span>
            </div>

            <div className="absolute bottom-6 left-4 flex flex-col items-center gap-4">
              <div className="mb-2 h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg" />

              <button
                onClick={() => handleLike(video.id)}
                className="flex flex-col items-center gap-1 transition-transform active:scale-90"
              >
                <div
                  className={`rounded-full p-3 backdrop-blur-md transition-colors ${videoStates[video.id]?.liked ? "bg-rose-500/80" : "bg-black/40"}`}
                >
                  <Heart
                    className={`h-6 w-6 ${videoStates[video.id]?.liked ? "fill-white text-white" : "text-white"}`}
                  />
                </div>
                <span className="text-xs font-bold text-white drop-shadow-md">
                  {videoStates[video.id]?.likeCount || 0}
                </span>
              </button>

              <button
                onClick={() => handleSave(video.id)}
                className="flex flex-col items-center gap-1 transition-transform active:scale-90"
              >
                <div
                  className={`rounded-full p-3 backdrop-blur-md transition-colors ${videoStates[video.id]?.saved ? "bg-yellow-500/80" : "bg-black/40"}`}
                >
                  <Bookmark
                    className={`h-6 w-6 ${videoStates[video.id]?.saved ? "fill-white text-white" : "text-white"}`}
                  />
                </div>
                <span className="text-xs font-bold text-white drop-shadow-md">
                  حفظ
                </span>
              </button>

              <button className="flex flex-col items-center gap-1 transition-transform active:scale-90">
                <div className="rounded-full bg-black/40 p-3 backdrop-blur-md">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-bold text-white drop-shadow-md">
                  نشر
                </span>
              </button>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex h-32 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti { animation: confetti linear forwards; }
      `}</style>
    </div>
  );
}