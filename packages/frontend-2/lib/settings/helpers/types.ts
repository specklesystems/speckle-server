import type { AvailableRoles } from '@speckle/shared'
import { isObjectLike, has } from 'lodash'
import type { WorkspacePlans } from '~/lib/common/generated/gql/graphql'

export type SettingsMenuItem = {
  title: string
  component?: ReturnType<typeof defineComponent>
  disabled?: boolean
  tooltipText?: string
  permission?: AvailableRoles[]
}

export type SettingsMenuItems = {
  [key: string]: SettingsMenuItem
}

export const SettingMenuKeys = Object.freeze(<const>{
  User: {
    Profile: 'user/profile',
    Notifications: 'user/notifications',
    DeveloperSettings: 'user/developer-settings',
    Emails: 'user/emails'
  },
  Server: {
    General: 'server/general',
    Projects: 'server/projects',
    ActiveUsers: 'server/active-users',
    PendingInvitations: 'server/pending-invitations',
    Regions: 'server/regions'
  },
  Workspace: {
    General: 'workspace/general',
    Members: 'workspace/members',
    Projects: 'workspace/projects',
    Security: 'workspace/security',
    Billing: 'workspace/billing',
    Regions: 'workspace/regions'
  }
})

export type UserSettingMenuKeys =
  (typeof SettingMenuKeys)['User'][keyof (typeof SettingMenuKeys)['User']]
export type ServerSettingMenuKeys =
  (typeof SettingMenuKeys)['Server'][keyof (typeof SettingMenuKeys)['Server']]
export type WorkspaceSettingMenuKeys =
  (typeof SettingMenuKeys)['Workspace'][keyof (typeof SettingMenuKeys)['Workspace']]

export type AvailableSettingsMenuKeys =
  | UserSettingMenuKeys
  | ServerSettingMenuKeys
  | WorkspaceSettingMenuKeys

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
