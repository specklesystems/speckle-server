import { HistoryLimits } from '../../limit/domain.js'

export type WorkspaceLimits = {
  projectCount: number | null
  modelCount: number | null
} & HistoryLimits
