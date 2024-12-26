import type { SettingsMenuItem } from '~/lib/settings/helpers/types'
import { useIsMultipleEmailsEnabled } from '~/composables/globals'
import { Roles } from '@speckle/shared'
import { useIsMultiregionEnabled } from '~/lib/multiregion/composables/main'
import type { InjectionKey } from 'vue'
import { graphql } from '~/lib/common/generated/gql'
import { settingsRoutes } from '~/lib/common/helpers/route'

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

  const workspaceMenuItems = shallowRef<SettingsMenuItem[]>([
    {
      title: 'General',
      to: settingsRoutes.workspace.general,
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member, Roles.Workspace.Guest]
    },
    {
      title: 'Members',
      to: settingsRoutes.workspace.members,
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member]
    },
    {
      title: 'Projects',
      to: settingsRoutes.workspace.projects,
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member]
    },
    {
      title: 'Security',
      to: settingsRoutes.workspace.security,
      permission: [Roles.Workspace.Admin]
    },
    {
      title: 'Billing',
      to: settingsRoutes.workspace.billing,
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member]
    },
    {
      title: 'Data residency',
      to: settingsRoutes.workspace.regions,
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

  const userMenuItems = shallowRef<SettingsMenuItem[]>([
    {
      title: 'Profile',
      to: settingsRoutes.user.profile
    },
    {
      title: 'Notifications',
      to: settingsRoutes.user.notifications
    },
    {
      title: 'Developer',
      to: settingsRoutes.user.developerSettings
    },
    ...(isMultipleEmailsEnabled
      ? [
          {
            title: 'Emails',
            to: settingsRoutes.user.emails
          }
        ]
      : [])
  ])

  const serverMenuItems = shallowRef<SettingsMenuItem[]>([
    {
      title: 'General',
      to: settingsRoutes.server.general
    },
    {
      title: 'Members',
      to: settingsRoutes.server.members
    },
    {
      title: 'Projects',
      to: settingsRoutes.server.projects
    },
    ...(isMultiRegionEnabled
      ? [
          {
            title: 'Regions',
            to: settingsRoutes.server.regions
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
