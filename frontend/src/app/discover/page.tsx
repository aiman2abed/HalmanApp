// src/app/discover/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { Bookmark, Volume2, VolumeX, Sparkles, Heart, Share2 } from 'lucide-react';
import { microLearningVideos } from '@/data/microLearningVideos';

interface VideoState {
  videoId: string;
  watched: boolean;
  saved: boolean;
  liked: boolean;
  likeCount: number;
}

export default function DiscoverPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoStates, setVideoStates] = useState<Record<string, VideoState>>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXPToast, setShowXPToast] = useState(false);
  const [muted, setMuted] = useState(true);
  const [fakeXp, setFakeXp] = useState(120); // Mock XP for now
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement>>({});
  const watchTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Initialize States
  useEffect(() => {
    const initialStates: Record<string, VideoState> = {};
    microLearningVideos.forEach(video => {
      initialStates[video.id] = {
        videoId: video.id,
        watched: false,
        saved: false,
        liked: false,
        likeCount: Math.floor(Math.random() * 500) + 50,
      };
    });
    setVideoStates(initialStates);
  }, []);

  // Handle Scroll Snapping Intersection
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollTop = containerRef.current.scrollTop;
      const windowHeight = containerRef.current.clientHeight;
      const newIndex = Math.round(scrollTop / windowHeight);

      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < microLearningVideos.length) {
        setCurrentIndex(newIndex);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentIndex]);

  // Handle Play/Pause and XP Timers
  useEffect(() => {
    const currentVideo = microLearningVideos[currentIndex];
    if (!currentVideo) return;

    // Play current
    const videoElement = videoRefs.current[currentVideo.id];
    if (videoElement) {
      videoElement.play().catch(() => console.log("Autoplay prevented by browser"));
    }

    // Pause all others
    Object.keys(videoRefs.current).forEach(id => {
      if (id !== currentVideo.id) {
        const video = videoRefs.current[id];
        if (video) {
          video.pause();
          video.currentTime = 0;
        }
      }
    });

    // 5-Second XP Reward Timer
    if (watchTimers.current[currentVideo.id]) {
      clearTimeout(watchTimers.current[currentVideo.id]);
    }

    if (!videoStates[currentVideo.id]?.watched) {
      watchTimers.current[currentVideo.id] = setTimeout(() => {
        setVideoStates(prev => ({
          ...prev,
          [currentVideo.id]: { ...prev[currentVideo.id], watched: true },
        }));
        
        setFakeXp(prev => prev + 15);
        setShowConfetti(true);
        setShowXPToast(true);

        setTimeout(() => {
          setShowConfetti(false);
          setShowXPToast(false);
        }, 3000);
      }, 5000);
    }

    return () => {
      if (watchTimers.current[currentVideo.id]) clearTimeout(watchTimers.current[currentVideo.id]);
    };
  }, [currentIndex, videoStates]);

  const handleLike = (videoId: string) => {
    setVideoStates(prev => {
      const isLiked = prev[videoId]?.liked;
      return {
        ...prev,
        [videoId]: {
          ...prev[videoId],
          liked: !isLiked,
          likeCount: prev[videoId].likeCount + (isLiked ? -1 : 1)
        },
      };
    });
  };

  const handleSave = (videoId: string) => {
    setVideoStates(prev => ({
      ...prev,
      [videoId]: { ...prev[videoId], saved: !prev[videoId]?.saved },
    }));
  };

  const toggleMute = () => {
    setMuted(!muted);
    Object.values(videoRefs.current).forEach(video => {
      if (video) video.muted = !muted;
    });
  };

  return (
    <div className="relative h-full w-full bg-black rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
      
      {/* XP Toast Notification */}
      {showXPToast && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full font-bold text-sm shadow-2xl animate-bounce whitespace-nowrap">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span>+15 نقطة خبرة!</span>
          </div>
        </div>
      )}

      {/* Confetti Animation Overlay */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random()}s`,
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#FCD34D', '#F59E0B', '#EF4444', '#10B981', '#3B82F6'][Math.floor(Math.random() * 5)] }} />
            </div>
          ))}
        </div>
      )}

      {/* Top Floating Header */}
      <div className="absolute top-4 right-4 z-30 flex gap-2">
        <div className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-1.5 rounded-full font-bold shadow-lg text-xs flex items-center gap-1.5">
          <Sparkles size={14} className="text-yellow-400" />
          <span>{fakeXp} نقطة</span>
        </div>
      </div>

      {/* Mute Toggle */}
      <button onClick={toggleMute} className="absolute top-4 left-4 z-30 bg-black/40 backdrop-blur-md border border-white/20 text-white p-2 rounded-full hover:bg-black/60 transition-all">
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Video Feed Container */}
      <div 
        ref={containerRef} 
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
      >
        {microLearningVideos.map((video, index) => (
          <div key={video.id} className="relative h-full w-full snap-start snap-always flex items-center justify-center bg-black">
            
            {/* The Video Player */}
            <video
              ref={el => { if (el) videoRefs.current[video.id] = el; }}
              src={video.videoUrl}
              loop
              muted={muted}
              playsInline
              className="h-full w-full object-cover"
            />

            {/* Bottom Gradient for Text Legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

            {/* Video Info (Bottom Left/Right depending on RTL) */}
            <div className="absolute bottom-0 left-0 right-16 p-6 text-white text-right" dir="rtl">
              <h2 className="text-xl font-bold mb-1 drop-shadow-md">{video.title}</h2>
              <p className="text-sm mb-3 opacity-90 drop-shadow-md">{video.description}</p>
              <span className="inline-block bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1 rounded-full text-xs font-semibold">
                {video.hashtag}
              </span>
            </div>

            {/* Floating Action Buttons (Right Edge) */}
            <div className="absolute right-4 bottom-24 flex flex-col gap-4 items-center">
              {/* Profile Pic Placeholder */}
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full border-2 border-white shadow-lg mb-2" />

              {/* Like */}
              <button onClick={() => handleLike(video.id)} className="flex flex-col items-center gap-1 transition-transform active:scale-90">
                <div className={`p-3 rounded-full backdrop-blur-md transition-colors ${videoStates[video.id]?.liked ? 'bg-rose-500/80' : 'bg-black/40'}`}>
                  <Heart className={`w-6 h-6 ${videoStates[video.id]?.liked ? 'fill-white text-white' : 'text-white'}`} />
                </div>
                <span className="text-xs font-bold text-white drop-shadow-md">{videoStates[video.id]?.likeCount || 0}</span>
              </button>

              {/* Save */}
              <button onClick={() => handleSave(video.id)} className="flex flex-col items-center gap-1 transition-transform active:scale-90">
                <div className={`p-3 rounded-full backdrop-blur-md transition-colors ${videoStates[video.id]?.saved ? 'bg-yellow-500/80' : 'bg-black/40'}`}>
                  <Bookmark className={`w-6 h-6 ${videoStates[video.id]?.saved ? 'fill-white text-white' : 'text-white'}`} />
                </div>
                <span className="text-xs font-bold text-white drop-shadow-md">حفظ</span>
              </button>

              {/* Share */}
              <button className="flex flex-col items-center gap-1 transition-transform active:scale-90">
                <div className="p-3 rounded-full backdrop-blur-md bg-black/40">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold text-white drop-shadow-md">نشر</span>
              </button>
            </div>
            
          </div>
        ))}
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