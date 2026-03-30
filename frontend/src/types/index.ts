/**
 * Shared domain types for HalmanApp frontend modules.
 */

export interface AssessmentCard {
  id: string;
  prompt_text: string;
  primary_trait: string;
  image_url?: string | null;
}

export interface RiasecScores {
  Realistic: number;
  Investigative: number;
  Artistic: number;
  Social: number;
  Enterprising: number;
  Conventional: number;
}
