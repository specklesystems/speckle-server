import { HistoryLimits } from '../../../limit/domain.js'

export const PersonalProjectsLimits: HistoryLimits = {
  versionsHistory: {
    value: 1,
    unit: 'week'
  },
  commentHistory: {
    value: 1,
    unit: 'week'
  }
}
