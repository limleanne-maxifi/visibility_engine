import type { StoredPlan } from '@/lib/planTypes';

// Module-level singleton — persists for the lifetime of the Node.js process.
// Stage 3 will replace this with Supabase.
const store = new Map<string, StoredPlan>();

export function savePlan(plan: StoredPlan): void {
  store.set(plan.id, plan);
}

export function getPlan(id: string): StoredPlan | undefined {
  return store.get(id);
}
