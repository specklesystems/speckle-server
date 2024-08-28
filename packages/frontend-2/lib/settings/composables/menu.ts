import { settingsQueries } from '~/lib/common/helpers/route'
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
import { useIsMultipleEmailsEnabled } from '~/composables/globals'
import { Roles } from '@speckle/shared'

export const useSettingsMenu = () => {
  const workspaceMenuItems = shallowRef<SettingsMenuItems>({
    general: {
      title: 'General',
      component: SettingsWorkspaceGeneral,
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member, Roles.Workspace.Guest]
    },
    members: {
      title: 'Members',
      component: SettingsWorkspacesMembers,
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member]
    },
    projects: {
      title: 'Projects',
      component: SettingsWorkspacesProjects,
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member]
    },
    security: {
      title: 'Security',
      component: SettingsWorkspacesSecurity,
      permission: [Roles.Workspace.Admin]
    },
    billing: {
      title: 'Billing',
      disabled: true,
      tooltipText: 'Manage billing for your workspace'
    },
    regions: {
      title: 'Regions',
      disabled: true,
      tooltipText: 'Set up regions for custom data residency',
      permission: [Roles.Workspace.Admin]
    }
  })

  const userMenuItemValues: SettingsMenuItems = {
    [settingsQueries.user.profile]: {
      title: 'Profile',
      component: SettingsUserProfile
    },
    [settingsQueries.user.notifications]: {
      title: 'Notifications',
      component: SettingsUserNotifications
    },
    [settingsQueries.user.developerSettings]: {
      title: 'Developer settings',
      component: SettingsUserDeveloper
    }
  }

  const multipleEmailsEnabled = useIsMultipleEmailsEnabled().value
  if (multipleEmailsEnabled) {
    userMenuItemValues[settingsQueries.user.emails] = {
      title: 'Email addresses',
      component: SettingsUserEmails
    }
  }

  const userMenuItems = shallowRef<SettingsMenuItems>(userMenuItemValues)

  const serverMenuItems = shallowRef<SettingsMenuItems>({
    [settingsQueries.server.general]: {
      title: 'General',
      component: SettingsServerGeneral
    },
    [settingsQueries.server.projects]: {
      title: 'Projects',
      component: SettingsServerProjects
    },
    [settingsQueries.server.activeUsers]: {
      title: 'Active users',
      component: SettingsServerActiveUsers
    },
    [settingsQueries.server.pendingInvitations]: {
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
