export type WorkspaceLimits = {
  projectCount: number | null
  modelCount: number | null
  versionsHistory: { value: number; unit: 'day' | 'week' | 'month' } | null
}
