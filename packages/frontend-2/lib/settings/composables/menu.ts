import type { SettingsMenuItems } from '~/lib/settings/helpers/types'
import SettingsUserProfile from '~/components/settings/user/Profile.vue'
import SettingsUserNotifications from '~/components/settings/user/Notifications.vue'
import SettingsUserDeveloper from '~/components/settings/user/developer/Developer.vue'
import SettingsUserEmails from '~/components/settings/user/Emails.vue'
import SettingsServerGeneral from '~/components/settings/server/General.vue'
import SettingsServerRegions from '~/components/settings/server/Regions.vue'
import SettingsServerProjects from '~/components/settings/server/Projects.vue'
import SettingsServerMembers from '~/components/settings/server/Members.vue'
import SettingsWorkspaceGeneral from '~/components/settings/workspaces/General.vue'
import SettingsWorkspacesMembers from '~/components/settings/workspaces/Members.vue'
import SettingsWorkspacesSecurity from '~/components/settings/workspaces/Security.vue'
import SettingsWorkspacesProjects from '~/components/settings/workspaces/Projects.vue'
import SettingsWorkspacesBilling from '~/components/settings/workspaces/Billing.vue'
import SettingsWorkspacesRegions from '~/components/settings/workspaces/Regions.vue'
import { useIsMultipleEmailsEnabled } from '~/composables/globals'
import { Roles } from '@speckle/shared'
import { SettingMenuKeys } from '~/lib/settings/helpers/types'
import { useIsMultiregionEnabled } from '~/lib/multiregion/composables/main'
import type { InjectionKey } from 'vue'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsMenu_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

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

export const useSettingsMenu = (
  workspace?: ComputedRef<SettingsMenu_WorkspaceFragment>
) => {
  const isMultipleEmailsEnabled = useIsMultipleEmailsEnabled().value
  const isMultiRegionEnabled = useIsMultiregionEnabled()

  const needsSsoAccess = computed(() => {
    return workspace?.value && workspace.value.sso?.provider?.id
      ? !workspace.value.sso?.session?.validUntil
      : false
  })

  const workspaceMenuItems = shallowRef<SettingsMenuItems>({
    [SettingMenuKeys.Workspace.General]: {
      title: 'General',
      component: SettingsWorkspaceGeneral,
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member, Roles.Workspace.Guest]
    },
    [SettingMenuKeys.Workspace.Members]: {
      title: 'Members',
      component: SettingsWorkspacesMembers,
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member],
      ...(needsSsoAccess.value
        ? {
            disabled: true,
            tooltipText: 'Log in with your SSO provider to access this page'
          }
        : {})
    },
    [SettingMenuKeys.Workspace.Projects]: {
      title: 'Projects',
      component: SettingsWorkspacesProjects,
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member],
      ...(needsSsoAccess.value
        ? {
            disabled: true,
            tooltipText: 'Log in with your SSO provider to access this page'
          }
        : {})
    },
    [SettingMenuKeys.Workspace.Security]: {
      title: 'Security',
      component: SettingsWorkspacesSecurity,
      permission: [Roles.Workspace.Admin],
      ...(needsSsoAccess.value
        ? {
            disabled: true,
            tooltipText: 'Log in with your SSO provider to access this page'
          }
        : {})
    },
    [SettingMenuKeys.Workspace.Billing]: {
      title: 'Billing',
      component: SettingsWorkspacesBilling,
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member],
      ...(needsSsoAccess.value
        ? {
            disabled: true,
            tooltipText: 'Log in with your SSO provider to access this page'
          }
        : {})
    },
    [SettingMenuKeys.Workspace.Regions]: {
      title: 'Data residency',
      component: SettingsWorkspacesRegions,
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member],
      ...(!isMultiRegionEnabled || needsSsoAccess.value
        ? {
            disabled: true,
            tooltipText: isMultiRegionEnabled
              ? 'Data residency management is not enabled on this server'
              : 'Log in with your SSO provider to access this page'
          }
        : {
            disabled: false
          })
    }
  })

  const userMenuItems = shallowRef<SettingsMenuItems>({
    [SettingMenuKeys.User.Profile]: {
      title: 'User profile',
      component: SettingsUserProfile
    },
    ...(isMultipleEmailsEnabled
      ? {
          [SettingMenuKeys.User.Emails]: {
            title: 'Emails',
            component: SettingsUserEmails
          }
        }
      : {}),
    [SettingMenuKeys.User.Notifications]: {
      title: 'Notifications',
      component: SettingsUserNotifications
    },
    [SettingMenuKeys.User.DeveloperSettings]: {
      title: 'Developer',
      component: SettingsUserDeveloper
    }
  })

  const serverMenuItems = shallowRef<SettingsMenuItems>({
    [SettingMenuKeys.Server.General]: {
      title: 'General',
      component: SettingsServerGeneral
    },
    [SettingMenuKeys.Server.ActiveUsers]: {
      title: 'Members',
      component: SettingsServerMembers
    },
    [SettingMenuKeys.Server.Projects]: {
      title: 'Projects',
      component: SettingsServerProjects
    },
    ...(isMultiRegionEnabled
      ? {
          [SettingMenuKeys.Server.Regions]: {
            title: 'Regions',
            component: SettingsServerRegions
          }
        }
      : {})
  })

  return {
    userMenuItems,
    serverMenuItems,
    workspaceMenuItems
  }
}

type MenuState = {
  goToWorkspaceMenuItem: (workspaceId: string, menuTarget: string) => void
}
const MenuStateKey: InjectionKey<MenuState> = Symbol('menuState')

export const useSetupMenuState = (params: MenuState) => {
  const state = params
  provide(MenuStateKey, state)
}

export const useMenuState = () => {
  return inject(MenuStateKey)!
}
