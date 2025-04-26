export const PreviewStatus = {
  PENDING: 0,
  PROCESSING: 1,
  DONE: 2,
  ERROR: 3
} as const

export const PreviewPriority = {
  LOW: 0,
  MEDIUM: 100,
  HIGH: 200
} as const
