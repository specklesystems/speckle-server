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
      getRoute: (slug?: string) =>
        slug ? settingsRoutes.workspace.general.route(slug) : '',
      name: settingsRoutes.workspace.general.name,
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member, Roles.Workspace.Guest]
    },
    {
      title: 'Members',
      getRoute: (slug?: string) =>
        slug ? settingsRoutes.workspace.members.route(slug) : '',
      name: settingsRoutes.workspace.members.name,
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member]
    },
    {
      title: 'Projects',
      getRoute: (slug?: string) =>
        slug ? settingsRoutes.workspace.projects.route(slug) : '',
      name: settingsRoutes.workspace.projects.name,
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member]
    },
    {
      title: 'Security',
      getRoute: (slug?: string) =>
        slug ? settingsRoutes.workspace.security.route(slug) : '',
      name: settingsRoutes.workspace.security.name,
      permission: [Roles.Workspace.Admin]
    },
    {
      title: 'Billing',
      getRoute: (slug?: string) =>
        slug ? settingsRoutes.workspace.billing.route(slug) : '',
      name: settingsRoutes.workspace.billing.name,
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member]
    },
    {
      title: 'Data residency',
      getRoute: (slug?: string) =>
        slug ? settingsRoutes.workspace.regions.route(slug) : '',
      permission: [Roles.Workspace.Admin, Roles.Workspace.Member],
      name: settingsRoutes.workspace.regions.name,
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
      getRoute: () => settingsRoutes.user.profile.route
    },
    {
      title: 'Notifications',
      getRoute: () => settingsRoutes.user.notifications.route
    },
    {
      title: 'Developer',
      getRoute: () => settingsRoutes.user.developerSettings.route
    },
    ...(isMultipleEmailsEnabled
      ? [
          {
            title: 'Emails',
            getRoute: () => settingsRoutes.user.emails.route
          }
        ]
      : [])
  ])

  const serverMenuItems = shallowRef<SettingsMenuItem[]>([
    {
      title: 'General',
      getRoute: () => settingsRoutes.server.general.route
    },
    {
      title: 'Members',
      getRoute: () => settingsRoutes.server.members.route
    },
    {
      title: 'Projects',
      getRoute: () => settingsRoutes.server.projects.route
    },
    ...(isMultiRegionEnabled
      ? [
          {
            title: 'Regions',
            getRoute: () => settingsRoutes.server.regions.route
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
