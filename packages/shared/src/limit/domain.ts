export type HistoryLimit = { value: number; unit: 'day' | 'week' | 'month' }

export type HistoryLimits = Record<HistoryLimitTypes, HistoryLimit | null>

export const HistoryLimitTypes = {
  versionsHistory: 'versionsHistory',
  commentHistory: 'commentHistory'
} as const

export type HistoryLimitTypes =
  (typeof HistoryLimitTypes)[keyof typeof HistoryLimitTypes]

export type GetHistoryLimits = () => Promise<HistoryLimits | null>
