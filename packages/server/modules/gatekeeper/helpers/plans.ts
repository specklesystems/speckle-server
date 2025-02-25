import {
  paidWorkspacePlansNewSchema,
  paidWorkspacePlansOldSchema
} from '@/modules/gatekeeperCore/domain/billing'

export const isNewPlanType = (plan: string): boolean => {
  return paidWorkspacePlansNewSchema.safeParse(plan).success || plan === 'free'
}

export const isOldPlanType = (plan: string): boolean => {
  return paidWorkspacePlansOldSchema.safeParse(plan).success
}
