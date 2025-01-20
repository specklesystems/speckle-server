import type {
  GenericSettingsMenuItem,
  WorkspaceSettingsMenuItem
} from '~/lib/settings/helpers/types'
import { useIsMultipleEmailsEnabled } from '~/composables/globals'
import { Roles } from '@speckle/shared'
import { useIsMultiregionEnabled } from '~/lib/multiregion/composables/main'
import { graphql } from '~/lib/common/generated/gql'
import {
  settingsWorkspaceRoutes,
  settingsUserRoutes,
  settingsServerRoutes
} from '~/lib/common/helpers/route'

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
      title: 'Members',
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
