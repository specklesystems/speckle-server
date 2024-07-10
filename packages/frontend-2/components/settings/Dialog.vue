<template>
  <LayoutDialog
    v-model:open="isOpen"
    :title="isMobile ? (selectedMenuItem ? selectedMenuItem?.title : 'Settings') : null"
    fullscreen
    :show-back-button="!!(isMobile && selectedMenuItem)"
    @back="setSelectedMenuItem(null)"
  >
    <div class="w-full h-full flex">
      <LayoutSidebar
        v-if="!isMobile || !selectedMenuItem"
        class="w-full md:w-56 lg:w-60 md:p-4 md:pt-6 md:bg-foundation-page md:border-r md:border-outline-3"
      >
        <div class="flex-1">
          <LayoutSidebarMenu>
            <LayoutSidebarMenuGroup title="Account Settings">
              <template #title-icon>
                <UserIcon />
              </template>
              <LayoutSidebarMenuGroupItem
                v-for="(sidebarMenuItem, index) in sidebarConfig.user"
                :key="`sidebarUserItem-${index}`"
                :label="sidebarMenuItem.title"
                :class="{
                  'bg-foundation-focus hover:!bg-foundation-focus':
                    selectedMenuItem?.path === sidebarMenuItem.path
                }"
                @click="setSelectedMenuItem(sidebarMenuItem)"
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
                :class="{
                  'bg-foundation-focus hover:!bg-foundation-focus':
                    selectedMenuItem?.path === sidebarMenuItem.path
                }"
                @click="setSelectedMenuItem(sidebarMenuItem)"
              />
            </LayoutSidebarMenuGroup>
          </LayoutSidebarMenu>
        </div>
      </LayoutSidebar>
      <main
        v-if="selectedMenuItem"
        :class="[
          'bg-foundation md:p-6 md:px-10 md:py-12 w-full md:bg-foundation',
          !isMobile && 'simple-scrollbar overflow-y-auto flex-1'
        ]"
      >
        <div class="pb-6">
          <component :is="selectedMenuItem?.component" />
        </div>
      </main>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { defineComponent } from 'vue'
import SettingsUserProfile from './user/Profile.vue'
import SettingsUserNotifications from './user/Notifications.vue'
import SettingsUserDeveloper from './user/Developer.vue'
import SettingsServerGeneral from './server/General.vue'
import SettingsServerProjects from './server/Projects.vue'
import SettingsServerActiveUsers from './server/ActiveUsers.vue'
import SettingsServerPendingInvitations from './server/PendingInvitations.vue'
import { useBreakpoints } from '@vueuse/core'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import { UserIcon, ServerStackIcon } from '@heroicons/vue/24/outline'
import { settingsRoutes, homeRoute } from '~/lib/common/helpers/route'
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

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const props = defineProps<{
  open: boolean
  route?: string
  originalRoute?: string
}>()

const router = useRouter()
const breakpoints = useBreakpoints(TailwindBreakpoints)
const isMobile = breakpoints.smallerOrEqual('md')
const selectedMenuItem: MenuItem | null = shallowRef(null)
const sidebarConfig: {
  [key: string]: {
    [key: string]: MenuItem
  }
} = {
  user: {
    profile: {
      title: 'Profile',
      component: SettingsUserProfile,
      path: settingsRoutes.user.profile
    },
    notifications: {
      title: 'Notifications',
      component: SettingsUserNotifications,
      path: settingsRoutes.user.notifications
    },
    developerSettings: {
      title: 'Developer Settings',
      component: SettingsUserDeveloper,
      path: settingsRoutes.user.developerSettings
    }
  },
  server: {
    general: {
      title: 'General',
      component: SettingsServerGeneral,
      path: settingsRoutes.server.general
    },
    projects: {
      title: 'Projects',
      component: SettingsServerProjects,
      path: settingsRoutes.server.projects
    },
    activeUsers: {
      title: 'Active Users',
      component: SettingsServerActiveUsers,
      path: settingsRoutes.server.activeUsers
    },
    pendingInvitations: {
      title: 'Pending Invitations',
      component: SettingsServerPendingInvitations,
      path: settingsRoutes.server.pendingInvitations
    }
  }
}

const isOpen = computed({
  get: () => props.open,
  set: (newVal: boolean) => emit('update:open', newVal)
})

watch(
  isOpen,
  (newVal, oldVal) => {
    if (newVal && !oldVal) {
      if (isMobile.value) {
        history.pushState({}, '', '/settings')
      } else {
        // If not on mobile find the component matching the route
        for (const group in sidebarConfig) {
          for (const key in sidebarConfig[group]) {
            const item = sidebarConfig[group][key]
            if (item.path === props.route) {
              setSelectedMenuItem(item)
            }
          }
        }
      }
    } else if (!newVal && oldVal) {
      // When closing the modal revert back to the original route
      selectedMenuItem.value = null
      router.replace({ path: props.originalRoute ?? homeRoute, force: true })
    }
  },
  { immediate: true }
)

function setSelectedMenuItem(item: MenuItem | null): void {
  selectedMenuItem.value = item
  if (typeof window !== 'undefined') {
    history.pushState({}, '', item ? item.path : settingsRoutes.default.settings)
  }
}
</script>
