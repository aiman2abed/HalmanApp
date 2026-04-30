// src/components/CmsVideoManager.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Video,
  Trash2,
  Loader2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchDiscoverVideos, addCMSVideo, deleteCMSVideo } from "@/lib/api";

export default function CmsVideoManager() {
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtag, setHashtag] = useState("");
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadVideos = async () => {
    setIsLoadingList(true);
    try {
      const data = await fetchDiscoverVideos(0, 50); // Fetch top 50 for management
      setVideos(data.videos || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !description || !hashtag) {
      setErrorMsg("الرجاء تعبئة جميع الحقول واختيار فيديو.");
      return;
    }

    setIsUploading(true);
    setErrorMsg("");
    setUploadSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("غير مصرح لك");

      // 1. Upload to Supabase Storage (Direct-to-Storage)
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("discover_media")
        .upload(filePath, file);

      if (uploadError) throw new Error(`فشل رفع الملف: ${uploadError.message}`);

      // 2. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from("discover_media")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // 3. Save to Database via FastAPI
      const payload = {
        title,
        description,
        hashtag: hashtag.startsWith("#") ? hashtag : `#${hashtag}`,
        video_url: publicUrl,
      };

      await addCMSVideo(session.access_token, payload);

      setUploadSuccess(true);
      setFile(null);
      setTitle("");
      setDescription("");
      setHashtag("");
      
      setTimeout(() => setUploadSuccess(false), 3000);
      loadVideos();

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "حدث خطأ غير متوقع");
    } finally {
      setIsUploading(false);
    }
  };

const handleDelete = async (videoId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الفيديو؟")) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // 1. Find the video object in our local state so we can get its URL
      const videoToDelete = videos.find(v => v.id === videoId);
      
      if (videoToDelete && videoToDelete.videoUrl) {
        // Extract the file path from the public URL
        // Example URL: https://[project].supabase.co/storage/v1/object/public/discover_media/videos/1234.mp4
        const urlParts = videoToDelete.videoUrl.split('/discover_media/');
        
        if (urlParts.length === 2) {
          const filePath = urlParts[1]; // this will be "videos/1234.mp4"
          
          // 2. Delete the actual file from Supabase Storage
          const { error: storageError } = await supabase.storage
            .from("discover_media")
            .remove([filePath]);
            
          if (storageError) {
            console.error("Storage deletion error:", storageError);
            // We continue anyway, so the DB row at least gets cleaned up
          }
        }
      }

      // 3. Delete the row from the database via FastAPI
      await deleteCMSVideo(session.access_token, videoId);
      
      // 4. Refresh the list
      loadVideos();
    } catch (err) {
      console.error(err);
      alert("فشل حذف الفيديو");
    }
  };

  return (
    <div className="xl:grid xl:grid-cols-[1fr_1.5fr] xl:gap-6 space-y-6 xl:space-y-0 w-full">
      {/* Upload Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm h-fit">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-800">
          <Upload className="h-5 w-5 text-emerald-500" />
          رفع محتوى جديد
        </h2>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">عنوان الفيديو</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: أساسيات البرمجة 💻"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">الوصف</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب وصفاً مشوقاً..."
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">الهاشتاق (للتصنيف)</label>
            <input
              type="text"
              value={hashtag}
              onChange={(e) => setHashtag(e.target.value)}
              placeholder="#تكنولوجيا"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">ملف الفيديو</label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition-colors hover:border-emerald-400 hover:bg-emerald-50/50">
              <Video className="mb-2 h-8 w-8 text-slate-400" />
              <span className="text-sm font-bold text-slate-600 text-center">
                {file ? file.name : "اضغط لاختيار فيديو (MP4)"}
              </span>
              <input type="file" accept="video/mp4,video/webm" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-600">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-black text-white transition-all active:scale-95 ${
              uploadSuccess ? "bg-emerald-500" : "bg-slate-900 hover:bg-slate-800"
            } disabled:opacity-50`}
          >
            {isUploading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> جاري الرفع...</>
            ) : uploadSuccess ? (
              <><CheckCircle2 className="h-5 w-5" /> تم الرفع بنجاح!</>
            ) : (
              "نشر المحتوى"
            )}
          </button>
        </form>
      </motion.div>

      {/* Existing Videos List */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[600px]">
        <div className="border-b border-slate-100 bg-slate-50/50 p-4 md:p-5">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-800">
            <Sparkles className="h-5 w-5 text-orange-500" />
            إدارة مكتبة "اكتشف"
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
          {isLoadingList ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : videos.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-slate-400">
              <Video className="mb-2 h-10 w-10 opacity-20" />
              <p className="text-sm font-bold">لا يوجد محتوى حالياً</p>
            </div>
          ) : (
            videos.map((vid) => (
              <div key={vid.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 transition-colors hover:border-slate-200">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Video className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-black text-slate-800">{vid.title}</h3>
                  <p className="truncate text-xs font-bold text-emerald-600">{vid.hashtag}</p>
                </div>
                <button
                  onClick={() => handleDelete(vid.id)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-rose-500 shadow-sm transition-colors hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}