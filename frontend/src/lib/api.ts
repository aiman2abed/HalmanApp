// src/lib/api.ts
import type { AssessmentCard, RiasecScores } from "@/types";

// Base URLs
export const API_ROOT_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || `${API_ROOT_URL}/api`;

// ==========================================
// EXISTING ASSESSMENT APIS
// ==========================================

export async function fetchAssessmentCards(): Promise<AssessmentCard[]> {
  const response = await fetch(`${API_BASE_URL}/assessment-cards`);
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Backend error details:", response.status, errorText);
    throw new Error("Failed to fetch assessment cards");
  }
  return response.json();
}

export async function fetchAdaptiveQuestions(scores: RiasecScores) {
  const response = await fetch(`${API_BASE_URL}/adaptive-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_scores: scores }),
  });
  if (!response.ok) throw new Error("API Request Failed");
  return response.json();
}

export async function submitAssessment(scores: RiasecScores) {
  const response = await fetch(`${API_BASE_URL}/analyze-profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scores),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Backend Error: ${errorData.detail || response.statusText}`);
  }
  return response.json();
}

// ==========================================
// ASSISTANT APIS
// ==========================================

export async function sendChatMessage(payload: {
  user_message: string;
  student_name: string;
  dominant_trait: string;
  history: { role: string; text: string }[];
}) {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to reach backend");
  return response.json();
}

// Fixed: Added accessToken, Authorization header, and changed "file" to "audio"
export async function transcribeAudio(accessToken: string, audioBlob: Blob) {
  const formData = new FormData();
  formData.append(
    "audio", 
    audioBlob,
    `voice-note.${audioBlob.type.includes("ogg") ? "ogg" : "webm"}`
  );

  const response = await fetch(`${API_BASE_URL}/transcribe-audio`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });
  if (!response.ok) throw new Error("Audio transcription request failed");
  return response.json();
}

export async function initLiveSession() {
  const response = await fetch(`${API_BASE_URL}/live/session`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed live bootstrap");
  return response.json();
}

export async function analyzeMediaFile(
  blob: Blob,
  sourceName: string,
  isAudio: boolean
) {
  const endpoint = isAudio ? "/analyze-audio" : "/analyze-video";
  const form = new FormData();
  form.append("file", blob, sourceName);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) throw new Error("Analyzer request failed");
  return response.json();
}

// ==========================================
// DISCOVER APIS
// ==========================================

export async function fetchDiscoverVideos(skip: number, limit: number = 3) {
  const response = await fetch(`${API_BASE_URL}/discover/videos?skip=${skip}&limit=${limit}`);
  if (!response.ok) throw new Error("Failed to fetch videos");
  return response.json();
}

export async function toggleLikeVideo(accessToken: string, videoId: string) {
  const response = await fetch(`${API_BASE_URL}/discover/like`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ video_id: videoId }),
  });
  if (!response.ok) throw new Error("فشل تسجيل الإعجاب");
  return response.json();
}

export async function toggleSaveVideo(accessToken: string, videoId: string) {
  const response = await fetch(`${API_BASE_URL}/discover/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ video_id: videoId }),
  });
  if (!response.ok) throw new Error("فشل حفظ الفيديو");
  return response.json();
}

export async function recordVideoWatch(accessToken: string, videoId: string) {
  const response = await fetch(`${API_BASE_URL}/discover/watch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ video_id: videoId }),
  });
  return response.json();
}

// ==========================================
// DASHBOARD APIS
// ==========================================

export async function fetchSystemUsers(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/developer/users`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("فشل جلب المستخدمين");
  return response.json();
}

export async function assignUserRole(
  accessToken: string,
  targetUserId: string,
  role: string,
  scopeType: string,
  scopeId: string | null
) {
  const response = await fetch(`${API_BASE_URL}/developer/assign-role`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      target_user_id: targetUserId,
      role,
      scope_type: scopeType,
      scope_id: scopeId,
    }),
  });
  if (!response.ok) throw new Error("فشل تعيين الصلاحية");
  return response;
}

export async function addCMSVideo(
  accessToken: string,
  payload: { title: string; description: string; hashtag: string; video_url: string }
) {
  const response = await fetch(`${API_BASE_URL}/cms/videos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("فشل إضافة الفيديو");
  return response.json();
}

export async function deleteCMSVideo(accessToken: string, videoId: string) {
  const response = await fetch(`${API_BASE_URL}/cms/videos/${videoId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) throw new Error("فشل حذف الفيديو");
  return response.json();
}

export async function fetchTeacherStudents(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/teacher/students`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("فشل جلب بيانات الطلاب");
  return response.json();
}

export async function fetchFamilyChildren(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/family/children`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("فشل جلب بيانات الأبناء");
  return response.json();
}

export async function submitSuggestion(accessToken: string, payload: { student_id: string; type: string; description: string }) {
  const response = await fetch(`${API_BASE_URL}/suggestions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("فشل إرسال الاقتراح");
  return response.json();
}

export async function fetchAdminSuggestions(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/admin/suggestions`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("فشل جلب الاقتراحات");
  return response.json();
}

export async function updateSuggestionStatus(accessToken: string, suggestionId: string, status: "approved" | "rejected") {
  const response = await fetch(`${API_BASE_URL}/admin/suggestions/${suggestionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("فشل تحديث حالة الاقتراح");
  return response.json();
}