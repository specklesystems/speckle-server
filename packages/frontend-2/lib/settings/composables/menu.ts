import type { SettingsMenuItems } from '~/lib/settings/helpers/types'
import SettingsUserProfile from '~/components/settings/user/Profile.vue'
import SettingsUserNotifications from '~/components/settings/user/Notifications.vue'
import SettingsUserDeveloper from '~/components/settings/user/Developer.vue'
import SettingsUserEmails from '~/components/settings/user/Emails.vue'
import SettingsServerGeneral from '~/components/settings/server/General.vue'
import SettingsServerProjects from '~/components/settings/server/Projects.vue'
import SettingsServerActiveUsers from '~/components/settings/server/ActiveUsers.vue'
import SettingsServerPendingInvitations from '~/components/settings/server/PendingInvitations.vue'
import SettingsWorkspaceGeneral from '~/components/settings/workspaces/General.vue'
import SettingsWorkspacesMembers from '~/components/settings/workspaces/Members.vue'
import SettingsWorkspacesSecurity from '~/components/settings/workspaces/Security.vue'
import SettingsWorkspacesProjects from '~/components/settings/workspaces/Projects.vue'
import SettingsWorkspacesBilling from '~/components/settings/workspaces/Billing.vue'
import { useIsMultipleEmailsEnabled } from '~/composables/globals'
import { Roles } from '@speckle/shared'
import { SettingMenuKeys } from '~/lib/settings/helpers/types'

export const useSettingsMenu = () => {
  const workspaceMenuItems = shallowRef<SettingsMenuItems>({
    [SettingMenuKeys.Workspace.General]: {
      title: 'General',
      component: SettingsWorkspaceGeneral,
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member, Roles.Workspace.Guest]
    },
    [SettingMenuKeys.Workspace.Members]: {
      title: 'Members',
      component: SettingsWorkspacesMembers,
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member]
    },
    [SettingMenuKeys.Workspace.Projects]: {
      title: 'Projects',
      component: SettingsWorkspacesProjects,
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member]
    },
    [SettingMenuKeys.Workspace.Security]: {
      title: 'Security',
      component: SettingsWorkspacesSecurity,
      permission: [Roles.Workspace.Admin]
    },
    [SettingMenuKeys.Workspace.Billing]: {
      title: 'Billing',
      component: SettingsWorkspacesBilling,
      permission: [Roles.Workspace.Admin]
    },
    [SettingMenuKeys.Workspace.Regions]: {
      title: 'Regions',
      disabled: true,
      tooltipText: 'Set up regions for custom data residency',
      permission: [Roles.Workspace.Admin]
    }
  })

  const multipleEmailsEnabled = useIsMultipleEmailsEnabled().value

  const userMenuItemValues: SettingsMenuItems = {
    [SettingMenuKeys.User.Profile]: {
      title: 'User profile',
      component: SettingsUserProfile
    }
  }

  if (multipleEmailsEnabled) {
    userMenuItemValues[SettingMenuKeys.User.Emails] = {
      title: 'Emails',
      component: SettingsUserEmails
    }
  }

  Object.assign(userMenuItemValues, {
    [SettingMenuKeys.User.Notifications]: {
      title: 'Notifications',
      component: SettingsUserNotifications
    },
    [SettingMenuKeys.User.DeveloperSettings]: {
      title: 'Developer',
      component: SettingsUserDeveloper
    }
  })

  const userMenuItems = shallowRef<SettingsMenuItems>(userMenuItemValues)

  const serverMenuItems = shallowRef<SettingsMenuItems>({
    [SettingMenuKeys.Server.General]: {
      title: 'General',
      component: SettingsServerGeneral
    },
    [SettingMenuKeys.Server.Projects]: {
      title: 'Projects',
      component: SettingsServerProjects
    },
    [SettingMenuKeys.Server.ActiveUsers]: {
      title: 'Active users',
      component: SettingsServerActiveUsers
    },
    [SettingMenuKeys.Server.PendingInvitations]: {
      title: 'Pending invitations',
      component: SettingsServerPendingInvitations
    }
  })

  return {
    userMenuItems,
    serverMenuItems,
    workspaceMenuItems
  }
}
