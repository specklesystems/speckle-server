import type { AvailableRoles } from '@speckle/shared'
import { isObjectLike, has } from 'lodash'
import type { WorkspacePlans } from '~/lib/common/generated/gql/graphql'

export type SettingsMenuItem = {
  title: string
  disabled?: boolean
  tooltipText?: string
  permission?: AvailableRoles[]
  getRoute: (slug?: string) => string
}

export type SettingsMenuItems = {
  [key: string]: SettingsMenuItem
}

export type WorkspacePricingPlans = {
  workspacePricingPlans: {
    workspacePlanInformation: {
      [key: string]: {
        name: WorkspacePlans
      }
    }
  }
}

export function isWorkspacePricingPlans(
  pricingPlans: unknown
): pricingPlans is WorkspacePricingPlans {
  return (
    isObjectLike(pricingPlans) &&
    has(pricingPlans, 'workspacePricingPlans.workspacePlanInformation')
  )
}
