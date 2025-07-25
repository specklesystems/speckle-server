import {
  WorkspaceUserActionTypes,
  type GenericSettingsMenuItem,
  type WorkspaceSettingsMenuItem
} from '~/lib/settings/helpers/types'
import { useIsMultipleEmailsEnabled, useActiveUser } from '~/composables/globals'
import { Roles, SeatTypes, type MaybeNullOrUndefined } from '@speckle/shared'
import { useIsMultiregionEnabled } from '~/lib/multiregion/composables/main'
import { graphql } from '~/lib/common/generated/gql'
import {
  settingsWorkspaceRoutes,
  settingsUserRoutes,
  settingsServerRoutes
} from '~/lib/common/helpers/route'
import type { LayoutMenuItem } from '@speckle/ui-components'
import type { SettingsWorkspacesMembersActionsMenu_UserFragment } from '~/lib/common/generated/gql/graphql'
import { useWorkspaceLastAdminCheck } from '~/lib/workspaces/composables/management'
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'

graphql(`
  fragment SettingsMenu_Workspace on Workspace {
    id
    slug
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
  const isAutomateEnabled = useIsAutomateModuleEnabled()
  const isMultipleEmailsEnabled = useIsMultipleEmailsEnabled().value
  const isMultiRegionEnabled = useIsMultiregionEnabled()

  const workspaceMenuItems = shallowRef<WorkspaceSettingsMenuItem[]>([
    {
      title: 'General',
      name: settingsWorkspaceRoutes.general.name,
      route: (slug?: string) => settingsWorkspaceRoutes.general.route(slug),
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member, Roles.Workspace.Guest]
    },
    {
      title: 'People',
      name: settingsWorkspaceRoutes.members.name,
      route: (slug?: string) => settingsWorkspaceRoutes.members.route(slug),
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member]
    },
    {
      title: 'Projects',
      name: settingsWorkspaceRoutes.projects.name,
      route: (slug?: string) => settingsWorkspaceRoutes.projects.route(slug),
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member]
    },
    ...(isAutomateEnabled.value
      ? [
          {
            title: 'Automation',
            name: settingsWorkspaceRoutes.automation.name,
            route: (slug?: string) => settingsWorkspaceRoutes.automation.route(slug),
            permission: [Roles.Workspace.Admin, Roles.Workspace.Member]
          }
        ]
      : []),
    {
      title: 'Security',
      name: settingsWorkspaceRoutes.security.name,
      route: (slug?: string) => settingsWorkspaceRoutes.security.route(slug),
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member]
    },
    {
      title: 'Billing',
      name: settingsWorkspaceRoutes.billing.name,
      route: (slug?: string) => settingsWorkspaceRoutes.billing.route(slug),
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member]
    },
    {
      title: 'Data residency',
      name: settingsWorkspaceRoutes.regions.name,
      route: (slug?: string) => settingsWorkspaceRoutes.regions.route(slug),
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
  workspaceRole: ComputedRef<MaybeNullOrUndefined<string>>
  workspaceSlug: ComputedRef<MaybeNullOrUndefined<string>>
  targetUser: ComputedRef<SettingsWorkspacesMembersActionsMenu_UserFragment>
}) => {
  const { activeUser } = useActiveUser()

  const { isLastAdmin } = useWorkspaceLastAdminCheck({
    workspaceSlug: computed(() => params.workspaceSlug.value)
  })

  const { statusIsCanceled } = useWorkspacePlan(params.workspaceSlug.value || '')

  const targetUserRole = computed(() => {
    return params.targetUser.value.role
  })

  const targetUserSeatType = computed(() => params.targetUser.value.seatType)

  const isActiveUserWorkspaceAdmin = computed(
    () => params.workspaceRole.value === Roles.Workspace.Admin
  )

  const isOnlyAdmin = computed(
    () => isLastAdmin.value && isActiveUserWorkspaceAdmin.value
  )

  const isActiveUserTargetUser = computed(
    () => activeUser.value?.id === params.targetUser.value.id
  )

  const canModifyUser = computed(
    () => isActiveUserWorkspaceAdmin.value && !isActiveUserTargetUser.value
  )

  const showMakeAdmin = computed(
    () => canModifyUser.value && targetUserRole.value === Roles.Workspace.Member
  )

  const showRemoveAdmin = computed(
    () => canModifyUser.value && targetUserRole.value === Roles.Workspace.Admin
  )

  const showMakeGuest = computed(
    () => canModifyUser.value && targetUserRole.value === Roles.Workspace.Member
  )

  const showMakeMember = computed(
    () => canModifyUser.value && targetUserRole.value === Roles.Workspace.Guest
  )

  const showUpgradeEditor = computed(
    () => canModifyUser.value && targetUserSeatType.value === SeatTypes.Viewer
  )

  const showDowngradeEditor = computed(
    () => canModifyUser.value && targetUserSeatType.value === SeatTypes.Editor
  )

  const showRemoveFromWorkspace = computed(() => canModifyUser.value)

  const showLeaveWorkspace = computed(() => isActiveUserTargetUser.value)

  // const showUpdateProjectPermissions = computed(() => canModifyUser.value)

  const actionItems = computed(() => {
    const headerItems: LayoutMenuItem[] = []
    const mainItems: LayoutMenuItem[] = []
    const footerItems: LayoutMenuItem[] = []

    if (showMakeAdmin.value) {
      mainItems.push({
        title: 'Make admin...',
        id: WorkspaceUserActionTypes.MakeAdmin
      })
    }
    if (showRemoveAdmin.value) {
      mainItems.push({
        title: 'Revoke admin access...',
        id: WorkspaceUserActionTypes.RemoveAdmin,
        disabled: isOnlyAdmin.value,
        disabledTooltip: 'There must be at least one admin in this workspace'
      })
    }
    if (showMakeGuest.value) {
      mainItems.push({
        title: 'Make guest...',
        id: WorkspaceUserActionTypes.MakeGuest,
        disabled: targetUserRole.value === Roles.Workspace.Admin,
        disabledTooltip: 'Admins must be on an Member seat'
      })
    }
    if (showMakeMember.value) {
      mainItems.push({
        title: 'Make member...',
        id: WorkspaceUserActionTypes.MakeMember
      })
    }
    if (showUpgradeEditor.value) {
      headerItems.push({
        title: 'Upgrade to editor...',
        id: WorkspaceUserActionTypes.UpgradeEditor,
        disabled: statusIsCanceled.value,
        disabledTooltip: 'This workspace has a canceled plan'
      })
    }
    if (showDowngradeEditor.value) {
      headerItems.push({
        title: 'Downgrade to viewer...',
        id: WorkspaceUserActionTypes.DowngradeEditor,
        disabled:
          targetUserRole.value === Roles.Workspace.Admin || statusIsCanceled.value,
        disabledTooltip: statusIsCanceled.value
          ? 'This workspace has a canceled plan'
          : 'Admins must be on an Editor seat'
      })
    }
    // This will return post new workspace plan launch
    // if (showUpdateProjectPermissions.value) {
    //   mainItems.push({
    //     title: 'Manage project access...',
    //     id: WorkspaceUserActionTypes.UpdateProjectPermissions,
    //     disabled: params.targetUser.value.projectRoles.length === 0,
    //     disabledTooltip: 'User is not in any projects'
    //   })
    // }

    if (showRemoveFromWorkspace.value) {
      footerItems.push({
        title: 'Remove from workspace...',
        id: WorkspaceUserActionTypes.RemoveFromWorkspace,
        disabled: isOnlyAdmin.value && targetUserRole.value === Roles.Workspace.Admin,
        disabledTooltip: 'There must be at least one admin in this workspace'
      })
    }
    if (showLeaveWorkspace.value) {
      footerItems.push({
        title: 'Leave workspace...',
        id: WorkspaceUserActionTypes.LeaveWorkspace,
        disabled: isOnlyAdmin.value,
        disabledTooltip: 'You are the only admin of this workspace'
      })
    }

    const result: LayoutMenuItem[][] = []
    if (headerItems.length) result.push(headerItems)
    if (mainItems.length) result.push(mainItems)
    if (footerItems.length) result.push(footerItems)
    return result
  })

  return {
    actionItems,
    isActiveUserWorkspaceAdmin,
    isActiveUserTargetUser,
    showMakeAdmin,
    showRemoveAdmin,
    showMakeGuest,
    showMakeMember,
    showUpgradeEditor,
    showDowngradeEditor,
    showRemoveFromWorkspace,
    showLeaveWorkspace
  }
}
