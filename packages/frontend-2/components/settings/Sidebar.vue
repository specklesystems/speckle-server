<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="group">
    <div
      class="lg:hidden absolute inset-0 backdrop-blur-sm z-40 transition-all"
      :class="isOpenMobile ? 'opacity-100' : 'opacity-0 pointer-events-none'"
      @click="isOpenMobile = false"
    />
    <Portal to="mobile-navigation">
      <div class="lg:hidden flex items-center justify-between">
        <FormButton
          :color="isOpenMobile ? 'outline' : 'subtle'"
          size="sm"
          class="mt-px"
          @click="isOpenMobile = !isOpenMobile"
        >
          <IconSidebar v-if="!isOpenMobile" class="h-4 w-4 -ml-1 -mr-1" />
          <IconSidebarClose v-else class="h-4 w-4 -ml-1 -mr-1" />
        </FormButton>

        <NuxtLink :to="homeRoute" class="flex items-center gap-x-1 pl-0.5">
          <ChevronLeftIcon class="h-4 w-4 text-foreground-2" />
          <p class="text-body-xs font-medium text-foreground">Settings</p>
        </NuxtLink>
      </div>
    </Portal>
    <div
      class="absolute z-40 lg:static h-full flex w-[17rem] shrink-0 transition-all"
      :class="isOpenMobile ? '' : '-translate-x-[17rem] lg:translate-x-0'"
    >
      <LayoutSidebar
        class="border-r border-outline-3 px-2 pt-3 pb-2 bg-foundation-page"
      >
        <LayoutSidebarMenu>
          <LayoutSidebarMenuGroup v-if="!isMobile">
            <NuxtLink :to="homeRoute" class="items-center gap-x-1.5 px-2.5 flex">
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
              @click="isOpenMobile = false"
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
              @click="isOpenMobile = false"
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
              :collapsed="slug !== workspaceItem.slug"
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
                @click="isOpenMobile = false"
              >
                <LayoutSidebarMenuGroupItem
                  v-if="workspaceMenuItem.permission?.includes(workspaceItem.role as WorkspaceRoles)"
                  :label="workspaceMenuItem.title"
                  :active="route.name === workspaceMenuItem.name"
                  :tooltip-text="
                    needsSsoSession(workspaceItem, workspaceMenuItem.name)
                      ? 'Log in with your SSO provider to access this page'
                      : workspaceMenuItem.tooltipText
                  "
                  :disabled="
                    !isAdmin &&
                    (workspaceMenuItem.disabled ||
                      needsSsoSession(workspaceItem, workspaceMenuItem.name))
                  "
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
import { workspacesRoute, homeRoute, settingsRoutes } from '~/lib/common/helpers/route'
import {
  WorkspacePlanStatuses,
  type SettingsMenu_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import { useBreakpoints } from '@vueuse/core'

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
const breakpoints = useBreakpoints(TailwindBreakpoints)
const isMobile = breakpoints.smaller('lg')

const isOpenMobile = ref(false)

const slug = computed(() => route.params.slug as string)
const workspaceItems = computed(
  () =>
    workspaceResult.value?.activeUser?.workspaces.items.filter(
      (item) => item.creationState?.completed !== false // Removed workspaces that are not completely created
    ) ?? []
)
const isAdmin = computed(() => user.value?.role === Roles.Server.Admin)
const isGuest = computed(() => user.value?.role === Roles.Server.Guest)

const needsSsoSession = (
  workspace: SettingsMenu_WorkspaceFragment,
  routeName?: string
) => {
  return workspace.sso?.provider?.id &&
    routeName !== settingsRoutes.workspace.general.name
    ? !workspace.sso?.session?.validUntil
    : false
}
</script>
