import type { AssessmentCard, RiasecScores } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

/**
 * Fetches assessment cards from HalmanApp backend.
 */
export async function fetchAssessmentCards(): Promise<AssessmentCard[]> {
  const response = await fetch(`${API_BASE_URL}/assessment-cards`);

  if (!response.ok) {
    throw new Error("Failed to fetch assessment cards");
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
