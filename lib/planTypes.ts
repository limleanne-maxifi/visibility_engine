import type { FormData } from '@/lib/types';

export interface PlanStep {
  num: number;
  title: string;
  body: string;
}

export interface Plan {
  steps: PlanStep[];
  quickWin: string;
}

export interface StoredPlan {
  id: string;
  plan: Plan;
  formData: FormData;
  createdAt: string;
}

export interface GenerateResponse {
  id: string;
  plan: Plan;
}

export interface GenerateErrorResponse {
  error: string;
  code: 'VALIDATION_ERROR' | 'PARSE_ERROR' | 'API_ERROR' | 'NOT_FOUND' | 'DATABASE_ERROR' | 'RATE_LIMIT';
}
