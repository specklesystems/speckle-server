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
        class="w-full md:w-56 lg:w-60 md:p-4 md:pt-6 md:bg-foundation md:border-r md:border-outline-3"
      >
        <LayoutSidebarMenu>
          <LayoutSidebarMenuGroup title="Account settings">
            <template #title-icon>
              <UserIcon class="h-5 w-5" />
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
              <ServerStackIcon class="h-5 w-5" />
            </template>
            <LayoutSidebarMenuGroupItem
              v-for="(sidebarMenuItem, key) in serverMenuItems"
              :key="key"
              :label="sidebarMenuItem.title"
              :active="targetMenuItem === key"
              @click="targetMenuItem = `${key}`"
            />
          </LayoutSidebarMenuGroup>
          <LayoutSidebarMenuGroup
            v-if="isWorkspacesEnabled && hasWorkspaceItems"
            title="Workspace settings"
          >
            <template #title-icon>
              <ServerStackIcon class="h-5 w-5" />
            </template>
            <LayoutSidebarMenuGroup
              v-for="(workspaceItem, key) in workspaceItems"
              :key="key"
              :title="workspaceItem.name"
              collapsible
            >
              <LayoutSidebarMenuGroupItem
                v-for="(workspaceMenuItem, itemKey) in workspaceMenuItems"
                :key="`${key}-${itemKey}`"
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
                :tag="workspaceMenuItem.disabled ? 'Coming soon' : undefined"
                @click="onWorkspaceMenuItemClick(workspaceItem.id, `${itemKey}`)"
              />
            </LayoutSidebarMenuGroup>
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
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { SettingsMenuItem } from '~/lib/settings/helpers/types'
import { useIsWorkspacesEnabled } from '~/composables/globals'
import { useQuery } from '@vue/apollo-composable'
import { settingsSidebarQuery } from '~/lib/settings/graphql/queries'
import { useBreakpoints } from '@vueuse/core'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import { UserIcon, ServerStackIcon } from '@heroicons/vue/24/outline'
import { useActiveUser } from '~/lib/auth/composables/activeUser'
import { useSettingsMenu } from '~/lib/settings/composables/menu'
import {
  LayoutSidebar,
  LayoutSidebarMenu,
  LayoutSidebarMenuGroup
} from '@speckle/ui-components'
import { Roles } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment SettingsDialog_User on User {
    workspaces {
      items {
        id
        name
        logo
      }
    }
  }
`)

const isOpen = defineModel<boolean>('open', { required: true })
const targetMenuItem = defineModel<string | null>('targetMenuItem', { required: true })

const { activeUser: user } = useActiveUser()
const { userMenuItems, serverMenuItems, workspaceMenuItems } = useSettingsMenu()
const breakpoints = useBreakpoints(TailwindBreakpoints)

const isWorkspacesEnabled = useIsWorkspacesEnabled()
const { result: workspaceResult } = useQuery(settingsSidebarQuery, null, {
  enabled: isWorkspacesEnabled.value
})

const isMobile = breakpoints.smaller('md')
const targetWorkspaceId = ref<string | null>(null)

const workspaceItems = computed(
  () => workspaceResult.value?.activeUser?.workspaces.items ?? []
)
const hasWorkspaceItems = computed(() => workspaceItems.value.length > 0)
const isAdmin = computed(() => user.value?.role === Roles.Server.Admin)
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
}

const workspaceMenuItemClasses = (
  itemKey: string | number,
  workspaceId: string,
  disabled?: boolean
) => {
  if (
    targetMenuItem.value === itemKey &&
    targetWorkspaceId.value === workspaceId &&
    !disabled
  ) {
    return true
  }
  return false
}

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
