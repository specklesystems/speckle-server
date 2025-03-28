import {
  WorkspaceUserActionTypes,
  type GenericSettingsMenuItem,
  type WorkspaceSettingsMenuItem
} from '~/lib/settings/helpers/types'
import { useIsMultipleEmailsEnabled, useActiveUser } from '~/composables/globals'
import { Roles, SeatTypes, type MaybeNullOrUndefined } from '@speckle/shared'
import type { UserItem } from '~/components/settings/workspaces/members/new/MembersTable.vue'
import { useIsMultiregionEnabled } from '~/lib/multiregion/composables/main'
import { graphql } from '~/lib/common/generated/gql'
import {
  settingsWorkspaceRoutes,
  settingsUserRoutes,
  settingsServerRoutes
} from '~/lib/common/helpers/route'
import type { LayoutMenuItem } from '@speckle/ui-components'

graphql(`
  fragment SettingsMenu_Workspace on Workspace {
    id
    sso {
      provider {
        id
      }
      session {
        validUntil
      }
    }
  }
`)

export const useSettingsMenu = () => {
  const isMultipleEmailsEnabled = useIsMultipleEmailsEnabled().value
  const isMultiRegionEnabled = useIsMultiregionEnabled()

  const workspaceMenuItems = shallowRef<WorkspaceSettingsMenuItem[]>([
    {
      title: 'General',
      name: settingsWorkspaceRoutes.general.name,
      route: (slug: string) => settingsWorkspaceRoutes.general.route(slug),
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member, Roles.Workspace.Guest]
    },
    {
      title: 'People',
      name: settingsWorkspaceRoutes.members.name,
      route: (slug: string) => settingsWorkspaceRoutes.members.route(slug),
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member]
    },
    {
      title: 'Projects',
      name: settingsWorkspaceRoutes.projects.name,
      route: (slug: string) => settingsWorkspaceRoutes.projects.route(slug),
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member]
    },
    {
      title: 'Security',
      name: settingsWorkspaceRoutes.security.name,
      route: (slug: string) => settingsWorkspaceRoutes.security.route(slug),
      permission: [Roles.Workspace.Admin]
    },
    {
      title: 'Billing',
      name: settingsWorkspaceRoutes.billing.name,
      route: (slug: string) => settingsWorkspaceRoutes.billing.route(slug),
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member]
    },
    {
      title: 'Data residency',
      name: settingsWorkspaceRoutes.regions.name,
      route: (slug: string) => settingsWorkspaceRoutes.regions.route(slug),
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member],
      ...(!isMultiRegionEnabled
        ? {
            disabled: true,
            tooltipText: 'Data residency management is not enabled on this server'
          }
        : {
            disabled: false
          })
    }
  ])

  const userMenuItems = shallowRef<GenericSettingsMenuItem[]>([
    {
      title: 'Profile',
      route: settingsUserRoutes.profile
    },
    {
      title: 'Notifications',
      route: settingsUserRoutes.notifications
    },
    {
      title: 'Developer',
      route: settingsUserRoutes.developerSettings
    },
    ...(isMultipleEmailsEnabled
      ? [
          {
            title: 'Emails',
            route: settingsUserRoutes.emails
          }
        ]
      : [])
  ])

  const serverMenuItems = shallowRef<GenericSettingsMenuItem[]>([
    {
      title: 'General',
      route: settingsServerRoutes.general
    },
    {
      title: 'Members',
      route: settingsServerRoutes.members
    },
    {
      title: 'Projects',
      route: settingsServerRoutes.projects
    },
    ...(isMultiRegionEnabled
      ? [
          {
            title: 'Regions',
            route: settingsServerRoutes.regions
          }
        ]
      : [])
  ])

  return {
    userMenuItems,
    serverMenuItems,
    workspaceMenuItems
  }
}

export const useSettingsMenuState = () =>
  useState<{
    previousRoute: string | undefined
  }>('settings-menu-state', () => ({
    previousRoute: undefined
  }))

export const useSettingsMembersActions = (params: {
  workspaceRole?: MaybeNullOrUndefined<string>
  targetUser: UserItem
}) => {
  const { activeUser } = useActiveUser()

  const targetUserRole = computed(() => {
    return params.targetUser.role
  })

  const targetUserSeatType = computed(() => params.targetUser.seatType)

  const isActiveUserWorkspaceAdmin = computed(
    () => params.workspaceRole === Roles.Workspace.Admin
  )

  const isActiveUserTargetUser = computed(
    () => activeUser.value?.id === params.targetUser.id
  )

  const canModifyUser = computed(
    () => isActiveUserWorkspaceAdmin.value && !isActiveUserTargetUser.value
  )

  const canMakeAdmin = computed(
    () => canModifyUser.value && targetUserRole.value === Roles.Workspace.Member
  )

  const canRemoveAdmin = computed(
    () => canModifyUser.value && targetUserRole.value === Roles.Workspace.Admin
  )

  const canMakeGuest = computed(
    () =>
      canModifyUser.value &&
      targetUserRole.value !== Roles.Workspace.Guest &&
      targetUserRole.value !== Roles.Workspace.Admin
  )

  const canMakeMember = computed(
    () => canModifyUser.value && targetUserRole.value === Roles.Workspace.Guest
  )

  const canUpgradeEditor = computed(
    () => canModifyUser.value && targetUserSeatType.value === SeatTypes.Viewer
  )

  const canDowngradeEditor = computed(
    () =>
      canModifyUser.value &&
      targetUserSeatType.value === SeatTypes.Editor &&
      targetUserRole.value !== Roles.Workspace.Admin
  )

  const canRemoveFromWorkspace = computed(
    () => canModifyUser.value && targetUserRole.value !== Roles.Workspace.Admin
  )

  const canLeaveWorkspace = computed(() => isActiveUserTargetUser.value)

  const canResignAdmin = computed(
    () => isActiveUserTargetUser.value && isActiveUserWorkspaceAdmin.value
  )

  const actionItems = computed(() => {
    const mainItems: LayoutMenuItem[] = []
    const footerItems: LayoutMenuItem[] = []

    if (canMakeAdmin.value) {
      mainItems.push({
        title: 'Make admin...',
        id: WorkspaceUserActionTypes.MakeAdmin
      })
    }
    if (canMakeGuest.value) {
      mainItems.push({
        title: 'Make guest...',
        id: WorkspaceUserActionTypes.MakeGuest
      })
    }
    if (canMakeMember.value) {
      mainItems.push({
        title: 'Make member...',
        id: WorkspaceUserActionTypes.MakeMember
      })
    }
    if (canUpgradeEditor.value) {
      mainItems.push({
        title: 'Upgrade to editor...',
        id: WorkspaceUserActionTypes.UpgradeEditor
      })
    }
    if (canDowngradeEditor.value) {
      mainItems.push({
        title: 'Downgrade to viewer...',
        id: WorkspaceUserActionTypes.DowngradeEditor
      })
    }

    if (canRemoveAdmin.value) {
      footerItems.push({
        title: 'Remove admin...',
        id: WorkspaceUserActionTypes.RemoveAdmin
      })
    }
    if (canResignAdmin.value) {
      footerItems.push({
        title: 'Resign as admin...',
        id: WorkspaceUserActionTypes.ResignAdmin
      })
    }
    if (canRemoveFromWorkspace.value) {
      footerItems.push({
        title: 'Remove from workspace...',
        id: WorkspaceUserActionTypes.RemoveFromWorkspace
      })
    }
    if (canLeaveWorkspace.value) {
      footerItems.push({
        title: 'Leave workspace...',
        id: WorkspaceUserActionTypes.LeaveWorkspace
      })
    }

    const result: LayoutMenuItem[][] = []
    if (mainItems.length) result.push(mainItems)
    if (footerItems.length) result.push(footerItems)
    return result
  })

  return {
    actionItems,
    isActiveUserWorkspaceAdmin,
    isActiveUserTargetUser,
    canMakeAdmin,
    canRemoveAdmin,
    canMakeGuest,
    canMakeMember,
    canUpgradeEditor,
    canDowngradeEditor,
    canRemoveFromWorkspace,
    canLeaveWorkspace,
    canResignAdmin
  }
}
