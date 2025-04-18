<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="group">
    <Portal to="mobile-navigation">
      <div class="lg:hidden flex items-center justify-between">
        <FormButton
          :color="isOpenMobile ? 'outline' : 'subtle'"
          size="sm"
          @click="isOpenMobile = !isOpenMobile"
        >
          <IconSidebar v-if="!isOpenMobile" class="h-4 w-4 -ml-1 -mr-1" />
          <IconSidebarClose v-else class="h-4 w-4 -ml-1 -mr-1" />
        </FormButton>

        <NuxtLink :to="exitSettingsRoute" class="flex items-center gap-x-1 pl-0.5">
          <ChevronLeftIcon class="h-4 w-4 text-foreground-2" />
          <p class="text-body-xs font-medium text-foreground">Settings</p>
        </NuxtLink>
      </div>
    </Portal>
    <div :class="wrapperClasses">
      <LayoutSidebar
        class="border-r border-outline-3 px-2 pt-3 pb-2 bg-foundation-page"
      >
        <LayoutSidebarMenu>
          <LayoutSidebarMenuGroup v-if="!isMobile">
            <NuxtLink
              :to="exitSettingsRoute"
              class="items-center gap-x-1.5 px-2.5 flex"
            >
              <ChevronLeftIcon class="h-3 w-3 text-foreground-2" />
              <p class="text-body-xs font-medium text-foreground">Exit settings</p>
            </NuxtLink>
          </LayoutSidebarMenuGroup>
          <LayoutSidebarMenuGroup title="User settings">
            <template #title-icon>
              <IconAccount class="size-4" />
            </template>
            <NuxtLink
              v-for="sidebarMenuItem in userMenuItems"
              :key="`user-item-${sidebarMenuItem.route}`"
              :to="sidebarMenuItem.route"
              @click="isOpenMobile = false"
            >
              <LayoutSidebarMenuGroupItem
                :label="sidebarMenuItem.title"
                :active="route.path === sidebarMenuItem.route"
              />
            </NuxtLink>
          </LayoutSidebarMenuGroup>
          <LayoutSidebarMenuGroup v-if="isAdmin" title="Server settings">
            <template #title-icon>
              <IconServer class="size-4" />
            </template>
            <NuxtLink
              v-for="sidebarMenuItem in serverMenuItems"
              :key="`server-item-${sidebarMenuItem.route}`"
              :to="sidebarMenuItem.route"
              @click="isOpenMobile = false"
            >
              <LayoutSidebarMenuGroupItem
                :label="sidebarMenuItem.title"
                :active="route.path === sidebarMenuItem.route"
              />
            </NuxtLink>
          </LayoutSidebarMenuGroup>
          <LayoutSidebarMenuGroup
            v-if="showWorkspaceSettings"
            title="Workspace settings"
          >
            <template #title-icon>
              <IconWorkspaces class="size-4" />
            </template>
            <template v-if="activeWorkspaceItem">
              <NuxtLink
                v-for="workspaceMenuItem in workspaceMenuItems"
                :key="`workspace-menu-item-${workspaceMenuItem.name}-${activeWorkspaceItem}`"
                :to="
                  !isAdmin &&
                  (workspaceMenuItem.disabled ||
                    needsSsoSession(activeWorkspaceItem, workspaceMenuItem.name))
                    ? undefined
                    : workspaceMenuItem.route(activeWorkspaceItem.slug)
                "
                @click="isOpenMobile = false"
              >
                <LayoutSidebarMenuGroupItem
                  v-if="workspaceMenuItem.permission?.includes(activeWorkspaceItem.role as WorkspaceRoles)"
                  :label="workspaceMenuItem.title"
                  :active="
                    route.name?.toString().startsWith(workspaceMenuItem.name) &&
                    route.params.slug === activeWorkspaceItem.slug
                  "
                  :tooltip-text="
                    needsSsoSession(activeWorkspaceItem, workspaceMenuItem.name)
                      ? 'Log in with your SSO provider to access this page'
                      : workspaceMenuItem.tooltipText
                  "
                  :disabled="
                    !isAdmin &&
                    (workspaceMenuItem.disabled ||
                      needsSsoSession(activeWorkspaceItem, workspaceMenuItem.name))
                  "
                  class="!pl-8"
                />
              </NuxtLink>
            </template>
          </LayoutSidebarMenuGroup>
        </LayoutSidebarMenu>
      </LayoutSidebar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIsWorkspacesEnabled } from '~/composables/globals'
import { useQuery } from '@vue/apollo-composable'
import { settingsSidebarQuery } from '~/lib/settings/graphql/queries'
import { ChevronLeftIcon } from '@heroicons/vue/24/outline'
import { useActiveUser } from '~/lib/auth/composables/activeUser'
import { useSettingsMenu, useSettingsMenuState } from '~/lib/settings/composables/menu'
import {
  LayoutSidebar,
  LayoutSidebarMenu,
  LayoutSidebarMenuGroup
} from '@speckle/ui-components'
import { graphql } from '~~/lib/common/generated/gql'
import type { WorkspaceRoles } from '@speckle/shared'
import {
  projectsRoute,
  settingsWorkspaceRoutes,
  workspaceRoute
} from '~/lib/common/helpers/route'
import type { SettingsMenu_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import { useBreakpoints } from '@vueuse/core'
import { useNavigation } from '~~/lib/navigation/composables/navigation'

graphql(`
  fragment SettingsSidebar_Workspace on Workspace {
    ...SettingsMenu_Workspace
    id
    slug
    role
    name
    logo
    plan {
      status
      name
    }
    creationState {
      completed
    }
  }
`)

graphql(`
  fragment SettingsSidebar_User on User {
    id
    workspaces {
      items {
        ...SettingsSidebar_Workspace
      }
    }
  }
`)

const isWorkspacesEnabled = useIsWorkspacesEnabled()
const { activeWorkspaceSlug } = useNavigation()
const settingsMenuState = useSettingsMenuState()
const { isAdmin } = useActiveUser()
const route = useRoute()
const { result: workspaceResult } = useQuery(settingsSidebarQuery, null, {
  enabled: computed(() => isWorkspacesEnabled.value)
})
const { userMenuItems, serverMenuItems, workspaceMenuItems } = useSettingsMenu()
const breakpoints = useBreakpoints(TailwindBreakpoints)
const isMobile = breakpoints.smaller('lg')

const isOpenMobile = ref(false)

const workspaceItems = computed(
  () =>
    workspaceResult.value?.activeUser?.workspaces.items.filter(
      (item) => item.creationState?.completed !== false // Removed workspaces that are not completely created
    ) || []
)
const activeWorkspaceItem = computed(() =>
  workspaceItems.value.find((item) => item.slug === activeWorkspaceSlug.value)
)
const wrapperClasses = computed(() => {
  return [
    'absolute z-40 lg:static h-full flex shrink-0 transition-all',
    `w-[13rem]`,
    isOpenMobile.value ? '' : `-translate-x-[13rem] lg:translate-x-0`
  ]
})

const needsSsoSession = (
  workspace: SettingsMenu_WorkspaceFragment,
  routeName?: string
) => {
  return workspace.sso?.provider?.id &&
    routeName !== settingsWorkspaceRoutes.general.name
    ? !workspace.sso?.session?.validUntil
    : false
}

const exitSettingsRoute = computed(() => {
  if (!settingsMenuState.value.previousRoute) {
    return activeWorkspaceSlug.value
      ? workspaceRoute(activeWorkspaceSlug.value)
      : projectsRoute
  }

  return settingsMenuState.value.previousRoute
})

const showWorkspaceSettings = computed(() => {
  if (!isWorkspacesEnabled.value) return false
  return !!activeWorkspaceSlug.value
})
</script>
