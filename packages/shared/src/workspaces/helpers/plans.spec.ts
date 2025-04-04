import { describe, expect, it } from 'vitest'
import { isNewWorkspacePlan, WorkspacePlans } from './plans.js'

describe('isNewWorkspacePlan', () => {
  const planCases: {
    [P in WorkspacePlans]: boolean
  } = <const>{
    business: false,
    businessInvoiced: false,
    plus: false,
    plusInvoiced: false,
    starter: false,
    starterInvoiced: false,
    free: true,
    academia: true,
    unlimited: true,
    pro: true,
    proUnlimited: true,
    proUnlimitedInvoiced: true,
    team: true,
    teamUnlimited: true,
    teamUnlimitedInvoiced: true
  }
  it.each(Object.entries(planCases))('plan %s is new type -> %s', (plan, isNew) => {
    const result = isNewWorkspacePlan(plan as WorkspacePlans)
    expect(result).toStrictEqual(isNew)
  })
})
