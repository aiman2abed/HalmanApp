// src/lib/api.ts
import type { AssessmentCard, RiasecScores } from "@/types";

// Base URLs
export const API_ROOT_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || `${API_ROOT_URL}/api`;

// ==========================================
// EXISTING ASSESSMENT APIS
// ==========================================

/**
 * Fetches assessment cards from HalmanApp backend.
 */
export async function fetchAssessmentCards(): Promise<AssessmentCard[]> {
  const response = await fetch(`${API_BASE_URL}/assessment-cards`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Backend error details:", response.status, errorText);
    throw new Error("Failed to fetch assessment cards");
  }

  return response.json();
}

/**
 * Sends current scores to fetch new adaptive questions.
 */
export async function fetchAdaptiveQuestions(scores: RiasecScores) {
  const response = await fetch(`${API_BASE_URL}/adaptive-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_scores: scores }),
  });

  if (!response.ok) {
    throw new Error("API Request Failed");
  }

  return response.json();
}

/**
 * Sends RIASEC scores to backend AI analyzer.
 */
export async function submitAssessment(scores: RiasecScores) {
  const response = await fetch(`${API_BASE_URL}/analyze-profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scores),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Backend Error: ${errorData.detail || response.statusText}`,
    );
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

export async function transcribeAudio(audioBlob: Blob) {
  const formData = new FormData();
  formData.append(
    "file",
    audioBlob,
    `voice-note.${audioBlob.type.includes("ogg") ? "ogg" : "webm"}`
  );

  const response = await fetch(`${API_BASE_URL}/transcribe-audio`, {
    method: "POST",
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
  if (!response.ok) {
    throw new Error("Failed to fetch videos");
  }
  return response.json();
}

// ==========================================
// DEVELOPER APIS
// ==========================================

export async function fetchSystemUsers(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/developer/users`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error("فشل جلب المستخدمين");
  }
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
  
  if (!response.ok) {
    throw new Error("فشل تعيين الصلاحية");
  }
  return response;
}