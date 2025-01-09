<template>
  <div class="h-full flex w-[17rem] shrink-0">
    <LayoutSidebar class="border-r border-outline-3 px-2 pt-3 pb-2 bg-foundation-page">
      <LayoutSidebarMenu>
        <LayoutSidebarMenuGroup>
          <NuxtLink :to="homeRoute" class="flex items-center gap-x-1.5 px-2.5">
            <ChevronLeftIcon class="h-3 w-3 text-foreground-2" />
            <p class="text-body-xs font-medium text-foreground">Exit settings</p>
          </NuxtLink>
        </LayoutSidebarMenuGroup>
        <LayoutSidebarMenuGroup title="User settings">
          <template #title-icon>
            <IconAccount class="size-4" />
          </template>
          <NuxtLink
            v-for="(sidebarMenuItem, key) in userMenuItems"
            :key="key"
            :to="sidebarMenuItem.getRoute()"
          >
            <LayoutSidebarMenuGroupItem
              :label="sidebarMenuItem.title"
              :active="route.path === sidebarMenuItem.getRoute()"
            />
          </NuxtLink>
        </LayoutSidebarMenuGroup>
        <LayoutSidebarMenuGroup v-if="isAdmin" title="Server settings">
          <template #title-icon>
            <IconServer class="size-4" />
          </template>
          <NuxtLink
            v-for="(sidebarMenuItem, key) in serverMenuItems"
            :key="key"
            :to="sidebarMenuItem.getRoute()"
          >
            <LayoutSidebarMenuGroupItem
              :label="sidebarMenuItem.title"
              :active="route.path === sidebarMenuItem.getRoute()"
            />
          </NuxtLink>
        </LayoutSidebarMenuGroup>
        <LayoutSidebarMenuGroup v-if="isWorkspacesEnabled" title="Workspace settings">
          <LayoutSidebarMenuGroup
            v-for="(workspaceItem, index) in workspaceItems"
            :key="index"
            :title="workspaceItem.name"
            collapsible
            :collapsed="true"
            :tag="
              workspaceItem.plan?.status === WorkspacePlanStatuses.Trial ||
              !workspaceItem.plan?.status
                ? 'TRIAL'
                : undefined
            "
          >
            <template #title-icon>
              <WorkspaceAvatar
                :logo="workspaceItem.logo"
                :name="workspaceItem.name"
                size="sm"
              />
            </template>
            <NuxtLink
              v-for="(workspaceMenuItem, itemKey) in workspaceMenuItems"
              :key="`${index}-${itemKey}`"
              :to="workspaceMenuItem.getRoute(workspaceItem.slug)"
            >
              <!-- <LayoutSidebarMenuGroupItem
                v-if="workspaceMenuItem.permission?.includes(workspaceItem.role as WorkspaceRoles)"
                :label="workspaceMenuItem.title"
                :tooltip-text="
                  needsSsoSession(workspaceItem, workspaceMenuItem.to)
                    ? 'Log in with your SSO provider to access this page'
                    : workspaceMenuItem.tooltipText
                "
                :disabled="
                  !isAdmin &&
                  (workspaceMenuItem.disabled ||
                    needsSsoSession(workspaceItem, workspaceMenuItem.to))
                "
                class="!pl-8"
                :to="workspaceMenuItem.to"
              /> -->
              <LayoutSidebarMenuGroupItem
                v-if="workspaceMenuItem.permission?.includes(workspaceItem.role as WorkspaceRoles)"
                :label="workspaceMenuItem.title"
                class="!pl-8"
              />
            </NuxtLink>
          </LayoutSidebarMenuGroup>
          <NuxtLink v-if="!isGuest" :to="workspacesRoute">
            <LayoutSidebarMenuGroupItem label="Create workspace">
              <template #icon>
                <PlusIcon class="h-4 w-4 text-foreground-2" />
              </template>
            </LayoutSidebarMenuGroupItem>
          </NuxtLink>
        </LayoutSidebarMenuGroup>
      </LayoutSidebarMenu>
    </LayoutSidebar>
  </div>
</template>

<script setup lang="ts">
import { Roles } from '@speckle/shared'
import { useIsWorkspacesEnabled } from '~/composables/globals'
import { useQuery } from '@vue/apollo-composable'
import { settingsSidebarQuery } from '~/lib/settings/graphql/queries'
import { PlusIcon, ChevronLeftIcon } from '@heroicons/vue/24/outline'
import { useActiveUser } from '~/lib/auth/composables/activeUser'
import { useSettingsMenu } from '~/lib/settings/composables/menu'
import {
  LayoutSidebar,
  LayoutSidebarMenu,
  LayoutSidebarMenuGroup
} from '@speckle/ui-components'
import { graphql } from '~~/lib/common/generated/gql'
import type { WorkspaceRoles } from '@speckle/shared'
import { workspacesRoute, homeRoute } from '~/lib/common/helpers/route'
import { WorkspacePlanStatuses } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment SettingsDialog_Workspace on Workspace {
    ...SettingsMenu_Workspace
    id
    slug
    role
    name
    logo
    plan {
      status
    }
    creationState {
      completed
    }
  }
`)

graphql(`
  fragment SettingsDialog_User on User {
    id
    workspaces {
      items {
        ...SettingsDialog_Workspace
      }
    }
  }
`)

const { activeUser: user } = useActiveUser()
const route = useRoute()
const isWorkspacesEnabled = useIsWorkspacesEnabled()
const { result: workspaceResult } = useQuery(settingsSidebarQuery, null, {
  enabled: isWorkspacesEnabled.value
})
const { userMenuItems, serverMenuItems, workspaceMenuItems } = useSettingsMenu()

const workspaceItems = computed(
  () =>
    workspaceResult.value?.activeUser?.workspaces.items.filter(
      (item) => item.creationState?.completed !== false // Removed workspaces that are not completely created
    ) ?? []
)
const isAdmin = computed(() => user.value?.role === Roles.Server.Admin)
const isGuest = computed(() => user.value?.role === Roles.Server.Guest)

// const needsSsoSession = (workspace: SettingsMenu_WorkspaceFragment, to: string) => {
//   return workspace.sso?.provider?.id && to !== settingsRoutes.workspace.general
//     ? !workspace.sso?.session?.validUntil
//     : false
// }
</script>
