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
              v-for="(sidebarMenuItem, key) in menuItemConfig.user"
              :key="key"
              :label="sidebarMenuItem.title"
              :class="{
                'bg-highlight-2 hover:!bg-highlight-2': targetMenuItem === key
              }"
              @click="targetMenuItem = `${key}`"
            />
          </LayoutSidebarMenuGroup>
          <LayoutSidebarMenuGroup v-if="isAdmin" title="Server settings">
            <template #title-icon>
              <ServerStackIcon class="h-5 w-5" />
            </template>
            <LayoutSidebarMenuGroupItem
              v-for="(sidebarMenuItem, key) in menuItemConfig.server"
              :key="key"
              :label="sidebarMenuItem.title"
              :class="{
                'bg-highlight-2 hover:!bg-highlight-2': targetMenuItem === key
              }"
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
                v-for="(workspaceMenuItem, itemKey) in menuItemConfig.workspace"
                :key="`${key}-${itemKey}`"
                :label="workspaceMenuItem.title"
                :class="{
                  'bg-highlight-2 hover:!bg-highlight-2':
                    targetMenuItem === itemKey && targetWorkspaceId === workspaceItem.id
                }"
                @click="onWorkspaceMenuItemClick(workspaceItem.id, `${itemKey}`)"
              />
              <LayoutSidebarMenuGroupItem
                label="Billing"
                tag="Coming soon"
                tooltip-text="Manage billing for your workspace"
                disabled
              />
              <LayoutSidebarMenuGroupItem
                label="Security"
                tag="Coming soon"
                tooltip-text="SSO, manage permissions, restrict domain access"
                disabled
              />
              <LayoutSidebarMenuGroupItem
                label="Regions"
                tag="Coming soon"
                tooltip-text="Set up regions for custom data residency"
                disabled
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
      />
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { defineComponent } from 'vue'
import SettingsUserProfile from '~/components/settings/user/Profile.vue'
import SettingsUserNotifications from '~/components/settings/user/Notifications.vue'
import SettingsUserDeveloper from '~/components/settings/user/Developer.vue'
import SettingsUserEmails from '~/components/settings/user/Emails.vue'
import SettingsServerGeneral from '~/components/settings/server/General.vue'
import SettingsServerProjects from '~/components/settings/server/Projects.vue'
import SettingsServerActiveUsers from '~/components/settings/server/ActiveUsers.vue'
import SettingsServerPendingInvitations from '~/components/settings/server/PendingInvitations.vue'
import SettingsWorkspacesMembers from '~/components/settings/workspaces/Members.vue'
import { useBreakpoints } from '@vueuse/core'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import { UserIcon, ServerStackIcon } from '@heroicons/vue/24/outline'
import { settingsQueries } from '~/lib/common/helpers/route'
import { useActiveUser } from '~/lib/auth/composables/activeUser'
import {
  LayoutSidebar,
  LayoutSidebarMenu,
  LayoutSidebarMenuGroup
} from '@speckle/ui-components'
import { Roles } from '@speckle/shared'
import { useQuery } from '@vue/apollo-composable'
import { settingsSidebarWorkspacesQuery } from '~/lib/settings/graphql/queries'
import { useIsMultipleEmailsEnabled } from '~/composables/globals'

type MenuItem = {
  title: string
  component: ReturnType<typeof defineComponent>
}

const { activeUser: user } = useActiveUser()
const breakpoints = useBreakpoints(TailwindBreakpoints)
const isWorkspacesEnabled = useIsWorkspacesEnabled()
const isMultipleEmailsEnabled = useIsMultipleEmailsEnabled()
const { result: workspaceResult } = useQuery(settingsSidebarWorkspacesQuery, null, {
  enabled: isWorkspacesEnabled.value
})

const isMobile = breakpoints.smaller('md')
const targetWorkspaceId = ref<string | null>(null)

const menuItemConfig = shallowRef<{ [key: string]: { [key: string]: MenuItem } }>({
  user: {
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
  },
  server: {
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
  },
  workspace: {
    members: {
      title: 'Members',
      component: SettingsWorkspacesMembers
    }
  }
})

const isOpen = defineModel<boolean>('open', { required: true })
const targetMenuItem = defineModel<string | null>('targetMenuItem', { required: true })

const workspaceItems = computed(() =>
  workspaceResult.value?.activeUser
    ? workspaceResult.value.activeUser.workspaces.items
    : []
)
const hasWorkspaceItems = computed(() => workspaceItems.value.length > 0)
const isAdmin = computed(() => user.value?.role === Roles.Server.Admin)
const selectedMenuItem = computed((): MenuItem | null => {
  const categories = [
    menuItemConfig.value.user,
    menuItemConfig.value.server,
    menuItemConfig.value.workspace
  ]
  for (const category of categories) {
    if (targetMenuItem.value && targetMenuItem.value in category) {
      return category[targetMenuItem.value]
    }
  }

  if (!isMobile.value && targetMenuItem.value) {
    // Fallback for invalid queries/typos
    return targetMenuItem.value.includes('server') && isAdmin.value
      ? menuItemConfig.value.server.general
      : menuItemConfig.value.user.profile
  }

  return null
})

// Keep track of the selected workspace ID, to open the page for the correct workspace
const onWorkspaceMenuItemClick = (id: string, target: string) => {
  targetWorkspaceId.value = id
  targetMenuItem.value = target
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

watchEffect(() => {
  if (isMultipleEmailsEnabled.value) {
    menuItemConfig.value.user[settingsQueries.user.emails] = {
      title: 'Email addresses',
      component: SettingsUserEmails
    }
  }
})
</script>
