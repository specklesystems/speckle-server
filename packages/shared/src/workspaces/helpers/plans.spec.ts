import { describe, expect, it } from 'vitest'
import {
  doesPlanIncludeUnlimitedProjectsAddon,
  isNewWorkspacePlan,
  isSelfServerAvailablePlan,
  WorkspacePlans
} from './plans.js'

describe('plan helpers', () => {
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

  describe('doesPlanIncludeUnlimitedProjectsAddon', () => {
    const planCases: {
      [P in WorkspacePlans]: boolean
    } = <const>{
      business: false,
      businessInvoiced: false,
      plus: false,
      plusInvoiced: false,
      starter: false,
      starterInvoiced: false,
      free: false,
      academia: false,
      unlimited: false,
      pro: false,
      proUnlimited: true,
      proUnlimitedInvoiced: false,
      team: false,
      teamUnlimited: true,
      teamUnlimitedInvoiced: false
    }
    it.each(Object.entries(planCases))(
      'plan %s include the paid unlimited projects addon -> %s',
      (plan, isNew) => {
        const result = doesPlanIncludeUnlimitedProjectsAddon(plan as WorkspacePlans)
        expect(result).toStrictEqual(isNew)
      }
    )
  })

  describe('isSelfServerAvailablePlan', () => {
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
      academia: false,
      unlimited: false,
      pro: true,
      proUnlimited: true,
      proUnlimitedInvoiced: false,
      team: true,
      teamUnlimited: true,
      teamUnlimitedInvoiced: false
    }
    it.each(Object.entries(planCases))(
      'is plan %s available self served -> %s',
      (plan, isNew) => {
        const result = isSelfServerAvailablePlan(plan as WorkspacePlans)
        expect(result).toStrictEqual(isNew)
      }
    )
  })
})
