<template>
  <LayoutDialog v-model:open="isOpen" fullscreen>
    <div class="w-full h-full flex">
      <ClientOnly>
        <div
          v-if="!isMobile || !selectedItem"
          class="w-full md:w-56 lg:w-60 p-4 pt-6 bg-gray-100 md:border-r md:border-gray-200"
        >
          <LayoutSidebar>
            <LayoutSidebarMenu>
              <LayoutSidebarMenuGroup title="Account Settings">
                <template #title-icon>
                  <UserIcon />
                </template>
                <LayoutSidebarMenuGroupItem
                  :label="itemConfig.profile.title"
                  @click="setSelectedItem(itemConfig.profile.path)"
                />
                <LayoutSidebarMenuGroupItem
                  :label="itemConfig.notifications.title"
                  @click="setSelectedItem(itemConfig.notifications.path)"
                />
                <LayoutSidebarMenuGroupItem
                  :label="itemConfig.developerSettings.title"
                  @click="setSelectedItem(itemConfig.developerSettings.path)"
                />
              </LayoutSidebarMenuGroup>
              <LayoutSidebarMenuGroup title="Server Settings">
                <template #title-icon>
                  <ServerStackIcon />
                </template>
                <LayoutSidebarMenuGroupItem
                  :label="itemConfig.general.title"
                  @click="setSelectedItem(itemConfig.general.path)"
                />
                <LayoutSidebarMenuGroupItem
                  :label="itemConfig.projects.title"
                  @click="setSelectedItem(itemConfig.projects.path)"
                />
                <LayoutSidebarMenuGroupItem
                  :label="itemConfig.activeUsers.title"
                  @click="setSelectedItem(itemConfig.activeUsers.path)"
                />
                <LayoutSidebarMenuGroupItem
                  :label="itemConfig.pendingInvitations.title"
                  @click="setSelectedItem(itemConfig.pendingInvitations.path)"
                />
              </LayoutSidebarMenuGroup>
            </LayoutSidebarMenu>
          </LayoutSidebar>
        </div>
      </ClientOnly>
      <section
        v-if="selectedItem"
        class="overflow-scroll flex-1 bg-gray-50 p-6 py-8 md:p-4 md:py-12"
      >
        <div class="flex md:hidden items-center">
          <ChevronLeftIcon class="w-6 h-6" @click="setSelectedItem(null)" />
          <h2 class="h4 font-semibold ml-4">{{ selectedItem.title }}</h2>
        </div>
        <component :is="selectedItem?.component" />
      </section>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { defineComponent } from 'vue'
import { ChevronLeftIcon } from '@heroicons/vue/24/solid'
import SettingsUserProfile from './user/Profile.vue'
import SettingsUserNotifications from './user/Notifications.vue'
import SettingsUserDeveloper from './user/Developer.vue'
import SettingsServerGeneral from './server/General.vue'
import SettingsServerProjects from './server/Projects.vue'
import SettingsServerActiveUsers from './server/ActiveUsers.vue'
import SettingsServerInvites from './server/Invites.vue'
import { useBreakpoints } from '@vueuse/core'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import { UserIcon, ServerStackIcon } from '@heroicons/vue/24/outline'
import {
  LayoutSidebar,
  LayoutSidebarMenu,
  LayoutSidebarMenuGroup
} from '@speckle/ui-components'

type SelectableItem = {
  title: string
  component: ReturnType<typeof defineComponent>
  path: string
}

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const props = defineProps<{
  open: boolean
}>()

const breakpoints = useBreakpoints(TailwindBreakpoints)
const isMobile = breakpoints.smallerOrEqual('sm')
const router = useRouter()

const isOpen = computed({
  get: () => props.open,
  set: (newVal: boolean) => emit('update:open', newVal)
})

const selectedItem = computed(() => {
  const path = router.currentRoute.value.path
  for (const key in itemConfig) {
    if (new RegExp(`${itemConfig[key].path}?$`, 'i').test(path)) {
      return itemConfig[key]
    }
  }
  return null
})

const itemConfig: { [key: string]: SelectableItem } = {
  profile: {
    title: 'Profile',
    component: SettingsUserProfile,
    path: '/settings/user/profile'
  },
  notifications: {
    title: 'Notifications',
    component: SettingsUserNotifications,
    path: '/settings/user/notifications'
  },
  developerSettings: {
    title: 'Developer Settings',
    component: SettingsUserDeveloper,
    path: '/settings/user/developer-settings'
  },
  general: {
    title: 'General',
    component: SettingsServerGeneral,
    path: '/settings/server/general'
  },
  projects: {
    title: 'Projects',
    component: SettingsServerProjects,
    path: '/settings/server/projects'
  },
  activeUsers: {
    title: 'Active Users',
    component: SettingsServerActiveUsers,
    path: '/settings/server/active-users'
  },
  pendingInvitations: {
    title: 'Pending Invitations',
    component: SettingsServerInvites,
    path: '/settings/server/pending-invitations'
  }
}

function setSelectedItem(path: string | null): void {
  router.push({ path: path ?? '/settings' })
}
</script>
