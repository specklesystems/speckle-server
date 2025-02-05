import type { AvailableRoles } from '@speckle/shared'
import { isObjectLike, has } from 'lodash'
import type { WorkspacePlans } from '~/lib/common/generated/gql/graphql'

type BaseSettingsMenuItem = {
  title: string
  disabled?: boolean
  tooltipText?: string
  permission?: AvailableRoles[]
}

export type GenericSettingsMenuItem = BaseSettingsMenuItem & {
  route: string
}

export type WorkspaceSettingsMenuItem = BaseSettingsMenuItem & {
  name: string
  route: (slug: string) => string
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
