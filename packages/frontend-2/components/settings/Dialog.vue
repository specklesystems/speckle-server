<template>
  <LayoutDialog v-model:open="isOpen" fullscreen>
    <div class="w-full h-full flex">
      <LayoutSidebar
        v-if="!isMobile || !selectedMenuItem"
        class="w-full md:w-56 lg:w-60 p-4 pt-6 bg-foundation-page md:border-r md:border-outline-3"
      >
        <LayoutSidebarMenu>
          <LayoutSidebarMenuGroup title="Account Settings">
            <template #title-icon>
              <UserIcon />
            </template>
            <LayoutSidebarMenuGroupItem
              v-for="(sidebarMenuItem, index) in sidebarConfig.user"
              :key="`sidebarUserItem-${index}`"
              :label="sidebarMenuItem.title"
              @click="setSelectedMenuItem(sidebarMenuItem.path)"
            />
          </LayoutSidebarMenuGroup>
          <LayoutSidebarMenuGroup title="Server Settings">
            <template #title-icon>
              <ServerStackIcon />
            </template>
            <LayoutSidebarMenuGroupItem
              v-for="(sidebarMenuItem, index) in sidebarConfig.server"
              :key="`sidebarServerItem-${index}`"
              :label="sidebarMenuItem.title"
              @click="setSelectedMenuItem(sidebarMenuItem.path)"
            />
          </LayoutSidebarMenuGroup>
        </LayoutSidebarMenu>
      </LayoutSidebar>
      <main
        v-if="selectedMenuItem"
        class="simple-scrollbar overflow-y-scroll flex-1 bg-foundation px-6 py-8 md:px-4 md:py-12"
      >
        <div class="flex md:hidden items-center">
          <ChevronLeftIcon class="w-6 h-6" @click="setSelectedMenuItem(null)" />
          <h1 class="h4 font-semibold ml-4">{{ selectedMenuItem.title }}</h1>
        </div>
        <component :is="selectedMenuItem.component" />
      </main>
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

type MenuItem = {
  title: string
  component: ReturnType<typeof defineComponent>
  path: string
}

type SidebarConfig = {
  [key: string]: {
    [key: string]: MenuItem
  }
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

const selectedMenuItem = computed(() => {
  const path = router.currentRoute.value.path
  for (const group in sidebarConfig) {
    const menuItems = sidebarConfig[group]

    for (const key in menuItems) {
      const item = menuItems[key]

      if (new RegExp(`${item.path}?$`, 'i').test(path)) {
        return item
      }
    }
  }
  return null
})

const sidebarConfig: SidebarConfig = {
  user: {
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
    }
  },
  server: {
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
}

function setSelectedMenuItem(path: string | null): void {
  router.push({ path: path ?? '/settings' })
  // history.pushState({}, '', path ?? '/settings')
}
</script>
