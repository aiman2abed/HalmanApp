// src/lib/api.ts
import { AssessmentCard } from '@/types';

const API_BASE_URL = 'http://localhost:8000/api';

export async function fetchAssessmentCards(): Promise<AssessmentCard[]> {
  const response = await fetch(`${API_BASE_URL}/assessment-cards`);
  if (!response.ok) {
    throw new Error('Failed to fetch assessment cards');
  }
  return response.json();
}

export async function submitAssessment(scores: Record<string, number>) {
  const response = await fetch(`${API_BASE_URL}/analyze-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scores),
  });
  
  if (!response.ok) {
    // Intercept the backend's exact error message
    const errorData = await response.json();
    console.error("Backend Error Payload:", errorData);
    throw new Error(`Backend Error: ${errorData.detail || response.statusText}`);
  }
  
  return response.json();
}