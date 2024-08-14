import { settingsQueries } from '~/lib/common/helpers/route'
import type { SettingsMenuItems } from '~/lib/settings/helpers/types'
import SettingsUserProfile from '~/components/settings/user/Profile.vue'
import SettingsUserNotifications from '~/components/settings/user/Notifications.vue'
import SettingsUserDeveloper from '~/components/settings/user/Developer.vue'
import SettingsServerGeneral from '~/components/settings/server/General.vue'
import SettingsServerProjects from '~/components/settings/server/Projects.vue'
import SettingsServerActiveUsers from '~/components/settings/server/ActiveUsers.vue'
import SettingsServerPendingInvitations from '~/components/settings/server/PendingInvitations.vue'
import SettingsWorkspaceGeneral from '~/components/settings/workspaces/General.vue'
import SettingsWorkspacesMembers from '~/components/settings/workspaces/Members.vue'
import SettingsWorkspacesProjects from '~/components/settings/workspaces/Projects.vue'

export const useSettingsMenu = () => {
  const workspaceMenuItems = shallowRef<SettingsMenuItems>({
    general: {
      title: 'General',
      component: SettingsWorkspaceGeneral
    },
    members: {
      title: 'Members',
      component: SettingsWorkspacesMembers
    },
    projects: {
      title: 'Projects',
      component: SettingsWorkspacesProjects
    },
    billing: {
      title: 'Billing',
      disabled: true,
      tooltipText: 'Manage billing for your workspace'
    },
    security: {
      title: 'Security',
      disabled: true,
      tooltipText: 'SSO, manage permissions, restrict domain access'
    },
    regions: {
      title: 'Regions',
      disabled: true,
      tooltipText: 'Set up regions for custom data residency'
    }
  })

  const userMenuItems = shallowRef<SettingsMenuItems>({
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
  })

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
