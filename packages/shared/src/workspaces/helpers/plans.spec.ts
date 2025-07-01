import { describe, expect, it } from 'vitest'
import {
  doesPlanIncludeUnlimitedProjectsAddon,
  isSelfServeAvailablePlan,
  WorkspacePlans
} from './plans.js'

describe('plan helpers', () => {
  describe('doesPlanIncludeUnlimitedProjectsAddon', () => {
    const planCases: {
      [P in WorkspacePlans]: boolean
    } = <const>{
      free: false,
      academia: false,
      unlimited: false,
      pro: false,
      proUnlimited: true,
      proUnlimitedInvoiced: false,
      team: false,
      teamUnlimited: true,
      teamUnlimitedInvoiced: false,
      enterprise: false
    }
    it.each(Object.entries(planCases))(
      'plan %s include the paid unlimited projects addon -> %s',
      (plan, isNew) => {
        const result = doesPlanIncludeUnlimitedProjectsAddon(plan as WorkspacePlans)
        expect(result).toStrictEqual(isNew)
      }
    )
  })

  describe('isSelfServeAvailablePlan', () => {
    const planCases: {
      [P in WorkspacePlans]: boolean
    } = <const>{
      free: true,
      academia: false,
      unlimited: false,
      pro: true,
      proUnlimited: true,
      proUnlimitedInvoiced: false,
      team: true,
      teamUnlimited: true,
      teamUnlimitedInvoiced: false,
      enterprise: false
    }
    it.each(Object.entries(planCases))(
      'is plan %s available self served -> %s',
      (plan, isNew) => {
        const result = isSelfServeAvailablePlan(plan as WorkspacePlans)
        expect(result).toStrictEqual(isNew)
      }
    )
  })
})
