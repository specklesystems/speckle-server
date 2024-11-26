<template>
  <LayoutDialog
    v-model:open="isOpen"
    v-bind="
      isMobile ? { title: selectedMenuItem ? selectedMenuItem.title : 'Settings' } : {}
    "
    fullscreen="all"
    :show-back-button="isMobile && !!selectedMenuItem"
    @back="targetMenuItem = null"
  >
    <div class="w-full h-full flex">
      <LayoutSidebar
        v-if="!isMobile || !selectedMenuItem"
        class="w-full md:w-56 lg:w-60 md:pb-4 md:px-2 md:pt-6 md:bg-foundation md:border-r md:border-outline-3"
      >
        <LayoutSidebarMenu>
          <LayoutSidebarMenuGroup title="User settings">
            <template #title-icon>
              <IconAccount class="size-4" />
            </template>
            <LayoutSidebarMenuGroupItem
              v-for="(sidebarMenuItem, key) in userMenuItems"
              :key="key"
              :label="sidebarMenuItem.title"
              :active="targetMenuItem === key"
              @click="targetMenuItem = `${key}`"
            />
          </LayoutSidebarMenuGroup>
          <LayoutSidebarMenuGroup v-if="isAdmin" title="Server settings">
            <template #title-icon>
              <IconServer class="size-4" />
            </template>
            <LayoutSidebarMenuGroupItem
              v-for="(sidebarMenuItem, key) in serverMenuItems"
              :key="key"
              :label="sidebarMenuItem.title"
              :active="targetMenuItem === key"
              @click="targetMenuItem = `${key}`"
            />
          </LayoutSidebarMenuGroup>
          <LayoutSidebarMenuGroup v-if="isWorkspacesEnabled" title="Workspace settings">
            <template #title-icon>
              <IconWorkspaces class="size-4 text-foreground-2" />
            </template>
            <LayoutSidebarMenuGroup
              v-for="(workspaceItem, key) in workspaceItems"
              :key="key"
              :title="workspaceItem.name"
              collapsible
              class="workspace-item"
              :tag="
                workspaceItem.plan?.status === WorkspacePlanStatuses.Trial ||
                !workspaceItem.plan?.status
                  ? 'Trial'
                  : undefined
              "
              :collapsed="targetWorkspaceId !== workspaceItem.id"
            >
              <template #title-icon>
                <WorkspaceAvatar
                  :logo="workspaceItem.logo"
                  :default-logo-index="workspaceItem.defaultLogoIndex"
                  size="sm"
                />
              </template>
              <template
                v-for="(workspaceMenuItem, itemKey) in workspaceMenuItems"
                :key="`${key}-${itemKey}`"
              >
                <LayoutSidebarMenuGroupItem
                  v-if="workspaceMenuItem.permission?.includes(workspaceItem.role as WorkspaceRoles)"
                  :label="workspaceMenuItem.title"
                  :active="
                    workspaceMenuItemClasses(
                      itemKey,
                      workspaceItem.id,
                      workspaceMenuItem.disabled
                    )
                  "
                  :tooltip-text="workspaceMenuItem.tooltipText"
                  :disabled="workspaceMenuItem.disabled"
                  extra-padding
                  @click="
                    () =>
                      workspaceMenuItem.disabled
                        ? noop
                        : onWorkspaceMenuItemClick(workspaceItem.id, `${itemKey}`)
                  "
                />
              </template>
            </LayoutSidebarMenuGroup>
            <NuxtLink
              v-if="canCreateWorkspace"
              :to="workspacesRoute"
              @click="isOpen = false"
            >
              <LayoutSidebarMenuGroupItem label="Create workspace">
                <template #icon>
                  <PlusIcon class="h-4 w-4 text-foreground-2" />
                </template>
              </LayoutSidebarMenuGroupItem>
            </NuxtLink>
          </LayoutSidebarMenuGroup>
        </LayoutSidebarMenu>
      </LayoutSidebar>
      <component
        :is="selectedMenuItem.component"
        v-if="selectedMenuItem"
        :class="[
          'md:bg-foundation md:px-10 md:py-12 md:bg-foundation-page w-full',
          !isMobile && 'simple-scrollbar overflow-y-auto flex-1'
        ]"
        :user="user"
        :workspace-id="targetWorkspaceId"
        @close="isOpen = false"
      />
    </div>

    <WorkspaceCreateDialog
      v-model:open="showWorkspaceCreateDialog"
      event-source="settings"
    />
  </LayoutDialog>
</template>

<script setup lang="ts">
import { Roles } from '@speckle/shared'
import type { SettingsMenuItem } from '~/lib/settings/helpers/types'
import { useIsWorkspacesEnabled } from '~/composables/globals'
import { useQuery } from '@vue/apollo-composable'
import { settingsSidebarQuery } from '~/lib/settings/graphql/queries'
import { useBreakpoints } from '@vueuse/core'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import { PlusIcon } from '@heroicons/vue/24/outline'
import { useActiveUser } from '~/lib/auth/composables/activeUser'
import { useSettingsMenu, useSetupMenuState } from '~/lib/settings/composables/menu'
import {
  LayoutSidebar,
  LayoutSidebarMenu,
  LayoutSidebarMenuGroup
} from '@speckle/ui-components'
import { graphql } from '~~/lib/common/generated/gql'
import type { WorkspaceRoles } from '@speckle/shared'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { workspacesRoute } from '~/lib/common/helpers/route'
import { WorkspacePlanStatuses } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment SettingsDialog_Workspace on Workspace {
    ...WorkspaceAvatar_Workspace
    id
    slug
    role
    name
    plan {
      status
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

const isOpen = defineModel<boolean>('open', { required: true })
const targetMenuItem = defineModel<string | null>('targetMenuItem', { required: true })
const targetWorkspaceId = defineModel<string | null>('targetWorkspaceId')

const { activeUser: user } = useActiveUser()
const { userMenuItems, serverMenuItems, workspaceMenuItems } = useSettingsMenu()
const breakpoints = useBreakpoints(TailwindBreakpoints)
const mixpanel = useMixpanel()
const isWorkspacesEnabled = useIsWorkspacesEnabled()
const { result: workspaceResult } = useQuery(settingsSidebarQuery, null, {
  enabled: isWorkspacesEnabled.value
})

const isMobile = breakpoints.smaller('md')
const showWorkspaceCreateDialog = ref(false)

const workspaceItems = computed(
  () => workspaceResult.value?.activeUser?.workspaces.items ?? []
)
const isAdmin = computed(() => user.value?.role === Roles.Server.Admin)
const canCreateWorkspace = computed(
  () =>
    user.value?.role === Roles.Server.Admin || user.value?.role === Roles.Server.User
)

const selectedMenuItem = computed((): SettingsMenuItem | null => {
  const categories = [
    userMenuItems.value,
    serverMenuItems.value,
    workspaceMenuItems.value
  ]
  for (const category of categories) {
    if (targetMenuItem.value && targetMenuItem.value in category) {
      return category[targetMenuItem.value]
    }
  }

  return null
})

const onWorkspaceMenuItemClick = (id: string, target: string) => {
  targetWorkspaceId.value = id
  targetMenuItem.value = target
  mixpanel.track('Workspace Settings Menuitem Clicked', {
    // eslint-disable-next-line camelcase
    workspace_id: id,
    item: target
  })
}

const workspaceMenuItemClasses = (
  itemKey: string | number,
  workspaceId: string,
  disabled?: boolean
) =>
  targetMenuItem.value === itemKey &&
  targetWorkspaceId.value === workspaceId &&
  !disabled

// not ideal, but it works temporarily while this is still a modal
useSetupMenuState({
  goToWorkspaceMenuItem: onWorkspaceMenuItemClick
})

watch(
  () => user.value,
  (newVal) => {
    if (!newVal) {
      isOpen.value = false
    }
  },
  { immediate: true }
)
</script>
<style>
.workspace-item h6 {
  @apply !font-normal text-body-xs !text-foreground;
}
</style>
